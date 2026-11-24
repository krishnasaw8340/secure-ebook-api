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

| Property                | Access Token                                                      | Refresh Token                                               |
| :---------------------- | :---------------------------------------------------------------- | :---------------------------------------------------------- |
| **Lifespan**            | 15 Minutes (`JWT_EXPIRES_IN=15m`)                                 | 30 Days (`JWT_REFRESH_EXPIRES_IN=30d`)                      |
| **Validation Strategy** | **Stateless**: In-memory signature verification via `JwtStrategy` | **Stateful**: Database hash lookup in `auth.refresh_tokens` |
| **Storage in DB**       | Never stored in DB                                                | Stored as **SHA-256 cryptographic hash**                    |
| **Payload Claim**       | `{ sub, email, roles, type: 'access' }`                           | `{ sub, email, roles, type: 'refresh' }`                    |
| **Transmission**        | HTTP Header: `Authorization: Bearer <token>`                      | JSON Body: `{ "refreshToken": "<token>" }`                  |
| **Rotation Behavior**   | Re-issued upon calling `/auth/refresh`                            | **Single-use**: Consumed and replaced immediately           |
| **Secret Key**          | `JWT_SECRET`                                                      | `JWT_REFRESH_SECRET`                                        |

---

### Security & Defense Mechanisms

| Defense Layer                      | Implementation Detail                                                                  | Security Purpose                                                            |
| :--------------------------------- | :------------------------------------------------------------------------------------- | :-------------------------------------------------------------------------- |
| **Email Verification Gate**        | `user.isEmailVerified === true` checked before login                                   | Prevents spambots and unverified accounts from creating sessions.           |
| **Bcrypt OTP Hashing**             | OTPs are hashed using `bcrypt` before storage in `auth.otp_verifications`              | Prevents plain-text OTP leaks even in the event of a database compromise.   |
| **Brute-Force Throttle**           | `attempts` column increments per attempt; locked at > 5 attempts                       | Neutralizes OTP brute-forcing and dictionary attacks.                       |
| **Account Enumeration Immunity**   | `/auth/forgot-password` and `/auth/resend-verification-otp` return identical responses | Prevents malicious actors from discovering registered email addresses.      |
| **Strict Token Type Scoping**      | `payload.type` (`'access'` vs `'refresh'`) strictly enforced                           | Prevents using a refresh token to access API endpoints or vice versa.       |
| **Token Theft Neutralization**     | Reusing a consumed refresh token results in instant rejection                          | If a token is stolen and used after legitimate rotation, access is blocked. |
| **Global Session Teardown**        | Password reset and `/auth/logout-all` revoke all active tokens                         | Immediately invalidates compromised devices upon credential changes.        |
| **Global JWT Guard & `@Public()`** | Global `APP_GUARD` protects all routes by default                                      | Eliminates human error of forgetting to protect new endpoints.              |
| **Parameter Sanitization**         | `ValidationPipe` with `whitelist: true` & `transform: true`                            | Strips unexpected payload fields to prevent mass-assignment attacks.        |

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

- **Available Roles**: `SUPER_ADMIN`, `ADMIN`, `USER` (defined in `RoleType` enum).
- **`@Roles(...)` Decorator**: Attaches required role metadata to controller classes or route handlers.
- **`RolesGuard`**: Evaluates the authenticated user's assigned roles against the required metadata.

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

| Column              | Data Type      | Constraints                                 | Description                             |
| :------------------ | :------------- | :------------------------------------------ | :-------------------------------------- |
| `id`                | `uuid`         | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique user identifier                  |
| `email`             | `varchar(150)` | `UNIQUE`, `NOT NULL`                        | User email address                      |
| `username`          | `varchar(150)` | `UNIQUE`, `NOT NULL`                        | Unique public handle                    |
| `password`          | `varchar`      | `NOT NULL`                                  | Bcrypt password hash                    |
| `full_name`         | `varchar(150)` | `NOT NULL`                                  | User's display name                     |
| `avatar_url`        | `varchar`      | `NULLABLE`                                  | S3/CDN URL to profile avatar            |
| `is_email_verified` | `boolean`      | `NOT NULL`, Default `false`                 | Gatekeeper flag for login               |
| `status`            | `enum`         | `NOT NULL`, Default `'ACTIVE'`              | `'ACTIVE'`, `'INACTIVE'`, `'SUSPENDED'` |
| `created_at`        | `timestamptz`  | `NOT NULL`, Default `now()`                 | Record creation timestamp               |
| `updated_at`        | `timestamptz`  | `NOT NULL`, Default `now()`                 | Record last update timestamp            |

#### 2. Table: `auth.roles`

Defines permission levels.

| Column        | Data Type      | Constraints                                 | Description                          |
| :------------ | :------------- | :------------------------------------------ | :----------------------------------- |
| `id`          | `uuid`         | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique role identifier               |
| `name`        | `enum`         | `UNIQUE`, `NOT NULL`                        | `'SUPER_ADMIN'`, `'ADMIN'`, `'USER'` |
| `description` | `varchar(255)` | `NULLABLE`                                  | Human-readable role description      |
| `created_at`  | `timestamptz`  | `NOT NULL`, Default `now()`                 | Record creation timestamp            |
| `updated_at`  | `timestamptz`  | `NOT NULL`, Default `now()`                 | Record last update timestamp         |

#### 3. Table: `auth.user_roles`

Junction table linking users to roles (Many-to-Many).

