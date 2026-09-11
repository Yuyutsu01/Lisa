"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/AppLayout";
import {
  Sparkles,
  Layers,
  Send,
  Calendar,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ArrowUpRight,
  Clock,
  Share2,
} from "lucide-react";

export default function DashboardPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl glass-card p-8 border border-indigo-500/20">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-xs font-medium text-indigo-400 mb-3">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Multi-Agent Orchestration Ready</span>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight text-slate-100">
                Turn 1 Content Idea into 10 Platform Natives
              </h1>
              <p className="text-sm text-slate-400 mt-2 max-w-xl leading-relaxed">
                Create your canonical source, let specialized AI agents adapt tone, format, and media per channel, review with deterministic quality checks, and publish on schedule.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <Link
                href="/content"
                className="py-3 px-5 rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-sm flex items-center gap-2 shadow-lg shadow-indigo-500/25 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>New Content Source</span>
              </Link>
              <Link
                href="/brand"
                className="py-3 px-5 rounded-2xl bg-slate-900 border border-slate-800 hover:bg-slate-800/80 text-slate-200 font-medium text-sm transition-all"
              >
                Brand Settings
              </Link>
            </div>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Active Sources
              </span>
              <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-3">12</div>
            <div className="text-xs text-slate-400 mt-1 flex items-center gap-1.5">
              <span className="text-emerald-400 flex items-center font-medium">
                <ArrowUpRight className="w-3.5 h-3.5" /> +3 this week
              </span>
            </div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Generated Variants
              </span>
              <div className="w-8 h-8 rounded-xl bg-violet-500/10 text-violet-400 flex items-center justify-center">
                <Sparkles className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-3">54</div>
            <div className="text-xs text-slate-400 mt-1">Across 6 connected channels</div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Scheduled Queue
              </span>
              <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-3">8</div>
            <div className="text-xs text-slate-400 mt-1">Next post in 2 hours</div>
          </div>

          <div className="glass-card rounded-2xl p-5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Avg Engagement Rate
              </span>
              <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mt-3">6.8%</div>
            <div className="text-xs text-emerald-400 mt-1 font-medium">+1.4% vs last period</div>
          </div>
        </div>

        {/* Multi-Platform Health & Queue Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Platform Status Matrix */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-1 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4 text-indigo-400" />
                Platform Adapters
              </h2>
              <Link href="/integrations" className="text-xs text-indigo-400 hover:text-indigo-300">
                Manage
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {[
                { name: "LinkedIn", mode: "Direct API", status: "Connected", healthy: true },
                { name: "X (Twitter)", mode: "Direct API", status: "Connected", healthy: true },
                { name: "Instagram", mode: "Direct API", status: "Connected", healthy: true },
                { name: "YouTube Shorts", mode: "Direct API", status: "Connected", healthy: true },
                { name: "TikTok", mode: "Draft Mode", status: "Draft Upload", healthy: true },
                { name: "Newsletter / Email", mode: "ESP API", status: "Connected", healthy: true },
              ].map((plat) => (
                <div
                  key={plat.name}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs"
                >
                  <div>
                    <p className="font-medium text-slate-200">{plat.name}</p>
                    <p className="text-[10px] text-slate-500">{plat.mode}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-emerald-400 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    {plat.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Repurposing Pipeline */}
          <div className="glass-card rounded-2xl p-6 lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-200 text-sm flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-400" />
                Live Content Pipeline
              </h2>
              <Link href="/library" className="text-xs text-indigo-400 hover:text-indigo-300">
                View All
              </Link>
            </div>

            <div className="space-y-3 pt-2">
              {[
                {
                  title: "How We Scaled Our AI Architecture to 10M Events",
                  type: "Long-form Article",
                  variants: 6,
                  status: "Ready for Approval",
                  badgeColor: "bg-indigo-500/20 text-indigo-300 border-indigo-500/30",
                },
                {
                  title: "Why Most AI Caption Generators Fail at Scale",
                  type: "Thought Leadership",
                  variants: 5,
                  status: "Scheduled (4 channels)",
                  badgeColor: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
                },
                {
                  title: "Product Launch: Lisa 1.0 Autonomous Operations",
                  type: "Announcement",
                  variants: 8,
                  status: "Intake Running",
                  badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/30",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-slate-200 text-sm">{item.title}</p>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>{item.variants} Platform Variants</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 self-end sm:self-center">
                    <span
                      className={`px-2.5 py-1 rounded-full border text-[10px] font-medium ${item.badgeColor}`}
                    >
                      {item.status}
                    </span>
                    <Link
                      href="/content"
                      className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                    >
                      Review
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
