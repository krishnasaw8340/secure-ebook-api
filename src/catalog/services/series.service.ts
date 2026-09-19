import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BookSeries } from '../entities/book-series.entity';
import { SeriesStatus } from '../../common/enums/series-status.enum';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateSeriesDto,
  UpdateSeriesDto,
  QuerySeriesDto,
  PaginatedSeriesResponseDto,
} from '../dto';

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

const PUBLIC_VISIBLE_STATUSES: SeriesStatus[] = [
  SeriesStatus.PUBLISHED,
  SeriesStatus.ONGOING,
  SeriesStatus.COMPLETED,
  SeriesStatus.HIATUS,
];

@Injectable()
export class SeriesService {
  constructor(
    @InjectRepository(BookSeries)
    private readonly seriesRepository: Repository<BookSeries>,
  ) {}

  /**
   * Helper to determine if user has administrative privileges
   */
  private isAdminUser(user?: JwtUser): boolean {
    if (!user || !user.roles) return false;
    return user.roles.some(
      (role) => role === RoleType.ADMIN || role === RoleType.SUPER_ADMIN,
    );
  }

  /**
   * Helper to check if a string is a standard UUID
   */
  private isUUID(value: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      value,
    );
  }

  /**
   * POST /series (ADMIN)
   * Create a new franchise series
   */
  async create(dto: CreateSeriesDto): Promise<BookSeries> {
    const slug = dto.slug ? dto.slug.trim().toLowerCase() : generateSlug(dto.name);

    if (!slug) {
      throw new ConflictException('Unable to generate a valid slug from series name');
    }

    const existing = await this.seriesRepository.findOne({
      where: { slug },
    });

    if (existing) {
      throw new ConflictException(`Series with slug "${slug}" already exists`);
    }

    const series = this.seriesRepository.create({
      name: dto.name.trim(),
      slug,
      description: dto.description?.trim(),
      status: dto.status ?? SeriesStatus.DRAFT,
    });

    return this.seriesRepository.save(series);
  }

  /**
   * GET /series (Public / Authenticated with visibility scoping)
   */
  async findAll(
    query: QuerySeriesDto,
    user?: JwtUser,
  ): Promise<PaginatedSeriesResponseDto> {
    const isAdmin = this.isAdminUser(user);
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    // If a non-admin requests a draft or archived status explicitly, return empty
    if (!isAdmin && query.status && !PUBLIC_VISIBLE_STATUSES.includes(query.status)) {
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

    const qb = this.seriesRepository.createQueryBuilder('series');

    // Apply visibility scoping
    if (isAdmin) {
      if (query.status) {
        qb.andWhere('series.status = :status', { status: query.status });
      }
    } else {
      if (query.status) {
        qb.andWhere('series.status = :status', { status: query.status });
      } else {
        qb.andWhere('series.status IN (:...publicStatuses)', {
          publicStatuses: PUBLIC_VISIBLE_STATUSES,
        });
      }
    }

    // Keyword search on name or description
    if (query.search) {
      const searchTerm = `%${query.search.trim()}%`;
      qb.andWhere(
        '(series.name ILIKE :searchTerm OR series.description ILIKE :searchTerm)',
        { searchTerm },
      );
    }

    // Dynamic ordering
    const sortField =
      query.sortBy === 'name'
        ? 'series.name'
        : query.sortBy === 'status'
          ? 'series.status'
          : 'series.createdAt';

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
   * GET /series/:id (Public / Authenticated)
   * Resolves by UUID or slug. Includes volumes and media assets.
   */
  async findOne(idOrSlug: string, user?: JwtUser): Promise<BookSeries> {
    const isAdmin = this.isAdminUser(user);
    const isUuid = this.isUUID(idOrSlug);

    const qb = this.seriesRepository
      .createQueryBuilder('series')
      .leftJoinAndSelect('series.volumes', 'volume')
      .leftJoinAndSelect('series.mediaAssets', 'mediaAsset')
      .orderBy('volume.sortOrder', 'ASC');

    if (isUuid) {
      qb.where('series.id = :id', { id: idOrSlug });
    } else {
      qb.where('series.slug = :slug', { slug: idOrSlug.toLowerCase() });
    }

    const series = await qb.getOne();

    if (!series) {
      throw new NotFoundException(`Series "${idOrSlug}" not found`);
    }

    // Enforce visibility for non-admin requests
    if (!isAdmin && !PUBLIC_VISIBLE_STATUSES.includes(series.status)) {
      throw new NotFoundException(`Series "${idOrSlug}" not found`);
    }

    return series;
  }

  /**
   * PATCH /series/:id (ADMIN)
   * Update series properties by ID or slug
   */
  async update(idOrSlug: string, dto: UpdateSeriesDto): Promise<BookSeries> {
    const isUuid = this.isUUID(idOrSlug);
    const series = await this.seriesRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug.toLowerCase() },
    });

    if (!series) {
      throw new NotFoundException(`Series "${idOrSlug}" not found`);
    }

    // Slug conflict check if slug is changing
    if (dto.slug) {
      const newSlug = dto.slug.trim().toLowerCase();
      if (newSlug !== series.slug) {
        const existing = await this.seriesRepository.findOne({
          where: { slug: newSlug },
        });

        if (existing && existing.id !== series.id) {
          throw new ConflictException(
            `Series with slug "${newSlug}" already exists`,
          );
        }
        series.slug = newSlug;
      }
    }

    if (dto.name !== undefined) {
      series.name = dto.name.trim();
    }

    if (dto.description !== undefined) {
      series.description = dto.description?.trim();
    }

    if (dto.status !== undefined) {
      series.status = dto.status;
    }

    return this.seriesRepository.save(series);
  }

  /**
   * DELETE /series/:id (ADMIN)
   * Soft-delete series by ID or slug
   */
  async remove(idOrSlug: string): Promise<{ message: string; id: string }> {
    const isUuid = this.isUUID(idOrSlug);
    const series = await this.seriesRepository.findOne({
      where: isUuid ? { id: idOrSlug } : { slug: idOrSlug.toLowerCase() },
    });

    if (!series) {
      throw new NotFoundException(`Series "${idOrSlug}" not found`);
    }

    await this.seriesRepository.softDelete(series.id);

    return {
      message: 'Series deleted successfully',
      id: series.id,
    };
  }
}
