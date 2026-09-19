import { Seeder } from './seeder.interface';
import { Genre } from '../../catalog/entities/genre.entity';
import { DataSource } from 'typeorm';
import defaultDataSource from '../data-source';

export class GenreSeeder implements Seeder {
  async run(dataSource: DataSource = defaultDataSource): Promise<void> {
    const genreRepository = dataSource.getRepository(Genre);

    const genresToSeed = [
      { name: 'Action', slug: 'action' },
      { name: 'Adventure', slug: 'adventure' },
      { name: 'Comedy', slug: 'comedy' },
      { name: 'Drama', slug: 'drama' },
      { name: 'Fantasy', slug: 'fantasy' },
      { name: 'Romance', slug: 'romance' },
      { name: 'Horror', slug: 'horror' },
      { name: 'Mystery', slug: 'mystery' },
      { name: 'Sci-Fi', slug: 'sci-fi' },
    ];

    for (const genreData of genresToSeed) {
      const existing = await genreRepository.findOne({
        where: { slug: genreData.slug },
      });

      if (!existing) {
        const newRecord = genreRepository.create(genreData);
        await genreRepository.save(newRecord);
        console.log(`✅ [Seed] Created missing genre: ${genreData.name} (${genreData.slug})`);
      } else {
        console.log(`ℹ️ [Seed] Genre already exists: ${genreData.name} (${genreData.slug})`);
      }
    }
  }
}

if (
  require.main === module ||
  (process.argv[1] && process.argv[1].endsWith('genre.seed.ts'))
) {
  void (async () => {
    console.log('🌱 Initializing Database for GenreSeeder...');
    await defaultDataSource.initialize();
    try {
      await new GenreSeeder().run(defaultDataSource);
      console.log('🌱 Seeding completed successfully!');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
    } finally {
      await defaultDataSource.destroy();
    }
  })();
}
