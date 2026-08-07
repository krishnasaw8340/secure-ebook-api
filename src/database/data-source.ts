// Why do we need data-source.ts?

// NestJS uses:

// TypeOrmModule.forRootAsync()

// But the TypeORM CLI cannot use your NestJS modules.

// When you run:

// pnpm typeorm migration:generate

// TypeORM needs a standalone configuration.

// That's what data-source.ts is for.

import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Use __dirname to find the root directory of the application relative to this file.
// This is more reliable than process.cwd() when running scripts via CLI tools.
const envPath = resolve(__dirname, '../../', `.env.${process.env.NODE_ENV || 'development'}`);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.warn(`⚠️ Could not load environment file from ${envPath}:`, result.error.message);
}

import { DataSource } from 'typeorm';

export default new DataSource({
    type: 'postgres',

    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,

    synchronize: false,
    logging: true,

    entities: ['src/**/*.entity.ts'],
    migrations: ['src/database/migrations/*.ts'],
});