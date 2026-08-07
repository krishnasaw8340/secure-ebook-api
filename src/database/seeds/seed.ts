import dataSource from '../data-source';
import { RoleSeeder } from './role.seed';

async function main() {
    console.log('🌱 Starting database seeding (All)...');
    
    // Initialize the TypeORM DataSource
    await dataSource.initialize();

    try {
        // Register all seeders to execute
        const seeders = [
            new RoleSeeder(),
        ];

        for (const seeder of seeders) {
            console.log(`Running seeder: ${seeder.constructor.name}...`);
            await seeder.run();
        }

        console.log('🌱 All seeding completed successfully!');
    } catch (error) {
        console.error('❌ Seeding failed:', error);
    } finally {
        // Destroy the connection
        await dataSource.destroy();
    }
}

main();