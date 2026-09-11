"use client";

import { ReactNode } from "react";
import { Sidebar } from "./Sidebar";
import { Navbar } from "./Navbar";

interface AppLayoutProps {
  children: ReactNode;
  activeWorkspaceId?: string | null;
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function AppLayout({ children, activeWorkspaceId, onWorkspaceChange }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 text-slate-100 font-sans">
      <Sidebar activeWorkspaceId={activeWorkspaceId} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Navbar onWorkspaceChange={onWorkspaceChange} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-gradient-to-b from-slate-950 via-slate-900/30 to-slate-950">
          {children}
        </main>
      </div>
    </div>
  );
}
