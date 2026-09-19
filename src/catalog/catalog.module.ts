import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogController } from './catalog.controller';
import { CatalogService } from './catalog.service';
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
  controllers: [CatalogController],
  providers: [CatalogService],
  exports: [TypeOrmModule, CatalogService],
})
export class CatalogModule {}
