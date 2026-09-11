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

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
      const params = statusFilter !== "all" ? { status: statusFilter } : undefined;
      const sourcesList = await sourcesApi.list(workspaceId, params);
      setSources(sourcesList);

      const assetsList = await mediaApi.list(workspaceId);
      setMediaAssets(assetsList);
    } catch (err) {
      console.error("Failed to load library", err);
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
    s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.content_pillar?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <Layers className="w-6 h-6 text-indigo-400" />
              Content & Asset Library
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Browse canonical content sources, track versions, and manage your central media asset library.
            </p>
          </div>

          <Link
            href="/content"
            className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Source</span>
          </Link>
        </div>

        {/* Tab & Search Controls */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-900 border border-slate-800 w-fit">
            <button
              onClick={() => setActiveTab("sources")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "sources"
                  ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Content Sources ({sources.length})
            </button>
            <button
              onClick={() => setActiveTab("media")}
              className={`px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                activeTab === "media"
                  ? "bg-indigo-600/25 text-indigo-300 border border-indigo-500/30"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              Media Assets ({mediaAssets.length})
            </button>
          </div>

          {/* Search & Filter */}
          {activeTab === "sources" && (
            <div className="flex items-center gap-3">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search sources or pillars..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none focus:border-indigo-500"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 outline-none"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Drafts</option>
                <option value="ready_for_adaptation">Ready for AI</option>
                <option value="archived">Archived</option>
              </select>
            </div>
          )}
        </div>

        {/* Content Sources Grid */}
        {activeTab === "sources" && (
          <div>
            {filteredSources.length === 0 ? (
              <div className="p-12 rounded-3xl glass-card text-center space-y-3">
                <FileText className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-300 text-sm font-medium">No content sources found</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Create your first canonical content idea in the Studio to start the multi-channel adaptation pipeline.
                </p>
                <Link
                  href="/content"
                  className="inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-medium mt-2"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New Content Source
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredSources.map((source) => (
                  <div
                    key={source.id}
                    onClick={() => router.push("/content")}
                    className="glass-card rounded-2xl p-5 space-y-4 hover:border-indigo-500/40 cursor-pointer flex flex-col justify-between"
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

                      <h3 className="font-bold text-slate-100 text-sm leading-snug line-clamp-2">
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
                        <div className="flex items-center gap-1.5 text-[10px] text-indigo-400">
                          <Share2 className="w-3 h-3" />
                          <span>{source.target_platforms_json?.length || 0} Platforms</span>
                        </div>
                        <button
                          onClick={(e) => handleDeleteSource(source.id, e)}
                          className="text-slate-500 hover:text-rose-400 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
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
              <div className="p-12 rounded-3xl glass-card text-center space-y-3">
                <ImageIcon className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-slate-300 text-sm font-medium">No media uploaded yet</p>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Upload images, videos, or documents to reuse across your multi-channel posts.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {mediaAssets.map((asset) => (
                  <div
                    key={asset.id}
                    className="glass-card rounded-2xl p-3 space-y-2 text-xs relative group"
                  >
                    <div className="h-28 rounded-xl bg-slate-950 flex items-center justify-center overflow-hidden">
                      {asset.mime_type.startsWith("image/") ? (
                        <img
                          src={asset.url}
                          alt={asset.filename}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="font-mono text-[10px] text-indigo-400 uppercase">
                          {asset.mime_type}
                        </span>
                      )}
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-medium text-slate-200 truncate">{asset.filename}</p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500">
                        <span>{(asset.size_bytes / 1024).toFixed(0)} KB</span>
                        {asset.width && asset.height && (
                          <span>{asset.width}x{asset.height}</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteMedia(asset.id)}
                      className="absolute top-4 right-4 p-1.5 rounded-lg bg-black/60 text-slate-400 hover:text-rose-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
