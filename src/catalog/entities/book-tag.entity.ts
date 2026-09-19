import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Book } from './book.entity';
import { Tag } from './tag.entity';

@Entity({
  schema: 'catalog',
  name: 'book_tags',
})
@Unique(['bookId', 'tagId'])
export class BookTag extends BaseEntity {
  @Column({
    name: 'book_id',
    type: 'uuid',
  })
  @Index()
  bookId: string;

  @Column({
    name: 'tag_id',
    type: 'uuid',
  })
  @Index()
  tagId: string;

  @ManyToOne(() => Book, (book) => book.bookTags, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'book_id',
  })
  book: Book;

  @ManyToOne(() => Tag, (tag) => tag.bookTags, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'tag_id',
  })
  tag: Tag;
}
