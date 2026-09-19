import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { VolumesService } from './volumes.service';
import { Volume } from '../entities/volume.entity';
import { BookSeries } from '../entities/book-series.entity';
import { VolumeStatus } from '../../common/enums/volume-status.enum';
import { RoleType } from '../../common/enums/role.enum';

describe('VolumesService', () => {
  let service: VolumesService;
  let volumeRepo: any;
  let seriesRepo: any;

  const mockSeries: Partial<BookSeries> = {
    id: 'a0000000-0000-0000-0000-000000000001',
    name: 'One Piece',
    slug: 'one-piece',
  };

  const mockVolume: Partial<Volume> = {
    id: 'b0000000-0000-0000-0000-000000000001',
    seriesId: 'a0000000-0000-0000-0000-000000000001',
    volumeNumber: 1,
    title: 'Romance Dawn',
    slug: 'one-piece-vol-1',
    status: VolumeStatus.PUBLISHED,
    sortOrder: 10,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    volumeRepo = {
      findOne: jest.fn(),
      create: jest.fn((dto) => dto),
      save: jest.fn((entity) => Promise.resolve({ id: mockVolume.id, ...entity })),
      softDelete: jest.fn().mockResolvedValue({ affected: 1 }),
      createQueryBuilder: jest.fn(),
    };

    seriesRepo = {
      findOne: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VolumesService,
        {
          provide: getRepositoryToken(Volume),
          useValue: volumeRepo,
        },
        {
          provide: getRepositoryToken(BookSeries),
          useValue: seriesRepo,
        },
      ],
    }).compile();

    service = module.get<VolumesService>(VolumesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('should create volume when series exists and volumeNumber is unique', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      volumeRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        seriesId: mockSeries.id!,
        volumeNumber: 1,
        title: 'Romance Dawn',
      });

      expect(seriesRepo.findOne).toHaveBeenCalledWith({ where: { id: mockSeries.id } });
      expect(volumeRepo.findOne).toHaveBeenCalledWith({
        where: { seriesId: mockSeries.id, volumeNumber: 1 },
      });
      expect(result.slug).toBe('one-piece-vol-1');
      expect(result.volumeNumber).toBe(1);
    });

    it('should throw NotFoundException if parent Series does not exist', async () => {
      seriesRepo.findOne.mockResolvedValue(null);

      await expect(
        service.create({
          seriesId: 'non-existent-series',
          volumeNumber: 1,
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should throw ConflictException if volumeNumber already exists in the same series', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      volumeRepo.findOne.mockResolvedValue(mockVolume);

      await expect(
        service.create({
          seriesId: mockSeries.id!,
          volumeNumber: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should allow same volumeNumber in different series', async () => {
      const narutoSeries = { id: 'a0000000-0000-0000-0000-000000000002', name: 'Naruto', slug: 'naruto' };
      seriesRepo.findOne.mockResolvedValue(narutoSeries);
      volumeRepo.findOne.mockResolvedValue(null);

      const result = await service.create({
        seriesId: narutoSeries.id,
        volumeNumber: 1,
        title: 'Uzumaki Naruto',
      });

      expect(result.slug).toBe('naruto-vol-1');
      expect(result.volumeNumber).toBe(1);
    });

    it('should handle database unique constraint violation (code 23505)', async () => {
      seriesRepo.findOne.mockResolvedValue(mockSeries);
      volumeRepo.findOne.mockResolvedValue(null);
      volumeRepo.save.mockRejectedValueOnce({ code: '23505' });

      await expect(
        service.create({
          seriesId: mockSeries.id!,
          volumeNumber: 1,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('findAll', () => {
    it('should return published volumes for public request', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockVolume], 1]),
      };
      volumeRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findAll({
        page: 1,
        limit: 20,
        seriesId: mockSeries.id,
        sortBy: 'volumeNumber',
        sortOrder: 'ASC',
      });

      expect(qb.andWhere).toHaveBeenCalledWith('volume.status = :published', {
        published: VolumeStatus.PUBLISHED,
      });
      expect(qb.andWhere).toHaveBeenCalledWith('volume.seriesId = :seriesId', {
        seriesId: mockSeries.id,
      });
      expect(result.data.length).toBe(1);
      expect(result.meta.total).toBe(1);
    });

    it('should return empty pagination if public user requests draft status', async () => {
      const result = await service.findAll({
        page: 1,
        limit: 20,
        status: VolumeStatus.DRAFT,
        sortBy: 'volumeNumber',
        sortOrder: 'ASC',
      });

      expect(result.data).toEqual([]);
      expect(result.meta.total).toBe(0);
    });

    it('should allow admin to filter by any status and search', async () => {
      const qb: any = {
        andWhere: jest.fn().mockReturnThis(),
        orderBy: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        take: jest.fn().mockReturnThis(),
        getManyAndCount: jest.fn().mockResolvedValue([[mockVolume], 1]),
      };
      volumeRepo.createQueryBuilder.mockReturnValue(qb);

      const adminUser = { userId: 'u1', email: 'admin@kuroyomi.com', roles: [RoleType.ADMIN] };
      const result = await service.findAll(
        {
          page: 1,
          limit: 20,
          search: 'Romance',
          status: VolumeStatus.DRAFT,
          sortBy: 'title',
          sortOrder: 'ASC',
        },
        adminUser,
      );

      expect(qb.andWhere).toHaveBeenCalledWith('volume.status = :status', {
        status: VolumeStatus.DRAFT,
      });
      expect(result.data.length).toBe(1);
    });
  });

  describe('findOne', () => {
    it('should return published volume for public user', async () => {
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(mockVolume),
      };
      volumeRepo.createQueryBuilder.mockReturnValue(qb);

      const result = await service.findOne('one-piece-vol-1');
      expect(result.title).toBe('Romance Dawn');
    });

    it('should throw NotFoundException for non-admin on DRAFT volume', async () => {
      const draftVol = { ...mockVolume, status: VolumeStatus.DRAFT };
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(draftVol),
      };
      volumeRepo.createQueryBuilder.mockReturnValue(qb);

      await expect(service.findOne('one-piece-vol-1')).rejects.toThrow(NotFoundException);
    });

    it('should allow ADMIN to view DRAFT volume', async () => {
      const draftVol = { ...mockVolume, status: VolumeStatus.DRAFT };
      const qb: any = {
        leftJoinAndSelect: jest.fn().mockReturnThis(),
        where: jest.fn().mockReturnThis(),
        getOne: jest.fn().mockResolvedValue(draftVol),
      };
      volumeRepo.createQueryBuilder.mockReturnValue(qb);

      const adminUser = { userId: 'u1', email: 'admin@kuroyomi.com', roles: [RoleType.ADMIN] };
      const result = await service.findOne('one-piece-vol-1', adminUser);
      expect(result.status).toBe(VolumeStatus.DRAFT);
    });
  });

  describe('update', () => {
    it('should update volume fields successfully', async () => {
      volumeRepo.findOne.mockResolvedValue({ ...mockVolume });

      const result = await service.update(mockVolume.id!, {
        title: 'Updated Romance Dawn',
      });

      expect(result.title).toBe('Updated Romance Dawn');
    });

    it('should throw ConflictException if updated volumeNumber clashes with another volume in series', async () => {
      volumeRepo.findOne
        .mockResolvedValueOnce({ ...mockVolume }) // find by id
        .mockResolvedValueOnce({ id: 'other-vol-id', volumeNumber: 2 }); // collision check

      await expect(
        service.update(mockVolume.id!, {
          volumeNumber: 2,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should throw NotFoundException if new seriesId does not exist on update', async () => {
      volumeRepo.findOne.mockResolvedValueOnce({ ...mockVolume });
      seriesRepo.findOne.mockResolvedValueOnce(null);

      await expect(
        service.update(mockVolume.id!, {
          seriesId: 'non-existent-series-id',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should handle database unique constraint violation (code 23505) on update', async () => {
      volumeRepo.findOne.mockResolvedValueOnce({ ...mockVolume });
      volumeRepo.save.mockRejectedValueOnce({ code: '23505' });

      await expect(
        service.update(mockVolume.id!, {
          volumeNumber: 5,
        }),
      ).rejects.toThrow(ConflictException);
    });
  });

  describe('remove', () => {
    it('should soft delete volume', async () => {
      volumeRepo.findOne.mockResolvedValue(mockVolume);

      const result = await service.remove(mockVolume.id!);
      expect(volumeRepo.softDelete).toHaveBeenCalledWith(mockVolume.id);
      expect(result.message).toContain('deleted successfully');
    });
  });
});
