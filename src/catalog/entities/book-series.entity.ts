import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { SeriesStatus } from '../../common/enums/series-status.enum';
import { Volume } from './volume.entity';
import { Book } from './book.entity';
import { MediaAsset } from './media-asset.entity';

@Entity({
  schema: 'catalog',
  name: 'book_series',
})
export class BookSeries extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 255,
  })
  name: string;

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
    type: 'enum',
    enum: SeriesStatus,
    default: SeriesStatus.DRAFT,
  })
  status: SeriesStatus;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

  @OneToMany(() => Volume, (volume) => volume.series)
  volumes: Volume[];

  @OneToMany(() => Book, (book) => book.series)
  books: Book[];

  @OneToMany(() => MediaAsset, (asset) => asset.series)
  mediaAssets: MediaAsset[];
}
