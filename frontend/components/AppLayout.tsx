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
    <div className="flex h-screen w-screen overflow-hidden bg-[#08080a] text-[#ede8df] font-sans selection:bg-[#ede8df]/20 selection:text-white">
      <Sidebar activeWorkspaceId={activeWorkspaceId} />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden relative">
        {/* Subtle ambient lighting on the workspace views */}
        <div className="absolute top-0 right-0 w-[40vw] h-[350px] ambient-glow-warm pointer-events-none z-0" />
        <Navbar onWorkspaceChange={onWorkspaceChange} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-[#09090b]/80 relative z-10">
          {children}
        </main>
      </div>
    </div>
  );
}
