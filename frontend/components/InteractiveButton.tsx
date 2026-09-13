"use client";

import React, { useRef, useState } from "react";
import Link from "next/link";
import { Loader2, Check } from "lucide-react";

export interface InteractiveButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  href?: string;
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  glow?: boolean;
  shimmer?: boolean;
  magnetic?: boolean;
  ripple?: boolean;
  loading?: boolean;
  success?: boolean;
  successText?: string;
  loadingText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export function InteractiveButton({
  children,
  variant = "primary",
  size = "md",
  glow = false,
  shimmer = false,
  magnetic = false,
  ripple = true,
  loading = false,
  success = false,
  successText,
  loadingText,
  leftIcon,
  rightIcon,
  className = "",
  onClick,
  disabled,
  href,
  ...props
}: InteractiveButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | HTMLAnchorElement | any>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [ripples, setRipples] = useState<{ id: number; x: number; y: number; size: number }[]>([]);

  // Magnetic effect logic
  const handleMouseMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!magnetic || !buttonRef.current || disabled || loading) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    // Limit displacement to a maximum of 4-6 pixels
    const deltaX = (e.clientX - centerX) * 0.15;
    const deltaY = (e.clientY - centerY) * 0.15;
    setPosition({ x: Math.max(-6, Math.min(6, deltaX)), y: Math.max(-6, Math.min(6, deltaY)) });
  };

  const handleMouseLeave = () => {
    if (magnetic) {
      setPosition({ x: 0, y: 0 });
    }
  };

  // Ripple effect logic
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (ripple && buttonRef.current && !disabled && !loading) {
      const rect = buttonRef.current.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;
      const rippleSize = Math.max(rect.width, rect.height) * 1.5;
      const newRipple = {
        id: Date.now() + Math.random(),
        x: clickX - rippleSize / 2,
        y: clickY - rippleSize / 2,
        size: rippleSize,
      };
      setRipples((prev) => [...prev, newRipple]);
      setTimeout(() => {
        setRipples((prev) => prev.filter((r) => r.id !== newRipple.id));
      }, 600);
    }
    if (onClick && !loading) {
      onClick(e);
    }
  };

  // Base styling per variant
  const variantStyles = {
    primary:
      "bg-[#ede8df] hover:bg-white text-[#08080a] font-medium border border-transparent shadow-md",
    secondary:
      "bg-white/[0.06] hover:bg-white/[0.12] text-[#ede8df] hover:text-white border border-white/[0.1]",
    outline:
      "bg-transparent hover:bg-white/[0.04] text-[#ede8df] border border-white/[0.15] hover:border-white/30",
    ghost:
      "bg-transparent hover:bg-white/[0.06] text-[#a6a39b] hover:text-[#ede8df] border border-transparent",
    danger:
      "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30",
  };

  const sizeStyles = {
    sm: "text-[11px] py-1.5 px-3 rounded-full gap-1.5",
    md: "text-xs font-medium py-2 px-4 sm:px-5 rounded-full gap-2",
    lg: "text-xs sm:text-sm font-medium py-2.5 px-6 rounded-full gap-2.5",
  };

  const glowStyle = glow
    ? variant === "primary"
      ? "btn-hover-glow"
      : "btn-hover-glow-white"
    : "";

  const shimmerStyle = shimmer ? "btn-shimmer" : "";

  const content = (
    <>
      {/* Ripple wave elements */}
      {ripples.map((r) => (
        <span
          key={r.id}
          className="btn-ripple-wave"
          style={{
            left: r.x,
            top: r.y,
            width: r.size,
            height: r.size,
          }}
        />
      ))}

      {/* Loading State */}
      {loading ? (
        <span className="inline-flex items-center gap-2">
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>{loadingText || "Processing..."}</span>
        </span>
      ) : success ? (
        <span className="inline-flex items-center gap-1.5 text-emerald-400 font-medium">
          <Check className="w-3.5 h-3.5 stroke-[3]" />
          <span>{successText || "Completed"}</span>
        </span>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </>
  );

  const sharedClassName = `relative inline-flex items-center justify-center select-none cursor-pointer overflow-hidden transition-all duration-200 active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${variantStyles[variant]} ${sizeStyles[size]} ${glowStyle} ${shimmerStyle} ${className}`;

  if (href) {
    return (
      <Link
        href={href}
        ref={buttonRef}
        onMouseMove={handleMouseMove as any}
        onMouseLeave={handleMouseLeave}
        onClick={handleClick as any}
        style={{
          transform: magnetic ? `translate(${position.x}px, ${position.y}px)` : undefined,
          transition: magnetic ? "transform 0.15s ease-out" : undefined,
        }}
        className={sharedClassName}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={buttonRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      disabled={disabled || loading}
      style={{
        transform: magnetic ? `translate(${position.x}px, ${position.y}px)` : undefined,
        transition: magnetic ? "transform 0.15s ease-out" : undefined,
      }}
      className={sharedClassName}
      {...props}
    >
      {content}
    </button>
  );
}
