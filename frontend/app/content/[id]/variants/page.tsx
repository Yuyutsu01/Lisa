"use client";

import { useEffect, useState, use, useMemo } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import {
  sourcesApi,
  variantsApi,
  publishingApi,
  brandApi,
  ContentSource,
  ContentVariant,
  BrandProfile,
  getActiveWorkspaceId,
} from "@/lib/api";
import { calculateQAScorecard } from "@/lib/qa-scorecard";
import {
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  RotateCw,
  ThumbsUp,
  ThumbsDown,
  ArrowLeft,
  Save,
  Send,
  Eye,
  Sliders,
  Check,
  ShieldAlert,
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AIGenerationStreaming } from "@/components/AIGenerationStreaming";

const PLATFORM_LABELS: Record<string, string> = {
  linkedin: "LinkedIn",
  x: "X (Twitter)",
  instagram: "Instagram",
  discord: "Discord Community",
  youtube: "YouTube Shorts",
  threads: "Threads",
  email: "Newsletter / Email",
  blog: "Blog CMS",
};

export default function VariantReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sourceId = resolvedParams.id;

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [source, setSource] = useState<ContentSource | null>(null);
  const [brandProfile, setBrandProfile] = useState<BrandProfile | null>(null);
  const [variants, setVariants] = useState<ContentVariant[]>([]);
  const [selectedPlatform, setSelectedPlatform] = useState<string>("linkedin");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [savingVariant, setSavingVariant] = useState(false);

  // Regeneration state
  const [regenInstruction, setRegenInstruction] = useState("");
  const [regenerating, setRegenerating] = useState(false);

  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    loadData(wsId);
  }, [sourceId]);

  const deduplicateVariants = (list: ContentVariant[]): ContentVariant[] => {
    const map = new Map<string, ContentVariant>();
    for (const v of list) {
      const existing = map.get(v.platform);
      if (!existing) {
        map.set(v.platform, v);
      } else {
        // Prioritize published > approved > newest variant
        if (v.status === "published" || (v.status === "approved" && existing.status !== "published")) {
          map.set(v.platform, v);
        }
      }
    }
    return Array.from(map.values());
  };

  const loadData = async (wsId?: string | null) => {
    try {
      setLoading(true);
      setLoadError(null);
      const [src, bp] = await Promise.all([
        sourcesApi.get(sourceId),
        wsId ? brandApi.getProfile(wsId).catch(() => null) : Promise.resolve(null),
      ]);
      setSource(src);
      if (bp) setBrandProfile(bp);

      let vList = await sourcesApi.listVariants(sourceId);
      if (vList.length === 0) {
        // Auto-trigger generation if no variants exist yet
        setGenerating(true);
        const genRes = await sourcesApi.generateVariants(sourceId);
        vList = genRes.variants;
      }

      const cleanList = deduplicateVariants(vList);
      setVariants(cleanList);
      if (cleanList.length > 0) {
        setSelectedPlatform(cleanList[0].platform);
      }
    } catch (err: unknown) {
      console.error("Failed to load variants", err);
      const msg = err instanceof Error ? err.message : "Failed to load content source and variants.";
      setLoadError(msg);
    } finally {
      setLoading(false);
      setGenerating(false);
    }
  };

  const uniqueVariants = deduplicateVariants(variants);
  const currentVariant = uniqueVariants.find((v) => v.platform === selectedPlatform) || uniqueVariants[0];

  const handleUpdateCurrentVariant = (fields: Partial<ContentVariant>) => {
    if (!currentVariant) return;
    setVariants(
      variants.map((v) => (v.id === currentVariant.id ? { ...v, ...fields } : v))
    );
  };

  const handleSaveVariant = async () => {
    if (!currentVariant) return;
    try {
      setSavingVariant(true);
      const updated = await variantsApi.update(currentVariant.id, {
        title: currentVariant.title,
        body: currentVariant.body,
        caption: currentVariant.caption,
        cta: currentVariant.cta,
        hashtags_json: currentVariant.hashtags_json,
      });
      setVariants(variants.map((v) => (v.id === updated.id ? updated : v)));
    } catch (err) {
      console.error("Failed to save variant", err);
    } finally {
      setSavingVariant(false);
    }
  };

  const handleRegenerate = async () => {
    if (!currentVariant) return;
    try {
      setRegenerating(true);
      const regenerated = await variantsApi.regenerate(currentVariant.id, {
        instruction: regenInstruction,
      });
      setVariants(variants.map((v) => (v.id === regenerated.id ? regenerated : v)));
      setRegenInstruction("");
    } catch (err) {
      console.error("Regeneration failed", err);
    } finally {
      setRegenerating(false);
    }
  };

  // View mode: 'preview' (Native Feed) vs 'edit' (Full Editor)
  const [viewMode, setViewMode] = useState<"preview" | "edit">("preview");
  const [showCanonicalSource, setShowCanonicalSource] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [publishedUrls, setPublishedUrls] = useState<Record<string, string>>({});

  const handlePublishNow = async () => {
    if (!currentVariant || !activeWorkspaceId) return;
    try {
      setPublishing(true);
      const data = await publishingApi.publishVariant(activeWorkspaceId, currentVariant.id);
      if (data.success) {
        if (data.external_url) {
          setPublishedUrls((prev) => ({ ...prev, [currentVariant.id]: data.external_url! }));
        }
        setVariants(
          variants.map((v) =>
            v.id === currentVariant.id ? { ...v, status: "published" } : v
          )
        );
      }
    } catch (e: unknown) {
      console.error("Publishing request failed", e);
      const msg = e instanceof Error ? e.message : "Failed to publish variant.";
      alert(msg);
    } finally {
      setPublishing(false);
    }
  };

  const handleApprove = async () => {
    if (!currentVariant) return;
    try {
      const approved = await variantsApi.approve(currentVariant.id);
      setVariants(variants.map((v) => (v.id === approved.id ? approved : v)));
    } catch (err) {
      console.error("Approval failed", err);
    }
  };

  const handleReject = async () => {
    if (!currentVariant) return;
    const reason = prompt("Enter feedback or rejection reason:");
    if (!reason) return;

    try {
      const rejected = await variantsApi.reject(currentVariant.id, reason);
      setVariants(variants.map((v) => (v.id === rejected.id ? rejected : v)));
    } catch (err) {
      console.error("Rejection failed", err);
    }
  };

  if (loadError) {
    return (
      <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
        <div className="max-w-xl mx-auto py-16 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/20">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-base sm:text-lg font-semibold text-[#ede8df]">Unable to load Content Source</h2>
          <p className="text-xs text-[#8a8a93]">{loadError}</p>
          <div className="pt-2">
            <Link href="/library">
              <InteractiveButton
                variant="secondary"
                size="sm"
                leftIcon={<ArrowLeft className="w-3.5 h-3.5" />}
              >
                Return to Content Library
              </InteractiveButton>
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading || generating) {
    return (
      <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
        <div className="max-w-3xl mx-auto py-10">
          <AIGenerationStreaming
            generating={true}
            platform={selectedPlatform}
            sourceTitle={source?.title || "Canonical Source"}
          />
        </div>
      </AppLayout>
    );
  }

  // Live deterministic 10-point QA Scorecard & Checklist calculation
  const scorecard = useMemo(() => {
    return calculateQAScorecard(currentVariant, source, brandProfile);
  }, [currentVariant, source, brandProfile]);

  const qualityScore = scorecard.quality_score;
  const checkItems = scorecard.check_items;
  const suggestions = scorecard.suggestions;
  const criticalIssues = scorecard.issues;

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 border-b border-white/[0.08] pb-6">
          <div className="space-y-1.5">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 text-xs sm:text-sm text-[#85827b] hover:text-[#ede8df] transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Library</span>
            </Link>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#ede8df] flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-[#d4a373]" />
              <span>Platform Variant Review &amp; Quality Control</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <InteractiveButton
              onClick={() => setShowCanonicalSource(!showCanonicalSource)}
              variant="secondary"
              size="md"
              leftIcon={<Eye className="w-4 h-4 text-[#d4a373]" />}
              className="px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-medium"
            >
              {showCanonicalSource ? "Hide Canonical Input" : "Inspect Canonical Input"}
            </InteractiveButton>

            <InteractiveButton
              onClick={handleSaveVariant}
              loading={savingVariant}
              loadingText="Saving..."
              variant="secondary"
              size="md"
              leftIcon={<Save className="w-4 h-4" />}
              className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold"
            >
              Save Copy Edits
            </InteractiveButton>

            {currentVariant?.status === "published" ? (
              <span className="py-2.5 px-5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400" />
                Published
              </span>
            ) : currentVariant?.status === "approved" ? (
              <div className="flex items-center gap-2.5">
                <span className="py-2.5 px-4 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs sm:text-sm font-semibold flex items-center gap-2">
                  <Check className="w-4 h-4 text-emerald-400" />
                  Approved
                </span>
                <InteractiveButton
                  onClick={handlePublishNow}
                  loading={publishing}
                  loadingText="Publishing..."
                  variant="primary"
                  size="md"
                  glow
                  shimmer
                  magnetic
                  leftIcon={<Send className="w-4 h-4" />}
                  className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-semibold"
                >
                  Publish Now
                </InteractiveButton>
              </div>
            ) : (
              <div className="flex items-center gap-2.5">
                <InteractiveButton
                  onClick={handleReject}
                  variant="ghost"
                  size="md"
                  leftIcon={<ThumbsDown className="w-4 h-4" />}
                  className="text-xs sm:text-sm text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 px-4 py-2.5 sm:py-3"
                >
                  Reject
                </InteractiveButton>
                <InteractiveButton
                  onClick={handleApprove}
                  variant="primary"
                  size="md"
                  glow
                  magnetic
                  leftIcon={<ThumbsUp className="w-4 h-4" />}
                  className="px-6 py-2.5 sm:py-3 text-xs sm:text-sm bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                >
                  Approve Variant
                </InteractiveButton>
              </div>
            )}
          </div>
        </div>

        {/* Canonical Source Drawer (When expanded) */}
        {showCanonicalSource && source && (
          <ScrollReveal delay={0}>
            <div className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-[#0a0a0d] border border-[#d4a373]/30 shadow-2xl space-y-4 relative">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
                <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-[#d4a373]">
                  <Sparkles className="w-4 h-4" />
                  <span>Original Canonical Source Input (What agents ingested)</span>
                </div>
                <button
                  onClick={() => setShowCanonicalSource(false)}
                  className="text-xs text-[#8a8a93] hover:text-[#ede8df]"
                >
                  ✕ Close
                </button>
              </div>
              <h2 className="text-lg sm:text-xl font-medium text-[#ede8df]">{source.title}</h2>
              <div className="p-4 rounded-xl bg-black/50 border border-white/[0.06] text-xs sm:text-sm text-[#a6a39b] leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto font-mono">
                {source.body}
              </div>
              <div className="flex items-center gap-4 text-xs text-[#71717a] font-mono">
                <span>Pillar: <strong className="text-[#ede8df]">{source.content_pillar || "General"}</strong></span>
                <span>&bull;</span>
                <span>Type: <strong className="text-[#ede8df]">{source.content_type || "Article"}</strong></span>
                <span>&bull;</span>
                <span>Length: <strong className="text-[#ede8df]">{source.body.length} chars</strong></span>
              </div>
            </div>
          </ScrollReveal>
        )}

        {/* Live Published Banner (Only displayed when the currently selected variant is published) */}
        {currentVariant?.status === "published" && (
          <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-2.5 text-emerald-300 text-xs sm:text-sm font-medium">
              <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong className="capitalize">{PLATFORM_LABELS[currentVariant.platform] || currentVariant.platform}</strong> post successfully dispatched to target platform adapter!
              </span>
            </div>
            {publishedUrls[currentVariant.id] && (
              <a
                href={publishedUrls[currentVariant.id]}
                target="_blank"
                rel="noreferrer"
                className="text-xs sm:text-sm font-semibold text-emerald-400 hover:underline flex items-center gap-1.5"
              >
                View Live Post &rarr;
              </a>
            )}
          </div>
        )}

        {/* Platform Channel Tabs */}
        <div className="flex items-center justify-between gap-4 border-b border-white/[0.06] pb-3 flex-wrap">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {uniqueVariants.map((v) => {
              const isSelected = selectedPlatform === v.platform;
              const isApproved = v.status === "approved";
              const isPublished = v.status === "published";
              const platformName = PLATFORM_LABELS[v.platform] || v.platform;
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedPlatform(v.platform)}
                  className={`px-4 sm:px-5 py-2.5 rounded-full text-xs sm:text-sm font-medium flex items-center gap-2.5 shrink-0 border transition-all cursor-pointer ${
                    isSelected
                      ? "bg-[#ede8df] text-[#08080a] border-[#ede8df] shadow-sm font-semibold"
                      : "bg-white/[0.04] border-white/10 text-[#8a8a93] hover:text-[#ede8df] hover:bg-white/[0.08]"
                  }`}
                >
                  <span>{platformName}</span>
                  <span
                    className={`w-2 h-2 rounded-full ${
                      isPublished
                        ? "bg-blue-400"
                        : isApproved
                        ? "bg-emerald-500"
                        : "bg-amber-400"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Preview vs Full Edit */}
          <div className="flex items-center gap-1.5 bg-[#0a0a0d] p-1 rounded-full border border-white/[0.08]">
            <button
              onClick={() => setViewMode("preview")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewMode === "preview"
                  ? "bg-[#ede8df] text-[#09090b] font-semibold"
                  : "text-[#85827b] hover:text-[#ede8df]"
              }`}
            >
              Native Preview
            </button>
            <button
              onClick={() => setViewMode("edit")}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                viewMode === "edit"
                  ? "bg-[#ede8df] text-[#09090b] font-semibold"
                  : "text-[#85827b] hover:text-[#ede8df]"
              }`}
            >
              Full Editor
            </button>
          </div>
        </div>

        {currentVariant && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left & Middle (2 Cols): Live Feed Preview & Full Copy Display */}
            <div className="lg:col-span-2 space-y-6">
              <ScrollReveal>
                <div className="hirael-card p-6 sm:p-7 lg:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
                  {/* Card Header with Format Badge */}
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                    <div className="flex items-center gap-2.5 text-xs sm:text-sm font-semibold text-[#ede8df] uppercase tracking-wider">
                      <Eye className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                      <span>{(PLATFORM_LABELS[currentVariant.platform] || currentVariant.platform).toUpperCase()} Complete Adapted Content</span>
                    </div>
                    <span className="text-xs font-mono px-3 py-1 rounded-full bg-white/[0.05] border border-white/10 text-[#a6a39b]">
                      Format: {currentVariant.format}
                    </span>
                  </div>

                  {/* Mode 1: Native Simulated Feed Reader (Full height, styled, no truncation) */}
                  {viewMode === "preview" && (
                    <div className="p-6 sm:p-7 rounded-2xl sm:rounded-3xl bg-black/60 border border-white/[0.08] space-y-5 font-sans">
                      {/* Account Header */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3.5">
                          <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#d4a373]/40 to-white/10 border border-white/10 text-[#ede8df] font-bold flex items-center justify-center text-sm">
                            L
                          </div>
                          <div>
                            <p className="text-sm sm:text-base font-semibold text-[#ede8df]">Lisa Operating System</p>
                            <p className="text-xs text-[#71717a] font-mono">
                              {PLATFORM_LABELS[currentVariant.platform] || currentVariant.platform} Native Post &bull; {currentVariant.format}
                            </p>
                          </div>
                        </div>
                        <span className="text-xs font-mono text-[#d4a373] bg-[#d4a373]/10 px-3 py-1 rounded-full border border-[#d4a373]/20">
                          {currentVariant.body.length} Characters
                        </span>
                      </div>

                      {/* Title / Headline (If present) */}
                      {currentVariant.title && (
                        <h3 className="text-base sm:text-lg font-semibold text-[#ede8df] tracking-tight border-b border-white/[0.06] pb-3">
                          {currentVariant.title}
                        </h3>
                      )}

                      {/* Caption / Hook (If present) */}
                      {currentVariant.caption && currentVariant.caption !== currentVariant.title && (
                        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs sm:text-sm text-[#d4a373] font-medium leading-relaxed">
                          <span className="text-[10px] font-mono uppercase text-[#85827b] block mb-0.5">Hook Teaser:</span>
                          {currentVariant.caption}
                        </div>
                      )}

                      {/* Full Formatted Body Text (Multi-paragraph, complete height, no scroll cutoffs) */}
                      <div className="text-xs sm:text-sm lg:text-[15px] text-[#ede8df] leading-relaxed whitespace-pre-wrap font-sans py-2 space-y-3">
                        {currentVariant.body}
                      </div>

                      {/* Hashtags */}
                      {currentVariant.hashtags_json && currentVariant.hashtags_json.length > 0 && (
                        <div className="flex flex-wrap gap-2 pt-2 border-t border-white/[0.06]">
                          {currentVariant.hashtags_json.map((tag, idx) => (
                            <span key={idx} className="text-xs sm:text-[13px] text-[#d4a373] font-medium font-mono">
                              #{tag.replace(/^#/, "")}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* CTA Footer Block */}
                      {currentVariant.cta && (
                        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] font-medium flex items-center gap-3">
                          <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373] shrink-0" />
                          <span><strong>Call to Action:</strong> {currentVariant.cta}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Mode 2: Full Interactive Copy Editor */}
                  {viewMode === "edit" && (
                    <div className="space-y-5">
                      <div>
                        <label className="block text-xs font-mono text-[#85827b] mb-2">Variant Title / Headline</label>
                        <input
                          type="text"
                          value={currentVariant.title || ""}
                          onChange={(e) => handleUpdateCurrentVariant({ title: e.target.value })}
                          className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] outline-none focus:border-[#d4a373]/60"
                          placeholder="Platform specific headline..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-[#85827b] mb-2">Caption / Hook</label>
                        <input
                          type="text"
                          value={currentVariant.caption || ""}
                          onChange={(e) => handleUpdateCurrentVariant({ caption: e.target.value })}
                          className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] outline-none focus:border-[#d4a373]/60"
                          placeholder="Short social hook..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-[#85827b] mb-2">
                          Main Body Content ({currentVariant.body.length} chars)
                        </label>
                        <textarea
                          rows={16}
                          value={currentVariant.body}
                          onChange={(e) => handleUpdateCurrentVariant({ body: e.target.value })}
                          className="w-full p-4 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] outline-none leading-relaxed focus:border-[#d4a373]/60"
                          placeholder="Complete adapted copy..."
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-mono text-[#85827b] mb-2">Call to Action (CTA)</label>
                        <input
                          type="text"
                          value={currentVariant.cta || ""}
                          onChange={(e) => handleUpdateCurrentVariant({ cta: e.target.value })}
                          className="w-full px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/[0.08] text-xs sm:text-sm text-[#ede8df] outline-none focus:border-[#d4a373]/60"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* AI Granular Regeneration Bar */}
              <ScrollReveal delay={100}>
                <div className="hirael-card p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs sm:text-sm font-semibold text-[#ede8df] uppercase tracking-wider flex items-center gap-2.5">
                      <RotateCw className="w-4 h-4 text-[#d4a373]" />
                      <span>Targeted AI Revision &amp; Angle Modifier</span>
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={regenInstruction}
                      onChange={(e) => setRegenInstruction(e.target.value)}
                      placeholder="e.g. Make opening contrarian, shorten to single tweet, focus on ROI takeaway..."
                      className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs sm:text-sm text-[#ede8df] outline-none focus:border-[#d4a373]/60 placeholder:text-[#71717a]"
                    />
                    <InteractiveButton
                      onClick={handleRegenerate}
                      loading={regenerating}
                      loadingText="Revising..."
                      variant="primary"
                      size="md"
                      glow
                      magnetic
                      leftIcon={<Sparkles className="w-4 h-4" />}
                      className="px-5 py-2.5 sm:py-3 text-xs sm:text-sm shrink-0 font-medium"
                    >
                      Regenerate
                    </InteractiveButton>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: 10-Point QA Scorecard & Strategy Insights */}
            <div className="space-y-6">
              {/* QA Scorecard */}
              <ScrollReveal delay={150}>
                <div className="hirael-card p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-5">
                  <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
                    <div className="flex items-center gap-2.5">
                      <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
                      <div>
                        <h3 className="text-xs sm:text-sm font-semibold text-[#ede8df] uppercase tracking-wider">
                          10-Point QA Scorecard
                        </h3>
                        <p className="text-[11px] text-[#71717a] font-mono">Live Deterministic Audit</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-block px-3 py-1 rounded-full font-bold text-xs sm:text-sm ${
                          qualityScore >= 85
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : qualityScore >= 70
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                            : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        }`}
                      >
                        {qualityScore} / 100
                      </span>
                    </div>
                  </div>

                  {/* Scorecard Check Items (All 10 points) */}
                  <div className="space-y-2 pt-1 max-h-[420px] overflow-y-auto pr-1">
                    {checkItems.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1.5 hover:border-white/[0.12] transition-colors"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-[#ede8df] font-medium truncate">{item.name}</span>
                            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.04] text-[#8a8a93] uppercase shrink-0">
                              {item.category}
                            </span>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            <span className="text-xs font-semibold text-[#ede8df]">{item.score}/10</span>
                            <span
                              className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                item.status === "pass"
                                  ? "bg-emerald-500/10 text-emerald-400"
                                  : item.status === "warning"
                                  ? "bg-amber-500/10 text-amber-400"
                                  : "bg-rose-500/10 text-rose-400"
                              }`}
                            >
                              {item.status}
                            </span>
                          </div>
                        </div>
                        {item.reason && (
                          <p className="text-[11.5px] text-[#8a8a93] leading-relaxed">{item.reason}</p>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Critical Issues */}
                  {criticalIssues.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-white/[0.06]">
                      <p className="text-[11px] uppercase font-mono font-semibold text-rose-400 flex items-center gap-1.5">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        <span>Compliance Issues ({criticalIssues.length})</span>
                      </p>
                      {criticalIssues.map((issue, i) => (
                        <div
                          key={i}
                          className={`p-3 rounded-xl text-xs flex items-start gap-2.5 ${
                            issue.severity === "critical"
                              ? "bg-rose-500/10 border border-rose-500/20 text-rose-300"
                              : "bg-amber-500/10 border border-amber-500/20 text-amber-300"
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{issue.message}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Actionable Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="p-3.5 rounded-xl bg-[#d4a373]/10 border border-[#d4a373]/20 text-[#ede8df] text-xs space-y-1.5">
                      <p className="font-semibold text-xs uppercase tracking-wider text-[#d4a373] flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Actionable Improvements:</span>
                      </p>
                      <ul className="list-disc list-inside space-y-1 text-[11.5px] text-[#ede8df]/80">
                        {suggestions.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </ScrollReveal>

              {/* Strategy Details */}
              <ScrollReveal delay={200}>
                <div className="hirael-card p-6 sm:p-7 rounded-2xl sm:rounded-3xl space-y-4">
                  <h3 className="text-xs sm:text-sm font-semibold text-[#ede8df] uppercase tracking-wider flex items-center gap-2.5">
                    <Sliders className="w-4 h-4 text-[#d4a373]" />
                    <span>Platform Strategy Details</span>
                  </h3>

                  <div className="space-y-2.5 text-xs sm:text-sm text-[#8a8a93]">
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs uppercase font-semibold text-[#71717a] mb-1 font-mono">Angle</p>
                      <p className="text-[#ede8df] text-xs sm:text-sm">{currentVariant.strategy_json?.angle || "Default Narrative Arc"}</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-xs uppercase font-semibold text-[#71717a] mb-1 font-mono">Hook Style</p>
                      <p className="text-[#ede8df] text-xs sm:text-sm">{currentVariant.strategy_json?.hook_style || "Direct High-Value Question"}</p>
                    </div>
                  </div>
                </div>
              </ScrollReveal>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
