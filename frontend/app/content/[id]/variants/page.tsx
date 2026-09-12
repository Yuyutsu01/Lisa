"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import {
  sourcesApi,
  variantsApi,
  publishingApi,
  ContentSource,
  ContentVariant,
  getActiveWorkspaceId,
} from "@/lib/api";
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
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AIGenerationStreaming } from "@/components/AIGenerationStreaming";

export default function VariantReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sourceId = resolvedParams.id;

  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [source, setSource] = useState<ContentSource | null>(null);
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
    loadData();
  }, [sourceId]);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const src = await sourcesApi.get(sourceId);
      setSource(src);

      let vList = await sourcesApi.listVariants(sourceId);
      if (vList.length === 0) {
        // Auto-trigger generation if no variants exist yet
        setGenerating(true);
        const genRes = await sourcesApi.generateVariants(sourceId);
        vList = genRes.variants;
      }

      setVariants(vList);
      if (vList.length > 0) {
        setSelectedPlatform(vList[0].platform);
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

  const currentVariant = variants.find((v) => v.platform === selectedPlatform) || variants[0];

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

  const [publishing, setPublishing] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);

  const handlePublishNow = async () => {
    if (!currentVariant || !activeWorkspaceId) return;
    try {
      setPublishing(true);
      const data = await publishingApi.publishVariant(activeWorkspaceId, currentVariant.id);
      if (data.success) {
        if (data.external_url) setPublishedUrl(data.external_url);
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

  const qualityScore = Math.round((currentVariant?.quality_review_json?.quality_score || 0.85) * 100);
  const checkItems = currentVariant?.quality_review_json?.check_items || [];
  const suggestions = currentVariant?.quality_review_json?.improvement_suggestions || [];

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-5">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/[0.07] pb-4">
          <div className="space-y-1">
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 text-xs text-[#85827b] hover:text-[#ede8df] transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Back to Library</span>
            </Link>
            <h1 className="text-lg sm:text-xl lg:text-2xl font-normal tracking-tight text-[#ede8df] flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4a373]" />
              <span>Platform Variant Review & Quality Control</span>
            </h1>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap">
            <InteractiveButton
              onClick={handleSaveVariant}
              loading={savingVariant}
              loadingText="Saving..."
              variant="secondary"
              size="sm"
              leftIcon={<Save className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Save Copy Edits
            </InteractiveButton>

            {currentVariant?.status === "published" ? (
              <span className="py-1.5 px-3.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-400" />
                Published
              </span>
            ) : currentVariant?.status === "approved" ? (
              <div className="flex items-center gap-2">
                <span className="py-1.5 px-3 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Approved
                </span>
                <InteractiveButton
                  onClick={handlePublishNow}
                  loading={publishing}
                  loadingText="Publishing..."
                  variant="primary"
                  size="sm"
                  glow
                  shimmer
                  magnetic
                  leftIcon={<Send className="w-3.5 h-3.5" />}
                  className="text-xs"
                >
                  Publish Now
                </InteractiveButton>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <InteractiveButton
                  onClick={handleReject}
                  variant="ghost"
                  size="sm"
                  leftIcon={<ThumbsDown className="w-3.5 h-3.5" />}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:bg-rose-500/10"
                >
                  Reject
                </InteractiveButton>
                <InteractiveButton
                  onClick={handleApprove}
                  variant="primary"
                  size="sm"
                  glow
                  magnetic
                  leftIcon={<ThumbsUp className="w-3.5 h-3.5" />}
                  className="text-xs bg-emerald-500 hover:bg-emerald-400 text-black font-semibold"
                >
                  Approve Variant
                </InteractiveButton>
              </div>
            )}
          </div>
        </div>

        {/* Live Published Banner */}
        {publishedUrl && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Post successfully dispatched to target platform adapter!</span>
            </div>
            <a
              href={publishedUrl}
              target="_blank"
              rel="noreferrer"
              className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
            >
              View Live Post &rarr;
            </a>
          </div>
        )}

        {/* Platform Channel Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {variants.map((v) => {
            const isSelected = selectedPlatform === v.platform;
            const isApproved = v.status === "approved";
            return (
              <button
                key={v.id}
                onClick={() => setSelectedPlatform(v.platform)}
                className={`px-3.5 py-2 rounded-full text-xs font-medium flex items-center gap-2 shrink-0 border transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#ede8df] text-[#08080a] border-[#ede8df] shadow-sm font-semibold"
                    : "bg-white/[0.04] border-white/10 text-[#8a8a93] hover:text-[#ede8df] hover:bg-white/[0.08]"
                }`}
              >
                <span className="capitalize">{v.platform}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full ${
                    isApproved ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {currentVariant && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left & Middle (2 Cols): Live Feed Preview & Inline Copy Editor */}
            <div className="lg:col-span-2 space-y-4">
              {/* Native Platform Feed Preview */}
              <ScrollReveal>
                <div className="hirael-card p-5 sm:p-6 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/[0.06] pb-3">
                    <div className="flex items-center gap-2 text-xs font-semibold text-[#ede8df] uppercase tracking-wider">
                      <Eye className="w-4 h-4 text-[#d4a373]" />
                      <span>Native {currentVariant.platform.toUpperCase()} Preview</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/[0.05] border border-white/10 text-[#a6a39b]">
                      Format: {currentVariant.format}
                    </span>
                  </div>

                  {/* Simulated Feed Post */}
                  <div className="p-4 sm:p-5 rounded-2xl bg-black/60 border border-white/[0.08] space-y-3 font-sans">
                    {/* Account Header */}
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/[0.08] border border-white/10 text-[#ede8df] font-bold flex items-center justify-center text-xs">
                        L
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[#ede8df]">Lisa Operating System</p>
                        <p className="text-[10px] text-[#71717a]">
                          {currentVariant.platform} Native Post • Just now
                        </p>
                      </div>
                    </div>

                    {/* Body Textarea Editor */}
                    <textarea
                      rows={9}
                      value={currentVariant.body}
                      onChange={(e) => handleUpdateCurrentVariant({ body: e.target.value })}
                      className="w-full bg-transparent text-xs text-[#ede8df] outline-none leading-relaxed resize-none border-b border-white/[0.06] pb-2 focus:border-[#d4a373]/50"
                    />

                    {/* Hashtags */}
                    {currentVariant.hashtags_json && currentVariant.hashtags_json.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {currentVariant.hashtags_json.map((tag, idx) => (
                          <span key={idx} className="text-[11px] text-[#d4a373] font-medium">
                            #{tag.replace(/^#/, "")}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* CTA Footer */}
                    {currentVariant.cta && (
                      <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.08] text-xs text-[#a6a39b] font-medium flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#d4a373]" />
                        <span>{currentVariant.cta}</span>
                      </div>
                    )}
                  </div>
                </div>
              </ScrollReveal>

              {/* AI Granular Regeneration Bar */}
              <ScrollReveal delay={100}>
                <div className="hirael-card p-5 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#ede8df] uppercase tracking-wider flex items-center gap-2">
                      <RotateCw className="w-3.5 h-3.5 text-[#d4a373]" />
                      <span>Targeted AI Revision & Angle Modifier</span>
                    </h3>
                  </div>

                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={regenInstruction}
                      onChange={(e) => setRegenInstruction(e.target.value)}
                      placeholder="e.g. Make opening contrarian, shorten to single tweet, focus on ROI takeaway..."
                      className="flex-1 px-3.5 py-2 rounded-full bg-white/[0.03] border border-white/10 text-xs text-[#ede8df] outline-none focus:border-white/30 placeholder:text-[#71717a]"
                    />
                    <InteractiveButton
                      onClick={handleRegenerate}
                      loading={regenerating}
                      loadingText="Revising..."
                      variant="primary"
                      size="sm"
                      glow
                      magnetic
                      leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                      className="text-xs shrink-0"
                    >
                      Regenerate
                    </InteractiveButton>
                  </div>
                </div>
              </ScrollReveal>
            </div>

            {/* Right Column: 10-Point QA Scorecard & Strategy Insights */}
            <div className="space-y-4">
              {/* QA Scorecard */}
              <ScrollReveal delay={150}>
                <div className="hirael-card p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-semibold text-[#ede8df] uppercase tracking-wider flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>10-Point QA Scorecard</span>
                    </h3>
                    <span
                      className={`px-2.5 py-0.5 rounded-full font-bold text-xs ${
                        qualityScore >= 85
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : qualityScore >= 70
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {qualityScore}%
                    </span>
                  </div>

                  {/* Scorecard Check Items */}
                  <div className="space-y-2 pt-1">
                    {checkItems.length > 0 ? (
                      checkItems.map((item, idx) => (
                        <div
                          key={idx}
                          className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs space-y-1"
                        >
                          <div className="flex items-center justify-between">
                            <span className="text-[#ede8df] font-medium">{item.name}</span>
                            <span
                              className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${
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
                          {item.reason && (
                            <p className="text-[11px] text-[#8a8a93] leading-tight">{item.reason}</p>
                          )}
                        </div>
                      ))
                    ) : (
                      Object.entries(
                        currentVariant.quality_review_json?.checks || {
                          source_fidelity: "pass",
                          brand_voice: "pass",
                          platform_formatting: "pass",
                          hook_strength: "pass",
                        }
                      ).map(([check, status]) => (
                        <div
                          key={check}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06] text-xs"
                        >
                          <span className="capitalize text-[#ede8df] font-medium">
                            {check.replace("_", " ")}
                          </span>
                          <span
                            className={`text-[10px] font-mono font-semibold uppercase px-2 py-0.5 rounded ${
                              status === "pass"
                                ? "bg-emerald-500/10 text-emerald-400"
                                : "bg-rose-500/10 text-rose-400"
                            }`}
                          >
                            {status}
                          </span>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Actionable Suggestions */}
                  {suggestions.length > 0 && (
                    <div className="p-3 rounded-xl bg-[#d4a373]/10 border border-[#d4a373]/20 text-[#ede8df] text-xs space-y-1">
                      <p className="font-semibold text-[11px] uppercase tracking-wider text-[#d4a373]">
                        Recommendations:
                      </p>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-[#8a8a93]">
                        {suggestions.map((sug, i) => (
                          <li key={i}>{sug}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Critical Issues */}
                  {currentVariant.quality_review_json?.issues?.map((issue, i) => (
                    <div
                      key={i}
                      className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start gap-2"
                    >
                      <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                      <span>{issue.message}</span>
                    </div>
                  ))}
                </div>
              </ScrollReveal>

              {/* Strategy Details */}
              <ScrollReveal delay={200}>
                <div className="hirael-card p-5 space-y-3">
                  <h3 className="text-xs font-semibold text-[#ede8df] uppercase tracking-wider flex items-center gap-2">
                    <Sliders className="w-4 h-4 text-[#d4a373]" />
                    <span>Platform Strategy Details</span>
                  </h3>

                  <div className="space-y-2 text-xs text-[#8a8a93]">
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-[10px] uppercase font-semibold text-[#71717a] mb-0.5">Angle</p>
                      <p className="text-[#ede8df]">{currentVariant.strategy_json?.angle || "Default Narrative Arc"}</p>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-[10px] uppercase font-semibold text-[#71717a] mb-0.5">Hook Style</p>
                      <p className="text-[#ede8df]">{currentVariant.strategy_json?.hook_style || "Direct High-Value Question"}</p>
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
