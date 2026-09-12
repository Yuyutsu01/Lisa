"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, CheckCircle2, Loader2 } from "lucide-react";

interface AIGenerationStreamingProps {
  generating: boolean;
  platform?: string;
  sourceTitle?: string;
  onComplete?: () => void;
}

const PIPELINE_STAGES = [
  { id: 1, name: "Source Intake Agent", desc: "Analyzing canonical claims, key takeaways & thesis", duration: 1800 },
  { id: 2, name: "Platform Strategist", desc: "Applying native layout, character limits & hooks", duration: 2200 },
  { id: 3, name: "Voice & Tone Adapter", desc: "Harmonizing with Brand Intelligence rules", duration: 2000 },
  { id: 4, name: "Deterministic QA Loop", desc: "Verifying formatting, forbidden words & quality score", duration: 1600 },
];

export function AIGenerationStreaming({
  generating,
  platform = "All Channels",
  sourceTitle = "Canonical Idea",
  onComplete,
}: AIGenerationStreamingProps) {
  const [currentStage, setCurrentStage] = useState(1);
  const [streamedText, setStreamedText] = useState("");
  const sampleText = `Adapting "${sourceTitle}" for ${platform}...\n> Grounding core facts...\n> Extracting emotional resonance points...\n> Enforcing brand voice guidelines...\n> Optimizing algorithmic reach and native formatting...`;

  useEffect(() => {
    if (!generating) {
      setCurrentStage(1);
      setStreamedText("");
      return;
    }

    let charIdx = 0;
    const typeInterval = setInterval(() => {
      if (charIdx < sampleText.length) {
        setStreamedText(sampleText.substring(0, charIdx + 1));
        charIdx++;
      } else {
        clearInterval(typeInterval);
      }
    }, 28);

    // Progress through stages
    const stage1 = setTimeout(() => setCurrentStage(2), 1600);
    const stage2 = setTimeout(() => setCurrentStage(3), 3400);
    const stage3 = setTimeout(() => setCurrentStage(4), 5200);
    const stageComplete = setTimeout(() => {
      if (onComplete) onComplete();
    }, 7000);

    return () => {
      clearInterval(typeInterval);
      clearTimeout(stage1);
      clearTimeout(stage2);
      clearTimeout(stage3);
      clearTimeout(stageComplete);
    };
  }, [generating, sourceTitle, platform]);

  if (!generating) return null;

  return (
    <div className="rounded-2xl sm:rounded-3xl bg-[#0e0e11] border border-white/[0.1] p-5 sm:p-7 shadow-2xl relative overflow-hidden backdrop-blur-xl">
      <div className="absolute top-0 right-0 w-80 h-80 ambient-glow-warm pointer-events-none opacity-60" />

      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-white/[0.06] relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-2xl bg-[#ede8df] text-[#08080a] flex items-center justify-center font-bold shadow-lg">
            <Sparkles className="w-4 h-4 animate-spin text-[#08080a]" />
          </div>
          <div>
            <h3 className="text-sm sm:text-base font-medium text-[#ede8df] flex items-center gap-2">
              Autonomous Agent Pipeline Executing
            </h3>
            <p className="text-[11px] text-[#8a8a93] font-mono">
              Target: {platform} • Multi-Model Inference Active
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse">
          Stage {currentStage} of 4
        </span>
      </div>

      {/* Pipeline Steps Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 my-5 relative z-10">
        {PIPELINE_STAGES.map((st) => {
          const isDone = currentStage > st.id;
          const isCurrent = currentStage === st.id;
          return (
            <div
              key={st.id}
              className={`p-3.5 rounded-2xl border transition-all duration-300 ${
                isCurrent
                  ? "bg-white/[0.06] border-white/20 text-[#ede8df] shadow-md ring-1 ring-[#d4a373]/30"
                  : isDone
                  ? "bg-white/[0.02] border-white/[0.05] text-[#a6a39b]"
                  : "bg-black/30 border-white/[0.03] text-[#52504b] opacity-60"
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-mono uppercase tracking-wider text-[#85827b]">
                  Agent 0{st.id}
                </span>
                {isDone ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : isCurrent ? (
                  <Loader2 className="w-3.5 h-3.5 text-[#d4a373] animate-spin" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
                )}
              </div>
              <p className="text-xs font-medium text-[#ede8df] truncate">{st.name}</p>
              <p className="text-[10px] text-[#787672] mt-0.5 line-clamp-2 leading-tight">
                {st.desc}
              </p>
            </div>
          );
        })}
      </div>

      {/* Real-Time Generation Terminal Output */}
      <div className="rounded-2xl bg-black/60 border border-white/[0.08] p-4 font-mono text-[11px] sm:text-xs text-[#d4a373] min-h-[90px] whitespace-pre-wrap leading-relaxed relative z-10">
        <span className="text-[#85827b] select-none block mb-1 font-mono text-[10px] uppercase tracking-wider">
          Live Telemetry Stream:
        </span>
        {streamedText}
        <span className="ai-typing-cursor" />
      </div>
    </div>
  );
}
