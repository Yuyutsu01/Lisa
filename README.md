# Lisa — AI Content Distribution & Repurposing Platform

> **Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.**

[![License: MIT](https://img.shields.io/badge/License-MIT-indigo.svg)](https://opensource.org/licenses/MIT)
[![FastAPI](https://img.shields.io/badge/Backend-FastAPI-009688.svg)](https://fastapi.tiangolo.com)
[![Next.js 16](https://img.shields.io/badge/Frontend-Next.js%2016%20(App%20Router)-black.svg)](https://nextjs.org)
[![PostgreSQL / SQLite](https://img.shields.io/badge/Database-SQLAlchemy%202.0%20Async-blue.svg)](https://www.sqlalchemy.org)
[![Tests](https://img.shields.io/badge/Tests-37%20Passed%20(100%25)-emerald.svg)](backend/tests)
[![Guardrails](https://img.shields.io/badge/AI%20Guardrails-Active%20%26%20Enforced-indigo.svg)](docs/AI_HARNESSING_AND_GUARDRAILS.md)
[![Version](https://img.shields.io/badge/Version-1.0.1-blue.svg)](PRODUCT_SPEC.md)

---

## 1. Product Overview

**Lisa** is an enterprise-grade, multi-tenant AI content operations operating system (OS). Rather than acting as a simple generic chat wrapper that writes captions, Lisa takes your original content and rewrites it for each platform (LinkedIn, X/Twitter, Instagram, Discord, Threads, Email, and Blog), checks it against your brand's voice and rules, lets you approve it before it goes out, and tracks how each post performs to make the next one better.

### 4-Stage Core Workflow
* **STAGE 01 — AI Writes the First Draft:** Lisa takes your original idea and writes a version made for each platform — the right hook, format, and style for LinkedIn, X, Instagram, and more.
* **STAGE 02 — Automatic Quality Check:** Before you see it, Lisa checks the basics: character limits, banned words, hashtag count, and image sizing — all fixed automatically.
* **STAGE 03 — You Review and Approve:** See exactly how each post will look on each platform, make any edits you want, then approve it to go out.
* **STAGE 04 — Learns What Works:** Lisa tracks how your posts perform across every platform and shows you what's worth turning into new content.

### Core Architectural Safeguards
* **Deterministic Software Enforces Hard Boundaries:** Pydantic schemas, character limits, PII protection, aspect ratios, and platform ToS policies are enforced at the application layer.
* **Semantic QA Prevents Hallucinations:** Quantitative claims and metrics are extracted and verified against canonical source facts before approval.
* **Human-in-the-Loop Governance:** Autonomous publishing is strictly blocked unless explicit human approval or an active 30-day Trusted Automation rule is present.
* **Closed-Loop Feedback:** Real engagement metrics drive AI-generated repurposing opportunities fed directly back into the content studio.

---

## 2. Complete System Architecture

```mermaid
flowchart TB
    subgraph ClientLayer["1. Client Layer (Next.js 16 App Router / React 19)"]
        UI_Studio["Canonical Content Studio & Versioning"]
        UI_Variants["Native Feed Preview & QA Scorecard"]
        UI_Calendar["Content Distribution Calendar"]
        UI_Integrations["Connected Channels & OAuth Hub"]
        UI_Analytics["Analytics & Opportunity Hub"]
        UI_Settings["Settings, Audit Logs & Telemetry"]
    end

    subgraph GatewayLayer["2. API Gateway & Security (FastAPI)"]
        AuthRouter["Auth & RBAC Middleware (JWT / Bcrypt)"]
        WSRouter["WebSocket Real-Time Event Hub"]
        RateLimitGate["Token Budget & Rate Limiter Gateway"]
    end

    subgraph GuardrailsLayer["3. AI Harnessing & Safety Guardrail Suite"]
        InjectionShield["Prompt Injection Defense (<untrusted_content> + Regex Scanner)"]
        SchemaValidator["Pydantic Output Validation (Bounded 1-Retry)"]
        PolicyGate["Independent Policy Gate (PII + Meta/X ToS + Brand Safety)"]
        FactGrounding["Semantic Fact-Grounding & Hallucination QA"]
        HITLGate["Human-in-the-Loop & 30-Day Trusted Automation Gate"]
    end

    subgraph AgentPipeline["4. Specialized Multi-Agent Intelligence Engine"]
        Agent_Intake["Agent 1: Content Intake / Source Analyst"]
        Agent_Strategy["Agent 2: Platform Strategy Agent"]
        Agent_Writer["Agent 3: Platform Native Writer"]
        Agent_Caption["Agent 4: Caption & Hook Generator"]
        Agent_QA["Agent 5: Quality Reviewer & 10-Point Scorer"]
        Agent_Editorial["Agent 6: Targeted Editorial Refinement"]
        Agent_Analytics["Agent 7: Analytics Performance Normalizer"]
        Agent_Recom["Agent 8: Closed-Loop Opportunity Engine"]
    end

    subgraph PublishingOrchestrator["5. Publishing Orchestrator & Channel Adapters"]
        PubService["Publishing Engine (SHA-256 Idempotency)"]
        
        Adapter_LI["LinkedIn Adapter (Mode A: Direct API)"]
        Adapter_X["X / Twitter Adapter (Mode A: Direct API)"]
        Adapter_IG["Instagram Adapter (Mode A: Direct API)"]
        Adapter_DC["Discord Adapter (Webhook Dispatch)"]
        Adapter_TH["Threads Adapter (Mode A: Direct API)"]
        Adapter_EM["Email / Newsletter Adapter"]
        Adapter_BL["Blog / CMS Adapter"]
    end

    subgraph StorageLayer["6. Persistence, Cache & Asset Storage"]
        DB[(PostgreSQL / SQLite Async SQLAlchemy 2.0)]
        RedisQueue["Redis Task Queue & Workers"]
        MediaStore["Media Asset & Derivative Store (Pillow / S3)"]
    end

    %% Client to Gateway
    UI_Studio & UI_Variants & UI_Calendar & UI_Integrations & UI_Analytics & UI_Settings --> AuthRouter
    AuthRouter --> RateLimitGate
    WSRouter <--> UI_Studio & UI_Variants & UI_Settings

    %% Gateway to Guardrails and Agents
    RateLimitGate --> InjectionShield
    InjectionShield --> Agent_Intake --> Agent_Strategy --> Agent_Writer --> Agent_Caption
    Agent_Writer --> SchemaValidator --> PolicyGate --> Agent_QA
    Agent_QA --> FactGrounding

    %% Feedback loop
    Agent_Analytics --> Agent_Recom --> UI_Studio

    %% Publishing Flow
    FactGrounding --> HITLGate --> PubService
    PubService --> Adapter_LI & Adapter_X & Adapter_IG & Adapter_DC & Adapter_TH & Adapter_EM & Adapter_BL

    %% Persistence connections
    GatewayLayer & AgentPipeline & PublishingOrchestrator --> DB
    PubService --> RedisQueue
    ClientLayer --> MediaStore
```

---

## 3. AI Harnessing & Pipeline Guardrails

Lisa enforces 8 comprehensive layers of AI harnessing, safety, and operational reliability (see [docs/AI_HARNESSING_AND_GUARDRAILS.md](docs/AI_HARNESSING_AND_GUARDRAILS.md) for the complete engineering specification):

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
   - Adapters strictly enforce real platform state—never writing fake live URLs (`mock_...`) or phantom feed records without verified remote API verification.
   - All performance metrics carry explicit `metrics_source` tags (`platform_api`, `simulated`, `unavailable`).
8. **Circuit Breakers & Fallback Markers:**
   - Explicit timeouts (30s API / 75s generation) with bounded transient retries.
   - Offline template fallback engine stamps `is_fallback: true` to clearly distinguish offline templates from live model generations.

---

## 4. Tech Stack

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

## 5. Omnichannel Platform Distribution Matrix

| Platform | Format | Publishing Mode | Guardrail Behavior |
|---|---|---|---|
| **LinkedIn** | Long-form Post / Article | **Mode A (Direct API)** | Enforces professional tone, whitespace pacing, max 3 hashtags |
| **X (Twitter)** | Single Tweet / Multi-Tweet Thread | **Mode A (Direct API)** | Enforces 280-char boundaries and sequential thread formatting (1/N) |
| **Instagram** | Carousel / Image Caption | **Mode A (Direct API)** | Validates 4:5 / 1:1 image aspect ratios, blocks comment-gating bait |
| **Discord** | Rich Embed Announcement | **Direct Webhook Dispatch** | Tags metrics as `unavailable` to prevent synthetic impression hallucination |
| **Threads** | Conversational Micro-Post | **Mode A (Direct API)** | 500-char limits, conversational hook styling |
| **Email Newsletters** | Structured Markdown Dispatch | **Direct SMTP / API** | Validates subject line, preview snippet, and body depth |
| **Blog / CMS** | In-depth Reference Guide | **REST API / Webhook** | Canonical header structure and SEO meta tagging |

---

## 6. Local Setup & Quickstart

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

# Run Automated Test Suite (37 tests including red-team adversarial suite)
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

### 4. Database Schema Migration (PostgreSQL / Supabase only)

If you are connecting to an existing PostgreSQL or Supabase instance that was created before v1.0.1, run the following migration script to add columns that were added to the ORM models after the initial table creation:

```bash
cd backend
python migrate_analytics.py
```

This script is **idempotent** (`ADD COLUMN IF NOT EXISTS`) and safe to run multiple times. It adds the following columns to `performance_metrics`:
- `metrics_source`, `views`, `saves`, `clicks`, `collected_at`, `raw_metrics_json`

And ensures `content_opportunities` has: `updated_at`.

> **Note:** SQLite users do not need this step — SQLAlchemy creates the full schema on first startup.

## 7. Environment Variables

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

# LLM Providers (Groq, OpenAI)
GROQ_API_KEY=
GROQ_MODEL=llama-3.3-70b-versatile
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

Frontend environment variables in `frontend/.env.local`:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
NEXT_PUBLIC_WS_BASE_URL=ws://localhost:8000/api/v1
```

---

## 8. Demo Credentials

| Role | Email | Password | Permissions |
|---|---|---|---|
| **Workspace Owner** | `owner@lisa.ai` | `Password123!` | Full control, billing, settings, deletion |
| **Workspace Admin** | `admin@lisa.ai` | `Password123!` | Manage team, integrations, approvals |
| **Content Editor** | `editor@lisa.ai` | `Password123!` | Create sources, generate variants, schedule |
| **Reviewer** | `reviewer@lisa.ai` | `Password123!` | Review variants, approve/reject |
| **Viewer** | `viewer@lisa.ai` | `Password123!` | Read-only access to library & analytics |

---

## 9. Team Members

* **Shivam Sharma**
* **Shreya Sah**
* **Shubham Raikwar**

---

## 10. Troubleshooting

### Backend won't start — `ImportError` on models
If you see `ImportError: cannot import name '...' from 'app.models'` on startup, ensure `backend/app/models/__init__.py` exists. If missing:
```bash
python -c "open('app/models/__init__.py','a')"
```

### Port 8000 already in use / `ECONNRESET`
Kill any zombie Python processes holding the port:
```powershell
# Windows
Get-Process python | Stop-Process -Force
# Then restart uvicorn
uvicorn app.main:app --reload --port 8000
```

### `UndefinedColumnError` on analytics endpoints
Your Supabase/Postgres schema is out of date. Run the migration:
```bash
cd backend
python migrate_analytics.py
```

### `TypeError: expected str, got dict` on opportunity creation
This was a bug in v1.0.0 where `brand.content_pillars_json` (stored as `List[Dict]`) was passed raw as a `VARCHAR` column. Fixed in v1.0.1 — pull latest and restart the backend.

### React "Rendered more hooks than during the previous render"
This was a React Rules of Hooks violation in `VariantReviewPage` — fixed in v1.0.1. Pull latest frontend and rebuild:
```bash
cd frontend && npm run build
```

---

## 11. License

This project is open-source software licensed under the **[MIT License](LICENSE)**.