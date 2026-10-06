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
import { StorageService } from '../../storage/storage.service';

describe('ChaptersService', () => {
  let service: ChaptersService;
  let chapterRepo: any;
  let bookRepo: any;
  let storageService: any;

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

    storageService = {
      generatePresignedUploadUrl: jest
        .fn()
        .mockResolvedValue('https://storage-mock.amazonaws.com/upload'),
      generatePresignedDownloadUrl: jest
        .fn()
        .mockResolvedValue('https://storage-mock.amazonaws.com/download'),
      headObject: jest.fn().mockResolvedValue({
        ContentType: 'application/pdf',
        ContentLength: 15420000,
      }),
      getMaxFileSizeBytes: jest.fn().mockReturnValue(200 * 1024 * 1024),
      getMaxFileSizeMb: jest.fn().mockReturnValue(200),
      getBucketName: jest.fn().mockReturnValue('ebook-platform-pdfs-prod'),
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
        {
          provide: StorageService,
          useValue: storageService,
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
    it('should generate S3 presigned upload URL with immutable versioned key without prematurely mutating chapter state', async () => {
      const initialChapter = { ...mockChapter };
      chapterRepo.findOne.mockResolvedValue(initialChapter);

      const result = await service.generateUploadUrl(mockChapter.id!, {
        fileName: 'chapter-001.pdf',
        fileSize: 15420000,
        contentType: 'application/pdf',
      });

      expect(result.chapterId).toBe(mockChapter.id);
      expect(result.uploadId).toBeDefined();
      expect(result.versionId).toBeDefined();
      expect(result.objectKey).toBe(
        `chapters/${mockChapter.id}/versions/${result.versionId}/chapter.pdf`,
      );
      expect(result.storageKey).toBe(result.objectKey);
      expect(result.uploadUrl).toBe(
        'https://storage-mock.amazonaws.com/upload',
      );
      expect(result.expiresIn).toBe(600);
      expect(storageService.generatePresignedUploadUrl).toHaveBeenCalledWith({
        key: result.objectKey,
        contentType: 'application/pdf',
        expiresInSeconds: 600,
      });
      // Invariant: active chapter reference MUST NOT be saved or mutated during upload-url generation
      expect(chapterRepo.save).not.toHaveBeenCalled();
      expect(initialChapter.pdfStorageKey).toBe(mockChapter.pdfStorageKey);
    });

    it('should maintain active PDF reference during replacement until S3 verification succeeds', async () => {
      const oldStorageKey = 'chapters/c001/versions/v1/chapter.pdf';
      const activeChapter = {
        ...mockChapter,
        pdfStorageKey: oldStorageKey,
        contentStatus: ChapterContentStatus.READY,
      };
      chapterRepo.findOne.mockResolvedValue(activeChapter);

      // 1. Generate upload URL for version 2
      const uploadResult = await service.generateUploadUrl(mockChapter.id!, {
        fileName: 'chapter-v2.pdf',
        fileSize: 16000000,
        contentType: 'application/pdf',
      });

      // Assert active PDF is still old version
      expect(activeChapter.pdfStorageKey).toBe(oldStorageKey);
      expect(activeChapter.contentStatus).toBe(ChapterContentStatus.READY);
      expect(chapterRepo.save).not.toHaveBeenCalled();

      // 2. Complete upload for version 2
      storageService.headObject.mockResolvedValue({
        ContentType: 'application/pdf',
        ContentLength: 16000000,
      });

      const completeResult = await service.completePdfUpload(mockChapter.id!, {
        objectKey: uploadResult.objectKey,
        versionId: uploadResult.versionId,
        fileName: 'chapter-v2.pdf',
        fileSize: 16000000,
      });

      // Assert active PDF is now updated to version 2
      expect(completeResult.pdfStorageKey).toBe(uploadResult.objectKey);
      expect(completeResult.contentStatus).toBe(ChapterContentStatus.READY);
      expect(chapterRepo.save).toHaveBeenCalled();
    });

    it('should reject upload-url if chapter does not exist', async () => {
      chapterRepo.findOne.mockResolvedValue(null);

      await expect(
        service.generateUploadUrl('non-existent-id', {
          fileName: 'chapter-001.pdf',
          fileSize: 15420000,
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject upload-url if chapter is deleted', async () => {
      chapterRepo.findOne.mockResolvedValue({
        ...mockChapter,
        deletedAt: new Date(),
      });

      await expect(
        service.generateUploadUrl(mockChapter.id!, {
          fileName: 'chapter-001.pdf',
          fileSize: 15420000,
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject upload-url for non-PDF content type', async () => {
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      await expect(
        service.generateUploadUrl(mockChapter.id!, {
          fileName: 'malicious.exe',
          fileSize: 15420000,
          contentType: 'application/octet-stream',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject upload-url for oversized PDF', async () => {
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      await expect(
        service.generateUploadUrl(mockChapter.id!, {
          fileName: 'huge.pdf',
          fileSize: 300 * 1024 * 1024, // 300MB > 200MB
          contentType: 'application/pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should complete PDF upload and verify S3 object via HeadObject', async () => {
      const versionId = 'v0000000-0000-0000-0000-000000000001';
      const objectKey = `chapters/${mockChapter.id}/versions/${versionId}/chapter.pdf`;

      chapterRepo.findOne.mockResolvedValue({
        ...mockChapter,
        contentStatus: ChapterContentStatus.PENDING,
      });

      storageService.headObject.mockResolvedValue({
        ContentType: 'application/pdf',
        ContentLength: 15420000,
      });

      const result = await service.completePdfUpload(mockChapter.id!, {
        objectKey,
        versionId,
        fileName: 'chapter-001.pdf',
        fileSize: 15420000,
        pageCount: 47,
        checksum: 'checksum123',
      });

      expect(storageService.headObject).toHaveBeenCalledWith(objectKey);
      expect(result.contentStatus).toBe(ChapterContentStatus.READY);
      expect(result.pdfStorageKey).toBe(objectKey);
      expect(result.pdfFileSize).toBe(15420000);
      expect(result.pdfPageCount).toBe(47);
      expect(chapterRepo.save).toHaveBeenCalled();
    });

    it('should reject complete if S3 object does not belong to chapter', async () => {
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      await expect(
        service.completePdfUpload(mockChapter.id!, {
          objectKey: 'chapters/different-chapter-id/versions/v1/chapter.pdf',
          fileName: 'chapter-001.pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject complete if S3 HeadObject returns 404/NotFound', async () => {
      const objectKey = `chapters/${mockChapter.id}/versions/v1/chapter.pdf`;
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      const notFoundError: any = new Error('NotFound');
      notFoundError.name = 'NotFound';
      storageService.headObject.mockRejectedValue(notFoundError);

      await expect(
        service.completePdfUpload(mockChapter.id!, {
          objectKey,
          fileName: 'chapter-001.pdf',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should reject complete if S3 object ContentType is not application/pdf', async () => {
      const objectKey = `chapters/${mockChapter.id}/versions/v1/chapter.pdf`;
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      storageService.headObject.mockResolvedValue({
        ContentType: 'image/png',
        ContentLength: 500000,
      });

      await expect(
        service.completePdfUpload(mockChapter.id!, {
          objectKey,
          fileName: 'chapter-001.pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should reject complete if verified S3 object size exceeds limit', async () => {
      const objectKey = `chapters/${mockChapter.id}/versions/v1/chapter.pdf`;
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      storageService.headObject.mockResolvedValue({
        ContentType: 'application/pdf',
        ContentLength: 250 * 1024 * 1024, // 250MB
      });

      await expect(
        service.completePdfUpload(mockChapter.id!, {
          objectKey,
          fileName: 'chapter-001.pdf',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('getChapterAccess', () => {
    it('should return short-lived presigned GET URL for DB-linked storage key', async () => {
      chapterRepo.findOne.mockResolvedValue({ ...mockChapter });

      const result = await service.getChapterAccess(mockChapter.id!);

      expect(chapterRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockChapter.id },
      });
      expect(storageService.generatePresignedDownloadUrl).toHaveBeenCalledWith(
        mockChapter.pdfStorageKey,
        600,
      );
      expect(result.chapterId).toBe(mockChapter.id);
      expect(result.pdfUrl).toBe('https://storage-mock.amazonaws.com/download');
      expect(result.expiresIn).toBe(600);
      expect(result.fileName).toBe(mockChapter.pdfFileName);
    });

    it('should throw NotFoundException if chapter does not exist', async () => {
      chapterRepo.findOne.mockResolvedValue(null);

      await expect(service.getChapterAccess('non-existent-id')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw NotFoundException if chapter is unpublished for non-admin user', async () => {
      chapterRepo.findOne.mockResolvedValue({
        ...mockChapter,
        published: false,
      });

      await expect(
        service.getChapterAccess(mockChapter.id!, {
          userId: 'user-1',
          email: 'user@example.com',
          roles: ['USER'],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow admin user to access unpublished chapter', async () => {
      chapterRepo.findOne.mockResolvedValue({
        ...mockChapter,
        published: false,
      });

      const result = await service.getChapterAccess(mockChapter.id!, {
        userId: 'admin-1',
        email: 'admin@kuroyomi.com',
        roles: ['ADMIN'],
      });

      expect(result.chapterId).toBe(mockChapter.id);
      expect(result.pdfUrl).toBeDefined();
    });

    it('should throw NotFoundException if chapter has no active PDF key', async () => {
      chapterRepo.findOne.mockResolvedValue({
        ...mockChapter,
        pdfStorageKey: null,
        contentStatus: ChapterContentStatus.PENDING,
      });

      await expect(service.getChapterAccess(mockChapter.id!)).rejects.toThrow(
        NotFoundException,
      );
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
