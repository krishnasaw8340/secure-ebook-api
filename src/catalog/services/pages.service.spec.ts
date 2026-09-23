import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { PagesService } from './pages.service';
import { Page } from '../entities/page.entity';
import { Chapter } from '../entities/chapter.entity';
import { Book } from '../entities/book.entity';

describe('PagesService', () => {
  let service: PagesService;
  let pageRepo: any;
  let chapterRepo: any;
  let bookRepo: any;
  let dataSource: any;

  const mockChapter = {
    id: 'c0000000-0000-0000-0000-000000000001',
    bookId: 'b0000000-0000-0000-0000-000000000001',
    title: 'Chapter 1',
    pageCount: 2,
  };

  const mockPage1 = {
    id: 'p0000000-0000-0000-0000-000000000001',
    chapterId: mockChapter.id,
    pageNumber: 1,
    sortOrder: 1,
    storageKey: 'https://storage.kuroyomi.com/c1/p1.webp',
    encryptedKey: null,
    createdAt: new Date('2026-09-20T00:00:00.000Z'),
    updatedAt: new Date('2026-09-20T00:00:00.000Z'),
  };

  const mockPage2 = {
    id: 'p0000000-0000-0000-0000-000000000002',
    chapterId: mockChapter.id,
    pageNumber: 2,
    sortOrder: 2,
    storageKey: 'https://storage.kuroyomi.com/c1/p2.webp',
    encryptedKey: null,
    createdAt: new Date('2026-09-20T00:00:00.000Z'),
    updatedAt: new Date('2026-09-20T00:00:00.000Z'),
  };

  beforeEach(async () => {
    pageRepo = {
      find: jest.fn().mockResolvedValue([mockPage1, mockPage2]),
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === mockPage1.id) return Promise.resolve(mockPage1);
        return Promise.resolve(null);
      }),
      create: jest.fn().mockImplementation((dto) => ({
        id: 'new-page-id',
        createdAt: new Date(),
        updatedAt: new Date(),
        ...dto,
      })),
      save: jest.fn().mockImplementation((pages) => Promise.resolve(pages)),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
      count: jest.fn().mockResolvedValue(2),
      createQueryBuilder: jest.fn().mockReturnValue({
        innerJoin: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getCount: jest.fn().mockResolvedValue(2),
      }),
    };

    chapterRepo = {
      findOne: jest.fn().mockImplementation(({ where }) => {
        if (where.id === mockChapter.id) return Promise.resolve(mockChapter);
        return Promise.resolve(null);
      }),
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    bookRepo = {
      update: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb) => {
        const manager = {
          update: jest.fn().mockResolvedValue({ affected: 1 }),
        };
        return cb(manager);
      }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PagesService,
        {
          provide: getRepositoryToken(Page),
          useValue: pageRepo,
        },
        {
          provide: getRepositoryToken(Chapter),
          useValue: chapterRepo,
        },
        {
          provide: getRepositoryToken(Book),
          useValue: bookRepo,
        },
        {
          provide: DataSource,
          useValue: dataSource,
        },
      ],
    }).compile();

    service = module.get<PagesService>(PagesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getByChapter', () => {
    it('throws NotFoundException if chapter does not exist', async () => {
      await expect(service.getByChapter('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns pages for existing chapter', async () => {
      const result = await service.getByChapter(mockChapter.id);
      expect(result.length).toBe(2);
      expect(result[0].imageUrl).toBe(mockPage1.storageKey);
      expect(result[0].pageNumber).toBe(1);
    });
  });

  describe('getById', () => {
    it('throws NotFoundException if page does not exist', async () => {
      await expect(service.getById('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns mapped page when found', async () => {
      const result = await service.getById(mockPage1.id);
      expect(result.id).toBe(mockPage1.id);
      expect(result.imageUrl).toBe(mockPage1.storageKey);
    });
  });

  describe('createPages', () => {
    it('throws NotFoundException if chapter does not exist', async () => {
      await expect(
        service.createPages('non-existent-id', { imageUrls: ['url1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates pages with sequential page numbers and syncs counts', async () => {
      pageRepo.find.mockResolvedValueOnce([mockPage2]); // to get max page number = 2
      const result = await service.createPages(mockChapter.id, {
        imageUrls: ['https://storage.kuroyomi.com/c1/p3.webp'],
      });

      expect(pageRepo.create).toHaveBeenCalledWith(
        expect.objectContaining({
          chapterId: mockChapter.id,
          pageNumber: 3,
          sortOrder: 3,
          storageKey: 'https://storage.kuroyomi.com/c1/p3.webp',
        }),
      );
      expect(pageRepo.save).toHaveBeenCalled();
      expect(chapterRepo.update).toHaveBeenCalledWith(mockChapter.id, {
        pageCount: 2,
      });
      expect(result.length).toBe(1);
    });
  });

  describe('reorderPages', () => {
    it('throws NotFoundException if chapter does not exist', async () => {
      await expect(
        service.reorderPages('non-existent-id', { pageIds: ['id1'] }),
      ).rejects.toThrow(NotFoundException);
    });

    it('throws BadRequestException if a pageId does not belong to chapter', async () => {
      pageRepo.find.mockResolvedValueOnce([mockPage1]);
      await expect(
        service.reorderPages(mockChapter.id, { pageIds: ['foreign-page-id'] }),
      ).rejects.toThrow(BadRequestException);
    });

    it('executes two-phase update in transaction and returns reordered pages', async () => {
      pageRepo.find.mockResolvedValue([mockPage1, mockPage2]);
      const result = await service.reorderPages(mockChapter.id, {
        pageIds: [mockPage2.id, mockPage1.id],
      });

      expect(dataSource.transaction).toHaveBeenCalled();
      expect(result.length).toBe(2);
    });
  });

  describe('remove', () => {
    it('throws NotFoundException if page does not exist', async () => {
      await expect(service.remove('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('deletes page and syncs counts', async () => {
      const result = await service.remove(mockPage1.id);
      expect(pageRepo.delete).toHaveBeenCalledWith(mockPage1.id);
      expect(chapterRepo.update).toHaveBeenCalledWith(mockChapter.id, {
        pageCount: 2,
      });
      expect(result).toEqual({
        message: 'Page deleted successfully',
        id: mockPage1.id,
      });
    });
  });
});
