import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CatalogService } from './catalog.service';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('catalog')
@Controller('catalog')
export class CatalogController {
  constructor(private readonly catalogService: CatalogService) {}

  @Public()
  @Get('languages')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of supported catalog languages' })
  @ApiResponse({ status: 200, description: 'List of languages' })
  async getLanguages() {
    return this.catalogService.getLanguages();
  }

  @Public()
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of catalog categories' })
  @ApiResponse({ status: 200, description: 'List of categories' })
  async getCategories() {
    return this.catalogService.getCategories();
  }

  @Public()
  @Get('genres')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of catalog genres' })
  @ApiResponse({ status: 200, description: 'List of genres' })
  async getGenres() {
    return this.catalogService.getGenres();
  }

  @Public()
  @Get('tags')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get list of catalog tags' })
  @ApiResponse({ status: 200, description: 'List of tags' })
  async getTags() {
    return this.catalogService.getTags();
  }

  @Public()
  @Get('metadata')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all catalog metadata (languages, categories, genres, tags)',
  })
  @ApiResponse({ status: 200, description: 'All catalog metadata' })
  async getMetadata() {
    return this.catalogService.getMetadata();
  }
}
