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
import { FloatingPlatformLogos } from "@/components/FloatingPlatformLogos";

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
      const sections = [
        "enquiries",
        "programs",
        "problem-statement",
        "our-story",
        "hero",
      ];
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

  // Smooth scroll handler with precise viewport positioning
  const scrollToSection = (id: string) => {
    if (id === "hero") {
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const el = document.getElementById(id);
    if (el) {
      // For top-level major sections (our-story, programs, enquiries), scroll cleanly to the section's top boundary.
      // For inner subsections (like problem-statement), offset by navbar height (~76px).
      const navOffset = id === "problem-statement" ? 76 : 0;
      const elementTop = el.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({
        top: Math.max(0, elementTop - navOffset),
        behavior: "smooth",
      });
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
    <div className="min-h-screen w-full bg-[#08080a] text-[#ede8df] selection:bg-[#ede8df]/20 selection:text-white flex flex-col">
      {/* 8. Sleek Scroll Progress Indicator */}
      <div className="fixed top-0 left-0 right-0 h-[2.5px] z-50 pointer-events-none bg-white/[0.04]">
        <div
          className="h-full bg-gradient-to-r from-[#d4a373] via-[#ede8df] to-[#d4a373] transition-all duration-75 ease-out shadow-[0_0_12px_rgba(212,163,115,0.6)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Full-bleed Full Screen Canvas */}
      <div className="w-full bg-[#08080a] relative overflow-hidden flex flex-col min-h-screen flex-1">
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
        <div className="sticky top-3 sm:top-4 lg:top-6 w-full px-4 sm:px-8 flex items-center justify-center z-40 pointer-events-none transition-all duration-300">
          <nav
            className={`inline-flex items-center gap-1 sm:gap-1.5 lg:gap-2 px-3 sm:px-5 lg:px-7 py-1.5 sm:py-2 lg:py-3 rounded-full text-xs sm:text-[13px] lg:text-[14.5px] text-[#a6a39b] shadow-2xl pointer-events-auto transition-all duration-300 ${
              isScrolled
                ? "bg-[#0c0c0e]/95 backdrop-blur-2xl border border-white/15 shadow-black/80 py-1.5 lg:py-2.5 scale-95"
                : "hirael-glass-nav border border-white/10"
            }`}
          >
            <button
              type="button"
              onClick={() => scrollToSection("hero")}
              className={`px-3 sm:px-3.5 lg:px-4.5 py-1.5 lg:py-2 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "hero"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Home
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("our-story")}
              className={`px-3 sm:px-3.5 lg:px-4.5 py-1.5 lg:py-2 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "our-story"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Pipeline
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("problem-statement")}
              className={`px-3 sm:px-3.5 lg:px-4.5 py-1.5 lg:py-2 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "problem-statement"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Problem
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("programs")}
              className={`px-3 sm:px-3.5 lg:px-4.5 py-1.5 lg:py-2 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "programs"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Features
            </button>
            <button
              type="button"
              onClick={() => scrollToSection("enquiries")}
              className={`px-3 sm:px-3.5 lg:px-4.5 py-1.5 lg:py-2 rounded-full transition-all duration-150 active:scale-95 cursor-pointer font-medium ${
                activeSection === "enquiries"
                  ? "bg-white/[0.14] text-[#ede8df] shadow-sm"
                  : "hover:text-[#ede8df] hover:bg-white/[0.06]"
              }`}
            >
              Enquiries
            </button>

            {/* Direct Gateway to Content Studio OS with Magnetic Glow */}
            <div className="h-4 lg:h-5 w-[1px] bg-white/10 mx-1 lg:mx-2" />
            <InteractiveButton
              onClick={handleEnterOS}
              variant="secondary"
              size="sm"
              magnetic
              glow
              leftIcon={<Sparkles className="w-3 h-3 lg:w-4 lg:h-4 text-[#d4a373]" />}
              className="font-semibold text-xs lg:text-[14px] py-1 lg:py-2 px-3.5 lg:px-5"
            >
              Enter OS
            </InteractiveButton>
          </nav>
        </div>

        {/* =========================================================================
            PAGE 1: HERO VIEWPORT (Parallel Lisa* & Description + Bottom CTAs)
            ========================================================================= */}
        <section
          id="hero"
          className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 sm:px-12 md:px-16 pt-24 pb-12 sm:pb-16 text-center overflow-hidden"
        >
          {/* Subtle Floating Platform Logos (Drifting background marks on desktop) */}
          <FloatingPlatformLogos />

          {/* Centered Single-Column Stack: Lisa* -> Tagline -> Get in Button */}
          <div className="flex flex-col items-center justify-center text-center gap-8 lg:gap-10 max-w-3xl lg:max-w-4xl mx-auto my-auto">
            {/* Monumental Brandmark (Centered) */}
            <div
              className="transition-transform duration-75 ease-out will-change-transform shrink-0 flex items-center justify-center text-center"
              style={{
                transform: `translateY(${Math.min(scrollY * 0.14, 85)}px)`,
                opacity: Math.max(0.3, 1 - scrollY / 650),
              }}
            >
              <h1 className="lisa-hero-title text-[20vw] sm:text-[17vw] lg:text-[13.5rem] xl:text-[16rem] 2xl:text-[19rem] font-normal leading-[0.78] tracking-[-0.055em] select-none text-center cursor-pointer">
                Lisa<span className="lisa-asterisk text-[#d4a373] inline-block -translate-y-1 sm:-translate-y-4 lg:-translate-y-7 text-[0.52em]">*</span>
              </h1>
            </div>

            {/* Description & Action Block (Centered) */}
            <div className="space-y-5 max-w-xl xl:max-w-2xl text-center flex flex-col items-center justify-center">
              <div className="space-y-3">
                <p className="text-base sm:text-lg lg:text-[22px] font-normal text-[#ede8df] tracking-tight leading-snug">
                  Create once. Adapt intelligently. Publish everywhere possible. Learn from performance.
                </p>
                <p className="text-sm sm:text-[16px] lg:text-[16.5px] text-[#8a8a93] leading-relaxed max-w-xl mx-auto">
                  Enterprise-grade, multi-tenant AI content operations operating system (OS). Rather than a simple chat wrapper,{" "}
                  <span className="lisa-warm-glow font-medium">Lisa</span> orchestrates specialized agents with deterministic software safeguards.
                </p>
              </div>

              {/* 1. Hover Glow + 2. Magnetic Button + 3. Gradient Shimmer CTA Button */}
              <div className="pt-2 flex justify-center">
                <InteractiveButton
                  href="/register"
                  variant="primary"
                  size="lg"
                  glow
                  shimmer
                  magnetic
                  rightIcon={
                    <div className="w-7 h-7 rounded-full bg-[#08080a] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                      <ArrowRight className="w-3.5 h-3.5 text-[#ede8df]" />
                    </div>
                  }
                  className="px-7 py-3.5 text-sm sm:text-[15px] font-semibold"
                >
                  Get in
                </InteractiveButton>
              </div>
            </div>
          </div>
        </section>

        {/* =========================================================================
            PAGE 2: OUR STORY (ORCHESTRATION PIPELINE & CORE PRINCIPLES)
            ========================================================================= */}
        <section
          id="our-story"
          className="relative z-10 flex flex-col justify-center px-6 sm:px-12 md:px-16 py-14 sm:py-20 lg:py-28 border-t border-white/[0.05]"
        >
          <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto space-y-12 lg:space-y-16">
            {/* Architectural Columns & Pipeline Overview */}
            <div className="text-center space-y-4 lg:space-y-5">
              <div className="text-[10px] sm:text-[11px] lg:text-[13px] xl:text-[14px] font-mono tracking-[0.25em] text-[#85827b] uppercase">
                1. ORCHESTRATION PIPELINE & CORE PRINCIPLES
              </div>

              <h3 className="text-xl sm:text-3xl md:text-4xl lg:text-[2.6rem] xl:text-[3.2rem] font-normal leading-[1.2] tracking-[-0.03em] text-[#ede8df] max-w-5xl mx-auto">
                Specialized AI agents collaborate with{" "}
                <span className="font-editorial italic text-[#f7f4ed]">deterministic software safeguards.</span>
              </h3>

              <p className="text-xs sm:text-sm lg:text-[16px] xl:text-[17px] leading-relaxed text-[#8a8a93] max-w-3xl lg:max-w-4xl mx-auto font-normal">
                Rather than acting as a simple generic chat wrapper that writes captions,{" "}
                <span className="lisa-warm-glow font-medium">Lisa</span> takes your original content and rewrites it for each platform (LinkedIn, X/Twitter, Instagram, Discord, Threads, Email, and Blog), checks it against your brand&apos;s voice and rules, lets you approve it before it goes out, and tracks how each post performs to make the next one better.
              </p>
            </div>

            {/* Core Product Principle - 4 Architectural Columns with Card Hover Lift */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {[
                {
                  stage: "01",
                  icon: Sparkles,
                  title: "AI Writes the First Draft",
                  desc: "Lisa takes your original idea and writes a version made for each platform — the right hook, format, and style for LinkedIn, X, Instagram, and more.",
                  delay: 0,
                },
                {
                  stage: "02",
                  icon: ShieldAlert,
                  title: "Automatic Quality Check",
                  desc: "Before you see it, Lisa checks the basics: character limits, banned words, hashtag count, and image sizing — all fixed automatically.",
                  delay: 80,
                },
                {
                  stage: "03",
                  icon: Sliders,
                  title: "You Review and Approve",
                  desc: "See exactly how each post will look on each platform, make any edits you want, then approve it to go out.",
                  delay: 160,
                },
                {
                  stage: "04",
                  icon: BarChart3,
                  title: "Learns What Works",
                  desc: "Lisa tracks how your posts perform across every platform and shows you what's worth turning into new content.",
                  delay: 240,
                },
              ].map((item, idx) => {
                const Icon = item.icon;
                return (
                  <div
                    key={idx}
                    className="hirael-card card-hover-lift p-5 sm:p-6 lg:p-7 xl:p-8 space-y-3 lg:space-y-4 h-full flex flex-col justify-between"
                  >
                    <div className="space-y-3 lg:space-y-3.5">
                      <div className="flex items-center justify-between text-xs lg:text-[13px] xl:text-[14px] font-mono text-[#d4a373]">
                        <span>STAGE {item.stage}</span>
                        <Icon className="w-3.5 h-3.5 lg:w-4.5 lg:h-4.5 xl:w-5 xl:h-5" />
                      </div>
                      <h3 className="text-xs sm:text-sm lg:text-[16px] xl:text-[18px] font-semibold text-[#ede8df] leading-snug">
                        {item.title}
                      </h3>
                    </div>
                    <p className="text-[11px] sm:text-xs lg:text-[13.5px] xl:text-[14.5px] text-[#8a8a93] leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Problem Statement Section - Target for navbar 'Problem' button */}
            <div
              id="problem-statement"
              className="pt-8 lg:pt-12 border-t border-white/[0.06] space-y-6 lg:space-y-8"
            >
              <div className="text-[10px] sm:text-[11px] lg:text-[13px] xl:text-[14px] font-mono tracking-widest text-[#85827b] uppercase text-center">
                2. PROBLEM STATEMENT · SOLVING CONTENT OPERATIONS FRICTION
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 lg:gap-6 text-xs">
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
                    className="p-5 sm:p-6 lg:p-7 xl:p-8 rounded-2xl bg-white/[0.02] border border-white/[0.05] card-hover-lift space-y-2 lg:space-y-3 flex flex-col justify-between"
                  >
                    <h4 className="font-semibold text-[#ede8df] flex items-center gap-2.5 text-xs sm:text-sm lg:text-[16px] xl:text-[17.5px]">
                      <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-rose-400 shrink-0" />
                      {item.title}
                    </h4>
                    <p className="text-[#8a8a93] text-[11px] sm:text-xs lg:text-[13.5px] xl:text-[14.5px] leading-relaxed">
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
          className="relative z-10 flex flex-col justify-center px-6 sm:px-10 md:px-16 py-16 sm:py-24 lg:py-32 border-t border-white/[0.05]"
        >
          <div className="text-center space-y-3 lg:space-y-4 mb-10 sm:mb-14 lg:mb-16">
            <div className="text-[10px] sm:text-[11px] lg:text-[13px] xl:text-[14px] font-mono tracking-[0.25em] text-[#85827b] uppercase">
              3. KEY FEATURES & ENGINE CAPABILITIES
            </div>
            <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-[2.6rem] xl:text-[3.2rem] font-normal tracking-tight text-[#ede8df] leading-[1.2]">
              Studio-grade architecture for visionary creators.
            </h2>
            <p className="text-xs sm:text-sm lg:text-[16px] xl:text-[17px] text-[#8a8a93] max-w-2xl lg:max-w-3xl mx-auto leading-relaxed">
              Engineered with multi-tenant RBAC, deterministic state machines, and high-velocity Groq inference.
            </p>
          </div>

          {/* 10. Horizontal Scroll Section with Navigation Arrows */}
          <div className="relative mb-8 max-w-7xl mx-auto w-full">
            <div className="flex items-center justify-between pb-3 lg:pb-4 px-1">
              <span className="text-[11px] lg:text-[13.5px] font-mono uppercase tracking-wider text-[#85827b] flex items-center gap-2">
                <span className="w-1.5 h-1.5 lg:w-2 lg:h-2 rounded-full bg-[#d4a373]" />
                Interactive Module Carousel
              </span>
              <div className="flex items-center gap-2.5">
                <button
                  onClick={() => scrollHorizontal("left")}
                  aria-label="Scroll left"
                  className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 flex items-center justify-center text-[#ede8df] transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
                <button
                  onClick={() => scrollHorizontal("right")}
                  aria-label="Scroll right"
                  className="w-8 h-8 lg:w-10 lg:h-10 rounded-full bg-white/[0.05] border border-white/10 hover:bg-white/10 flex items-center justify-center text-[#ede8df] transition-all active:scale-95 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4 lg:w-5 lg:h-5" />
                </button>
              </div>
            </div>

            <div
              ref={horizontalScrollRef}
              className="horizontal-scroll-snap flex gap-4 lg:gap-6 overflow-x-auto pb-4 pt-1 scrollbar-none"
            >
              {/* Card 1 */}
              <div className="hirael-card card-hover-lift p-6 sm:p-7 lg:p-8 xl:p-9 w-[290px] sm:w-[340px] lg:w-[370px] xl:w-[410px] min-h-[380px] lg:min-h-[460px] xl:min-h-[480px] flex flex-col justify-between bg-gradient-to-b from-[#121216] to-[#0a0a0c] shrink-0">
                <div className="space-y-4 lg:space-y-5">
                  <div className="flex items-center justify-between text-xs lg:text-[13px] text-[#75736d] mb-4">
                    <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-[#d4a373]">
                      <Cpu className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <span className="font-mono text-xs lg:text-[13px] text-[#52504b]">00</span>
                  </div>

                  <h3 className="text-sm sm:text-base lg:text-[18px] xl:text-[20px] font-semibold text-[#ede8df] mb-2.5">
                    AI That Writes for Every Platform
                  </h3>

                  <ul className="space-y-2 lg:space-y-3 text-[11px] sm:text-xs lg:text-[13.5px] xl:text-[14.5px] text-[#918e87]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>5 specialized AI steps, each one checked before the next starts</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>Edit anything directly, changes save automatically</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>Undo any change and see the full history</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#d4a373] mt-0.5 shrink-0" />
                      <span>Every draft is checked against a strict format before it&apos;s accepted</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-4 pt-3 lg:pt-4 border-t border-white/[0.06] text-xs lg:text-[14px] font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>Get started</span>
                  <ArrowUpRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Card 2 */}
              <div className="hirael-card card-hover-lift p-6 sm:p-7 lg:p-8 xl:p-9 w-[290px] sm:w-[340px] lg:w-[370px] xl:w-[410px] min-h-[380px] lg:min-h-[460px] xl:min-h-[480px] flex flex-col justify-between shrink-0">
                <div className="space-y-4 lg:space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                      <MessageSquareQuote className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <span className="font-mono text-xs lg:text-[13px] text-[#52504b]">01</span>
                  </div>

                  <h3 className="text-sm sm:text-base lg:text-[18px] xl:text-[20px] font-semibold text-[#ede8df] mb-2.5">
                    Review Before Anything Goes Live
                  </h3>

                  <ul className="space-y-2 lg:space-y-3 text-[11px] sm:text-xs lg:text-[13.5px] xl:text-[14.5px] text-[#918e87]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>See exactly how each post will look on LinkedIn, X, Instagram, and Shorts</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Live quality check as you edit — catches issues instantly</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Ask for a specific change and only that part gets rewritten</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Automatically checks length limits and blocks banned words</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-4 pt-3 lg:pt-4 border-t border-white/[0.06] text-xs lg:text-[14px] font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>Explore QA studio</span>
                  <ArrowUpRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Card 3 */}
              <div className="hirael-card card-hover-lift p-6 sm:p-7 lg:p-8 xl:p-9 w-[290px] sm:w-[340px] lg:w-[370px] xl:w-[410px] min-h-[380px] lg:min-h-[460px] xl:min-h-[480px] flex flex-col justify-between shrink-0">
                <div className="space-y-4 lg:space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                      <Film className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <span className="font-mono text-xs lg:text-[13px] text-[#52504b]">02</span>
                  </div>

                  <h3 className="text-sm sm:text-base lg:text-[18px] xl:text-[20px] font-semibold text-[#ede8df] mb-2.5">
                    Your Images and Videos, Handled Automatically
                  </h3>

                  <ul className="space-y-2 lg:space-y-3 text-[11px] sm:text-xs lg:text-[13.5px] xl:text-[14.5px] text-[#918e87]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Never uploads the same file twice</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Automatically detects the right size for each platform</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Ready-made sizing for every format (square, story, widescreen, and more)</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>One media library, reused across all your posts</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-4 pt-3 lg:pt-4 border-t border-white/[0.06] text-xs lg:text-[14px] font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>View pipeline</span>
                  <ArrowUpRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </Link>
              </div>

              {/* Card 4 */}
              <div className="hirael-card card-hover-lift p-6 sm:p-7 lg:p-8 xl:p-9 w-[290px] sm:w-[340px] lg:w-[370px] xl:w-[410px] min-h-[380px] lg:min-h-[460px] xl:min-h-[480px] flex flex-col justify-between shrink-0">
                <div className="space-y-4 lg:space-y-5">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-8 h-8 lg:w-11 lg:h-11 rounded-xl bg-white/[0.05] border border-white/[0.08] flex items-center justify-center text-[#ede8df]">
                      <Calendar className="w-4 h-4 lg:w-5 lg:h-5" />
                    </div>
                    <span className="font-mono text-xs lg:text-[13px] text-[#52504b]">03</span>
                  </div>

                  <h3 className="text-sm sm:text-base lg:text-[18px] xl:text-[20px] font-semibold text-[#ede8df] mb-2.5">
                    Nothing Gets Posted Twice
                  </h3>

                  <ul className="space-y-2 lg:space-y-3 text-[11px] sm:text-xs lg:text-[13.5px] xl:text-[14.5px] text-[#918e87]">
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Built-in safeguard makes sure a scheduled post never accidentally goes out twice</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Connects to LinkedIn and Instagram through your own account</span>
                    </li>
                    <li className="flex items-start gap-2.5">
                      <Check className="w-3 h-3 lg:w-4 lg:h-4 text-[#ede8df] mt-0.5 shrink-0" />
                      <span>Also works with X/Twitter, Discord, Threads, and your blog</span>
                    </li>
                  </ul>
                </div>

                <Link
                  href="/register"
                  className="mt-4 pt-3 lg:pt-4 border-t border-white/[0.06] text-xs lg:text-[14px] font-medium text-[#a6a39b] hover:text-[#ede8df] flex items-center justify-between group transition-colors"
                >
                  <span>Schedule dispatches</span>
                  <ArrowUpRight className="w-3.5 h-3.5 lg:w-4 lg:h-4 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
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
          className="relative z-10 flex flex-col justify-between px-6 sm:px-12 md:px-16 lg:px-20 py-16 sm:py-20 lg:py-28 border-t border-white/[0.05]"
        >
          <div className="max-w-5xl lg:max-w-6xl xl:max-w-7xl mx-auto w-full space-y-12 lg:space-y-16">
            {/* Call to Action Bar */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 lg:pb-10 border-b border-white/[0.06]">
              <div className="space-y-2">
                <div className="text-[10px] sm:text-[11px] lg:text-[13px] xl:text-[14px] font-mono tracking-[0.25em] text-[#85827b] uppercase mb-1.5">
                  4. ENQUIRIES & DEPLOYMENT
                </div>
                <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[2.6rem] xl:text-[3.2rem] font-normal tracking-[-0.04em] text-[#ede8df] leading-tight">
                  Let us transform your{" "}
                  <span className="font-editorial italic text-[#f7f4ed]">content operations.</span>
                </h2>
                <p className="text-xs sm:text-sm lg:text-[15.5px] xl:text-[16.5px] text-[#8a8a93] mt-2 max-w-2xl leading-relaxed">
                  Register your workspace to unlock multi-agent repurposing, brand intelligence, and idempotent cross-network publishing.
                </p>
              </div>

              <InteractiveButton
                href="/register"
                variant="primary"
                size="lg"
                glow
                shimmer
                magnetic
                rightIcon={
                  <div className="w-7 h-7 rounded-full bg-[#08080a] text-white flex items-center justify-center transition-transform duration-300 group-hover:translate-x-0.5">
                    <ArrowRight className="w-3.5 h-3.5 text-[#ede8df]" />
                  </div>
                }
                className="px-6 sm:px-7 py-3 sm:py-3.5 text-xs sm:text-sm lg:text-[15px] font-semibold self-start md:self-auto shrink-0"
              >
                Get in
              </InteractiveButton>
            </div>

            {/* Direct Enquiry Form & Architecture Details */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10">
              {/* Interactive Enquiry Form */}
              <div className="lg:col-span-7 hirael-card p-6 sm:p-8 lg:p-9 xl:p-10 space-y-4 lg:space-y-5 rounded-2xl sm:rounded-3xl">
                <span className="text-[10px] sm:text-[11px] lg:text-[12.5px] xl:text-[13.5px] font-mono tracking-widest text-[#85827b] uppercase block">
                  SEND AN ENQUIRY OR WORKSPACE INVITATION
                </span>
                <h3 className="text-xl sm:text-2xl lg:text-[24px] xl:text-[26px] font-normal text-[#ede8df]">
                  Enterprise & Agency Inquiries
                </h3>
                <p className="text-xs sm:text-sm lg:text-[14px] xl:text-[15px] text-[#8a8a93] leading-relaxed">
                  Have custom brand tone guidelines, dedicated model endpoints, or high-volume publishing requirements? Let our operations team coordinate your setup.
                </p>

                {inquiryStatus === "success" ? (
                  <div className="p-4 sm:p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs sm:text-sm flex items-center gap-3 animate-fadeIn">
                    <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                    <span>Thank you. Your inquiry has been logged. We will reach out shortly.</span>
                  </div>
                ) : (
                  <form onSubmit={handleInquirySubmit} className="space-y-4 pt-1">
                    <div>
                      <label className="block text-[11px] sm:text-xs lg:text-[13px] xl:text-[14px] font-mono text-[#85827b] mb-1.5">
                        Work Email
                      </label>
                      <input
                        type="email"
                        required
                        value={inquiryEmail}
                        onChange={(e) => setInquiryEmail(e.target.value)}
                        placeholder="operations@company.com"
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-xl bg-black/50 border border-white/10 text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] focus:outline-none focus:border-white/30 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] sm:text-xs lg:text-[13px] xl:text-[14px] font-mono text-[#85827b] mb-1.5">
                        Deployment Requirements / Message
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={inquiryMessage}
                        onChange={(e) => setInquiryMessage(e.target.value)}
                        placeholder="Describe your content pipeline, team scale, and target channels..."
                        className="w-full px-4 sm:px-5 py-2.5 sm:py-3 rounded-2xl bg-black/50 border border-white/10 text-xs sm:text-sm lg:text-[14.5px] text-[#ede8df] focus:outline-none focus:border-white/30 transition-colors"
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
                        rightIcon={<ArrowRight className="w-4 h-4" />}
                        className="text-xs sm:text-sm px-6 py-2.5"
                      >
                        Submit Enquiry
                      </InteractiveButton>
                    </div>
                  </form>
                )}
              </div>

              {/* 3 Column Metadata Directory */}
              <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-3 gap-6 lg:gap-8 text-xs lg:text-[13.5px] xl:text-[14.5px] text-[#75736d] p-2 lg:p-4 self-center">
                <div>
                  <span className="font-mono text-[11px] lg:text-[12.5px] xl:text-[13.5px] tracking-[0.2em] text-[#85827b] uppercase block mb-3 lg:mb-4">
                    NAVIGATION
                  </span>
                  <ul className="space-y-2.5 lg:space-y-3.5">
                    <li>
                      <button
                        onClick={() => scrollToSection("our-story")}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer text-left"
                      >
                        Pipeline
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => scrollToSection("problem-statement")}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer text-left"
                      >
                        Problem
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => scrollToSection("programs")}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer text-left"
                      >
                        Features
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => scrollToSection("enquiries")}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer text-left"
                      >
                        Enquiries
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={handleEnterOS}
                        className="hover:text-[#ede8df] transition-colors cursor-pointer text-[#d4a373] font-medium"
                      >
                        Enter OS →
                      </button>
                    </li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[11px] lg:text-[12.5px] xl:text-[13.5px] tracking-[0.2em] text-[#85827b] uppercase block mb-3 lg:mb-4">
                    CHANNELS
                  </span>
                  <ul className="space-y-2.5 lg:space-y-3.5">
                    <li className="text-[#a6a39b]">LinkedIn</li>
                    <li className="text-[#a6a39b]">Instagram</li>
                    <li className="text-[#a6a39b]">X / Threads</li>
                    <li className="text-[#a6a39b]">Discord Community</li>
                    <li className="text-[#a6a39b]">Substack & Email</li>
                  </ul>
                </div>

                <div>
                  <span className="font-mono text-[11px] lg:text-[12.5px] xl:text-[13.5px] tracking-[0.2em] text-[#85827b] uppercase block mb-3 lg:mb-4">
                    COMPLIANCE
                  </span>
                  <div className="space-y-2 lg:space-y-2.5 text-[#8a8a93]">
                    <p>MIT License</p>
                    <p>FastAPI Backend</p>
                    <p>PostgreSQL / SQLite</p>
                    <p>Next.js 16 App Router</p>
                    <div className="pt-2">
                      <Link
                        href="/register"
                        className="text-xs lg:text-[13.5px] text-[#d4a373] hover:underline font-medium"
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
          <div className="w-full overflow-hidden flex justify-center -mb-6 sm:-mb-10 select-none pointer-events-none pt-8 lg:pt-12">
            <span className="watermark-brand tracking-tighter block font-bold text-center lisa-warm-glow">
              Lisa
            </span>
          </div>
        </section>
      </div>
    </div>
  );
}
