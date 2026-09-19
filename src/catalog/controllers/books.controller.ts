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
import { BooksService } from '../services/books.service';
import { Roles } from '../../auth/decorators/roles.decorator';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Public } from '../../auth/decorators/public.decorator';
import { CurrentUser } from '../../auth/decorators/current-user.decorator';
import { RoleType } from '../../common/enums/role.enum';
import type { JwtUser } from '../../auth/interfaces/jwt-user.interface';
import {
  CreateBookDto,
  UpdateBookDto,
  QueryBookDto,
  PaginatedBookResponseDto,
  BookItemDto,
} from '../dto';

@ApiTags('Books')
@Controller('books')
export class BooksController {
  constructor(private readonly booksService: BooksService) {}

  @Post()
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new catalog book with relations (Admin only)' })
  @ApiResponse({
    status: 201,
    description: 'Book created successfully.',
    type: BookItemDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed or volume mismatch with series.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Referenced Series, Volume, Language, Category, Author, Artist, Genre, or Tag not found.' })
  @ApiResponse({ status: 409, description: 'Book slug already exists.' })
  create(@Body() dto: CreateBookDto, @CurrentUser() user?: JwtUser) {
    return this.booksService.create(dto, user);
  }

  @Get()
  @Public()
  @ApiOperation({
    summary:
      'List books with multi-field filtering, search, pagination, and visibility scoping (Public / Admin)',
  })
  @ApiResponse({
    status: 200,
    description: 'Paginated list of books.',
    type: PaginatedBookResponseDto,
  })
  findAll(@Query() query: QueryBookDto, @CurrentUser() user?: JwtUser) {
    return this.booksService.findAll(query, user);
  }

  @Get(':id')
  @Public()
  @ApiOperation({
    summary: 'Get single book by UUID or unique slug with joined relations (Public / Admin)',
  })
  @ApiParam({
    name: 'id',
    description: 'Book UUID or slug (e.g. "one-piece-vol-1-romance-dawn")',
    example: 'one-piece-vol-1-romance-dawn',
  })
  @ApiResponse({
    status: 200,
    description: 'Book found.',
    type: BookItemDto,
  })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  findOne(@Param('id') id: string, @CurrentUser() user?: JwtUser) {
    return this.booksService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Update book details or relational associations by UUID or slug (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Book UUID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Book updated successfully.',
    type: BookItemDto,
  })
  @ApiResponse({ status: 400, description: 'Validation failed or volume mismatch.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Book or referenced entity not found.' })
  @ApiResponse({ status: 409, description: 'Book slug conflict.' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateBookDto,
    @CurrentUser() user?: JwtUser,
  ) {
    return this.booksService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
  @UseGuards(RolesGuard)
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Soft-delete book by UUID or slug (Admin only)',
  })
  @ApiParam({ name: 'id', description: 'Book UUID or slug' })
  @ApiResponse({
    status: 200,
    description: 'Book soft-deleted successfully.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 403, description: 'Forbidden. Admin role required.' })
  @ApiResponse({ status: 404, description: 'Book not found.' })
  remove(@Param('id') id: string) {
    return this.booksService.remove(id);
  }
}
