import {
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  Unique,
} from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { Chapter } from './chapter.entity';

@Entity({
  schema: 'catalog',
  name: 'pages',
})
@Unique(['chapterId', 'pageNumber'])
@Index(['chapterId', 'sortOrder'])
export class Page extends BaseEntity {
  @Column({
    name: 'chapter_id',
    type: 'uuid',
  })
  @Index()
  chapterId: string;

  @ManyToOne(() => Chapter, (chapter) => chapter.pages, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'chapter_id',
  })
  chapter: Chapter;

  @Column({
    name: 'page_number',
    type: 'integer',
  })
  pageNumber: number;

  @Column({
    name: 'sort_order',
    type: 'integer',
    default: 0,
  })
  @Index()
  sortOrder: number;

  @Column({
    name: 'storage_key',
    type: 'varchar',
    length: 500,
  })
  storageKey: string;

  @Column({
    name: 'encrypted_key',
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  encryptedKey?: string;

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
    type: 'varchar',
    length: 64,
    nullable: true,
  })
  checksum?: string;
}
