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
  ArrowRight,
  Clock,
  Share2,
} from "lucide-react";

export default function DashboardPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8 lg:space-y-10">
        {/* Welcome Hero Banner in Hirael Aesthetic */}
        <div className="relative overflow-hidden rounded-3xl lg:rounded-[32px] hirael-card p-8 sm:p-10 lg:p-12 border border-white/[0.08]">
          <div className="absolute -top-10 -right-10 w-96 h-96 ambient-glow-warm pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 lg:gap-8">
            <div className="space-y-3.5 max-w-2xl lg:max-w-3xl">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.06] border border-white/[0.1] text-xs sm:text-[13px] font-mono text-[#d4a373]">
                <Sparkles className="w-4 h-4 text-[#d4a373]" />
                <span>Multi-Agent Engine Active</span>
              </div>
              <h1 className="text-3xl sm:text-4xl lg:text-[2.6rem] xl:text-[2.85rem] font-normal tracking-tight text-[#ede8df] leading-[1.2]">
                Turn 1 canonical vision into{" "}
                <span className="font-editorial italic text-[#f7f4ed]">10 platform artifacts.</span>
              </h1>
              <p className="text-xs sm:text-sm lg:text-[15.5px] xl:text-[16px] text-[#8a8a93] leading-relaxed max-w-2xl">
                Ground your canonical message, let specialized agents synthesize platform-native pacing, voice, and media, enforce deterministic quality thresholds, and distribute seamlessly.
              </p>
            </div>

            <div className="flex items-center gap-3.5 shrink-0 self-start md:self-center">
              <Link
                href="/content"
                className="hirael-pill-btn group px-6 sm:px-7 py-3 sm:py-3.5"
              >
                <span className="text-xs sm:text-sm lg:text-[15px] font-semibold text-[#08080a]">New Content Source</span>
                <div className="w-6 h-6 rounded-full bg-[#08080a] text-white flex items-center justify-center transition-transform group-hover:translate-x-0.5">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
              <Link
                href="/brand"
                className="hirael-pill-btn-dark px-5 sm:px-6 py-3 sm:py-3.5 text-xs sm:text-sm lg:text-[15px]"
              >
                <span>Brand Identity</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Metrics Overview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="hirael-card p-6 sm:p-7 flex flex-col justify-between rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs lg:text-[12.5px] font-mono font-medium text-[#85827b] uppercase tracking-widest">
                Active Sources
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#ede8df] flex items-center justify-center">
                <Layers className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[2.75rem] font-light text-[#ede8df] mt-4 tracking-tight">12</div>
            <div className="text-xs sm:text-sm lg:text-[13.5px] text-[#787672] mt-2 flex items-center gap-1.5">
              <span className="text-emerald-400 flex items-center font-medium font-mono">
                <ArrowUpRight className="w-4 h-4" /> +3 this week
              </span>
            </div>
          </div>

          <div className="hirael-card p-6 sm:p-7 flex flex-col justify-between rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs lg:text-[12.5px] font-mono font-medium text-[#85827b] uppercase tracking-widest">
                Generated Variants
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#d4a373] flex items-center justify-center">
                <Sparkles className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[2.75rem] font-light text-[#ede8df] mt-4 tracking-tight">54</div>
            <div className="text-xs sm:text-sm lg:text-[13.5px] text-[#8a8a93] mt-2">Across 6 connected channels</div>
          </div>

          <div className="hirael-card p-6 sm:p-7 flex flex-col justify-between rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs lg:text-[12.5px] font-mono font-medium text-[#85827b] uppercase tracking-widest">
                Scheduled Queue
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[#ede8df] flex items-center justify-center">
                <Clock className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[2.75rem] font-light text-[#ede8df] mt-4 tracking-tight">8</div>
            <div className="text-xs sm:text-sm lg:text-[13.5px] text-[#8a8a93] mt-2">Next dispatch in 2 hours</div>
          </div>

          <div className="hirael-card p-6 sm:p-7 flex flex-col justify-between rounded-2xl">
            <div className="flex items-center justify-between">
              <span className="text-[11px] sm:text-xs lg:text-[12.5px] font-mono font-medium text-[#85827b] uppercase tracking-widest">
                Avg Engagement Rate
              </span>
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/[0.04] border border-white/[0.08] text-emerald-400 flex items-center justify-center">
                <TrendingUp className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
              </div>
            </div>
            <div className="text-3xl sm:text-4xl lg:text-[2.75rem] font-light text-[#ede8df] mt-4 tracking-tight">6.8%</div>
            <div className="text-xs sm:text-sm lg:text-[13.5px] text-emerald-400 mt-2 font-medium font-mono">+1.4% vs last period</div>
          </div>
        </div>

        {/* Multi-Platform Health & Queue Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Platform Status Matrix */}
          <div className="hirael-card p-6 sm:p-7 lg:col-span-1 space-y-4 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h2 className="font-semibold text-[#ede8df] text-sm sm:text-base lg:text-[17px] flex items-center gap-2">
                <Share2 className="w-4 h-4 text-[#d4a373]" />
                Platform Adapters
              </h2>
              <Link href="/integrations" className="text-xs sm:text-sm text-[#a6a39b] hover:text-[#ede8df] flex items-center gap-1 font-medium transition-colors">
                <span>Manage</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3 pt-1">
              {[
                { name: "LinkedIn", mode: "OAuth 2.0 (Client ID)", status: "Active Config", healthy: true },
                { name: "Instagram", mode: "Manual Studio Export", status: "Ready", healthy: true },
                { name: "X (Twitter)", mode: "Thread Adapter", status: "Connected", healthy: true },
                { name: "YouTube Shorts", mode: "Cinematic Script", status: "Connected", healthy: true },
                { name: "TikTok", mode: "Fast Hook Model", status: "Draft Upload", healthy: true },
                { name: "Newsletter / Substack", mode: "Editorial Essay", status: "Connected", healthy: true },
              ].map((plat) => (
                <div
                  key={plat.name}
                  className="flex items-center justify-between p-3.5 sm:p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-colors"
                >
                  <div>
                    <p className="font-medium text-[#ede8df] text-xs sm:text-sm lg:text-[14.5px]">{plat.name}</p>
                    <p className="text-[11px] sm:text-xs text-[#71717a] mt-0.5">{plat.mode}</p>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-mono text-emerald-400">
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                    {plat.status}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Repurposing Pipeline */}
          <div className="hirael-card p-6 sm:p-7 lg:col-span-2 space-y-4 rounded-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.06]">
              <h2 className="font-semibold text-[#ede8df] text-sm sm:text-base lg:text-[17px] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#ede8df]" />
                Live Repurposing Pipeline
              </h2>
              <Link href="/library" className="text-xs sm:text-sm text-[#a6a39b] hover:text-[#ede8df] flex items-center gap-1 font-medium transition-colors">
                <span>View Library</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-3.5 pt-1">
              {[
                {
                  title: "How We Scaled Our AI Architecture to 10M Events",
                  type: "Long-form Canonical Essay",
                  variants: 6,
                  status: "Ready for Approval",
                  badgeClass: "bg-white/10 text-[#ede8df] border-white/20",
                },
                {
                  title: "Why Most AI Caption Generators Fail at Scale",
                  type: "Thought Leadership",
                  variants: 5,
                  status: "Scheduled (4 channels)",
                  badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20",
                },
                {
                  title: "Product Launch: Lisa 1.0 Autonomous Operations",
                  type: "Announcement Manifesto",
                  variants: 8,
                  status: "Intake Running",
                  badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20",
                },
              ].map((item, i) => (
                <div
                  key={i}
                  className="p-4 sm:p-5 rounded-2xl bg-white/[0.02] border border-white/[0.05] hover:border-white/[0.12] transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div className="space-y-1.5">
                    <p className="font-medium text-[#ede8df] text-sm sm:text-base lg:text-[16.5px]">{item.title}</p>
                    <div className="flex items-center gap-3 text-[#8a8a93] text-xs sm:text-[13px]">
                      <span>{item.type}</span>
                      <span>•</span>
                      <span>{item.variants} Platform Variants</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3.5 self-end sm:self-center shrink-0">
                    <span
                      className={`px-3.5 py-1.5 rounded-full border text-[11px] sm:text-xs font-mono ${item.badgeClass}`}
                    >
                      {item.status}
                    </span>
                    <Link
                      href="/content"
                      className="px-4 sm:px-4.5 py-2 rounded-full bg-white/[0.06] hover:bg-white/[0.14] text-[#ede8df] text-xs sm:text-sm font-medium transition-colors cursor-pointer"
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
