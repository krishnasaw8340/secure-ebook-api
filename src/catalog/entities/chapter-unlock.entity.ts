import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Chapter } from './chapter.entity';
import { User } from '../../auth/entities/user.entity';

@Entity({
  schema: 'catalog',
  name: 'chapter_unlocks',
})
@Unique(['userId', 'chapterId'])
export class ChapterUnlock {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    name: 'user_id',
    type: 'uuid',
  })
  @Index()
  userId: string;

  @Column({
    name: 'chapter_id',
    type: 'uuid',
  })
  @Index()
  chapterId: string;

  @Column({
    name: 'coins_paid',
    type: 'integer',
    default: 0,
  })
  coinsPaid: number;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'COIN_PURCHASE',
  })
  source: string;

  @Column({
    name: 'unlocked_at',
    type: 'timestamptz',
    default: () => 'CURRENT_TIMESTAMP',
  })
  unlockedAt: Date;

  @CreateDateColumn({
    name: 'created_at',
    type: 'timestamptz',
  })
  createdAt: Date;

  @ManyToOne(() => Chapter, (chapter) => chapter.unlocks, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'chapter_id',
  })
  chapter: Chapter;

  @ManyToOne(() => User, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @JoinColumn({
    name: 'user_id',
  })
  user: User;
}
