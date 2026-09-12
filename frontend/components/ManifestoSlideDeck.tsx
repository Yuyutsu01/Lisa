"use client";

import { useState, useRef, useEffect, MouseEvent } from "react";
import { ChevronLeft, ChevronRight, Sparkles, Volume2, VolumeX } from "lucide-react";

interface ManifestoSlide {
  id: string;
  tag: string;
  badge: string;
  headlineTop: string;
  headlineItalic: string;
  headlineBottom: string;
  subtextLead: string;
  subtextBody: string;
}

const MANIFESTO_SLIDES: ManifestoSlide[] = [
  {
    id: "thesis",
    tag: "01 · THE EDITORIAL THESIS",
    badge: "CANONICAL CRAFT",
    headlineTop: "Modern reach demands ubiquity,",
    headlineItalic: "yet quality demands obsession.",
    headlineBottom: "We refuse to let automated speed dilute human voice.",
    subtextLead: "In an era flooded with generic AI chatter,",
    subtextBody:
      " true resonance comes from canonical craftsmanship—transforming one singular, high-value insight into native expressions across every channel without compromising depth or authenticity.",
  },
  {
    id: "manifesto",
    tag: "VISUAL ARTS",
    badge: "VISUAL ARTS",
    headlineTop: "Lisa is an independent creative studio,",
    headlineItalic: "born from restless curiosity.",
    headlineBottom: "We shape voice, insight and narrative into work that lingers.",
    subtextLead: "Engineered for visionary teams and ambitious creators,",
    subtextBody:
      " we orchestrate specialized AI agents with deterministic software safeguards, crafting cinema-grade copy and native media across LinkedIn, X, Instagram, Shorts and beyond that earn acclaim worldwide.",
  },
  {
    id: "safeguards",
    tag: "03 · DETERMINISTIC ARCHITECTURE",
    badge: "GOVERNANCE & PRECISION",
    headlineTop: "AI proposes with limitless boldness,",
    headlineItalic: "software governs with precision.",
    headlineBottom: "A closed-loop pipeline where creative intuition and deterministic code unite.",
    subtextLead: "From SHA-256 media aspect ratio conversions",
    subtextBody:
      " to brand forbidden-phrase compliance and character boundary validation, every variant undergoes strict verification before a single syllable touches public feeds.",
  },
];

interface ManifestoSlideDeckProps {
  isPlayingAudio?: boolean;
  onToggleSoundscape?: () => void;
}

