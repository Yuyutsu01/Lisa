import { NextRequest, NextResponse } from "next/server";
import { getStore, ContentSource, ContentVariant, PublishingJob, CalendarEvent, ConnectedAccount, PublishedRecord } from "@/lib/server-store";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ slug?: string[] }>;
}

export async function GET(req: NextRequest, context: RouteContext) {
  const store = getStore();
  const { slug = [] } = await context.params;
  const path = slug.join("/");
  const url = new URL(req.url);

  // 1. Auth: /auth/me
  if (path === "auth/me") {
    const user = Array.from(store.users.values())[0];
    if (!user) return NextResponse.json({ detail: "Not authenticated" }, { status: 401 });
    return NextResponse.json(user);
  }

  // 2. Workspaces: /workspaces
  if (path === "workspaces") {
    const workspaces = Array.from(store.workspaces.values());
    return NextResponse.json(workspaces);
  }

  // 3. Workspace detail: /workspaces/:id
  if (slug[0] === "workspaces" && slug.length === 2) {
    const ws = store.workspaces.get(slug[1]);
    if (!ws) return NextResponse.json({ detail: "Workspace not found" }, { status: 404 });
    return NextResponse.json(ws);
  }

  // 4. Members: /workspaces/:id/members
  if (slug[0] === "workspaces" && slug[2] === "members" && slug.length === 3) {
    const members = store.members.get(slug[1]) || [];
    return NextResponse.json(members);
  }

  // 5. Brand Profile: /workspaces/:id/brand
  if (slug[0] === "workspaces" && slug[2] === "brand" && slug.length === 3) {
    let profile = store.brandProfiles.get(slug[1]);
    if (!profile) {
      profile = {
        id: `bp_${slug[1]}`,
        workspace_id: slug[1],
        name: "Acme Cloud OS",
        description: "Next-generation distributed infrastructure for AI-native enterprises.",
        industry: "Cloud Infrastructure",
        target_audience: "CTOs, Senior Engineers, and Product Architects",
        brand_mission: "Democratize high-performance, deterministic computing systems.",
        tone: "Authoritative yet accessible, engineering-grounded, punchy",
        writing_style: "Data-backed, high-signal, zero-buzzwords",
        preferred_language: "English (US)",
        forbidden_phrases_json: ["revolutionary", "game-changer", "paradigm shift", "supercharge", "synergy"],
        preferred_phrases_json: ["first-principles", "deterministic execution", "sub-millisecond latency"],
        cta_style: "Direct technical invitation to inspect benchmarks",
        emoji_policy: "Minimal (max 1-2 per post)",
        hashtag_policy: "2-4 focused technical tags",
        content_pillars_json: [
          { name: "System Architecture & Engineering", target_percentage: 40 },
          { name: "Product Design & UX Teardowns", target_percentage: 30 },
          { name: "Startup Metrics & Scaling Playbooks", target_percentage: 30 },
        ],
        competitors_references_json: [],
        visual_rules_json: {},
        disclosure_rules_json: {},
      };
      store.brandProfiles.set(slug[1], profile);
    }
    return NextResponse.json(profile);
  }

  // 6. Brand Knowledge: /workspaces/:id/brand/knowledge
  if (slug[0] === "workspaces" && slug[2] === "brand" && slug[3] === "knowledge") {
    const docs = store.knowledgeDocs.get(slug[1]) || [];
    return NextResponse.json(docs);
  }

  // 7. Media: /workspaces/:id/media
  if (slug[0] === "workspaces" && slug[2] === "media" && slug.length === 3) {
    const assets = store.mediaAssets.get(slug[1]) || [];
    return NextResponse.json(assets);
  }

  // 8. Media derivatives: /media/:assetId/derivatives
  if (slug[0] === "media" && slug[2] === "derivatives") {
    const derivs = store.mediaDerivatives.get(slug[1]) || [];
    return NextResponse.json(derivs);
  }

  // 9. Sources list: /workspaces/:id/sources
  if (slug[0] === "workspaces" && slug[2] === "sources" && slug.length === 3) {
    const wsId = slug[1];
    let sources = Array.from(store.sources.values()).filter((s) => s.workspace_id === wsId);
    const status = url.searchParams.get("status");
    const pillar = url.searchParams.get("pillar");
    if (status) sources = sources.filter((s) => s.status === status);
    if (pillar) sources = sources.filter((s) => s.content_pillar === pillar);
    return NextResponse.json(sources);
  }

  // 10. Source detail: /sources/:id
  if (slug[0] === "sources" && slug.length === 2) {
    const src = store.sources.get(slug[1]);
    if (!src) return NextResponse.json({ detail: "Source not found" }, { status: 404 });
    return NextResponse.json(src);
  }

  // 11. Source versions: /sources/:id/versions
  if (slug[0] === "sources" && slug[2] === "versions") {
    const versions = store.sourceVersions.get(slug[1]) || [];
    return NextResponse.json(versions);
  }

  // 12. Source variants: /sources/:id/variants
  if (slug[0] === "sources" && slug[2] === "variants") {
    const variants = Array.from(store.variants.values()).filter((v) => v.content_source_id === slug[1]);
    return NextResponse.json(variants);
  }

  // 13. Variant detail: /variants/:id
  if (slug[0] === "variants" && slug.length === 2) {
    const variant = store.variants.get(slug[1]);
    if (!variant) return NextResponse.json({ detail: "Variant not found" }, { status: 404 });
    return NextResponse.json(variant);
  }

  // 14. Calendar events: /workspaces/:id/calendar
  if (slug[0] === "workspaces" && slug[2] === "calendar") {
    const jobs = Array.from(store.publishingJobs.values()).filter((j) => j.workspace_id === slug[1]);
    const events: CalendarEvent[] = jobs.map((job) => ({
      id: `ev_${job.id}`,
      job_id: job.id,
      variant_id: job.content_variant_id,
      platform: job.variant_platform || "linkedin",
      title: job.variant_title || "Scheduled Post",
      snippet: (job.variant_body || "").slice(0, 100),
      scheduled_at: job.scheduled_at,
      status: job.status,
    }));
    return NextResponse.json(events);
  }

  // 15. Connections: /workspaces/:id/connections
  if (slug[0] === "workspaces" && slug[2] === "connections") {
    const conns = store.connections.get(slug[1]) || [];
    return NextResponse.json(conns);
  }

  // 16. Published records: /workspaces/:id/published
  if (slug[0] === "workspaces" && slug[2] === "published") {
    const records = store.publishedRecords.get(slug[1]) || [];
    return NextResponse.json(records);
  }

  // 17. Analytics Overview: /workspaces/:id/analytics/overview
  if (slug[0] === "workspaces" && slug[2] === "analytics" && slug[3] === "overview") {
    return NextResponse.json({
      total_impressions: 1240500,
      total_reach: 890200,
      total_engagements: 84320,
      avg_engagement_rate: 6.8,
      total_posts_published: 24,
      platform_breakdown: [
        { platform: "linkedin", total_posts: 10, impressions: 480000, engagements: 36000, avg_engagement_rate: 7.5 },
        { platform: "x", total_posts: 8, impressions: 590000, engagements: 38000, avg_engagement_rate: 6.4 },
        { platform: "instagram", total_posts: 4, impressions: 110500, engagements: 7200, avg_engagement_rate: 6.5 },
        { platform: "youtube", total_posts: 2, impressions: 60000, engagements: 3120, avg_engagement_rate: 5.2 },
      ],
      top_performing_posts: [
        {
          published_record_id: "pub_2",
          platform: "x",
          title: "Zero-Allocation Memory Buffers (10M Events Thread)",
          external_url: "https://x.com/AcmeCloudTech/status/178291028301",
          impressions: 184500,
          engagements: 15498,
          engagement_rate: 8.4,
          published_at: new Date(Date.now() - 3600000 * 24 * 3).toISOString(),
        },
        {
          published_record_id: "pub_1",
          platform: "linkedin",
          title: "How We Scaled Our Distributed Event Engine",
          external_url: "https://www.linkedin.com/feed/update/urn:li:share:719823019283",
          impressions: 42300,
          engagements: 3172,
          engagement_rate: 7.5,
          published_at: new Date(Date.now() - 3600000 * 24 * 2).toISOString(),
        },
      ],
      open_opportunities_count: (store.opportunities.get(slug[1]) || []).length,
    });
  }

  // 18. Analytics Opportunities: /workspaces/:id/analytics/opportunities
  if (slug[0] === "workspaces" && slug[2] === "analytics" && slug[3] === "opportunities") {
    const opps = store.opportunities.get(slug[1]) || [];
    return NextResponse.json(opps);
  }

  // 19. Agent Runs: /workspaces/:id/agent-runs
  if (slug[0] === "workspaces" && slug[2] === "agent-runs") {
    const runs = store.agentRuns.get(slug[1]) || [];
    return NextResponse.json(runs);
  }

  // 20. Audit Logs: /workspaces/:id/audit-logs
  if (slug[0] === "workspaces" && slug[2] === "audit-logs") {
    const logs = store.auditLogs.get(slug[1]) || [];
    return NextResponse.json(logs);
  }

  // 21. System Health: /workspaces/:id/system-health
  if (slug[0] === "workspaces" && slug[2] === "system-health") {
    return NextResponse.json({
      status: "healthy",
      database: "connected (In-Memory Ephemeral Engine)",
      llm_provider: "Groq Cloud Inference (qwen/qwen3.8-27b & openai/gpt-oss-120b)",
      groq_status: "connected (Active, replacing Anthropic, OpenAI, and Gemini)",
      credentials: {
        groq_configured: true,
        linkedin_client_id: "li_client_id_placeholder",
        instagram_mode: "manual_export_only",
      },
      agents: {
        intake_agent: "operational (Groq fast tier)",
        strategy_agent: "operational (Groq fast tier)",
        adaptation_agent: "operational (Groq fast tier)",
        caption_agent: "operational (Groq fast tier)",
        qa_brand_agent: "operational (Groq deterministic QA)",
        recommendation_agent: "operational (Groq fast tier)",
      },
      supported_platform_adapters: {
        linkedin: "direct_api_ready (Client ID configured)",
        x: "direct_api_ready",
        instagram: "manual_export_creator_studio_ready",
        youtube: "direct_api_ready",
        tiktok: "draft_mode_ready",
        threads: "direct_api_ready",
        email: "esp_webhook_ready",
        blog: "markdown_cms_ready",
      },
    });
  }

  return NextResponse.json({ detail: `Route GET /api/v1/${path} not found` }, { status: 404 });
}

