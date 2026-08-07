import * as dotenv from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), `.env.${process.env.NODE_ENV || 'development'}`);
console.log('Env Path:', envPath);
console.log('cwd:', process.cwd());

const res = dotenv.config({ path: envPath });
console.log('Result:', res);
console.log('Process env:', {
    DB_HOST: process.env.DB_HOST,
    DB_PORT: process.env.DB_PORT,
    DB_USERNAME: process.env.DB_USERNAME,
    DB_PASSWORD: process.env.DB_PASSWORD,
    DB_NAME: process.env.DB_NAME
});
