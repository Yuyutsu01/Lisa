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
  Lock,
  X as CloseIcon,
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

  // Premium platform protection (strictly locked; payments coming soon)
  const PREMIUM_PLATFORMS = ["instagram", "threads", "x"];
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeTargetPlatform, setUpgradeTargetPlatform] = useState<string | null>(null);

  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([
    "linkedin",
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
    { id: "linkedin", label: "LinkedIn", isPremium: false },
    { id: "discord", label: "Discord Community", isPremium: false },
    { id: "x", label: "X (Twitter)", isPremium: true },
    { id: "instagram", label: "Instagram", isPremium: true },
    { id: "threads", label: "Threads", isPremium: true },
    { id: "email", label: "Newsletter / Email", isPremium: false },
    { id: "blog", label: "Blog CMS", isPremium: false },
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
            setSelectedPlatforms(src.target_platforms_json.filter((p: string) => !PREMIUM_PLATFORMS.includes(p)));
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
    const isPremium = PREMIUM_PLATFORMS.includes(id);
    if (isPremium) {
      setUpgradeTargetPlatform(id);
      setShowUpgradeModal(true);
      return;
    }

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

Our specialized AI agents will read this canonical source, preserve your facts, and adapt hooks, formatting, character limits, and media specifically for each channel. Provide at least 150 words of substantive content for optimal multi-agent reasoning, deep source grounding, and high-impact post framing..."
                    className="w-full bg-transparent text-sm sm:text-base lg:text-[15.5px] text-[#ede8df] placeholder-[#55534e] outline-none leading-relaxed resize-none"
                  />
                </div>

                {/* Word and Character Count with 150-Word Grounding Indicator */}
                <div className="border-t border-white/[0.08] pt-4 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-[13px] text-[#71717a]">
                  <div className="flex items-center gap-2.5">
                    <span>
                      {body.trim() ? body.trim().split(/\s+/).length : 0} words &bull; {body.length} characters
                    </span>
                    {(() => {
                      const words = body.trim() ? body.trim().split(/\s+/).length : 0;
                      if (words > 0 && words < 150) {
                        return (
                          <span className="text-amber-400/90 text-xs bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20 font-medium">
                            {150 - words} more words recommended for optimal reasoning
                          </span>
                        );
                      }
                      if (words >= 150) {
                        return (
                          <span className="text-emerald-400 text-xs bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20 font-medium">
                            ✓ Optimal substance (150+ words)
                          </span>
                        );
                      }
                      return (
                        <span className="text-[#85827b] text-xs">
                          (Min 150 words recommended for optimal reasoning)
                        </span>
                      );
                    })()}
                  </div>
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
                    const isLocked = plat.isPremium;
                    return (
                      <button
                        key={plat.id}
                        type="button"
                        onClick={() => togglePlatform(plat.id)}
                        className={`p-3.5 rounded-xl text-xs sm:text-sm text-left font-medium border transition-all relative cursor-pointer ${
                          isSelected
                            ? "bg-[#d4a373]/15 border-[#d4a373]/40 text-[#d4a373] shadow-sm"
                            : isLocked
                            ? "bg-white/[0.015] border-white/[0.06] text-[#71717a] hover:border-amber-400/30 hover:bg-white/[0.03]"
                            : "bg-white/[0.02] border-white/[0.06] text-[#8a8a93] hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5 truncate">
                            {isLocked && <Lock className="w-3.5 h-3.5 text-amber-400/80 shrink-0" />}
                            <span className="truncate">{plat.label}</span>
                          </div>
                          {isSelected ? (
                            <span className="w-2 h-2 rounded-full bg-[#d4a373] shrink-0" />
                          ) : isLocked ? (
                            <span className="text-[9px] font-mono uppercase tracking-wider text-amber-400 bg-amber-400/10 border border-amber-400/20 px-1.5 py-0.5 rounded shrink-0 flex items-center gap-1">
                              <Lock className="w-2.5 h-2.5" />
                              Locked
                            </span>
                          ) : null}
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
                  </select>
                </div>

                <div>
                  <label className="block text-xs sm:text-[13px] font-mono text-[#85827b] mb-2">Source Type</label>
                  <select
                    value={contentType}
                    onChange={(e) => setContentType(e.target.value)}
                    className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] outline-none cursor-pointer focus:border-[#d4a373]/60"
                  >
                    <option value="article">Long-Form Article</option>
                    <option value="podcast_transcript">Podcast / Audio Transcript</option>
                    <option value="youtube_video">YouTube Video Script</option>
                    <option value="changelog">Product Changelog / Release</option>
                    <option value="press_release">Press Release</option>
                  </select>
                </div>
              </div>
            </ScrollReveal>
          </div>
        </div>

        {/* Version History Modal */}
        {showVersions && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
            <div className="hirael-card p-6 rounded-2xl max-w-lg w-full space-y-4 max-h-[80vh] flex flex-col">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <h3 className="font-semibold text-[#ede8df] text-base">Version History</h3>
                <button
                  onClick={() => setShowVersions(false)}
                  className="text-xs text-[#8a8a93] hover:text-[#ede8df]"
                >
                  Close
                </button>
              </div>

              <div className="overflow-y-auto space-y-3 flex-1">
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

        {/* Premium Upgrade Modal for Instagram, Threads, and Twitter */}
        {showUpgradeModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
            <div className="w-full max-w-md rounded-[28px] bg-[#0e0e11] border border-amber-400/30 p-6 sm:p-7 shadow-2xl relative">
              <button
                onClick={() => setShowUpgradeModal(false)}
                className="absolute top-5 right-5 w-8 h-8 rounded-full bg-white/[0.06] hover:bg-white/[0.12] text-[#8a8a93] hover:text-[#ede8df] flex items-center justify-center transition-colors"
              >
                <CloseIcon className="w-4 h-4" />
              </button>

              <div className="text-center space-y-3 mb-6 pr-6">
                <div className="w-12 h-12 rounded-2xl bg-amber-400/10 text-amber-400 border border-amber-400/20 flex items-center justify-center mx-auto shadow-inner">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-semibold text-[#ede8df]">Premium Omnichannel Feature</h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Syndication to <strong className="text-[#ede8df]">Instagram</strong>, <strong className="text-[#ede8df]">Threads</strong>, and <strong className="text-[#ede8df]">X (Twitter)</strong> are reserved for Lisa Pro &amp; Enterprise workspaces.
                </p>
              </div>

              <div className="space-y-2.5 p-3.5 rounded-2xl bg-black/40 border border-white/[0.06] text-xs mb-6">
                <div className="flex items-center gap-2 text-[#ede8df]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Instagram:</strong> Automated multi-slide carousels &amp; Reels storyboards</span>
                </div>
                <div className="flex items-center gap-2 text-[#ede8df]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>Threads:</strong> Conversational micro-blogging &amp; viral community hooks</span>
                </div>
                <div className="flex items-center gap-2 text-[#ede8df]">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <span><strong>X (Twitter):</strong> 280-char technical hooks &amp; multi-tweet thread trees</span>
                </div>
              </div>

              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 text-center space-y-1">
                  <div className="font-semibold text-amber-300 flex items-center justify-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" />
                    <span>Payment Gateway Coming Soon</span>
                  </div>
                  <p className="text-[#8a8a93] text-[11.5px] leading-relaxed">
                    Direct syndication to Instagram, Threads, and X is a paid Pro feature. Free preview is not available; paid checkout will be integrated soon.
                  </p>
                </div>

                <InteractiveButton
                  onClick={() => setShowUpgradeModal(false)}
                  variant="secondary"
                  size="md"
                  magnetic
                  className="w-full py-2.5 justify-center text-xs sm:text-sm font-medium"
                >
                  Got It (Keep Standard Channels)
                </InteractiveButton>
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
