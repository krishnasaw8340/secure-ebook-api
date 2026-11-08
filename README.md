# Secure Ebook API

A secure, modular NestJS backend for a digital reading platform focused on ebooks, manga, and comics. The project is designed for multi-role access, secure authentication, catalog management, digital chapter delivery, wallet-based unlocks, and payment workflows.

This API powers the backend for a reading platform and exposes a clear REST interface with OpenAPI documentation via Swagger.

## Overview

The application is built around a modular monolith architecture. It separates concerns into domain-focused modules while keeping the system easy to run, test, and extend.

Core capabilities include:

- Secure user authentication and authorization
- Email OTP verification and password recovery
- JWT access tokens plus rotating refresh tokens
- Role-based access control for admin and user flows
- Catalog management for series, volumes, books, and chapters
- Secure storage integration for book covers and chapter PDFs
- Wallet and coin-based purchases
- PayPal and Discord-driven payment journeys
- Reading library and progress tracking
- Swagger-powered API documentation

## Tech Stack

- NestJS 11
- TypeScript
- TypeORM
- PostgreSQL
- Passport + JWT
- AWS S3 SDK
- Nodemailer
- Swagger / OpenAPI
- Helmet, compression, cookie-parser
- Jest for tests

## Architecture

The API is organized into the following modules:

- auth: registration, login, OTP verification, refresh, logout, JWT auth
- user: profile updates and account-focused actions
- catalog: series, volumes, books, genres, categories, chapters, media assets
- reading: reading progress, library, user chapter access records
- wallet: coin balance, transaction records, package definitions
- payment: PayPal/Discord order flows and webhook settlement
- storage: S3 file validation and secure media URLs
- common: reusable enums, base entities, and mail templates
- database: TypeORM config, migrations, and seeds
- config: environment and service configuration

Typical request flow:

1. Client authenticates via /api/auth/login
2. Server issues JWT access token and set secure refresh token cookie
3. Protected routes validate JWT via global guard
4. Admin routes enforce RBAC with roles guard
5. Catalog and media operations are isolated by module/service layer
6. Chapter access and wallet transactions are persisted in PostgreSQL
7. Media files are stored and served through AWS S3

## Project Structure

```text
secure-ebook-api/
├─ src/
│  ├─ app.module.ts
│  ├─ app.controller.ts
│  ├─ main.ts
│  ├─ auth/
│  ├─ catalog/
│  ├─ common/
│  ├─ config/
│  ├─ database/
│  ├─ payment/
│  ├─ reading/
│  ├─ storage/
│  ├─ user/
│  └─ wallet/
├─ test/
├─ .env.development
├─ eslint.config.mjs
├─ nest-cli.json
├─ package.json
├─ pnpm-lock.yaml
├─ tsconfig.json
├─ tsconfig.build.json
├─ README.md
└─ pnpm-workspace.yaml
```

## Prerequisites

Before running the project, make sure you have:

- Node.js 20+
- pnpm
- PostgreSQL 14+
- Access to AWS S3 credentials for media upload flows
- Optional: PayPal sandbox credentials and Discord bot configuration for payment flows

## Environment Configuration

The project uses environment files for local and runtime config.

Use the existing `.env.development` file as a starting point, then fill in your own secure values.

Example environment variables:

```env
NODE_ENV=development
PORT=3000
APP_NAME="Kuroyomi Secure Ebook API"

DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_db_password
DB_NAME=manga_ebook_dev_new

JWT_SECRET=your_access_token_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_REFRESH_EXPIRES_IN=30d

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USERNAME=your_email
MAIL_PASSWORD=your_email_password
MAIL_FROM="Your App <noreply@example.com>"

AWS_ACCESS_KEY_ID=your_aws_key
AWS_SECRET_ACCESS_KEY=your_aws_secret
AWS_REGION=ap-south-1
AWS_S3_BUCKET=your-bucket-name
MAX_CHAPTER_PDF_SIZE_MB=200
MAX_BOOK_COVER_SIZE_MB=10

PAYPAL_MODE=sandbox
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_secret
PAYPAL_WEBHOOK_ID=your_webhook_id

DISCORD_BOT_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_discord_client_id
DISCORD_GUILD_ID=your_discord_guild_id
```

Important:

- Never commit real secrets to git
- Use different credentials for development, staging, and production
- Store production values in a secure secret manager or deployment environment

## Installation

From the project root:

```bash
pnpm install
```

## Database Setup

This project uses TypeORM with PostgreSQL.

Create a database for local development:

```sql
CREATE DATABASE manga_ebook_dev_new;
```

Then run migrations:

```bash
pnpm run migration:run
```