| Column        | Data Type     | Constraints                                 | Description                      |
| :------------ | :------------ | :------------------------------------------ | :------------------------------- |
| `id`          | `uuid`        | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique junction identifier       |
| `user_id`     | `uuid`        | `FK -> auth.users(id) ON DELETE CASCADE`    | Target user ID                   |
| `role_id`     | `uuid`        | `FK -> auth.roles(id)`                      | Target role ID                   |
| `assigned_at` | `timestamptz` | `NOT NULL`, Default `now()`                 | Timestamp when role was assigned |

#### 4. Table: `auth.refresh_tokens`

Stores active and revoked refresh token sessions.

| Column         | Data Type      | Constraints                                 | Description                            |
| :------------- | :------------- | :------------------------------------------ | :------------------------------------- |
| `id`           | `uuid`         | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique session identifier              |
| `user_id`      | `uuid`         | `FK -> auth.users(id) ON DELETE CASCADE`    | Associated user                        |
| `token_hash`   | `varchar`      | `UNIQUE`, `NOT NULL`                        | SHA-256 hash of refresh token          |
| `device_name`  | `varchar(100)` | `NULLABLE`                                  | Parsed or client-supplied device name  |
| `ip_address`   | `varchar(45)`  | `NULLABLE`                                  | Client IPv4 or IPv6 address            |
| `user_agent`   | `text`         | `NULLABLE`                                  | Raw HTTP User-Agent string             |
| `last_used_at` | `timestamptz`  | `NULLABLE`                                  | Timestamp of last usage                |
| `expires_at`   | `timestamptz`  | `NOT NULL`                                  | Token expiration timestamp (30 days)   |
| `revoked_at`   | `timestamptz`  | `NULLABLE`                                  | Revocation timestamp (rotation/logout) |

#### 5. Table: `auth.otp_verifications`

Manages verification and password reset OTP codes.

| Column        | Data Type      | Constraints                                 | Description                                  |
| :------------ | :------------- | :------------------------------------------ | :------------------------------------------- |
| `id`          | `uuid`         | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique OTP record ID                         |
| `user_id`     | `uuid`         | `FK -> auth.users(id) ON DELETE CASCADE`    | Optional associated user ID                  |
| `email`       | `varchar(150)` | `NOT NULL`                                  | Email recipient                              |
| `otp_code`    | `varchar(255)` | `NOT NULL`                                  | Bcrypt hash of 6-digit OTP code              |
| `purpose`     | `enum`         | `NOT NULL`                                  | `'REGISTER'`, `'LOGIN'`, `'FORGOT_PASSWORD'` |
| `attempts`    | `integer`      | `NOT NULL`, Default `0`                     | Number of verification attempts              |
| `verified`    | `boolean`      | `NOT NULL`, Default `false`                 | Whether OTP was successfully redeemed        |
| `expires_at`  | `timestamptz`  | `NOT NULL`                                  | Expiration timestamp (10 minutes)            |
| `verified_at` | `timestamptz`  | `NULLABLE`                                  | Redemption timestamp                         |

---

### Catalog Schema & Content Hierarchy

All manga and ebook content metadata are isolated in the dedicated PostgreSQL `"catalog"` schema.

#### Domain Content Hierarchy

The catalog architecture supports both episodic manga with multi-volume groupings and direct standalone digital releases without intermediate volume records:

```
BookSeries (Overall franchise, e.g., "One Piece")
   │
   ├── Volumes (Optional grouping, e.g., "Volume 1", "Volume 2")
   │      │
   │      └── Books (Digital language edition, e.g., "English Digital Edition")
   │             │
   │             ├── Chapters (Configured with free/paid pricing model)
   │             │      │
   │             │      └── Pages (Encrypted/clean object storage keys & dimensions)
   │             │
   │             ├── Language (Required, e.g., "en", "ja")
   │             ├── Category (Required, e.g., "Manga", "Manhwa", "Novel")
   │             ├── Author / Artist (Optional creator attribution)
   │             └── BookGenres / BookTags (Junction entities to Genres and Tags)
   │
   └── Books (Direct Series Books, volume_id is NULL)
          │
          └── Chapters ──► Pages
```

#### Catalog ER Diagram

