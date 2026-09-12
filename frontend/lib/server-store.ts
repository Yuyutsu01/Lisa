/**
 * In-memory server-side state store for Lisa.
 * Provides resilient fallback and local execution without requiring an external PostgreSQL/Redis instance.
 */

import {
  generatePlatformVariantWithGroq,
  regenerateVariantWithGroq,
  PlatformVoiceProfile,
  DEFAULT_PLATFORM_VOICE_PROFILES,
} from "./groq-service";

export interface User {
  id: string;
  email: string;
  name: string;
  status: string;
  created_at: string;
}

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
  settings_json: Record<string, any>;
  current_user_role?: string;
  created_at: string;
}

export interface WorkspaceMember {
  id: string;
  workspace_id: string;
  user_id: string;
  role: "owner" | "admin" | "editor" | "reviewer" | "viewer";
  user_name?: string;
  user_email?: string;
  created_at: string;
}

export interface ContentPillar {
  name: string;
  description?: string;
  target_percentage?: number;
}

export interface BrandProfile {
  id: string;
  workspace_id: string;
  name: string;
  description: string;
  industry: string;
  target_audience: string;
  brand_mission: string;
  tone: string;
  writing_style: string;
  preferred_language: string;
  forbidden_phrases_json: string[];
  preferred_phrases_json: string[];
  cta_style: string;
  emoji_policy: string;
  hashtag_policy: string;
  content_pillars_json: ContentPillar[];
  competitors_references_json: string[];
  visual_rules_json: Record<string, any>;
  disclosure_rules_json: Record<string, any>;
}

