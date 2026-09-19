import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Volume } from '../entities/volume.entity';
import { BookSeries } from '../entities/book-series.entity';
import { VolumeStatus } from '../../common/enums/volume-status.enum';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateVolumeDto,
  UpdateVolumeDto,
  QueryVolumeDto,
  PaginatedVolumeResponseDto,
} from '../dto';
import { generateSlug } from './series.service';

@Injectable()
export class VolumesService {
  constructor(
    @InjectRepository(Volume)
    private readonly volumeRepository: Repository<Volume>,
    @InjectRepository(BookSeries)
    private readonly seriesRepository: Repository<BookSeries>,
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
   * POST /volumes (ADMIN)
   * Create a new volume under a franchise series
   */
  async create(dto: CreateVolumeDto): Promise<Volume> {
    // 1. Verify parent Series exists
    const series = await this.seriesRepository.findOne({
      where: { id: dto.seriesId },
    });

    if (!series) {
      throw new NotFoundException(`Series with ID "${dto.seriesId}" not found`);
    }

    // 2. Verify volume number uniqueness within the series
    const existingVolume = await this.volumeRepository.findOne({
      where: { seriesId: dto.seriesId, volumeNumber: dto.volumeNumber },
    });

    if (existingVolume) {
      throw new ConflictException(
        `Volume ${dto.volumeNumber} already exists in series "${series.name}"`,
      );
    }

    // 3. Generate slug if not provided
    const slug = dto.slug
      ? dto.slug.trim().toLowerCase()
      : generateSlug(`${series.slug}-vol-${dto.volumeNumber}`);

    const sortOrder =
      dto.sortOrder !== undefined
        ? dto.sortOrder
        : Math.round(dto.volumeNumber * 10);

    let publishedAt: Date | undefined;
    if (dto.publishedAt) {
      publishedAt = new Date(dto.publishedAt);
    } else if (dto.status === VolumeStatus.PUBLISHED) {
      publishedAt = new Date();
    }

    const volume = this.volumeRepository.create({
      seriesId: dto.seriesId,
      volumeNumber: dto.volumeNumber,
      title: dto.title?.trim(),
      slug,
      description: dto.description?.trim(),
      sortOrder,
      releaseDate: dto.releaseDate ? new Date(dto.releaseDate) : undefined,
      status: dto.status ?? VolumeStatus.DRAFT,
      publishedAt,
    });

    try {
      return await this.volumeRepository.save(volume);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          `Volume ${dto.volumeNumber} already exists in series "${series.name}"`,
        );
      }
      throw error;
    }
  }

  /**
   * GET /volumes (Public / Authenticated with visibility scoping)
   */
  async findAll(
    query: QueryVolumeDto,
    user?: JwtUser,
  ): Promise<PaginatedVolumeResponseDto> {
    const isAdmin = this.isAdminUser(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // Non-admin users cannot query draft or archived volumes
    if (!isAdmin && query.status && query.status !== VolumeStatus.PUBLISHED) {
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

    const qb = this.volumeRepository.createQueryBuilder('volume');

    // Apply visibility scoping
    if (isAdmin) {
      if (query.status) {
        qb.andWhere('volume.status = :status', { status: query.status });
      }
    } else {
      qb.andWhere('volume.status = :published', {
        published: VolumeStatus.PUBLISHED,
      });
    }

    // Filter by series if provided
    if (query.seriesId) {
      qb.andWhere('volume.seriesId = :seriesId', {
        seriesId: query.seriesId,
      });
    }

    // Fuzzy search on title or description
    if (query.search) {
      const searchTerm = `%${query.search.trim()}%`;
      qb.andWhere(
        '(volume.title ILIKE :searchTerm OR volume.description ILIKE :searchTerm)',
        { searchTerm },
      );
    }

    // Sorting
    const sortField =
      query.sortBy === 'volumeNumber'
        ? 'volume.volumeNumber'
        : query.sortBy === 'title'
          ? 'volume.title'
          : query.sortBy === 'createdAt'
            ? 'volume.createdAt'
            : 'volume.sortOrder';

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
   * GET /volumes/:id (Public / Authenticated)
   */
  async findOne(idOrSlug: string, user?: JwtUser): Promise<Volume> {
    const isAdmin = this.isAdminUser(user);
    const isUuid = this.isUUID(idOrSlug);

    const qb = this.volumeRepository
      .createQueryBuilder('volume')
      .leftJoinAndSelect('volume.series', 'series')
      .leftJoinAndSelect('volume.books', 'book')
      .leftJoinAndSelect('volume.mediaAssets', 'mediaAsset');

    if (isUuid) {
      qb.where('volume.id = :id', { id: idOrSlug });
    } else {
      qb.where('volume.slug = :slug', { slug: idOrSlug.toLowerCase() });
    }

    const volume = await qb.getOne();

    if (!volume) {
      throw new NotFoundException(`Volume "${idOrSlug}" not found`);
    }

    if (!isAdmin && volume.status !== VolumeStatus.PUBLISHED) {
      throw new NotFoundException(`Volume "${idOrSlug}" not found`);
    }

    return volume;
  }

  /**
   * PATCH /volumes/:id (ADMIN)
   */
  async update(idOrSlug: string, dto: UpdateVolumeDto): Promise<Volume> {
    const isUuid = this.isUUID(idOrSlug);
    const volume = await this.volumeRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug.toLowerCase() },
    });

    if (!volume) {
      throw new NotFoundException(`Volume "${idOrSlug}" not found`);
    }

    // If seriesId is being updated, verify target series exists
    if (dto.seriesId && dto.seriesId !== volume.seriesId) {
      const targetSeries = await this.seriesRepository.findOne({
        where: { id: dto.seriesId },
      });
      if (!targetSeries) {
        throw new NotFoundException(`Series with ID "${dto.seriesId}" not found`);
      }
    }

    // Check volume number conflict if volumeNumber or seriesId is changing
    const targetSeriesId = dto.seriesId ?? volume.seriesId;
    const targetVolumeNumber = dto.volumeNumber ?? volume.volumeNumber;

    if (
      targetSeriesId !== volume.seriesId ||
      targetVolumeNumber !== volume.volumeNumber
    ) {
      const existing = await this.volumeRepository.findOne({
        where: {
          seriesId: targetSeriesId,
          volumeNumber: targetVolumeNumber,
        },
      });

      if (existing && existing.id !== volume.id) {
        throw new ConflictException(
          `Volume ${targetVolumeNumber} already exists in target series`,
        );
      }
    }

    if (dto.seriesId !== undefined) {
      volume.seriesId = dto.seriesId;
    }

    if (dto.volumeNumber !== undefined) {
      volume.volumeNumber = dto.volumeNumber;
    }

    if (dto.title !== undefined) {
      volume.title = dto.title?.trim();
    }

    if (dto.slug !== undefined) {
      volume.slug = dto.slug.trim().toLowerCase();
    }

    if (dto.description !== undefined) {
      volume.description = dto.description?.trim();
    }

    if (dto.sortOrder !== undefined) {
      volume.sortOrder = dto.sortOrder;
    }

    if (dto.releaseDate !== undefined) {
      volume.releaseDate = dto.releaseDate ? new Date(dto.releaseDate) : undefined;
    }

    if (dto.status !== undefined) {
      volume.status = dto.status;
      if (volume.status === VolumeStatus.PUBLISHED && !volume.publishedAt && !dto.publishedAt) {
        volume.publishedAt = new Date();
      }
    }

    if (dto.publishedAt !== undefined) {
      volume.publishedAt = dto.publishedAt ? new Date(dto.publishedAt) : undefined;
    }

    try {
      return await this.volumeRepository.save(volume);
    } catch (error: any) {
      if (error?.code === '23505') {
        throw new ConflictException(
          `Volume ${targetVolumeNumber} already exists in target series`,
        );
      }
      throw error;
    }
  }

  /**
   * DELETE /volumes/:id (ADMIN)
   * Soft-delete volume by ID or slug
   */
  async remove(idOrSlug: string): Promise<{ message: string; id: string }> {
    const isUuid = this.isUUID(idOrSlug);
    const volume = await this.volumeRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug.toLowerCase() },
    });

    if (!volume) {
      throw new NotFoundException(`Volume "${idOrSlug}" not found`);
    }

    await this.volumeRepository.softDelete(volume.id);

    return {
      message: 'Volume deleted successfully',
      id: volume.id,
    };
  }
}
