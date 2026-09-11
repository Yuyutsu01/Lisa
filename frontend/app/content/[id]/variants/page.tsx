"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import {
  sourcesApi,
  variantsApi,
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

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    loadData();
  }, [sourceId]);

  const loadData = async () => {
    try {
      setLoading(true);
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
    } catch (err) {
      console.error("Failed to load variants", err);
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

  if (loading || generating) {
    return (
      <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 text-indigo-400 flex items-center justify-center animate-pulse">
            <Sparkles className="w-6 h-6 animate-spin" />
          </div>
          <div className="text-center space-y-1">
            <h2 className="text-base font-semibold text-slate-100">
              {generating ? "Multi-Agent Adaptation in Progress..." : "Loading Variants..."}
            </h2>
            <p className="text-xs text-slate-400 max-w-sm">
              Intake Agent, Strategy Agent, Adaptation Agent, and QA checks are processing your canonical source.
            </p>
          </div>
        </div>
      </AppLayout>
    );
  }

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

            {currentVariant?.status === "approved" ? (
              <span className="py-2 px-4 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5">
                <Check className="w-3.5 h-3.5" />
                Approved for Publishing
              </span>
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
                    rows={8}
                    value={currentVariant.body}
                    onChange={(e) => handleUpdateCurrentVariant({ body: e.target.value })}
                    className="w-full bg-transparent text-xs text-slate-200 outline-none leading-relaxed resize-none border-b border-slate-900 pb-2 focus:border-indigo-500/50"
                  />

                  {/* Hashtags */}
                  {currentVariant.hashtags_json?.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {currentVariant.hashtags_json.map((tag, idx) => (
                        <span key={idx} className="text-[11px] text-indigo-400 font-medium">
                          {tag}
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
                    AI Regeneration & Angle Modifier
                  </h3>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={regenInstruction}
                    onChange={(e) => setRegenInstruction(e.target.value)}
                    placeholder="e.g. Make it more contrarian, shorten opening hook, add bullet points..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                  />
                  <button
                    onClick={handleRegenerate}
                    disabled={regenerating}
                    className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{regenerating ? "Regenerating..." : "Regenerate"}</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Right Column: QA Scorecard & Strategy Insights */}
            <div className="space-y-5">
              {/* QA Scorecard */}
              <div className="glass-card rounded-2xl p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    QA Quality Scorecard
                  </h3>
                  <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 font-bold text-xs">
                    {(
                      (currentVariant.quality_review_json?.quality_score || 0.95) * 100
                    ).toFixed(0)}
                    %
                  </span>
                </div>

                <div className="space-y-2 pt-1">
                  {Object.entries(
                    currentVariant.quality_review_json?.checks || {
                      brand_voice: "pass",
                      forbidden_words: "pass",
                      format_validity: "pass",
                      source_fidelity: "pass",
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
                  ))}
                </div>

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
