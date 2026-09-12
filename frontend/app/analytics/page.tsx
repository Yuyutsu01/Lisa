"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AppLayout } from "@/components/AppLayout";
import {
  BarChart3,
  TrendingUp,
  Eye,
  Sparkles,
  ExternalLink,
  Zap,
  Target,
  ArrowRight,
  Flame,
  Share2,
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";
import { ScrollReveal } from "@/components/ScrollReveal";
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

  if (loading) {
    return (
      <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-[#8a8a93] text-xs font-mono flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#d4a373] animate-ping" />
            Loading analytics intelligence...
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-white/[0.07]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#85827b] mb-1">
              <BarChart3 className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Closed-Loop Content Intelligence</span>
            </div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-normal tracking-tight text-[#ede8df]">
              Performance Analytics & Opportunity Loop
            </h1>
            <p className="text-xs sm:text-sm text-[#8a8a93] mt-1 max-w-2xl leading-relaxed">
              Cross-platform metric normalization, viral resonance detection, and autonomous AI
              repurposing recommendations.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <InteractiveButton
              onClick={handleRunAnalysis}
              loading={analyzing}
              loadingText="Analyzing Patterns..."
              variant="primary"
              size="md"
              glow
              shimmer
              magnetic
              leftIcon={<Sparkles className="w-3.5 h-3.5" />}
              className="text-xs"
            >
              Discover AI Opportunities
            </InteractiveButton>
          </div>
        </div>

        {/* KPI Counter Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ScrollReveal delay={0}>
            <div className="hirael-card card-hover-lift p-4 sm:p-5 space-y-2.5 h-full">
              <div className="flex items-center justify-between text-[#8a8a93]">
                <span className="text-[10px] font-mono uppercase tracking-wider">Total Impressions</span>
                <Eye className="w-4 h-4 text-[#d4a373]" />
              </div>
              <div className="text-2xl sm:text-3xl font-normal tracking-tight text-[#ede8df]">
                {(overview?.total_impressions || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Across all connected feeds
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={50}>
            <div className="hirael-card card-hover-lift p-4 sm:p-5 space-y-2.5 h-full">
              <div className="flex items-center justify-between text-[#8a8a93]">
                <span className="text-[10px] font-mono uppercase tracking-wider">Total Engagements</span>
                <Zap className="w-4 h-4 text-[#d4a373]" />
              </div>
              <div className="text-2xl sm:text-3xl font-normal tracking-tight text-[#ede8df]">
                {(overview?.total_engagements || 0).toLocaleString()}
              </div>
              <span className="text-[11px] text-[#71717a] block">Likes, shares, comments & clicks</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={100}>
            <div className="hirael-card card-hover-lift p-4 sm:p-5 space-y-2.5 h-full">
              <div className="flex items-center justify-between text-[#8a8a93]">
                <span className="text-[10px] font-mono uppercase tracking-wider">Avg Engagement Rate</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-2xl sm:text-3xl font-normal tracking-tight text-[#ede8df]">
                {(((overview?.avg_engagement_rate || 0) * 100)).toFixed(2)}%
              </div>
              <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                <TrendingUp className="w-3 h-3" /> Benchmark: &gt; 3.5%
              </span>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={150}>
            <div className="hirael-card card-hover-lift p-4 sm:p-5 space-y-2.5 h-full">
              <div className="flex items-center justify-between text-[#8a8a93]">
                <span className="text-[10px] font-mono uppercase tracking-wider">Opportunities</span>
                <Sparkles className="w-4 h-4 text-[#d4a373]" />
              </div>
              <div className="text-2xl sm:text-3xl font-normal tracking-tight text-[#d4a373]">
                {opportunities.length} Open
              </div>
              <span className="text-[11px] text-[#71717a] block">High-resonance candidate angles</span>
            </div>
          </ScrollReveal>
        </div>

        {/* AI Opportunity Loop Feed */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#d4a373]" />
              <h2 className="text-base sm:text-lg font-normal text-[#ede8df]">
                AI Repurposing &amp; Opportunity Engine
              </h2>
            </div>
            <span className="text-[10px] sm:text-xs text-[#71717a] font-mono">
              Continuous Closed-Loop Learning
            </span>
          </div>

          {opportunities.length === 0 ? (
            <div className="hirael-card p-8 sm:p-10 text-center space-y-3">
              <Target className="w-9 h-9 text-[#52525b] mx-auto" />
              <h3 className="font-medium text-[#ede8df] text-sm">
                No active repurposing opportunities yet
              </h3>
              <p className="text-xs text-[#8a8a93] max-w-md mx-auto leading-relaxed">
                Click &quot;Discover AI Opportunities&quot; above to let the Content Recommendation Agent
                synthesize new derivative formats from your top-performing assets.
              </p>
              <InteractiveButton
                onClick={handleRunAnalysis}
                loading={analyzing}
                variant="secondary"
                size="sm"
                leftIcon={<Sparkles className="w-3.5 h-3.5 text-[#d4a373]" />}
                className="mt-2 text-xs"
              >
                Run Pattern Analysis
              </InteractiveButton>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {opportunities.map((opp, idx) => (
                <ScrollReveal key={opp.id} delay={idx * 40}>
                  <div className="hirael-card card-hover-lift p-5 flex flex-col justify-between h-full group">
                    <div className="space-y-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-white/[0.05] text-[#ede8df] border border-white/10 text-[10px] font-mono uppercase tracking-wider">
                          {opp.content_pillar}
                        </span>
                        <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 font-semibold">
                          {opp.confidence.toUpperCase()} CONFIDENCE
                        </span>
                      </div>

                      <h3 className="font-semibold text-[#ede8df] text-sm group-hover:text-[#d4a373] transition-colors line-clamp-2">
                        {opp.title}
                      </h3>
                      <p className="text-xs text-[#8a8a93] leading-relaxed line-clamp-3">{opp.reason}</p>

                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-mono text-[#71717a] uppercase tracking-wider block">
                          Target Channels:
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {opp.suggested_platforms_json.map((plat) => (
                            <span
                              key={plat}
                              className="px-2 py-0.5 rounded-full bg-white/[0.03] border border-white/[0.08] text-[10px] font-mono text-[#a6a39b] uppercase"
                            >
                              {plat}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 mt-4 border-t border-white/[0.06]">
                      <InteractiveButton
                        onClick={() => handleActionOpportunity(opp.id)}
                        loading={actioningId === opp.id}
                        loadingText="Creating Studio Draft..."
                        variant="primary"
                        size="sm"
                        glow
                        magnetic
                        leftIcon={<Sparkles className="w-3.5 h-3.5" />}
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="w-full text-xs justify-center"
                      >
                        Repurpose into Studio Draft
                      </InteractiveButton>
                    </div>
                  </div>
                </ScrollReveal>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Section: Platform Breakdown & Top Posts Leaderboard */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Platform Performance Breakdown */}
          <div className="hirael-card p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#ede8df] flex items-center gap-2">
              <Share2 className="w-4 h-4 text-[#d4a373]" />
              <span>Channel Performance Distribution</span>
            </h3>

            {overview?.platform_breakdown?.length === 0 ? (
              <p className="text-xs text-[#71717a] py-8 text-center">
                Publish content across channels to generate platform conversion breakdown.
              </p>
            ) : (
              <div className="space-y-2.5">
                {overview?.platform_breakdown?.map((plat) => (
                  <div
                    key={plat.platform}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-[#ede8df] text-xs uppercase block">
                        {plat.platform}
                      </span>
                      <span className="text-[11px] text-[#71717a]">
                        {plat.total_posts} posts &bull; {plat.impressions.toLocaleString()} views
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-xs font-semibold text-emerald-400 block">
                        {(plat.avg_engagement_rate * 100).toFixed(1)}%
                      </span>
                      <span className="text-[10px] text-[#71717a]">Eng. Rate</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top Performing Content Leaderboard */}
          <div className="hirael-card p-5 sm:p-6 space-y-4">
            <h3 className="text-sm font-semibold text-[#ede8df] flex items-center gap-2">
              <Flame className="w-4 h-4 text-amber-400" />
              <span>Top Performing Content Leaderboard</span>
            </h3>

            {overview?.top_performing_posts?.length === 0 ? (
              <p className="text-xs text-[#71717a] py-8 text-center">
                No published post metrics recorded yet.
              </p>
            ) : (
              <div className="space-y-2.5">
                {overview?.top_performing_posts?.map((post) => (
                  <div
                    key={post.published_record_id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 rounded-full bg-white/[0.05] text-[#d4a373] text-[9px] font-mono font-semibold uppercase">
                          {post.platform}
                        </span>
                        <span className="font-medium text-[#ede8df] text-xs truncate">
                          {post.title}
                        </span>
                      </div>
                      <span className="text-[10px] text-[#71717a] block mt-1">
                        {post.impressions.toLocaleString()} impressions &bull;{" "}
                        {post.engagements.toLocaleString()} engagements
                      </span>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-semibold border border-emerald-500/20">
                        {(post.engagement_rate * 100).toFixed(1)}%
                      </span>
                      <a
                        href={post.external_url}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-[#8a8a93] hover:text-[#ede8df] transition-colors"
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
