"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
  RefreshCw,
  Video,
  Mail,
  FileText,
  Radio,
  Clock,
  Globe,
  Camera,
  MessageSquare,
  Tv,
} from "lucide-react";

interface ConnectedAccount {
  id: string;
  workspace_id: string;
  platform: string;
  external_account_id: string;
  account_name: string;
  status: string;
  scopes_json: string[];
  created_at: string;
}

interface PublishedRecord {
  id: string;
  workspace_id: string;
  content_variant_id: string;
  platform: string;
  external_post_id: string;
  external_url: string;
  published_at: string;
  metadata_json: Record<string, any>;
}

const PLATFORM_PRESETS = [
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: Globe,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    formats: ["Text Post", "Single Image", "Document Carousel", "Article"],
    desc: "Target B2B professionals, thought leadership essays, and company page posts.",
  },
  {
    key: "x",
    name: "X (Twitter)",
    icon: MessageSquare,
    color: "text-slate-200 bg-slate-500/10 border-slate-500/30",
    formats: ["Single Tweet", "Multi-Tweet Thread", "280-char Hook"],
    desc: "Short-form punchy takes, insights threads, and high-frequency engagement.",
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: Camera,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/30",
    formats: ["Square Feed (1:1)", "Portrait (4:5)", "Reels (9:16)", "Carousel"],
    desc: "Visual storytelling, aesthetic media hooks, and swipeable multi-slide posts.",
  },
  {
    key: "youtube",
    name: "YouTube",
    icon: Tv,
    color: "text-red-400 bg-red-500/10 border-red-500/30",
    formats: ["Shorts (9:16)", "Community Post", "Long-form Video (16:9)"],
    desc: "Publish Shorts, community updates, and video descriptions with timestamps.",
  },
  {
    key: "tiktok",
    name: "TikTok",
    icon: Video,
    color: "text-teal-400 bg-teal-500/10 border-teal-500/30",
    formats: ["Vertical Video (9:16)", "Caption & Sound Hooks"],
    desc: "Rapid hook retention, viral scripts, and trending hashtag distribution.",
  },
  {
    key: "threads",
    name: "Threads",
    icon: Radio,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/30",
    formats: ["Conversational Post", "Micro-Blog"],
    desc: "Meta's text network for open conversations and community discussion.",
  },
  {
    key: "email",
    name: "Email & Newsletter",
    icon: Mail,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/30",
    formats: ["Substack", "Beehiiv", "HTML Email", "Plain Text"],
    desc: "Direct-to-inbox long-form breakdowns, weekly recaps, and subscriber dispatches.",
  },
  {
    key: "blog",
    name: "Blog / CMS",
    icon: FileText,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    formats: ["Markdown", "WordPress", "Ghost", "Medium"],
    desc: "Canonical SEO articles, full deep-dive guides, and developer notes.",
  },
];

