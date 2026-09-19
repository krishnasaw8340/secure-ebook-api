import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { VolumeStatus } from '../../common/enums/volume-status.enum';
import { BookSeries } from './book-series.entity';
import { Book } from './book.entity';
import { MediaAsset } from './media-asset.entity';

@Entity({
  schema: 'catalog',
  name: 'volumes',
})
@Unique(['seriesId', 'volumeNumber'])
@Index(['seriesId', 'sortOrder'])
export class Volume extends BaseEntity {
  @Column({
    name: 'series_id',
    type: 'uuid',
  })
  @Index()
  seriesId: string;

  @ManyToOne(() => BookSeries, (series) => series.volumes, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'series_id',
  })
  series: BookSeries;

  @Column({
    name: 'volume_number',
    type: 'decimal',
    precision: 5,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value !== null && value !== undefined ? parseFloat(value) : value),
    },
  })
  volumeNumber: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  title?: string;

  @Column({
    type: 'varchar',
    length: 255,
  })
  @Index()
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  description?: string;

  @Column({
    name: 'sort_order',
    type: 'integer',
    default: 0,
  })
  @Index()
  sortOrder: number;

  @Column({
    name: 'release_date',
    type: 'date',
    nullable: true,
  })
  releaseDate?: Date;

  @Column({
    type: 'enum',
    enum: VolumeStatus,
    default: VolumeStatus.DRAFT,
  })
  status: VolumeStatus;

  @Column({
    name: 'published_at',
    type: 'timestamptz',
    nullable: true,
  })
  publishedAt?: Date;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

  @OneToMany(() => Book, (book) => book.volume)
  books: Book[];

  @OneToMany(() => MediaAsset, (asset) => asset.volume)
  mediaAssets: MediaAsset[];
}
