# 📚 Kuroyomi Secure Ebook & Manga API

> **An enterprise-grade, high-performance, and secure backend REST API for digital manga, comic, and ebook platforms built with [NestJS 11](https://nestjs.com/), [TypeORM](https://typeorm.io/), and [PostgreSQL](https://www.postgresql.org/).**

---

## 📑 Table of Contents

1. [🌟 Executive Overview](#-executive-overview)
2. [🏗️ Architecture & Design Philosophy](#️-architecture--design-philosophy)
   - [Modular Monolith Architecture](#modular-monolith-architecture)
   - [Directory Structure & Codebase Anatomy](#directory-structure--codebase-anatomy)
3. [🔐 Deep-Dive Security & Authentication Engine](#-deep-dive-security--authentication-engine)
   - [Dual-Token Rotation Lifecycle](#dual-token-rotation-lifecycle)
   - [Authentication Sequence Flow](#authentication-sequence-flow)
   - [Token Comparison Matrix](#token-comparison-matrix)
   - [Security & Defense Mechanisms](#security--defense-mechanisms)
   - [Device Intelligence & Fingerprinting](#device-intelligence--fingerprinting)
   - [Role-Based Access Control (RBAC)](#role-based-access-control-rbac)
4. [🗄️ Database Architecture, Migrations & Seeding](#️-database-architecture-migrations--seeding)
   - [Database Schema & ER Diagram](#database-schema--er-diagram)
   - [Data Dictionary & Table Reference](#data-dictionary--table-reference)
   - [TypeORM Migration Management](#typeorm-migration-management)
   - [Idempotent Seeder System](#idempotent-seeder-system)
   - [Troubleshooting Database Sync](#troubleshooting-database-sync)
5. [🚀 Getting Started: Developer Documentary Walkthrough](#-getting-started-developer-documentary-walkthrough)
   - [Prerequisites](#prerequisites)
   - [Step 1: Installation](#step-1-installation)
   - [Step 2: Environment Configuration](#step-2-environment-configuration)
   - [Step 3: Database Provisioning](#step-3-database-provisioning)
   - [Step 4: Executing Migrations & Seeds](#step-4-executing-migrations--seeds)
   - [Step 5: Launching the Application](#step-5-launching-the-application)
   - [Step 6: Interactive Swagger API Explorer](#step-6-interactive-swagger-api-explorer)
6. [📡 Complete API Reference & Developer Cookbook](#-complete-api-reference--developer-cookbook)
   - [1. User Registration](#1-user-registration)
   - [2. Verify Email via OTP](#2-verify-email-via-otp)
   - [3. Resend Verification OTP](#3-resend-verification-otp)
   - [4. User Login & Token Generation](#4-user-login--token-generation)
   - [5. Get Current Authenticated Profile](#5-get-current-authenticated-profile)
   - [6. Refresh Access Token (Token Rotation)](#6-refresh-access-token-token-rotation)
   - [7. Single Device Session Logout](#7-single-device-session-logout)
   - [8. Logout From All Devices (Global Invalidation)](#8-logout-from-all-devices-global-invalidation)
   - [9. Forgot Password OTP Request](#9-forgot-password-otp-request)
   - [10. Reset Password via OTP](#10-reset-password-via-otp)
7. [📧 Transactional Email & Notification System](#-transactional-email--notification-system)
8. [🧪 Testing & Code Quality Assurance](#-testing--code-quality-assurance)
9. [🗺️ Master Project Roadmap & Milestone Tracker (Phases 1–12)](#️-master-project-roadmap--milestone-tracker-phases-112)
10. [📦 Tech Stack Matrix](#-tech-stack-matrix)

---

## 🌟 Executive Overview

The **Kuroyomi Secure Ebook API** provides a resilient, strictly typed, and security-hardened backend foundation tailored for reading platforms that host digital manga, comics, light novels, and ebooks.

### Key Architectural Highlights

- **Dual-Token Rotation Auth**: 15-minute stateless JWT access tokens combined with 30-day single-use, SHA-256 hashed refresh tokens that rotate on every single refresh call.
- **Cryptographic OTP Verification**: 6-digit secure OTPs hashed with bcrypt, enforce 10-minute expirations, and strict 5-attempt rate-limiting against brute force attacks.
- **Zero-Trust Session Management**: Instant revocation of individual sessions (`/logout`) or global session teardown (`/logout-all` and password resets).
- **Device & Client Intelligence**: Automatic parsing of User-Agent strings and network headers to record human-readable client OS, browser, and IP addresses per session.
- **Schema-Isolated Database Architecture**: Uses dedicated PostgreSQL schema namespacing (`auth.*`) with explicit TypeORM migrations and idempotent bootstrap seeders.
- **Strict Validation & Environment Sanitization**: Request bodies sanitized with `class-validator` + `class-transformer` using `whitelist: true`, backed by `Joi` schema-validated environment variables.
- **Swagger / OpenAPI Documentation**: Auto-generated interactive API docs with built-in JWT Bearer authentication support at `/docs`.

---

## 🏗️ Architecture & Design Philosophy

### Modular Monolith Architecture

The codebase adheres to NestJS modular design patterns, maintaining strict encapsulation of domain concerns while sharing reusable cross-cutting components:

```mermaid
graph TD
    AppModule --> ConfigModule
    AppModule --> DatabaseModule
    AppModule --> CommonModule
    AppModule --> AuthModule
    AppModule --> UserModule
    AppModule --> CatalogModule
    AppModule --> ReadingModule
    AppModule --> WalletModule
    AppModule --> PaymentModule

    AuthModule --> UserModule
    AuthModule --> CommonModule
    CommonModule --> MailService
    DatabaseModule --> TypeOrmModule
```

| Module | Purpose & Scope |
| :--- | :--- |
| **`AuthModule`** | Manages registration, OTPs, bcrypt hashing, JWT issuance, refresh token rotation, password recovery, and auth guards. |
| **`UserModule`** | Manages user accounts, profile queries, role assignment, and user status lifecycles. |
| **`CatalogModule`** | Domain entities for manga/ebook series, volumes, chapters, and pages. |
| **`ReadingModule`** | Handles user libraries, reading progress sync, bookmarks, and chapter access logs. |
| **`WalletModule`** | Manages virtual coin balances, packages, unlocking fees, and transaction ledgers. |
| **`PaymentModule`** | Integrations with payment gateways (Razorpay / Stripe) and order processing. |
| **`CommonModule`** | Global mailer services (`Nodemailer`), base entities, enums, and responsive HTML email templates. |
| **`DatabaseModule`** | TypeORM connection pooling, automatic migration executor, and startup data seeders. |

---

### Directory Structure & Codebase Anatomy

```text
secure-ebook-api/
├── .env.development              # Environment config for local development
├── .env.staging                  # Staging server configuration
├── .env.production               # Production deployment configuration
├── .env.example                  # Template configuration with descriptions
├── nest-cli.json                 # NestJS CLI build & compilation settings
├── package.json                  # Dependencies, scripts, and package metadata
├── tsconfig.json                 # TypeScript compiler configuration
├── src/
│   ├── main.ts                   # Application bootstrap entrypoint, Swagger, CORS, pipes
│   ├── app.module.ts             # Root module aggregating all domain and core modules
│   ├── app.controller.ts         # Base health & status controller
│   ├── app.service.ts            # Base service
│   │
│   ├── auth/                     # 🔐 Authentication Subsystem
│   │   ├── auth.module.ts        # Module configuration & dependency wiring
│   │   ├── auth.controller.ts    # REST controller (10 endpoints: register, login, OTP, tokens, etc.)
│   │   ├── auth.service.ts       # Orchestrator for registration, verification, token rotation
│   │   ├── decorators/           # Parameter & method decorators
│   │   │   ├── current-user.decorator.ts # Extracts authenticated JwtUser from request
│   │   │   ├── device-info.decorator.ts  # Extracts and parses client User-Agent & IP
│   │   │   ├── public.decorator.ts       # Bypasses global JWT Auth Guard
│   │   │   └── roles.decorator.ts        # Attaches required RBAC roles to route
│   │   ├── dto/                  # Data Transfer Objects with class-validator annotations
│   │   │   ├── auth-response.dto.ts
│   │   │   ├── forgot-password.dto.ts
│   │   │   ├── refresh-token.dto.ts
│   │   │   ├── register.dto.ts
│   │   │   ├── resend-otp.dto.ts
│   │   │   ├── resend-verification.dto.ts
│   │   │   ├── reset-password.dto.ts
│   │   │   └── verify-email.dto.ts
│   │   ├── entities/             # TypeORM PostgreSQL entities for auth schema
│   │   │   ├── otp-verification.entity.ts
│   │   │   ├── refresh-token.entity.ts
│   │   │   ├── role.entity.ts
│   │   │   ├── user.entity.ts
│   │   │   └── user-role.entity.ts
│   │   ├── guards/               # Route guards
│   │   │   ├── jwt-auth.guard.ts # Global guard verifying Bearer JWT signature
│   │   │   └── roles.guard.ts    # RBAC guard checking required RoleType against user roles
│   │   ├── interfaces/           # TypeScript contracts
│   │   │   ├── device-metadata.interface.ts
│   │   │   ├── jwt-payload.interface.ts
│   │   │   └── jwt-user.interface.ts
│   │   ├── services/             # Specialized business services
│   │   │   ├── otp.service.ts           # Cryptographic OTP generator, bcrypt hasher & limiter
│   │   │   ├── password.service.ts      # Bcrypt password hashing & comparator
│   │   │   ├── refresh-token.service.ts # SHA-256 token hashing, lookup & session revocation
│   │   │   └── token.service.ts         # JWT access & refresh token signer & verifier
│   │   └── strategies/
│   │       └── jwt.strategy.ts   # Passport JWT strategy verifying stateless tokens
│   │
│   ├── user/                     # 👤 User Subsystem
│   │   ├── user.module.ts
│   │   ├── controllers/
│   │   │   └── user.controller.ts
│   │   └── services/
│   │       └── users.service.ts  # User repository operations, role linking, password updates
│   │
│   ├── catalog/                  # 📚 Catalog & Content Subsystem
│   │   ├── catalog.module.ts
│   │   ├── catalog.controller.ts
│   │   ├── catalog.service.ts
│   │   └── entities/             # Book, Series, Chapter, and Page entities
│   │       ├── book.entity.ts
│   │       ├── book-series.entity.ts
│   │       ├── chapters.entity.ts
│   │       └── pages.entity.ts
│   │
│   ├── reading/                  # 📖 Reading Progress & Library Subsystem
│   │   ├── reading.module.ts
│   │   ├── reading.controller.ts
│   │   ├── reading.service.ts
│   │   └── entities/
│   │       ├── reading_progress.entity.ts
│   │       └── user_library.entity.ts
│   │
│   ├── wallet/                   # 🪙 Coin & Wallet Subsystem
│   │   ├── wallet.module.ts
│   │   ├── wallet.controller.ts
│   │   ├── wallet.service.ts
│   │   └── entities/
│   │       ├── coin-package.entity.ts
│   │       ├── coin-transaction.entity.ts
│   │       └── wallet.entity.ts
│   │
│   ├── payment/                  # 💳 Payment Gateway Subsystem
│   │   ├── payment.module.ts
│   │   ├── payment.controller.ts
│   │   ├── payment.service.ts
│   │   └── entities/
│   │       ├── payment-orders.entity.ts
│   │       └── payment-transaction.entity.ts
│   │
│   ├── common/                   # 🧩 Shared Common Utilities & Mail
│   │   ├── common.module.ts
│   │   ├── entities/
│   │   │   └── base.entity.ts    # UUID Primary key, created_at, updated_at timestamps
│   │   ├── enums/
│   │   │   ├── otp-purpose.enum.ts # REGISTER | LOGIN | FORGOT_PASSWORD
│   │   │   ├── role.enum.ts        # SUPER_ADMIN | ADMIN | USER
│   │   │   └── user-status.enum.ts # ACTIVE | INACTIVE | SUSPENDED
│   │   └── mail/
│   │       ├── mail.module.ts
│   │       ├── mail.service.ts   # Nodemailer SMTP dispatcher
│   │       └── templates/        # Responsive HTML email templates
│   │           ├── base.template.ts
│   │           ├── index.ts
│   │           ├── password-reset-otp.template.ts
│   │           └── verification-otp.template.ts
│   │
│   ├── config/                   # ⚙️ Type-Safe Configuration Loaders & Joi Validation
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── index.ts
│   │   ├── jwt.config.ts
│   │   ├── mail.config.ts
│   │   ├── payment.config.ts
│   │   └── validation.schema.ts  # Joi schema enforcing env variable types and requirements
│   │
│   └── database/                 # 🗄️ Database DataSource, Migrations & Seeds
│       ├── database.module.ts    # TypeOrmModule config with auto-migrations on boot
│       ├── data-source.ts        # Standalone TypeORM DataSource CLI configuration
│       ├── migrations/
│       │   └── 1786079461230-InitialAuthSchema.ts # Schema migration for auth tables
│       └── seeds/
│           ├── database-seeder.service.ts # Bootstrap seeder runner
│           ├── seeder.interface.ts
│           ├── role.seed.ts      # Idempotent seed inserting default roles
│           ├── seed.ts           # Standalone CLI seeder entrypoint
│           └── index.ts
```

---

## 🔐 Deep-Dive Security & Authentication Engine

### Dual-Token Rotation Lifecycle

Traditional authentication systems suffer from an inherent security trade-off:
1. **Long-Lived Stateless Tokens**: If intercepted, the attacker maintains access until expiration, with no server-side revocation mechanism.
2. **Short-Lived Tokens Only**: Forces users to frequently re-enter credentials, degrading UX.

Kuroyomi resolves this by pairing **stateless, short-lived Access Tokens** with **stateful, single-use, rotating Refresh Tokens**:

```mermaid
flowchart TD
    subgraph Client Request
        A[Client calls /api/auth/refresh] -->|Sends Refresh Token A| B[AuthService.refresh]
    end

    subgraph Security Checks
        B --> C{1. JWT Signature & Expiry Valid?}
        C -- No --> R1[401 Unauthorized]
        C -- Yes --> D{2. payload.type == 'refresh'?}
        D -- No --> R2[401 Unauthorized]
        D -- Yes --> E[Compute SHA-256 Hash of Token A]
        E --> F{3. Find Token in DB?}
        F -- Not Found / Expired --> R3[401 Unauthorized]
        F -- Found --> G{4. revokedAt != NULL?}
        G -- Yes: Reuse Attempt Detected! --> R4[401 Unauthorized: Compromised Token]
    end

    subgraph Token Rotation & Issuance
        G -- No: Valid Token --> H[Mark Token A: revokedAt = NOW]
        H --> I[Generate New Access Token B 15m]
        I --> J[Generate New Refresh Token B 30d]
        J --> K[Save SHA-256 Hash of Token B in DB]
        K --> L[Return Access Token B + Refresh Token B]
    end
```

---

### Authentication Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor User as Client Application
    participant API as NestJS Backend API
    participant Mail as SMTP Mailer (Nodemailer)
    participant DB as PostgreSQL Database

    Note over User, DB: 1. User Registration & Email Verification
    User->>API: POST /api/auth/register { email, username, fullName, password }
    API->>DB: Check uniqueness (email, username)
    API->>API: Hash password with bcrypt (cost: 10)
    API->>DB: Save User (isEmailVerified = false)
    API->>DB: Assign default 'USER' role
    API->>API: Generate cryptographically secure 6-digit OTP
    API->>DB: Save bcrypt hash of OTP (purpose: 'REGISTER', expiry: 10m)
    API->>Mail: Send branded HTML verification email
    Mail-->>User: Delivers OTP Code
    API-->>User: 201 Created { message, email }

    User->>API: POST /api/auth/verify-email { email, otp }
    API->>DB: Fetch active OTP record by email & purpose
    API->>API: Verify bcrypt OTP hash & check attempts <= 5
    API->>DB: Update OtpVerification (verified = true)
    API->>DB: Update User (isEmailVerified = true)
    API-->>User: 200 OK { message: "Email verified successfully" }

    Note over User, DB: 2. Login & Token Issuance
    User->>API: POST /api/auth/login { email, password, deviceName? }
    API->>DB: Fetch user with password and roles
    API->>API: Enforce isEmailVerified === true
    API->>API: Compare bcrypt password hash
    API->>API: Issue Access Token A (15m, type: 'access')
    API->>API: Issue Refresh Token A (30d, type: 'refresh')
    API->>API: Compute SHA-256 hash of Refresh Token A
    API->>DB: Save hashed Refresh Token A + Device Info + IP + User-Agent
    API-->>User: 200 OK { user, accessToken: A, refreshToken: A }

    Note over User, DB: 3. Accessing Protected Resources
    User->>API: GET /api/auth/me (Authorization: Bearer <accessToken A>)
    API->>API: JwtAuthGuard verifies cryptographic signature & payload.type == 'access'
    API-->>User: 200 OK { userId, email, roles }

    Note over User, DB: 4. Token Rotation (Access Token Expired)
    User->>API: POST /api/auth/refresh { refreshToken: A }
    API->>API: Verify JWT signature & type == 'refresh'
    API->>DB: Lookup SHA-256 hash of Token A
    API->>DB: Mark Token A as REVOKED (revokedAt = NOW())
    API->>API: Issue Access Token B & Refresh Token B
    API->>DB: Save SHA-256 hash of Refresh Token B
    API-->>User: 200 OK { accessToken: B, refreshToken: B }

    Note over User, DB: 5. Session Termination (Logout)
    User->>API: POST /api/auth/logout { refreshToken: B } (Bearer Token B)
    API->>DB: Mark Token B as REVOKED
    API-->>User: 204 No Content

    Note over User, DB: 6. Forgot & Reset Password
    User->>API: POST /api/auth/forgot-password { email }
    API->>DB: Query user (returns generic success even if not found)
    API->>API: Generate 6-digit OTP
    API->>DB: Save bcrypt hash of OTP (purpose: 'FORGOT_PASSWORD')
    API->>Mail: Send Password Reset OTP email
    API-->>User: 200 OK { message: "If the email exists, a password reset code has been sent." }

    User->>API: POST /api/auth/reset-password { email, otp, newPassword }
    API->>DB: Verify OTP hash, expiry, and attempt count
    API->>API: Hash new password with bcrypt
    API->>DB: Update User.password
    API->>DB: Revoke ALL active refresh tokens for user (Global Session Teardown)
    API-->>User: 200 OK { message: "Password reset successfully" }
```

---

### Token Comparison Matrix

| Property | Access Token | Refresh Token |
| :--- | :--- | :--- |
| **Lifespan** | 15 Minutes (`JWT_EXPIRES_IN=15m`) | 30 Days (`JWT_REFRESH_EXPIRES_IN=30d`) |
| **Validation Strategy** | **Stateless**: In-memory signature verification via `JwtStrategy` | **Stateful**: Database hash lookup in `auth.refresh_tokens` |
| **Storage in DB** | Never stored in DB | Stored as **SHA-256 cryptographic hash** |
| **Payload Claim** | `{ sub, email, roles, type: 'access' }` | `{ sub, email, roles, type: 'refresh' }` |
| **Transmission** | HTTP Header: `Authorization: Bearer <token>` | JSON Body: `{ "refreshToken": "<token>" }` |
| **Rotation Behavior** | Re-issued upon calling `/auth/refresh` | **Single-use**: Consumed and replaced immediately |
| **Secret Key** | `JWT_SECRET` | `JWT_REFRESH_SECRET` |

---

### Security & Defense Mechanisms

| Defense Layer | Implementation Detail | Security Purpose |
| :--- | :--- | :--- |
| **Email Verification Gate** | `user.isEmailVerified === true` checked before login | Prevents spambots and unverified accounts from creating sessions. |
| **Bcrypt OTP Hashing** | OTPs are hashed using `bcrypt` before storage in `auth.otp_verifications` | Prevents plain-text OTP leaks even in the event of a database compromise. |
| **Brute-Force Throttle** | `attempts` column increments per attempt; locked at > 5 attempts | Neutralizes OTP brute-forcing and dictionary attacks. |
| **Account Enumeration Immunity** | `/auth/forgot-password` and `/auth/resend-verification-otp` return identical responses | Prevents malicious actors from discovering registered email addresses. |
| **Strict Token Type Scoping** | `payload.type` (`'access'` vs `'refresh'`) strictly enforced | Prevents using a refresh token to access API endpoints or vice versa. |
| **Token Theft Neutralization** | Reusing a consumed refresh token results in instant rejection | If a token is stolen and used after legitimate rotation, access is blocked. |
| **Global Session Teardown** | Password reset and `/auth/logout-all` revoke all active tokens | Immediately invalidates compromised devices upon credential changes. |
| **Global JWT Guard & `@Public()`** | Global `APP_GUARD` protects all routes by default | Eliminates human error of forgetting to protect new endpoints. |
| **Parameter Sanitization** | `ValidationPipe` with `whitelist: true` & `transform: true` | Strips unexpected payload fields to prevent mass-assignment attacks. |

---

### Device Intelligence & Fingerprinting

The `@DeviceInfo()` parameter decorator inspects incoming HTTP request headers to extract client metadata:

1. **IP Address Detection**: Inspects `x-forwarded-for` (proxy/load balancer headers) and socket remote addresses, stripping IPv6-mapped IPv4 representations (`::ffff:127.0.0.1` $\to$ `127.0.0.1`).
2. **User-Agent Parser**: Automatically detects the Operating System (Windows, macOS, Linux, Android, iOS) and Client/Browser (Chrome, Safari, Firefox, Edge, Opera, Postman, cURL).
3. **Custom Device Override**: Supports client-supplied device names via `x-device-name` header or `deviceName` in the JSON request body.
4. **Metadata Persistence**: Persisted in `auth.refresh_tokens` (`device_name`, `ip_address`, `user_agent`, `last_used_at`) for multi-device management.

---

### Role-Based Access Control (RBAC)

The application implements granular authorization through roles:

* **Available Roles**: `SUPER_ADMIN`, `ADMIN`, `USER` (defined in `RoleType` enum).
* **`@Roles(...)` Decorator**: Attaches required role metadata to controller classes or route handlers.
* **`RolesGuard`**: Evaluates the authenticated user's assigned roles against the required metadata.

```typescript
// Example: Restricting an endpoint to Administrators
@Get('admin/dashboard')
@Roles(RoleType.ADMIN, RoleType.SUPER_ADMIN)
@UseGuards(RolesGuard)
getAdminDashboard() {
    return { status: 'Authorized for Admins only' };
}
```

---

## 🗄️ Database Architecture, Migrations & Seeding

### Database Schema & ER Diagram

All authentication and authorization tables are isolated inside the dedicated PostgreSQL `"auth"` schema.

```mermaid
erDiagram
    "auth.users" ||--o{ "auth.user_roles" : "has many"
    "auth.roles" ||--o{ "auth.user_roles" : "assigned to"
    "auth.users" ||--o{ "auth.refresh_tokens" : "owns"
    "auth.users" ||--o{ "auth.otp_verifications" : "requests"

    "auth.users" {
        uuid id PK "DEFAULT uuid_generate_v4()"
        varchar email UK "max 150 chars"
        varchar username UK "max 150 chars"
        varchar password "bcrypt hash"
        varchar full_name "max 150 chars"
        varchar avatar_url "nullable"
        boolean is_email_verified "DEFAULT false"
        enum status "ACTIVE | INACTIVE | SUSPENDED"
        timestamptz created_at
        timestamptz updated_at
    }

    "auth.roles" {
        uuid id PK "DEFAULT uuid_generate_v4()"
        enum name UK "SUPER_ADMIN | ADMIN | USER"
        varchar description "max 255 chars"
        timestamptz created_at
        timestamptz updated_at
    }

    "auth.user_roles" {
        uuid id PK "DEFAULT uuid_generate_v4()"
        uuid user_id FK "REFERENCES auth.users(id) ON DELETE CASCADE"
        uuid role_id FK "REFERENCES auth.roles(id)"
        timestamptz assigned_at
    }

    "auth.refresh_tokens" {
        uuid id PK "DEFAULT uuid_generate_v4()"
        uuid user_id FK "REFERENCES auth.users(id) ON DELETE CASCADE"
        varchar token_hash UK "SHA-256 hash"
        varchar device_name "max 100 chars"
        varchar ip_address "max 45 chars"
        text user_agent
        timestamptz last_used_at
        timestamptz expires_at
        timestamptz revoked_at "nullable (set on rotation/logout)"
        timestamptz created_at
        timestamptz updated_at
    }

    "auth.otp_verifications" {
        uuid id PK "DEFAULT uuid_generate_v4()"
        uuid user_id FK "REFERENCES auth.users(id) ON DELETE CASCADE"
        varchar email "max 150 chars"
        varchar otp_code "bcrypt hash"
        enum purpose "REGISTER | LOGIN | FORGOT_PASSWORD"
        integer attempts "DEFAULT 0"
        boolean verified "DEFAULT false"
        timestamptz expires_at
        timestamptz verified_at
        timestamptz created_at
        timestamptz updated_at
    }
```

---

### Data Dictionary & Table Reference

#### 1. Table: `auth.users`
Stores user identity, credentials, verification state, and profile info.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique user identifier |
| `email` | `varchar(150)` | `UNIQUE`, `NOT NULL` | User email address |
| `username` | `varchar(150)` | `UNIQUE`, `NOT NULL` | Unique public handle |
| `password` | `varchar` | `NOT NULL` | Bcrypt password hash |
| `full_name` | `varchar(150)` | `NOT NULL` | User's display name |
| `avatar_url` | `varchar` | `NULLABLE` | S3/CDN URL to profile avatar |
| `is_email_verified` | `boolean` | `NOT NULL`, Default `false` | Gatekeeper flag for login |
| `status` | `enum` | `NOT NULL`, Default `'ACTIVE'` | `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'` |
| `created_at` | `timestamptz` | `NOT NULL`, Default `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL`, Default `now()` | Record last update timestamp |

#### 2. Table: `auth.roles`
Defines permission levels.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique role identifier |
| `name` | `enum` | `UNIQUE`, `NOT NULL` | `'SUPER_ADMIN'`, `'ADMIN'`, `'USER'` |
| `description` | `varchar(255)` | `NULLABLE` | Human-readable role description |
| `created_at` | `timestamptz` | `NOT NULL`, Default `now()` | Record creation timestamp |
| `updated_at` | `timestamptz` | `NOT NULL`, Default `now()` | Record last update timestamp |

#### 3. Table: `auth.user_roles`
Junction table linking users to roles (Many-to-Many).

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique junction identifier |
| `user_id` | `uuid` | `FK -> auth.users(id) ON DELETE CASCADE` | Target user ID |
| `role_id` | `uuid` | `FK -> auth.roles(id)` | Target role ID |
| `assigned_at` | `timestamptz` | `NOT NULL`, Default `now()` | Timestamp when role was assigned |

#### 4. Table: `auth.refresh_tokens`
Stores active and revoked refresh token sessions.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique session identifier |
| `user_id` | `uuid` | `FK -> auth.users(id) ON DELETE CASCADE` | Associated user |
| `token_hash` | `varchar` | `UNIQUE`, `NOT NULL` | SHA-256 hash of refresh token |
| `device_name` | `varchar(100)` | `NULLABLE` | Parsed or client-supplied device name |
| `ip_address` | `varchar(45)` | `NULLABLE` | Client IPv4 or IPv6 address |
| `user_agent` | `text` | `NULLABLE` | Raw HTTP User-Agent string |
| `last_used_at` | `timestamptz` | `NULLABLE` | Timestamp of last usage |
| `expires_at` | `timestamptz` | `NOT NULL` | Token expiration timestamp (30 days) |
| `revoked_at` | `timestamptz` | `NULLABLE` | Revocation timestamp (rotation/logout) |

#### 5. Table: `auth.otp_verifications`
Manages verification and password reset OTP codes.

| Column | Data Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique OTP record ID |
| `user_id` | `uuid` | `FK -> auth.users(id) ON DELETE CASCADE` | Optional associated user ID |
| `email` | `varchar(150)` | `NOT NULL` | Email recipient |
| `otp_code` | `varchar(255)` | `NOT NULL` | Bcrypt hash of 6-digit OTP code |
| `purpose` | `enum` | `NOT NULL` | `'REGISTER'`, `'LOGIN'`, `'FORGOT_PASSWORD'` |
| `attempts` | `integer` | `NOT NULL`, Default `0` | Number of verification attempts |
| `verified` | `boolean` | `NOT NULL`, Default `false` | Whether OTP was successfully redeemed |
| `expires_at` | `timestamptz` | `NOT NULL` | Expiration timestamp (10 minutes) |
| `verified_at` | `timestamptz` | `NULLABLE` | Redemption timestamp |

---

### TypeORM Migration Management

TypeORM migrations provide version-controlled schema modifications across development, staging, and production databases.

```bash
# 1. Generate a new migration based on entity changes
pnpm migration:generate src/database/migrations/<MigrationName>

# 2. Run all pending migrations
pnpm migration:run

# 3. Revert the last executed migration
pnpm migration:revert
```

> [!TIP]
> When creating or editing migrations for custom PostgreSQL schemas (such as `"auth"`), ensure `CREATE SCHEMA IF NOT EXISTS "auth"` is executed at the beginning of the `up` method.

---

### Idempotent Seeder System

Seeders check for the existence of baseline records before inserting, making them safe to run repeatedly without producing duplicates or constraint violations.

* **Automatic Boot Seeding**: On application startup, `DatabaseSeederService` automatically executes registered seeders.
* **Manual Seeding CLI**:
  ```bash
  # Run all registered seeders
  pnpm seed

  # Run roles seeder only (SUPER_ADMIN, ADMIN, USER)
  pnpm seed:roles
  ```

---

### Troubleshooting Database Sync

If the database schema falls out of sync or stale migrations block execution:

```bash
# Clear the migrations tracking table
pnpm typeorm query "TRUNCATE TABLE migrations;"

# Re-apply all migrations cleanly
pnpm migration:run

# Re-run seeds
pnpm seed
```

---

## 🚀 Getting Started: Developer Documentary Walkthrough

Follow this step-by-step walkthrough to get the application running locally from scratch.

### Prerequisites

Ensure you have the following installed on your system:
- **Node.js**: `v20.x` or `v22.x` (LTS recommended)
- **pnpm**: `v9.x` or higher (`npm install -g pnpm`)
- **PostgreSQL**: `v14+` running locally or via Docker
- **SMTP Server**: Gmail App Password, Mailtrap, or SendGrid account for transactional emails

---

### Step 1: Installation

Clone the repository and install dependencies using `pnpm`:

```bash
# Clone the repository
git clone https://github.com/your-username/secure-ebook-api.git
cd secure-ebook-api

# Install dependencies
pnpm install
```

---

### Step 2: Environment Configuration

Create your `.env.development` file from the provided example template:

```bash
cp .env.example .env.development
```

Configure your environment variables in `.env.development`:

```ini
# Application Configuration
NODE_ENV=development
PORT=3000
APP_NAME="Kuroyomi Secure Ebook API"

# PostgreSQL Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_postgres_password
DB_NAME=manga_ebook_dev

# JWT Security (Must be at least 32 characters each)
JWT_SECRET=super_secret_access_key_min_32_characters_long_12345
JWT_EXPIRES_IN=15m
JWT_REFRESH_SECRET=super_secret_refresh_key_min_32_characters_long_12345
JWT_REFRESH_EXPIRES_IN=30d

# SMTP Mail Delivery (Optional for local test, required for OTP delivery)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-16-digit-gmail-app-password
MAIL_FROM="Kuroyomi Ebook <your-email@gmail.com>"

# Payment Gateways (Optional for Phase 1 & 2)
RAZORPAY_KEY=
RAZORPAY_SECRET=
```

---

### Step 3: Database Provisioning

Create the PostgreSQL database if it does not already exist:

```bash
# Using PostgreSQL CLI
psql -U postgres -c "CREATE DATABASE manga_ebook_dev;"
```

*Or with Docker:*
```bash
docker run --name kuroyomi-postgres -e POSTGRES_PASSWORD=root -e POSTGRES_DB=manga_ebook_dev -p 5432:5432 -d postgres:16-alpine
```

---

### Step 4: Executing Migrations & Seeds

You can apply migrations and seed the initial roles (`SUPER_ADMIN`, `ADMIN`, `USER`) manually:

```bash
# Run migrations
pnpm migration:run

# Seed default roles
pnpm seed
```

*(Alternatively, starting the dev server automatically executes pending migrations and seeders).*

---

### Step 5: Launching the Application

Start the development server with live reload:

```bash
pnpm start:dev
```

When started successfully, you will see:
```text
[Nest] LOG [NestFactory] Starting Nest application...
[Nest] LOG [DatabaseSeederService] 🌱 Checking baseline database seed data...
[Nest] LOG [DatabaseSeederService] ✅ Baseline seed data check completed.
🚀 Application is running on: http://localhost:3000/api
📖 Swagger documentation is available at: http://localhost:3000/docs
```

#### Running in Other Environments

| Environment | Command | Loaded Environment File |
| :--- | :--- | :--- |
| **Development** | `pnpm start:dev` | `.env.development` |
| **Staging** | `pnpm start:staging` | `.env.staging` |
| **Production Build** | `pnpm build && pnpm start:prod` | `.env.production` |
| **Debug Mode** | `pnpm start:debug` | `.env.development` |

---

### Step 6: Interactive Swagger API Explorer

Visit [`http://localhost:3000/docs`](http://localhost:3000/docs) in your browser to inspect the full interactive OpenAPI/Swagger documentation, view schemas, test live endpoints, and authorize Bearer tokens.

---

## 📡 Complete API Reference & Developer Cookbook

> [!NOTE]
> All endpoints are prefixed with `/api`. Protected endpoints require the header `Authorization: Bearer <accessToken>`.

---

### 1. User Registration

Creates a new user in the database with `isEmailVerified = false`, assigns the default `USER` role, generates a 6-digit OTP, and emails it to the user.

- **Endpoint**: `POST /api/auth/register`
- **Access**: Public
- **HTTP Status**: `201 Created`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otaku@example.com",
    "username": "kuroyomi_reader",
    "fullName": "Ken Kaneki",
    "password": "SecurePassword123!",
    "roleType": "USER"
  }'
```

#### JSON Response (`201 Created`)
```json
{
  "message": "Registration successful. Please verify your email using the OTP sent to your email.",
  "email": "otaku@example.com"
}
```

---

### 2. Verify Email via OTP

Validates the 6-digit OTP sent via email. Sets `isEmailVerified = true` upon success, enabling the user to log in.

- **Endpoint**: `POST /api/auth/verify-email`
- **Access**: Public
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/verify-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otaku@example.com",
    "otp": "481920"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "message": "Email verified successfully"
}
```

---

### 3. Resend Verification OTP

Generates a fresh OTP code and dispatches a new verification email if the account exists and is not yet verified.

- **Endpoint**: `POST /api/auth/resend-verification-otp`
- **Access**: Public
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/resend-verification-otp \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otaku@example.com"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "message": "Verification OTP has been sent to your email."
}
```

---

### 4. User Login & Token Generation

Authenticates email and password. Enforces `isEmailVerified === true`. Issues a 15-minute Access Token and a 30-day Refresh Token while saving device metadata.

- **Endpoint**: `POST /api/auth/login`
- **Access**: Public
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36" \
  -d '{
    "email": "otaku@example.com",
    "password": "SecurePassword123!",
    "deviceName": "MacBook Pro 16"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "user": {
    "id": "7b8e1f6e-9e2b-42b5-a3d8-55a5b5f25a3a",
    "email": "otaku@example.com",
    "username": "kuroyomi_reader",
    "fullName": "Ken Kaneki",
    "avatarUrl": null,
    "isEmailVerified": true,
    "status": "ACTIVE",
    "createdAt": "2026-09-19T08:00:00.000Z",
    "updatedAt": "2026-09-19T08:05:00.000Z",
    "userRoles": [
      {
        "id": "e8d91c10-2f5a-4e2b-9801-b84930129a01",
        "role": {
          "id": "a1b2c3d4-0000-0000-0000-000000000003",
          "name": "USER",
          "description": "Standard Reader User"
        }
      }
    ]
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

---

### 5. Get Current User Profile (Database Hydrated)

Fetches the complete, fresh user profile directly from PostgreSQL. This is the primary endpoint frontend apps use to populate user state on page load or refresh.

- **Endpoint**: `GET /api/users/me`
- **Access**: Protected (`Bearer <accessToken>`)
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X GET http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### JSON Response (`200 OK`)
```json
{
  "id": "7b8e1f6e-9e2b-42b5-a3d8-55a5b5f25a3a",
  "email": "otaku@example.com",
  "username": "kuroyomi_reader",
  "fullName": "Ken Kaneki",
  "avatarUrl": "https://cdn.kuroyomi.com/avatars/kaneki.webp",
  "isEmailVerified": true,
  "status": "ACTIVE",
  "roles": ["USER"],
  "createdAt": "2026-09-19T08:00:00.000Z",
  "updatedAt": "2026-09-19T08:05:00.000Z"
}
```

---

### 6. Update User Profile

Updates non-sensitive profile fields (`fullName`, `username`, `avatarUrl`). Prevents updating roles, passwords, verification status, or account status. Enforces uniqueness if username is changed.

- **Endpoint**: `PATCH /api/users/me`
- **Access**: Protected (`Bearer <accessToken>`)
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X PATCH http://localhost:3000/api/users/me \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "Ken Kaneki (Awakened)",
    "username": "kaneki_ghoul",
    "avatarUrl": "https://cdn.kuroyomi.com/avatars/kaneki-mask.webp"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "id": "7b8e1f6e-9e2b-42b5-a3d8-55a5b5f25a3a",
  "email": "otaku@example.com",
  "username": "kaneki_ghoul",
  "fullName": "Ken Kaneki (Awakened)",
  "avatarUrl": "https://cdn.kuroyomi.com/avatars/kaneki-mask.webp",
  "isEmailVerified": true,
  "status": "ACTIVE",
  "roles": ["USER"],
  "createdAt": "2026-09-19T08:00:00.000Z",
  "updatedAt": "2026-09-19T08:15:00.000Z"
}
```

---

### 7. Change User Password

Allows an authenticated user to change their password by validating their current password and supplying a new strong password. Automatically revokes all active refresh tokens / device sessions for security.

- **Endpoint**: `PATCH /api/users/me/password`
- **Access**: Protected (`Bearer <accessToken>`)
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X PATCH http://localhost:3000/api/users/me/password \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "currentPassword": "SecurePassword123!",
    "newPassword": "NewSuperSecretPassword789!"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "message": "Password changed successfully. All active sessions have been logged out for security."
}
```

---

### 8. Refresh Access Token (Token Rotation)

Consumes and revokes the provided Refresh Token, issuing a brand-new Access Token and a rotated Refresh Token.

- **Endpoint**: `POST /api/auth/refresh`
- **Access**: Public
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "deviceName": "MacBook Pro 16"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_NEW_ACCESS...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9_NEW_REFRESH..."
}
```

---

### 9. Single Device Session Logout

Revokes the specific refresh token session associated with the current device.

- **Endpoint**: `POST /api/auth/logout`
- **Access**: Protected (`Bearer <accessToken>`)
- **HTTP Status**: `204 No Content`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/logout \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

#### Response: `204 No Content`

---

### 10. Logout From All Devices (Global Invalidation)

Revokes **all active refresh token sessions** across all devices for the authenticated user.

- **Endpoint**: `POST /api/auth/logout-all`
- **Access**: Protected (`Bearer <accessToken>`)
- **HTTP Status**: `204 No Content`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/logout-all \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

#### Response: `204 No Content`

---

### 11. Forgot Password OTP Request

Dispatches a password reset OTP email. Returns an identical response regardless of whether the email exists to prevent user harvesting.

- **Endpoint**: `POST /api/auth/forgot-password`
- **Access**: Public
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/forgot-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otaku@example.com"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "message": "If the email exists, a password reset code has been sent."
}
```

---

### 12. Reset Password via OTP

Verifies the reset OTP, updates the user's password hash, and immediately terminates all active refresh token sessions across all devices for security.

- **Endpoint**: `POST /api/auth/reset-password`
- **Access**: Public
- **HTTP Status**: `200 OK`

#### cURL Request
```bash
curl -X POST http://localhost:3000/api/auth/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "otaku@example.com",
    "otp": "729104",
    "newPassword": "NewSuperSecretPassword456!"
  }'
```

#### JSON Response (`200 OK`)
```json
{
  "message": "Password reset successfully"
}
```

---

## 📧 Transactional Email & Notification System

The email subsystem is powered by `Nodemailer` through `MailService` in `src/common/mail/`.

### Email Features
- **Responsive HTML Templates**: Styled with modern typography, dark-mode styling, prominent OTP code callouts, and expiration notices.
- **Plain-Text Fallbacks**: Included automatically for email clients that disable HTML rendering.
- **Security Callouts**: Displays warning notices advising users never to share OTP codes with third parties.

---

## 🧪 Testing & Code Quality Assurance

```bash
# Run unit tests
pnpm test

# Run unit tests with watch mode
pnpm test:watch

# Generate unit test coverage report
pnpm test:cov

# Run end-to-end (E2E) integration tests
pnpm test:e2e

# Run ESLint validation and auto-fixes
pnpm lint

# Format codebase with Prettier
pnpm format
```

---

## 🗺️ Master Project Roadmap & Milestone Tracker (Phases 1–12)

| Phase | Milestone / Domain Area | Status | Key Deliverables |
| :--- | :--- | :---: | :--- |
| **Phase 1** | **Foundation & Architecture** | ✅ **DONE** | NestJS 11, PostgreSQL, TypeORM, env configurations, Joi schema validation, migrations & idempotent seeders. |
| **Phase 2** | **Authentication & Security** | ✅ **DONE** | Dual-token auth (JWT + rotation), bcrypt OTP verification, password reset, RBAC guards, device detection, Swagger docs. |
| **Phase 3** | **User Management Module** | ⏳ **IN PROGRESS** | User profiles, account settings, theme preferences, avatar uploads, reading activity logs. |
| **Phase 4** | **Catalog & Content Engine** | 📋 *Planned* | Manga/ebook series, volumes, chapters, pages, genres, full-text search, filtering & tags. |
| **Phase 5** | **Reading & Library Engine** | 📋 *Planned* | Page delivery API, cloud reading progress sync, bookmarks, favorites, and reading analytics. |
| **Phase 6** | **Wallet & Virtual Coins** | 📋 *Planned* | Coin wallet balance, pay-per-chapter unlocking, transaction ledger, daily login reward coins. |
| **Phase 7** | **Payment Gateway Integration** | 📋 *Planned* | Razorpay / Stripe integration, coin bundles, webhooks, invoice generation & purchase history. |
| **Phase 8** | **Admin CMS & Moderation** | 📋 *Planned* | Admin dashboard APIs, batch chapter upload pipeline, user bans, role management & sales analytics. |
| **Phase 9** | **Cloud Storage & CDN Delivery** | 📋 *Planned* | AWS S3 / Cloudflare R2 storage, signed image URLs, WebP conversion pipeline, CDN caching. |
| **Phase 10** | **Production Hardening** | 📋 *Planned* | Redis caching layer, distributed rate limiting, health probes (`@nestjs/terminus`), APM logging. |
| **Phase 11** | **Automated Testing Suite** | 📋 *Planned* | Comprehensive unit tests, E2E flow tests, database fixtures, load testing with k6. |
| **Phase 12** | **CI/CD & Deployment** | 📋 *Planned* | GitHub Actions pipeline, multi-stage Dockerfile, staging and zero-downtime production deployment. |

---

## 📦 Tech Stack Matrix

| Category | Technology | Version | Purpose |
| :--- | :--- | :--- | :--- |
| **Framework** | [NestJS](https://nestjs.com/) | `^11.0.1` | Modular backend architecture |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `^5.7.3` | Type-safe enterprise JavaScript |
| **Database** | [PostgreSQL](https://www.postgresql.org/) | `14+` | Relational ACID database |
| **ORM** | [TypeORM](https://typeorm.io/) | `^1.1.0` | Schema migrations, entities, repositories |
| **Authentication** | [Passport JWT](http://www.passportjs.org/) | `^0.7.0` | Stateless JWT and Bearer strategy |
| **Password Hashing** | [bcrypt](https://www.npmjs.com/package/bcrypt) | `^6.0.0` | Password and OTP hashing |
| **Validation** | [class-validator](https://github.com/typestack/class-validator) & [Joi](https://joi.dev/) | `^0.15.1` / `18.2.3` | Request payload and environment sanitization |
| **Email Service** | [Nodemailer](https://nodemailer.com/) | `^9.0.4` | SMTP transactional email delivery |
| **API Documentation** | [Swagger / OpenAPI](https://swagger.io/) | `^11.4.6` | Interactive API documentation (`/docs`) |
| **Package Manager** | [pnpm](https://pnpm.io/) | `^9.x` | Fast, disk-efficient package management |

---

## 📄 License

This project is licensed under the **UNLICENSED** / Proprietary license. All rights reserved.