export default function IntegrationsPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [publishedRecords, setPublishedRecords] = useState<PublishedRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"platforms" | "history">("platforms");

  // Connect Modal State
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [mockToken, setMockToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    loadData(activeWorkspaceId);
  }, [activeWorkspaceId]);

  const loadData = async (workspaceId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("lisa_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [connRes, pubRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/workspaces/${workspaceId}/connections`, { headers }),
        fetch(`http://localhost:8000/api/v1/workspaces/${workspaceId}/published`, { headers }),
      ]);

      if (connRes.ok) setConnections(await connRes.json());
      if (pubRes.ok) setPublishedRecords(await pubRes.json());
    } catch (e) {
      console.error("Failed to load integrations data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !selectedPlatform) return;

    setIsSubmitting(true);
    try {
      const token = localStorage.getItem("lisa_token");
      const res = await fetch(
        `http://localhost:8000/api/v1/workspaces/${activeWorkspaceId}/connections`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            platform: selectedPlatform,
            account_name: accountName || `${selectedPlatform.toUpperCase()} Account`,
            external_account_id: accountId || `acc_${Date.now()}`,
            access_token: mockToken || `mock_access_token_${selectedPlatform}_${Date.now()}`,
            scopes: ["publish_posts", "read_profile", "read_insights"],
          }),
        }
      );

      if (res.ok) {
        setSelectedPlatform(null);
        setAccountName("");
        setAccountId("");
        setMockToken("");
        loadData(activeWorkspaceId);
      }
    } catch (e) {
      console.error("Failed to connect account", e);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!activeWorkspaceId) return;
    if (!confirm("Are you sure you want to disconnect this platform account?")) return;

    try {
      const token = localStorage.getItem("lisa_token");
      const res = await fetch(
        `http://localhost:8000/api/v1/workspaces/${activeWorkspaceId}/connections/${connectionId}`,
        {
          method: "DELETE",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (res.ok) {
        loadData(activeWorkspaceId);
      }
    } catch (e) {
      console.error("Failed to disconnect", e);
    }
  };

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Banner */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-1">
              <Share2 className="w-3.5 h-3.5" />
              <span>Omnichannel Distribution Hub</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">
              Platform Integrations & Publishing History
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Connect target channels with OAuth credentials. Lisa orchestrates media formatting,
              character limits, and authentic API dispatch per network.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 shrink-0">
            <button
              onClick={() => setActiveTab("platforms")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "platforms"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Connected Channels ({connections.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                activeTab === "history"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Published Posts ({publishedRecords.length})
            </button>
          </div>
        </div>

        {/* Channels Grid Tab */}
        {activeTab === "platforms" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const conn = connections.find((c) => c.platform === preset.key);
              const isConnected = !!conn;

              return (
                <div
                  key={preset.key}
                  className="rounded-3xl glass-card border border-slate-800/80 p-6 flex flex-col justify-between hover:border-slate-700/80 transition-all group"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-2xl border ${preset.color}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <h3 className="font-bold text-slate-100 text-base">{preset.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              isConnected
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {isConnected ? (
                              <>
                                <CheckCircle2 className="w-3 h-3" /> Connected
                              </>
                            ) : (
                              "Not Connected"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{preset.desc}</p>

                    {/* Supported Formats */}
                    <div className="mb-6">
                      <span className="text-[11px] font-mono text-slate-500 uppercase tracking-wider block mb-2">
                        Supported Formats
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {preset.formats.map((f) => (
                          <span
                            key={f}
                            className="px-2 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[11px] text-slate-300 font-medium"
                          >
                            {f}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-slate-800/80">
                    {isConnected ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-slate-500 block text-[10px]">Account</span>
                          <span className="font-semibold text-slate-200 truncate max-w-[140px] block">
                            {conn.account_name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDisconnect(conn.id)}
                          className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium border border-red-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setSelectedPlatform(preset.key)}
                        className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5" /> Connect {preset.name}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Publishing History Tab */}
        {activeTab === "history" && (
          <div className="rounded-3xl glass-card border border-slate-800 p-6">
            <h2 className="text-lg font-bold text-slate-100 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-400" />
              Verified Published Records
            </h2>

            {publishedRecords.length === 0 ? (
              <div className="text-center py-16">
                <Share2 className="w-12 h-12 text-slate-600 mx-auto mb-3 opacity-50" />
                <h3 className="font-semibold text-slate-300 text-base">No posts published yet</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                  Approved variants that get published immediately or via the scheduling queue will
                  appear here with verifiable external permalinks.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-slate-800">
                {publishedRecords.map((rec) => (
                  <div key={rec.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-bold uppercase text-xs">
                        {rec.platform}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-200 text-sm">
                            Post ID: {rec.external_post_id}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium">
                            Live
                          </span>
                        </div>
                        <span className="text-xs text-slate-500 block mt-0.5">
                          Published on {new Date(rec.published_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <a
                      href={rec.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-indigo-400 hover:text-indigo-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
                    >
                      <span>View Live Post</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connect Channel Modal */}
        {selectedPlatform && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <h3 className="font-bold text-slate-100 text-lg flex items-center gap-2 capitalize">
                  <ShieldCheck className="w-5 h-5 text-indigo-400" />
                  Connect {selectedPlatform}
                </h3>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Account Display Name / Handle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @acmecorp or Acme Official"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    External Account / Page ID
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (auto-generated if empty)"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    OAuth Access Token / API Secret
                  </label>
                  <input
                    type="password"
                    placeholder="OAuth Bearer Token (Simulated for live demo)"
                    value={mockToken}
                    onChange={(e) => setMockToken(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-100 text-sm focus:outline-none focus:border-indigo-500"
                  />
                  <span className="text-[11px] text-slate-500 block mt-1">
                    Credentials are stored with envelope encryption.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all disabled:opacity-50"
                  >
                    {isSubmitting ? "Connecting..." : "Confirm Connection"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
