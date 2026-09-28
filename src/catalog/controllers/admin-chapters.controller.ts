import { Body, Controller, Param, Post, UseGuards } from '@nestjs/common';
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
import { RoleType } from '../../common/enums/role.enum';
import {
  ChapterItemDto,
  ChapterPdfUploadUrlDto,
  ChapterPdfUploadUrlResponseDto,
  ChapterPdfUploadInitDto,
  ChapterPdfUploadInitResponseDto,
  ChapterPdfUploadCompleteDto,
} from '../dto';

@ApiTags('Admin Chapters')
@Controller('admin/chapters')
export class AdminChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post(':chapterId/content/upload-url')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Generate S3 presigned PUT URL for direct browser PDF upload (Admin endpoint)',
  })
  @ApiParam({ name: 'chapterId', description: 'Chapter UUID' })
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
    @Param('chapterId') chapterId: string,
    @Body() dto: ChapterPdfUploadUrlDto,
  ) {
    return this.chaptersService.generateUploadUrl(chapterId, dto);
  }

  @Post(':chapterId/content/upload-init')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Initialize chapter PDF direct upload contract (Admin endpoint)',
  })
  @ApiParam({ name: 'chapterId', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'Upload contract initialized.',
    type: ChapterPdfUploadInitResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  initPdfUpload(
    @Param('chapterId') chapterId: string,
    @Body() dto: ChapterPdfUploadInitDto,
  ) {
    return this.chaptersService.initPdfUpload(chapterId, dto);
  }

  @Post(':chapterId/content/complete')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary:
      'Complete chapter PDF upload and finalize metadata (Admin endpoint)',
  })
  @ApiParam({ name: 'chapterId', description: 'Chapter UUID' })
  @ApiResponse({
    status: 200,
    description: 'Chapter PDF metadata finalized.',
    type: ChapterItemDto,
  })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  completePdfUpload(
    @Param('chapterId') chapterId: string,
    @Body() dto: ChapterPdfUploadCompleteDto,
  ) {
    return this.chaptersService.completePdfUpload(chapterId, dto);
  }
}
