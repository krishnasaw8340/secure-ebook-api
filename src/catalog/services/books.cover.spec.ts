import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { BooksService } from './books.service';
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
import { StorageService } from '../../storage/storage.service';

describe('BooksService - cover upload', () => {
  const bookId = 'e0000000-0000-4000-8000-000000000001';
  let service: BooksService;
  let bookRepo: any;
  let storage: any;

  beforeEach(async () => {
    bookRepo = {
      findOne: jest.fn().mockResolvedValue({ id: bookId }),
      save: jest.fn((e) => Promise.resolve(e)),
      createQueryBuilder: jest.fn(),
    };
    storage = {
      generatePresignedDownloadUrl: jest.fn().mockResolvedValue('https://signed/get'),
      generatePresignedUploadUrl: jest.fn().mockResolvedValue('https://signed/put'),
      headObject: jest.fn(),
      getObjectHead: jest.fn(),
      getMaxBookCoverSizeBytes: jest.fn().mockReturnValue(10 * 1024 * 1024),
      getMaxBookCoverSizeMb: jest.fn().mockReturnValue(10),
    };
    const stub = { findOne: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: getRepositoryToken(Book), useValue: bookRepo },
        ...[BookSeries, Volume, Author, Artist, Language, Category, Genre, Tag, BookGenre, BookTag].map(
          (e) => ({ provide: getRepositoryToken(e), useValue: stub }),
        ),
        { provide: StorageService, useValue: storage },
      ],
    }).compile();
    service = moduleRef.get(BooksService);
  });

  it('issues presigned PUT with server-generated stable key', async () => {
    const res = await service.createCoverUploadUrl(bookId, {
      fileName: 'a.jpg',
      fileSize: 1000,
      contentType: 'image/jpeg',
    });
    expect(res.objectKey).toBe(`books/${bookId}/cover/cover`);
    expect(storage.generatePresignedUploadUrl).toHaveBeenCalledWith(
      expect.objectContaining({
        key: `books/${bookId}/cover/cover`,
        contentType: 'image/jpeg',
        expiresInSeconds: 600,
      }),
    );
  });

  it('rejects PDF, oversize and unknown/invalid book', async () => {
    const base = { fileName: 'a', fileSize: 10, contentType: 'image/jpeg' };
    await expect(
      service.createCoverUploadUrl(bookId, { ...base, contentType: 'application/pdf' }),
    ).rejects.toThrow(BadRequestException);
    await expect(
      service.createCoverUploadUrl(bookId, { ...base, fileSize: 11 * 1024 * 1024 }),
    ).rejects.toThrow(BadRequestException);
    await expect(service.createCoverUploadUrl('bad-id', base)).rejects.toThrow(NotFoundException);
    bookRepo.findOne.mockResolvedValue(null);
    await expect(service.createCoverUploadUrl(bookId, base)).rejects.toThrow(NotFoundException);
  });

  it('complete verifies HeadObject + magic bytes then stores metadata only', async () => {
    storage.headObject.mockResolvedValue({
      ContentType: 'image/jpeg',
      ContentLength: 245678,
      ETag: '"abc"',
    });
    storage.getObjectHead.mockResolvedValue(
      Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]),
    );
    bookRepo.createQueryBuilder.mockReturnValue({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      getOne: jest.fn().mockResolvedValue({ id: bookId, status: BookStatus.PUBLISHED }),
    });
    await service.completeCoverUpload(bookId, { fileName: 'a.jpg' });
    expect(bookRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({
        coverStorageKey: `books/${bookId}/cover/cover`,
        coverFileName: 'a.jpg',
        coverFileSize: 245678,
        coverContentType: 'image/jpeg',
        coverEtag: 'abc',
      }),
    );
  });

  it('complete rejects mismatching bytes, bad content-type and missing object', async () => {
    storage.headObject.mockResolvedValue({ ContentType: 'image/jpeg', ContentLength: 10 });
    storage.getObjectHead.mockResolvedValue(Buffer.from('%PDF-1.7 xxxxxx'));
    await expect(service.completeCoverUpload(bookId, { fileName: 'a.jpg' })).rejects.toThrow(
      BadRequestException,
    );
    storage.headObject.mockResolvedValue({ ContentType: 'application/pdf', ContentLength: 10 });
    await expect(service.completeCoverUpload(bookId, { fileName: 'a.jpg' })).rejects.toThrow(
      BadRequestException,
    );
    storage.headObject.mockRejectedValue({ name: 'NotFound' });
    await expect(service.completeCoverUpload(bookId, { fileName: 'a.jpg' })).rejects.toThrow(
      NotFoundException,
    );
  });
});
