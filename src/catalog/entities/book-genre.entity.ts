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
import { Genre } from './genre.entity';

@Entity({
  schema: 'catalog',
  name: 'book_genres',
})
@Unique(['bookId', 'genreId'])
export class BookGenre extends BaseEntity {
  @Column({
    name: 'book_id',
    type: 'uuid',
  })
  @Index()
  bookId: string;

  @Column({
    name: 'genre_id',
    type: 'uuid',
  })
  @Index()
  genreId: string;

  @ManyToOne(() => Book, (book) => book.bookGenres, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'book_id',
  })
  book: Book;

  @ManyToOne(() => Genre, (genre) => genre.bookGenres, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'genre_id',
  })
  genre: Genre;
}
