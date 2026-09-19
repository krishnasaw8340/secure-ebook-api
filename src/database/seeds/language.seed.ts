import { Seeder } from './seeder.interface';
import { Language } from '../../catalog/entities/language.entity';
import { DataSource } from 'typeorm';
import defaultDataSource from '../data-source';

export class LanguageSeeder implements Seeder {
  async run(dataSource: DataSource = defaultDataSource): Promise<void> {
    const languageRepository = dataSource.getRepository(Language);

    const languagesToSeed = [
      { name: 'English', code: 'en' },
      { name: 'Japanese', code: 'ja' },
      { name: 'French', code: 'fr' },
      { name: 'German', code: 'de' },
    ];

    for (const langData of languagesToSeed) {
      const existing = await languageRepository.findOne({
        where: { code: langData.code },
      });

      if (!existing) {
        const newRecord = languageRepository.create(langData);
        await languageRepository.save(newRecord);
        console.log(`✅ [Seed] Created missing language: ${langData.name} (${langData.code})`);
      } else {
        console.log(`ℹ️ [Seed] Language already exists: ${langData.name} (${langData.code})`);
      }
    }
  }
}

if (
  require.main === module ||
  (process.argv[1] && process.argv[1].endsWith('language.seed.ts'))
) {
  void (async () => {
    console.log('🌱 Initializing Database for LanguageSeeder...');
    await defaultDataSource.initialize();
    try {
      await new LanguageSeeder().run(defaultDataSource);
      console.log('🌱 Seeding completed successfully!');
    } catch (error) {
      console.error('❌ Seeding failed:', error);
    } finally {
      await defaultDataSource.destroy();
    }
  })();
}
