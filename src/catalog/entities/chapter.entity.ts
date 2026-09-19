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
import { ChapterPricingModel } from '../../common/enums/chapter-pricing-model.enum';
import { Book } from './book.entity';
import { Page } from './page.entity';

@Entity({
  schema: 'catalog',
  name: 'chapters',
})
@Index(['bookId', 'sortOrder'])
@Index(['bookId', 'chapterNumber'])
export class Chapter extends BaseEntity {
  @Column({
    name: 'book_id',
    type: 'uuid',
  })
  @Index()
  bookId: string;

  @ManyToOne(() => Book, (book) => book.chapters, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'book_id',
  })
  book: Book;

  @Column({
    name: 'chapter_number',
    type: 'decimal',
    precision: 6,
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => (value !== null && value !== undefined ? parseFloat(value) : value),
    },
  })
  chapterNumber: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  title?: string;

  @Column({
    name: 'sort_order',
    type: 'integer',
    default: 0,
  })
  sortOrder: number;

  @Column({
    name: 'pricing_model',
    type: 'enum',
    enum: ChapterPricingModel,
    default: ChapterPricingModel.FREE,
  })
  pricingModel: ChapterPricingModel;

  @Column({
    name: 'free_page_count',
    type: 'integer',
    default: 0,
  })
  freePageCount: number;

  @Column({
    name: 'coin_cost',
    type: 'integer',
    default: 0,
  })
  coinCost: number;

  @Column({
    name: 'page_count',
    type: 'integer',
    default: 0,
  })
  pageCount: number;

  @Column({
    type: 'boolean',
    default: false,
  })
  published: boolean;

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

  @OneToMany(() => Page, (page) => page.chapter)
  pages: Page[];
}