export function ManifestoSlideDeck({
  isPlayingAudio = false,
  onToggleSoundscape,
}: ManifestoSlideDeckProps) {
  // Default to slide index 1 (Slide 2: The Creative Manifesto from the user's reference photo)
  const [currentSlide, setCurrentSlide] = useState(1);
  const [mousePos, setMousePos] = useState({ x: 0.5, y: 0.5 });
  const [pixelPos, setPixelPos] = useState({ x: 400, y: 250 });
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const slide = MANIFESTO_SLIDES[currentSlide];

  // Mouse move handler for interactive spotlight & 3D tilt effect
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setPixelPos({ x, y });
    setMousePos({
      x: x / rect.width,
      y: y / rect.height,
    });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0.5, y: 0.5 });
  };

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % MANIFESTO_SLIDES.length);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + MANIFESTO_SLIDES.length) % MANIFESTO_SLIDES.length);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") nextSlide();
      if (e.key === "ArrowLeft") prevSlide();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Subtle 3D perspective tilt calculations (max 2.2 deg for premium feel)
  const tiltX = isHovered ? (mousePos.y - 0.5) * -3 : 0;
  const tiltY = isHovered ? (mousePos.x - 0.5) * 3 : 0;

  return (
    <div className="relative w-full max-w-5xl mx-auto select-none">
      {/* Top Header / Slide Tabs & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 px-2">
        <div className="flex items-center gap-1.5 sm:gap-2">
          {MANIFESTO_SLIDES.map((s, idx) => (
            <button
              key={s.id}
              onClick={() => setCurrentSlide(idx)}
              className={`px-3 py-1.5 rounded-full text-[10px] sm:text-[11px] font-mono tracking-wider transition-all duration-300 cursor-pointer flex items-center gap-1.5 ${
                currentSlide === idx
                  ? "bg-white/[0.12] text-[#ede8df] border border-white/[0.18] shadow-sm"
                  : "bg-transparent text-[#787672] hover:text-[#ede8df] hover:bg-white/[0.04] border border-transparent"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  currentSlide === idx ? "bg-[#d4a373] shadow-[0_0_6px_#d4a373]" : "bg-white/20"
                }`}
              />
              <span>0{idx + 1}</span>
              <span className="hidden sm:inline">{s.badge}</span>
            </button>
          ))}
        </div>

        {/* Slide Counter & Arrow Navigation */}
        <div className="flex items-center gap-2">
          {onToggleSoundscape && (
            <button
              onClick={onToggleSoundscape}
              aria-label="Toggle ambient soundscape"
              className={`px-2.5 py-1 rounded-full text-[10px] font-mono tracking-wider flex items-center gap-1.5 transition-colors border cursor-pointer ${
                isPlayingAudio
                  ? "bg-[#d4a373]/15 text-[#d4a373] border-[#d4a373]/30 shadow-[0_0_12px_rgba(212,163,115,0.2)]"
                  : "bg-white/[0.03] text-[#787672] border-white/[0.08] hover:text-[#ede8df]"
              }`}
            >
              {isPlayingAudio ? (
                <>
                  <Volume2 className="w-3 h-3 text-[#d4a373] animate-pulse" />
                  <span className="hidden sm:inline">SOUNDSCAPE ON</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3 h-3" />
                  <span className="hidden sm:inline">AMBIENT SOUND</span>
                </>
              )}
            </button>
          )}

          <div className="h-4 w-[1px] bg-white/10 mx-0.5" />

          <span className="text-[11px] font-mono text-[#85827b] mr-1">
            0{currentSlide + 1} <span className="text-white/20">/</span> 0{MANIFESTO_SLIDES.length}
          </span>

          <button
            onClick={prevSlide}
            aria-label="Previous manifesto slide"
            className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/10 hover:border-white/20 text-[#ede8df] flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={nextSlide}
            aria-label="Next manifesto slide"
            className="w-8 h-8 rounded-full bg-white/[0.04] border border-white/[0.08] hover:bg-white/10 hover:border-white/20 text-[#ede8df] flex items-center justify-center transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Slide Card Container - Recreating the photo layout and atmospheric effects */}
      <div
        ref={cardRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        style={{
          transform: `perspective(1000px) rotateX(${tiltX}deg) rotateY(${tiltY}deg)`,
          transition: isHovered ? "transform 0.1s ease-out" : "transform 0.5s ease-out",
        }}
        className="group relative rounded-[28px] sm:rounded-[36px] bg-[#0c0c0f] border border-white/[0.08] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.85)] overflow-hidden transition-all duration-300 hover:border-white/[0.18]"
      >
        {/* Dynamic Mouse-Following Ambient Spotlight Effect */}
        <div
          className="pointer-events-none absolute inset-0 transition-opacity duration-300 z-0"
          style={{
            opacity: isHovered ? 1 : 0.45,
            background: `radial-gradient(650px circle at ${pixelPos.x}px ${pixelPos.y}px, rgba(212, 163, 115, 0.12), rgba(244, 239, 230, 0.03) 35%, transparent 70%)`,
          }}
        />

        {/* Ambient Top Rim Highlight */}
        <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-3/4 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        {/* Floating Ambient Starlight Particles */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden opacity-30 z-0">
          <div className="absolute top-[20%] left-[15%] w-1 h-1 rounded-full bg-[#d4a373] animate-ping" />
          <div className="absolute top-[70%] right-[18%] w-1.5 h-1.5 rounded-full bg-white/40 animate-pulse" />
          <div className="absolute bottom-[25%] left-[30%] w-1 h-1 rounded-full bg-[#d4a373]/60" />
        </div>

        {/* Slide Content Area (Generous padding and centered alignment matching the photo) */}
        <div className="relative z-10 py-16 sm:py-24 md:py-28 px-6 sm:px-12 md:px-20 text-center flex flex-col items-center justify-center min-h-[460px] sm:min-h-[520px]">
          {/* Top Kicker Tag: e.g. "VISUAL ARTS" or "VISUAL & EDITORIAL ARTS" */}
          <div className="mb-6 sm:mb-8 flex items-center justify-center gap-2">
            <span className="text-[10px] sm:text-[11px] font-mono tracking-[0.3em] uppercase text-[#85827b] transition-colors group-hover:text-[#a6a39b]">
              {slide.tag}
            </span>
          </div>

          {/* Center Monumental Editorial Serif Statement */}
          <div className="max-w-3xl sm:max-w-4xl mx-auto space-y-2 sm:space-y-3">
            <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-[3.6rem] font-normal leading-[1.18] tracking-[-0.03em] text-[#ede8df]">
              {slide.headlineTop}{" "}
              <span className="font-editorial italic text-[#f7f4ed] manifesto-glow-text relative inline-block transition-transform duration-300 group-hover:scale-[1.01]">
                {slide.headlineItalic}
              </span>{" "}
              {slide.headlineBottom}
            </h2>
          </div>

          {/* Bottom Subtext with Bold Lead Phrase (matching the photo's lower paragraph) */}
          <div className="mt-10 sm:mt-14 max-w-2xl sm:max-w-3xl mx-auto">
            <p className="text-xs sm:text-[13px] md:text-sm text-[#787672] leading-relaxed font-normal transition-colors duration-300 group-hover:text-[#8a8a93]">
              <strong className="font-semibold text-[#ede8df] tracking-tight">
                {slide.subtextLead}
              </strong>
              {slide.subtextBody}
            </p>
          </div>

          {/* Interactive Micro-Cue at Bottom */}
          <div className="mt-8 sm:mt-10 flex items-center justify-center gap-3">
            <div className="flex items-center gap-1.5">
              {MANIFESTO_SLIDES.map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentSlide(i)}
                  aria-label={`Go to slide ${i + 1}`}
                  className={`h-1 rounded-full transition-all duration-300 cursor-pointer ${
                    currentSlide === i
                      ? "w-8 bg-[#d4a373] shadow-[0_0_8px_#d4a373]"
                      : "w-2 bg-white/20 hover:bg-white/40"
                  }`}
                />
              ))}
            </div>

            <div className="h-3 w-[1px] bg-white/10 mx-1" />

            <button
              onClick={nextSlide}
              className="text-[10px] font-mono tracking-widest text-[#85827b] hover:text-[#d4a373] uppercase transition-colors flex items-center gap-1 cursor-pointer"
            >
              <span>NEXT VIEW</span>
              <Sparkles className="w-2.5 h-2.5" />
            </button>
          </div>
        </div>

        {/* Ambient Corner Lighting Accents */}
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-[#d4a373]/5 blur-3xl" />
        <div className="pointer-events-none absolute -top-16 -right-16 w-48 h-48 rounded-full bg-white/[0.04] blur-3xl" />
      </div>
    </div>
  );
}
