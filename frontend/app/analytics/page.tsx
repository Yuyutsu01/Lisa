"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Users,
  Sparkles,
  ArrowUpRight,
  RefreshCw,
  ExternalLink,
  Layers,
  CheckCircle2,
  Share2,
  Zap,
  Target,
  ArrowRight,
  Flame,
} from "lucide-react";

interface PlatformMetricSummary {
  platform: string;
  total_posts: number;
  impressions: number;
  engagements: number;
  avg_engagement_rate: number;
}

interface TopPostSummary {
  published_record_id: string;
  platform: string;
  title?: string;
  external_url: string;
  impressions: number;
  engagements: number;
  engagement_rate: number;
  published_at: string;
}

import {
  analyticsApi,
  AnalyticsOverview,
  ContentOpportunity,
  getActiveWorkspaceId,
} from "@/lib/api";

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null);
  const [opportunities, setOpportunities] = useState<ContentOpportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [actioningId, setActioningId] = useState<string | null>(null);

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    if (wsId) {
      loadAnalyticsData(wsId);
    }
  }, []);

  const loadAnalyticsData = async (workspaceId: string) => {
    setLoading(true);
    try {
      const [ovData, oppData] = await Promise.all([
        analyticsApi.getOverview(workspaceId).catch(() => null),
        analyticsApi.getOpportunities(workspaceId).catch(() => []),
      ]);

      if (ovData) setOverview(ovData);
      if (oppData) setOpportunities(oppData);
    } catch (e) {
      console.error("Failed to load analytics", e);
    } finally {
      setLoading(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (!activeWorkspaceId) return;
    setAnalyzing(true);
    try {
      await analyticsApi.runAnalytics(activeWorkspaceId);
      await loadAnalyticsData(activeWorkspaceId);
    } catch (e) {
      console.error("Failed to run opportunity loop", e);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleActionOpportunity = async (opportunityId: string) => {
    if (!activeWorkspaceId) return;
    setActioningId(opportunityId);
    try {
      const res = await analyticsApi.actionOpportunity(activeWorkspaceId, opportunityId);
      if (res.success && res.content_source_id) {
        router.push(`/content?id=${res.content_source_id}`);
      }
    } catch (e) {
      console.error("Failed to action opportunity", e);
    } finally {
      setActioningId(null);
    }
  };

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-1">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Closed-Loop Content Intelligence</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">
              Performance Analytics & Opportunity Loop
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Cross-platform metric normalization, viral resonance detection, and autonomous AI
              repurposing recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={handleRunAnalysis}
              disabled={analyzing}
              className="py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50 cursor-pointer"
            >
              <Sparkles className={`w-3.5 h-3.5 ${analyzing ? "animate-spin" : ""}`} />
              <span>{analyzing ? "Analyzing Patterns..." : "Discover AI Opportunities"}</span>
            </button>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Total Impressions</span>
              <Eye className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {(overview?.total_impressions || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" /> Across all connected feeds
            </span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Total Engagements</span>
              <Zap className="w-4 h-4 text-violet-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {(overview?.total_engagements || 0).toLocaleString()}
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">Likes, shares, comments & clicks</span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Avg Engagement Rate</span>
              <Flame className="w-4 h-4 text-pink-400" />
            </div>
            <div className="text-2xl font-black text-slate-100">
              {(((overview?.avg_engagement_rate || 0) * 100)).toFixed(2)}%
            </div>
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3" /> Benchmark: {">"} 3.5%
            </span>
          </div>

          <div className="glass-card rounded-2xl p-5 border border-slate-800">
            <div className="flex items-center justify-between text-slate-400 mb-3">
              <span className="text-xs font-medium uppercase tracking-wider">Repurposing Opportunities</span>
              <Sparkles className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-300">
              {opportunities.length} Open
            </div>
            <span className="text-[11px] text-slate-400 block mt-2">High-resonance candidate angles</span>
          </div>
        </div>

        {/* AI Opportunity Loop Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-100">
                AI Repurposing & Opportunity Engine
              </h2>
            </div>
            <span className="text-xs text-slate-500 font-mono">
              Continuous Closed-Loop Learning
            </span>
          </div>

          {opportunities.length === 0 ? (
            <div className="rounded-3xl glass-card border border-slate-800 p-8 text-center">
              <Target className="w-10 h-10 text-indigo-400/50 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-200 text-sm">
                No active repurposing opportunities yet
              </h3>
              <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto mb-4">
                Click &quot;Discover AI Opportunities&quot; above to let the Content Recommendation Agent
                synthesize new derivative formats from your top-performing assets.
              </p>
              <button
                onClick={handleRunAnalysis}
                disabled={analyzing}
                className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
              >
                Run Pattern Analysis
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {opportunities.map((opp) => (
                <div
                  key={opp.id}
                  className="rounded-3xl glass-card border border-indigo-500/20 p-6 flex flex-col justify-between hover:border-indigo-500/40 transition-all group bg-gradient-to-b from-indigo-950/20 to-slate-950"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-semibold uppercase tracking-wider">
                        {opp.content_pillar}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                        {opp.confidence.toUpperCase()} CONFIDENCE
                      </span>
                    </div>

                    <h3 className="font-bold text-slate-100 text-base mb-2 group-hover:text-indigo-300 transition-colors">
                      {opp.title}
                    </h3>
                    <p className="text-xs text-slate-400 leading-relaxed mb-4">{opp.reason}</p>

                    <div className="space-y-1.5 mb-5">
                      <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider block">
                        Target Repurposing Channels:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {opp.suggested_platforms_json.map((plat) => (
                          <span
                            key={plat}
                            className="px-2 py-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[11px] font-medium text-slate-300 uppercase"
                          >
                            {plat}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-800/80">
                    <button
                      onClick={() => handleActionOpportunity(opp.id)}
                      disabled={actioningId === opp.id}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-500/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>
                        {actioningId === opp.id
                          ? "Creating Studio Draft..."
                          : "Repurpose into Studio Draft"}
                      </span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section: Platform Breakdown & Top Posts Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Platform Performance Breakdown */}
          <div className="rounded-3xl glass-card border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Share2 className="w-4 h-4 text-indigo-400" />
              Channel Performance Distribution
            </h3>

            {overview?.platform_breakdown?.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                Publish content across channels to generate platform conversion breakdown.
              </p>
            ) : (
              <div className="space-y-3">
                {overview?.platform_breakdown?.map((plat) => (
                  <div
                    key={plat.platform}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-bold text-slate-200 text-sm uppercase block">
                        {plat.platform}
                      </span>
                      <span className="text-[11px] text-slate-400">
                        {plat.total_posts} posts &bull; {plat.impressions.toLocaleString()} views
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-emerald-400 block">
                        {(plat.avg_engagement_rate * 100).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-slate-500">Eng. Rate</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performing Content Leaderboard */}
          <div className="rounded-3xl glass-card border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Flame className="w-4 h-4 text-pink-400" />
              Top Performing Content Leaderboard
            </h3>

            {overview?.top_performing_posts?.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No published post metrics recorded yet.
              </p>
            ) : (
              <div className="space-y-3">
                {overview?.top_performing_posts?.map((post) => (
                  <div
                    key={post.published_record_id}
                    className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase">
                          {post.platform}
                        </span>
                        <span className="font-semibold text-slate-200 text-xs truncate">
                          {post.title}
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500 block mt-1">
                        {post.impressions.toLocaleString()} impressions &bull;{" "}
                        {post.engagements.toLocaleString()} engagements
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                        {(post.engagement_rate * 100).toFixed(1)}%
                      </span>
                      <a
                        href={post.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
