"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  sourcesApi,
  mediaApi,
  ContentSource,
  MediaAsset,
  getActiveWorkspaceId,
} from "@/lib/api";
import {
  Layers,
  Sparkles,
  Plus,
  Search,
  Image as ImageIcon,
  Trash2,
  FileText,
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";

export default function ContentLibraryPage() {
  const router = useRouter();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"sources" | "media">("sources");
  const [sources, setSources] = useState<ContentSource[]>([]);
  const [mediaAssets, setMediaAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters with debounce
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 250);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    if (wsId) {
      loadLibraryData(wsId);
    }
  }, [statusFilter]);

  const loadLibraryData = async (workspaceId: string) => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const [sourcesList, assetsList] = await Promise.all([
        sourcesApi.list(workspaceId, params),
        mediaApi.list(workspaceId),
      ]);
      setSources(sourcesList);
      setMediaAssets(assetsList);
    } catch (err: unknown) {
      console.error("Failed to load library", err);
      const msg = err instanceof Error ? err.message : "Failed to load library items.";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSource = async (sourceId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm("Are you sure you want to delete this content source?")) return;
    try {
      await sourcesApi.delete(sourceId);
      setSources(sources.filter((s) => s.id !== sourceId));
    } catch (err) {
      console.error("Failed to delete source", err);
    }
  };

  const handleDeleteMedia = async (assetId: string) => {
    if (!activeWorkspaceId) return;
    try {
      await mediaApi.delete(activeWorkspaceId, assetId);
      setMediaAssets(mediaAssets.filter((a) => a.id !== assetId));
    } catch (err) {
      console.error("Failed to delete asset", err);
    }
  };

  const filteredSources = sources.filter((s) =>
    s.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    (s.content_pillar && s.content_pillar.toLowerCase().includes(debouncedSearch.toLowerCase()))
  );

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8 lg:space-y-10">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-[11px] sm:text-xs lg:text-[13px] font-mono uppercase tracking-widest text-[#85827b] mb-1">
              <Layers className="w-4 h-4 text-[#d4a373]" />
              <span>Asset Catalog & Sources</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#ede8df]">
              Content & Asset Library
            </h1>
            <p className="text-xs sm:text-sm lg:text-[15px] text-[#8a8a93] mt-1 max-w-2xl leading-relaxed">
              Browse canonical content sources, track versions, and manage your central media asset library.
            </p>
          </div>

          <Link href="/content" className="shrink-0">
            <InteractiveButton
              variant="primary"
              size="lg"
              glow
              shimmer
              magnetic
              leftIcon={<Plus className="w-4 h-4" />}
              className="px-6 py-3 text-xs sm:text-sm lg:text-[14.5px] font-semibold"
            >
              Create New Source
            </InteractiveButton>
          </Link>
        </div>

        {/* Tab & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a0a0d] border border-white/[0.08] w-fit">
            <button
              onClick={() => setActiveTab("sources")}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-[13.5px] font-medium transition-all cursor-pointer ${
                activeTab === "sources"
                  ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                  : "text-[#787672] hover:text-[#ede8df]"
              }`}
            >
              Content Sources ({sources.length})
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`px-4 sm:px-5 py-2 rounded-full text-xs sm:text-[13.5px] font-medium transition-all cursor-pointer ${
                activeTab === "media"
                  ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                  : "text-[#787672] hover:text-[#ede8df]"
              }`}
            >
              Media Assets ({mediaAssets.length})
            </button>
          </div>

          {/* Search & Filter */}
          {activeTab === "sources" && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#71717a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sources or pillars..."
                  className="w-full pl-10 pr-4 py-2 sm:py-2.5 rounded-full bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-[#ede8df] placeholder:text-[#71717a] outline-none focus:border-white/30 transition-colors"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-2 sm:py-2.5 rounded-full bg-[#0e0e12] border border-white/10 text-xs sm:text-sm text-[#ede8df] outline-none focus:border-white/30 cursor-pointer"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Drafts</option>
                <option value="ready_for_adaptation">Ready for AI</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        {/* Error Banner */}
        {errorMsg && (
          <div className="p-4 sm:p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs sm:text-sm">
            {errorMsg}
          </div>
        )}

        {/* Content Sources Grid */}
        {activeTab === "sources" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="hirael-card p-6 space-y-4 animate-pulse border border-white/[0.05] rounded-2xl"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-24 h-6 rounded-full bg-white/10" />
                      <div className="w-10 h-4 rounded bg-white/5" />
                    </div>
                    <div className="space-y-2.5">
                      <div className="w-3/4 h-6 rounded bg-white/10" />
                      <div className="w-full h-4 rounded bg-white/5" />
                      <div className="w-2/3 h-4 rounded bg-white/5" />
                    </div>
                    <div className="border-t border-white/[0.05] pt-4 flex items-center justify-between">
                      <div className="w-20 h-4 rounded bg-white/5" />
                      <div className="w-24 h-4 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="p-12 sm:p-16 hirael-card text-center space-y-4 rounded-3xl">
                <FileText className="w-12 h-12 text-[#52525b] mx-auto" />
                <p className="text-[#ede8df] text-base sm:text-lg font-medium">No content sources found</p>
                <p className="text-xs sm:text-sm text-[#71717a] max-w-md mx-auto leading-relaxed">
                  Create your first canonical content idea in the Studio to start the multi-channel adaptation pipeline.
                </p>
                <Link href="/content" className="inline-block pt-2">
                  <InteractiveButton
                    variant="secondary"
                    size="md"
                    glow
                    leftIcon={<Plus className="w-4 h-4 text-[#d4a373]" />}
                    className="text-xs sm:text-sm"
                  >
                    New Content Source
                  </InteractiveButton>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredSources.map((source, idx) => (
                  <ScrollReveal key={source.id} delay={idx * 40}>
                    <div
                      onClick={() => router.push(`/content/${source.id}/variants`)}
                      className="hirael-card card-hover-lift p-6 sm:p-7 space-y-4 cursor-pointer flex flex-col justify-between group h-full rounded-2xl"
                    >
                      <div className="space-y-2.5">
                        <div className="flex items-center justify-between">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              source.status === "ready_for_adaptation"
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                                : "bg-white/[0.05] border-white/10 text-[#a6a39b]"
                            }`}
                          >
                            {source.status === "ready_for_adaptation" ? "Ready for AI" : "Draft"}
                          </span>
                          <span className="text-[11px] text-[#71717a] font-mono">
                            v{source.version_count || 1}
                          </span>
                        </div>

                        <h3 className="font-semibold text-[#ede8df] text-sm sm:text-base lg:text-[17px] leading-snug line-clamp-2 group-hover:text-[#d4a373] transition-colors">
                          {source.title}
                        </h3>

                        <p className="text-xs sm:text-sm text-[#8a8a93] line-clamp-3 leading-relaxed">
                          {source.body || "No body content drafted yet..."}
                        </p>
                      </div>

                      <div className="border-t border-white/[0.06] pt-4 space-y-3">
                        <div className="flex items-center justify-between text-xs text-[#71717a]">
                          <span className="truncate max-w-[150px]">{source.content_pillar || "General Pillar"}</span>
                          <span>{new Date(source.updated_at).toLocaleDateString()}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="flex items-center gap-1.5 text-xs sm:text-[13px] text-[#d4a373] font-medium group-hover:underline">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Review Variants ({source.target_platforms_json?.length || 0})</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <button
                              title="Edit Canonical Source"
                              onClick={(e) => {
                                e.stopPropagation();
                                router.push(`/content?id=${source.id}`);
                              }}
                              className="text-[#8a8a93] hover:text-[#ede8df] p-1.5 hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              title="Delete Source"
                              onClick={(e) => handleDeleteSource(source.id, e)}
                              className="text-[#71717a] hover:text-rose-400 p-1.5 hover:bg-white/[0.08] rounded-xl transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Asset Gallery */}
        {activeTab === "media" && (
          <div>
            {mediaAssets.length === 0 ? (
              <div className="p-12 sm:p-16 hirael-card text-center space-y-4 rounded-3xl">
                <ImageIcon className="w-12 h-12 text-[#52525b] mx-auto" />
                <p className="text-[#ede8df] text-base sm:text-lg font-medium">No media uploaded yet</p>
                <p className="text-xs sm:text-sm text-[#71717a] max-w-md mx-auto leading-relaxed">
                  Upload images, videos, or documents to reuse across your multi-channel posts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-5">
                {mediaAssets.map((asset, idx) => (
                  <ScrollReveal key={asset.id} delay={idx * 30}>
                    <div className="hirael-card card-hover-lift p-4 space-y-3 relative group h-full rounded-2xl">
                      <div className="h-32 sm:h-36 rounded-xl bg-black/60 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                        {asset.mime_type.startsWith("image/") ? (
                          <img
                            src={asset.url}
                            alt={asset.filename}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <span className="font-mono text-xs text-[#d4a373] uppercase">
                            {asset.mime_type}
                          </span>
                        )}
                      </div>
                      <div className="space-y-1">
                        <p className="font-medium text-[#ede8df] truncate text-xs sm:text-[13px]">{asset.filename}</p>
                        <div className="flex items-center justify-between text-[11px] text-[#71717a] font-mono">
                          <span>{(asset.size_bytes / 1024).toFixed(0)} KB</span>
                          {asset.width && asset.height && (
                            <span>{asset.width}x{asset.height}</span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteMedia(asset.id)}
                        className="absolute top-4 right-4 p-2 rounded-full bg-black/80 text-[#71717a] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-md"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </ScrollReveal>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
