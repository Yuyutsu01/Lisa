"use client";

import { useCallback, useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Share2,
  CheckCircle2,
  AlertCircle,
  Plus,
  Trash2,
  ExternalLink,
  ShieldCheck,
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
  linkedinOAuthApi,
  publishingApi,
  ConnectedAccount,
  PublishedRecord,
  getActiveWorkspaceId,
} from "@/lib/api";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";

const PLATFORM_PRESETS = [
  {
    key: "linkedin",
    name: "LinkedIn",
    icon: Globe,
    color: "text-[#ede8df] bg-white/[0.04] border-white/[0.08]",
    formats: ["Text Post", "Single Image", "Document Carousel", "Article"],
    desc: "Target B2B decision makers and thought leadership essays. Client ID configured.",
  },
  {
    key: "x",
    name: "X (Twitter)",
    icon: MessageSquare,
    color: "text-[#a6a39b] bg-white/[0.03] border-white/[0.06]",
    formats: ["Single Tweet", "Multi-Tweet Thread", "280-char Hook"],
    desc: "Short-form punchy takes, insights threads, and high-frequency engagement.",
  },
  {
    key: "instagram",
    name: "Instagram",
    icon: Camera,
    color: "text-pink-400 bg-pink-500/10 border-pink-500/20",
    formats: ["Square Feed (1:1)", "Portrait (4:5)", "Reels (9:16)", "Carousel"],
    desc: "Visual storytelling & carousel guides. Manual Export & Creator Studio Mode active (no Client ID required).",
  },
  {
    key: "discord",
    name: "Discord Community",
    icon: MessageSquare,
    color: "text-indigo-400 bg-indigo-500/10 border-indigo-500/20",
    formats: ["Community Announcement", "Developer Forum Post", "Channel Thread"],
    desc: "Webhook & Bot integration for instant broadcast and community discussion prompts.",
  },
  {
    key: "threads",
    name: "Threads",
    icon: Radio,
    color: "text-[#ede8df] bg-white/[0.04] border-white/[0.08]",
    formats: ["Conversational Post", "Micro-Blog"],
    desc: "Meta's text network for open conversations and community discussion.",
  },
  {
    key: "email",
    name: "Email & Newsletter",
    icon: Mail,
    color: "text-amber-400 bg-amber-500/10 border-amber-500/20",
    formats: ["Substack", "Beehiiv", "HTML Email", "Plain Text"],
    desc: "Direct-to-inbox long-form breakdowns, weekly recaps, and subscriber dispatches.",
  },
  {
    key: "blog",
    name: "Blog / CMS",
    icon: FileText,
    color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
    formats: ["Markdown", "WordPress", "Ghost", "Medium"],
    desc: "Canonical SEO articles, full deep-dive guides, and developer notes.",
  },
];

