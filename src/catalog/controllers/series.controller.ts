import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { SeriesService } from '../services/series.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateSeriesDto,
  UpdateSeriesDto,
  QuerySeriesDto,
  PaginatedSeriesResponseDto,
  SeriesItemDto,
} from '../dto';

@ApiTags('Series')
@Controller('series')
export class SeriesController {
  constructor(private readonly seriesService: SeriesService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new franchise series (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Series created successfully.',
    type: SeriesItemDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 409, description: 'Series slug already exists.' })
  create(@Body() dto: CreateSeriesDto) {
    return this.seriesService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary:
      'List series with pagination, search, and visibility scoping (Public / Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of series.',
    type: PaginatedSeriesResponseDto,
  })
  findAll(@Query() query: QuerySeriesDto, @CurrentUser() user?: JwtUser) {
    return this.seriesService.findAll(query, user);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get single series by UUID or unique slug (Public / Admin)',
  })
  @ApiParam({
    name: 'id',
    description: 'Series UUID or slug (e.g. "one-piece")',
    example: 'one-piece',
  })
  @ApiResponse({
    status: 200,
    description: 'Series found.',
    type: SeriesItemDto,
  })
  @ApiResponse({ status: 404, description: 'Series not found.' })
  findOne(@Param('id') id: string, @CurrentUser() user?: JwtUser) {
    return this.seriesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update series details by UUID or slug (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Series UUID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Series updated successfully.',
    type: SeriesItemDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Series not found.' })
  @ApiResponse({ status: 409, description: 'Series slug conflict.' })
  update(@Param('id') id: string, @Body() dto: UpdateSeriesDto) {
    return this.seriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete series by UUID or slug (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Series UUID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Series soft-deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Series not found.' })
  remove(@Param('id') id: string) {
    return this.seriesService.remove(id);
  }
}
