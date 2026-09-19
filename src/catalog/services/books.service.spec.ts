import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
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
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';
import { RoleType } from '../../common/enums/role.enum';

describe('BooksService', () => {
  let service: BooksService;
  let bookRepo: any;
  let seriesRepo: any;
  let volumeRepo: any;
  let authorRepo: any;
  let artistRepo: any;
  let languageRepo: any;
  let categoryRepo: any;
  let genreRepo: any;
  let tagRepo: any;
  let bookGenreRepo: any;
  let bookTagRepo: any;

  const mockSeries = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'One Piece',
    slug: 'one-piece',
  };

  const mockVolume = {
    id: 'b0000000-0000-0000-0000-000000000001',
    seriesId: 'a0000000-0000-0000-0000-000000000001',
    volumeNumber: 1,
    title: 'Romance Dawn',
  };

  const mockLanguage = {
    id: 'l0000000-0000-0000-0000-000000000001',
    name: 'English',
    code: 'en',
  };

  const mockCategory = {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Manga',
    slug: 'manga',
  };

  const mockAuthor = {
    id: 'au000000-0000-0000-0000-000000000001',
    name: 'Eiichiro Oda',
    slug: 'eiichiro-oda',
  };

  const mockArtist = {
    id: 'ar000000-0000-0000-0000-000000000001',
    name: 'Eiichiro Oda',
    slug: 'eiichiro-oda',
  };

  const mockBook: Partial<Book> = {
    id: 'e0000000-0000-0000-0000-000000000001',
    seriesId: mockSeries.id,
    volumeId: mockVolume.id,
    title: 'One Piece, Vol. 1: Romance Dawn',
    slug: 'one-piece-vol-1-romance-dawn',
    languageId: mockLanguage.id,
    categoryId: mockCategory.id,
    authorId: mockAuthor.id,
    artistId: mockArtist.id,
    status: BookStatus.PUBLISHED,
    pricingModel: BookPricingModel.FREE,
    defaultCoinPerPage: 0,
    defaultFreeChapters: 3,
    defaultFreePages: 5,
    isPremium: false,
    totalChapters: 8,
    totalPages: 200,
    averageRating: 4.95,
    totalViews: 50000,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    bookRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) =>
        Promise.resolve({ id: mockBook.id, ...entity }),
      ),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };

    seriesRepo = { findOne: jest.fn() };
    volumeRepo = { findOne: jest.fn() };
    authorRepo = { findOne: jest.fn() };
    artistRepo = { findOne: jest.fn() };
    languageRepo = { findOne: jest.fn() };
    categoryRepo = { findOne: jest.fn() };
    genreRepo = { count: jest.fn() };
    tagRepo = { count: jest.fn() };
    bookGenreRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };
    bookTagRepo = {
      create: jest.fn((dto) => dto),
      save: jest.fn().mockResolvedValue([]),
      delete: jest.fn().mockResolvedValue({ affected: 1 }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BooksService,
        { provide: getRepositoryToken(Book), useValue: bookRepo },
        { provide: getRepositoryToken(BookSeries), useValue: seriesRepo },
        { provide: getRepositoryToken(Volume), useValue: volumeRepo },
        { provide: getRepositoryToken(Author), useValue: authorRepo },
        { provide: getRepositoryToken(Artist), useValue: artistRepo },
        { provide: getRepositoryToken(Language), useValue: languageRepo },
        { provide: getRepositoryToken(Category), useValue: categoryRepo },
        { provide: getRepositoryToken(Genre), useValue: genreRepo },
        { provide: getRepositoryToken(Tag), useValue: tagRepo },
        { provide: getRepositoryToken(BookGenre), useValue: bookGenreRepo },
        { provide: getRepositoryToken(BookTag), useValue: bookTagRepo },
      ],
    }).compile();

    service = module.get<BooksService>(BooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create book successfully with all verified relations', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      volumeRepo.findOne.mockResolvedValue(mockVolume);
      languageRepo.findOne.mockResolvedValue(mockLanguage);
      categoryRepo.findOne.mockResolvedValue(mockCategory);
      authorRepo.findOne.mockResolvedValue(mockAuthor);
      artistRepo.findOne.mockResolvedValue(mockArtist);
      genreRepo.count.mockResolvedValue(1);
      tagRepo.count.mockResolvedValue(1);
      bookRepo.findOne.mockResolvedValue(null);

      // Mock findOne for the return call
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBook),
      };
      bookRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.create({
        seriesId: mockSeries.id,
        volumeId: mockVolume.id,
        title: 'One Piece, Vol. 1: Romance Dawn',
        languageId: mockLanguage.id,
        categoryId: mockCategory.id,
        authorId: mockAuthor.id,
        artistId: mockArtist.id,
        genreIds: ['g1'],
        tagIds: ['t1'],
      });

      expect(seriesRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockSeries.id },
      });
      expect(volumeRepo.findOne).toHaveBeenCalledWith({
        where: { id: mockVolume.id },
      });
      expect(bookGenreRepo.save).toHaveBeenCalled();
      expect(bookTagRepo.save).toHaveBeenCalled();
      expect(result.id).toBe(mockBook.id);
    });

    it('should throw NotFoundException if Series does not exist', async () => {
      seriesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          seriesId: 'missing-series',
          title: 'Some Book',
          languageId: mockLanguage.id,
          categoryId: mockCategory.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw BadRequestException if Volume belongs to another series', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      volumeRepo.findOne.mockResolvedValue({
        id: 'vol-2',
        seriesId: 'other-series-id',
      });

      await expect(
        service.create({
          seriesId: mockSeries.id,
          volumeId: 'vol-2',
          title: 'Some Book',
          languageId: mockLanguage.id,
          categoryId: mockCategory.id,
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw NotFoundException if Language does not exist', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      languageRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          seriesId: mockSeries.id,
          title: 'Some Book',
          languageId: 'missing-lang',
          categoryId: mockCategory.id,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw NotFoundException if Category does not exist', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      languageRepo.findOne.mockResolvedValue(mockLanguage);
      categoryRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          seriesId: mockSeries.id,
          title: 'Some Book',
          languageId: mockLanguage.id,
          categoryId: 'missing-cat',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if slug already exists', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      languageRepo.findOne.mockResolvedValue(mockLanguage);
      categoryRepo.findOne.mockResolvedValue(mockCategory);
      bookRepo.findOne.mockResolvedValue(mockBook);

      await expect(
        service.create({
          seriesId: mockSeries.id,
          title: 'One Piece, Vol. 1: Romance Dawn',
          languageId: mockLanguage.id,
          categoryId: mockCategory.id,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should handle database unique constraint violation (code 23505)', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      languageRepo.findOne.mockResolvedValue(mockLanguage);
      categoryRepo.findOne.mockResolvedValue(mockCategory);
      bookRepo.findOne.mockResolvedValue(null);
      bookRepo.save.mockRejectedValueOnce({ code: '23505' });

      await expect(
        service.create({
          seriesId: mockSeries.id,
          title: 'One Piece, Vol. 1: Romance Dawn',
          languageId: mockLanguage.id,
          categoryId: mockCategory.id,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return published books for public user', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBook], 1]),
      };
      bookRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        seriesId: mockSeries.id,
        volumeId: mockVolume.id,
        languageId: mockLanguage.id,
        categoryId: mockCategory.id,
        sortBy: 'title',
        sortOrder: 'ASC',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('book.status = :published', {
        published: BookStatus.PUBLISHED,
      });
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty pagination if public user requests draft status', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        status: BookStatus.DRAFT,
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should allow admin to filter by any status and search', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        innerJoin: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockBook], 1]),
      };
      bookRepo.createQueryBuilder.mockReturnValue(qb);

      const adminUser = {
        userId: 'u1',
        email: 'admin@kuroyomi.com',
        roles: [RoleType.ADMIN],
      };
      const result = await service.findAll(
        {
          page: 1,
          limit: 20,
          search: 'Romance',
          status: BookStatus.DRAFT,
          isPremium: false,
          pricingModel: BookPricingModel.FREE,
          genreId: 'g1',
          tagId: 't1',
        },
        adminUser,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('book.status = :status', {
        status: BookStatus.DRAFT,
      });
      expect(result.data.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return published book for public user', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockBook),
      };
      bookRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOne('one-piece-vol-1-romance-dawn');
      expect(result.title).toBe(mockBook.title);
    });

    it('should throw NotFoundException for non-admin on DRAFT book', async () => {
      const draftBook = { ...mockBook, status: BookStatus.DRAFT };
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(draftBook),
      };
      bookRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(
        service.findOne('one-piece-vol-1-romance-dawn'),
      ).rejects.toThrow(NotFoundException);
    });

    it('should allow ADMIN to view DRAFT book', async () => {
      const draftBook = { ...mockBook, status: BookStatus.DRAFT };
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(draftBook),
      };
      bookRepo.createQueryBuilder.mockReturnValue(qb);

      const adminUser = {
        userId: 'u1',
        email: 'admin@kuroyomi.com',
        roles: [RoleType.ADMIN],
      };
      const result = await service.findOne(
        'one-piece-vol-1-romance-dawn',
        adminUser,
      );
      expect(result.status).toBe(BookStatus.DRAFT);
    });
  });

  describe('update', () => {
    it('should update book fields successfully', async () => {
      bookRepo.findOne.mockResolvedValue({ ...mockBook });
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue({
          ...mockBook,
          title: 'Updated Title',
        }),
      };
      bookRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.update(mockBook.id!, {
        title: 'Updated Title',
      });

      expect(result.title).toBe('Updated Title');
    });

    it('should throw BadRequestException if new volume belongs to another series', async () => {
      bookRepo.findOne.mockResolvedValue({ ...mockBook });
      volumeRepo.findOne.mockResolvedValue({
        id: 'vol-other',
        seriesId: 'different-series-id',
      });

      await expect(
        service.update(mockBook.id!, {
          volumeId: 'vol-other',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ConflictException if updated slug clashes with another book', async () => {
      bookRepo.findOne
        .mockResolvedValueOnce({ ...mockBook })
        .mockResolvedValueOnce({ id: 'other-book-id', slug: 'clashing-slug' });

      await expect(
        service.update(mockBook.id!, {
          slug: 'clashing-slug',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete book', async () => {
      bookRepo.findOne.mockResolvedValue(mockBook);

      const result = await service.remove(mockBook.id!);
      expect(bookRepo.softDelete).toHaveBeenCalledWith(mockBook.id);
      expect(result.message).toContain('deleted successfully');
    });
  });
});
