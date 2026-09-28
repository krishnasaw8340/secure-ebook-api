import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity({
  schema: 'reading',
  name: 'reading_progress',
})
@Index(['userId', 'bookId'])
@Index(['userId', 'chapterId'])
export class ReadingProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  userId: string;

  @Column({ name: 'book_id', type: 'uuid' })
  bookId: string;

  @Column({ name: 'chapter_id', type: 'uuid' })
  chapterId: string;

  @Column({
    name: 'progress_percent',
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) =>
        value !== null && value !== undefined ? parseFloat(value) : value,
    },
  })
  progressPercent: number;

  @Column({ name: 'last_pdf_page', type: 'integer', default: 1 })
  lastPdfPage: number;

  @Column({
    name: 'last_scroll_position',
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    transformer: {
      to: (value: number) => value,
      from: (value: string) =>
        value !== null && value !== undefined ? parseFloat(value) : value,
    },
  })
  lastScrollPosition: number;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt: Date;
}
