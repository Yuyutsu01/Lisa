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
  Calendar,
  Share2,
  Filter,
  FileText,
  UploadCloud,
} from "lucide-react";

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
    } catch (err: any) {
      console.error("Failed to load library", err);
      setErrorMsg(err.message || "Failed to load library items.");
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
    s.content_pillar?.toLowerCase().includes(debouncedSearch.toLowerCase())
  );

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#85827b] mb-1">
              <Layers className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Asset Catalog & Sources</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#ede8df]">
              Content & Asset Library
            </h1>
            <p className="text-xs sm:text-sm text-[#8a8a93] mt-1 max-w-2xl leading-relaxed">
              Browse canonical content sources, track versions, and manage your central media asset library.
            </p>
          </div>

          <Link
            href="/content"
            className="hirael-pill-btn text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create New Source</span>
          </Link>
        </div>

        {/* Tab & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a0a0d] border border-white/[0.08] w-fit">
            <button
              onClick={() => setActiveTab("sources")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
                activeTab === "sources"
                  ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                  : "text-[#787672] hover:text-[#ede8df]"
              }`}
            >
              Content Sources ({sources.length})
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`px-4 py-2 rounded-full text-xs font-medium transition-all ${
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
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#71717a]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sources or pillars..."
                  className="w-full pl-9 pr-3 py-2 rounded-full bg-white/[0.03] border border-white/10 text-xs text-[#ede8df] placeholder:text-[#71717a] outline-none focus:border-white/30"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3.5 py-2 rounded-full bg-[#0e0e12] border border-white/10 text-xs text-[#ede8df] outline-none focus:border-white/30"
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
          <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
            {errorMsg}
          </div>
        )}

        {/* Content Sources Grid */}
        {activeTab === "sources" && (
          <div>
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="glass-card rounded-2xl p-5 space-y-4 animate-pulse border border-white/[0.05]"
                  >
                    <div className="flex items-center justify-between">
                      <div className="w-20 h-5 rounded-full bg-white/10" />
                      <div className="w-8 h-4 rounded bg-white/5" />
                    </div>
                    <div className="space-y-2">
                      <div className="w-3/4 h-5 rounded bg-white/10" />
                      <div className="w-full h-3 rounded bg-white/5" />
                      <div className="w-2/3 h-3 rounded bg-white/5" />
                    </div>
                    <div className="border-t border-white/[0.05] pt-3 flex items-center justify-between">
                      <div className="w-16 h-3 rounded bg-white/5" />
                      <div className="w-20 h-3 rounded bg-white/5" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredSources.length === 0 ? (
              <div className="p-12 hirael-card text-center space-y-3">
                <FileText className="w-10 h-10 text-[#52525b] mx-auto" />
                <p className="text-[#ede8df] text-sm font-medium">No content sources found</p>
                <p className="text-xs text-[#71717a] max-w-sm mx-auto">
                  Create your first canonical content idea in the Studio to start the multi-channel adaptation pipeline.
                </p>
                <Link
                  href="/content"
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-full bg-white/[0.08] hover:bg-white/[0.15] text-[#ede8df] text-xs font-medium border border-white/10 mt-2"
                >
                  <Plus className="w-3.5 h-3.5 text-[#d4a373]" />
                  New Content Source
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => router.push(`/content/${source.id}/variants`)}
                    className="glass-card rounded-2xl p-5 space-y-4 hover:border-indigo-500/40 cursor-pointer flex flex-col justify-between group transition-all"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold border ${
                            source.status === "ready_for_adaptation"
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                              : "bg-slate-800 border-slate-700 text-slate-400"
                          }`}
                        >
                          {source.status === "ready_for_adaptation" ? "Ready for AI" : "Draft"}
                        </span>
                        <span className="text-[10px] text-slate-500 font-mono">
                          v{source.version_count || 1}
                        </span>
                      </div>

                      <h3 className="font-bold text-slate-100 text-sm leading-snug line-clamp-2 group-hover:text-indigo-300 transition-colors">
                        {source.title}
                      </h3>

                      <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed">
                        {source.body || "No body content drafted yet..."}
                      </p>
                    </div>

                    <div className="border-t border-slate-800/80 pt-3.5 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span>{source.content_pillar || "General"}</span>
                        <span>{new Date(source.updated_at).toLocaleDateString()}</span>
                      </div>

                      <div className="flex items-center justify-between pt-1">
                        <div className="flex items-center gap-1.5 text-[11px] text-indigo-400 font-medium">
                          <Sparkles className="w-3.5 h-3.5" />
                          <span>Review Variants ({source.target_platforms_json?.length || 0})</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            title="Edit Canonical Source"
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/content?id=${source.id}`);
                            }}
                            className="text-slate-400 hover:text-slate-200 p-1 hover:bg-slate-800 rounded transition-colors"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>
                          <button
                            title="Delete Source"
                            onClick={(e) => handleDeleteSource(source.id, e)}
                            className="text-slate-500 hover:text-rose-400 p-1 hover:bg-slate-800 rounded transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Media Asset Gallery */}
        {activeTab === "media" && (
          <div>
            {mediaAssets.length === 0 ? (
              <div className="p-12 hirael-card text-center space-y-3">
                <ImageIcon className="w-10 h-10 text-[#52525b] mx-auto" />
                <p className="text-[#ede8df] text-sm font-medium">No media uploaded yet</p>
                <p className="text-xs text-[#71717a] max-w-sm mx-auto">
                  Upload images, videos, or documents to reuse across your multi-channel posts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mediaAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="hirael-card p-3 space-y-2 text-xs relative group"
                  >
                    <div className="h-28 rounded-2xl bg-black/60 border border-white/[0.06] flex items-center justify-center overflow-hidden">
                      {asset.mime_type.startsWith("image/") ? (
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-mono text-[10px] text-[#d4a373] uppercase">
                          {asset.mime_type}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-medium text-[#ede8df] truncate text-xs">{asset.filename}</p>
                      <div className="flex items-center justify-between text-[10px] text-[#71717a] font-mono">
                        <span>{(asset.size_bytes / 1024).toFixed(0)} KB</span>
                        {asset.width && asset.height && (
                          <span>{asset.width}x{asset.height}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(asset.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-full bg-black/80 text-[#71717a] hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
