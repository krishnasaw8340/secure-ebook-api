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
import { ChaptersService } from '../services/chapters.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateChapterDto,
  UpdateChapterDto,
  QueryChapterDto,
  PaginatedChapterResponseDto,
  ChapterItemDto,
} from '../dto';

@ApiTags('Chapters')
@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new chapter for a book (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Chapter created successfully.',
    type: ChapterItemDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or pricing model constraint violated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Parent Book not found.' })
  @ApiResponse({
    status: 409,
    description: 'Chapter number already exists in this book.',
  })
  create(@Body() dto: CreateChapterDto) {
    return this.chaptersService.create(dto);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary:
      'List chapters with optional book filter, pricing filter, pagination, and visibility scoping (Public / Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of chapters.',
    type: PaginatedChapterResponseDto,
  })
  findAll(@Query() query: QueryChapterDto, @CurrentUser() user?: JwtUser) {
    return this.chaptersService.findAll(query, user);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get single chapter by UUID with book details (Public / Admin)',
  })
  @ApiParam({
    name: 'id',
    description: 'Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Chapter found.',
    type: ChapterItemDto,
  })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  findOne(@Param('id') id: string, @CurrentUser() user?: JwtUser) {
    return this.chaptersService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update chapter details or pricing by UUID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'Chapter updated successfully.',
    type: ChapterItemDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or pricing model constraint violated.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({
    status: 404,
    description: 'Chapter or target Book not found.',
  })
  @ApiResponse({
    status: 409,
    description: 'Chapter number conflict in target book.',
  })
  update(@Param('id') id: string, @Body() dto: UpdateChapterDto) {
    return this.chaptersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete chapter by UUID (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'Chapter soft-deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  remove(@Param('id') id: string) {
    return this.chaptersService.remove(id);
  }
}
