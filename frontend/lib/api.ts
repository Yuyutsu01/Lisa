/**
 * Lisa Central API Client
 * Connects Next.js frontend to FastAPI backend with JWT token authorization.
 */

// Resolve API Base URL supporting relative Next.js route, custom env vars, or server-side internal URL
export const resolveApiBaseUrl = (): string => {
  if (typeof window !== "undefined") {
    // In browser, prefer relative /api/v1 so Next.js catch-all route handles requests reliably
    const envUrl = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL;
    if (envUrl && envUrl.trim() !== "" && !envUrl.includes("localhost:8000")) {
      const raw = envUrl.trim().replace(/\/+$/, "");
      return raw.endsWith("/api/v1") ? raw : `${raw}/api/v1`;
    }
    return "/api/v1";
  }

  // Server-side
  let serverUrl = process.env.BACKEND_INTERNAL_URL || process.env.NEXT_PUBLIC_API_URL;
  if (serverUrl && serverUrl.trim() !== "" && !serverUrl.includes("localhost:8000")) {
    serverUrl = serverUrl.replace(/\/+$/, "");
    return serverUrl.endsWith("/api/v1") ? serverUrl : `${serverUrl}/api/v1`;
  }
  return "/api/v1";
};

export const API_BASE_URL = "/api/v1";

// --- Domain Interfaces ---

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

export interface QualityCheckItem {
  name: string;
  status: "pass" | "warning" | "fail";
  score: number;
  reason: string;
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
    writing_rules?: string[];
  };
  quality_review_json: {
    quality_score?: number;
    checks?: Record<string, string>;
    check_items?: QualityCheckItem[];
    issues?: { severity: string; message: string }[];
    improvement_suggestions?: string[];
    needs_regeneration?: boolean;
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

export interface PlatformMetricSummary {
  platform: string;
  total_posts: number;
  impressions: number;
  engagements: number;
  avg_engagement_rate: number;
}

export interface TopPostSummary {
  published_record_id: string;
  platform: string;
  title?: string;
  external_url: string;
  impressions: number;
  engagements: number;
  engagement_rate: number;
  published_at: string;
}

export interface AnalyticsOverview {
  total_impressions: number;
  total_reach: number;
  total_engagements: number;
  avg_engagement_rate: number;
  total_posts_published: number;
  platform_breakdown: PlatformMetricSummary[];
  top_performing_posts: TopPostSummary[];
  open_opportunities_count: number;
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

export interface SystemHealth {
  status: string;
  database: string;
  agents: Record<string, string>;
  supported_platform_adapters: Record<string, any>;
}

// --- Token & Workspace Storage Helpers ---

export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return (
      localStorage.getItem("lisa_access_token") ||
      localStorage.getItem("lisa_token")
    );
  }
  return null;
};

export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("lisa_access_token", token);
    localStorage.setItem("lisa_token", token);
  }
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("lisa_access_token");
    localStorage.removeItem("lisa_token");
    localStorage.removeItem("lisa_active_workspace_id");
  }
};

export const getActiveWorkspaceId = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lisa_active_workspace_id");
  }
  return null;
};

export const setActiveWorkspaceId = (workspaceId: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("lisa_active_workspace_id", workspaceId);
  }
};

// Generic API Request Dispatcher with timeout & cold-start retry
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retries: number = 1
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const baseUrl = resolveApiBaseUrl();
  const url = `${baseUrl}${endpoint}`;
  const timeoutMs = endpoint.includes("/generate") ? 75000 : 30000;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: options.signal || controller.signal,
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      if ((response.status === 502 || response.status === 503 || response.status === 504) && retries > 0) {
        // Cold start waking up on Render - wait 2 seconds and retry once
        await new Promise((res) => setTimeout(res, 2000));
        return apiRequest<T>(endpoint, options, retries - 1);
      }

      const errorData = await response.json().catch(() => ({}));
      const message =
        errorData.detail ||
        errorData.error_message ||
        `Request to ${endpoint} failed with status ${response.status}`;
      throw new Error(message);
    }

    if (response.status === 204) {
      return {} as T;
    }

    return response.json();
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === "AbortError") {
      throw new Error(`Request to ${endpoint} timed out after ${timeoutMs / 1000}s. Service may be waking up.`);
    }

    // If fetch failed on an absolute custom URL, fallback to internal Next.js /api/v1 handler
    if (url.startsWith("http") && retries > 0) {
      try {
        const fallbackRes = await fetch(`/api/v1${endpoint}`, {
          ...options,
          headers,
        });
        if (fallbackRes.ok) {
          if (fallbackRes.status === 204) return {} as T;
          return fallbackRes.json();
        }
      } catch {
        // Continue to retry or throw
      }
    }

    if (retries > 0 && err.message?.includes("Failed to fetch")) {
      // Possible cold start initial connection drop - retry once after 2s
      await new Promise((res) => setTimeout(res, 2000));
      return apiRequest<T>(endpoint, options, retries - 1);
    }
    throw err;
  }
}

