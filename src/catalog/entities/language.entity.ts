import {
  Column,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Book } from './book.entity';

@Entity({
  schema: 'catalog',
  name: 'languages',
})
export class Language extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 100,
    unique: true,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 10,
    unique: true,
  })
  @Index()
  code: string;

  @OneToMany(() => Book, (book) => book.language)
  books: Book[];
}