export interface BrandKnowledgeDoc {
  id: string;
  workspace_id: string;
  title: string;
  source_type: string;
  content: string;
  status: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface MediaAsset {
  id: string;
  workspace_id: string;
  filename: string;
  storage_key: string;
  mime_type: string;
  size_bytes: number;
  width?: number;
  height?: number;
  duration_ms?: number;
  checksum: string;
  url: string;
  metadata_json: Record<string, any>;
  uploaded_by: string;
  created_at: string;
}

export interface MediaDerivative {
  id: string;
  source_asset_id: string;
  workspace_id: string;
  platform: string;
  format: string;
  storage_key: string;
  mime_type: string;
  width: number;
  height: number;
  duration_ms?: number;
  processing_status: string;
  url: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

export interface ContentSource {
  id: string;
  workspace_id: string;
  title: string;
  body: string;
  content_type: string;
  language: string;
  status: "draft" | "ready_for_adaptation" | "archived";
  target_platforms_json: string[];
  content_pillar: string;
  campaign: string;
  source_metadata_json: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
  version_count?: number;
  attached_assets?: {
    id: string;
    filename: string;
    mime_type: string;
    size_bytes: number;
    width?: number;
    height?: number;
    url: string;
  }[];
}

export interface ContentSourceVersion {
  id: string;
  content_source_id: string;
  version_number: number;
  title: string;
  body: string;
  metadata_json: Record<string, any>;
  created_by: string;
  created_at: string;
}

export interface ContentVariant {
  id: string;
  workspace_id: string;
  content_source_id: string;
  platform: string;
  format: string;
  status: "draft" | "needs_review" | "approved" | "scheduled" | "publishing" | "published" | "exported" | "rejected";
  title?: string;
  body: string;
  caption?: string;
  cta?: string;
  hashtags_json: string[];
  strategy_json: {
    platform?: string;
    format?: string;
    angle?: string;
    hook_style?: string;
    target_length_chars?: number;
    cta_recommendation?: string;
    media_required?: boolean;
  };
  quality_review_json: {
    quality_score?: number;
    checks?: Record<string, string>;
    issues?: { severity: string; message: string }[];
    passed?: boolean;
  };
  approved_by?: string;
  approved_at?: string;
  rejection_reason?: string;
  created_at: string;
  updated_at: string;
}

export interface PublishingJob {
  id: string;
  workspace_id: string;
  content_variant_id: string;
  connected_account_id?: string;
  scheduled_at: string;
  timezone: string;
  status: "draft" | "approved" | "scheduled" | "queued" | "publishing" | "published" | "exported" | "failed" | "cancelled";
  idempotency_key: string;
  attempt_count: number;
  variant_platform?: string;
  variant_title?: string;
  variant_body?: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  job_id: string;
  variant_id: string;
  platform: string;
  title: string;
  snippet: string;
  scheduled_at: string;
  status: "draft" | "approved" | "scheduled" | "queued" | "publishing" | "published" | "exported" | "failed" | "cancelled";
}

export interface ConnectedAccount {
  id: string;
  workspace_id: string;
  platform: string;
  external_account_id: string;
  account_name: string;
  status: string;
  scopes_json: string[];
  created_at: string;
}

export interface PublishedRecord {
  id: string;
  workspace_id: string;
  content_variant_id: string;
  platform: string;
  external_post_id: string;
  external_url: string;
  published_at: string;
  metrics_source?: "platform_api" | "simulated" | "unavailable";
  metadata_json: Record<string, any>;
}

export interface ContentOpportunity {
  id: string;
  workspace_id: string;
  title: string;
  content_pillar: string;
  suggested_platforms_json: string[];
  reason: string;
  confidence: string;
  source_evidence_json: Record<string, any>;
  status: string;
  created_at: string;
}

export interface AgentRun {
  id: string;
  workflow_id: string;
  agent_name: string;
  agent_version: string;
  status: string;
  model: string;
  latency_ms: number;
  token_usage_json: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

// Global in-memory singleton attached to globalThis to persist across Next.js dev reloads
declare global {
  // eslint-disable-next-line no-var
  var __LISA_STORE__: LisaStore | undefined;
}

export class LisaStore {
  users: Map<string, User> = new Map();
  workspaces: Map<string, Workspace> = new Map();
  members: Map<string, WorkspaceMember[]> = new Map(); // workspace_id -> members
  brandProfiles: Map<string, BrandProfile> = new Map(); // workspace_id -> profile
  knowledgeDocs: Map<string, BrandKnowledgeDoc[]> = new Map(); // workspace_id -> docs
  mediaAssets: Map<string, MediaAsset[]> = new Map(); // workspace_id -> assets
  mediaDerivatives: Map<string, MediaDerivative[]> = new Map(); // asset_id -> derivatives
  sources: Map<string, ContentSource> = new Map(); // source_id -> source
  sourceVersions: Map<string, ContentSourceVersion[]> = new Map(); // source_id -> versions
  variants: Map<string, ContentVariant> = new Map(); // variant_id -> variant
  publishingJobs: Map<string, PublishingJob> = new Map(); // job_id -> job
  connections: Map<string, ConnectedAccount[]> = new Map(); // workspace_id -> connections
  publishedRecords: Map<string, PublishedRecord[]> = new Map(); // workspace_id -> records
  opportunities: Map<string, ContentOpportunity[]> = new Map(); // workspace_id -> opportunities
  agentRuns: Map<string, AgentRun[]> = new Map(); // workspace_id -> runs
  auditLogs: Map<string, AuditLog[]> = new Map(); // workspace_id -> logs
  platformVoiceProfiles: Map<string, Map<string, PlatformVoiceProfile>> = new Map(); // workspace_id -> (platform -> voice profile)

  constructor() {
    this.seedDefaults();
  }

