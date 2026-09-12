"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  MessageSquareQuote,
  Radio,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Layers,
  Share2,
  Cpu,
  ShieldAlert,
  Calendar,
  BarChart3,
  Sliders,
  CheckCircle2,
} from "lucide-react";

export default function LisaHomePage() {
  const router = useRouter();
  const [inquirySent, setInquirySent] = useState(false);
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");

  // Scroll tracking for parallax, active nav, and scroll progress
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("hero");

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      setScrollY(currentY);

      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (currentY / docHeight) * 100 : 0;
      setScrollProgress(Math.min(100, Math.max(0, progress)));

      // Detect active visible section
      const sections = ["enquiries", "programs", "our-story", "hero"];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight * 0.45) {
            setActiveSection(id);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Immersion soundscape synthesizer using Web Audio API
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const toggleSoundscape = () => {
    if (isPlayingAudio) {
      if (audioCtxRef.current) {
        audioCtxRef.current.close();
        audioCtxRef.current = null;
      }
      setIsPlayingAudio(false);
    } else {
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext })
            .webkitAudioContext;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;

        // Create warm ambient brown-pink noise + harmonic sine drone
        const bufferSize = ctx.sampleRate * 2;
        const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        let lastOut = 0.0;
        for (let i = 0; i < bufferSize; i++) {
          const white = Math.random() * 2 - 1;
          output[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = output[i];
          output[i] *= 2.5; // brownian noise
        }

        const whiteNoise = ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        const filter = ctx.createBiquadFilter();
        filter.type = "lowpass";
        filter.frequency.setValueAtTime(320, ctx.currentTime);

        // Warm harmonic sub-drone
        const osc = ctx.createOscillator();
        osc.type = "sine";
        osc.frequency.setValueAtTime(108, ctx.currentTime); // 108Hz meditative warm frequency

        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0.08, ctx.currentTime);
        gainNodeRef.current = gainNode;

        whiteNoise.connect(filter);
        filter.connect(gainNode);
        osc.connect(gainNode);
        gainNode.connect(ctx.destination);

        whiteNoise.start();
        osc.start();
        setIsPlayingAudio(true);
      } catch (err) {
        console.error("Audio synthesis error:", err);
      }
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleEnterOS = () => {
    const token =
      typeof window !== "undefined"
        ? localStorage.getItem("lisa_token") ||
          localStorage.getItem("lisa_access_token")
        : null;
    if (token) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  };

  const handleInquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setInquirySent(true);
    setTimeout(() => {
      setInquirySent(false);
      setInquiryEmail("");
      setInquiryMessage("");
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ede8df] selection:bg-[#ede8df]/20 selection:text-white p-2 sm:p-4 md:p-6 flex flex-col items-center">
      {/* Sleek Luminous Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[2px] z-50 pointer-events-none bg-white/[0.03]">
        <div
          className="h-full bg-gradient-to-r from-[#d4a373] via-[#ede8df] to-[#d4a373] transition-all duration-75 ease-out shadow-[0_0_8px_rgba(212,163,115,0.4)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Container Frame with rounded edges matching design */}
      <div className="w-full max-w-[1520px] rounded-[24px] sm:rounded-[36px] bg-[#09090b] border border-white/[0.06] relative overflow-hidden shadow-2xl flex flex-col">
        {/* Subtle Ambient Luminescence Glow with gentle scroll parallax */}
        <div
          className="absolute top-0 right-0 w-[55vw] max-w-[800px] h-[500px] ambient-glow-warm pointer-events-none z-0 transition-transform duration-150 ease-out"
          style={{ transform: `translateY(${scrollY * 0.08}px)` }}
        />
        <div
          className="absolute top-[35%] left-[-10%] w-[45vw] h-[450px] ambient-glow-center pointer-events-none z-0 transition-transform duration-150 ease-out"
          style={{ transform: `translateY(${scrollY * 0.04}px)` }}
        />
        <div
          className="absolute bottom-[20%] right-[-10%] w-[45vw] h-[450px] ambient-glow-warm pointer-events-none z-0 transition-transform duration-150 ease-out"
          style={{ transform: `translateY(${-scrollY * 0.03}px)` }}
        />

        {/* Top Floating Pill Navigation - Sticky across all folds with active state */}
        <div className="sticky top-4 w-full px-4 sm:px-8 flex items-center justify-center z-40 pointer-events-none">
          <nav className="inline-flex items-center gap-1 sm:gap-2 px-3 sm:px-6 py-2 rounded-full hirael-glass-nav text-xs sm:text-sm text-[#a6a39b] shadow-2xl pointer-events-auto border border-white/10 backdrop-blur-xl transition-all duration-300">
            <button
              onClick={() => scrollToSection("our-story")}
              className={`px-3 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                activeSection === "our-story"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Our story
            </button>
            <button
              onClick={() => scrollToSection("programs")}
              className={`px-3 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                activeSection === "programs"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Programs
            </button>
            <button
              onClick={() => scrollToSection("enquiries")}
              className={`px-3 sm:px-4 py-1.5 rounded-full transition-all cursor-pointer font-medium ${
                activeSection === "enquiries"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Enquiries
            </button>

            {/* Direct Gateway to Content Studio OS */}
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <button
              onClick={handleEnterOS}
              className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-full bg-white/10 hover:bg-white/15 text-[#ede8df] text-xs font-semibold transition-all cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#d4a373]" />
              <span>Enter OS</span>
            </button>
          </nav>
        </div>

        {/* =========================================================================
            PAGE 1: HERO VIEWPORT (100x / FULL VIEWPORT HEIGHT)
            ========================================================================= */}
        <section
          id="hero"
          className="relative z-10 min-h-[calc(100vh-2rem)] flex flex-col justify-between px-6 sm:px-12 md:px-20 pt-8 pb-12 sm:pb-16"
        >
          {/* Monumental Brandmark - Centered in viewport with subtle scroll parallax & warm glow */}
          <div
            className="my-auto py-6 sm:py-10 transition-transform duration-75 ease-out will-change-transform"
            style={{
              transform: `translateY(${Math.min(scrollY * 0.16, 110)}px)`,
              opacity: Math.max(0.25, 1 - scrollY / 750),
            }}
          >
            <h1 className="lisa-hero-title text-[23vw] sm:text-[20vw] lg:text-[16rem] font-normal leading-[0.8] tracking-[-0.06em] select-none text-left cursor-pointer">
              Lisa<span className="lisa-asterisk text-[#d4a373] inline-block -translate-y-2 sm:-translate-y-8 text-[0.55em]">*</span>
            </h1>
          </div>

          {/* Bottom Row: Subtitle, Overview Excerpt, Scroll Cue, and "Get in" Button */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-end pt-4">
            {/* Tagline & Principle */}
            <div className="lg:col-span-7 space-y-3">
              <p className="text-base sm:text-xl font-normal text-[#ede8df] tracking-tight">
                Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.
              </p>
              <p className="text-xs sm:text-sm text-[#8a8a93] max-w-xl leading-relaxed">
                Enterprise-grade, multi-tenant AI content operations operating system (OS). Rather than a simple chat wrapper,{" "}
                <span className="lisa-warm-glow font-medium">Lisa</span> orchestrates specialized agents and deterministic software safeguards.
              </p>

              {/* Interactive Scroll Down Cue */}
              <div className="pt-2">
                <button
                  onClick={() => scrollToSection("our-story")}
                  className="inline-flex items-center gap-2.5 text-[11px] font-mono tracking-wider text-[#787672] hover:text-[#d4a373] transition-colors cursor-pointer group"
                >
                  <div className="w-4 h-7 rounded-full border border-white/20 flex items-start justify-center p-0.5 group-hover:border-[#d4a373]/60 transition-colors">
                    <div className="w-1 h-2 rounded-full bg-[#d4a373] animate-bounce" />
                  </div>
                  <span>SCROLL TO EXPLORE</span>
                </button>
              </div>
            </div>

            {/* "Get in" CTA Button leading to User Registration */}
            <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-end">
              <Link
                href="/register"
                className="hirael-pill-btn group cursor-pointer"
              >
                <span className="text-sm font-semibold tracking-tight text-[#08080a]">Get in</span>
                <div className="w-7 h-7 rounded-full bg-[#08080a] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PAGE 2: OUR STORY (PRODUCT OVERVIEW & PROBLEM STATEMENT)
            ========================================================================= */}
        <section
          id="our-story"
          className="relative z-10 min-h-screen flex flex-col justify-center px-6 sm:px-12 md:px-20 py-24 md:py-32 border-t border-white/[0.05]"
        >
          <div className="max-w-5xl mx-auto space-y-16">
            {/* Header / Manifesto */}
            <div className="text-center space-y-6">
              <div className="text-[11px] font-mono tracking-[0.25em] text-[#85827b] uppercase">
                1. PRODUCT OVERVIEW & CORE PRINCIPLE
              </div>

              <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal leading-[1.18] tracking-[-0.03em] text-[#ede8df]">
                <span className="lisa-warm-glow font-medium">Lisa</span> is an orchestrated pipeline where{" "}
                <span className="font-editorial italic text-[#f7f4ed]">specialized AI agents collaborate</span>{" "}
                with deterministic software safeguards.
              </h2>

              <p className="text-sm sm:text-base leading-relaxed text-[#8a8a93] max-w-3xl mx-auto font-normal">
                Rather than acting as a simple generic chat wrapper that writes captions,{" "}
                <span className="lisa-warm-glow font-medium">Lisa</span> ingests canonical content sources, adapts them into platform-native variants (LinkedIn, X/Twitter, Instagram, YouTube Shorts, TikTok, Threads, Email Newsletters, and Blog CMS), validates them against brand guidelines, schedules them via an idempotent state machine, and analyzes cross-platform performance in a closed-loop feedback loop.
              </p>
            </div>

            {/* Core Product Principle - 4 Architectural Columns */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="hirael-card p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#d4a373]">
                  <span>STAGE 01</span>
                  <Sparkles className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-[#ede8df]">
                  AI Proposes Structured Variants
                </h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Specialized agents ingest canonical ideas and draft native hooks, threads, carousels, and scripts matching platform psychology.
                </p>
              </div>

              <div className="hirael-card p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#d4a373]">
                  <span>STAGE 02</span>
                  <ShieldAlert className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-[#ede8df]">
                  Deterministic Validation
                </h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Software validates strict boundaries: character limits, forbidden phrases, hashtag density, and visual aspect ratios automatically.
                </p>
              </div>

              <div className="hirael-card p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#d4a373]">
                  <span>STAGE 03</span>
                  <Sliders className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-[#ede8df]">
                  Human-in-the-Loop Approval
                </h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Creators review live simulated feed previews, tweak specific elements, and sign off before idempotent publishing dispatch.
                </p>
              </div>

              <div className="hirael-card p-5 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono text-[#d4a373]">
                  <span>STAGE 04</span>
                  <BarChart3 className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-sm font-semibold text-[#ede8df]">
                  Closed-Loop Growth Loop
                </h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Cross-network analytics feed actionable repurposing opportunities and performance signals back to the top of the funnel.
                </p>
              </div>
            </div>

            {/* Problem Statement Section from README */}
            <div className="pt-8 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono tracking-widest text-[#85827b] uppercase mb-4 text-center">
                2. PROBLEM STATEMENT · SOLVING CONTENT OPERATIONS FRICTION
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                  <h4 className="font-semibold text-[#ede8df] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Manual Repurposing Overhead
                  </h4>
                  <p className="text-[#8a8a93] leading-relaxed">
                    Writing 1 high-value long-form article requires manually rewriting 8 different posts with distinct platform hooks, formatting rules, and character constraints.{" "}
                    <span className="lisa-warm-glow font-medium">Lisa</span> eliminates this overhead.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                  <h4 className="font-semibold text-[#ede8df] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Brand Voice Drift
                  </h4>
                  <p className="text-[#8a8a93] leading-relaxed">
                    Multi-member teams struggle to maintain consistent brand tone, terminology, forbidden phrase compliance, and audience positioning.{" "}
                    <span className="lisa-warm-glow font-medium">Lisa</span> enforces brand intelligence centrally.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                  <h4 className="font-semibold text-[#ede8df] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Media Format Mismatches
                  </h4>
                  <p className="text-[#8a8a93] leading-relaxed">
                    Manually cropping and aspect-ratio converting visual assets (Portrait 4:5, Square 1:1, Reels 9:16, Thumbnails 16:9) causes friction and visual bugs.{" "}
                    <span className="lisa-warm-glow font-medium">Lisa</span> automates derivative generation.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] space-y-1.5">
                  <h4 className="font-semibold text-[#ede8df] flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                    Scattered Distribution & Disconnected Analytics
                  </h4>
                  <p className="text-[#8a8a93] leading-relaxed">
                    Scheduling across disconnected third-party tools prevents normalized cross-platform performance tracking and intelligent closed-loop repurposing.{" "}
                    <span className="lisa-warm-glow font-medium">Lisa</span> centralizes publishing and insights.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PAGE 3: PROGRAMS (KEY FEATURES & AGENT ARCHITECTURE)
            ========================================================================= */}
        <section
          id="programs"
          className="relative z-10 min-h-screen flex flex-col justify-center px-6 sm:px-10 md:px-16 py-24 md:py-32 border-t border-white/[0.05]"
        >
          <div className="text-center space-y-3 mb-16 sm:mb-20">
            <div className="text-[11px] font-mono tracking-[0.25em] text-[#85827b] uppercase">
              3. KEY FEATURES & ENGINE CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-4xl md:text-5xl font-normal tracking-tight text-[#ede8df]">
              Studio-grade architecture for visionary creators.
            </h2>
            <p className="text-sm sm:text-base text-[#8a8a93] max-w-2xl mx-auto">
              Engineered with multi-tenant RBAC, deterministic state machines, and high-velocity Groq inference.
            </p>
          </div>

          {/* 4 Architectural Bento Cards Grid matching Image 3 */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {/* Card 1: 00 Canonical Content Studio & Orchestrator */}
            <div className="hirael-card p-6 sm:p-8 min-h-[420px] flex flex-col justify-between bg-gradient-to-b from-[#121216] to-[#0a0a0c]">
              <div>
                <div className="flex items-center justify-between text-xs text-[#75736d] mb-6">
                  <div className="w-9 h-9 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#d4a373]">
                    <Cpu className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs text-[#52504b]">00</span>
                </div>

                <h3 className="text-base font-semibold text-[#ede8df] mb-3">
                  Multi-Agent Orchestrator
                </h3>

                <ul className="space-y-2.5 text-xs text-[#918e87]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#d4a373] mt-0.5 shrink-0" />
                    <span>5 specialized agents for native formats</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#d4a373] mt-0.5 shrink-0" />
                    <span>Rich-text studio with debounced auto-saving</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#d4a373] mt-0.5 shrink-0" />
                    <span>One-click version rollback & history</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#d4a373] mt-0.5 shrink-0" />
                    <span>Structured JSON validation schemas</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
              >
                <span>Get started</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Card 2: 01 Variant Review & QA Studio */}
            <div className="hirael-card p-6 sm:p-8 min-h-[420px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                    <MessageSquareQuote className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs text-[#52504b]">01</span>
                </div>

                <h3 className="text-base font-semibold text-[#ede8df] mb-3">
                  Variant Review & QA Studio
                </h3>

                <ul className="space-y-2.5 text-xs text-[#918e87]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>Simulated LinkedIn, X, IG & Shorts feeds</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>Real-time QA scorecard compliance checks</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>Single-element AI regeneration modifiers</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>Character limit & forbidden phrase filters</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
              >
                <span>Explore QA studio</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Card 3: 02 SHA-256 Media & Derivative Processor */}
            <div className="hirael-card p-6 sm:p-8 min-h-[420px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                    <Film className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs text-[#52504b]">02</span>
                </div>

                <h3 className="text-base font-semibold text-[#ede8df] mb-3">
                  Media Derivative Processor
                </h3>

                <ul className="space-y-2.5 text-xs text-[#918e87]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>SHA-256 media deduplication engine</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>Automated Pillow dimension extraction</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>Presets: 4:5, 1:1, 9:16, 16:9, 1.91:1</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>Central media asset reusability catalog</span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
              >
                <span>View pipeline</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>

            {/* Card 4: 03 Idempotent Calendar & Omnichannel */}
            <div className="hirael-card p-6 sm:p-8 min-h-[420px] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-9 h-9 rounded-2xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                    <Calendar className="w-4 h-4" />
                  </div>
                  <span className="font-mono text-xs text-[#52504b]">03</span>
                </div>

                <h3 className="text-base font-semibold text-[#ede8df] mb-3">
                  Idempotent Calendar & Adapters
                </h3>

                <ul className="space-y-2.5 text-xs text-[#918e87]">
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>SHA-256 idempotent state machine</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>LinkedIn (OAuth), IG (Creator Studio Mode)</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span>X/Twitter, YouTube Shorts, Threads, CMS</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <Check className="w-3.5 h-3.5 text-[#ede8df] mt-0.5 shrink-0" />
                    <span className="flex items-center gap-1.5">
                      <span>Soundscape focus toggle</span>
                      <button
                        onClick={toggleSoundscape}
                        className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-[#ede8df] text-[10px] flex items-center gap-1 cursor-pointer"
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="w-3 h-3 text-amber-400" /> Stop
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-emerald-400" /> Play
                          </>
                        )}
                      </button>
                    </span>
                  </li>
                </ul>
              </div>

              <Link
                href="/register"
                className="mt-6 pt-4 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
              >
                <span>Schedule dispatches</span>
                <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PAGE 4: ENQUIRIES & FOOTER (WATERMARK & GET IN)
            ========================================================================= */}
        <section
          id="enquiries"
          className="relative z-10 min-h-screen flex flex-col justify-between px-6 sm:px-12 md:px-20 pt-24 pb-8 border-t border-white/[0.05]"
        >
          <div className="space-y-12">
            {/* Call to Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 pb-12 border-b border-white/[0.06]">
              <div>
                <div className="text-[11px] font-mono tracking-widest text-[#85827b] uppercase mb-2">
                  ENQUIRIES & DEPLOYMENT
                </div>
                <h2 className="text-3xl sm:text-5xl md:text-6xl font-normal tracking-[-0.04em] text-[#ede8df]">
                  Let us transform your{" "}
                  <span className="font-editorial italic text-[#f7f4ed]">content operations.</span>
                </h2>
                <p className="text-xs sm:text-sm text-[#8a8a93] mt-2 max-w-xl">
                  Register your workspace to unlock multi-agent repurposing, brand intelligence, and idempotent cross-network publishing.
                </p>
              </div>

              <Link
                href="/register"
                className="hirael-pill-btn group self-start md:self-auto shrink-0 cursor-pointer"
              >
                <span className="text-sm font-semibold tracking-tight text-[#08080a]">Get in</span>
                <div className="w-7 h-7 rounded-full bg-[#08080a] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </Link>
            </div>

            {/* Direct Enquiry Form & Architecture Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Interactive Enquiry Form */}
              <div className="lg:col-span-6 hirael-card p-6 sm:p-8 space-y-4">
                <span className="text-[10px] font-mono tracking-widest text-[#85827b] uppercase block">
                  SEND AN ENQUIRY OR WORKSPACE INVITATION
                </span>
                <h3 className="text-xl font-normal text-[#ede8df]">
                  Enterprise & Agency Inquiries
                </h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Have custom brand tone guidelines, dedicated model endpoints, or high-volume publishing requirements? Let our operations team coordinate your setup.
                </p>

                {inquirySent ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Thank you. Your inquiry has been logged. We will reach out shortly.</span>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3 pt-2">
                    <div>
                      <label className="block text-[11px] font-mono text-[#85827b] mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder="operations@company.com"
                        className="w-full px-4 py-2.5 rounded-full bg-black/50 border border-white/10 text-xs text-[#ede8df] focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-mono text-[#85827b] mb-1">
                        Deployment Requirements / Message
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        placeholder="Describe your content pipeline, team scale, and target channels..."
                        className="w-full px-4 py-2.5 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#ede8df] focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <button
                        type="submit"
                        className="hirael-pill-btn text-xs cursor-pointer"
                      >
                        <span>Submit Enquiry</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </form>
                )}
              </div>

              {/* 3 Column Metadata Directory */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-6 text-xs text-[#75736d] p-2">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#85827b] uppercase block mb-3">
                    NAVIGATION
                  </span>
                  <ul className="space-y-2.5">
                    <li>
                      <button
                        onClick={() => scrollToSection("our-story")}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer"
                      >
                        Our story
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => scrollToSection("programs")}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer"
                      >
                        Programs & Features
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => scrollToSection("enquiries")}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer"
                      >
                        Enquiries
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleEnterOS}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer text-[#d4a373]"
                      >
                        Enter OS →
                      </button>
                    </li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#85827b] uppercase block mb-3">
                    CHANNELS
                  </span>
                  <ul className="space-y-2.5">
                    <li className="text-[#a6a39b]">
                      LinkedIn (Client ID Active)
                    </li>
                    <li className="text-[#a6a39b]">
                      Instagram (Creator Mode)
                    </li>
                    <li className="text-[#a6a39b]">
                      X / Twitter Threads
                    </li>
                    <li className="text-[#a6a39b]">
                      YouTube Shorts & Reels
                    </li>
                    <li className="text-[#a6a39b]">
                      Substack & Email CMS
                    </li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#85827b] uppercase block mb-3">
                    COMPLIANCE
                  </span>
                  <div className="space-y-2 text-[#8a8a93]">
                    <p>MIT License</p>
                    <p>FastAPI Backend</p>
                    <p>PostgreSQL / SQLite</p>
                    <p>Next.js 16 App Router</p>
                    <div className="pt-2">
                      <Link
                        href="/register"
                        className="text-xs text-[#d4a373] hover:underline"
                      >
                        Create Account →
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Monumental Watermark Typography - LISA with gentle warm glow */}
          <div className="w-full overflow-hidden flex justify-center -mb-8 sm:-mb-14 select-none pointer-events-none pt-12">
            <span className="watermark-brand tracking-tighter block font-bold text-center lisa-warm-glow">
              Lisa
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
