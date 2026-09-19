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
import { VolumesService } from '../services/volumes.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateVolumeDto,
  UpdateVolumeDto,
  QueryVolumeDto,
  PaginatedVolumeResponseDto,
  VolumeItemDto,
} from '../dto';

@ApiTags('Volumes')
@Controller('volumes')
export class VolumesController {
  constructor(private readonly volumesService: VolumesService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new volume in a series (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Volume created successfully.',
    type: VolumeItemDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Parent Series not found.' })
  @ApiResponse({
    status: 409,
    description: 'Volume number already exists in this series.',
  })
  create(@Body() dto: CreateVolumeDto) {
    return this.volumesService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary:
      'List volumes with optional series filter, pagination, search, and visibility scoping (Public / Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of volumes.',
    type: PaginatedVolumeResponseDto,
  })
  findAll(@Query() query: QueryVolumeDto, @CurrentUser() user?: JwtUser) {
    return this.volumesService.findAll(query, user);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get single volume by UUID or slug with relations (Public / Admin)',
  })
  @ApiParam({
    name: 'id',
    description: 'Volume UUID or slug (e.g. "one-piece-vol-1")',
    example: 'one-piece-vol-1',
  })
  @ApiResponse({
    status: 200,
    description: 'Volume found.',
    type: VolumeItemDto,
  })
  @ApiResponse({ status: 404, description: 'Volume not found.' })
  findOne(@Param('id') id: string, @CurrentUser() user?: JwtUser) {
    return this.volumesService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update volume details by UUID or slug (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Volume UUID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Volume updated successfully.',
    type: VolumeItemDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({
    status: 404,
    description: 'Volume or target Series not found.',
  })
  @ApiResponse({ status: 409, description: 'Volume number conflict in series.' })
  update(@Param('id') id: string, @Body() dto: UpdateVolumeDto) {
    return this.volumesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete volume by UUID or slug (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Volume UUID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Volume soft-deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Volume not found.' })
  remove(@Param('id') id: string) {
    return this.volumesService.remove(id);
  }
}