```mermaid
erDiagram
    "catalog.book_series" ||--o{ "catalog.volumes" : "contains (1:N)"
    "catalog.book_series" ||--o{ "catalog.books" : "has (1:N)"
    "catalog.book_series" ||--o{ "catalog.media_assets" : "has banners/covers"

    "catalog.volumes" ||--o{ "catalog.books" : "groups (0..1:N)"
    "catalog.volumes" ||--o{ "catalog.media_assets" : "has covers"

    "catalog.books" ||--o{ "catalog.chapters" : "contains"
    "catalog.books" ||--o{ "catalog.book_genres" : "classified into"
    "catalog.books" ||--o{ "catalog.book_tags" : "tagged with"
    "catalog.books" ||--o{ "catalog.media_assets" : "has covers/thumbs"
    "catalog.books" }o--|| "catalog.languages" : "written in"
    "catalog.books" }o--|| "catalog.categories" : "categorized as"
    "catalog.books" }o--o| "catalog.authors" : "written by"
    "catalog.books" }o--o| "catalog.artists" : "illustrated by"

    "catalog.genres" ||--o{ "catalog.book_genres" : "assigned to"
    "catalog.tags" ||--o{ "catalog.book_tags" : "assigned to"

    "catalog.chapters" ||--o{ "catalog.pages" : "ordered pages"

    "catalog.book_series" {
        uuid id PK
        varchar name "max 255 chars"
        varchar slug UK "max 255 chars"
        text description
        enum status "DRAFT | ONGOING | COMPLETED | HIATUS | PUBLISHED | ARCHIVED"
        timestamptz deleted_at "soft delete"
    }

    "catalog.volumes" {
        uuid id PK
        uuid series_id FK "REFERENCES catalog.book_series(id) ON DELETE CASCADE"
        numeric volume_number "e.g. 1.00, 7.50"
        varchar title "nullable"
        varchar slug "indexed"
        integer sort_order "default 0"
        enum status "DRAFT | PUBLISHED | ARCHIVED"
    }

    "catalog.books" {
        uuid id PK
        uuid series_id FK "REFERENCES catalog.book_series(id) ON DELETE RESTRICT"
        uuid volume_id FK "REFERENCES catalog.volumes(id) ON DELETE SET NULL"
        uuid language_id FK "REFERENCES catalog.languages(id) ON DELETE RESTRICT"
        uuid category_id FK "REFERENCES catalog.categories(id) ON DELETE RESTRICT"
        uuid author_id FK "REFERENCES catalog.authors(id) ON DELETE SET NULL"
        uuid artist_id FK "REFERENCES catalog.artists(id) ON DELETE SET NULL"
        varchar title
        varchar slug UK
        enum status "DRAFT | PUBLISHED | UNPUBLISHED | ARCHIVED"
        enum pricing_model "FREE | PER_PAGE | PER_CHAPTER | PER_BOOK | SUBSCRIPTION"
        integer default_coin_per_page
        integer default_free_chapters
        boolean is_premium
        numeric average_rating
        bigint total_views
    }

    "catalog.chapters" {
        uuid id PK
        uuid book_id FK "REFERENCES catalog.books(id) ON DELETE CASCADE"
        numeric chapter_number "e.g. 1.00, 10.50"
        varchar title "nullable"
        integer sort_order "deterministic sequence"
        enum pricing_model "FREE | PARTIAL_FREE | PAID"
        integer free_page_count
        integer coin_cost
        integer page_count
        boolean published
    }

    "catalog.pages" {
        uuid id PK
        uuid chapter_id FK "REFERENCES catalog.chapters(id) ON DELETE CASCADE"
        integer page_number "1-indexed"
        integer sort_order "reading order"
        varchar storage_key "R2/S3 object path"
        varchar encrypted_key "DRM encryption key"
        integer width "image dimensions"
        integer height "image dimensions"
        varchar mime_type
        integer file_size
        varchar checksum
    }
```

---

### Catalog Data Dictionary

#### 6. Table: `catalog.book_series`

Root manga/comic/novel series entity.

| Column        | Data Type      | Constraints                                 | Description                                                        |
| :------------ | :------------- | :------------------------------------------ | :----------------------------------------------------------------- |
| `id`          | `uuid`         | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique series ID                                                   |
| `name`        | `varchar(255)` | `NOT NULL`                                  | Franchise series title                                             |
| `slug`        | `varchar(255)` | `UNIQUE`, `NOT NULL`, Indexed               | SEO-friendly URL slug                                              |
| `description` | `text`         | `NULLABLE`                                  | Series synopsis                                                    |
| `status`      | `enum`         | Default `DRAFT`                             | `DRAFT`, `ONGOING`, `COMPLETED`, `HIATUS`, `PUBLISHED`, `ARCHIVED` |
| `created_at`  | `timestamptz`  | `NOT NULL`                                  | Creation timestamp                                                 |
| `updated_at`  | `timestamptz`  | `NOT NULL`                                  | Last update timestamp                                              |
| `deleted_at`  | `timestamptz`  | `NULLABLE`                                  | Soft delete timestamp                                              |

#### 7. Table: `catalog.volumes`

Represents an optional volume grouping within a series.

| Column          | Data Type       | Constraints                                       | Description                                |
| :-------------- | :-------------- | :------------------------------------------------ | :----------------------------------------- |
| `id`            | `uuid`          | `PRIMARY KEY`, Default `uuid_generate_v4()`       | Unique volume ID                           |
| `series_id`     | `uuid`          | `FK -> catalog.book_series(id) ON DELETE CASCADE` | Parent series                              |
| `volume_number` | `numeric(5, 2)` | `NOT NULL`                                        | Volume number (supports decimals like 0.5) |
| `title`         | `varchar(255)`  | `NULLABLE`                                        | Optional volume subtitle                   |
| `slug`          | `varchar(255)`  | `NOT NULL`, Indexed                               | Volume slug                                |
| `description`   | `text`          | `NULLABLE`                                        | Volume synopsis                            |
| `sort_order`    | `integer`       | Default `0`, Indexed                              | Display sort order                         |
| `release_date`  | `date`          | `NULLABLE`                                        | Official release date                      |
| `status`        | `enum`          | Default `DRAFT`                                   | `DRAFT`, `PUBLISHED`, `ARCHIVED`           |
| `published_at`  | `timestamptz`   | `NULLABLE`                                        | Publication timestamp                      |
| `deleted_at`    | `timestamptz`   | `NULLABLE`                                        | Soft delete timestamp                      |

_Constraints_: `UNIQUE(series_id, volume_number)`, `INDEX(series_id, sort_order)`.

