# 📚 Kuroyomi Secure Ebook API

A secure, robust backend API for a manga & ebook reading platform built with **NestJS**, **TypeORM**, and **PostgreSQL**.

---

## 🚀 Getting Started

Quick commands to get the application up and running.

### 1. Installation
```bash
pnpm install
```

### 2. Running the App

The project supports environment-specific configurations loaded via `cross-env`:

| Environment | Start Command | Loaded Configuration |
| :--- | :--- | :--- |
| **Development** | `pnpm start:dev` | `.env.development` |
| **Staging** | `pnpm start:staging` | `.env.staging` |
| **Production** | `pnpm start:prod` | `.env.production` |

---

## 🗄️ Database Management (Migrations & Seeds)

We use a standalone TypeORM DataSource configuration ([data-source.ts](file:///c:/2026%20Projects/kuroyomi-api/ebook-api/src/database/data-source.ts)) to handle migrations and custom seeds.

### 📊 Migrations

To keep the database schema in sync with TypeORM entities:

*   **Generate a Migration:**
    ```bash
    pnpm migration:generate src/database/migrations/<MigrationName>
    ```
*   **Run Pending Migrations:**
    ```bash
    pnpm migration:run
    ```
*   **Revert Last Migration:**
    ```bash
    pnpm migration:revert
    ```

> [!WARNING]
> If you are using a custom PostgreSQL schema (such as `"auth"`), TypeORM will **not** automatically create it. Always add `await queryRunner.query('CREATE SCHEMA IF NOT EXISTS "auth"');` at the beginning of the generated `up` method.

### 🌱 Seeding (Idempotent)

Seeds populate the database with default data without creating duplicates.

*   **Seed All Database Data:**
    ```bash
    pnpm seed
    ```
*   **Seed Roles Only (ADMIN/USER):**
    ```bash
    pnpm seed:roles
    ```

---

## 🛠️ Feature Checklist & Roadmap

Progress tracker for building the platform features.

### 🏗️ Infrastructure & Core Setup
- [x] NestJS Application Initialization
- [x] PostgreSQL Integration with TypeORM
- [x] Environment Configuration (`.env.*` loader)
- [x] Schema Validation via `Joi`
- [x] Database Module & Logging Setup
- [x] Authentication Entities (`User`, `Role`, `UserRole`, `RefreshToken`, `OtpVerification`)
- [x] Database Migrations setup
- [x] Seeding Infrastructure with Idempotent Role Seeder

### 🔐 Authentication System
- [x] JWT Module & Strategy Configuration
- [x] Password Hashing Service (`bcrypt`)
- [x] Token Service (Access & Refresh tokens lifecycle)
- [ ] Mail Service Configuration (`nodemailer`)
- [ ] One-Time Password (OTP) verification service
- [ ] JWT & Refresh Token validation guards
- [ ] Authentication Service implementation
- [ ] Registration API with Email Verification
- [ ] Secure Login & Logout API
- [ ] Refresh Token Rotation API

---

## 📦 Built-in Tech Stack & Packages

The project has the following modules configured and ready to use:

*   **Core:** `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
*   **Configuration & Validation:** `@nestjs/config`, `joi`, `class-validator`, `class-transformer`
*   **Database & ORM:** `@nestjs/typeorm`, `typeorm`, `pg` (PostgreSQL)
*   **Auth & Security:** `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `passport`, `passport-jwt`, `passport-local`, `bcrypt`, `helmet`, `cookie-parser`
*   **Emailing:** `nodemailer`
*   **API Documentation:** `@nestjs/swagger`, `swagger-ui-express`