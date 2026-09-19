import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { MediaAssetType } from '../../common/enums/media-asset-type.enum';
import { BookSeries } from './book-series.entity';
import { Volume } from './volume.entity';
import { Book } from './book.entity';

@Entity({
  schema: 'catalog',
  name: 'media_assets',
})
export class MediaAsset extends BaseEntity {
  @Column({
    name: 'asset_type',
    type: 'enum',
    enum: MediaAssetType,
  })
  assetType: MediaAssetType;

  @Column({
    name: 'storage_key',
    type: 'varchar',
    length: 500,
  })
  storageKey: string;

  @Column({
    name: 'mime_type',
    type: 'varchar',
    length: 50,
    nullable: true,
  })
  mimeType?: string;

  @Column({
    name: 'file_size',
    type: 'integer',
    nullable: true,
  })
  fileSize?: number;

  @Column({
    type: 'integer',
    nullable: true,
  })
  width?: number;

  @Column({
    type: 'integer',
    nullable: true,
  })
  height?: number;

  @Column({
    name: 'sort_order',
    type: 'integer',
    default: 0,
  })
  sortOrder: number;

  @Column({
    name: 'alt_text',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  altText?: string;

  @Column({
    name: 'series_id',
    type: 'uuid',
    nullable: true,
  })
  @Index()
  seriesId?: string;

  @ManyToOne(() => BookSeries, (series) => series.mediaAssets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({
    name: 'series_id',
  })
  series?: BookSeries;

  @Column({
    name: 'volume_id',
    type: 'uuid',
    nullable: true,
  })
  @Index()
  volumeId?: string;

  @ManyToOne(() => Volume, (volume) => volume.mediaAssets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({
    name: 'volume_id',
  })
  volume?: Volume;

  @Column({
    name: 'book_id',
    type: 'uuid',
    nullable: true,
  })
  @Index()
  bookId?: string;

  @ManyToOne(() => Book, (book) => book.mediaAssets, {
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn({
    name: 'book_id',
  })
  book?: Book;
}
