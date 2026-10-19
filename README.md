# FramaShare 📚 — Privacy-First Document & Media Sharing Platform

<div align="center">

[![Vue.js](https://img.shields.io/badge/Frontend-Vue.js%203%20%7C%20Vite%20%7C%20TS-4FC08D?style=for-the-badge&logo=vuedotjs&logoColor=white)](https://vuejs.org/)
[![Fastify](https://img.shields.io/badge/Backend-Fastify%20%7C%20TypeScript-000000?style=for-the-badge&logo=fastify&logoColor=white)](https://fastify.dev/)
[![Database](https://img.shields.io/badge/Database-PostgreSQL%20%7C%20Prisma%20ORM-336791?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.prisma.io/)
[![Architecture](https://img.shields.io/badge/Monorepo-pnpm%20Workspaces-F69220?style=for-the-badge&logo=pnpm&logoColor=white)](https://pnpm.io/)
[![Deployment](https://img.shields.io/badge/Container-Docker%20Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![License](https://img.shields.io/badge/License-AGPL--3.0-blue.svg?style=for-the-badge)](LICENSE)

**A modern, self-hosted, privacy-respecting publication and file-sharing ecosystem for PDFs, EPUB books, and photo albums, built with a reactive Vue 3 client and a high-performance Fastify/Prisma backend.**

[Overview](#-overview) • [Video Demonstration](#-video-demonstration) • [System Architecture](#-system-architecture) • [Data Model (ER Diagram)](#-data-model--database-schema) • [Key Security Features](#-security--privacy-mechanisms) • [Interactive Makefile](#-interactive-makefile-commands) • [Quickstart](#-installation--quickstart)

</div>

---

## 📖 Overview

**FramaShare** is an open-source, ethical document and media sharing platform inspired by the decentralized, privacy-focused ethos of the Framasoft ecosystem. 

Designed to bypass predatory data-harvesting cloud storage solutions, **FramaShare** empowers users to share private documents, digital books, and multimedia galleries through granular access-controlled links without surrendering personal privacy. 

It provides seamless support for **PDF rendering**, **EPUB e-book reading**, and **high-resolution photo albums**, complete with anonymous uploads, expiration timers, password protection, and concurrent session limits.

---

## 🎥 Visual Demonstration

See FramaShare in action, showcasing private sharing, link password authentication, and real-time document viewing:

<div align="center">

<img src="public/demostracion.gif" alt="FramaShare Live Demonstration" width="85%" style="border-radius: 10px; border: 1px solid #334155; box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3);" />

*Direct video source: [`public/demostracion.webm`](public/demostracion.webm)*

</div>

---

## 🏗️ System Architecture

FramaShare is organized as a high-performance **pnpm monorepo** decoupling the client interface from the API and persistence services.

```mermaid
flowchart TD
    User([Client / Browser])

    subgraph Presentation ["Frontend Client (Vue 3 + Vite)"]
        SPA["Vue 3 SPA\n(Composition API + Router)"]
        Readers["Document Readers:\n• PDF.js Renderer\n• EPUB Reader Engine\n• Responsive Photo Album"]
        AuthViews["Views: Login, Dashboard, Claims, Reports"]
    end

    subgraph Gateway ["Reverse Proxy / Gateway"]
        Nginx["Nginx Reverse Proxy / Vite Dev Proxy\n• Static Asset Serving\n• Loopback Proxy: /api -> 127.0.0.1:3000\n• Enforce Same-Origin"]
    end

    subgraph Backend ["Application Layer (Fastify + TypeScript)"]
        API["Fastify HTTP Engine\n• Cookie-Based Auth Sessions\n• Anonymous Claim Engine\n• HTTP Range Handler (206 Partial Content)"]
        Prisma["Prisma ORM Client\n• Query Building & Migrations\n• Type-safe DB Interactions"]
        Storage["Storage Service & Garbage Collector\n• Atomic File Writes\n• Disk Cleanup Retry Loop"]
    end

    subgraph DataStorage ["Persistence Layer"]
        PG[("PostgreSQL 16\n(Docker / Native)")]
        Disk[("Local Encrypted / Sanitized Storage\n(/uploads/...)")]
    end

    User <--> Nginx
    Nginx <--> SPA
    SPA --> Readers & AuthViews
    Nginx <-->|"Loopback /api"| API
    API <--> Prisma
    API <--> Storage
    Prisma <--> PG
    Storage <--> Disk
```

---

## 🗄️ Data Model & Database Schema

The database architecture is designed with relational integrity, cascading deletions, and audit trails.

```mermaid
erDiagram
    User ||--o{ Document : "owns"
    User ||--o{ AuthSession : "authenticates"
    User ||--o{ PasswordResetToken : "requests"
    Document ||--o{ Link : "shared via"
    Document ||--o{ Report : "moderated by"
    Link ||--o{ Session : "tracks viewers"

    User {
        string id PK
        string email UK
        string passwordHash
        string role "author | admin"
        int quota
        boolean deleting
        datetime createdAt
    }

    Document {
        string id PK
        string title
        string format "pdf | epub | album"
        string filename
        int size
        string manageHash UK "Anonymous admin link"
        datetime deleteAt "Auto-expiration"
        boolean moderated
        json assets
        json chapters
    }

    Link {
        string id PK
        string slug UK "/share/:slug"
        string password "Hashed pass"
        int maxSessions "Concurrent cap"
        datetime expiresAt
        boolean allowDownload
        boolean isRevoked
    }

    Session {
        string id PK
        string linkId FK
        string tokenHash UK
        string ipAddress
        datetime startedAt
        datetime expiresAt
    }

    Report {
        string id PK
        string documentId FK
        string reason
        string status "open | resolved"
        string decision
    }

    InstanceSettings {
        int id PK
        json value
    }
```

---

## 🛡️ Security & Privacy Mechanisms

- 🔒 **Granular Link Security:**
  - **Password Protection:** Links can be locked behind hashed passwords.
  - **Viewer Session Limits (`maxSessions`):** Prevent link sharing from going viral by capping maximum active readers.
  - **Kill Switch (`isRevoked`):** Immediately revoke public access without deleting the underlying master file.
  - **Download Locking (`allowDownload`):** Restrict readers to in-browser viewing only, disabling direct binary download.
- ⏱️ **Auto-Expiring Anonymous Uploads:** Anonymous uploads feature enforced retention periods (`retentionDays`) with automated background garbage collection upon reaching `deleteAt`.
- ⚡ **HTTP 206 Partial Content (Streaming):** PDF and EPUB files leverage HTTP byte-range streaming, allowing massive documents to load instantly without exhausting server RAM or browser buffers.
- 🍪 **Revocable HTTP-Only Cookie Sessions:** User authentication uses cryptographically secure, signed HTTP-only cookies resistant to XSS and CSRF.
- 🧹 **Robust Cleanup with Failure Retries:** Account or file deletions verify disk removal before committing database state, handling transient I/O locks gracefully.

---

## 🛠️ Interactive Makefile Commands

The repository features an animated, colorized `Makefile` providing instant shortcuts for common tasks:

| Command | Action | Description |
| :--- | :--- | :--- |
| `make install` | `pnpm install` | Installs dependencies across all monorepo workspaces. |
| `make dev` | Concurrent Dev Server | Starts Fastify backend (`:3000`) and Vite frontend (`:5173`) in parallel. |
| `make build` | Monorepo Build | Compiles TypeScript API and bundles Vue SPA into `dist/`. |
| `make db-up` | `docker compose up -d db` | Boots local PostgreSQL container bound to `127.0.0.1:5432`. |
| `make db-down` | `docker compose down` | Safely stops database containers. |
| `make db-migrate` | `prisma migrate deploy` | Applies SQL migrations and generates type-safe Prisma client. |
| `make clean` | Remove Build Artifacts | Cleans `dist/`, `build/`, and generated caches. |
| `make fclean` | Deep Purge | Complete clean: removes all `node_modules`, lockfiles, and builds. |
| `make re` | Reinstall from scratch | Runs `fclean` followed by `make install`. |

---

## 🚀 Installation & Quickstart

### Prerequisites

- **Node.js** `>= 22.13` or `24 LTS`
- **pnpm** `v11.7.0` (Enable via `corepack enable && corepack prepare pnpm@11.7.0 --activate`)
- **Docker & Docker Compose** (for local PostgreSQL database)

---

### Step-by-Step Setup

```bash
# 1. Clone repository
git clone https://github.com/SherlockPE/FramaShare.git
cd FramaShare

# 2. Install workspace dependencies
pnpm install --frozen-lockfile

# 3. Configure backend environment & start database
cp back/.env.example back/.env
make db-up

# 4. Run database migrations & generate Prisma client
make db-migrate

# 5. Launch both Frontend and Backend concurrently
make dev
```

The application is now live:
- **Frontend SPA:** [http://localhost:5173](http://localhost:5173)
- **Fastify API:** [http://127.0.0.1:3000](http://127.0.0.1:3000)

---

## 🧪 Testing & Verification Suite

FramaShare includes both backend unit/integration tests and browser-driven end-to-end (E2E) suites.

```bash
# Run unit & API integration tests
pnpm --filter frontend test
pnpm --filter back test

# Run backend integration tests with dedicated test database
TEST_DATABASE_URL=postgresql://admin:admin@localhost:5432/framashare_test pnpm --filter back test

# Run Playwright E2E browser flows (Desktop & Mobile 320px)
pnpm --filter frontend exec playwright test
```

---

## 👥 Authors & License

- **Fabricio López Reyes** ([@SherlockPE](https://github.com/SherlockPE))
- **Jakub Siuda** ([@siudajakub](https://github.com/siudajakub)) 
- **Alvaro Campos** ([@alan-campos-4](https://github.com/alan-campos-4))
- **Ignacio Castilla López** ([@ignaccas](https://github.com/ignaccas))
- Licensed under the [AGPL-3.0-or-later](LICENSE) License.
