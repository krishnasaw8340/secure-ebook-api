import { Seeder } from './seeder.interface';
import { Tag } from '../../catalog/entities/tag.entity';
import { DataSource } from 'typeorm';
import defaultDataSource from '../data-source';

export class TagSeeder implements Seeder {
  async run(dataSource: DataSource = defaultDataSource): Promise<void> {
    const tagRepository = dataSource.getRepository(Tag);

    const tagsToSeed = [
      { name: 'School', slug: 'school' },
      { name: 'Magic', slug: 'magic' },
      { name: 'Revenge', slug: 'revenge' },
      { name: 'Time Travel', slug: 'time-travel' },
      { name: 'Pirates', slug: 'pirates' },
      { name: 'Supernatural', slug: 'supernatural' },
    ];

    for (const tagData of tagsToSeed) {
      const existing = await tagRepository.findOne({
        where: { slug: tagData.slug },
      });

      if (!existing) {
        const newRecord = tagRepository.create(tagData);
        await tagRepository.save(newRecord);
        console.log(`✅ [Seed] Created missing tag: ${tagData.name} (${tagData.slug})`);
      } else {
        console.log(`ℹ️ [Seed] Tag already exists: ${tagData.name} (${tagData.slug})`);
      }
    }
  }
}

if (
  require.main === module ||
  (process.argv[1] && process.argv[1].endsWith('tag.seed.ts'))
) {
  void (async () => {
    console.log('🌱 Initializing Database for TagSeeder...');
    await defaultDataSource.initialize();
    try {
      await new TagSeeder().run(defaultDataSource);
      console.log('🌱 Seeding completed successfully!');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
    } finally {
      await defaultDataSource.destroy();
    }
  })();
}
