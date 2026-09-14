import React from "react";

/**
 * FloatingPlatformLogos component
 * 
 * Renders subtle floating brand marks (LinkedIn, Discord, X, Gmail) positioned on the
 * left and right sides of the Lisa landing hero viewport.
 *
 * Requirements:
 * - Hidden on viewports narrower than lg (1024px).
 * - pointer-events-none and aria-hidden="true" so text and CTA remain unhindered.
 * - Gentle looping vertical float animations (staggered rates & delays).
 * - Low opacity (0.25 - 0.35) and positioned to avoid colliding with centered hero stack.
 */
export function FloatingPlatformLogos() {
  return (
    <div
      aria-hidden="true"
      className="absolute inset-0 pointer-events-none hidden lg:block overflow-hidden z-0"
    >
      {/* ─────────────────────────────────────────────────────────────
          LEFT SIDE LOGOS
          ───────────────────────────────────────────────────────────── */}
      {/* 1. LinkedIn (Upper Left) */}
      <div
        className="absolute top-[22%] left-[6%] xl:left-[10%] animate-float-1 text-[#0077B5] opacity-35"
        title="LinkedIn"
      >
        <svg
          className="w-12 h-12 xl:w-14 xl:h-14 drop-shadow-[0_4px_12px_rgba(0,119,181,0.15)]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9v8.37H9.2V10.9H6.46M7.83 6.45a1.62 1.62 0 0 0-1.63 1.62c0 .9.73 1.63 1.63 1.63.9 0 1.63-.73 1.63-1.63 0-.9-.73-1.62-1.63-1.62Z" />
        </svg>
      </div>

      {/* 2. Discord (Lower Left) */}
      <div
        className="absolute top-[62%] left-[8%] xl:left-[13%] animate-float-3 text-[#5865F2] opacity-35"
        title="Discord"
      >
        <svg
          className="w-11 h-11 xl:w-12 xl:h-12 drop-shadow-[0_4px_12px_rgba(88,101,242,0.15)]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994.021-.041.001-.09-.041-.106a13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.929 1.793 8.18 1.793 12.061 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.893.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
        </svg>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT SIDE LOGOS
          ───────────────────────────────────────────────────────────── */}
      {/* 3. X / Twitter (Upper Right) */}
      <div
        className="absolute top-[20%] right-[7%] xl:right-[11%] animate-float-2 text-[#ede8df] opacity-30"
        title="X"
      >
        <svg
          className="w-10 h-10 xl:w-11 xl:h-11 drop-shadow-[0_4px_12px_rgba(255,255,255,0.08)]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      </div>

      {/* 4. Gmail (Lower Right) */}
      <div
        className="absolute top-[64%] right-[8%] xl:right-[12%] animate-float-4 text-[#EA4335] opacity-35"
        title="Gmail"
      >
        <svg
          className="w-11 h-11 xl:w-12 xl:h-12 drop-shadow-[0_4px_12px_rgba(234,67,53,0.15)]"
          viewBox="0 0 24 24"
          fill="currentColor"
        >
          <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4-8 5-8-5V6l8 5 8-5v2z" />
        </svg>
      </div>
    </div>
  );
}
