import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
import { SeriesController } from './controllers/series.controller';
import { SeriesService } from './services/series.service';
import { VolumesController } from './controllers/volumes.controller';
import { VolumesService } from './services/volumes.service';
import { BooksController } from './controllers/books.controller';
import { BooksService } from './services/books.service';
import { ChaptersController } from './controllers/chapters.controller';
import { ChaptersService } from './services/chapters.service';
import {
  BookSeries,
  Volume,
  Book,
  Author,
  Artist,
  Genre,
  Tag,
  Category,
  Language,
  BookGenre,
  BookTag,
  Chapter,
  Page,
  MediaAsset,
} from './entities';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      BookSeries,
      Volume,
      Book,
      Author,
      Artist,
      Genre,
      Tag,
      Category,
      Language,
      BookGenre,
      BookTag,
      Chapter,
      Page,
      MediaAsset,
    ]),
  ],
  controllers: [
    CatalogController,
    SeriesController,
    VolumesController,
    BooksController,
    ChaptersController,
  ],
  providers: [
    CatalogService,
    SeriesService,
    VolumesService,
    BooksService,
    ChaptersService,
  ],
  exports: [
    TypeOrmModule,
    CatalogService,
    SeriesService,
    VolumesService,
    BooksService,
    ChaptersService,
  ],
})
export class CatalogModule {}
