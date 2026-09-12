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
        {/* Subtle animated ambient lighting on workspace views */}
        <div className="absolute -top-10 right-0 w-[42vw] max-w-[650px] h-[350px] ambient-glow-warm pointer-events-none z-0 opacity-70 ambient-orb-1" />
        <div className="absolute bottom-10 left-10 w-[35vw] max-w-[500px] h-[300px] ambient-glow-center pointer-events-none z-0 opacity-50 ambient-orb-2" />
        <Navbar onWorkspaceChange={onWorkspaceChange} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-7 xl:p-8 bg-[#09090b]/85 relative z-10 scrollbar-thin">
          <div className="w-full max-w-7xl mx-auto page-fade-in">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