  seedDefaults() {
    const now = new Date().toISOString();

    // Default User
    const defaultUser: User = {
      id: "usr_demo_01",
      email: "creator@brand.com",
      name: "Alex Rivers",
      status: "active",
      created_at: now,
    };
    this.users.set(defaultUser.id, defaultUser);

    // Default Workspace
    const defaultWorkspace: Workspace = {
      id: "ws_default_01",
      name: "Acme Growth Studio",
      slug: "acme-growth",
      owner_id: defaultUser.id,
      settings_json: { timezone: "UTC", auto_qa: true, default_language: "en" },
      current_user_role: "owner",
      created_at: now,
    };
    this.workspaces.set(defaultWorkspace.id, defaultWorkspace);

    // Members
    this.members.set(defaultWorkspace.id, [
      {
        id: "mem_1",
        workspace_id: defaultWorkspace.id,
        user_id: defaultUser.id,
        role: "owner",
        user_name: "Alex Rivers",
        user_email: "creator@brand.com",
        created_at: now,
      },
      {
        id: "mem_2",
        workspace_id: defaultWorkspace.id,
        user_id: "usr_sarah",
        role: "editor",
        user_name: "Sarah Chen",
        user_email: "sarah@acme.io",
        created_at: now,
      },
      {
        id: "mem_3",
        workspace_id: defaultWorkspace.id,
        user_id: "usr_marcus",
        role: "reviewer",
        user_name: "Marcus Vance",
        user_email: "marcus@acme.io",
        created_at: now,
      },
    ]);

    // Brand Profile
    this.brandProfiles.set(defaultWorkspace.id, {
      id: "bp_1",
      workspace_id: defaultWorkspace.id,
      name: "Acme Cloud OS",
      description: "Next-generation distributed infrastructure for AI-native enterprises.",
      industry: "Cloud Infrastructure & AI",
      target_audience: "CTOs, Senior Engineers, and Product Architects",
      brand_mission: "Democratize high-performance, deterministic computing systems.",
      tone: "Authoritative yet accessible, engineering-grounded, punchy",
      writing_style: "Data-backed, high-signal, zero-buzzwords",
      preferred_language: "English (US)",
      forbidden_phrases_json: [
        "revolutionary",
        "game-changer",
        "paradigm shift",
        "supercharge",
        "synergy",
        "unleash",
      ],
      preferred_phrases_json: [
        "first-principles",
        "deterministic execution",
        "sub-millisecond latency",
        "zero-downtime",
        "provably reliable",
      ],
      cta_style: "Direct, value-oriented invitation to inspect docs or benchmark results",
      emoji_policy: "Minimal (max 1-2 per post, professional context only)",
      hashtag_policy: "2-4 focused technical tags (#DistributedSystems, #CloudArchitecture)",
      content_pillars_json: [
        { name: "System Architecture & Engineering", target_percentage: 40 },
        { name: "Product Design & UX Teardowns", target_percentage: 30 },
        { name: "Startup Metrics & Scaling Playbooks", target_percentage: 30 },
      ],
      competitors_references_json: [],
      visual_rules_json: { aspect_ratio: "16:9", palette: "slate-indigo" },
      disclosure_rules_json: {},
    });

    // Seed Standard Platform Voice Profiles
    this.platformVoiceProfiles.set(
      defaultWorkspace.id,
      new Map(Object.entries(DEFAULT_PLATFORM_VOICE_PROFILES))
    );

    // Knowledge Docs
    this.knowledgeDocs.set(defaultWorkspace.id, [
      {
        id: "doc_1",
        workspace_id: defaultWorkspace.id,
        title: "Acme Engineering Style & Technical Vocabulary Guide",
        source_type: "text",
        content: "We emphasize precision over hyperbole. Avoid generic claims like 'fastest' without citing reproducible synthetic benchmarks. Distinguish between p95 and p99 metrics.",
        status: "indexed",
        metadata_json: { word_count: 32 },
        created_at: now,
      },
      {
        id: "doc_2",
        workspace_id: defaultWorkspace.id,
        title: "Product Positioning Whitepaper 2026",
        source_type: "text",
        content: "Acme sits between bare-metal Kubernetes and high-level serverless abstractions, delivering predictability at scale.",
        status: "indexed",
        metadata_json: { word_count: 22 },
        created_at: now,
      },
    ]);

    // Initial Sources
    const src1: ContentSource = {
      id: "src_scaling_event_engine",
      workspace_id: defaultWorkspace.id,
      title: "How We Scaled Our Distributed Event Engine to 10M Events/Sec",
      body: "Scaling a distributed event-driven engine requires eliminating synchronous bottlenecks and embracing append-only logs. Here are the 5 architectural shifts we made:\n\n1. Zero-allocation buffers to eliminate garbage collection pauses under sustained load.\n2. Batch commit flushing synchronized with kernel page cache flushing.\n3. Backpressure propagation upstream rather than unbounded in-memory queues.\n4. Sharded ring buffers with lock-free single-producer single-consumer queues.\n5. Deterministic state replay from immutable event logs for instant disaster recovery.",
      content_type: "article",
      language: "en",
      status: "ready_for_adaptation",
      target_platforms_json: ["linkedin", "x", "instagram", "discord", "threads"],
      content_pillar: "System Architecture & Engineering",
      campaign: "Q3 Engineering Authority",
      source_metadata_json: {},
      created_by: defaultUser.id,
      created_at: now,
      updated_at: now,
      version_count: 1,
    };
    this.sources.set(src1.id, src1);

    this.sourceVersions.set(src1.id, [
      {
        id: "ver_1",
        content_source_id: src1.id,
        version_number: 1,
        title: src1.title,
        body: src1.body,
        metadata_json: {},
        created_by: defaultUser.id,
        created_at: now,
      },
    ]);

    // Generate initial variants for src1
    this.seedInitialVariants(src1.id, defaultWorkspace.id, [
      "linkedin",
      "x",
      "instagram",
      "discord",
    ]);

    // Initial Connections
    this.connections.set(defaultWorkspace.id, [
      {
        id: "conn_linkedin_01",
        workspace_id: defaultWorkspace.id,
        platform: "linkedin",
        external_account_id: process.env.LINKEDIN_CLIENT_ID || "li_client_acme_org",
        account_name: "LinkedIn App (OAuth Client)",
        status: "connected",
        scopes_json: ["w_member_social", "r_liteprofile", "r_organization_social", "openid", "profile", "email"],
        created_at: now,
      },
      {
        id: "conn_x_01",
        workspace_id: defaultWorkspace.id,
        platform: "x",
        external_account_id: "1482910398",
        account_name: "@AcmeCloudTech",
        status: "connected",
        scopes_json: ["tweet.read", "tweet.write", "users.read"],
        created_at: now,
      },
      {
        id: "conn_instagram_01",
        workspace_id: defaultWorkspace.id,
        platform: "instagram",
        external_account_id: "manual_creator_studio",
        account_name: "Instagram (Manual / Creator Studio Mode)",
        status: "manual_export_only",
        scopes_json: ["creator_studio_export", "reels_preview"],
        created_at: now,
      },
      {
        id: "conn_discord_01",
        workspace_id: defaultWorkspace.id,
        platform: "discord",
        external_account_id: "discord_dev_guild_901",
        account_name: "Engineering Community Discord (Webhook & Bot)",
        status: "connected",
        scopes_json: ["bot", "incoming-webhook", "messages.read", "messages.write"],
        created_at: now,
      },
    ]);

    // Initial Published Records (Tagged as simulated baseline for initial dashboard demonstration)
    this.publishedRecords.set(defaultWorkspace.id, [
      {
        id: "pub_1",
        workspace_id: defaultWorkspace.id,
        content_variant_id: "var_init_linkedin",
        platform: "linkedin",
        external_post_id: "urn:li:share:719823019283",
        external_url: "https://www.linkedin.com/feed/update/urn:li:share:719823019283",
        published_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        metrics_source: "simulated",
        metadata_json: { impressions: 42300, reactions: 1420, comments: 88 },
      },
      {
        id: "pub_2",
        workspace_id: defaultWorkspace.id,
        content_variant_id: "var_init_x",
        platform: "x",
        external_post_id: "178291028301",
        external_url: "https://x.com/AcmeCloudTech/status/178291028301",
        published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        metrics_source: "simulated",
        metadata_json: { impressions: 184500, retweets: 540, likes: 2900 },
      },
    ]);

    // Opportunities
    this.opportunities.set(defaultWorkspace.id, [
      {
        id: "opp_1",
        workspace_id: defaultWorkspace.id,
        title: "Repurpose viral 'Zero-Allocation Buffers' thread into a Discord Community deep-dive discussion",
        content_pillar: "System Architecture & Engineering",
        suggested_platforms_json: ["discord", "threads"],
        reason: "X thread achieved a 8.4% engagement rate. Community discussion format will drive high server activity and engineer participation.",
        confidence: "High (94%)",
        source_evidence_json: {
          original_post_url: "https://x.com/AcmeCloudTech/status/178291028301",
          impressions: 184500,
          engagement_rate: 0.084,
        },
        status: "open",
        created_at: now,
      },
      {
        id: "opp_2",
        workspace_id: defaultWorkspace.id,
        title: "Expand high-resonance LinkedIn teardown into a canonical Markdown Blog Deep-Dive",
        content_pillar: "Product Design & UX Teardowns",
        suggested_platforms_json: ["blog", "email"],
        reason: "Strong executive comment density on LinkedIn indicates demand for complete configuration benchmarks and downloadable repository code.",
        confidence: "Medium (88%)",
        source_evidence_json: {
          original_platform: "linkedin",
          comment_volume: 88,
          repost_rate: 0.034,
        },
        status: "open",
        created_at: now,
      },
    ]);

    // Agent Runs Telemetry (Powered by Groq)
    this.agentRuns.set(defaultWorkspace.id, [
      {
        id: "run_qa_01",
        workflow_id: "wf_101",
        agent_name: "Deterministic QA & Brand Voice Agent",
        agent_version: "3.0.0",
        status: "completed",
        model: "qwen/qwen3.8-27b (Groq)",
        latency_ms: 184,
        token_usage_json: { prompt_tokens: 1240, completion_tokens: 380, total_tokens: 1620 },
        created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
      },
      {
        id: "run_adapt_01",
        workflow_id: "wf_101",
        agent_name: "Content Adaptation Agent (LinkedIn + X)",
        agent_version: "3.2.0",
        status: "completed",
        model: "qwen/qwen3.8-27b (Groq)",
        latency_ms: 245,
        token_usage_json: { prompt_tokens: 2890, completion_tokens: 1140, total_tokens: 4030 },
        created_at: new Date(Date.now() - 1000 * 60 * 14).toISOString(),
      },
      {
        id: "run_strat_01",
        workflow_id: "wf_101",
        agent_name: "Platform Strategy & Formatting Agent",
        agent_version: "2.4.0",
        status: "completed",
        model: "qwen/qwen3.8-27b (Groq)",
        latency_ms: 115,
        token_usage_json: { prompt_tokens: 950, completion_tokens: 210, total_tokens: 1160 },
        created_at: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
      },
    ]);

    // Audit logs
    this.auditLogs.set(defaultWorkspace.id, [
      {
        id: "aud_1",
        actor_id: defaultUser.id,
        action: "content_variant.published",
        resource_type: "variant",
        resource_id: "var_init_linkedin",
        metadata_json: { platform: "linkedin", status: "success" },
        created_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
      },
      {
        id: "aud_2",
        actor_id: defaultUser.id,
        action: "brand_profile.updated",
        resource_type: "brand_profile",
        resource_id: "bp_1",
        metadata_json: { updated_fields: ["forbidden_phrases_json", "tone"] },
        created_at: new Date(Date.now() - 3600000 * 24 * 4).toISOString(),
      },
    ]);

    // Initial Media Assets
    this.mediaAssets.set(defaultWorkspace.id, [
      {
        id: "media_arch_diagram",
        workspace_id: defaultWorkspace.id,
        filename: "distributed_event_architecture_v2.png",
        storage_key: "assets/arch_diagram_v2.png",
        mime_type: "image/png",
        size_bytes: 482100,
        width: 1920,
        height: 1080,
        checksum: "sha256_8fa9c812d",
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80",
        metadata_json: { tag: "architecture" },
        uploaded_by: defaultUser.id,
        created_at: now,
      },
    ]);
  }

