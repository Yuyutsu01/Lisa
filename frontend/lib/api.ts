/**
 * Lisa API Client
 * Connects Next.js frontend to FastAPI backend.
 */

// Resolve API Base URL supporting NEXT_PUBLIC_API_URL or NEXT_PUBLIC_API_BASE_URL
const resolveApiBaseUrl = (): string => {
  let rawUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    "http://localhost:8000/api/v1";

  // Remove trailing slashes
  rawUrl = rawUrl.replace(/\/+$/, "");

  // Auto-append /api/v1 if root domain was provided
  if (!rawUrl.endsWith("/api/v1")) {
    rawUrl = `${rawUrl}/api/v1`;
  }
  return rawUrl;
};

const API_BASE_URL = resolveApiBaseUrl();


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
  status: "draft" | "needs_review" | "approved" | "scheduled" | "publishing" | "published" | "rejected";
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
  status: "draft" | "approved" | "scheduled" | "queued" | "publishing" | "published" | "failed" | "cancelled";
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
  status: "draft" | "approved" | "scheduled" | "queued" | "publishing" | "published" | "failed" | "cancelled";
}

// Token storage helper
export const getToken = (): string | null => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("lisa_access_token");
  }
  return null;
};

export const setToken = (token: string) => {
  if (typeof window !== "undefined") {
    localStorage.setItem("lisa_access_token", token);
  }
};

export const removeToken = () => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("lisa_access_token");
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

async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    const message = errorData.detail || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

// Auth API
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

// Workspaces API
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

// Brand Intelligence API
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

// Media API
export const mediaApi = {
  upload: async (workspaceId: string, file: File): Promise<MediaAsset> => {
    const token = getToken();
    const formData = new FormData();
    formData.append("file", file);

    const headers: Record<string, string> = {};
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}/workspaces/${workspaceId}/media/upload`, {
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

// Content Sources & Variants API
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

// Variants API
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

// Calendar & Publishing Jobs API
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
