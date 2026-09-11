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
    <aside className="w-64 border-r border-slate-800 bg-slate-950/80 flex flex-col justify-between p-4 shrink-0">
      <div>
        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-3 px-3 py-4 mb-6">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/30">
            L
          </div>
          <div>
            <span className="font-bold text-lg tracking-tight gradient-text">Lisa</span>
            <span className="text-[10px] block text-slate-400 font-mono uppercase tracking-widest">
              Content OS
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
                className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900/60"
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? "text-indigo-400" : "text-slate-400"}`} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </div>

      {/* System Principle Footer */}
      <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-400">
        <p className="font-semibold text-slate-300 mb-1 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Deterministic Engine
        </p>
        <p className="text-[11px] leading-relaxed text-slate-500">
          AI adapts & proposes. You approve. Verified publishing everywhere.
        </p>
      </div>
    </aside>
  );
}
