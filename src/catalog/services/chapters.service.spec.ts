import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { Chapter } from '../entities/chapter.entity';
import { Book } from '../entities/book.entity';
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';
import { ChapterContentStatus } from '../../common/enums/chapter-content-status.enum';

describe('ChaptersService', () => {
  let service: ChaptersService;
  let chapterRepo: any;
  let bookRepo: any;

  const mockBook: Partial<Book> = {
    id: 'e0000000-0000-0000-0000-000000000001',
    title: 'One Piece, Vol. 1',
    totalChapters: 1,
    defaultChapterCoinCost: 2,
  };

  const mockChapter: Partial<Chapter> = {
    id: 'c0000000-0000-0000-0000-000000000001',
    bookId: 'e0000000-0000-0000-0000-000000000001',
    chapterNumber: 1,
    title: 'Romance Dawn',
    sortOrder: 10,
    pricingModel: ChapterPricingModel.FREE,
    coinCost: 0,
    pdfStorageKey:
      'books/e0000000-0000-0000-0000-000000000001/chapters/c0000000-0000-0000-0000-000000000001/chapter.pdf',
    pdfFileName: 'chapter-001.pdf',
    pdfFileSize: 15420000,
    pdfPageCount: 42,
    pdfChecksum:
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    contentStatus: ChapterContentStatus.READY,
    published: true,
    publishedAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    chapterRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) =>
        Promise.resolve({ id: mockChapter.id, ...entity }),
      ),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(1),
      createQueryBuilder: jest.fn(),
    };

    bookRepo = {
      findOne: jest.fn(),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChaptersService,
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepo,
        },
        {
          provide: getRepositoryToken(Book),
          useValue: bookRepo,
        },
      ],
    }).compile();

    service = module.get<ChaptersService>(ChaptersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create a chapter with default values and update book totalChapters', async () => {
      bookRepo.findOne.mockResolvedValue(mockBook);
      chapterRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        bookId: mockBook.id!,
        chapterNumber: 1,
        title: 'Romance Dawn',
      });

      expect(bookRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockBook.id },
      });
      expect(chapterRepo.findOne).toHaveBeenCalledWith({
        where: { bookId: mockBook.id, chapterNumber: 1 },
      });
      expect(result.sortOrder).toBe(10);
      expect(result.pricingModel).toBe(ChapterPricingModel.FREE);
      expect(result.coinCost).toBe(0);
      expect(bookRepo.update).toHaveBeenCalled();
    });

    it('should throw NotFoundException if parent Book does not exist', async () => {
      bookRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          bookId: 'non-existent-book',
          chapterNumber: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if chapterNumber already exists for the book', async () => {
      bookRepo.findOne.mockResolvedValue(mockBook);
      chapterRepo.findOne.mockResolvedValue(mockChapter);

      await expect(
        service.create({
          bookId: mockBook.id!,
          chapterNumber: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw BadRequestException if PAID pricing model has no coinCost and book default is 0', async () => {
      bookRepo.findOne.mockResolvedValue({
        ...mockBook,
        defaultChapterCoinCost: 0,
      });
      chapterRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          bookId: mockBook.id!,
          chapterNumber: 3,
          pricingModel: ChapterPricingModel.PAID,
          coinCost: 0,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should fallback to book defaultChapterCoinCost when PAID chapter has no explicit coinCost', async () => {
      bookRepo.findOne.mockResolvedValue(mockBook);
      chapterRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        bookId: mockBook.id!,
        chapterNumber: 3,
        pricingModel: ChapterPricingModel.PAID,
      });

      expect(result.pricingModel).toBe(ChapterPricingModel.PAID);
      expect(result.coinCost).toBe(2);
    });

    it('should successfully create PAID chapter when explicit coinCost > 0', async () => {
      bookRepo.findOne.mockResolvedValue(mockBook);
      chapterRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        bookId: mockBook.id!,
        chapterNumber: 3,
        pricingModel: ChapterPricingModel.PAID,
        coinCost: 5,
      });

      expect(result.pricingModel).toBe(ChapterPricingModel.PAID);
      expect(result.coinCost).toBe(5);
    });

    it('should set publishedAt when published is true and publishedAt is not provided', async () => {
      bookRepo.findOne.mockResolvedValue(mockBook);
      chapterRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        bookId: mockBook.id!,
        chapterNumber: 4,
        published: true,
      });

      expect(result.published).toBe(true);
      expect(result.publishedAt).toBeInstanceOf(Date);
    });
  });

  describe('findAll', () => {
    it('should return published chapters for public user and filter by bookId', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockChapter], 1]),
      };
      chapterRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({
        bookId: mockBook.id,
        page: 1,
        limit: 20,
        sortBy: 'sortOrder',
        sortOrder: 'ASC',
      });

      expect(qb.andWhere).toHaveBeenCalledWith(
        'chapter.published = :published',
        {
          published: true,
        },
      );
      expect(qb.andWhere).toHaveBeenCalledWith('chapter.bookId = :bookId', {
        bookId: mockBook.id,
      });
      expect(qb.orderBy).toHaveBeenCalledWith('chapter.sortOrder', 'ASC');
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty pagination if public user requests unpublished chapters', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        published: false,
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });
  });

  describe('findOne', () => {
    it('should return chapter by ID for public user when published', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockChapter),
      };
      chapterRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOne(mockChapter.id!);
      expect(result.id).toBe(mockChapter.id);
    });

    it('should throw NotFoundException if chapter does not exist', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(null),
      };
      chapterRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOne('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update', () => {
    it('should update chapter successfully', async () => {
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      const result = await service.update(mockChapter.id!, {
        title: 'Updated Romance Dawn',
        sortOrder: 15,
      });

      expect(result.title).toBe('Updated Romance Dawn');
      expect(result.sortOrder).toBe(15);
      expect(chapterRepo.save).toHaveBeenCalled();
    });

    it('should throw NotFoundException if chapter does not exist', async () => {
      chapterRepo.findOne.mockResolvedValue(null);

      await expect(
        service.update('non-existent-id', { title: 'Test' }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('upload contracts', () => {
    it('should initiate PDF upload contract with deterministic key', async () => {
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      const result = await service.initPdfUpload(mockChapter.id!, {
        fileName: 'chapter-001.pdf',
        fileSize: 15420000,
      });

      expect(result.chapterId).toBe(mockChapter.id);
      expect(result.storageKey).toBe(
        `books/${mockChapter.bookId}/chapters/${mockChapter.id}/chapter.pdf`,
      );
      expect(result.uploadUrl).toBeDefined();
      expect(chapterRepo.save).toHaveBeenCalled();
    });

    it('should complete PDF upload and set contentStatus to READY', async () => {
      chapterRepo.findOne.mockResolvedValue({
        ...mockChapter,
        contentStatus: ChapterContentStatus.PENDING,
      });

      const result = await service.completePdfUpload(mockChapter.id!, {
        fileName: 'chapter-001.pdf',
        fileSize: 15420000,
        pageCount: 47,
        checksum: 'checksum123',
      });

      expect(result.contentStatus).toBe(ChapterContentStatus.READY);
      expect(result.pdfPageCount).toBe(47);
      expect(chapterRepo.save).toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('should soft delete chapter and update book totalChapters', async () => {
      chapterRepo.findOne.mockResolvedValue(mockChapter);

      const result = await service.remove(mockChapter.id!);

      expect(chapterRepo.softDelete).toHaveBeenCalledWith(mockChapter.id);
      expect(bookRepo.update).toHaveBeenCalled();
      expect(result.message).toBe('Chapter soft-deleted successfully');
      expect(result.id).toBe(mockChapter.id);
    });
  });
});