  seedInitialVariants(
    sourceId: string,
    workspaceId: string,
    platforms: string[] = ["linkedin", "x", "instagram", "discord"]
  ): ContentVariant[] {
    const src = this.sources.get(sourceId);
    if (!src) return [];

    const now = new Date().toISOString();
    const createdVariants: ContentVariant[] = [];

    const platformTemplates: Record<string, { format: string; getBody: () => string; getCaption: () => string; getCTA: string; hashtags: string[]; targetLen: number; angle: string }> = {
      linkedin: {
        format: "Text Post + Key Insights",
        getBody: () =>
          `Most engineering organizations struggle when scaling their event pipeline beyond 1M events/sec.\n\nHere is the exact architectural blueprint we implemented for ${src.title.toLowerCase()}:\n\n` +
          `1. Eliminate GC overhead with zero-allocation off-heap memory buffers.\n` +
          `2. Replace synchronous database commits with batch kernel ring buffers.\n` +
          `3. Implement upstream backpressure shedding rather than growing memory pools.\n` +
          `4. Utilize deterministic append-only replay logs for zero-latency failover.\n\n` +
          `The core takeaway: True scale is about eliminating synchronous coordination.\n\n` +
          `What has been your biggest bottleneck when scaling streaming data? Drop your perspective below.`,
        getCaption: () => "Architectural blueprint for high-throughput distributed systems.",
        getCTA: "Join the technical discussion below.",
        hashtags: ["#DistributedSystems", "#CloudArchitecture", "#SoftwareEngineering", "#Scale"],
        targetLen: 750,
        angle: "First-principles engineering architecture breakdown",
      },
      x: {
        format: "Multi-Tweet Insights Thread",
        getBody: () =>
          `1/6 🧵 ${src.title}\n\n` +
          `Scaling past 10M events/sec is not about buying bigger servers.\n` +
          `It is about removing synchronous bottlenecks.\n\n` +
          `Here are the 5 architectural shifts we made 👇\n\n` +
          `---\n\n` +
          `2/6 1️⃣ Zero-Allocation Memory Buffers\n` +
          `Garbage collection pauses will kill p99 latency.\n` +
          `Pre-allocating reusable ring buffers kept our p99 under 1.2ms under sustained load.\n\n` +
          `---\n\n` +
          `3/6 2️⃣ Upstream Backpressure\n` +
          `Unbounded in-memory queues are an illusion. When downstream slows, shed load at the ingress edge immediately.\n\n` +
          `---\n\n` +
          `4/6 3️⃣ Deterministic Replay Logs\n` +
          `When failures happen (and they will), recover state by replaying append-only logs from checkpoint.\n\n` +
          `---\n\n` +
          `5/6 Bottom line: Systems either fail predictably or collapse catastrophically.\n\n` +
          `6/6 🔁 Repost if this helps your engineering team build more resilient systems.`,
        getCaption: () => "Technical thread on distributed event-driven systems at scale.",
        getCTA: "Retweet and follow for weekly systems teardowns.",
        hashtags: ["#SystemDesign", "#BuildInPublic", "#TechTwitter"],
        targetLen: 920,
        angle: "Punchy, numbered thread with actionable rules",
      },
      instagram: {
        format: "Carousel Slide Script & Aesthetic Hook",
        getBody: () =>
          `HOW TO SCALE TO 10M EVENTS/SEC ⚡️\n\n` +
          `Swipe through for the 5-step engineering breakdown: \n\n` +
          `[Slide 1] The Architecture Dilemma\n` +
          `[Slide 2] Zero-Allocation Buffers Explained\n` +
          `[Slide 3] Backpressure: Fail at the Edge, not Core\n` +
          `[Slide 4] Replay Logs & Recovery\n` +
          `[Slide 5] The Complete Systems Topology Blueprint\n\n` +
          `Save this post for your next system design review! 🔖`,
        getCaption: () => "5 architectural shifts to scale distributed pipelines to 10M events/sec.",
        getCTA: "Double tap & save for your next systems design interview.",
        hashtags: ["#TechEducation", "#SystemDesign", "#SoftwareEngineer", "#CodingLife"],
        targetLen: 420,
        angle: "Visual carousel layout with swipeable slides",
      },
      discord: {
        format: "Community Broadcast & Discussion",
        getBody: () =>
          `📢 **COMMUNITY ANNOUNCEMENT: ${src.title.toUpperCase()}**\n\n` +
          `Hey @everyone! We just dropped a comprehensive engineering blueprint on **${src.title}**.\n\n` +
          `### ⚡ Architectural Breakdown:\n` +
          `• **Zero-Allocation Buffers**: Eliminated GC pauses under sustained tail-load.\n` +
          `• **Lock-Free Concurrency**: Ring buffers replacing mutexes for sub-millisecond p99.\n` +
          `• **Backpressure Resilience**: Upstream rate-limiting prevents memory exhaustion.\n` +
          `• **Deterministic Replay**: Append-only logs for failover resilience.\n\n` +
          `💬 **Discussion**: How is your team handling distributed streaming pipelines? Drop your questions below in #engineering-chat!`,
        getCaption: () => `Discord Community Blueprint: ${src.title}`,
        getCTA: "Join the technical discussion in #engineering-chat.",
        hashtags: ["#DiscordCommunity", "#Architecture", "#DevOps"],
        targetLen: 680,
        angle: "Interactive technical community announcement",
      },
      threads: {
        format: "Conversational Micro-Post",
        getBody: () =>
          `The biggest misconception about distributed systems:\n\n` +
          `"We just need Kafka and Redis."\n\n` +
          `Tools don't solve architecture. Backpressure and deterministic replay do. What's your take?`,
        getCaption: () => "Distributed systems perspective.",
        getCTA: "Reply with your thoughts.",
        hashtags: ["#tech", "#software"],
        targetLen: 220,
        angle: "Conversational hook",
      },
      email: {
        format: "Newsletter Dispatch",
        getBody: () =>
          `Subject: Inside our 10M events/sec architecture rebuild\n\n` +
          `Hey engineers,\n\n` +
          `This week we deployed the biggest architectural rewrite in Acme's history.\n\n` +
          `Key Highlights:\n` +
          `• p99 latency: -94%\n` +
          `• Server footprint: Reduced from 42 nodes to 12\n\n` +
          `Read the complete deep dive below.`,
        getCaption: () => "Weekly Engineering Dispatch #42",
        getCTA: "Read full post on web",
        hashtags: [],
        targetLen: 650,
        angle: "Direct-to-subscriber editorial",
      },
      blog: {
        format: "Markdown Article Deep Dive",
        getBody: () =>
          `# ${src.title}\n\n` +
          `## Introduction\n\n` +
          `High-throughput data ingestion presents unique challenges when systems cross the 1M ops threshold...\n\n` +
          `## The Core Bottlenecks\n\n` +
          `${src.body}\n\n` +
          `## Conclusion\n\nDeterministic system design ensures reproducible performance at enterprise scale.`,
        getCaption: () => "Canonical engineering article.",
        getCTA: "Explore repository documentation.",
        hashtags: ["#SystemsArchitecture"],
        targetLen: 1200,
        angle: "In-depth reference guide",
      },
    };

    for (const plat of platforms) {
      const template = platformTemplates[plat] || platformTemplates["linkedin"];
      const variantId = `var_${sourceId}_${plat}_${Date.now() % 100000}`;

      const variant: ContentVariant = {
        id: variantId,
        workspace_id: workspaceId,
        content_source_id: sourceId,
        platform: plat,
        format: template.format,
        status: "needs_review",
        title: `${src.title} (${plat.toUpperCase()})`,
        body: template.getBody(),
        caption: template.getCaption(),
        cta: template.getCTA,
        hashtags_json: template.hashtags,
        strategy_json: {
          platform: plat,
          format: template.format,
          angle: template.angle,
          hook_style: "Evidence-first high-contrast hook",
          target_length_chars: template.targetLen,
          cta_recommendation: template.getCTA,
          media_required: plat === "instagram",
        },
        quality_review_json: {
          quality_score: Math.floor(90 + Math.random() * 8),
          passed: true,
          checks: {
            brand_voice: "Passed (No forbidden words detected)",
            length_limit: "Passed (Within native platform limits)",
            hook_retention: "High (Clear technical or narrative tension)",
            cta_alignment: "Passed (Clear direct prompt)",
          },
          issues: [],
        },
        created_at: now,
        updated_at: now,
      };

      this.variants.set(variant.id, variant);
      createdVariants.push(variant);
    }

    // Record agent run telemetry
    const runs = this.agentRuns.get(workspaceId) || [];
    runs.unshift({
      id: `run_adapt_${Date.now()}`,
      workflow_id: `wf_${Date.now().toString(36)}`,
      agent_name: `Multi-Agent Pipeline (${platforms.length} platforms)`,
      agent_version: "3.2.0",
      status: "completed",
      model: "gemini-2.5-flash",
      latency_ms: 450 + platforms.length * 90,
      token_usage_json: {
        prompt_tokens: 1500 + platforms.length * 300,
        completion_tokens: 600 + platforms.length * 200,
        total_tokens: 2100 + platforms.length * 500,
      },
      created_at: now,
    });
    this.agentRuns.set(workspaceId, runs);

    return createdVariants;
  }

