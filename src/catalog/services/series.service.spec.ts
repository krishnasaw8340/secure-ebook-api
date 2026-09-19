import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { SeriesService, generateSlug } from './series.service';
import { BookSeries } from '../entities/book-series.entity';
import { SeriesStatus } from '../../common/enums/series-status.enum';
import { RoleType } from '../../common/enums/role.enum';

describe('SeriesService', () => {
  let service: SeriesService;
  let repo: any;

  const mockSeries: Partial<BookSeries> = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'One Piece',
    slug: 'one-piece',
    description: 'Pirate manga',
    status: SeriesStatus.ONGOING,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    repo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: mockSeries.id, ...entity })),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SeriesService,
        {
          provide: getRepositoryToken(BookSeries),
          useValue: repo,
        },
      ],
    }).compile();

    service = module.get<SeriesService>(SeriesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('generateSlug', () => {
    it('should format strings into valid slugs', () => {
      expect(generateSlug('One Piece: Wano Arc!')).toBe('one-piece-wano-arc');
      expect(generateSlug('  Solo   Leveling  ')).toBe('solo-leveling');
    });
  });

  describe('create', () => {
    it('should create a series with auto-generated slug', async () => {
      repo.findOne.mockResolvedValue(null);

      const result = await service.create({
        name: 'One Piece',
        description: 'Pirate manga',
      });

      expect(repo.findOne).toHaveBeenCalledWith({ where: { slug: 'one-piece' } });
      expect(result.slug).toBe('one-piece');
      expect(result.status).toBe(SeriesStatus.DRAFT);
    });

    it('should throw ConflictException if slug already exists', async () => {
      repo.findOne.mockResolvedValue(mockSeries);

      await expect(
        service.create({
          name: 'One Piece',
          slug: 'one-piece',
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findOne', () => {
    it('should return series when accessible', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockSeries),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOne('one-piece');
      expect(result.name).toBe('One Piece');
    });

    it('should hide DRAFT series from public users', async () => {
      const draftSeries = { ...mockSeries, status: SeriesStatus.DRAFT };
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(draftSeries),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOne('one-piece')).rejects.toThrow(NotFoundException);
    });

    it('should allow ADMIN users to see DRAFT series', async () => {
      const draftSeries = { ...mockSeries, status: SeriesStatus.DRAFT };
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(draftSeries),
      };
      repo.createQueryBuilder.mockReturnValue(qb);

      const adminUser = { userId: 'u1', email: 'admin@kuroyomi.com', roles: [RoleType.ADMIN] };
      const result = await service.findOne('one-piece', adminUser);
      expect(result.status).toBe(SeriesStatus.DRAFT);
    });
  });

  describe('update', () => {
    it('should update series fields', async () => {
      repo.findOne.mockResolvedValue({ ...mockSeries });

      const result = await service.update(mockSeries.id!, {
        name: 'One Piece New Edition',
      });

      expect(result.name).toBe('One Piece New Edition');
    });
  });

  describe('remove', () => {
    it('should soft delete series', async () => {
      repo.findOne.mockResolvedValue(mockSeries);

      const result = await service.remove(mockSeries.id!);
      expect(repo.softDelete).toHaveBeenCalledWith(mockSeries.id);
      expect(result.message).toContain('deleted successfully');
    });
  });
});
