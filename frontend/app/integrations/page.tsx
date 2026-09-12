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

import {
  connectionsApi,
  publishingApi,
  ConnectedAccount,
  PublishedRecord,
  getActiveWorkspaceId,
} from "@/lib/api";

const PLATFORM_PRESETS = [
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: Globe,
    color: "text-blue-400 bg-blue-500/10 border-blue-500/30",
    formats: ["Text Post", "Single Image", "Document Carousel", "Article"],
    desc: "Target B2B decision makers and thought leadership essays. Client ID configured.",
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
    desc: "Visual storytelling & carousel guides. Manual Export & Creator Studio Mode active (no Client ID required).",
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

  const openConnectModal = (platformKey: string) => {
    setSelectedPlatform(platformKey);
    if (platformKey === "linkedin") {
      setAccountName("Acme LinkedIn Organization");
      setAccountId("li_client_acme_org");
      setMockToken("li_oauth_token_verified");
    } else if (platformKey === "instagram") {
      setAccountName("Instagram (Creator Studio Mode)");
      setAccountId("manual_creator_studio");
      setMockToken("manual_export_active");
    } else {
      setAccountName("");
      setAccountId("");
      setMockToken("");
    }
  };

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    if (wsId) {
      loadData(wsId);
    }
  }, []);

  const loadData = async (workspaceId: string) => {
    setLoading(true);
    try {
      const [connData, pubData] = await Promise.all([
        connectionsApi.list(workspaceId).catch(() => []),
        publishingApi.listPublished(workspaceId).catch(() => []),
      ]);

      setConnections(connData);
      setPublishedRecords(pubData);
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
      await connectionsApi.connect(activeWorkspaceId, {
        platform: selectedPlatform,
        account_name: accountName || `${selectedPlatform.toUpperCase()} Account`,
        external_account_id: accountId || `acc_${Date.now()}`,
        access_token: mockToken || `mock_access_token_${selectedPlatform}_${Date.now()}`,
        scopes: ["publish_posts", "read_profile", "read_insights"],
      });

      setSelectedPlatform(null);
      setAccountName("");
      setAccountId("");
      setMockToken("");
      loadData(activeWorkspaceId);
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
      // Disconnect active connection via centralized connections API
      await connectionsApi.disconnect(activeWorkspaceId, connectionId);
      loadData(activeWorkspaceId);
    } catch (e) {
      console.error("Failed to disconnect account", e);
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

          <div className="flex items-center gap-1.5 bg-[#0a0a0d] p-1.5 rounded-full border border-white/[0.08]">
            <button
              onClick={() => setActiveTab("platforms")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "platforms"
                  ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                  : "text-[#787672] hover:text-[#ede8df]"
              }`}
            >
              Connected Channels ({connections.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "history"
                  ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                  : "text-[#787672] hover:text-[#ede8df]"
              }`}
            >
              Published Dispatches ({publishedRecords.length})
            </button>
          </div>
        </div>

        {/* Channels Grid Tab */}
        {activeTab === "platforms" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {PLATFORM_PRESETS.map((preset) => {
              const Icon = preset.icon;
              const conn = connections.find((c) => c.platform === preset.key);
              const isConnected = !!conn;

              return (
                <div
                  key={preset.key}
                  className="hirael-card p-6 flex flex-col justify-between group"
                >
                  <div>
                    {/* Top Row */}
                    <div className="flex items-start justify-between gap-4 mb-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.08] text-[#ede8df]">
                          <Icon className="w-5 h-5 text-[#d4a373]" />
                        </div>
                        <div>
                          <h3 className="font-medium text-[#ede8df] text-base">{preset.name}</h3>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-mono px-2.5 py-0.5 rounded-full ${
                              isConnected
                                ? conn.status === "manual_export_only"
                                  ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                  : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                : "bg-white/[0.04] text-[#71717a] border border-white/[0.06]"
                            }`}
                          >
                            {isConnected ? (
                              conn.status === "manual_export_only" ? (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Manual Export (Active)
                                </>
                              ) : (
                                <>
                                  <CheckCircle2 className="w-3 h-3" /> Connected (OAuth)
                                </>
                              )
                            ) : (
                              "Not Connected"
                            )}
                          </span>
                        </div>
                      </div>
                    </div>

                    <p className="text-xs text-[#8a8a93] leading-relaxed mb-4">{preset.desc}</p>

                    {/* Supported Formats */}
                    <div className="mb-6">
                      <span className="text-[10px] font-mono text-[#787672] uppercase tracking-wider block mb-2">
                        Supported Formats
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {preset.formats.map((f) => (
                          <span
                            key={f}
                            className="px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06] text-[11px] text-[#a6a39b]"
                          >
                            {f}
                          </span>
                        ))}
                      </div>

                      {conn && conn.platform === "linkedin" && (
                        <div className="mt-3 p-3 rounded-2xl bg-white/[0.02] border border-white/[0.08] text-[11px]">
                          <span className="text-[#787672] block text-[10px] font-mono uppercase tracking-wider">Configured Client ID</span>
                          <span className="font-mono text-[#d4a373] font-medium truncate block select-all">
                            {conn.external_account_id}
                          </span>
                        </div>
                      )}

                      {conn && conn.platform === "instagram" && (
                        <div className="mt-3 p-3 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-[11px]">
                          <span className="text-amber-400 block text-[10px] font-mono uppercase tracking-wider">Export Protocol</span>
                          <span className="text-[#a6a39b] text-[11px] block mt-0.5">
                            Direct download & copy-ready for Instagram Creator Studio. No App Secret needed.
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Footer Actions */}
                  <div className="pt-4 border-t border-white/[0.06]">
                    {isConnected ? (
                      <div className="flex items-center justify-between">
                        <div className="text-xs">
                          <span className="text-[#787672] block text-[10px] font-mono">Account</span>
                          <span className="font-medium text-[#ede8df] truncate max-w-[140px] block">
                            {conn.account_name}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDisconnect(conn.id)}
                          className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-all flex items-center gap-1.5"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Disconnect
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => openConnectModal(preset.key)}
                        className="w-full py-2.5 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#ede8df] font-medium text-xs border border-white/[0.08] transition-all flex items-center justify-center gap-2"
                      >
                        <Plus className="w-3.5 h-3.5 text-[#d4a373]" /> Connect {preset.name}
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
          <div className="hirael-card p-6 sm:p-8">
            <h2 className="text-base font-normal text-[#ede8df] mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#d4a373]" />
              <span>Verified Published Dispatches</span>
            </h2>

            {publishedRecords.length === 0 ? (
              <div className="text-center py-16">
                <Share2 className="w-10 h-10 text-[#454340] mx-auto mb-3" />
                <h3 className="font-medium text-[#ede8df] text-sm">No dispatches published yet</h3>
                <p className="text-xs text-[#787672] mt-1 max-w-sm mx-auto">
                  Approved variants that get published immediately or via the scheduling queue will
                  appear here with verifiable external permalinks.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-white/[0.06]">
                {publishedRecords.map((rec) => (
                  <div key={rec.id} className="py-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 rounded-2xl bg-white/[0.04] text-[#d4a373] border border-white/[0.08] font-mono uppercase text-xs">
                        {rec.platform}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-[#ede8df] text-xs sm:text-sm">
                            Post ID: {rec.external_post_id}
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                            Live
                          </span>
                        </div>
                        <span className="text-[11px] text-[#787672] block mt-0.5 font-mono">
                          Published on {new Date(rec.published_at).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    <a
                      href={rec.external_url}
                      target="_blank"
                      rel="noreferrer"
                      className="px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.08] hover:border-white/20 text-[#ede8df] text-xs font-medium flex items-center gap-1.5 transition-all"
                    >
                      <span>View Live Post</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Connect Channel Modal */}
        {selectedPlatform && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="hirael-card p-6 max-w-md w-full shadow-2xl space-y-5">
              <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
                <h3 className="font-normal text-[#ede8df] text-lg flex items-center gap-2 capitalize">
                  <ShieldCheck className="w-5 h-5 text-[#d4a373]" />
                  Connect {selectedPlatform}
                </h3>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-[#ede8df] flex items-center justify-center text-xs"
                >
                  ✕
                </button>
              </div>

              {selectedPlatform === "linkedin" && (
                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-xs text-[#ede8df]">
                  <div className="font-medium flex items-center gap-1.5 mb-1 text-[#d4a373]">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>LinkedIn Client ID Preconfigured</span>
                  </div>
                  <p className="text-[11px] text-[#a6a39b]">
                    LinkedIn Client ID <code className="font-mono text-white bg-black/50 px-1 py-0.5 rounded">OAuth App</code> is provisioned and ready for OAuth authorization.
                  </p>
                </div>
              )}

              {selectedPlatform === "instagram" && (
                <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200">
                  <div className="font-medium flex items-center gap-1.5 mb-1 text-amber-300">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>Instagram Manual Export Mode</span>
                  </div>
                  <p className="text-[11px] text-[#a6a39b]">
                    No Instagram Client ID required. Lisa enables Creator Studio manual export mode to generate formatted carousel slides, reels scripts, and copy-ready captions.
                  </p>
                </div>
              )}

              <form onSubmit={handleConnect} className="space-y-4">
                <div>
                  <label className="block text-[11px] font-mono text-[#787672] mb-1">
                    Account Display Name / Handle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @acmecorp or Acme Official"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-[#ede8df] text-xs focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#787672] mb-1">
                    External Account / Page ID
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (auto-generated if empty)"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-[#ede8df] text-xs focus:outline-none focus:border-white/30"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-mono text-[#787672] mb-1">
                    OAuth Access Token / API Secret
                  </label>
                  <input
                    type="password"
                    placeholder="OAuth Bearer Token (Simulated for live demo)"
                    value={mockToken}
                    onChange={(e) => setMockToken(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-[#ede8df] text-xs focus:outline-none focus:border-white/30"
                  />
                  <span className="text-[10px] text-[#71717a] block mt-1 font-mono">
                    Credentials are saved with envelope encryption.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="px-4 py-2 rounded-full text-xs font-medium text-[#787672] hover:text-[#ede8df]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="hirael-pill-btn text-xs disabled:opacity-50"
                  >
                    <span>{isSubmitting ? "Connecting..." : "Confirm Connection"}</span>
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