#### 8. Table: `catalog.books`

The digital readable edition/content item.

| Column                  | Data Type       | Constraints                                        | Description                                                   |
| :---------------------- | :-------------- | :------------------------------------------------- | :------------------------------------------------------------ |
| `id`                    | `uuid`          | `PRIMARY KEY`, Default `uuid_generate_v4()`        | Unique book ID                                                |
| `series_id`             | `uuid`          | `FK -> catalog.book_series(id) ON DELETE RESTRICT` | Required parent series                                        |
| `volume_id`             | `uuid`          | `FK -> catalog.volumes(id) ON DELETE SET NULL`     | Optional parent volume                                        |
| `title`                 | `varchar(255)`  | `NOT NULL`                                         | Book title                                                    |
| `japanese_title`        | `varchar(255)`  | `NULLABLE`                                         | Native original script title                                  |
| `slug`                  | `varchar(255)`  | `UNIQUE`, `NOT NULL`, Indexed                      | Unique URL identifier                                         |
| `description`           | `text`          | `NULLABLE`                                         | Content overview                                              |
| `author_id`             | `uuid`          | `FK -> catalog.authors(id) ON DELETE SET NULL`     | Author reference                                              |
| `artist_id`             | `uuid`          | `FK -> catalog.artists(id) ON DELETE SET NULL`     | Illustrator reference                                         |
| `language_id`           | `uuid`          | `FK -> catalog.languages(id) ON DELETE RESTRICT`   | Content language                                              |
| `category_id`           | `uuid`          | `FK -> catalog.categories(id) ON DELETE RESTRICT`  | Content category (Manga/Novel)                                |
| `status`                | `enum`          | Default `DRAFT`                                    | `DRAFT`, `PUBLISHED`, `UNPUBLISHED`, `ARCHIVED`               |
| `pricing_model`         | `enum`          | Default `FREE`                                     | `FREE`, `PER_PAGE`, `PER_CHAPTER`, `PER_BOOK`, `SUBSCRIPTION` |
| `default_coin_per_page` | `integer`       | Default `0`                                        | Default unlocking cost per page                               |
| `default_free_chapters` | `integer`       | Default `0`                                        | Number of starting free chapters                              |
| `default_free_pages`    | `integer`       | Default `0`                                        | Free preview page count                                       |
| `is_premium`            | `boolean`       | Default `false`                                    | Flag for VIP/subscriber priority                              |
| `total_chapters`        | `integer`       | Default `0`                                        | Cached chapter counter                                        |
| `total_pages`           | `integer`       | Default `0`                                        | Cached page counter                                           |
| `average_rating`        | `numeric(3, 2)` | Default `0.00`                                     | Rating aggregated score                                       |
| `total_views`           | `bigint`        | Default `0`                                        | Aggregate reader view count                                   |
| `release_date`          | `date`          | `NULLABLE`                                         | Content release date                                          |
| `published_at`          | `timestamptz`   | `NULLABLE`                                         | Publication timestamp                                         |
| `created_by`            | `uuid`          | `NULLABLE`, Indexed                                | Auditing: Admin user creator ID                               |
| `updated_by`            | `uuid`          | `NULLABLE`                                         | Auditing: Admin user editor ID                                |
| `deleted_at`            | `timestamptz`   | `NULLABLE`                                         | Soft delete timestamp                                         |

#### 9. Table: `catalog.chapters`

Chapter configuration and pricing overrides.

| Column            | Data Type       | Constraints                                 | Description                     |
| :---------------- | :-------------- | :------------------------------------------ | :------------------------------ |
| `id`              | `uuid`          | `PRIMARY KEY`, Default `uuid_generate_v4()` | Unique chapter ID               |
| `book_id`         | `uuid`          | `FK -> catalog.books(id) ON DELETE CASCADE` | Parent book                     |
| `chapter_number`  | `numeric(6, 2)` | `NOT NULL`                                  | Chapter number (supports 10.5)  |
| `title`           | `varchar(255)`  | `NULLABLE`                                  | Optional chapter title          |
| `sort_order`      | `integer`       | Default `0`                                 | Deterministic sequence order    |
| `pricing_model`   | `enum`          | Default `FREE`                              | `FREE` or `PAID`                |
| `coin_cost`       | `integer`       | Default `0`                                 | Required coin unlocking fee     |
| `pages`           | `jsonb`         | Default `[]`                                | Ordered WebP page metadata      |
| `page_count`      | `integer`       | Default `0`                                 | Total image page count          |
| `content_status`  | `enum`          | Default `PENDING`                           | `PENDING`, `READY`, or `FAILED` |
| `published`       | `boolean`       | Default `false`                             | Publication visibility flag     |
| `published_at`    | `timestamptz`   | `NULLABLE`                                  | Publication timestamp           |
| `deleted_at`      | `timestamptz`   | `NULLABLE`                                  | Soft delete timestamp           |

_Constraints_: `INDEX(book_id, sort_order)`, `INDEX(book_id, chapter_number)`.

#### 10. Chapter page asset format

The `catalog.chapters.pages` JSONB array stores ordered entries shaped like `{ "pageNumber": 1, "imageUrl": "<private storage key>", "storageKey": "<private storage key>", "width": 1200, "height": 2400 }`. Reader access returns short-lived signed URLs instead of exposing public S3 assets.

#### 11. Table: `catalog.media_assets`

Media references for franchise covers, banners, and promotional artwork.

