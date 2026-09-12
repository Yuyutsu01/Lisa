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
} from "lucide-react";

interface SidebarProps {
  activeWorkspaceId?: string | null;
}

export function Sidebar({ activeWorkspaceId }: SidebarProps) {
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
    <aside className="w-64 border-r border-white/[0.07] bg-[#0c0c0e] flex flex-col justify-between p-4 shrink-0 select-none">
      <div>
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 px-3 py-4 mb-5 group">
          <div className="w-9 h-9 rounded-2xl bg-[#ede8df] text-[#08080a] flex items-center justify-center font-bold text-sm shadow-md transition-transform duration-300 group-hover:scale-105 font-mono">
            L*
          </div>
          <div>
            <div className="flex items-center gap-1">
              <span className="font-semibold text-base tracking-tight text-[#ede8df] lisa-warm-glow">
                Lisa<span className="text-[#d4a373] lisa-asterisk">*</span>
              </span>
              <span className="text-[11px] font-mono text-[#787672]">OS</span>
            </div>
            <span className="text-[10px] block text-[#a6a39b] font-mono tracking-wider uppercase">
              AI Content Engine
            </span>
          </div>
        </Link>

        {/* Navigation items */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-2xl text-xs font-medium transition-all ${
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
      <div className="space-y-2">
        <Link
          href="/"
          className="w-full flex items-center justify-between px-3.5 py-2 rounded-2xl bg-white/[0.04] border border-white/[0.06] text-xs text-[#a6a39b] hover:text-[#ede8df] hover:bg-white/[0.07] transition-colors group"
        >
          <div className="flex items-center gap-2">
            <Eye className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>Showcase Manifesto</span>
          </div>
          <span className="text-[10px] font-mono text-[#52504b] group-hover:text-[#ede8df] transition-colors">↗</span>
        </Link>

        <div className="p-3 rounded-2xl bg-[#08080a] border border-white/[0.05] text-[11px] text-[#787672]">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-[#ede8df] flex items-center gap-1.5 text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              Groq Llama 3.3
            </span>
            <span className="text-[10px] font-mono text-[#a6a39b]">Active</span>
          </div>
          <p className="text-[10px] leading-tight text-[#71717a]">
            Deterministic AI synthesis & human-verified multi-channel publishing.
          </p>
        </div>
      </div>
    </aside>
  );
}