export async function POST(req: NextRequest, context: RouteContext) {
  const store = getStore();
  const { slug = [] } = await context.params;
  const path = slug.join("/");

  // Auth: /auth/login
  if (path === "auth/login") {
    const body = await req.json().catch(() => ({}));
    const email = body.email || "creator@brand.com";
    let user = Array.from(store.users.values()).find((u) => u.email === email);
    if (!user) {
      user = {
        id: `usr_${Date.now()}`,
        email,
        name: email.split("@")[0] || "Creator",
        status: "active",
        created_at: new Date().toISOString(),
      };
      store.users.set(user.id, user);
    }
    return NextResponse.json({
      access_token: `token_${user.id}_${Date.now()}`,
      token_type: "bearer",
    });
  }

  // Auth: /auth/register
  if (path === "auth/register") {
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    const user = {
      id: `usr_${Date.now()}`,
      email: body.email || `user_${Date.now()}@domain.com`,
      name: body.name || "New Creator",
      status: "active",
      created_at: now,
    };
    store.users.set(user.id, user);

    const ws = {
      id: `ws_${Date.now()}`,
      name: `${user.name}'s Studio`,
      slug: user.name.toLowerCase().replace(/[^a-z0-9]/g, "-") || "my-studio",
      owner_id: user.id,
      settings_json: {},
      current_user_role: "owner",
      created_at: now,
    };
    store.workspaces.set(ws.id, ws);

    return NextResponse.json({
      user,
      workspace_id: ws.id,
      token: { access_token: `token_${user.id}_${Date.now()}` },
    });
  }

  // Workspaces: /workspaces
  if (path === "workspaces") {
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    const user = Array.from(store.users.values())[0];
    const newWs = {
      id: `ws_${Date.now()}`,
      name: body.name || "New Workspace",
      slug: body.slug || (body.name || "workspace").toLowerCase().replace(/[^a-z0-9]/g, "-"),
      owner_id: user?.id || "usr_demo",
      settings_json: {},
      current_user_role: "owner",
      created_at: now,
    };
    store.workspaces.set(newWs.id, newWs);
    return NextResponse.json(newWs, { status: 201 });
  }

  // Members: /workspaces/:id/members
  if (slug[0] === "workspaces" && slug[2] === "members" && slug.length === 3) {
    const body = await req.json().catch(() => ({}));
    const wsId = slug[1];
    const member = {
      id: `mem_${Date.now()}`,
      workspace_id: wsId,
      user_id: `usr_${Date.now()}`,
      role: body.role || "editor",
      user_name: (body.email || "user").split("@")[0],
      user_email: body.email,
      created_at: new Date().toISOString(),
    };
    const members = store.members.get(wsId) || [];
    members.push(member);
    store.members.set(wsId, members);
    return NextResponse.json(member, { status: 201 });
  }

  // Brand Knowledge: /workspaces/:id/brand/knowledge
  if (slug[0] === "workspaces" && slug[2] === "brand" && slug[3] === "knowledge") {
    const body = await req.json().catch(() => ({}));
    const wsId = slug[1];
    const doc = {
      id: `doc_${Date.now()}`,
      workspace_id: wsId,
      title: body.title || "Untitled Document",
      source_type: body.source_type || "text",
      content: body.content || "",
      status: "indexed",
      metadata_json: body.metadata_json || {},
      created_at: new Date().toISOString(),
    };
    const docs = store.knowledgeDocs.get(wsId) || [];
    docs.unshift(doc);
    store.knowledgeDocs.set(wsId, docs);
    return NextResponse.json(doc, { status: 201 });
  }

  // Media upload: /workspaces/:id/media/upload
  if (slug[0] === "workspaces" && slug[2] === "media" && slug[3] === "upload") {
    const wsId = slug[1];
    const asset = {
      id: `media_${Date.now()}`,
      workspace_id: wsId,
      filename: "uploaded_asset.png",
      storage_key: `assets/${Date.now()}.png`,
      mime_type: "image/png",
      size_bytes: 256000,
      width: 1200,
      height: 630,
      checksum: `sha256_${Date.now().toString(16)}`,
      url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=1200&auto=format&fit=crop&q=80",
      metadata_json: {},
      uploaded_by: "usr_demo",
      created_at: new Date().toISOString(),
    };
    const assets = store.mediaAssets.get(wsId) || [];
    assets.unshift(asset);
    store.mediaAssets.set(wsId, assets);
    return NextResponse.json(asset, { status: 201 });
  }

  // Sources create: /workspaces/:id/sources
  if (slug[0] === "workspaces" && slug[2] === "sources" && slug.length === 3) {
    const body = await req.json().catch(() => ({}));
    const wsId = slug[1];
    const now = new Date().toISOString();
    const source: ContentSource = {
      id: `src_${Date.now()}`,
      workspace_id: wsId,
      title: body.title || "Untitled Idea",
      body: body.body || "",
      content_type: body.content_type || "article",
      language: body.language || "en",
      status: body.status || "draft",
      target_platforms_json: body.target_platforms_json || ["linkedin", "x"],
      content_pillar: body.content_pillar || "General",
      campaign: body.campaign || "",
      source_metadata_json: body.source_metadata_json || {},
      created_by: "usr_demo",
      created_at: now,
      updated_at: now,
      version_count: 1,
    };
    store.sources.set(source.id, source);

    store.sourceVersions.set(source.id, [
      {
        id: `ver_${Date.now()}`,
        content_source_id: source.id,
        version_number: 1,
        title: source.title,
        body: source.body,
        metadata_json: {},
        created_by: "usr_demo",
        created_at: now,
      },
    ]);

    return NextResponse.json(source, { status: 201 });
  }

  // Generate variants: /sources/:id/generate
  if (slug[0] === "sources" && slug[2] === "generate") {
    const srcId = slug[1];
    const src = store.sources.get(srcId);
    if (!src) return NextResponse.json({ detail: "Source not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const platforms = body.platforms || src.target_platforms_json || ["linkedin", "x"];
    const variants = await store.generateVariantsForSource(srcId, src.workspace_id, platforms);
    return NextResponse.json({
      workflow_id: `wf_${Date.now()}`,
      content_source_id: srcId,
      variants_count: variants.length,
      variants,
    });
  }

  // Restore version: /sources/:id/versions/:verId/restore
  if (slug[0] === "sources" && slug[2] === "versions" && slug[4] === "restore") {
    const srcId = slug[1];
    const verId = slug[3];
    const versions = store.sourceVersions.get(srcId) || [];
    const target = versions.find((v) => v.id === verId);
    const src = store.sources.get(srcId);
    if (src && target) {
      src.title = target.title;
      src.body = target.body;
      src.updated_at = new Date().toISOString();
      return NextResponse.json(src);
    }
    return NextResponse.json({ detail: "Version not found" }, { status: 404 });
  }

  // Variant regenerate: /variants/:id/regenerate
  if (slug[0] === "variants" && slug[2] === "regenerate") {
    const variantId = slug[1];
    const body = await req.json().catch(() => ({}));
    const instruction = body.instruction || "Refine hook and strengthen technical resonance";
    const updated = await store.regenerateVariant(variantId, instruction);
    if (!updated) return NextResponse.json({ detail: "Variant not found" }, { status: 404 });
    return NextResponse.json(updated);
  }

  // Variant approve: /variants/:id/approve
  if (slug[0] === "variants" && slug[2] === "approve") {
    const variantId = slug[1];
    const v = store.variants.get(variantId);
    if (!v) return NextResponse.json({ detail: "Variant not found" }, { status: 404 });
    v.status = "approved";
    v.approved_at = new Date().toISOString();
    v.approved_by = "usr_demo";
    v.updated_at = new Date().toISOString();
    return NextResponse.json(v);
  }

  // Variant reject: /variants/:id/reject
  if (slug[0] === "variants" && slug[2] === "reject") {
    const variantId = slug[1];
    const v = store.variants.get(variantId);
    if (!v) return NextResponse.json({ detail: "Variant not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    v.status = "rejected";
    v.rejection_reason = body.rejection_reason || "Requires revision";
    v.updated_at = new Date().toISOString();
    return NextResponse.json(v);
  }

  // Variant schedule: /variants/:id/schedule
  if (slug[0] === "variants" && slug[2] === "schedule") {
    const variantId = slug[1];
    const v = store.variants.get(variantId);
    if (!v) return NextResponse.json({ detail: "Variant not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    const now = new Date().toISOString();
    const job: PublishingJob = {
      id: `job_${Date.now()}`,
      workspace_id: v.workspace_id,
      content_variant_id: variantId,
      connected_account_id: body.connected_account_id,
      scheduled_at: body.scheduled_at || new Date(Date.now() + 3600000 * 4).toISOString(),
      timezone: body.timezone || "UTC",
      status: "scheduled",
      idempotency_key: `idemp_${Date.now()}`,
      attempt_count: 0,
      variant_platform: v.platform,
      variant_title: v.title,
      variant_body: v.body,
      created_at: now,
      updated_at: now,
    };
    store.publishingJobs.set(job.id, job);
    v.status = "scheduled";
    return NextResponse.json(job, { status: 201 });
  }

  // Publish immediate: /workspaces/:id/variants/:variantId/publish
  if (slug[0] === "workspaces" && slug[2] === "variants" && slug[4] === "publish") {
    const wsId = slug[1];
    const variantId = slug[3];
    const v = store.variants.get(variantId);
    if (v) {
      v.status = "published";
      const record: PublishedRecord = {
        id: `pub_${Date.now()}`,
        workspace_id: wsId,
        content_variant_id: variantId,
        platform: v.platform,
        external_post_id: `ext_${Date.now()}`,
        external_url: `https://${v.platform}.com/post/${Date.now()}`,
        published_at: new Date().toISOString(),
        metadata_json: { status: "live" },
      };
      const records = store.publishedRecords.get(wsId) || [];
      records.unshift(record);
      store.publishedRecords.set(wsId, records);
      return NextResponse.json({
        success: true,
        external_url: record.external_url,
        published_record_id: record.id,
      });
    }
    return NextResponse.json({ success: true, external_url: `https://social.com/post/${Date.now()}` });
  }

  // Connections create: /workspaces/:id/connections
  if (slug[0] === "workspaces" && slug[2] === "connections") {
    const wsId = slug[1];
    const body = await req.json().catch(() => ({}));
    const conn: ConnectedAccount = {
      id: `conn_${Date.now()}`,
      workspace_id: wsId,
      platform: body.platform || "custom",
      external_account_id: body.external_account_id || `acc_${Date.now()}`,
      account_name: body.account_name || `${body.platform || "Platform"} Account`,
      status: "connected",
      scopes_json: body.scopes || ["publish", "read"],
      created_at: new Date().toISOString(),
    };
    const conns = store.connections.get(wsId) || [];
    conns.push(conn);
    store.connections.set(wsId, conns);
    return NextResponse.json(conn, { status: 201 });
  }

  // Analytics analyze loop: /workspaces/:id/analytics/analyze
  if (slug[0] === "workspaces" && slug[2] === "analytics" && slug[3] === "analyze") {
    const wsId = slug[1];
    const newOpp = {
      id: `opp_${Date.now()}`,
      workspace_id: wsId,
      title: "Adapt trending 'Systems Replay Logs' takeaway into an interactive Instagram Carousel",
      content_pillar: "System Architecture & Engineering",
      suggested_platforms_json: ["instagram", "threads"],
      reason: "High organic save velocity detected on technical deep dives across developer audiences.",
      confidence: "Very High (96%)",
      source_evidence_json: { signal: "Save-to-impression ratio exceeded 12%" },
      status: "open",
      created_at: new Date().toISOString(),
    };
    const opps = store.opportunities.get(wsId) || [];
    opps.unshift(newOpp);
    store.opportunities.set(wsId, opps);
    return NextResponse.json({ status: "success", opportunities: opps });
  }

  // Action opportunity: /workspaces/:id/analytics/opportunities/:oppId/create-source
  if (slug[0] === "workspaces" && slug[2] === "analytics" && slug[3] === "opportunities" && slug[5] === "create-source") {
    const wsId = slug[1];
    const oppId = slug[4];
    const opps = store.opportunities.get(wsId) || [];
    const opp = opps.find((o) => o.id === oppId);
    const now = new Date().toISOString();
    const source: ContentSource = {
      id: `src_opp_${Date.now()}`,
      workspace_id: wsId,
      title: opp?.title || "Repurposed Growth Opportunity",
      body: `Canonical source generated from AI Opportunity: ${opp?.reason || "High resonance pattern"}.\n\nCore Hook: Scaling requires eliminating unbounded queues and adopting immutable event replay.\nKey Insight: Systems either fail predictably or collapse catastrophically.`,
      content_type: "article",
      language: "en",
      status: "ready_for_adaptation",
      target_platforms_json: opp?.suggested_platforms_json || ["linkedin", "x"],
      content_pillar: opp?.content_pillar || "System Architecture & Engineering",
      campaign: "Closed-Loop AI Repurposing",
      source_metadata_json: { opportunity_id: oppId },
      created_by: "usr_demo",
      created_at: now,
      updated_at: now,
      version_count: 1,
    };
    store.sources.set(source.id, source);
    if (opp) opp.status = "actioned";
    return NextResponse.json(source, { status: 201 });
  }

  // Cancel publishing job: /publishing-jobs/:id/cancel
  if (slug[0] === "publishing-jobs" && slug[2] === "cancel") {
    const job = store.publishingJobs.get(slug[1]);
    if (job) {
      job.status = "cancelled";
      job.updated_at = new Date().toISOString();
      return NextResponse.json(job);
    }
    return NextResponse.json({ detail: "Job not found" }, { status: 404 });
  }

  return NextResponse.json({ detail: `Route POST /api/v1/${path} not found` }, { status: 404 });
}

export async function PUT(req: NextRequest, context: RouteContext) {
  const store = getStore();
  const { slug = [] } = await context.params;
  const path = slug.join("/");

  // Brand profile update: /workspaces/:id/brand
  if (slug[0] === "workspaces" && slug[2] === "brand") {
    const wsId = slug[1];
    const body = await req.json().catch(() => ({}));
    const existing = store.brandProfiles.get(wsId) || ({} as any);
    const updated = { ...existing, ...body, workspace_id: wsId };
    store.brandProfiles.set(wsId, updated);
    return NextResponse.json(updated);
  }

  return NextResponse.json({ detail: `Route PUT /api/v1/${path} not found` }, { status: 404 });
}

export async function PATCH(req: NextRequest, context: RouteContext) {
  const store = getStore();
  const { slug = [] } = await context.params;
  const path = slug.join("/");

  // Workspaces update: /workspaces/:id
  if (slug[0] === "workspaces" && slug.length === 2) {
    const ws = store.workspaces.get(slug[1]);
    if (!ws) return NextResponse.json({ detail: "Workspace not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    Object.assign(ws, body);
    return NextResponse.json(ws);
  }

  // Workspace member role: /workspaces/:id/members/:userId
  if (slug[0] === "workspaces" && slug[2] === "members" && slug.length === 4) {
    const wsId = slug[1];
    const userId = slug[3];
    const members = store.members.get(wsId) || [];
    const mem = members.find((m) => m.user_id === userId);
    if (!mem) return NextResponse.json({ detail: "Member not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    if (body.role) mem.role = body.role;
    return NextResponse.json(mem);
  }

  // Source update: /sources/:id
  if (slug[0] === "sources" && slug.length === 2) {
    const src = store.sources.get(slug[1]);
    if (!src) return NextResponse.json({ detail: "Source not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    Object.assign(src, body, { updated_at: new Date().toISOString() });

    if (body.create_version_snapshot) {
      const versions = store.sourceVersions.get(src.id) || [];
      const newVer = {
        id: `ver_${Date.now()}`,
        content_source_id: src.id,
        version_number: versions.length + 1,
        title: src.title,
        body: src.body,
        metadata_json: {},
        created_by: "usr_demo",
        created_at: new Date().toISOString(),
      };
      versions.unshift(newVer);
      store.sourceVersions.set(src.id, versions);
      src.version_count = versions.length;
    }

    return NextResponse.json(src);
  }

  // Variant update: /variants/:id
  if (slug[0] === "variants" && slug.length === 2) {
    const v = store.variants.get(slug[1]);
    if (!v) return NextResponse.json({ detail: "Variant not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    Object.assign(v, body, { updated_at: new Date().toISOString() });
    return NextResponse.json(v);
  }

  // Publishing job update: /publishing-jobs/:id
  if (slug[0] === "publishing-jobs" && slug.length === 2) {
    const job = store.publishingJobs.get(slug[1]);
    if (!job) return NextResponse.json({ detail: "Job not found" }, { status: 404 });
    const body = await req.json().catch(() => ({}));
    Object.assign(job, body, { updated_at: new Date().toISOString() });
    return NextResponse.json(job);
  }

  return NextResponse.json({ detail: `Route PATCH /api/v1/${path} not found` }, { status: 404 });
}

export async function DELETE(req: NextRequest, context: RouteContext) {
  const store = getStore();
  const { slug = [] } = await context.params;
  const path = slug.join("/");

  // Remove member: /workspaces/:id/members/:userId
  if (slug[0] === "workspaces" && slug[2] === "members" && slug.length === 4) {
    const wsId = slug[1];
    const userId = slug[3];
    const members = store.members.get(wsId) || [];
    store.members.set(wsId, members.filter((m) => m.user_id !== userId));
    return new NextResponse(null, { status: 204 });
  }

  // Delete knowledge doc: /workspaces/:id/brand/knowledge/:docId
  if (slug[0] === "workspaces" && slug[2] === "brand" && slug[3] === "knowledge" && slug.length === 5) {
    const wsId = slug[1];
    const docId = slug[4];
    const docs = store.knowledgeDocs.get(wsId) || [];
    store.knowledgeDocs.set(wsId, docs.filter((d) => d.id !== docId));
    return new NextResponse(null, { status: 204 });
  }

  // Delete media: /workspaces/:id/media/:assetId
  if (slug[0] === "workspaces" && slug[2] === "media" && slug.length === 4) {
    const wsId = slug[1];
    const assetId = slug[3];
    const assets = store.mediaAssets.get(wsId) || [];
    store.mediaAssets.set(wsId, assets.filter((a) => a.id !== assetId));
    return new NextResponse(null, { status: 204 });
  }

  // Delete source: /sources/:id
  if (slug[0] === "sources" && slug.length === 2) {
    store.sources.delete(slug[1]);
    return new NextResponse(null, { status: 204 });
  }

  // Delete connection: /workspaces/:id/connections/:connId
  if (slug[0] === "workspaces" && slug[2] === "connections" && slug.length === 4) {
    const wsId = slug[1];
    const connId = slug[3];
    const conns = store.connections.get(wsId) || [];
    store.connections.set(wsId, conns.filter((c) => c.id !== connId));
    return new NextResponse(null, { status: 204 });
  }

  return NextResponse.json({ detail: `Route DELETE /api/v1/${path} not found` }, { status: 404 });
}
