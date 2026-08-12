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

#### Database & Infrastructure
- [x] Auth Entities (`User`, `Role`, `UserRole`, `RefreshToken`, `OtpVerification`)
- [x] Migrations & Schema Setup
- [x] Idempotent Seeders (`seed:roles`, `seed`)
- [x] Config Module & Setup
- [x] `PasswordService` (bcrypt hashing)
- [x] `TokenService` (Access & Refresh tokens lifecycle)
- [x] `UsersService` (User operations & role assignments)
- [x] `RefreshTokenService` (Hashed token persistence)

#### Features & API Progress
- [x] User Registration (`POST /auth/register`)
- [x] User Login (`POST /auth/login`)
- [x] JWT Strategy (`passport-jwt`)
- [x] JWT Auth Guard (`JwtAuthGuard`)
- [x] Authenticated User Profile (`GET /auth/me`)
- [x] Refresh Token API (`POST /auth/refresh`)
- [x] Refresh Token Rotation (`POST /auth/refresh`)
- [ ] User Logout (`POST /auth/logout`)
- [ ] Email OTP Verification
- [ ] Roles Guard & Authorization (`@Roles()`)

---

### 🔑 Dual-Token Architecture & Security Deep-Dive

#### 💡 Why Dual Tokens with Rotation? (Access vs. Refresh Tokens)

In web applications, using a single token causes trade-offs between security and usability:
- **Single Short-Lived Token**: Forces users to re-enter credentials constantly, degrading UX.
- **Single Long-Lived Token**: Creates a massive security risk if intercepted, as an attacker retains access indefinitely without any server-side mechanism to revoke it.

Our system solves this using a **Dual-Token Architecture with Automatic Refresh Token Rotation**:

1. **Access Token (Short-lived — 15 minutes)**
   - **Why**: Used for authenticating every API request. Short lifespan minimizes the vulnerability window if a token is intercepted.
   - **How**: Fully **stateless**. Verified in-memory by cryptographic signature (`JWT_SECRET`) in `JwtStrategy` without hitting PostgreSQL, preserving database performance.
   - **When**: Sent by the client in the `Authorization: Bearer <token>` header on every protected request (e.g., `GET /auth/me`, purchasing, reading).

2. **Refresh Token (Long-lived — 30 days) with Rotation**
   - **Why**: Allows users to stay authenticated seamlessly without re-entering credentials.
   - **Rotation Security**: Every time `POST /auth/refresh` is called, the used Refresh Token is **immediately consumed and revoked** (`revokedAt = NOW()`), and a brand-new Refresh Token + Access Token pair is issued. If an old consumed refresh token is ever reused, the request is instantly rejected.
   - **How**: **Stateful & Hashed**. Signed with a distinct secret (`JWT_REFRESH_SECRET`) and stored as a **SHA-256 hash** in PostgreSQL (`auth.user_tokens`).
   - **When**: Sent in the request body to `POST /auth/refresh` exclusively when the Access Token has expired.

---

#### 🔄 Token Lifecycle & Rotation Sequence Flow

```mermaid
sequenceDiagram
    autonumber
    actor Client
    participant Server as NestJS API
    participant DB as PostgreSQL DB

    Note over Client, DB: 1. Authentication (Login / Register)
    Client->>Server: POST /auth/login (email, password)
    Server->>Server: Verify credentials & assigned roles
    Server->>Server: Generate Access Token A (15m, type: 'access')
    Server->>Server: Generate Refresh Token A (30d, type: 'refresh')
    Server->>DB: Save SHA-256 Hash of Refresh Token A
    Server-->>Client: Return { user, accessToken: A, refreshToken: A }

    Note over Client, DB: 2. Accessing Protected Endpoints
    Client->>Server: GET /auth/me (Headers: Authorization: Bearer <accessToken A>)
    Server->>Server: JwtStrategy verifies signature & payload.type === 'access'
    Server-->>Client: Return 200 OK User Profile

    Note over Client, DB: 3. Token Rotation Flow (POST /auth/refresh)
    Client->>Server: POST /auth/refresh (Body: { refreshToken: A })
    Server->>Server: 1. Verify JWT Signature & Expiration
    Server->>Server: 2. Enforce payload.type === 'refresh'
    Server->>DB: 3. Verify SHA-256 Hash(A) exists & not revoked/expired
    Server->>DB: 4. REVOKE Token A (Set revokedAt = NOW())
    Server->>Server: 5. Generate NEW Access Token B & Refresh Token B
    Server->>DB: 6. Save SHA-256 Hash of Refresh Token B
    Server-->>Client: Return { accessToken: B, refreshToken: B }

    Note over Client, DB: 4. Attempting to Reuse Old Token A (Attack Simulation)
    Client->>Server: POST /auth/refresh (Body: { refreshToken: A })
    Server->>DB: Check Hash(A) → revokedAt IS NOT NULL!
    Server-->>Client: 401 Unauthorized (Token Revoked / Reused)
```

