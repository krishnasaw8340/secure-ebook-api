import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Book } from '../entities/book.entity';
import { BookSeries } from '../entities/book-series.entity';
import { Volume } from '../entities/volume.entity';
import { Author } from '../entities/author.entity';
import { Artist } from '../entities/artist.entity';
import { Language } from '../entities/language.entity';
import { Category } from '../entities/category.entity';
import { Genre } from '../entities/genre.entity';
import { Tag } from '../entities/tag.entity';
import { BookGenre } from '../entities/book-genre.entity';
import { BookTag } from '../entities/book-tag.entity';
import { BookStatus } from '../../common/enums/book-status.enum';
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateBookDto,
  UpdateBookDto,
  QueryBookDto,
  PaginatedBookResponseDto,
} from '../dto';
import { generateSlug } from './series.service';

@Injectable()
export class BooksService {
  constructor(
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    @InjectRepository(BookSeries)
    private readonly seriesRepository: Repository<BookSeries>,
    @InjectRepository(Volume)
    private readonly volumeRepository: Repository<Volume>,
    @InjectRepository(Author)
    private readonly authorRepository: Repository<Author>,
    @InjectRepository(Artist)
    private readonly artistRepository: Repository<Artist>,
    @InjectRepository(Language)
    private readonly languageRepository: Repository<Language>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Genre)
    private readonly genreRepository: Repository<Genre>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(BookGenre)
    private readonly bookGenreRepository: Repository<BookGenre>,
    @InjectRepository(BookTag)
    private readonly bookTagRepository: Repository<BookTag>,
  ) {}

  private isAdminUser(user?: JwtUser): boolean {
    if (!user || !user.roles) return false;
    return user.roles.some(
      (role) => role === RoleType.ADMIN || role === RoleType.SUPER_ADMIN,
    );
  }

  private isUUID(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  /**
   * POST /books (ADMIN)
   * Create a new book with its relational associations
   */
  async create(dto: CreateBookDto, user?: JwtUser): Promise<Book> {
    // 1. Verify parent Series exists
    const series = await this.seriesRepository.findOne({
      where: { id: dto.seriesId },
    });
    if (!series) {
      throw new NotFoundException(`Series with ID "${dto.seriesId}" not found`);
    }

    // 2. If volumeId is provided, verify Volume exists and belongs to the specified Series
    if (dto.volumeId) {
      const volume = await this.volumeRepository.findOne({
        where: { id: dto.volumeId },
      });
      if (!volume) {
        throw new NotFoundException(`Volume with ID "${dto.volumeId}" not found`);
      }
      if (volume.seriesId !== dto.seriesId) {
        throw new BadRequestException(
          `Volume "${dto.volumeId}" belongs to series "${volume.seriesId}", not "${dto.seriesId}"`,
        );
      }
    }

    // 3. Verify Language exists
    const language = await this.languageRepository.findOne({
      where: { id: dto.languageId },
    });
    if (!language) {
      throw new NotFoundException(`Language with ID "${dto.languageId}" not found`);
    }

    // 4. Verify Category exists
    const category = await this.categoryRepository.findOne({
      where: { id: dto.categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Category with ID "${dto.categoryId}" not found`);
    }

    // 5. Verify Author if provided
    if (dto.authorId) {
      const author = await this.authorRepository.findOne({
        where: { id: dto.authorId },
      });
      if (!author) {
        throw new NotFoundException(`Author with ID "${dto.authorId}" not found`);
      }
    }

    // 6. Verify Artist if provided
    if (dto.artistId) {
      const artist = await this.artistRepository.findOne({
        where: { id: dto.artistId },
      });
      if (!artist) {
        throw new NotFoundException(`Artist with ID "${dto.artistId}" not found`);
      }
    }

    // 7. Verify Genres if provided
    if (dto.genreIds && dto.genreIds.length > 0) {
      const count = await this.genreRepository.count({
        where: { id: In(dto.genreIds) },
      });
      if (count !== dto.genreIds.length) {
        throw new NotFoundException('One or more genreIds were not found');
      }
    }

    // 8. Verify Tags if provided
    if (dto.tagIds && dto.tagIds.length > 0) {
      const count = await this.tagRepository.count({
        where: { id: In(dto.tagIds) },
      });
      if (count !== dto.tagIds.length) {
        throw new NotFoundException('One or more tagIds were not found');
      }
    }

    // 9. Generate and verify slug
    const slug = dto.slug ? dto.slug.trim().toLowerCase() : generateSlug(dto.title);
    if (!slug) {
      throw new ConflictException('Unable to generate a valid slug from book title');
    }

    const existingBook = await this.bookRepository.findOne({
      where: { slug },
    });
    if (existingBook) {
      throw new ConflictException(`Book with slug "${slug}" already exists`);
    }

    // 10. Handle publication timestamp
    let publishedAt: Date | undefined;
    if (dto.publishedAt) {
      publishedAt = new Date(dto.publishedAt);
    } else if (dto.status === BookStatus.PUBLISHED) {
      publishedAt = new Date();
    }

    // 11. Create and persist Book entity
    const book = this.bookRepository.create({
      seriesId: dto.seriesId,
      volumeId: dto.volumeId,
      title: dto.title.trim(),
      japaneseTitle: dto.japaneseTitle?.trim(),
      slug,
      description: dto.description?.trim(),
      authorId: dto.authorId,
      artistId: dto.artistId,
      languageId: dto.languageId,
      categoryId: dto.categoryId,
      status: dto.status ?? BookStatus.DRAFT,
      pricingModel: dto.pricingModel ?? BookPricingModel.FREE,
      defaultCoinPerPage: dto.defaultCoinPerPage ?? 0,
      defaultFreeChapters: dto.defaultFreeChapters ?? 0,
      defaultFreePages: dto.defaultFreePages ?? 0,
      isPremium: dto.isPremium ?? false,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      publishedAt,
      createdBy: user?.userId,
      updatedBy: user?.userId,
    });

    let savedBook: Book;
    try {
      savedBook = await this.bookRepository.save(book);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(`Book with slug "${slug}" already exists`);
      }
      throw error;
    }

    // 12. Create BookGenre associations
    if (dto.genreIds && dto.genreIds.length > 0) {
      const bookGenres = dto.genreIds.map((genreId) =>
        this.bookGenreRepository.create({
          bookId: savedBook.id,
          genreId,
        }),
      );
      await this.bookGenreRepository.save(bookGenres);
    }

    // 13. Create BookTag associations
    if (dto.tagIds && dto.tagIds.length > 0) {
      const bookTags = dto.tagIds.map((tagId) =>
        this.bookTagRepository.create({
          bookId: savedBook.id,
          tagId,
        }),
      );
      await this.bookTagRepository.save(bookTags);
    }

    return this.findOne(savedBook.id, user);
  }

  /**
   * GET /books (Public / Authenticated with visibility scoping)
   */
  async findAll(
    query: QueryBookDto,
    user?: JwtUser,
  ): Promise<PaginatedBookResponseDto> {
    const isAdmin = this.isAdminUser(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Non-admin users cannot query draft/unpublished/archived books
    if (!isAdmin && query.status && query.status !== BookStatus.PUBLISHED) {
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

    const qb = this.bookRepository.createQueryBuilder('book');

    // Visibility scoping
    if (isAdmin) {
      if (query.status) {
        qb.andWhere('book.status = :status', { status: query.status });
      }
    } else {
      qb.andWhere('book.status = :published', {
        published: BookStatus.PUBLISHED,
      });
    }

    // Direct relation filters
    if (query.seriesId) {
      qb.andWhere('book.seriesId = :seriesId', { seriesId: query.seriesId });
    }

    if (query.volumeId) {
      qb.andWhere('book.volumeId = :volumeId', { volumeId: query.volumeId });
    }

    if (query.authorId) {
      qb.andWhere('book.authorId = :authorId', { authorId: query.authorId });
    }

    if (query.artistId) {
      qb.andWhere('book.artistId = :artistId', { artistId: query.artistId });
    }

    if (query.languageId) {
      qb.andWhere('book.languageId = :languageId', {
        languageId: query.languageId,
      });
    }

    if (query.categoryId) {
      qb.andWhere('book.categoryId = :categoryId', {
        categoryId: query.categoryId,
      });
    }

    if (query.pricingModel) {
      qb.andWhere('book.pricingModel = :pricingModel', {
        pricingModel: query.pricingModel,
      });
    }

    if (query.isPremium !== undefined) {
      qb.andWhere('book.isPremium = :isPremium', {
        isPremium: query.isPremium,
      });
    }

    // Many-to-many junction filters
    if (query.genreId) {
      qb.innerJoin('book.bookGenres', 'bg', 'bg.genreId = :genreId', {
        genreId: query.genreId,
      });
    }

    if (query.tagId) {
      qb.innerJoin('book.bookTags', 'bt', 'bt.tagId = :tagId', {
        tagId: query.tagId,
      });
    }

    // Fuzzy search
    if (query.search) {
      const searchTerm = `%${query.search.trim()}%`;
      qb.andWhere(
        '(book.title ILIKE :searchTerm OR book.japaneseTitle ILIKE :searchTerm OR book.description ILIKE :searchTerm)',
        { searchTerm },
      );
    }

    // Sorting
    const sortField =
      query.sortBy === 'title'
        ? 'book.title'
        : query.sortBy === 'averageRating'
          ? 'book.averageRating'
          : query.sortBy === 'totalViews'
            ? 'book.totalViews'
            : query.sortBy === 'releaseDate'
              ? 'book.releaseDate'
              : 'book.createdAt';

    qb.orderBy(sortField, query.sortOrder ?? 'DESC');

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
   * GET /books/:id (Public / Authenticated)
   */
  async findOne(idOrSlug: string, user?: JwtUser): Promise<Book> {
    const isAdmin = this.isAdminUser(user);
    const isUuid = this.isUUID(idOrSlug);

    const qb = this.bookRepository
      .createQueryBuilder('book')
      .leftJoinAndSelect('book.series', 'series')
      .leftJoinAndSelect('book.volume', 'volume')
      .leftJoinAndSelect('book.author', 'author')
      .leftJoinAndSelect('book.artist', 'artist')
      .leftJoinAndSelect('book.language', 'language')
      .leftJoinAndSelect('book.category', 'category')
      .leftJoinAndSelect('book.bookGenres', 'bookGenre')
      .leftJoinAndSelect('bookGenre.genre', 'genre')
      .leftJoinAndSelect('book.bookTags', 'bookTag')
      .leftJoinAndSelect('bookTag.tag', 'tag')
      .leftJoinAndSelect('book.mediaAssets', 'mediaAsset')
      .leftJoinAndSelect('book.chapters', 'chapter')
      .orderBy('chapter.sortOrder', 'ASC');

    if (isUuid) {
      qb.where('book.id = :id', { id: idOrSlug });
    } else {
      qb.where('book.slug = :slug', { slug: idOrSlug.toLowerCase() });
    }

    const book = await qb.getOne();

    if (!book) {
      throw new NotFoundException(`Book "${idOrSlug}" not found`);
    }

    if (!isAdmin && book.status !== BookStatus.PUBLISHED) {
      throw new NotFoundException(`Book "${idOrSlug}" not found`);
    }

    return book;
  }

  /**
   * PATCH /books/:id (ADMIN)
   */
  async update(
    idOrSlug: string,
    dto: UpdateBookDto,
    user?: JwtUser,
  ): Promise<Book> {
    const isUuid = this.isUUID(idOrSlug);
    const book = await this.bookRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug.toLowerCase() },
    });

    if (!book) {
      throw new NotFoundException(`Book "${idOrSlug}" not found`);
    }

    // 1. If seriesId is updating, verify target series exists
    const targetSeriesId = dto.seriesId ?? book.seriesId;
    if (dto.seriesId && dto.seriesId !== book.seriesId) {
      const series = await this.seriesRepository.findOne({
        where: { id: dto.seriesId },
      });
      if (!series) {
        throw new NotFoundException(`Series with ID "${dto.seriesId}" not found`);
      }
      book.seriesId = dto.seriesId;
    }

    // 2. If volumeId is updating
    if (dto.volumeId !== undefined) {
      if (dto.volumeId === null || dto.volumeId === '') {
        book.volumeId = undefined;
      } else {
        const volume = await this.volumeRepository.findOne({
          where: { id: dto.volumeId },
        });
        if (!volume) {
          throw new NotFoundException(`Volume with ID "${dto.volumeId}" not found`);
        }
        if (volume.seriesId !== targetSeriesId) {
          throw new BadRequestException(
            `Volume "${dto.volumeId}" belongs to series "${volume.seriesId}", not "${targetSeriesId}"`,
          );
        }
        book.volumeId = dto.volumeId;
      }
    }

    // 3. Language verification
    if (dto.languageId !== undefined) {
      const language = await this.languageRepository.findOne({
        where: { id: dto.languageId },
      });
      if (!language) {
        throw new NotFoundException(
          `Language with ID "${dto.languageId}" not found`,
        );
      }
      book.languageId = dto.languageId;
    }

    // 4. Category verification
    if (dto.categoryId !== undefined) {
      const category = await this.categoryRepository.findOne({
        where: { id: dto.categoryId },
      });
      if (!category) {
        throw new NotFoundException(
          `Category with ID "${dto.categoryId}" not found`,
        );
      }
      book.categoryId = dto.categoryId;
    }

    // 5. Author verification
    if (dto.authorId !== undefined) {
      if (dto.authorId === null || dto.authorId === '') {
        book.authorId = undefined;
      } else {
        const author = await this.authorRepository.findOne({
          where: { id: dto.authorId },
        });
        if (!author) {
          throw new NotFoundException(`Author with ID "${dto.authorId}" not found`);
        }
        book.authorId = dto.authorId;
      }
    }

    // 6. Artist verification
    if (dto.artistId !== undefined) {
      if (dto.artistId === null || dto.artistId === '') {
        book.artistId = undefined;
      } else {
        const artist = await this.artistRepository.findOne({
          where: { id: dto.artistId },
        });
        if (!artist) {
          throw new NotFoundException(`Artist with ID "${dto.artistId}" not found`);
        }
        book.artistId = dto.artistId;
      }
    }

    // 7. Slug uniqueness check
    if (dto.slug !== undefined) {
      const newSlug = dto.slug.trim().toLowerCase();
      if (newSlug !== book.slug) {
        const existing = await this.bookRepository.findOne({
          where: { slug: newSlug },
        });
        if (existing && existing.id !== book.id) {
          throw new ConflictException(`Book with slug "${newSlug}" already exists`);
        }
        book.slug = newSlug;
      }
    }

    // 8. Update direct scalar fields
    if (dto.title !== undefined) {
      book.title = dto.title.trim();
    }

    if (dto.japaneseTitle !== undefined) {
      book.japaneseTitle = dto.japaneseTitle?.trim();
    }

    if (dto.description !== undefined) {
      book.description = dto.description?.trim();
    }

    if (dto.pricingModel !== undefined) {
      book.pricingModel = dto.pricingModel;
    }

    if (dto.defaultCoinPerPage !== undefined) {
      book.defaultCoinPerPage = dto.defaultCoinPerPage;
    }

    if (dto.defaultFreeChapters !== undefined) {
      book.defaultFreeChapters = dto.defaultFreeChapters;
    }

    if (dto.defaultFreePages !== undefined) {
      book.defaultFreePages = dto.defaultFreePages;
    }

    if (dto.isPremium !== undefined) {
      book.isPremium = dto.isPremium;
    }

    if (dto.releaseDate !== undefined) {
      book.releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : undefined;
    }

    if (dto.status !== undefined) {
      book.status = dto.status;
      if (
        book.status === BookStatus.PUBLISHED &&
        !book.publishedAt &&
        !dto.publishedAt
      ) {
        book.publishedAt = new Date();
      }
    }

    if (dto.publishedAt !== undefined) {
      book.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : undefined;
    }

    book.updatedBy = user?.userId;

    try {
      await this.bookRepository.save(book);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(`Book slug conflict`);
      }
      throw error;
    }

    // 9. Update Genres if provided
    if (dto.genreIds !== undefined) {
      if (dto.genreIds.length > 0) {
        const count = await this.genreRepository.count({
          where: { id: In(dto.genreIds) },
        });
        if (count !== dto.genreIds.length) {
          throw new NotFoundException('One or more genreIds were not found');
        }
      }

      await this.bookGenreRepository.delete({ bookId: book.id });

      if (dto.genreIds.length > 0) {
        const bookGenres = dto.genreIds.map((genreId) =>
          this.bookGenreRepository.create({
            bookId: book.id,
            genreId,
          }),
        );
        await this.bookGenreRepository.save(bookGenres);
      }
    }

    // 10. Update Tags if provided
    if (dto.tagIds !== undefined) {
      if (dto.tagIds.length > 0) {
        const count = await this.tagRepository.count({
          where: { id: In(dto.tagIds) },
        });
        if (count !== dto.tagIds.length) {
          throw new NotFoundException('One or more tagIds were not found');
        }
      }

      await this.bookTagRepository.delete({ bookId: book.id });

      if (dto.tagIds.length > 0) {
        const bookTags = dto.tagIds.map((tagId) =>
          this.bookTagRepository.create({
            bookId: book.id,
            tagId,
          }),
        );
        await this.bookTagRepository.save(bookTags);
      }
    }

    return this.findOne(book.id, user);
  }

  /**
   * DELETE /books/:id (ADMIN)
   */
  async remove(idOrSlug: string): Promise<{ message: string; id: string }> {
    const isUuid = this.isUUID(idOrSlug);
    const book = await this.bookRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug.toLowerCase() },
    });

    if (!book) {
      throw new NotFoundException(`Book "${idOrSlug}" not found`);
    }

    await this.bookRepository.softDelete(book.id);

    return {
      message: 'Book deleted successfully',
      id: book.id,
    };
  }
}
