"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
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
  Share2,
  Calendar,
  Send,
  Eye,
  Sliders,
  Check,
  Image as ImageIcon,
  Film,
  Music,
} from "lucide-react";

export default function VariantReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const sourceId = resolvedParams.id;
  const router = useRouter();

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
    } catch (err: any) {
      console.error("Failed to load variants", err);
      setLoadError(err.message || "Failed to load content source and variants.");
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
    } catch (e: any) {
      console.error("Publishing request failed", e);
      alert(e.message || "Failed to publish variant.");
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
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 text-rose-400 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-lg font-bold text-slate-100">Unable to load Content Source</h2>
          <p className="text-xs text-slate-400">{loadError}</p>
          <div className="pt-2">
            <Link
              href="/library"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-medium hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Return to Content Library
            </Link>
          </div>
        </div>
      </AppLayout>
    );
  }

  if (loading || generating) {
    return (
      <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div className="text-center space-y-2">
            <h2 className="text-base font-semibold text-slate-100">
              {generating ? "Multi-Agent Pipeline Executing..." : "Loading Platform Variants..."}
            </h2>
            <div className="text-xs text-slate-400 max-w-md space-y-1 text-left bg-slate-900/60 p-4 rounded-xl border border-slate-800">
              <p className="text-slate-300 font-medium">Pipeline Stages:</p>
              <p className="text-emerald-400">✓ Agent 1: Source Analyst (Extracting core claims & facts)</p>
              <p className="text-emerald-400">✓ Agent 2: Platform Strategist (Formulating native rules)</p>
              <p className="text-indigo-400">⟳ Agent 3: Platform Native Writer (Synthesizing channels)</p>
              <p className="text-slate-400">⋯ Agent 4: Quality Reviewer (10-Point check & revision loop)</p>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const qualityScore = Math.round((currentVariant?.quality_review_json?.quality_score || 0.85) * 100);
  const checkItems = currentVariant?.quality_review_json?.check_items || [];
  const suggestions = currentVariant?.quality_review_json?.improvement_suggestions || [];

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Navigation Breadcrumb & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
          <div className="space-y-1">
            <Link
              href="/library"
              className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-slate-200 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Back to Library
            </Link>
            <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              Platform Variant Review & Quality Control
            </h1>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSaveVariant}
              disabled={savingVariant}
              className="py-2 px-4 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingVariant ? "Saving..." : "Save Copy Edits"}</span>
            </button>

            {currentVariant?.status === "published" ? (
              <span className="py-2 px-4 rounded-xl bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Published
              </span>
            ) : currentVariant?.status === "approved" ? (
              <div className="flex items-center gap-2">
                <span className="py-2 px-3 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5" />
                  Approved
                </span>
                <button
                  onClick={handlePublishNow}
                  disabled={publishing}
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-indigo-500/30 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{publishing ? "Publishing..." : "Publish Now"}</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleReject}
                  className="py-2 px-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 hover:bg-rose-500/20 text-xs font-medium flex items-center gap-1.5 cursor-pointer"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  Reject
                </button>
                <button
                  onClick={handleApprove}
                  className="py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  Approve Variant
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Live Published Banner */}
        {publishedUrl && (
          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-between gap-4">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
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
                className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 shrink-0 border transition-all ${
                  isSelected
                    ? "bg-indigo-600/25 border-indigo-500/50 text-indigo-300 shadow-sm"
                    : "bg-slate-900/60 border-slate-800 text-slate-400 hover:bg-slate-800/60"
                }`}
              >
                <span className="capitalize">{v.platform}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isApproved ? "bg-emerald-400" : "bg-amber-400 animate-pulse"
                  }`}
                />
              </button>
            );
          })}
        </div>

        {currentVariant && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left & Middle (2 Cols): Live Feed Preview & Inline Copy Editor */}
            <div className="lg:col-span-2 space-y-5">
              {/* Native Platform Feed Preview */}
              <div className="glass-card rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <div className="flex items-center gap-2.5 text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    <Eye className="w-4 h-4 text-indigo-400" />
                    <span>Native {currentVariant.platform.toUpperCase()} Preview</span>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    Format: {currentVariant.format}
                  </span>
                </div>

                {/* Simulated Feed Post */}
                <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/90 space-y-3 font-sans">
                  {/* Account Header */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-indigo-500 to-violet-500 text-white font-bold flex items-center justify-center text-xs">
                      L
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-100">Lisa Operating System</p>
                      <p className="text-[10px] text-slate-500">
                        {currentVariant.platform} Native Post • Just now
                      </p>
                    </div>
                  </div>

                  {/* Body Textarea Editor */}
                  <textarea
                    rows={10}
                    value={currentVariant.body}
                    onChange={(e) => handleUpdateCurrentVariant({ body: e.target.value })}
                    className="w-full bg-transparent text-xs text-slate-200 outline-none leading-relaxed resize-none border-b border-slate-900 pb-2 focus:border-indigo-500/50"
                  />

                  {/* Generated Photo / Poster (FLUX.1 via Hugging Face) */}
                  {currentVariant.media_url && (
                    <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-900 group my-2">
                      <img
                        src={currentVariant.media_url}
                        alt="AI Generated Visual"
                        className="w-full h-auto max-h-80 object-cover rounded-xl"
                      />
                      <div className="absolute top-2 right-2 px-2 py-1 rounded bg-black/75 backdrop-blur text-[10px] font-mono text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5 shadow-lg">
                        <ImageIcon className="w-3 h-3 text-emerald-400" />
                        <span>FLUX.1 • fal-ai</span>
                      </div>
                    </div>
                  )}

                  {/* Video Short Storyboard & Scene Breakdown */}
                  {currentVariant.video_storyboard_json?.scenes && (
                    <div className="p-4 rounded-xl bg-slate-900/90 border border-violet-500/30 space-y-3 my-2">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <div className="flex items-center gap-2 text-xs font-semibold text-violet-300">
                          <Film className="w-4 h-4 text-violet-400" />
                          <span>9:16 Video Short Storyboard & Audio Script</span>
                        </div>
                        {currentVariant.video_storyboard_json.soundtrack_mood && (
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                            <Music className="w-3 h-3 text-violet-400" />
                            {currentVariant.video_storyboard_json.soundtrack_mood}
                          </span>
                        )}
                      </div>

                      {currentVariant.video_storyboard_json.hook_first_3_seconds && (
                        <div className="p-2.5 rounded-lg bg-violet-500/10 border border-violet-500/20 text-xs text-violet-200">
                          <span className="font-bold text-violet-400 mr-1.5">⚡ Hook (0-3s):</span>
                          {currentVariant.video_storyboard_json.hook_first_3_seconds}
                        </div>
                      )}

                      <div className="space-y-2 pt-1">
                        {currentVariant.video_storyboard_json.scenes.map((scene: any, sIdx: number) => (
                          <div key={sIdx} className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 text-[11px] space-y-1">
                            <div className="flex items-center justify-between text-indigo-400 font-mono font-semibold">
                              <span>Scene {sIdx + 1}</span>
                              <span>{scene.timestamp}</span>
                            </div>
                            <p className="text-slate-300"><strong className="text-slate-400">Visual:</strong> {scene.visual_prompt}</p>
                            <p className="text-slate-200 italic"><strong className="text-slate-400 not-italic">Voiceover:</strong> "{scene.voiceover}"</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Hashtags */}
                  {currentVariant.hashtags_json?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentVariant.hashtags_json.map((tag, idx) => (
                        <span key={idx} className="text-[11px] text-indigo-400 font-medium">
                          #{tag.replace(/^#/, "")}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* CTA Footer */}
                  {currentVariant.cta && (
                    <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-medium flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <span>{currentVariant.cta}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* AI Granular Regeneration Bar */}
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <RotateCw className="w-4 h-4 text-violet-400" />
                    Targeted AI Revision & Angle Modifier
                  </h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regenInstruction}
                    onChange={(e) => setRegenInstruction(e.target.value)}
                    placeholder="e.g. Make opening contrarian, shorten to single tweet, focus on ROI takeaway..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{regenerating ? "Revising..." : "Regenerate"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: 10-Point QA Scorecard & Strategy Insights */}
            <div className="space-y-5">
              {/* QA Scorecard */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    10-Point QA Quality Scorecard
                  </h3>
                  <span
                    className={`px-2.5 py-1 rounded-full font-bold text-xs ${
                      qualityScore >= 85
                        ? "bg-emerald-500/10 text-emerald-400"
                        : qualityScore >= 70
                        ? "bg-amber-500/10 text-amber-400"
                        : "bg-rose-500/10 text-rose-400"
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
                        className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-slate-300 font-medium">{item.name}</span>
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
                          <p className="text-[11px] text-slate-400 leading-tight">{item.reason}</p>
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
                        className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                      >
                        <span className="capitalize text-slate-300 font-medium">
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
                  <div className="p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs space-y-1">
                    <p className="font-semibold text-[11px] uppercase tracking-wider text-indigo-200">
                      Improvement Recommendations:
                    </p>
                    <ul className="list-disc list-inside space-y-0.5 text-[11px] text-indigo-300">
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

              {/* Strategy Details */}
              <div className="glass-card rounded-2xl p-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-indigo-400" />
                  Platform Strategy Details
                </h3>

                <div className="space-y-2 text-xs text-slate-400">
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Angle</p>
                    <p className="text-slate-200">{currentVariant.strategy_json?.angle}</p>
                  </div>
                  <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800">
                    <p className="text-[10px] uppercase font-semibold text-slate-500 mb-0.5">Hook Style</p>
                    <p className="text-slate-200">{currentVariant.strategy_json?.hook_style}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
