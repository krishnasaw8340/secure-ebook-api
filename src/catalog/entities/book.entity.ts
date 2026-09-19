import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { BookStatus } from '../../common/enums/book-status.enum';
import { BookPricingModel } from '../../common/enums/book-pricing-model.enum';
import { BookSeries } from './book-series.entity';
import { Volume } from './volume.entity';
import { Author } from './author.entity';
import { Artist } from './artist.entity';
import { Language } from './language.entity';
import { Category } from './category.entity';
import { Chapter } from './chapter.entity';
import { BookGenre } from './book-genre.entity';
import { BookTag } from './book-tag.entity';
import { MediaAsset } from './media-asset.entity';

@Entity({
  schema: 'catalog',
  name: 'books',
})
export class Book extends BaseEntity {
  @Column({
    name: 'series_id',
    type: 'uuid',
  })
  @Index()
  seriesId: string;

  @ManyToOne(() => BookSeries, (series) => series.books, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({
    name: 'series_id',
  })
  series: BookSeries;

  @Column({
    name: 'volume_id',
    type: 'uuid',
    nullable: true,
  })
  @Index()
  volumeId?: string;

  @ManyToOne(() => Volume, (volume) => volume.books, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({
    name: 'volume_id',
  })
  volume?: Volume;

  @Column({
    type: 'varchar',
    length: 255,
  })
  title: string;

  @Column({
    name: 'japanese_title',
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  japaneseTitle?: string;

  @Column({
    type: 'varchar',
    length: 255,
    unique: true,
  })
  @Index()
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    name: 'author_id',
    type: 'uuid',
    nullable: true,
  })
  @Index()
  authorId?: string;

  @ManyToOne(() => Author, (author) => author.books, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({
    name: 'author_id',
  })
  author?: Author;

  @Column({
    name: 'artist_id',
    type: 'uuid',
    nullable: true,
  })
  @Index()
  artistId?: string;

  @ManyToOne(() => Artist, (artist) => artist.books, {
    onDelete: 'SET NULL',
    nullable: true,
  })
  @JoinColumn({
    name: 'artist_id',
  })
  artist?: Artist;

  @Column({
    name: 'language_id',
    type: 'uuid',
  })
  @Index()
  languageId: string;

  @ManyToOne(() => Language, (language) => language.books, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({
    name: 'language_id',
  })
  language: Language;

  @Column({
    name: 'category_id',
    type: 'uuid',
  })
  @Index()
  categoryId: string;

  @ManyToOne(() => Category, (category) => category.books, {
    onDelete: 'RESTRICT',
    nullable: false,
  })
  @JoinColumn({
    name: 'category_id',
  })
  category: Category;

  @Column({
    type: 'enum',
    enum: BookStatus,
    default: BookStatus.DRAFT,
  })
  status: BookStatus;

  @Column({
    name: 'pricing_model',
    type: 'enum',
    enum: BookPricingModel,
    default: BookPricingModel.FREE,
  })
  pricingModel: BookPricingModel;

  @Column({
    name: 'default_coin_per_page',
    type: 'integer',
    default: 0,
  })
  defaultCoinPerPage: number;

  @Column({
    name: 'default_free_chapters',
    type: 'integer',
    default: 0,
  })
  defaultFreeChapters: number;

  @Column({
    name: 'default_free_pages',
    type: 'integer',
    default: 0,
  })
  defaultFreePages: number;

  @Column({
    name: 'is_premium',
    type: 'boolean',
    default: false,
  })
  isPremium: boolean;

  @Column({
    name: 'total_chapters',
    type: 'integer',
    default: 0,
  })
  totalChapters: number;

  @Column({
    name: 'total_pages',
    type: 'integer',
    default: 0,
  })
  totalPages: number;

  @Column({
    name: 'average_rating',
    type: 'decimal',
    precision: 3,
    scale: 2,
    default: 0.0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value !== null && value !== undefined ? parseFloat(value) : value),
    },
  })
  averageRating: number;

  @Column({
    name: 'total_views',
    type: 'bigint',
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value !== null && value !== undefined ? parseInt(value, 10) : value),
    },
  })
  totalViews: number;

  @Column({
    name: 'release_date',
    type: 'date',
    nullable: true,
  })
  releaseDate?: Date;

  @Column({
    name: 'published_at',
    type: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  @Column({
    name: 'created_by',
    type: 'uuid',
    nullable: true,
  })
  @Index()
  createdBy?: string;

  @Column({
    name: 'updated_by',
    type: 'uuid',
    nullable: true,
  })
  updatedBy?: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

  @OneToMany(() => Chapter, (chapter) => chapter.book)
  chapters: Chapter[];

  @OneToMany(() => BookGenre, (bookGenre) => bookGenre.book)
  bookGenres: BookGenre[];

  @OneToMany(() => BookTag, (bookTag) => bookTag.book)
  bookTags: BookTag[];

  @OneToMany(() => MediaAsset, (asset) => asset.book)
  mediaAssets: MediaAsset[];
}
