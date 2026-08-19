import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Seeder } from './seeder.interface';
import { RoleSeeder } from './role.seed';

@Injectable()
export class DatabaseSeederService {
    private readonly logger = new Logger(DatabaseSeederService.name);

    constructor(private readonly dataSource: DataSource) {}

    /**
     * Runs all seeders to ensure baseline data exists in the database.
     * Each seeder checks for existing data and only inserts missing records.
     */
    async runSeeds(): Promise<void> {
        this.logger.log('🌱 Checking baseline database seed data...');

        const seeders: Seeder[] = [
            new RoleSeeder(),
            // Register future seeders here (e.g., DefaultAdminSeeder, CategorySeeder, etc.)
        ];

        for (const seeder of seeders) {
            const seederName = seeder.constructor.name;
            try {
                this.logger.log(`⏳ Executing seeder check: ${seederName}...`);
                await seeder.run(this.dataSource);
            } catch (error: any) {
                this.logger.warn(`⚠️ Seeder ${seederName} encountered an error: ${error.message}`);
            }
        }

        this.logger.log('✅ Baseline seed data check completed.');
    }
}
