import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Chapter } from '../entities/chapter.entity';
import { Book } from '../entities/book.entity';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';
import { ChapterContentStatus } from '../../common/enums/chapter-content-status.enum';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateChapterDto,
  UpdateChapterDto,
  QueryChapterDto,
  PaginatedChapterResponseDto,
  ChapterPdfUploadInitDto,
  ChapterPdfUploadInitResponseDto,
  ChapterPdfUploadCompleteDto,
} from '../dto';

@Injectable()
export class ChaptersService {
  constructor(
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
  ) {}

  private isAdminUser(user?: JwtUser): boolean {
    if (!user || !user.roles) return false;
    return user.roles.some(
      (role) =>
        role === (RoleType.ADMIN as string) ||
        role === (RoleType.SUPER_ADMIN as string),
    );
  }

  private validatePricingModel(
    pricingModel: ChapterPricingModel,
    coinCost?: number,
    bookDefaultCoinCost = 0,
  ): { coinCost: number } {
    if (pricingModel === ChapterPricingModel.PAID) {
      const effectiveCost =
        coinCost !== undefined && coinCost > 0 ? coinCost : bookDefaultCoinCost;

      if (effectiveCost <= 0) {
        throw new BadRequestException(
          'coinCost is required and must be greater than 0 when pricingModel is PAID',
        );
      }
      return { coinCost: effectiveCost };
    }

    // Default: FREE -> coinCost is 0
    return { coinCost: 0 };
  }

  private async updateBookChapterCount(bookId: string): Promise<void> {
    try {
      const count = await this.chapterRepository.count({
        where: { bookId },
      });
      await this.bookRepository.update(bookId, { totalChapters: count });
    } catch {
      // Non-blocking sync error catch
    }
  }

