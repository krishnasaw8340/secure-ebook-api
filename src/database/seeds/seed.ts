import dataSource from '../data-source';
import { RoleSeeder } from './role.seed';
import { LanguageSeeder } from './language.seed';
import { CategorySeeder } from './category.seed';
import { GenreSeeder } from './genre.seed';
import { TagSeeder } from './tag.seed';

async function main() {
  console.log('🌱 Starting database seeding (All)...');

  // Initialize the TypeORM DataSource
  await dataSource.initialize();

  try {
    // Register all seeders to execute
    const seeders = [
      new RoleSeeder(),
      new LanguageSeeder(),
      new CategorySeeder(),
      new GenreSeeder(),
      new TagSeeder(),
    ];

    for (const seeder of seeders) {
      console.log(`Running seeder: ${seeder.constructor.name}...`);
      await seeder.run(dataSource);
    }

    console.log('🌱 All seeding completed successfully!');
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  } finally {
    // Destroy the connection
    await dataSource.destroy();
  }
}

void main();
