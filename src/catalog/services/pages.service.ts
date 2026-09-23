import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Page } from '../entities/page.entity';
import { Chapter } from '../entities/chapter.entity';
import { Book } from '../entities/book.entity';
import { CreatePagesDto, ReorderPagesDto, PageResponseDto } from '../dto';

@Injectable()
export class PagesService {
  constructor(
    @InjectRepository(Page)
    private readonly pageRepository: Repository<Page>,
    @InjectRepository(Chapter)
    private readonly chapterRepository: Repository<Chapter>,
    @InjectRepository(Book)
    private readonly bookRepository: Repository<Book>,
    private readonly dataSource: DataSource,
  ) {}

  private toResponseDto(page: Page): PageResponseDto {
    return {
      id: page.id,
      chapterId: page.chapterId,
      pageNumber: page.pageNumber,
      sortOrder: page.sortOrder,
      storageKey: page.storageKey,
      imageUrl: page.storageKey,
      encryptedKey: page.encryptedKey,
      isDrmProtected: Boolean(page.encryptedKey),
      width: page.width,
      height: page.height,
      mimeType: page.mimeType,
      fileSize: page.fileSize,
      checksum: page.checksum,
      createdAt: page.createdAt,
      updatedAt: page.updatedAt,
    };
  }

  private async syncChapterPageCount(chapterId: string): Promise<void> {
    try {
      const count = await this.pageRepository.count({
        where: { chapterId },
      });
      await this.chapterRepository.update(chapterId, { pageCount: count });

      const chapter = await this.chapterRepository.findOne({
        where: { id: chapterId },
      });
      if (chapter?.bookId) {
        const totalPages = await this.pageRepository
          .createQueryBuilder('page')
          .innerJoin('page.chapter', 'chapter')
          .where('chapter.bookId = :bookId', { bookId: chapter.bookId })
          .getCount();
        await this.bookRepository.update(chapter.bookId, { totalPages });
      }
    } catch {
      // Non-blocking sync error catch
    }
  }

  /**
   * GET /chapters/:chapterId/pages
   * List all pages belonging to a chapter, sorted by sortOrder and pageNumber
   */
  async getByChapter(chapterId: string): Promise<PageResponseDto[]> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter "${chapterId}" not found`);
    }

    const pages = await this.pageRepository.find({
      where: { chapterId },
      order: {
        sortOrder: 'ASC',
        pageNumber: 'ASC',
      },
    });

    return pages.map((p) => this.toResponseDto(p));
  }

  /**
   * GET /pages/:id
   * Get single page by ID
   */
  async getById(id: string): Promise<PageResponseDto> {
    const page = await this.pageRepository.findOne({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page "${id}" not found`);
    }

    return this.toResponseDto(page);
  }

  /**
   * POST /chapters/:chapterId/pages
   * Bulk upload / register pages for a chapter
   */
  async createPages(
    chapterId: string,
    dto: CreatePagesDto,
  ): Promise<PageResponseDto[]> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter "${chapterId}" not found`);
    }

    const existingPages = await this.pageRepository.find({
      where: { chapterId },
      order: { pageNumber: 'DESC' },
      take: 1,
    });

    const startPageNo =
      existingPages.length > 0 ? existingPages[0].pageNumber : 0;

    const newPages: Page[] = dto.imageUrls.map((url, idx) => {
      const pageNum = startPageNo + idx + 1;
      return this.pageRepository.create({
        chapterId,
        pageNumber: pageNum,
        sortOrder: pageNum,
        storageKey: url,
      });
    });

    const savedPages = await this.pageRepository.save(newPages);
    await this.syncChapterPageCount(chapterId);

    return savedPages.map((p) => this.toResponseDto(p));
  }

  /**
   * PUT /chapters/:chapterId/pages/reorder
   * Reorder pages in a chapter
   */
  async reorderPages(
    chapterId: string,
    dto: ReorderPagesDto,
  ): Promise<PageResponseDto[]> {
    const chapter = await this.chapterRepository.findOne({
      where: { id: chapterId },
    });

    if (!chapter) {
      throw new NotFoundException(`Chapter "${chapterId}" not found`);
    }

    const existingPages = await this.pageRepository.find({
      where: { chapterId },
    });

    const pageMap = new Map(existingPages.map((p) => [p.id, p]));

    for (const pageId of dto.pageIds) {
      if (!pageMap.has(pageId)) {
        throw new BadRequestException(
          `Page "${pageId}" does not belong to chapter "${chapterId}"`,
        );
      }
    }

    // Two-phase update inside a transaction to prevent unique constraint collision on (chapter_id, page_number)
    await this.dataSource.transaction(async (manager) => {
      // Phase 1: Temporarily negate page_number
      for (let i = 0; i < dto.pageIds.length; i++) {
        await manager.update(Page, dto.pageIds[i], {
          pageNumber: -(i + 1),
        });
      }

      // Phase 2: Set target page_number and sort_order
      for (let i = 0; i < dto.pageIds.length; i++) {
        await manager.update(Page, dto.pageIds[i], {
          pageNumber: i + 1,
          sortOrder: i + 1,
        });
      }
    });

    return this.getByChapter(chapterId);
  }

  /**
   * DELETE /pages/:id
   * Remove a single page
   */
  async remove(id: string): Promise<{ message: string; id: string }> {
    const page = await this.pageRepository.findOne({
      where: { id },
    });

    if (!page) {
      throw new NotFoundException(`Page "${id}" not found`);
    }

    const chapterId = page.chapterId;
    await this.pageRepository.delete(id);
    await this.syncChapterPageCount(chapterId);

    return {
      message: 'Page deleted successfully',
      id,
    };
  }
}
