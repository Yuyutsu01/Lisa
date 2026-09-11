# Lisa — AI Content Distribution & Repurposing Platform

> **Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.**

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20(App%20Router)-black.svg)](https://nextjs.org)
[![PostgreSQL / SQLite](https://img.shields.io/badge/Database-SQLAlchemy%202.0%20Async-blue.svg)](https://www.sqlalchemy.org)
[![Tests](https://img.shields.io/badge/Tests-19%20Passed%20(100%25)-emerald.svg)](backend/tests)

---

## 1. Product Overview

**Lisa** is an enterprise-grade, multi-tenant AI content operations operating system (OS). Rather than acting as a simple generic chat wrapper that writes captions, Lisa is an orchestrated pipeline where **specialized AI agents** collaborate with deterministic software safeguards to ingest canonical content sources, adapt them into platform-native variants (LinkedIn, X/Twitter, Instagram, YouTube Shorts, TikTok, Threads, Email Newsletters, and Blog CMS), validate them against brand guidelines, schedule them via an idempotent state machine, and analyze cross-platform performance in a **closed-loop feedback loop**.

### Core Product Principle
* **AI proposes structured variants.**
* **Deterministic software validates boundaries, character limits, forbidden phrases, and aspect ratios.**
* **Humans review, edit, and approve before verified publishing.**
* **Analytics feeds actionable opportunities back into the top of the content funnel.**

---

## 2. Problem Statement

Modern content creators, marketing teams, agency leads, and enterprise founders face a repetitive, manual, and fragmented content operations workflow:
1. **Manual Repurposing Overhead:** Writing one high-value long-form article requires manually rewriting 8 different posts with distinct platform hooks, formatting rules, and character constraints.
2. **Brand Voice Drift:** Multi-member teams struggle to maintain consistent brand tone, terminology, forbidden phrase compliance, and audience positioning.
3. **Media Format Mismatches:** Manually cropping, resizing, and aspect-ratio converting visual assets (Portrait `4:5`, Square `1:1`, Reels `9:16`, Thumbnails `16:9`) causes friction and visual bugs.
4. **Scattered Distribution & Disconnected Analytics:** Scheduling across multiple third-party schedulers prevents normalized cross-platform performance tracking and intelligent closed-loop repurposing.

---

## 3. Key Features

- **Multi-Tenant RBAC & Workspaces:** Enterprise tenant isolation with 5 granular permission roles (`Owner`, `Admin`, `Editor`, `Reviewer`, `Viewer`).
- **Brand Intelligence System:** Contextual storage for brand mission, target audience, tone guidelines, forbidden phrase filters, content pillars, and RAG knowledge base document storage.
- **Canonical Content Studio:** Rich-text source editor with debounced auto-saving, version history tracking, and one-click version rollback.
- **SHA-256 Media Deduplication Engine:** Uploads manager with automated Pillow dimension extraction, checksum deduplication, and asset linking.
- **Multi-Agent Orchestrator:** 5 specialized agents that process canonical ideas into platform-native variants with structured JSON schemas.
- **Variant Review & QA Studio:** Live simulated feed previews (LinkedIn post, X thread, IG caption, etc.) with real-time QA scorecard compliance checks and single-element AI regeneration modifiers.
- **Media Derivative Processor:** Aspect ratio preset transformations (`4:5`, `1:1`, `9:16`, `16:9`, `1.91:1`) for image assets.
- **Content Distribution Calendar:** Interactive Month and Queue List scheduling interface powered by a SHA-256 idempotent publishing state machine.
- **Omnichannel Platform Adapters:** Dedicated publishing adapters for **LinkedIn, X (Twitter), Instagram, YouTube Shorts, TikTok, Threads, Email Newsletters, and Blog/CMS**.
- **Performance Analytics & Opportunity Engine:** Cross-network metric normalization (impressions, reach, views, engagements, engagement rate %) paired with closed-loop AI repurposing suggestions.
- **Production Hardening & Telemetry:** WebSocket real-time event hub (`/ws/workspaces/{id}`), immutable audit logging (`AuditLog`), and sub-agent latency & token usage traces (`AgentRun`).

---

## 4. Agent Architecture

Lisa organizes intelligence into discrete, single-responsibility agents coordinated by a central orchestrator:

```text
Canonical Source
       │
       ▼
┌──────────────────────────────────────────────┐
│       GenerationPipeline Orchestrator        │
└──────┬────────────────────────────────┬──────┘
       │                                │
       ▼                                ▼
┌───────────────────────┐    ┌───────────────────────────┐
│ Content Intake Agent  │    │  Platform Strategy Agent  │
│ - Key points extract  │    │  - Platform-specific angle│
│ - Core claim detection│    │  - Format selection       │
└──────────┬────────────┘    └──────────┬────────────────┘
           │                            │
           └────────────┬───────────────┘
                        ▼
       ┌─────────────────────────────────┐
       │   Content Adaptation Agent      │
       │   - Hook creation               │
       │   - Platform-native body copy   │
       │   - Target CTA formatting       │
       └────────────────┬────────────────┘
                        ▼
       ┌─────────────────────────────────┐
       │      Caption & Hook Agent       │
       │      - 3 hook alternatives      │
       │      - Channel hashtags         │
       └────────────────┬────────────────┘
                        ▼
       ┌─────────────────────────────────┐
       │    Quality Assurance Agent      │
       │    - Forbidden phrase check     │
       │    - Voice alignment (0.0-1.0)  │
       │    - Format constraint validation│
       └────────────────┬────────────────┘
                        ▼
             Platform Content Variants
```

### Closed-Loop Feedback Agents
- **Analytics Agent:** Ingests raw social metric snapshots, normalizes engagement rates, and isolates conversion-leading channels.
- **Content Recommendation Agent:** Identifies high-performing posts (>80th percentile) and generates evidence-backed repurposing recipes that can be converted into new Studio drafts with 1 click.

---

## 5. Tech Stack

| Layer | Technology | Details |
|---|---|---|
| **Backend Framework** | **FastAPI** (Python 3.11+) | Async ASGI endpoints, dependency injection, OpenAPI documentation |
| **ORM & Database** | **SQLAlchemy 2.0 Async** | SQLite (dev) / PostgreSQL (production), async session management |
| **Data Validation** | **Pydantic v2** | Strict typing, serialization, and JSON schema enforcement |
| **Security & Cryptography** | **Native Bcrypt & PyJWT** | Envelope-encrypted credentials, token expiration, Argon/Bcrypt |
| **Image Processing** | **Pillow (PIL)** | Aspect ratio conversion, smart resizing, metadata extraction |
| **Frontend Framework** | **Next.js 16 (App Router)** | Modern React 19 architecture with Webpack bundling on Windows |
| **Styling & UI** | **TailwindCSS + Lucide Icons** | Dark-mode glassmorphic theme, responsive dashboard components |
| **Real-Time Gateway** | **WebSockets** | Tenant-multiplexed event broadcasting (`/ws/workspaces/{id}`) |
| **Testing** | **Pytest + AnyIO + HTTPX** | 100% async endpoint and model test coverage (19 passing tests) |

---

## 6. System Architecture

```mermaid
flowchart TB
    subgraph Client["Frontend Client (Next.js 16)"]
        UI_Studio["Content Studio & Editor"]
        UI_Variants["Variant Review & QA"]
        UI_Calendar["Distribution Calendar"]
        UI_Integrations["Connected Channels Hub"]
        UI_Analytics["Analytics & Opportunity Hub"]
        UI_Settings["Settings & Audit Logs"]
    end

    subgraph Gateway["API Gateway (FastAPI)"]
        AuthRouter["Auth & RBAC Middleware"]
        WSRouter["WebSocket Event Hub"]
        APIRouter["API v1 Endpoints"]
    end

    subgraph CoreEngine["Lisa Core Engine"]
        AgentPipeline["Multi-Agent Pipeline"]
        MediaWorker["Media Derivative Transformer"]
        PublishService["Publishing Engine & Idempotency"]
        AnalyticsService["Analytics & Closed-Loop Engine"]
    end

    subgraph Adapters["Platform Publishing Adapters"]
        LI["LinkedIn Adapter"]
        X["X / Twitter Adapter"]
        IG["Instagram Adapter"]
        YT["YouTube Shorts Adapter"]
        TT["TikTok Adapter"]
        TH["Threads Adapter"]
        EM["Email / Newsletter Adapter"]
        BL["Blog / CMS Adapter"]
    end

    subgraph Storage["Persistence Layer"]
        DB[(PostgreSQL / SQLite)]
        DiskStore["Media Asset Storage"]
    end

    UI_Studio & UI_Variants & UI_Calendar & UI_Integrations & UI_Analytics & UI_Settings --> AuthRouter
    AuthRouter --> APIRouter
    WSRouter <--> UI_Studio & UI_Variants & UI_Settings
    
    APIRouter --> AgentPipeline & MediaWorker & PublishService & AnalyticsService
    PublishService --> LI & X & IG & YT & TT & TH & EM & BL
    
    AgentPipeline & MediaWorker & PublishService & AnalyticsService --> DB
    MediaWorker --> DiskStore
```

---

## 7. Demo Instructions (Step-by-Step Flow)

Follow this 5-minute walkthrough to experience the entire Lisa platform lifecycle:

1. **Sign Up & Workspace Creation:**
   - Navigate to `http://localhost:3000/register`.
   - Register a new account (`demo@lisa.ai` / `DemoPassword123!`). An active workspace is automatically provisioned.
2. **Configure Brand Voice:**
   - Go to `/brand`.
   - Define Tone (*"Visionary yet grounded"*), Forbidden Phrases (*"synergy, revolutionary"*), and Content Pillars (*"AI Infrastructure, Product Updates"*).
3. **Create Canonical Source:**
   - Open `/content`.
   - Title: *"Scaling Multi-Agent Content Orchestration in 2026"*.
   - Body: Add 2-3 paragraphs describing autonomous pipeline execution. Notice the debounced auto-save status indicator.
4. **Generate & Review Variants:**
   - Click **"Generate Platform Variants"**.
   - Navigate through the simulated feed tabs: **LinkedIn**, **X (Twitter)**, **Instagram**, **YouTube Shorts**, and **TikTok**.
   - Inspect the **QA Quality Scorecard** (brand voice alignment, character limit validation, and forbidden word scans).
   - Test an AI modifier: Type *"Make hook more controversial"* and click **Regenerate**.
5. **Approve & Publish Immediately:**
   - Click **"Approve Variant"**.
   - Click **"Publish Now"** to immediately dispatch the post through the platform adapter and verify the live permalink.
6. **Schedule on Content Calendar:**
   - Navigate to `/calendar` to view your scheduled queue across Month and List views.
7. **Inspect Analytics & Closed-Loop Opportunities:**
   - Go to `/analytics`.
   - Click **"Discover AI Opportunities"**.
   - Observe how the `ContentRecommendationAgent` identifies top-performing angles and provides a **1-Click "Repurpose into Studio Draft"** action.
8. **Inspect Telemetry & Audit Logs:**
   - Open `/settings`.
   - Inspect the **Agent Telemetry Traces** table (latency in ms, token usage) and **System Operations Health**.

---

## 8. Deployment Architecture

```text
                [ Cloudflare / CDN ]
                         │
                         ▼
             [ Nginx / Reverse Proxy ]
             ┌───────────┴───────────┐
             ▼                       ▼
    [ Next.js Frontend ]    [ FastAPI Backend ]
      (Port: 3000)            (Port: 8000)
                                     │
                 ┌───────────────────┼───────────────────┐
                 ▼                   ▼                   ▼
          [ PostgreSQL ]      [ Redis Queue ]     [ S3 Storage ]
          (Primary Data)      (Async Workers)     (Media Assets)
```

- **Production Docker Compose:** The platform includes a production [`docker-compose.yml`](docker-compose.yml) managing the backend, database, and background services.
- **Database Migrations:** Managed through Alembic (`alembic upgrade head`).
- **Media Assets:** Stored locally in `/uploads` during development or configured for AWS S3 / Cloudflare R2 in production.

---

## 9. Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Application Settings
ENVIRONMENT=production
SECRET_KEY=generate_a_secure_random_64_character_hex_string_here
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration
DATABASE_URL=sqlite+aiosqlite:///./lisa.db
# For PostgreSQL: postgresql+asyncpg://lisa_user:password@localhost:5432/lisa_db

# CORS Configuration
BACKEND_CORS_ORIGINS=["http://localhost:3000", "https://app.lisa.ai"]

# File Storage
UPLOAD_DIR=./uploads
MAX_UPLOAD_SIZE_MB=50

# LLM Providers (Optional for Live Production API keys)
OPENAI_API_KEY=
GEMINI_API_KEY=
ANTHROPIC_API_KEY=

# Platform Integration Credentials (Optional)
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
X_API_KEY=
X_API_SECRET=
INSTAGRAM_APP_ID=
INSTAGRAM_APP_SECRET=
```

Frontend environment variables in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000/api/v1
```

---

## 10. Local Setup & Quickstart

### Prerequisites
- **Python 3.11+**
- **Node.js 18+ & npm**
- **Git**

### 1. Clone Repository
```bash
git clone https://github.com/Yuyutsu01/Lisa.git
cd Lisa
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv

# Windows:
.\venv\Scripts\activate
# Linux / macOS:
source venv/bin/activate

pip install -r requirements.txt

# Run Automated Test Suite (19 tests)
python -m pytest tests/ -v

# Start FastAPI Development Server
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
API Documentation will be live at: `http://localhost:8000/docs`.

### 3. Frontend Setup
In a separate terminal window:
```bash
cd frontend
npm install

# Run Production Build
npm run build

# Start Next.js Development Server
npm run dev
```
Web Application will be accessible at: `http://localhost:3000`.

---

## 11. Known Limitations & Roadmap

- **Social Media API Sandboxes:** Live external publishing requires registered OAuth Developer Apps with Meta, LinkedIn, and X. In development mode, platform adapters simulate full REST verification, idempotency generation, and live record permalinks.
- **Video Rendering Workers:** Video rendering utilizes frame-based thumbnail extraction and transcoding presets; full multi-track subtitle burning is scheduled for the next release.
- **Vector Database Backend:** Knowledge doc search currently leverages structured RAG embeddings; distributed ChromaDB/Pinecone sync is supported as a modular drop-in.

---

## 12. Screenshots & UI Layout Breakdown

### 1. Executive Dashboard (`/dashboard`)
*High-level overview of generation metrics, active workspaces, publishing queue, and platform conversion leaders.*

### 2. Canonical Content Studio (`/content`)
*Dual-pane workspace with debounced auto-saving, version history rollback, target platform selection, and instant multi-agent variant generation.*

### 3. Platform Variant Review Studio (`/content/[id]/variants`)
*Simulated native social feed previews (LinkedIn essay, X thread, IG visual post, YouTube Shorts script), QA compliance scorecards, and single-element AI regeneration controls.*

### 4. Content Distribution Calendar (`/calendar`)
*Interactive monthly and queue list scheduling interface with drag-and-drop rescheduling and status filters.*

### 5. Omnichannel Integrations Hub (`/integrations`)
*Connected social accounts manager with OAuth status badges, capability matrices, and published post permalinks.*

### 6. Closed-Loop Performance Analytics (`/analytics`)
*Normalized cross-channel KPI counters, format performance distribution, leaderboard, and AI Opportunity repurposing cards.*

### 7. Governance, Telemetry & Settings (`/settings`)
*Real-time agent execution latency traces (ms), token usage explorer, immutable audit log, and system operational health diagnostics.*

---

## 13. Demo Credentials

You can create an account instantly via the registration page, or use the baseline test credentials:

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Workspace Owner** | `owner@lisa.ai` | `Password123!` | Full control, billing, settings, deletion |
| **Workspace Admin** | `admin@lisa.ai` | `Password123!` | Manage team, integrations, approvals |
| **Content Editor** | `editor@lisa.ai` | `Password123!` | Create sources, generate variants, schedule |
| **Reviewer** | `reviewer@lisa.ai` | `Password123!` | Review variants, approve/reject |
| **Viewer** | `viewer@lisa.ai` | `Password123!` | Read-only access to library & analytics |

---

## 14. Team Members

- **Shivang Shekhar** — Architecture, Multi-Agent Systems & Full-Stack Engineering.
- **Lisa Core Team** — AI Product Design & Agentic Content Operations.

---

## 15. License

This project is open-source software licensed under the **[MIT License](LICENSE)**.

```text
Copyright (c) 2026 Lisa Platform Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```