import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { PagesService } from '../services/pages.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { RoleType } from '../../common/enums/role.enum';
import {
  CreatePagesDto,
  ReorderPagesDto,
  PageResponseDto,
} from '../dto';

@ApiTags('Pages')
@Controller()
export class PagesController {
  constructor(private readonly pagesService: PagesService) {}

  @Get('chapters/:chapterId/pages')
  @Public()
  @ApiOperation({
    summary: 'List all pages for a chapter ordered by page sequence (Public)',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pages in reading sequence.',
    type: [PageResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  getByChapter(@Param('chapterId') chapterId: string) {
    return this.pagesService.getByChapter(chapterId);
  }

  @Post('chapters/:chapterId/pages')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Bulk upload / register scan pages for a chapter (Admin only)',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @ApiResponse({
    status: 201,
    description: 'Pages registered successfully.',
    type: [PageResponseDto],
  })
  @ApiResponse({ status: 400, description: 'Validation failed.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  createPages(
    @Param('chapterId') chapterId: string,
    @Body() dto: CreatePagesDto,
  ) {
    return this.pagesService.createPages(chapterId, dto);
  }

  @Put('chapters/:chapterId/pages/reorder')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Reorder pages within a chapter (Admin only)',
  })
  @ApiParam({
    name: 'chapterId',
    description: 'Chapter UUID',
    example: 'c0000000-0000-0000-0000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Pages reordered successfully.',
    type: [PageResponseDto],
  })
  @ApiResponse({
    status: 400,
    description: 'Validation failed or pageId does not belong to chapter.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Chapter not found.' })
  reorder(
    @Param('chapterId') chapterId: string,
    @Body() dto: ReorderPagesDto,
  ) {
    return this.pagesService.reorderPages(chapterId, dto);
  }

  @Get('pages/:id')
  @Public()
  @ApiOperation({
    summary: 'Get single page metadata by UUID (Public)',
  })
  @ApiParam({
    name: 'id',
    description: 'Page UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Page metadata found.',
    type: PageResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Page not found.' })
  getById(@Param('id') id: string) {
    return this.pagesService.getById(id);
  }

  @Delete('pages/:id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete page by UUID (Admin only)',
  })
  @ApiParam({
    name: 'id',
    description: 'Page UUID',
    example: 'a0000000-0000-0000-0000-000000000001',
  })
  @ApiResponse({
    status: 200,
    description: 'Page deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Page not found.' })
  remove(@Param('id') id: string) {
    return this.pagesService.remove(id);
  }

  @Get('pages')
  @Public()
  @ApiOperation({
    summary: 'Query pages with optional chapterId filter (Public)',
  })
  @ApiQuery({
    name: 'chapterId',
    required: false,
    description: 'Chapter UUID filter',
  })
  @ApiResponse({
    status: 200,
    description: 'List of pages matching query.',
    type: [PageResponseDto],
  })
  findByQuery(@Query('chapterId') chapterId?: string) {
    if (chapterId) {
      return this.pagesService.getByChapter(chapterId);
    }
    return [];
  }
}
