"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Sparkles,
  Layers,
  Calendar,
  BarChart3,
  BookOpen,
  Share2,
  Settings,
  Users,
  Eye,
  PanelLeftClose,
} from "lucide-react";

interface SidebarProps {
  activeWorkspaceId?: string | null;
  isOpen?: boolean;
  onToggle?: () => void;
}

export function Sidebar({ isOpen = true, onToggle }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { name: "Content Studio", href: "/content", icon: Sparkles },
    { name: "Content Library", href: "/library", icon: Layers },
    { name: "Calendar", href: "/calendar", icon: Calendar },
    { name: "Brand Intelligence", href: "/brand", icon: BookOpen },
    { name: "Platform Integrations", href: "/integrations", icon: Share2 },
    { name: "Analytics & ROI", href: "/analytics", icon: BarChart3 },
    { name: "Team & Workspaces", href: "/workspaces", icon: Users },
    { name: "Settings", href: "/settings", icon: Settings },
  ];

  return (
    <aside
      className={`fixed lg:static inset-y-0 left-0 z-40 border-r border-white/[0.07] bg-[#0c0c0e] flex flex-col justify-between shrink-0 select-none transition-all duration-300 ease-in-out ${
        isOpen
          ? "w-64 xl:w-72 p-4 sm:p-5 translate-x-0 opacity-100"
          : "w-0 p-0 -translate-x-full lg:translate-x-0 lg:w-0 border-r-0 opacity-0 overflow-hidden pointer-events-none"
      }`}
    >
      <div>
        {/* Logo - Clean Text Brandmark Only (Lisa*) + Collapse Toggle Button */}
        <div className="flex items-center justify-between mb-5 px-1">
          <Link href="/" className="flex items-center group cursor-pointer">
            <div>
              <div className="flex items-baseline gap-1.5">
                <span className="font-semibold text-xl sm:text-2xl tracking-tight text-[#ede8df] lisa-warm-glow">
                  Lisa<span className="text-[#d4a373] lisa-asterisk">*</span>
                </span>
                <span className="text-[11px] font-mono text-[#787672]">OS</span>
              </div>
              <span className="text-[10px] block text-[#a6a39b] font-mono tracking-wider uppercase mt-0.5">
                AI Content Engine
              </span>
            </div>
          </Link>

          {onToggle && (
            <button
              onClick={onToggle}
              title="Hide sidebar"
              className="p-1.5 rounded-xl text-[#787672] hover:text-[#ede8df] hover:bg-white/[0.06] transition-colors cursor-pointer"
            >
              <PanelLeftClose className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          )}
        </div>

        {/* Navigation items */}
        <nav className="space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13.5px] font-medium transition-all duration-150 active:scale-[0.98] ${
                  isActive
                    ? "bg-white/[0.09] text-[#ede8df] border border-white/[0.12] shadow-sm font-semibold"
                    : "text-[#8a8a93] hover:text-[#ede8df] hover:bg-white/[0.04]"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-[#ede8df]" : "text-[#71717a]"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Footer & Link to Landing Showcase */}
      <div className="space-y-3">
        <Link
          href="/"
          className="w-full flex items-center justify-between px-4 py-2.5 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-xs sm:text-[13px] text-[#a6a39b] hover:text-[#ede8df] hover:bg-white/[0.07] transition-colors group"
        >
          <div className="flex items-center gap-2.5">
            <Eye className="w-4 h-4 text-[#d4a373]" />
            <span>Showcase Manifesto</span>
          </div>
          <span className="text-xs font-mono text-[#52504b] group-hover:text-[#ede8df] transition-colors">↗</span>
        </Link>

        <div className="p-3.5 rounded-2xl bg-[#08080a] border border-white/[0.05] text-xs text-[#787672] space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="font-medium text-[#ede8df] flex items-center gap-2 text-xs sm:text-[13px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Groq Llama 3.3
            </span>
            <span className="text-[11px] font-mono text-[#a6a39b]">Active</span>
          </div>
          <p className="text-[11px] leading-relaxed text-[#71717a]">
            Deterministic AI synthesis & human-verified multi-channel publishing.
          </p>
        </div>
      </div>
    </aside>
  );
}