If seed data is required for roles, categories, genres, tags, and coin packages:

```bash
pnpm run seed
```

## Running the API

Development mode:

```bash
pnpm run start:dev
```

Production build:

```bash
pnpm run build
pnpm run start:prod
```

By default the app runs on:

- API: http://localhost:3000/api
- Swagger docs: http://localhost:3000/docs

## Swagger Documentation

The API includes Swagger UI for interactive testing.

Open:

```text
http://localhost:3000/docs
```

Swagger is configured with authentication support, tags, and detailed request/response metadata.

## Authentication and Security Model

This backend uses a secure authentication flow built around JWT and refresh tokens.

### Authentication flow

1. User signs up with email and password
2. Email verification OTP is sent
3. User verifies email
4. User logs in with credentials
5. Server returns access token in response body and sets refresh token as an HTTP-only cookie
6. Access token is used for authenticated API requests
7. User refreshes token when access token expires
8. Refresh token is rotated and invalidated after use

### Security measures

- Passwords are hashed before storage
- Email OTPs are time-based and validated
- Refresh token rotation protects against replay abuse
- HttpOnly refresh cookie reduces JavaScript access
- JWT guard is globally applied to protected routes
- Role guard restricts admin-only endpoints
- Validation pipes sanitize and validate incoming requests
- Security headers and compression are enabled

## Core API Endpoints

The backend exposes these main routes under the /api prefix.

### Authentication

```text
POST /api/auth/register
POST /api/auth/verify-email
POST /api/auth/resend-verification-otp
POST /api/auth/forgot-password
POST /api/auth/reset-password
POST /api/auth/login
POST /api/auth/refresh
POST /api/auth/logout
POST /api/auth/logout-all
```

### Catalog

```text
GET /api/series
GET /api/series/:id
POST /api/series
PATCH /api/series/:id
DELETE /api/series/:id

GET /api/volumes
GET /api/volumes/:id
POST /api/volumes
PATCH /api/volumes/:id
DELETE /api/volumes/:id

GET /api/books
GET /api/books/:id
POST /api/books
PATCH /api/books/:id
DELETE /api/books/:id

GET /api/chapters
GET /api/chapters/:id
POST /api/chapters
PATCH /api/chapters/:id
DELETE /api/chapters/:id
```

### User and Wallet

```text
GET /api/user/profile
PATCH /api/user/profile
POST /api/user/change-password
GET /api/wallet
GET /api/wallet/transactions
GET /api/wallet/packages
```

### Payment and Order Flow

```text
POST /api/payment/create-order
GET /api/payment/status/:id
POST /api/payment/webhook/paypal
GET /api/payment/return
```

These endpoints are used for coin purchases, checkout flows, and settlement confirmation.

## Catalog Domain Model

The platform supports digital publishing objects such as:

- Series: a franchise or collection
- Volumes: grouped edition containers inside a series
- Books: publication items with metadata and pricing
- Chapters: readable content units inside a book or volume
- Genres, tags, authors, artists, languages, categories

Each catalog entity supports visibility, ordering, and admin-controlled publication rules.

## Storage and Media Handling

The application integrates with AWS S3 for media files, including:

- Book cover uploads
- Chapter PDF uploads
- Presigned URLs for secure download access
- File validation for size and type
- Metadata tracking for media assets

This keeps the API flexible and reduces direct dependency on the application server for file serving.

## Wallet and Payments

The wallet module supports:

- user coin balances
- transaction history
- active coin packages
- PayPal checkout integration
- Discord payment order flow
- wallet settlement after successful payment

The design supports a secure purchase flow without exposing sensitive payment logic directly to the frontend.

## Reading Experience

The reading layer handles:

- user library management
- reading progress tracking
- chapter access validation
- user-specific reading state
- unlock logic for paid chapters

This makes the platform suitable for subscription-free or pay-per-chapter ebook experiences.

## Testing

Run unit tests:

```bash
pnpm test
```

Run end-to-end tests:

```bash
pnpm run test:e2e
```

Run coverage:

```bash
pnpm run test:cov
```

## Production Notes

Before deploying to production:

- Set strong environment variables and rotate secrets
- Run database migrations in the target environment
- Configure HTTPS and secure cookies
- Restrict CORS to trusted origins
- Keep AWS credentials in a secret manager
- Monitor JWT expiration and refresh behavior
- Validate chapter upload size limits and file types
- Review PayPal webhook security and signature verification

## License

This project is currently configured as private and unlicensed in package metadata.

## Summary

Secure Ebook API is a production-oriented backend for a digital publishing platform with secure account management, scalable catalog operations, payment support, and protected chapter delivery. It is structured for both rapid local development and real-world deployment needs.