---

#### 🔁 Detailed Breakdown: Refresh Token Rotation & Security Benefits

##### 1. The Security Problem Without Rotation (Static Refresh Tokens)
In a static refresh token design, a single `Refresh Token A` remains valid for its entire 30-day lifespan. If an attacker intercepts or steals `Refresh Token A` (e.g. via XSS, local storage theft, or network interception):
- The attacker can call `POST /auth/refresh` repeatedly for 30 days to obtain fresh access tokens.
- The server has no automatic way of knowing that `Refresh Token A` was compromised or used by an unauthorized party.

##### 2. The Solution: Single-Use Token Rotation
With **Refresh Token Rotation**, every refresh token is **strictly single-use**. Consuming a refresh token automatically burns it and replaces it with a new pair:

- **Step 1 (Request)**: Client sends `Refresh Token A` to `POST /auth/refresh`.
- **Step 2 (Verification)**: Server verifies JWT signature and looks up `Hash(Refresh Token A)` in PostgreSQL.
- **Step 3 (Consumption & Revocation)**: Server marks `Refresh Token A` as revoked by setting `revokedAt = NOW()` in `auth.user_tokens`.
- **Step 4 (Issuance)**: Server generates a new `Access Token B` AND a new `Refresh Token B`.
- **Step 5 (Persistence)**: Server saves `Hash(Refresh Token B)` into PostgreSQL and returns both tokens to the client.

##### 3. How Token Reuse Neutralizes Theft
If an attacker attempts to use `Refresh Token A` after it has already been rotated by the legitimate user:
1. The server computes `SHA256(Refresh Token A)` and queries `auth.user_tokens`.
2. The server detects that `revokedAt` is **NOT NULL** (token was already consumed).
3. The server immediately aborts execution and returns `401 Unauthorized`.
4. The stolen token is completely useless, protecting the user's account from unauthorized prolonged access.

##### 4. Quick Summary Matrix (Why / How / When)

| Aspect | Access Token | Refresh Token (with Rotation) |
| :--- | :--- | :--- |
| **Why?** | Short window of exposure if leaked; no DB query needed per request. | Keeps user logged in seamlessly while eliminating long-lived stolen token vulnerability. |
| **How?** | Signed JWT (`JWT_SECRET`) containing `type: 'access'`, verified statelessly by `JwtStrategy`. | Signed JWT (`JWT_REFRESH_SECRET`) containing `type: 'refresh'`, verified statefully via SHA-256 DB hash; revoked upon usage and replaced. |
| **When?** | Attached as `Authorization: Bearer <token>` on every API call. | Sent in request body to `POST /auth/refresh` only when Access Token expires (15 min). |

---

#### 🛡️ Security Controls & Enforcement Rules

| Security Layer | Implementation & Purpose |
| :--- | :--- |
| **Strict Token Type Scoping** | Every payload includes `type: 'access'` or `type: 'refresh'`. This prevents cross-use of tokens. |
| **Automatic Token Rotation** | Every refresh request revokes the old refresh token (`revokedAt = NOW()`) and issues a fresh pair, neutralizing stolen refresh tokens. |
| **Protected API Defense** | `JwtStrategy` rejects any token where `type !== 'access'`. Passing a Refresh Token to a protected endpoint results in `401 Unauthorized`. |
| **Refresh Endpoint Defense** | `AuthService.refresh()` enforces `type === 'refresh'`. Passing an Access Token to `POST /auth/refresh` results in `401 Unauthorized`. |
| **Database Token Hashing** | Raw Refresh Tokens are **never** stored plain-text in the database. They are hashed using SHA-256 before persisting (`auth.user_tokens`). |
| **Instant Revocation** | If a token is revoked or logged out, `revokedAt` is set in the DB, immediately blocking any subsequent refresh attempts. |

---

## 📦 Built-in Tech Stack & Packages

The project has the following modules configured and ready to use:

*   **Core:** `@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`
*   **Configuration & Validation:** `@nestjs/config`, `joi`, `class-validator`, `class-transformer`
*   **Database & ORM:** `@nestjs/typeorm`, `typeorm`, `pg` (PostgreSQL)
*   **Auth & Security:** `@nestjs/jwt`, `@nestjs/passport`, `@nestjs/throttler`, `passport`, `passport-jwt`, `passport-local`, `bcrypt`, `helmet`, `cookie-parser`
*   **Emailing:** `nodemailer`
*   **API Documentation:** `@nestjs/swagger`, `swagger-ui-express`