| Column             | Data Type      | Constraints                                       | Description                                 |
| :----------------- | :------------- | :------------------------------------------------ | :------------------------------------------ |
| `id`               | `uuid`         | `PRIMARY KEY`, Default `uuid_generate_v4()`       | Unique asset ID                             |
| `asset_type`       | `enum`         | `NOT NULL`                                        | `COVER`, `BANNER`, `THUMBNAIL`, `PROMOTION` |
| `storage_key`      | `varchar(500)` | `NOT NULL`                                        | Private object storage key                  |
| `mime_type`        | `varchar(50)`  | `NULLABLE`                                        | Media MIME type                             |
| `file_size`        | `integer`      | `NULLABLE`                                        | File byte size                              |
| `width` / `height` | `integer`      | `NULLABLE`                                        | Image dimensions                            |
| `sort_order`       | `integer`      | Default `0`                                       | Carousel display order                      |
| `alt_text`         | `varchar(255)` | `NULLABLE`                                        | Accessibility text description              |
| `series_id`        | `uuid`         | `FK -> catalog.book_series(id) ON DELETE CASCADE` | Optional series link                        |
| `volume_id`        | `uuid`         | `FK -> catalog.volumes(id) ON DELETE CASCADE`     | Optional volume link                        |
| `book_id`          | `uuid`         | `FK -> catalog.books(id) ON DELETE CASCADE`       | Optional book link                          |

#### 12–14. Reference & Junction Tables

- **`catalog.authors`**: `id`, `name`, `slug` (UK), `bio`, `profile_image`, timestamps, `deleted_at`.
- **`catalog.artists`**: `id`, `name`, `slug` (UK), `bio`, `profile_image`, timestamps, `deleted_at`.
- **`catalog.languages`**: `id`, `name` (UK), `code` (UK, e.g., `en`, `ja`), timestamps.
- **`catalog.categories`**: `id`, `name` (UK), `slug` (UK, e.g., `manga`, `novel`), `description`, timestamps.
- **`catalog.genres`**: `id`, `name` (UK), `slug` (UK, e.g., `action`, `romance`), `description`, timestamps.
- **`catalog.tags`**: `id`, `name` (UK), `slug` (UK, e.g., `magic`, `pirates`), `description`, timestamps.
- **`catalog.book_genres`**: Junction with `UNIQUE(book_id, genre_id)`, cascades on deletion.
- **`catalog.book_tags`**: Junction with `UNIQUE(book_id, tag_id)`, cascades on deletion.

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

### Applied Migration History
1. `1786079461230-InitialAuthSchema.ts`: Creates PostgreSQL schema `"auth"`, `users`, `roles`, `user_roles`, `refresh_tokens`, and `otp_verifications`.
2. `1789834302660-CreateCatalogSchema.ts`: Creates PostgreSQL schema `"catalog"`, all 14 catalog tables, enums, FK constraints, and composite reading indexes.
```

> [!TIP]
> When creating or editing migrations for custom PostgreSQL schemas (such as `"auth"`), ensure `CREATE SCHEMA IF NOT EXISTS "auth"` is executed at the beginning of the `up` method.

---

### Idempotent Seeder System

Seeders check for the existence of baseline records before inserting, making them safe to run repeatedly without producing duplicates or constraint violations.

- **Automatic Boot Seeding**: On application startup, `DatabaseSeederService` automatically executes all registered baseline seeders.
- **Registered Seeders**:
  1. `RoleSeeder`: Baseline system roles (`SUPER_ADMIN`, `ADMIN`, `USER`).
  2. `LanguageSeeder`: Core publishing languages (`English`, `Japanese`, `French`, `German`).
  3. `CategorySeeder`: Content formats (`Manga`, `Manhwa`, `Manhua`, `Novel`, `Light Novel`).
  4. `GenreSeeder`: Core catalog genres (`Action`, `Adventure`, `Comedy`, `Drama`, `Fantasy`, `Romance`, `Horror`, `Mystery`, `Sci-Fi`).
  5. `TagSeeder`: Content theme tags (`School`, `Magic`, `Revenge`, `Time Travel`, `Pirates`, `Supernatural`).
- **Manual Seeding CLI**:
  ```bash
  # Run all registered seeders (Roles, Languages, Categories, Genres, Tags)
  pnpm seed

  # Run roles seeder only
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
MAX_CHAPTER_IMAGE_SIZE_MB=20
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

### 6.2 User Profile Management

#### 5. Get Current User Profile (Database Hydrated)

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

### 6.3 Series Catalog Management

#### 13. Create Franchise Series

Creates a new franchise series root (Admin only).

- **Endpoint**: `POST /api/series`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `201 Created`

##### cURL Request

```bash
curl -X POST http://localhost:3000/api/series \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "One Piece",
    "slug": "one-piece",
    "description": "The epic voyage of Monkey D. Luffy and the Straw Hat Pirates across the Grand Line.",
    "status": "PUBLISHED"
  }'
```

##### JSON Response (`201 Created`)

```json
{
  "id": "a0000000-0000-0000-0000-000000000001",
  "name": "One Piece",
  "slug": "one-piece",
  "description": "The epic voyage of Monkey D. Luffy and the Straw Hat Pirates across the Grand Line.",
  "status": "PUBLISHED",
  "createdAt": "2026-09-20T00:00:00.000Z",
  "updatedAt": "2026-09-20T00:00:00.000Z"
}
```

---

#### 14. List Franchise Series

