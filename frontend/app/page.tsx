"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  ArrowUpRight,
  Film,
  MessageSquareQuote,
  Check,
  Sparkles,
  Volume2,
  VolumeX,
  Cpu,
  ShieldAlert,
  Calendar,
  BarChart3,
  Sliders,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { InteractiveButton } from "@/components/InteractiveButton";

export default function LisaHomePage() {
  const router = useRouter();
  const [inquiryStatus, setInquiryStatus] = useState<"idle" | "loading" | "success">("idle");
  const [inquiryEmail, setInquiryEmail] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");

  // Scroll tracking for parallax, active nav, sticky navbar transformation, and progress
  const [scrollY, setScrollY] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [activeSection, setActiveSection] = useState<string>("hero");
  const horizontalScrollRef = useRef<HTMLDivElement | null>(null);

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

  const scrollHorizontal = (direction: "left" | "right") => {
    if (horizontalScrollRef.current) {
      const scrollAmount = 360;
      horizontalScrollRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
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
    setInquiryStatus("loading");
    setTimeout(() => {
      setInquiryStatus("success");
      setTimeout(() => {
        setInquiryStatus("idle");
        setInquiryEmail("");
        setInquiryMessage("");
      }, 3500);
    }, 1200);
  };

  const isScrolled = scrollY > 60;

  return (
    <div className="min-h-screen bg-[#08080a] text-[#ede8df] selection:bg-[#ede8df]/20 selection:text-white p-2 sm:p-4 md:p-5 flex flex-col items-center">
      {/* 8. Sleek Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-white/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-[#d4a373] via-[#ede8df] to-[#d4a373] transition-all duration-75 ease-out shadow-[0_0_12px_rgba(212,163,115,0.6)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Container Frame with balanced proportions for laptop screens */}
      <div className="w-full max-w-[1440px] rounded-[20px] sm:rounded-[30px] bg-[#09090b] border border-white/[0.06] relative overflow-hidden shadow-2xl flex flex-col">
        {/* 13. Animated Ambient Gradient Background with 9. Subtle Parallax */}
        <div
          className="absolute top-0 right-0 w-[55vw] max-w-[750px] h-[480px] ambient-glow-warm pointer-events-none z-0 ambient-orb-1 transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${scrollY * 0.07}px)` }}
        />
        <div
          className="absolute top-[35%] left-[-8%] w-[45vw] h-[420px] ambient-glow-center pointer-events-none z-0 ambient-orb-2 transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${scrollY * 0.04}px)` }}
        />
        <div
          className="absolute bottom-[20%] right-[-8%] w-[45vw] h-[420px] ambient-glow-warm pointer-events-none z-0 transition-transform duration-200 ease-out"
          style={{ transform: `translateY(${-scrollY * 0.03}px)` }}
        />

        {/* 11. Sticky Navbar Transformation (Transitions from transparent/ambient to compact, darker, blurred) */}
        <div className="sticky top-3 sm:top-4 w-full px-4 sm:px-8 flex items-center justify-center z-40 pointer-events-none transition-all duration-300">
          <nav
            className={`inline-flex items-center gap-1 sm:gap-1.5 px-3 sm:px-5 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] text-[#a6a39b] shadow-2xl pointer-events-auto transition-all duration-300 ${
              isScrolled
                ? "bg-[#0c0c0e]/95 backdrop-blur-2xl border border-white/15 shadow-black/80 py-1.5 scale-95"
                : "hirael-glass-nav border border-white/10"
            }`}
          >
            <button
              onClick={() => scrollToSection("hero")}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "hero"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Home
            </button>
            <button
              onClick={() => scrollToSection("our-story")}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "our-story"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Our story
            </button>
            <button
              onClick={() => scrollToSection("programs")}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "programs"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Programs
            </button>
            <button
              onClick={() => scrollToSection("enquiries")}
              className={`px-3 sm:px-3.5 py-1.5 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "enquiries"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Enquiries
            </button>

            {/* Direct Gateway to Content Studio OS with Magnetic Glow */}
            <div className="h-4 w-[1px] bg-white/10 mx-1" />
            <InteractiveButton
              onClick={handleEnterOS}
              variant="secondary"
              size="sm"
              magnetic
              glow
              leftIcon={<Sparkles className="w-3 h-3 text-[#d4a373]" />}
              className="font-semibold text-xs py-1 px-3.5"
            >
              Enter OS
            </InteractiveButton>
          </nav>
        </div>

        {/* =========================================================================
            PAGE 1: HERO VIEWPORT (Optimized for Laptop Screens)
            ========================================================================= */}
        <section
          id="hero"
          className="relative z-10 min-h-[calc(100vh-3.5rem)] max-h-[920px] flex flex-col justify-between px-6 sm:px-12 md:px-16 pt-6 pb-10 sm:pb-12"
        >
          {/* Monumental Brandmark with balanced font sizing for laptop screens */}
          <div
            className="my-auto py-4 sm:py-8 transition-transform duration-75 ease-out will-change-transform"
            style={{
              transform: `translateY(${Math.min(scrollY * 0.14, 85)}px)`,
              opacity: Math.max(0.3, 1 - scrollY / 650),
            }}
          >
            <h1 className="lisa-hero-title text-[19vw] sm:text-[16vw] lg:text-[11.5rem] xl:text-[13rem] font-normal leading-[0.82] tracking-[-0.05em] select-none text-left cursor-pointer">
              Lisa<span className="lisa-asterisk text-[#d4a373] inline-block -translate-y-1 sm:-translate-y-5 text-[0.52em]">*</span>
            </h1>
          </div>

          {/* Bottom Row: Subtitle, Overview Excerpt, Scroll Cue, and Magnetic CTAs */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-end pt-2">
            {/* Tagline & Principle */}
            <div className="lg:col-span-7 space-y-2.5">
              <p className="text-sm sm:text-lg font-normal text-[#ede8df] tracking-tight">
                Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.
              </p>
              <p className="text-xs sm:text-[13px] text-[#8a8a93] max-w-xl leading-relaxed">
                Enterprise-grade, multi-tenant AI content operations operating system (OS). Rather than a simple chat wrapper,{" "}
                <span className="lisa-warm-glow font-medium">Lisa</span> orchestrates specialized agents with deterministic software safeguards.
              </p>

              {/* Interactive Scroll Down Cue */}
              <div className="pt-2">
                <button
                  onClick={() => scrollToSection("our-story")}
                  className="inline-flex items-center gap-2.5 text-[11px] font-mono tracking-wider text-[#787672] hover:text-[#d4a373] transition-colors cursor-pointer group"
                >
                  <div className="w-4 h-6 rounded-full border border-white/20 flex items-start justify-center p-0.5 group-hover:border-[#d4a373]/60 transition-colors">
                    <div className="w-1 h-2 rounded-full bg-[#d4a373] animate-bounce" />
                  </div>
                  <span>SCROLL DOWN</span>
                </button>
              </div>
            </div>

            {/* 1. Hover Glow + 2. Magnetic Button + 3. Gradient Shimmer CTA Button */}
            <div className="lg:col-span-5 flex flex-col items-start lg:items-end justify-end">
              <Link href="/register">
                <InteractiveButton
                  variant="primary"
                  size="lg"
                  glow
                  shimmer
                  magnetic
                  rightIcon={
                    <div className="w-6 h-6 rounded-full bg-[#08080a] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3 text-[#ede8df]" />
                    </div>
                  }
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold"
                >
                  Get in
                </InteractiveButton>
              </Link>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PAGE 2: OUR STORY (ORCHESTRATION PIPELINE & CORE PRINCIPLES)
            ========================================================================= */}
        <section
          id="our-story"
          className="relative z-10 flex flex-col justify-center px-6 sm:px-12 md:px-16 py-12 sm:py-16 border-t border-white/[0.05] scroll-mt-12"
        >
          <div className="max-w-5xl mx-auto space-y-12">
            {/* Architectural Columns & Pipeline Overview */}
            <div className="text-center space-y-3">
              <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#85827b] uppercase">
                1. ORCHESTRATION PIPELINE & CORE PRINCIPLES
              </div>

              <h3 className="text-xl sm:text-3xl md:text-4xl font-normal leading-[1.25] tracking-[-0.03em] text-[#ede8df]">
                Specialized AI agents collaborate with{" "}
                <span className="font-editorial italic text-[#f7f4ed]">deterministic software safeguards.</span>
              </h3>

              <p className="text-xs sm:text-sm leading-relaxed text-[#8a8a93] max-w-3xl mx-auto font-normal">
                Rather than acting as a simple generic chat wrapper that writes captions,{" "}
                <span className="lisa-warm-glow font-medium">Lisa</span> ingests canonical content sources, adapts them into platform-native variants (LinkedIn, X/Twitter, Instagram, YouTube Shorts, TikTok, Threads, Email Newsletters, and Blog CMS), validates them against brand guidelines, schedules them via an idempotent state machine, and analyzes cross-platform performance in a closed-loop feedback loop.
              </p>
            </div>

            {/* Core Product Principle - 4 Architectural Columns with 14. Card Hover Lift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  stage: "01",
                  icon: Sparkles,
                  title: "AI Proposes Structured Variants",
                  desc: "Specialized agents ingest canonical ideas and draft native hooks, threads, carousels, and scripts matching platform psychology.",
                  delay: 0,
                },
                {
                  stage: "02",
                  icon: ShieldAlert,
                  title: "Deterministic Validation",
                  desc: "Software validates strict boundaries: character limits, forbidden phrases, hashtag density, and visual aspect ratios automatically.",
                  delay: 80,
                },
                {
                  stage: "03",
                  icon: Sliders,
                  title: "Human-in-the-Loop Approval",
                  desc: "Creators review live simulated feed previews, tweak specific elements, and sign off before idempotent publishing dispatch.",
                  delay: 160,
                },
                {
                  stage: "04",
                  icon: BarChart3,
                  title: "Closed-Loop Growth Loop",
                  desc: "Cross-network analytics feed actionable repurposing opportunities and performance signals back to the top of the funnel.",
                  delay: 240,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div key={idx} className="hirael-card card-hover-lift p-5 space-y-2.5 h-full">
                    <div className="flex items-center justify-between text-xs font-mono text-[#d4a373]">
                      <span>STAGE {item.stage}</span>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <h3 className="text-xs sm:text-sm font-semibold text-[#ede8df]">
                      {item.title}
                    </h3>
                    <p className="text-[11px] sm:text-xs text-[#8a8a93] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Problem Statement Section */}
            <div className="pt-6 border-t border-white/[0.06]">
              <div className="text-[10px] font-mono tracking-widest text-[#85827b] uppercase mb-4 text-center">
                2. PROBLEM STATEMENT · SOLVING CONTENT OPERATIONS FRICTION
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 text-xs">
                {[
                  {
                    title: "Manual Repurposing Overhead",
                    desc: "Writing 1 high-value long-form article requires manually rewriting 8 different posts with distinct platform hooks, formatting rules, and character constraints. Lisa eliminates this overhead.",
                  },
                  {
                    title: "Brand Voice Drift",
                    desc: "Multi-member teams struggle to maintain consistent brand tone, terminology, forbidden phrase compliance, and audience positioning. Lisa enforces brand intelligence centrally.",
                  },
                  {
                    title: "Media Format Mismatches",
                    desc: "Manually cropping and aspect-ratio converting visual assets (Portrait 4:5, Square 1:1, Reels 9:16, Thumbnails 16:9) causes friction and visual bugs. Lisa automates derivative generation.",
                  },
                  {
                    title: "Scattered Distribution & Disconnected Analytics",
                    desc: "Scheduling across disconnected third-party tools prevents normalized cross-platform performance tracking and intelligent closed-loop repurposing. Lisa centralizes publishing and insights.",
                  },
                ].map((item, i) => (
                  <div
                    key={i}
                    className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.05] card-hover-lift space-y-1.5"
                  >
                    <h4 className="font-semibold text-[#ede8df] flex items-center gap-2 text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
                      {item.title}
                    </h4>
                    <p className="text-[#8a8a93] text-[11px] sm:text-xs leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PAGE 3: PROGRAMS (KEY FEATURES & AGENT ARCHITECTURE)
            ========================================================================= */}
        <section
          id="programs"
          className="relative z-10 flex flex-col justify-center px-6 sm:px-10 md:px-16 py-16 sm:py-24 border-t border-white/[0.05]"
        >
          <div className="text-center space-y-2.5 mb-10 sm:mb-14">
            <div className="text-[10px] sm:text-[11px] font-mono tracking-[0.25em] text-[#85827b] uppercase">
              3. KEY FEATURES & ENGINE CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-normal tracking-tight text-[#ede8df]">
              Studio-grade architecture for visionary creators.
            </h2>
            <p className="text-xs sm:text-sm text-[#8a8a93] max-w-2xl mx-auto">
              Engineered with multi-tenant RBAC, deterministic state machines, and high-velocity Groq inference.
            </p>
          </div>

          {/* 10. Horizontal Scroll Section with Navigation Arrows */}
          <div className="relative mb-8">
            <div className="flex items-center justify-between pb-3 px-1">
              <span className="text-[11px] font-mono uppercase tracking-wider text-[#85827b] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-[#d4a373]" />
                Interactive Module Carousel
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollHorizontal("left")}
                  aria-label="Scroll left"
                  className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 flex items-center justify-center text-[#ede8df] transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => scrollHorizontal("right")}
                  aria-label="Scroll right"
                  className="w-8 h-8 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 flex items-center justify-center text-[#ede8df] transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div
              ref={horizontalScrollRef}
              className="horizontal-scroll-snap flex gap-4 overflow-x-auto pb-4 pt-1 scrollbar-none"
            >
              {/* Card 1 */}
              <div className="hirael-card card-hover-lift p-6 w-[290px] sm:w-[330px] min-h-[380px] flex flex-col justify-between bg-gradient-to-b from-[#121216] to-[#0a0a0c]">
                <div>
                  <div className="flex items-center justify-between text-xs text-[#75736d] mb-4">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#d4a373]">
                      <Cpu className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs text-[#52504b]">00</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#ede8df] mb-2.5">
                    Multi-Agent Orchestrator
                  </h3>

                  <ul className="space-y-2 text-[11px] text-[#918e87]">
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>5 specialized agents for native formats</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>Rich-text studio with debounced saving</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>One-click version rollback & history</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>Structured JSON validation schemas</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>Get started</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Card 2 */}
              <div className="hirael-card card-hover-lift p-6 w-[290px] sm:w-[330px] min-h-[380px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                      <MessageSquareQuote className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs text-[#52504b]">01</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#ede8df] mb-2.5">
                    Variant Review & QA Studio
                  </h3>

                  <ul className="space-y-2 text-[11px] text-[#918e87]">
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Simulated LinkedIn, X, IG & Shorts feeds</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Real-time QA scorecard compliance checks</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Single-element AI regeneration modifiers</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Character limit & forbidden phrase filters</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>Explore QA studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Card 3 */}
              <div className="hirael-card card-hover-lift p-6 w-[290px] sm:w-[330px] min-h-[380px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                      <Film className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs text-[#52504b]">02</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#ede8df] mb-2.5">
                    Media Derivative Processor
                  </h3>

                  <ul className="space-y-2 text-[11px] text-[#918e87]">
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>SHA-256 media deduplication engine</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Automated aspect dimension extraction</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Presets: 4:5, 1:1, 9:16, 16:9, 1.91:1</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Central media asset reusability catalog</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>View pipeline</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Card 4 */}
              <div className="hirael-card card-hover-lift p-6 w-[290px] sm:w-[330px] min-h-[380px] flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <span className="font-mono text-xs text-[#52504b]">03</span>
                  </div>

                  <h3 className="text-sm font-semibold text-[#ede8df] mb-2.5">
                    Idempotent Calendar & Adapters
                  </h3>

                  <ul className="space-y-2 text-[11px] text-[#918e87]">
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>SHA-256 idempotent state machine</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>LinkedIn (OAuth), IG (Creator Studio Mode)</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>X/Twitter, YouTube Shorts, Threads, CMS</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <Check className="w-3 h-3 text-[#ede8df] mt-0.5 shrink-0" />
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
                  className="mt-4 pt-3 border-t border-white/[0.06] text-xs font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>Schedule dispatches</span>
                  <ArrowUpRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PAGE 4: ENQUIRIES & FOOTER (WATERMARK & GET IN)
            ========================================================================= */}
        <section
          id="enquiries"
          className="relative z-10 flex flex-col justify-between px-6 sm:px-12 md:px-16 pt-16 sm:pt-20 pb-6 border-t border-white/[0.05]"
        >
          <div className="space-y-10">
            {/* Call to Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-white/[0.06]">
              <div>
                <div className="text-[10px] sm:text-[11px] font-mono tracking-widest text-[#85827b] uppercase mb-1.5">
                  ENQUIRIES & DEPLOYMENT
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl font-normal tracking-[-0.04em] text-[#ede8df]">
                  Let us transform your{" "}
                  <span className="font-editorial italic text-[#f7f4ed]">content operations.</span>
                </h2>
                <p className="text-xs sm:text-[13px] text-[#8a8a93] mt-1.5 max-w-xl">
                  Register your workspace to unlock multi-agent repurposing, brand intelligence, and idempotent cross-network publishing.
                </p>
              </div>

              <Link href="/register">
                <InteractiveButton
                  variant="primary"
                  size="lg"
                  glow
                  shimmer
                  magnetic
                  rightIcon={
                    <div className="w-6 h-6 rounded-full bg-[#08080a] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight className="w-3 h-3 text-[#ede8df]" />
                    </div>
                  }
                  className="px-5 py-2.5 text-xs sm:text-sm font-semibold self-start md:self-auto shrink-0"
                >
                  Get in
                </InteractiveButton>
              </Link>
            </div>

            {/* Direct Enquiry Form & Architecture Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* Interactive Enquiry Form with 5. Loading -> Success Animation */}
              <div className="lg:col-span-6 hirael-card p-5 sm:p-7 space-y-3.5">
                <span className="text-[10px] font-mono tracking-widest text-[#85827b] uppercase block">
                  SEND AN ENQUIRY OR WORKSPACE INVITATION
                </span>
                <h3 className="text-lg sm:text-xl font-normal text-[#ede8df]">
                  Enterprise & Agency Inquiries
                </h3>
                <p className="text-xs text-[#8a8a93] leading-relaxed">
                  Have custom brand tone guidelines, dedicated model endpoints, or high-volume publishing requirements? Let our operations team coordinate your setup.
                </p>

                {inquiryStatus === "success" ? (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2 animate-fadeIn">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Thank you. Your inquiry has been logged. We will reach out shortly.</span>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-3 pt-1">
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-mono text-[#85827b] mb-1">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder="operations@company.com"
                        className="w-full px-4 py-2 rounded-full bg-black/50 border border-white/10 text-xs text-[#ede8df] focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] sm:text-[11px] font-mono text-[#85827b] mb-1">
                        Deployment Requirements / Message
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        placeholder="Describe your content pipeline, team scale, and target channels..."
                        className="w-full px-4 py-2 rounded-2xl bg-black/50 border border-white/10 text-xs text-[#ede8df] focus:outline-none focus:border-white/30"
                      />
                    </div>
                    <div className="flex justify-end pt-1">
                      <InteractiveButton
                        type="submit"
                        variant="primary"
                        size="md"
                        loading={inquiryStatus === "loading"}
                        loadingText="Transmitting..."
                        glow
                        shimmer
                        rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
                        className="text-xs"
                      >
                        Submit Enquiry
                      </InteractiveButton>
                    </div>
                  </form>
                )}
              </div>

              {/* 3 Column Metadata Directory */}
              <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-3 gap-5 text-xs text-[#75736d] p-2">
                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#85827b] uppercase block mb-2.5">
                    NAVIGATION
                  </span>
                  <ul className="space-y-2">
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
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#85827b] uppercase block mb-2.5">
                    CHANNELS
                  </span>
                  <ul className="space-y-2">
                    <li className="text-[#a6a39b]">LinkedIn (Client ID Active)</li>
                    <li className="text-[#a6a39b]">Instagram (Creator Mode)</li>
                    <li className="text-[#a6a39b]">X / Twitter Threads</li>
                    <li className="text-[#a6a39b]">YouTube Shorts & Reels</li>
                    <li className="text-[#a6a39b]">Substack & Email CMS</li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[10px] tracking-[0.2em] text-[#85827b] uppercase block mb-2.5">
                    COMPLIANCE
                  </span>
                  <div className="space-y-1.5 text-[#8a8a93]">
                    <p>MIT License</p>
                    <p>FastAPI Backend</p>
                    <p>PostgreSQL / SQLite</p>
                    <p>Next.js 16 App Router</p>
                    <div className="pt-1.5">
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
          <div className="w-full overflow-hidden flex justify-center -mb-6 sm:-mb-10 select-none pointer-events-none pt-8">
            <span className="watermark-brand tracking-tighter block font-bold text-center lisa-warm-glow">
              Lisa
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
