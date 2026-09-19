import { Seeder } from './seeder.interface';
import { Category } from '../../catalog/entities/category.entity';
import { DataSource } from 'typeorm';
import defaultDataSource from '../data-source';

export class CategorySeeder implements Seeder {
  async run(dataSource: DataSource = defaultDataSource): Promise<void> {
    const categoryRepository = dataSource.getRepository(Category);

    const categoriesToSeed = [
      { name: 'Manga', slug: 'manga' },
      { name: 'Manhwa', slug: 'manhwa' },
      { name: 'Manhua', slug: 'manhua' },
      { name: 'Novel', slug: 'novel' },
      { name: 'Light Novel', slug: 'light-novel' },
    ];

    for (const catData of categoriesToSeed) {
      const existing = await categoryRepository.findOne({
        where: { slug: catData.slug },
      });

      if (!existing) {
        const newRecord = categoryRepository.create(catData);
        await categoryRepository.save(newRecord);
        console.log(`✅ [Seed] Created missing category: ${catData.name} (${catData.slug})`);
      } else {
        console.log(`ℹ️ [Seed] Category already exists: ${catData.name} (${catData.slug})`);
      }
    }
  }
}

if (
  require.main === module ||
  (process.argv[1] && process.argv[1].endsWith('category.seed.ts'))
) {
  void (async () => {
    console.log('🌱 Initializing Database for CategorySeeder...');
    await defaultDataSource.initialize();
    try {
      await new CategorySeeder().run(defaultDataSource);
      console.log('🌱 Seeding completed successfully!');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
    } finally {
      await defaultDataSource.destroy();
    }
  })();
}
