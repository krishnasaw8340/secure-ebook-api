import {
  Column,
  DeleteDateColumn,
  Entity,
  Index,
  OneToMany,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Book } from './book.entity';

@Entity({
  schema: 'catalog',
  name: 'authors',
})
export class Author extends BaseEntity {
  @Column({
    type: 'varchar',
    length: 150,
  })
  name: string;

  @Column({
    type: 'varchar',
    length: 150,
    unique: true,
  })
  @Index()
  slug: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  bio?: string;

  @Column({
    name: 'profile_image',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  profileImage?: string;

  @DeleteDateColumn({
    name: 'deleted_at',
    type: 'timestamptz',
    nullable: true,
  })
  deletedAt?: Date;

  @OneToMany(() => Book, (book) => book.author)
  books: Book[];
}