Retrieves a paginated list of series with search, status filtering, and visibility scoping. Public users only receive published series.

- **Endpoint**: `GET /api/series`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`
- **Query Parameters**:
  - `search` _(optional)_: Fuzzy search by series name or description.
  - `status` _(optional, Admin only)_: `DRAFT | ONGOING | COMPLETED | HIATUS | PUBLISHED | ARCHIVED`.
  - `page` _(optional, default: 1)_: Page number.
  - `limit` _(optional, default: 20, max: 100)_: Items per page.
  - `sortBy` _(optional, default: 'createdAt')_: `createdAt | name | status`.
  - `sortOrder` _(optional, default: 'DESC')_: `ASC | DESC`.

##### cURL Request

```bash
curl -X GET "http://localhost:3000/api/series?search=Piece&page=1&limit=20"
```

##### JSON Response (`200 OK`)

```json
{
  "data": [
    {
      "id": "a0000000-0000-0000-0000-000000000001",
      "name": "One Piece",
      "slug": "one-piece",
      "description": "The epic voyage of Monkey D. Luffy...",
      "status": "PUBLISHED",
      "createdAt": "2026-09-20T00:00:00.000Z",
      "updatedAt": "2026-09-20T00:00:00.000Z"
    }
  ],
  "meta": {
    "total": 1,
    "page": 1,
    "limit": 20,
    "totalPages": 1,
    "hasNextPage": false,
    "hasPrevPage": false
  }
}
```

---

#### 15. Get Series by UUID or Slug

Fetches a single series with joined volume, book, and media asset relations.

- **Endpoint**: `GET /api/series/:id`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`
- **Parameters**: `id` can be a UUID (`a000...`) or URL slug (`one-piece`).

##### cURL Request

```bash
curl -X GET http://localhost:3000/api/series/one-piece
```

---

#### 16. Update Series

Updates series metadata, slug, or status (Admin only).

- **Endpoint**: `PATCH /api/series/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

#### 17. Delete Series

Soft-deletes a series by setting `deleted_at` timestamp (Admin only).

- **Endpoint**: `DELETE /api/series/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

### 6.4 Volume Catalog Management

#### 18. Create Volume in Series

Creates a new volume grouping within a parent franchise series (Admin only).

- **Endpoint**: `POST /api/volumes`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `201 Created`

##### cURL Request

```bash
curl -X POST http://localhost:3000/api/volumes \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": "a0000000-0000-0000-0000-000000000001",
    "volumeNumber": 1,
    "title": "Romance Dawn",
    "description": "Luffy begins his journey to find the legendary One Piece treasure.",
    "sortOrder": 10,
    "status": "PUBLISHED"
  }'
```

##### JSON Response (`201 Created`)

```json
{
  "id": "b0000000-0000-0000-0000-000000000001",
  "seriesId": "a0000000-0000-0000-0000-000000000001",
  "volumeNumber": 1.0,
  "title": "Romance Dawn",
  "slug": "one-piece-vol-1",
  "description": "Luffy begins his journey to find the legendary One Piece treasure.",
  "sortOrder": 10,
  "status": "PUBLISHED",
  "createdAt": "2026-09-20T00:00:00.000Z",
  "updatedAt": "2026-09-20T00:00:00.000Z"
}
```

---

#### 19. List Volumes

Lists volumes with optional `seriesId` filtering, title search, pagination, and visibility scoping.

- **Endpoint**: `GET /api/volumes`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`
- **Query Parameters**:
  - `seriesId` _(optional)_: Filter by parent series UUID.
  - `search` _(optional)_: Fuzzy search by volume title or description.
  - `status` _(optional, Admin only)_: `DRAFT | PUBLISHED | ARCHIVED`.
  - `page` _(optional, default: 1)_: Page number.
  - `limit` _(optional, default: 20, max: 100)_: Volumes per page.
  - `sortBy` _(optional, default: 'sortOrder')_: `volumeNumber | sortOrder | createdAt | title`.
  - `sortOrder` _(optional, default: 'ASC')_: `ASC | DESC`.

---

#### 20. Get Volume by UUID or Slug

Fetches a single volume with joined series, book, and media asset relations.

- **Endpoint**: `GET /api/volumes/:id`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`

---

#### 21. Update Volume

Updates volume metadata or publishing status (Admin only).

- **Endpoint**: `PATCH /api/volumes/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

#### 22. Delete Volume

Soft-deletes a volume by setting `deleted_at` timestamp (Admin only).

- **Endpoint**: `DELETE /api/volumes/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

### 6.5 Book Catalog Management

#### 23. Create Book

Creates a new digital edition/book with relational links to Series, Volume, Language, Category, Authors, Artists, Genres, and Tags (Admin only).

- **Endpoint**: `POST /api/books`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `201 Created`

##### cURL Request

```bash
curl -X POST http://localhost:3000/api/books \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "seriesId": "a0000000-0000-0000-0000-000000000001",
    "volumeId": "b0000000-0000-0000-0000-000000000001",
    "title": "One Piece, Vol. 1: Romance Dawn",
    "japaneseTitle": "ONE PIECE 1 ROMANCE DAWN —冒険の夜明け—",
    "languageId": "e0000000-0000-0000-0000-000000000001",
    "categoryId": "f0000000-0000-0000-0000-000000000001",
    "genreIds": ["g0000000-0000-0000-0000-000000000001"],
    "tagIds": ["t0000000-0000-0000-0000-000000000001"],
    "pricingModel": "FREE",
    "status": "PUBLISHED"
  }'
```

