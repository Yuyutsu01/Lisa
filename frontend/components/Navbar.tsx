"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  workspacesApi,
  authApi,
  Workspace,
  User,
  getActiveWorkspaceId,
  setActiveWorkspaceId,
  removeToken,
} from "@/lib/api";
import { Building2, ChevronDown, Bell, LogOut, Plus, ShieldCheck } from "lucide-react";

interface NavbarProps {
  onWorkspaceChange?: (workspaceId: string) => void;
}

export function Navbar({ onWorkspaceChange }: NavbarProps) {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const userData = await authApi.getMe();
        setUser(userData);

        const wsList = await workspacesApi.list();
        setWorkspaces(wsList);

        if (wsList.length > 0) {
          const storedWsId = getActiveWorkspaceId();
          const active = wsList.find((w) => w.id === storedWsId) || wsList[0];
          setCurrentWorkspace(active);
          setActiveWorkspaceId(active.id);
          if (onWorkspaceChange) {
            onWorkspaceChange(active.id);
          }
        }
      } catch (err) {
        // Redirect to login if unauthenticated
        router.push("/login");
      }
    }

    loadData();
  }, [router]);

  const handleSelectWorkspace = (ws: Workspace) => {
    setCurrentWorkspace(ws);
    setActiveWorkspaceId(ws.id);
    setDropdownOpen(false);
    if (onWorkspaceChange) {
      onWorkspaceChange(ws.id);
    }
    // Refresh page context
    window.location.reload();
  };

  const handleLogout = () => {
    removeToken();
    router.push("/login");
  };

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between z-20">
      {/* Workspace Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-sm font-medium text-slate-200 transition-all shadow-sm"
        >
          <Building2 className="w-4 h-4 text-indigo-400" />
          <span>{currentWorkspace?.name || "Select Workspace"}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
            {currentWorkspace?.current_user_role?.toUpperCase() || "OWNER"}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-1" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
            <div className="text-[11px] font-semibold text-slate-400 px-3 py-1.5 uppercase tracking-wider">
              Workspaces
            </div>
            <div className="space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                    currentWorkspace?.id === ws.id
                      ? "bg-indigo-600/20 text-indigo-300 font-medium"
                      : "text-slate-300 hover:bg-slate-800"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    {ws.current_user_role}
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t border-slate-800 mt-2 pt-2">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/workspaces");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-indigo-400 hover:bg-indigo-950/40 transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Manage or Create Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Notifications & Profile */}
      <div className="flex items-center gap-4">
        <button className="p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-900 transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-indigo-500" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-xl hover:bg-slate-900 transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white font-semibold flex items-center justify-center text-xs shadow-md">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="text-left hidden md:block">
              <div className="text-xs font-medium text-slate-200">{user?.name}</div>
              <div className="text-[10px] text-slate-400">{user?.email}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-slate-800 text-xs">
                <p className="font-semibold text-slate-200">{user?.name}</p>
                <p className="text-slate-400 text-[11px] truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs text-rose-400 hover:bg-rose-950/30 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
