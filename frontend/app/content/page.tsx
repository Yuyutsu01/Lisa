"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  sourcesApi,
  mediaApi,
  brandApi,
  ContentSourceVersion,
  BrandProfile,
  getActiveWorkspaceId,
} from "@/lib/api";
import {
  Sparkles,
  Save,
  CheckCircle2,
  Clock,
  UploadCloud,
  History,
  Image as ImageIcon,
  Share2,
  Tag,
  ArrowRight,
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";

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
    "discord",
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
    { id: "discord", label: "Discord Community" },
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
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header with Auto-save indicator & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-white/[0.08] pb-6">
          <div>
            <div className="flex items-center gap-2.5 text-[11px] sm:text-xs lg:text-[13px] font-mono uppercase tracking-widest text-[#85827b] mb-1.5">
              <Sparkles className="w-4 h-4 text-[#d4a373]" />
              <span>Canonical Core Editor</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#ede8df]">
              Content Studio
            </h1>
            <div className="flex items-center gap-3.5 text-xs sm:text-sm text-[#8a8a93] mt-2">
              <span className="flex items-center gap-2 font-medium">
                {saveStatus === "saved" && (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400">All changes auto-saved</span>
                  </>
                )}
                {saveStatus === "saving" && (
                  <>
                    <Clock className="w-4 h-4 text-[#d4a373] animate-spin" />
                    <span className="text-[#d4a373]">Saving draft...</span>
                  </>
                )}
                {saveStatus === "unsaved" && (
                  <span className="text-[#71717a]">Unsaved edits...</span>
                )}
              </span>
              <span>&bull;</span>
              <button
                onClick={handleLoadVersions}
                disabled={!sourceId}
                className="hover:text-[#d4a373] text-[#8a8a93] flex items-center gap-1.5 cursor-pointer disabled:opacity-40 transition-colors font-mono text-xs sm:text-[13px]"
              >
                <History className="w-4 h-4" />
                <span>Version Snapshots ({versions.length})</span>
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <InteractiveButton
              onClick={handleManualSaveSnapshot}
              variant="secondary"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold"
            >
              Snapshot Version
            </InteractiveButton>
            <InteractiveButton
              onClick={handleAdaptAndDistribute}
              loading={isAdapting}
              loadingText="Processing AI Adaptations..."
              variant="primary"
              size="lg"
              glow
              shimmer
              magnetic
              rightIcon={<ArrowRight className="w-4 h-4" />}
              className="px-6 sm:px-7 py-3 text-xs sm:text-sm lg:text-[14px] font-semibold"
            >
              Adapt &amp; Distribute
            </InteractiveButton>
          </div>
        </div>

        {/* Dual-Pane Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Canonical Editor (Left 2 Cols) */}
          <div className="lg:col-span-2 space-y-6">
            <ScrollReveal delay={0}>
              <div className="hirael-card p-6 sm:p-7 lg:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Give your content idea a clear, canonical title..."
                  className="w-full text-xl sm:text-2xl lg:text-[1.75rem] font-medium bg-transparent text-[#ede8df] placeholder-[#55534e] outline-none tracking-tight leading-snug"
                />

                <div className="border-t border-white/[0.08] pt-5">
                  <textarea
                    rows={14}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Draft your core thought, article, announcement, or transcript here.
Our specialized AI agents will read this canonical source, preserve your facts, and adapt hooks, formatting, character limits, and media specifically for each channel..."
                    className="w-full bg-transparent text-sm sm:text-base lg:text-[15.5px] text-[#ede8df] placeholder-[#55534e] outline-none leading-relaxed resize-none"
                  />
                </div>

                {/* Word and Character Count */}
                <div className="border-t border-white/[0.08] pt-4 flex items-center justify-between text-xs sm:text-[13px] text-[#71717a]">
                  <span>
                    {body.trim() ? body.trim().split(/\s+/).length : 0} words &bull; {body.length} characters
                  </span>
                  <span className="font-mono text-[#d4a373]">Canonical Source Draft</span>
                </div>
              </div>
            </ScrollReveal>

            {/* Attached Media Assets */}
            <ScrollReveal delay={50}>
              <div className="hirael-card p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs sm:text-sm lg:text-[14px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                    <ImageIcon className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                    <span>Attached Media Assets ({attachedAssets.length})</span>
                  </h3>
                  <label className="cursor-pointer py-2 px-4 rounded-full bg-white/[0.06] hover:bg-white/[0.12] border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] font-medium flex items-center gap-2 transition-colors">
                    <UploadCloud className="w-4 h-4 text-[#d4a373]" />
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
                  <div className="p-8 sm:p-10 rounded-2xl border border-dashed border-white/[0.08] text-center text-xs sm:text-sm text-[#71717a] leading-relaxed">
                    No media attached. Upload images or video clips to be resized and adapted per platform.
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {attachedAssets.map((asset, i) => (
                      <div
                        key={asset.id || i}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-2 relative group"
                      >
                        <div className="h-24 rounded-lg bg-black/40 flex items-center justify-center overflow-hidden">
                          {asset.mime_type?.startsWith("image/") ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={asset.url}
                              alt={asset.filename}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="font-mono text-xs text-[#d4a373] uppercase">
                              {asset.mime_type}
                            </span>
                          )}
                        </div>
                        <p className="font-medium text-[#ede8df] truncate text-xs sm:text-[13px]">
                          {asset.filename}
                        </p>
                        <p className="text-[11px] text-[#71717a] font-mono">
                          {asset.width && asset.height ? `${asset.width}x${asset.height}` : ""}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </ScrollReveal>
          </div>

          {/* Right Sidebar: Platform Targeting & Metadata */}
          <div className="space-y-6">
            {/* Target Platforms */}
            <ScrollReveal delay={30}>
              <div className="hirael-card p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-4">
                <h3 className="text-xs sm:text-sm lg:text-[14px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                  <Share2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                  <span>Target Distribution Channels</span>
                </h3>

                <div className="grid grid-cols-2 gap-2.5">
                  {PLATFORMS.map((plat) => {
                    const isSelected = selectedPlatforms.includes(plat.id);
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => togglePlatform(plat.id)}
                        className={`p-3.5 rounded-xl text-xs sm:text-sm text-left font-medium border transition-all ${
                          isSelected
                            ? "bg-[#d4a373]/15 border-[#d4a373]/40 text-[#d4a373] shadow-sm"
                            : "bg-white/[0.02] border-white/[0.06] text-[#8a8a93] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span>{plat.label}</span>
                          {isSelected && <span className="w-2 h-2 rounded-full bg-[#d4a373]" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </ScrollReveal>

            {/* Categorization & Pillar */}
            <ScrollReveal delay={70}>
              <div className="hirael-card p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-5">
                <h3 className="text-xs sm:text-sm lg:text-[14px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                  <Tag className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                  <span>Content Classification</span>
                </h3>

                <div>
                  <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Content Pillar</label>
                  <select
                    value={contentPillar}
                    onChange={(e) => setContentPillar(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] outline-none cursor-pointer focus:border-[#d4a373]/60"
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
                  <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Source Format Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] outline-none cursor-pointer focus:border-[#d4a373]/60"
                  >
                    <option value="article">Long-Form Article</option>
                    <option value="announcement">Product Announcement</option>
                    <option value="case_study">Case Study / Customer Story</option>
                    <option value="note">Raw Notes / Brain Dump</option>
                  </select>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Version History Modal */}
        {showVersions && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <div className="hirael-card w-full max-w-lg p-7 sm:p-8 rounded-2xl sm:rounded-3xl shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4">
                <h3 className="font-medium text-[#ede8df] text-base sm:text-lg flex items-center gap-2.5">
                  <History className="w-5 h-5 text-[#d4a373]" />
                  <span>Version Snapshots</span>
                </h3>
                <button
                  onClick={() => setShowVersions(false)}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-[#ede8df] flex items-center justify-center text-xs font-semibold"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1 scrollbar-none">
                {versions.map((v) => (
                  <div
                    key={v.id}
                    className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between text-xs sm:text-sm"
                  >
                    <div>
                      <p className="font-semibold text-[#ede8df] text-sm">Version {v.version_number}</p>
                      <p className="text-xs text-[#8a8a93] truncate max-w-xs mt-0.5">{v.title}</p>
                      <p className="text-[11px] text-[#71717a] font-mono mt-1">
                        {new Date(v.created_at).toLocaleString()}
                      </p>
                    </div>
                    <InteractiveButton
                      onClick={() => handleRestoreVersion(v.id)}
                      variant="secondary"
                      size="sm"
                      className="text-xs px-3.5 py-1.5"
                    >
                      Restore
                    </InteractiveButton>
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
    <Suspense fallback={<div className="p-8 text-center text-xs text-[#8a8a93]">Loading Studio...</div>}>
      <ContentStudioContent />
    </Suspense>
  );
}