  async generateVariantsForSource(
    sourceId: string,
    workspaceId: string,
    platforms: string[] = ["linkedin", "x", "instagram", "discord"]
  ): Promise<ContentVariant[]> {
    const src = this.sources.get(sourceId);
    if (!src) return [];

    // Clear any previous variants for this source to ensure each platform only appears once
    for (const [id, existing] of this.variants.entries()) {
      if (existing.content_source_id === sourceId && platforms.includes(existing.platform)) {
        this.variants.delete(id);
      }
    }

    const bp = this.brandProfiles.get(workspaceId);
    const now = new Date().toISOString();
    const createdVariants: ContentVariant[] = [];
    let totalLatency = 0;
    let totalPromptTokens = 0;
    let totalCompletionTokens = 0;

    for (const plat of platforms) {
      // Call Groq LLM adaptation engine
      const gen = await generatePlatformVariantWithGroq(src.title, src.body, plat, bp);
      totalLatency += gen.latency_ms;
      totalPromptTokens += gen.prompt_tokens;
      totalCompletionTokens += gen.completion_tokens;

      const variantId = `var_${sourceId}_${plat}_${Date.now() % 100000}`;
      const variant: ContentVariant = {
        id: variantId,
        workspace_id: workspaceId,
        content_source_id: sourceId,
        platform: plat,
        format: `${plat.toUpperCase()} Native Post`,
        status: "needs_review",
        title: `${src.title} (${plat.toUpperCase()})`,
        body: gen.body,
        caption: gen.caption,
        cta: gen.cta,
        hashtags_json: gen.hashtags,
        strategy_json: {
          platform: plat,
          format: `${plat.toUpperCase()} Post`,
          angle: gen.angle,
          hook_style: "Groq High-Resonance Hook",
          target_length_chars: gen.target_length_chars,
          cta_recommendation: gen.cta,
          media_required: plat === "instagram",
        },
        quality_review_json: {
          quality_score: gen.quality_score,
          passed: gen.quality_score >= 85,
          checks: gen.checks,
          issues: [],
        },
        created_at: now,
        updated_at: now,
      };

      this.variants.set(variant.id, variant);
      createdVariants.push(variant);
    }

    // Record agent run telemetry powered by Groq
    const runs = this.agentRuns.get(workspaceId) || [];
    runs.unshift({
      id: `run_adapt_${Date.now()}`,
      workflow_id: `wf_${Date.now().toString(36)}`,
      agent_name: `Multi-Agent Pipeline (${platforms.length} platforms)`,
      agent_version: "3.2.0",
      status: "completed",
      model: "qwen/qwen3.8-27b (Groq)",
      latency_ms: totalLatency || 240,
      token_usage_json: {
        prompt_tokens: totalPromptTokens || 1200,
        completion_tokens: totalCompletionTokens || 850,
        total_tokens: (totalPromptTokens || 1200) + (totalCompletionTokens || 850),
      },
      created_at: now,
    });
    this.agentRuns.set(workspaceId, runs);

    return createdVariants;
  }

  async regenerateVariant(
    variantId: string,
    instruction: string
  ): Promise<ContentVariant | null> {
    const v = this.variants.get(variantId);
    if (!v) return null;

    const res = await regenerateVariantWithGroq(v.body, instruction, v.platform);
    v.body = res.body;
    v.updated_at = new Date().toISOString();

    const runs = this.agentRuns.get(v.workspace_id) || [];
    runs.unshift({
      id: `run_regen_${Date.now()}`,
      workflow_id: `wf_regen_${Date.now().toString(36)}`,
      agent_name: `Content Refinement Agent (${v.platform.toUpperCase()})`,
      agent_version: "3.2.0",
      status: "completed",
      model: res.model_used,
      latency_ms: res.latency_ms,
      token_usage_json: { prompt_tokens: 420, completion_tokens: 310, total_tokens: 730 },
      created_at: new Date().toISOString(),
    });
    this.agentRuns.set(v.workspace_id, runs);

    return v;
  }
}

export const getStore = (): LisaStore => {
  if (!globalThis.__LISA_STORE__) {
    globalThis.__LISA_STORE__ = new LisaStore();
  }
  return globalThis.__LISA_STORE__;
};