##### JSON Response (`201 Created`)

```json
{
  "id": "e0000000-0000-0000-0000-000000000001",
  "seriesId": "a0000000-0000-0000-0000-000000000001",
  "volumeId": "b0000000-0000-0000-0000-000000000001",
  "title": "One Piece, Vol. 1: Romance Dawn",
  "japaneseTitle": "ONE PIECE 1 ROMANCE DAWN —冒険の夜明け—",
  "slug": "one-piece-vol-1-romance-dawn",
  "status": "PUBLISHED",
  "pricingModel": "FREE",
  "totalChapters": 0,
  "totalPages": 0,
  "createdAt": "2026-09-20T00:00:00.000Z",
  "updatedAt": "2026-09-20T00:00:00.000Z"
}
```

---

#### 24. List Books

Lists books with comprehensive relational filtering (`seriesId`, `volumeId`, `languageId`, `categoryId`, `authorId`, `artistId`, `genreId`, `tagId`, `pricingModel`, `isPremium`), search, sorting, and pagination.

- **Endpoint**: `GET /api/books`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`

---

#### 25. Get Book by UUID or Slug

Fetches a single book with joined relational details including series, volume, language, category, author, artist, genres, and tags.

- **Endpoint**: `GET /api/books/:id`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`

---

#### 26. Update Book

Updates book metadata, pricing model, publication status, or relational associations (Admin only).

- **Endpoint**: `PATCH /api/books/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

#### 27. Delete Book

Soft-deletes a book by setting `deleted_at` timestamp (Admin only).

- **Endpoint**: `DELETE /api/books/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

#### 28. Generate Book Cover Upload URL

Generates a short-lived presigned AWS S3 `PUT` URL for direct browser-to-S3 book cover image upload (Admin only).

- **Endpoint**: `POST /api/books/:bookId/cover/upload-url`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`
- **Allowed Formats**: JPEG, PNG, WebP (Max size configured via `MAX_BOOK_COVER_SIZE_MB`, default 10MB)

##### Request Body

```json
{
  "contentType": "image/png",
  "fileSize": 1048576
}
```

##### Response (`200 OK`)

```json
{
  "bookId": "e0000000-0000-0000-0000-000000000001",
  "objectKey": "books/e0000000-0000-0000-0000-000000000001/cover/cover",
  "uploadUrl": "https://ebook-platform-pdfs-prod.s3.ap-south-1.amazonaws.com/books/.../cover/cover?...",
  "contentType": "image/png",
  "expiresIn": 600
}
```

---

#### 29. Complete Book Cover Upload

Verifies the uploaded cover file in AWS S3 (via S3 `HeadObject` and binary magic-byte detection) and updates the book record (Admin only).

- **Endpoint**: `POST /api/books/:bookId/cover/complete`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

##### Response (`200 OK`)

Returns the updated Book object with `coverImageUrl` (presigned GET URL) populated.

---

### 6.6 Chapter Catalog Management & S3 PDF Streaming

#### 30. Create Chapter

Creates a new chapter for a book with monetization pricing model, sort order, and page metadata (Admin only).

- **Endpoint**: `POST /api/chapters`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `201 Created`
- **Monetization Pricing Rules**:
  - `FREE`: Unlocked for all readers. `freePageCount` and `coinCost` default to 0.
  - `PARTIAL_FREE`: Requires `freePageCount > 0` (e.g. first 3 pages previewable for free).
  - `PAID`: Requires `coinCost > 0` (e.g. 50 coins to unlock chapter).

##### cURL Request

```bash
curl -X POST http://localhost:3000/api/chapters \
  -H "Authorization: Bearer <adminAccessToken>" \
  -H "Content-Type: application/json" \
  -d '{
    "bookId": "e0000000-0000-0000-0000-000000000001",
    "chapterNumber": 1,
    "title": "Romance Dawn — Dawn of the Adventure",
    "sortOrder": 10,
    "pricingModel": "FREE",
    "published": true
  }'
```

##### JSON Response (`201 Created`)

```json
{
  "id": "c0000000-0000-0000-0000-000000000001",
  "bookId": "e0000000-0000-0000-0000-000000000001",
  "chapterNumber": 1.0,
  "title": "Romance Dawn — Dawn of the Adventure",
  "sortOrder": 10,
  "pricingModel": "FREE",
  "freePageCount": 0,
  "coinCost": 0,
  "contentStatus": "PENDING",
  "published": true,
  "publishedAt": "2026-09-20T00:00:00.000Z",
  "createdAt": "2026-09-20T00:00:00.000Z",
  "updatedAt": "2026-09-20T00:00:00.000Z"
}
```

---

#### 31. List Chapters

Retrieves a paginated list of chapters ordered by `sortOrder ASC`. Public users strictly receive `published: true` chapters.

- **Endpoint**: `GET /api/chapters`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`
- **Query Parameters**:
  - `bookId` _(optional)_: Filter chapters by parent book UUID.
  - `pricingModel` _(optional)_: `FREE | PARTIAL_FREE | PAID`.
  - `published` _(optional, Admin only)_: `true | false`.
  - `search` _(optional)_: Fuzzy search by chapter title.
  - `page` _(optional, default: 1)_: Page number.
  - `limit` _(optional, default: 20, max: 100)_: Chapters per page.
  - `sortBy` _(optional, default: 'sortOrder')_: `chapterNumber | sortOrder | createdAt | title`.
  - `sortOrder` _(optional, default: 'ASC')_: `ASC | DESC`.

