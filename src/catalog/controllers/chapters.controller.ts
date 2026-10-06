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
  ChapterPdfUploadUrlDto,
  ChapterPdfUploadUrlResponseDto,
  ChapterPdfUploadInitDto,
  ChapterPdfUploadInitResponseDto,
  ChapterPdfUploadCompleteDto,
  ChapterAccessResponseDto,
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

  @Get(':id/access')
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Get authorized presigned access URL for chapter PDF (Authenticated users)',
  })
  @ApiParam({
    name: 'id',
    description: 'Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description:
      'Authorized temporary presigned PDF download URL and chapter metadata.',
    type: ChapterAccessResponseDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({
    status: 404,
    description: 'Chapter not found or PDF content not available.',
  })
  getChapterAccess(@Param('id') id: string, @CurrentUser() user?: JwtUser) {
    return this.chaptersService.getChapterAccess(id, user);
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

  @Post(':id/content/upload-url')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Generate S3 presigned PUT URL for direct browser PDF upload (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'S3 presigned PUT URL and immutable object key generated.',
    type: ChapterPdfUploadUrlResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file size, non-PDF content type, or chapter deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  generateUploadUrl(
    @Param('id') id: string,
    @Body() dto: ChapterPdfUploadUrlDto,
  ) {
    return this.chaptersService.generateUploadUrl(id, dto);
  }

  @Post(':id/content/upload-init')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Initialize chapter PDF direct upload contract (Admin only - alias for upload-url)',
  })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'Upload initiated with presigned contract and storage key.',
    type: ChapterPdfUploadInitResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  initPdfUpload(@Param('id') id: string, @Body() dto: ChapterPdfUploadInitDto) {
    return this.chaptersService.initPdfUpload(id, dto);
  }

  @Post(':id/content/complete')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Verify S3 PDF object and finalize Chapter metadata (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'Chapter PDF metadata verified and finalized.',
    type: ChapterItemDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Invalid object key, non-PDF Content-Type, or oversized object.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Chapter or S3 object not found.' })
  completePdfUpload(
    @Param('id') id: string,
    @Body() dto: ChapterPdfUploadCompleteDto,
  ) {
    return this.chaptersService.completePdfUpload(id, dto);
  }
}