export default function IntegrationsPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [connections, setConnections] = useState<ConnectedAccount[]>([]);
  const [publishedRecords, setPublishedRecords] = useState<PublishedRecord[]>([]);
  const [activeTab, setActiveTab] = useState<"platforms" | "history">("platforms");

  // Connect Modal State
  const [selectedPlatform, setSelectedPlatform] = useState<string | null>(null);
  const [accountName, setAccountName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [mockToken, setMockToken] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LinkedIn OAuth State
  const [oauthLoading, setOauthLoading] = useState(false);
  const [oauthError, setOauthError] = useState<string | null>(null);

  const openConnectModal = async (platformKey: string) => {
    // LinkedIn uses real OAuth 2.0 — redirect to LinkedIn authorization
    if (platformKey === "linkedin" && activeWorkspaceId) {
      setOauthLoading(true);
      setOauthError(null);
      try {
        const data = await linkedinOAuthApi.startOAuth(activeWorkspaceId);
        if (data.authorization_url) {
          // Redirect browser to LinkedIn's consent screen
          window.location.href = data.authorization_url;
          return;
        }
        setOauthError("Backend did not return an authorization URL.");
      } catch (err: any) {
        console.error("Failed to start LinkedIn OAuth", err);
        setOauthError(
          err.message || "Failed to start LinkedIn authorization. Check backend configuration."
        );
      } finally {
        setOauthLoading(false);
      }
      return;
    }

    // Other platforms use the manual connection form
    setSelectedPlatform(platformKey);
    if (platformKey === "instagram") {
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

  // Handle LinkedIn OAuth callback redirect
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const linkedinStatus = params.get("linkedin");

    if (linkedinStatus === "connected") {
      // OAuth succeeded — refresh connections list
      if (activeWorkspaceId) {
        loadData(activeWorkspaceId);
      }
      // Clean the URL so refresh doesn't re-trigger
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (linkedinStatus === "error") {
      const message = params.get("message") || "LinkedIn authorization failed.";
      setOauthError(message);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [activeWorkspaceId]);

  const loadData = async (workspaceId: string) => {
    try {
      const [connData, pubData] = await Promise.all([
        connectionsApi.list(workspaceId).catch(() => []),
        publishingApi.listPublished(workspaceId).catch(() => []),
      ]);

      setConnections(connData);
      setPublishedRecords(pubData);
    } catch (e) {
      console.error("Failed to load integrations data", e);
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
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pb-6 border-b border-white/[0.08]">
          <div>
            <div className="flex items-center gap-2.5 text-[11px] sm:text-xs lg:text-[13px] font-mono uppercase tracking-widest text-[#85827b] mb-1.5">
              <Share2 className="w-4 h-4 text-[#d4a373]" />
              <span>Omnichannel Distribution Hub</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#ede8df]">
              Platform Integrations &amp; Publishing History
            </h1>
            <p className="text-xs sm:text-sm lg:text-[15px] xl:text-[15.5px] text-[#8a8a93] mt-2 max-w-3xl leading-relaxed">
              Connect target channels with OAuth credentials. Lisa orchestrates media formatting,
              character limits, and authentic API dispatch per network.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-[#0a0a0d] p-1.5 rounded-full border border-white/[0.08] shrink-0">
            <button
              onClick={() => setActiveTab("platforms")}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === "platforms"
                  ? "bg-[#ede8df] text-[#09090b] shadow-sm font-semibold"
                  : "text-[#85827b] hover:text-[#ede8df]"
              }`}
            >
              Connected Channels ({connections.length})
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-medium transition-all ${
                activeTab === "history"
                  ? "bg-[#ede8df] text-[#09090b] shadow-sm font-semibold"
                  : "text-[#85827b] hover:text-[#ede8df]"
              }`}
            >
              Published Dispatches ({publishedRecords.length})
            </button>
          </div>
        </div>

        {/* LinkedIn OAuth Status Messages */}
        {oauthLoading && (
          <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-sm text-blue-200 flex items-center gap-3">
            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span>Redirecting to LinkedIn for authorization…</span>
          </div>
        )}
        {oauthError && (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-sm text-rose-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
              <span>{oauthError}</span>
            </div>
            <button
              onClick={() => setOauthError(null)}
              className="px-3 py-1 rounded-full text-xs font-medium bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors shrink-0"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Channels Grid Tab */}
        {activeTab === "platforms" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {PLATFORM_PRESETS.map((preset, index) => {
              const Icon = preset.icon;
              const conn = connections.find((c) => c.platform === preset.key);
              const isConnected = !!conn;

              return (
                <ScrollReveal key={preset.key} delay={index * 30}>
                  <div className="hirael-card p-6 sm:p-7 rounded-2xl sm:rounded-3xl flex flex-col justify-between group h-full space-y-6">
                    <div>
                      {/* Top Row */}
                      <div className="flex items-start justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3.5">
                          <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/[0.08] text-[#ede8df]">
                            <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-[#d4a373]" />
                          </div>
                          <div>
                            <h3 className="font-medium text-[#ede8df] text-base sm:text-lg">{preset.name}</h3>
                            <span
                              className={`inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-0.5 rounded-full mt-1 ${
                                isConnected
                                  ? conn.status === "manual_export_only"
                                    ? "bg-amber-500/10 text-amber-300 border border-amber-500/20"
                                    : "bg-emerald-500/10 text-emerald-300 border border-emerald-500/20"
                                  : "bg-white/[0.03] text-[#71717a] border border-white/[0.06]"
                              }`}
                            >
                              {isConnected ? (
                                conn.status === "manual_export_only" ? (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Manual Export (Active)
                                  </>
                                ) : (
                                  <>
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Connected (OAuth)
                                  </>
                                )
                              ) : (
                                "Not Connected"
                              )}
                            </span>
                          </div>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-[#8a8a93] leading-relaxed mb-5">{preset.desc}</p>

                      {/* Supported Formats */}
                      <div className="space-y-3">
                        <span className="text-[11px] sm:text-xs font-mono text-[#85827b] uppercase tracking-wider block">
                          Supported Formats
                        </span>
                        <div className="flex flex-wrap gap-2">
                          {preset.formats.map((f) => (
                            <span
                              key={f}
                              className="px-3 py-1 rounded-full bg-white/[0.02] border border-white/[0.06] text-xs text-[#a6a39b]"
                            >
                              {f}
                            </span>
                          ))}
                        </div>

                        {conn && conn.platform === "linkedin" && (
                          <div className="mt-3.5 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] text-xs">
                            <span className="text-[#85827b] block text-[11px] font-mono uppercase tracking-wider">Configured Client ID</span>
                            <span className="font-mono text-[#d4a373] font-medium truncate block select-all mt-0.5">
                              {conn.external_account_id}
                            </span>
                          </div>
                        )}

                        {conn && conn.platform === "instagram" && (
                          <div className="mt-3.5 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs">
                            <span className="text-amber-400 block text-[11px] font-mono uppercase tracking-wider">Export Protocol</span>
                            <span className="text-[#8a8a93] text-xs block mt-1 leading-relaxed">
                              Direct download &amp; copy-ready for Instagram Creator Studio. No App Secret needed.
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="pt-4 border-t border-white/[0.06]">
                      {isConnected ? (
                        <div className="flex items-center justify-between">
                          <div className="text-xs sm:text-sm">
                            <span className="text-[#85827b] block text-[11px] font-mono">Account</span>
                            <span className="font-medium text-[#ede8df] truncate max-w-[160px] block">
                              {conn.account_name}
                            </span>
                          </div>
                          <button
                            onClick={() => handleDisconnect(conn.id)}
                            className="px-3.5 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-medium border border-rose-500/20 transition-all flex items-center gap-1.5"
                          >
                            <Trash2 className="w-3.5 h-3.5" /> Disconnect
                          </button>
                        </div>
                      ) : (
                        <InteractiveButton
                          onClick={() => openConnectModal(preset.key)}
                          variant="secondary"
                          size="md"
                          magnetic
                          leftIcon={<Plus className="w-4 h-4 text-[#d4a373]" />}
                          className="w-full py-2.5 sm:py-3 text-xs sm:text-sm justify-center font-medium"
                        >
                          Connect {preset.name}
                        </InteractiveButton>
                      )}
                    </div>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        )}

        {/* Publishing History Tab */}
        {activeTab === "history" && (
          <ScrollReveal delay={0}>
            <div className="hirael-card p-6 sm:p-8 rounded-2xl sm:rounded-3xl">
              <h2 className="text-base sm:text-lg font-medium text-[#ede8df] mb-6 flex items-center gap-2.5">
                <Clock className="w-5 h-5 text-[#d4a373]" />
                <span>Verified Published Dispatches</span>
              </h2>

              {publishedRecords.length === 0 ? (
                <div className="text-center py-20">
                  <Share2 className="w-12 h-12 text-[#454340] mx-auto mb-4" />
                  <h3 className="font-medium text-[#ede8df] text-base sm:text-lg">No dispatches published yet</h3>
                  <p className="text-xs sm:text-sm text-[#8a8a93] mt-2 max-w-md mx-auto leading-relaxed">
                    Approved variants that get published immediately or via the scheduling queue will
                    appear here with verifiable external permalinks.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-white/[0.06]">
                  {publishedRecords.map((rec) => (
                    <div key={rec.id} className="py-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <div className="p-3 rounded-2xl bg-white/[0.03] text-[#d4a373] border border-white/[0.08] font-mono uppercase text-xs sm:text-sm font-semibold">
                          {rec.platform}
                        </div>
                        <div>
                          <div className="flex items-center gap-2.5">
                            <span className="font-medium text-[#ede8df] text-sm sm:text-base">
                              Post ID: {rec.external_post_id}
                            </span>
                            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-mono">
                              Live
                            </span>
                          </div>
                          <span className="text-xs text-[#85827b] block mt-1 font-mono">
                            Published on {new Date(rec.published_at).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <a
                        href={rec.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="px-4 py-2 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-[#ede8df] text-xs sm:text-sm font-medium flex items-center gap-2 transition-all self-start sm:self-auto"
                      >
                        <span>View Live Post</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </ScrollReveal>
        )}

        {/* Connect Channel Modal */}
        {selectedPlatform && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
            <div className="hirael-card p-7 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 rounded-2xl sm:rounded-3xl">
              <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
                <h3 className="font-normal text-[#ede8df] text-lg sm:text-xl flex items-center gap-2.5 capitalize">
                  <ShieldCheck className="w-5 h-5 text-[#d4a373]" />
                  <span>Connect {selectedPlatform}</span>
                </h3>
                <button
                  onClick={() => setSelectedPlatform(null)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#ede8df] flex items-center justify-center text-sm font-semibold"
                >
                  ✕
                </button>
              </div>


              {selectedPlatform === "instagram" && (
                <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs sm:text-sm text-amber-200">
                  <div className="font-medium flex items-center gap-2 mb-1.5 text-amber-300">
                    <AlertCircle className="w-4 h-4" />
                    <span>Instagram Manual Export Mode</span>
                  </div>
                  <p className="text-xs text-[#8a8a93] leading-relaxed">
                    No Instagram Client ID required. Lisa enables Creator Studio manual export mode to generate formatted carousel slides, reels scripts, and copy-ready captions.
                  </p>
                </div>
              )}

              <form onSubmit={handleConnect} className="space-y-5">
                <div>
                  <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">
                    Account Display Name / Handle
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. @acmecorp or Acme Official"
                    value={accountName}
                    onChange={(e) => setAccountName(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/50 border border-white/10 text-[#ede8df] text-xs sm:text-sm lg:text-[14.5px] focus:outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">
                    External Account / Page ID
                  </label>
                  <input
                    type="text"
                    placeholder="Optional (auto-generated if empty)"
                    value={accountId}
                    onChange={(e) => setAccountId(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/50 border border-white/10 text-[#ede8df] text-xs sm:text-sm lg:text-[14.5px] focus:outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
                  />
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">
                    OAuth Access Token / API Secret
                  </label>
                  <input
                    type="password"
                    placeholder="OAuth Bearer Token (Simulated for live demo)"
                    value={mockToken}
                    onChange={(e) => setMockToken(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/50 border border-white/10 text-[#ede8df] text-xs sm:text-sm lg:text-[14.5px] focus:outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
                  />
                  <span className="text-[11px] text-[#71717a] font-mono block mt-1.5">
                    Credentials are saved with envelope encryption.
                  </span>
                </div>

                <div className="flex items-center justify-end gap-3 pt-5 border-t border-white/[0.08]">
                  <button
                    type="button"
                    onClick={() => setSelectedPlatform(null)}
                    className="px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium text-[#85827b] hover:text-[#ede8df]"
                  >
                    Cancel
                  </button>
                  <InteractiveButton
                    type="submit"
                    loading={isSubmitting}
                    loadingText="Connecting..."
                    variant="primary"
                    size="md"
                    glow
                    shimmer
                    magnetic
                    className="px-6 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold"
                  >
                    Confirm Connection
                  </InteractiveButton>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