// --- Auth API ---
export const authApi = {
  register: (data: { email: string; name: string; password: string }) =>
    apiRequest<{ user: User; workspace_id: string; token: { access_token: string } }>(
      "/auth/register",
      { method: "POST", body: JSON.stringify(data) }
    ),
  login: (data: { email: string; password: string }) =>
    apiRequest<{ access_token: string }>("/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  getMe: () => apiRequest<User>("/auth/me"),
};

// --- Workspaces API ---
export const workspacesApi = {
  list: () => apiRequest<Workspace[]>("/workspaces"),
  create: (data: { name: string; slug?: string }) =>
    apiRequest<Workspace>("/workspaces", {
      method: "POST",
      body: JSON.stringify(data),
    }),
  get: (workspaceId: string) => apiRequest<Workspace>(`/workspaces/${workspaceId}`),
  update: (workspaceId: string, data: Partial<Workspace>) =>
    apiRequest<Workspace>(`/workspaces/${workspaceId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  listMembers: (workspaceId: string) =>
    apiRequest<WorkspaceMember[]>(`/workspaces/${workspaceId}/members`),
  inviteMember: (workspaceId: string, data: { email: string; role: string }) =>
    apiRequest<WorkspaceMember>(`/workspaces/${workspaceId}/members`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  updateMemberRole: (workspaceId: string, userId: string, role: string) =>
    apiRequest<WorkspaceMember>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "PATCH",
      body: JSON.stringify({ role }),
    }),
  removeMember: (workspaceId: string, userId: string) =>
    apiRequest<void>(`/workspaces/${workspaceId}/members/${userId}`, {
      method: "DELETE",
    }),
};

// --- Brand Intelligence API ---
export const brandApi = {
  getProfile: (workspaceId: string) =>
    apiRequest<BrandProfile>(`/workspaces/${workspaceId}/brand`),
  updateProfile: (workspaceId: string, data: Partial<BrandProfile>) =>
    apiRequest<BrandProfile>(`/workspaces/${workspaceId}/brand`, {
      method: "PUT",
      body: JSON.stringify(data),
    }),
  listKnowledgeDocs: (workspaceId: string) =>
    apiRequest<BrandKnowledgeDoc[]>(`/workspaces/${workspaceId}/brand/knowledge`),
  createKnowledgeDoc: (
    workspaceId: string,
    data: { title: string; source_type: string; content: string; metadata_json?: Record<string, any> }
  ) =>
    apiRequest<BrandKnowledgeDoc>(`/workspaces/${workspaceId}/brand/knowledge`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  deleteKnowledgeDoc: (workspaceId: string, docId: string) =>
    apiRequest<void>(`/workspaces/${workspaceId}/brand/knowledge/${docId}`, {
      method: "DELETE",
    }),
};

// --- Media Assets API ---
export const mediaApi = {
  upload: async (workspaceId: string, file: File): Promise<MediaAsset> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const baseUrl = resolveApiBaseUrl();
    const response = await fetch(`${baseUrl}/workspaces/${workspaceId}/media/upload`, {
      method: "POST",
      headers,
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || "File upload failed");
    }

    return response.json();
  },
  list: (workspaceId: string) =>
    apiRequest<MediaAsset[]>(`/workspaces/${workspaceId}/media`),
  delete: (workspaceId: string, assetId: string) =>
    apiRequest<void>(`/workspaces/${workspaceId}/media/${assetId}`, {
      method: "DELETE",
    }),
  generateDerivatives: (assetId: string, presets?: string[]) =>
    apiRequest<MediaDerivative[]>(`/media/${assetId}/derivatives`, {
      method: "POST",
      body: JSON.stringify({ presets }),
    }),
  listDerivatives: (assetId: string) =>
    apiRequest<MediaDerivative[]>(`/media/${assetId}/derivatives`),
};

// --- Content Sources API ---
export const sourcesApi = {
  create: (workspaceId: string, data: Partial<ContentSource> & { asset_ids?: string[] }) =>
    apiRequest<ContentSource>(`/workspaces/${workspaceId}/sources`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  list: (workspaceId: string, params?: { status?: string; pillar?: string }) => {
    const query = new URLSearchParams();
    if (params?.status) query.append("status", params.status);
    if (params?.pillar) query.append("pillar", params.pillar);
    const qs = query.toString() ? `?${query.toString()}` : "";
    return apiRequest<ContentSource[]>(`/workspaces/${workspaceId}/sources${qs}`);
  },
  get: (sourceId: string) => apiRequest<ContentSource>(`/sources/${sourceId}`),
  update: (sourceId: string, data: Partial<ContentSource> & { create_version_snapshot?: boolean }) =>
    apiRequest<ContentSource>(`/sources/${sourceId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  listVersions: (sourceId: string) =>
    apiRequest<ContentSourceVersion[]>(`/sources/${sourceId}/versions`),
  restoreVersion: (sourceId: string, versionId: string) =>
    apiRequest<ContentSource>(`/sources/${sourceId}/versions/${versionId}/restore`, {
      method: "POST",
    }),
  delete: (sourceId: string) =>
    apiRequest<void>(`/sources/${sourceId}`, {
      method: "DELETE",
    }),
  generateVariants: (sourceId: string, data?: { platforms?: string[]; custom_instruction?: string }) =>
    apiRequest<{
      workflow_id: string;
      content_source_id: string;
      variants_count: number;
      variants: ContentVariant[];
    }>(`/sources/${sourceId}/generate`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
  listVariants: (sourceId: string) =>
    apiRequest<ContentVariant[]>(`/sources/${sourceId}/variants`),
};

// --- Variants API ---
export const variantsApi = {
  get: (variantId: string) => apiRequest<ContentVariant>(`/variants/${variantId}`),
  update: (variantId: string, data: Partial<ContentVariant>) =>
    apiRequest<ContentVariant>(`/variants/${variantId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  regenerate: (variantId: string, data?: { instruction?: string }) =>
    apiRequest<ContentVariant>(`/variants/${variantId}/regenerate`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
  approve: (variantId: string) =>
    apiRequest<ContentVariant>(`/variants/${variantId}/approve`, {
      method: "POST",
    }),
  reject: (variantId: string, reason?: string) =>
    apiRequest<ContentVariant>(`/variants/${variantId}/reject`, {
      method: "POST",
      body: JSON.stringify({ rejection_reason: reason }),
    }),
  schedule: (variantId: string, data: { scheduled_at: string; timezone?: string; connected_account_id?: string }) =>
    apiRequest<PublishingJob>(`/variants/${variantId}/schedule`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
};

// --- Calendar & Publishing Jobs API ---
export const calendarApi = {
  getEvents: (workspaceId: string) =>
    apiRequest<CalendarEvent[]>(`/workspaces/${workspaceId}/calendar`),
  rescheduleJob: (jobId: string, data: { scheduled_at: string; timezone?: string }) =>
    apiRequest<PublishingJob>(`/publishing-jobs/${jobId}`, {
      method: "PATCH",
      body: JSON.stringify(data),
    }),
  cancelJob: (jobId: string) =>
    apiRequest<PublishingJob>(`/publishing-jobs/${jobId}/cancel`, {
      method: "POST",
    }),
};

// --- Connections (Platform Integrations) API ---
export const connectionsApi = {
  list: (workspaceId: string) =>
    apiRequest<ConnectedAccount[]>(`/workspaces/${workspaceId}/connections`),
  connect: (
    workspaceId: string,
    data: {
      platform: string;
      account_name: string;
      external_account_id: string;
      access_token: string;
      refresh_token?: string;
      scopes?: string[];
      metadata?: Record<string, any>;
    }
  ) =>
    apiRequest<ConnectedAccount>(`/workspaces/${workspaceId}/connections`, {
      method: "POST",
      body: JSON.stringify(data),
    }),
  disconnect: (workspaceId: string, connectionId: string) =>
    apiRequest<void>(`/workspaces/${workspaceId}/connections/${connectionId}`, {
      method: "DELETE",
    }),
};

// --- Publishing History & Live Dispatch API ---
export const publishingApi = {
  publishVariant: (
    workspaceId: string,
    variantId: string,
    data?: { connected_account_id?: string }
  ) =>
    apiRequest<{
      success: boolean;
      status?: string;
      publishing_mode?: string;
      external_post_id?: string;
      external_url?: string;
      error_message?: string;
      raw_response?: Record<string, any>;
    }>(`/workspaces/${workspaceId}/variants/${variantId}/publish`, {
      method: "POST",
      body: JSON.stringify(data || {}),
    }),
  listPublished: (workspaceId: string) =>
    apiRequest<PublishedRecord[]>(`/workspaces/${workspaceId}/published`),
};

// --- Analytics & Opportunity Loop API ---
export const analyticsApi = {
  getOverview: (workspaceId: string) =>
    apiRequest<AnalyticsOverview>(`/workspaces/${workspaceId}/analytics/overview`),
  getOpportunities: (workspaceId: string) =>
    apiRequest<ContentOpportunity[]>(`/workspaces/${workspaceId}/analytics/opportunities`),
  actionOpportunity: (workspaceId: string, opportunityId: string) =>
    apiRequest<{ success: boolean; content_source_id: string }>(
      `/workspaces/${workspaceId}/analytics/opportunities/${opportunityId}/action`,
      { method: "POST" }
    ),
  runAnalytics: (workspaceId: string) =>
    apiRequest<{ status: string; opportunities_generated: number }>(
      `/workspaces/${workspaceId}/analytics/run`,
      { method: "POST" }
    ),
};

// --- Audit & System Operations API ---
export const operationsApi = {
  listAuditLogs: (workspaceId: string, limit: number = 50) =>
    apiRequest<AuditLog[]>(`/workspaces/${workspaceId}/audit-logs?limit=${limit}`),
  listAgentRuns: (workspaceId: string, limit: number = 50) =>
    apiRequest<AgentRun[]>(`/workspaces/${workspaceId}/agent-runs?limit=${limit}`),
  getSystemHealth: (workspaceId: string) =>
    apiRequest<SystemHealth>(`/workspaces/${workspaceId}/system-health`),
};
