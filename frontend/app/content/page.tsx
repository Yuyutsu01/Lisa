"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  sourcesApi,
  mediaApi,
  brandApi,
  ContentSource,
  ContentSourceVersion,
  MediaAsset,
  BrandProfile,
  getActiveWorkspaceId,
} from "@/lib/api";
import {
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  UploadCloud,
  Layers,
  History,
  Trash2,
  Image as ImageIcon,
  Share2,
  Tag,
  ArrowRight,
  Loader2,
} from "lucide-react";

function ContentStudioContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSourceId = searchParams.get("id") || searchParams.get("sourceId");

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  
  // Editor state
  const [sourceId, setSourceId] = useState<string | null>(urlSourceId);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [contentType, setContentType] = useState("article");
  const [contentPillar, setContentPillar] = useState("");
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "linkedin",
    "x",
    "instagram",
    "youtube",
  ]);
  
  // Attachments and versions
  const [attachedAssets, setAttachedAssets] = useState<any[]>([]);
  const [versions, setVersions] = useState<ContentSourceVersion[]>([]);
  const [showVersions, setShowVersions] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [isAdapting, setIsAdapting] = useState(false);

  // Status & Auto-save
  const [saveStatus, setSaveStatus] = useState<"saved" | "saving" | "unsaved">("saved");
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  const PLATFORMS = [
    { id: "linkedin", label: "LinkedIn" },
    { id: "x", label: "X (Twitter)" },
    { id: "instagram", label: "Instagram" },
    { id: "youtube", label: "YouTube Shorts" },
    { id: "tiktok", label: "TikTok" },
    { id: "threads", label: "Threads" },
    { id: "email", label: "Newsletter / Email" },
    { id: "blog", label: "Blog CMS" },
  ];

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    if (wsId) {
      brandApi.getProfile(wsId).then(setBrandProfile).catch(console.error);
    }
  }, []);

  // Load existing source if query param is passed
  useEffect(() => {
    if (urlSourceId) {
      sourcesApi
        .get(urlSourceId)
        .then((src) => {
          setSourceId(src.id);
          setTitle(src.title);
          setBody(src.body);
          setContentType(src.content_type || "article");
          setContentPillar(src.content_pillar || "");
          if (src.target_platforms_json && src.target_platforms_json.length > 0) {
            setSelectedPlatforms(src.target_platforms_json);
          }
          if (src.attached_assets) {
            setAttachedAssets(src.attached_assets);
          }
        })
        .catch(console.error);
    }
  }, [urlSourceId]);

  // Debounced auto-save effect
  useEffect(() => {
    if (!title.trim() && !body.trim()) return;

    setSaveStatus("unsaved");
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current);
    }

    autoSaveTimerRef.current = setTimeout(async () => {
      if (!activeWorkspaceId) return;
      setSaveStatus("saving");

      try {
        if (!sourceId) {
          // Create initial source
          const created = await sourcesApi.create(activeWorkspaceId, {
            title: title || "Untitled Idea",
            body,
            content_type: contentType,
            content_pillar: contentPillar,
            target_platforms_json: selectedPlatforms,
            status: "draft",
          });
          setSourceId(created.id);
        } else {
          // Auto-save update
          await sourcesApi.update(sourceId, {
            title: title || "Untitled Idea",
            body,
            content_type: contentType,
            content_pillar: contentPillar,
            target_platforms_json: selectedPlatforms,
          });
        }
        setSaveStatus("saved");
      } catch (err) {
        console.error("Auto-save failed", err);
        setSaveStatus("unsaved");
      }
    }, 1200);

    return () => {
      if (autoSaveTimerRef.current) clearTimeout(autoSaveTimerRef.current);
    };
  }, [title, body, contentType, contentPillar, selectedPlatforms, activeWorkspaceId, sourceId]);

  const handleAdaptAndDistribute = async () => {
    if (!activeWorkspaceId) {
      alert("Please select or create an active workspace first.");
      return;
    }

    if (!title.trim() && !body.trim()) {
      alert("Please enter a title or body content before adapting.");
      return;
    }

    try {
      setIsAdapting(true);
      let targetId = sourceId;

      if (!targetId) {
        const created = await sourcesApi.create(activeWorkspaceId, {
          title: title || "Untitled Idea",
          body,
          content_type: contentType,
          content_pillar: contentPillar,
          target_platforms_json: selectedPlatforms,
          status: "ready_for_adaptation",
        });
        targetId = created.id;
        setSourceId(created.id);
      } else {
        await sourcesApi.update(targetId, {
          title: title || "Untitled Idea",
          body,
          content_type: contentType,
          content_pillar: contentPillar,
          target_platforms_json: selectedPlatforms,
          status: "ready_for_adaptation",
          create_version_snapshot: true,
        });
      }

      setSaveStatus("saved");
      router.push(`/content/${targetId}/variants`);
    } catch (err: any) {
      console.error("Failed to adapt and distribute", err);
      alert(err.message || "Failed to save and adapt content");
      setIsAdapting(false);
    }
  };

  const handleManualSaveSnapshot = async () => {
    if (!sourceId && !activeWorkspaceId) return;
    setSaveStatus("saving");

    try {
      if (!sourceId && activeWorkspaceId) {
        const created = await sourcesApi.create(activeWorkspaceId, {
          title: title || "Untitled Idea",
          body,
          content_type: contentType,
          content_pillar: contentPillar,
          target_platforms_json: selectedPlatforms,
          status: "ready_for_adaptation",
        });
        setSourceId(created.id);
      } else if (sourceId) {
        await sourcesApi.update(sourceId, {
          title,
          body,
          content_type: contentType,
          content_pillar: contentPillar,
          target_platforms_json: selectedPlatforms,
          create_version_snapshot: true,
          status: "ready_for_adaptation",
        });
      }
      setSaveStatus("saved");
      if (sourceId) {
        const updatedVersions = await sourcesApi.listVersions(sourceId);
        setVersions(updatedVersions);
      }
    } catch (err) {
      console.error("Manual save failed", err);
    }
  };

  const togglePlatform = (id: string) => {
    if (selectedPlatforms.includes(id)) {
      setSelectedPlatforms(selectedPlatforms.filter((p) => p !== id));
    } else {
      setSelectedPlatforms([...selectedPlatforms, id]);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !activeWorkspaceId) return;

    try {
      setUploadingMedia(true);
      const asset = await mediaApi.upload(activeWorkspaceId, file);
      setAttachedAssets((prev) => [...prev, asset]);
    } catch (err) {
      console.error("Upload failed", err);
    } finally {
      setUploadingMedia(false);
    }
  };

  const handleLoadVersions = async () => {
    if (!sourceId) return;
    try {
      const vList = await sourcesApi.listVersions(sourceId);
      setVersions(vList);
      setShowVersions(true);
    } catch (err) {
      console.error("Failed to load versions", err);
    }
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (!sourceId) return;
    try {
      const restored = await sourcesApi.restoreVersion(sourceId, versionId);
      setTitle(restored.title);
      setBody(restored.body);
      setShowVersions(false);
    } catch (err) {
      console.error("Restore failed", err);
    }
  };

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header with Auto-save indicator & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <Sparkles className="w-6 h-6 text-indigo-400" />
              Content Studio (Canonical Source)
            </h1>
            <div className="flex items-center gap-3 text-xs text-slate-400 mt-1">
              <span className="flex items-center gap-1.5 font-medium">
                {saveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">All changes auto-saved</span>
                  </>
                )}
                {saveStatus === "saving" && (
                  <>
                    <Clock className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                    <span className="text-amber-400">Saving draft...</span>
                  </>
                )}
                {saveStatus === "unsaved" && (
                  <span className="text-slate-500">Unsaved edits...</span>
                )}
              </span>
              <span>•</span>
              <button
                onClick={handleLoadVersions}
                disabled={!sourceId}
                className="hover:text-indigo-400 flex items-center gap-1 cursor-pointer disabled:opacity-40"
              >
                <History className="w-3.5 h-3.5" />
                <span>Version Snapshots ({versions.length})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleManualSaveSnapshot}
              className="py-2.5 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Snapshot Version</span>
            </button>
            <button
              onClick={handleAdaptAndDistribute}
              disabled={isAdapting}
              className="py-2.5 px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer disabled:opacity-60"
            >
              {isAdapting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing AI Adaptations...</span>
                </>
              ) : (
                <>
                  <span>Adapt &amp; Distribute</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dual-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Canonical Editor (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="glass-card rounded-2xl p-6 space-y-4">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your content idea a clear, canonical title..."
                className="w-full text-xl font-bold bg-transparent text-slate-100 placeholder-slate-500 outline-none tracking-tight"
              />

              <div className="border-t border-slate-800/80 pt-4">
                <textarea
                  rows={14}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder="Draft your core thought, article, announcement, or transcript here.
Our specialized AI agents will read this canonical source, preserve your facts, and adapt hooks, formatting, character limits, and media specifically for each channel..."
                  className="w-full bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none leading-relaxed resize-none"
                />
              </div>

              {/* Word and Character Count */}
              <div className="border-t border-slate-800/80 pt-3 flex items-center justify-between text-[11px] text-slate-500">
                <span>
                  {body.trim() ? body.trim().split(/\s+/).length : 0} words • {body.length} characters
                </span>
                <span className="font-mono text-indigo-400">Canonical Source Draft</span>
              </div>
            </div>

            {/* Attached Media Assets */}
            <div className="glass-card rounded-2xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <ImageIcon className="w-4 h-4 text-indigo-400" />
                  Attached Media Assets ({attachedAssets.length})
                </h3>
                <label className="cursor-pointer py-1.5 px-3 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-medium flex items-center gap-1.5 transition-colors">
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{uploadingMedia ? "Uploading..." : "Attach Media"}</span>
                  <input
                    type="file"
                    accept="image/*,video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </label>
              </div>

              {attachedAssets.length === 0 ? (
                <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-xs text-slate-500">
                  No media attached. Upload images or video clips to be resized and adapted per platform.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {attachedAssets.map((asset, i) => (
                    <div
                      key={asset.id || i}
                      className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 relative group"
                    >
                      <div className="h-20 rounded-lg bg-slate-950 flex items-center justify-center overflow-hidden">
                        {asset.mime_type?.startsWith("image/") ? (
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
                      <p className="font-medium text-slate-200 truncate text-[11px]">
                        {asset.filename}
                      </p>
                      <p className="text-[10px] text-slate-500">
                        {asset.width && asset.height ? `${asset.width}x${asset.height}` : ""}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right Sidebar: Platform Targeting & Metadata */}
          <div className="space-y-5">
            {/* Target Platforms */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                Target Distribution Channels
              </h3>

              <div className="grid grid-cols-2 gap-2">
                {PLATFORMS.map((plat) => {
                  const isSelected = selectedPlatforms.includes(plat.id);
                  return (
                    <button
                      key={plat.id}
                      type="button"
                      onClick={() => togglePlatform(plat.id)}
                      className={`p-2.5 rounded-xl text-xs text-left font-medium border transition-all ${
                        isSelected
                          ? "bg-indigo-600/20 border-indigo-500/50 text-indigo-300"
                          : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{plat.label}</span>
                        {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Categorization & Pillar */}
            <div className="glass-card rounded-2xl p-5 space-y-4">
              <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                <Tag className="w-4 h-4 text-emerald-400" />
                Content Classification
              </h3>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Content Pillar</label>
                <select
                  value={contentPillar}
                  onChange={(e) => setContentPillar(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                >
                  <option value="">Select Brand Pillar...</option>
                  {brandProfile?.content_pillars_json?.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name} ({p.target_percentage}%)
                    </option>
                  ))}
                  <option value="General Insights">General Insights</option>
                  <option value="Product Launch">Product Launch</option>
                  <option value="Tutorial / How-To">Tutorial / How-To</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1.5">Source Format Type</label>
                <select
                  value={contentType}
                  onChange={(e) => setContentType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-200 outline-none"
                >
                  <option value="article">Long-Form Article</option>
                  <option value="announcement">Product Announcement</option>
                  <option value="case_study">Case Study / Customer Story</option>
                  <option value="note">Raw Notes / Brain Dump</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Version History Modal */}
        {showVersions && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="glass-panel w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="font-semibold text-slate-100 text-sm flex items-center gap-2">
                  <History className="w-4 h-4 text-indigo-400" />
                  Version Snapshots
                </h3>
                <button
                  onClick={() => setShowVersions(false)}
                  className="text-slate-400 hover:text-slate-200 text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-semibold text-slate-200">Version {v.version_number}</p>
                      <p className="text-[11px] text-slate-400 truncate max-w-xs">{v.title}</p>
                      <p className="text-[10px] text-slate-500">
                        {new Date(v.created_at).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRestoreVersion(v.id)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                    >
                      Restore
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

export default function ContentStudioPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-xs text-slate-500">Loading Studio...</div>}>
      <ContentStudioContent />
    </Suspense>
  );
}
