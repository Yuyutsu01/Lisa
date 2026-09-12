# Lisa — AI Content Distribution & Repurposing Platform

> **Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.**

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20(App%20Router)-black.svg)](https://nextjs.org)
[![PostgreSQL / SQLite](https://img.shields.io/badge/Database-SQLAlchemy%202.0%20Async-blue.svg)](https://www.sqlalchemy.org)
[![Tests](https://img.shields.io/badge/Tests-37%20Passed%20(100%25)-emerald.svg)](backend/tests)
[![Guardrails](https://img.shields.io/badge/AI%20Guardrails-Active%20%26%20Enforced-indigo.svg)](docs/AI_HARNESSING_AND_GUARDRAILS.md)

---

## 1. Product Overview

**Lisa** is an enterprise-grade, multi-tenant AI content operations operating system (OS). Rather than acting as a simple generic chat wrapper that writes captions, Lisa is an orchestrated pipeline where **specialized AI agents** collaborate with deterministic software safeguards to ingest canonical content sources, adapt them into platform-native variants (LinkedIn, X/Twitter, Instagram, YouTube Shorts, Discord, Threads, Email Newsletters, and Blog CMS), validate them against brand guidelines and policy gates, schedule them via an idempotent state machine, and analyze cross-platform performance in a **closed-loop feedback loop**.

### Core Product Principle
* **AI proposes structured variants.**
* **Deterministic software validates boundaries, character limits, PII protection, and platform ToS policies.**
* **Semantic QA guards against hallucinated metrics and ungrounded facts.**
* **Humans review, edit, and approve before verified publishing.**
* **Analytics feeds actionable opportunities back into the top of the content funnel.**

---

## 2. AI Harnessing & Guardrails Architecture

Lisa enforces 8 distinct layers of AI harnessing, safety, and operational reliability (see [docs/AI_HARNESSING_AND_GUARDRAILS.md](docs/AI_HARNESSING_AND_GUARDRAILS.md) for the complete engineering specification):

1. **Prompt Injection Defense (FR-BRAND-005):**
   - Untrusted boundary: all user text, uploaded docs, and RAG context are delimited in `<untrusted_content>` tags.
   - Strict anti-override system prompt directives instruct models to treat enclosed tags purely as data to summarize, never as instructions to execute.
   - Deterministic regex scanner detects injection signatures (`ignore previous instructions`, `you are now DAN`, `###override`) and sets `injection_risk_flag=True` for human audit.
2. **Output Schema Validation Layer:**
   - Strict Pydantic model validation immediately after agent responses with bounded 1-retry on malformed JSON.
3. **Independent Policy Validation Gate:**
   - Scans copy for PII leakage (unredacted emails, phone numbers, SSNs), Meta/X ToS banned engagement bait (e.g. comment-gating patterns), and brand forbidden terms.
   - Violating variants are routed to `policy_flagged` status and blocked from review until human override.
4. **Semantic Hallucination & Fact-Grounding Guardrail:**
   - Dedicated fact extractor isolates quantitative claims (percentages, latency benchmarks, numbers with units) and verifies grounding against canonical source facts.
   - Unverified claims cap quality scores ($\le 0.50$), trigger `unverified_claim` flags, and strictly block auto-approval.
5. **Human-in-the-Loop (HITL) & Trusted Automation:**
   - Publishing Orchestrator blocks any publishing attempt unless the variant has explicit human approval (`approved_by`/`approved_at`) or matches an active, unexpired 30-day `TrustedAutomationRule`.
6. **Token Budget & Cost Ceilings:**
   - Per-job token ceilings (15k tokens) and per-workspace sliding-window rate limiters prevent runaway revision loops. Exceeding ceilings raises `BudgetExceededError` and sets status `budget_exceeded`.
7. **Fabricated-Success & Provenance Invariant:**
   - Video formats without rendered binary uploads use **Mode C (Export/Manual Handoff)** with status `exported`—never writing fake live URLs (`youtube.com/shorts/mock_...`) or phantom feed records.
   - All performance metrics carry explicit `metrics_source` tags (`platform_api`, `simulated`, `unavailable`).
8. **Circuit Breakers & Fallback Markers:**
   - Explicit timeouts (30s API / 75s generation) with bounded transient retries.
   - Offline template fallback engine stamps `is_fallback: true` to clearly distinguish offline templates from live model generations.

---

## 3. Tech Stack

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
| **Testing & CI** | **Pytest + AnyIO + HTTPX** | 100% async endpoint and red-team test coverage (37 passing tests) |

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