---

#### 32. Get Chapter by ID

Fetches a single chapter by UUID with joined parent book relation.

- **Endpoint**: `GET /api/chapters/:id`
- **Access**: Public / Authenticated
- **HTTP Status**: `200 OK`

---

#### 33. Update Chapter

Updates chapter details, pricing model, coin cost, or publication status (Admin only).

- **Endpoint**: `PATCH /api/chapters/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

#### 34. Delete Chapter

Soft-deletes a chapter by setting `deleted_at` timestamp and automatically syncs the book's `totalChapters` counter (Admin only).

- **Endpoint**: `DELETE /api/chapters/:id`
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

---

#### 35. Generate Chapter PDF Upload URL

Generates a direct browser-to-S3 presigned `PUT` upload URL for a chapter's PDF file (Admin only).

- **Endpoint**: `POST /api/chapters/:id/content/upload-url` _(also available at `/api/admin/chapters/:id/content/upload-url`)_
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

##### Request Body

```json
{
  "fileSize": 15728640,
  "fileName": "chapter_01.pdf",
  "mimeType": "application/pdf"
}
```

##### Response (`200 OK`)

```json
{
  "uploadUrl": "https://ebook-platform-pdfs-prod.s3.ap-south-1.amazonaws.com/chapters/c0000000.../versions/.../chapter.pdf?...",
  "objectKey": "chapters/c0000000-0000-0000-0000-000000000001/versions/v0000000-0000-0000-0000-000000000001/chapter.pdf",
  "uploadId": "u0000000-0000-0000-0000-000000000001",
  "versionId": "v0000000-0000-0000-0000-000000000001",
  "expiresIn": 600
}
```

---

#### 36. Complete Chapter PDF Upload

Validates the uploaded PDF in S3 (`HeadObject` and PDF magic bytes `%PDF`), verifies file size, updates `contentStatus: "READY"`, and increments book chapter/page counters (Admin only).

- **Endpoint**: `POST /api/chapters/:id/content/complete` _(also available at `/api/admin/chapters/:id/content/complete`)_
- **Access**: Protected (`Roles: ADMIN, SUPER_ADMIN`)
- **HTTP Status**: `200 OK`

##### Request Body

```json
{
  "objectKey": "chapters/c0000000-0000-0000-0000-000000000001/versions/v0000000-0000-0000-0000-000000000001/chapter.pdf",
  "fileName": "chapter_01.pdf",
  "fileSize": 15728640,
  "pageCount": 28
}
```

---

#### WebP Multi-Page Chapter Upload

Chapter pages are uploaded as separate WebP objects to avoid oversized stitched images. The reader obtains short-lived page URLs through the authorized chapter access endpoint.

- **Upload URLs**: `POST /api/chapters/:id/pages/upload-urls` with `{ "pages": [{ "fileName": "01.webp", "fileSize": 420000, "contentType": "image/webp" }] }`
- **Save order**: `PUT /api/chapters/:id/pages` with ordered page entries containing `pageNumber`, `storageKey`, and optional `width`/`height`
- **Access**: Upload and save endpoints require `ADMIN` or `SUPER_ADMIN`; image uploads are limited by `MAX_CHAPTER_IMAGE_SIZE_MB` (default 20 MB per page).
- The backend verifies each uploaded S3 object is a WebP before setting the chapter to `READY`.

---

#### 37. Get Authorized Chapter Reader Access URL

Generates short-lived, secure presigned AWS S3 URLs for ordered WebP pages (or a legacy PDF). Validates chapter unlock status, free pricing model, or user coin purchases before granting access.

- **Endpoint**: `GET /api/chapters/:id/access`
- **Access**: Authenticated (`JwtAuthGuard`)
- **HTTP Status**: `200 OK`

##### Response (`200 OK`)

```json
{
  "chapterId": "c0000000-0000-0000-0000-000000000001",
  "bookId": "e0000000-0000-0000-0000-000000000001",
  "title": "Romance Dawn — Dawn of the Adventure",
  "chapterNumber": 1.0,
  "pageCount": 2,
  "isUnlocked": true,
  "pages": [
    { "pageNumber": 1, "imageUrl": "<short-lived signed WebP URL>", "width": 1200, "height": 2400 },
    { "pageNumber": 2, "imageUrl": "<short-lived signed WebP URL>", "width": 1200, "height": 2400 }
  ],
  "expiresIn": 600
}
```

---

## ☁️ AWS S3 Storage & Secure Media Architecture

All raw manga & comic PDFs and high-resolution cover images are securely stored in private AWS S3 buckets:

1. **Direct Browser-to-S3 Uploads**: The frontend requests a presigned `PUT` URL and streams the raw binary file directly to S3, bypassing backend memory and CPU overhead.
2. **Double Verification Barrier**:
   - Backend performs `HeadObject` to verify existence, size, and Content-Type.
   - Backend reads initial bytes to verify cryptographic **Magic Byte Signatures** (`%PDF` for PDFs, `0xFFD8FF` for JPEG, `\x89PNG` for PNG, `RIFF...WEBP` for WebP).
3. **Zero Public S3 Exposure**: The S3 bucket remains strictly private with Block Public Access enabled. Readers access media exclusively through short-lived presigned URLs generated after token and entitlement validation.

---

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