  /**
   * POST /chapters (ADMIN)
   * Create a new chapter for a book
   */
  async create(dto: CreateChapterDto): Promise<Chapter> {
    // 1. Verify parent Book exists
    const book = await this.bookRepository.findOne({
      where: { id: dto.bookId },
    });

    if (!book) {
      throw new NotFoundException(`Book with ID "${dto.bookId}" not found`);
    }

    // 2. Verify chapterNumber uniqueness within the book
    const existingChapter = await this.chapterRepository.findOne({
      where: { bookId: dto.bookId, chapterNumber: dto.chapterNumber },
    });

    if (existingChapter) {
      throw new ConflictException(
        `Chapter ${dto.chapterNumber} already exists for book "${book.title}"`,
      );
    }

    // 3. Validate pricing model constraints with Book default chapter price support
    const pricingModel = dto.pricingModel ?? ChapterPricingModel.FREE;
    const { coinCost } = this.validatePricingModel(
      pricingModel,
      dto.coinCost,
      book.defaultChapterCoinCost,
    );

    // 4. Determine sortOrder (default: chapterNumber * 10)
    const sortOrder =
      dto.sortOrder !== undefined
        ? dto.sortOrder
        : Math.round(dto.chapterNumber * 10);

    // 5. Handle publication timestamp
    const published = dto.published ?? false;
    let publishedAt: Date | undefined;
    if (dto.publishedAt) {
      publishedAt = new Date(dto.publishedAt);
    } else if (published) {
      publishedAt = new Date();
    }

    // 6. Resolve content status
    const contentStatus =
      dto.contentStatus ??
      (dto.pdfStorageKey
        ? ChapterContentStatus.READY
        : ChapterContentStatus.PENDING);

    const chapter = this.chapterRepository.create({
      bookId: dto.bookId,
      chapterNumber: dto.chapterNumber,
      title: dto.title?.trim(),
      sortOrder,
      pricingModel,
      coinCost,
      pdfStorageKey: dto.pdfStorageKey,
      pdfFileName: dto.pdfFileName?.trim(),
      pdfFileSize: dto.pdfFileSize,
      pdfPageCount: dto.pdfPageCount,
      pdfChecksum: dto.pdfChecksum,
      contentStatus,
      published,
      publishedAt,
    });

    try {
      const savedChapter = await this.chapterRepository.save(chapter);
      await this.updateBookChapterCount(dto.bookId);
      return savedChapter;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new ConflictException(
          `Chapter ${dto.chapterNumber} already exists for book "${book.title}"`,
        );
      }
      throw error;
    }
  }

  /**
   * GET /chapters (Public / Authenticated with visibility scoping)
   */
  async findAll(
    query: QueryChapterDto,
    user?: JwtUser,
  ): Promise<PaginatedChapterResponseDto> {
    const isAdmin = this.isAdminUser(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Non-admin users cannot query unpublished chapters
    if (!isAdmin && query.published === false) {
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNextPage: false,
          hasPrevPage: false,
        },
      };
    }

    const qb = this.chapterRepository.createQueryBuilder('chapter');

    // Visibility scoping
    if (isAdmin) {
      if (query.published !== undefined) {
        qb.andWhere('chapter.published = :published', {
          published: query.published,
        });
      }
    } else {
      qb.andWhere('chapter.published = :published', {
        published: true,
      });
    }

    // Filter by bookId
    if (query.bookId) {
      qb.andWhere('chapter.bookId = :bookId', {
        bookId: query.bookId,
      });
    }

    // Filter by pricingModel
    if (query.pricingModel) {
      qb.andWhere('chapter.pricingModel = :pricingModel', {
        pricingModel: query.pricingModel,
      });
    }

    // Search by title
    if (query.search) {
      const searchTerm = `%${query.search.trim()}%`;
      qb.andWhere('chapter.title ILIKE :searchTerm', { searchTerm });
    }

    // Sorting
    const sortField =
      query.sortBy === 'chapterNumber'
        ? 'chapter.chapterNumber'
        : query.sortBy === 'title'
          ? 'chapter.title'
          : query.sortBy === 'createdAt'
            ? 'chapter.createdAt'
            : 'chapter.sortOrder';

    qb.orderBy(sortField, query.sortOrder ?? 'ASC');

    // Pagination
    qb.skip((page - 1) * limit).take(limit);

    const [data, total] = await qb.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  }

  /**
   * GET /chapters/:id (Public / Authenticated with visibility scoping)
   */
  async findOne(id: string, user?: JwtUser): Promise<Chapter> {
    const isAdmin = this.isAdminUser(user);

    const qb = this.chapterRepository
      .createQueryBuilder('chapter')
      .leftJoinAndSelect('chapter.book', 'book')
      .where('chapter.id = :id', { id });

    const chapter = await qb.getOne();

    if (!chapter) {
      throw new NotFoundException(`Chapter "${id}" not found`);
    }

    if (!isAdmin && !chapter.published) {
      throw new NotFoundException(`Chapter "${id}" not found`);
    }

    return chapter;
  }

  /**
   * PATCH /chapters/:id (ADMIN)
   */
  async update(id: string, dto: UpdateChapterDto): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter "${id}" not found`);
    }

    // 1. If bookId changed, verify new Book exists
    let book: Book | null = null;
    const targetBookId = dto.bookId ?? chapter.bookId;

    if (dto.bookId && dto.bookId !== chapter.bookId) {
      book = await this.bookRepository.findOne({
        where: { id: dto.bookId },
      });
      if (!book) {
        throw new NotFoundException(`Book with ID "${dto.bookId}" not found`);
      }
    }

    // 2. Check chapterNumber uniqueness if chapterNumber or bookId is being updated
    const targetChapterNumber = dto.chapterNumber ?? chapter.chapterNumber;

    if (
      targetBookId !== chapter.bookId ||
      (dto.chapterNumber !== undefined &&
        dto.chapterNumber !== chapter.chapterNumber)
    ) {
      const existing = await this.chapterRepository.findOne({
        where: {
          bookId: targetBookId,
          chapterNumber: targetChapterNumber,
        },
      });

      if (existing && existing.id !== chapter.id) {
        throw new ConflictException(
          `Chapter ${targetChapterNumber} already exists for target book`,
        );
      }
    }

    // 3. Resolve and validate pricing model
    const effectivePricingModel = dto.pricingModel ?? chapter.pricingModel;
    const effectiveCoinCost =
      dto.coinCost !== undefined ? dto.coinCost : chapter.coinCost;

    if (!book && effectivePricingModel === ChapterPricingModel.PAID) {
      book = await this.bookRepository.findOne({
        where: { id: targetBookId },
      });
    }

    const { coinCost } = this.validatePricingModel(
      effectivePricingModel,
      effectiveCoinCost,
      book?.defaultChapterCoinCost ?? 0,
    );

    const oldBookId = chapter.bookId;

    if (dto.bookId !== undefined) chapter.bookId = dto.bookId;
    if (dto.chapterNumber !== undefined)
      chapter.chapterNumber = dto.chapterNumber;
    if (dto.title !== undefined) chapter.title = dto.title?.trim();
    if (dto.sortOrder !== undefined) chapter.sortOrder = dto.sortOrder;
    chapter.pricingModel = effectivePricingModel;
    chapter.coinCost = coinCost;

    // PDF metadata updates
    if (dto.pdfStorageKey !== undefined)
      chapter.pdfStorageKey = dto.pdfStorageKey;
    if (dto.pdfFileName !== undefined)
      chapter.pdfFileName = dto.pdfFileName?.trim();
    if (dto.pdfFileSize !== undefined) chapter.pdfFileSize = dto.pdfFileSize;
    if (dto.pdfPageCount !== undefined) chapter.pdfPageCount = dto.pdfPageCount;
    if (dto.pdfChecksum !== undefined) chapter.pdfChecksum = dto.pdfChecksum;
    if (dto.contentStatus !== undefined)
      chapter.contentStatus = dto.contentStatus;

    if (dto.published !== undefined) {
      chapter.published = dto.published;
      if (dto.published && !chapter.publishedAt && !dto.publishedAt) {
        chapter.publishedAt = new Date();
      }
    }

    if (dto.publishedAt !== undefined) {
      chapter.publishedAt = dto.publishedAt
        ? new Date(dto.publishedAt)
        : undefined;
    }

    try {
      const updated = await this.chapterRepository.save(chapter);
      if (oldBookId !== chapter.bookId) {
        await this.updateBookChapterCount(oldBookId);
        await this.updateBookChapterCount(chapter.bookId);
      }
      return updated;
    } catch (error: unknown) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        (error as { code: string }).code === '23505'
      ) {
        throw new ConflictException(
          `Chapter ${chapter.chapterNumber} already exists for target book`,
        );
      }
      throw error;
    }
  }

  /**
   * DELETE /chapters/:id (ADMIN)
   * Soft-deletes a chapter
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    const chapter = await this.chapterRepository.findOne({
      where: { id },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter "${id}" not found`);
    }

    const bookId = chapter.bookId;
    await this.chapterRepository.softDelete(id);
    await this.updateBookChapterCount(bookId);

    return {
      message: 'Chapter soft-deleted successfully',
      id,
    };
  }

  /**
   * POST /chapters/:id/content/upload-init
   * Prepares direct upload for chapter PDF asset
   */
  async initPdfUpload(
    chapterId: string,
    dto: ChapterPdfUploadInitDto,
  ): Promise<ChapterPdfUploadInitResponseDto> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter "${chapterId}" not found`);
    }

    // Deterministic storage key
    const storageKey = `books/${chapter.bookId}/chapters/${chapter.id}/chapter.pdf`;

    chapter.pdfStorageKey = storageKey;
    chapter.pdfFileName = dto.fileName.trim();
    chapter.pdfFileSize = dto.fileSize;
    chapter.contentStatus = ChapterContentStatus.PENDING;

    await this.chapterRepository.save(chapter);

    return {
      chapterId: chapter.id,
      storageKey,
      uploadUrl: `https://storage.kuroyomi.local/upload/${encodeURIComponent(storageKey)}?signature=mock_presigned_v1`,
      expiresInSeconds: 3600,
    };
  }

  /**
   * POST /chapters/:id/content/complete
   * Finalizes PDF metadata after direct browser upload to storage
   */
  async completePdfUpload(
    chapterId: string,
    dto: ChapterPdfUploadCompleteDto,
  ): Promise<Chapter> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter "${chapterId}" not found`);
    }

    chapter.pdfFileName = dto.fileName.trim();
    chapter.pdfFileSize = dto.fileSize;
    if (dto.pageCount !== undefined) chapter.pdfPageCount = dto.pageCount;
    if (dto.checksum !== undefined) chapter.pdfChecksum = dto.checksum;
    chapter.contentStatus = ChapterContentStatus.READY;

    return this.chapterRepository.save(chapter);
  }
}
