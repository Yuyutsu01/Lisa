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
import { Building2, ChevronDown, Bell, LogOut, Plus } from "lucide-react";

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
      } catch {
        // Redirect to login if unauthenticated
        router.push("/login");
      }
    }

    loadData();
  }, [router, onWorkspaceChange]);

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
    <header className="h-14 sm:h-15 border-b border-white/[0.07] bg-[#0a0a0c]/85 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
      {/* Workspace Selector */}
      <div className="relative">
        <button
          onClick={() => setDropdownOpen(!dropdownOpen)}
          className="flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs font-medium text-[#ede8df] transition-all duration-200 active:scale-[0.97] hover:bg-white/[0.07] cursor-pointer"
        >
          <Building2 className="w-3.5 h-3.5 text-[#d4a373]" />
          <span>{currentWorkspace?.name || "Select Workspace"}</span>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#ede8df] font-mono">
            {currentWorkspace?.current_user_role?.toUpperCase() || "OWNER"}
          </span>
          <ChevronDown className="w-3 h-3 text-[#a6a39b] ml-0.5" />
        </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-64 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-2xl p-2 z-50">
            <div className="text-[10px] font-semibold text-[#787672] px-3 py-1.5 uppercase tracking-wider font-mono">
              Workspaces
            </div>
            <div className="space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs text-left transition-colors ${
                    currentWorkspace?.id === ws.id
                      ? "bg-white/10 text-[#ede8df] font-medium"
                      : "text-[#a6a39b] hover:bg-white/[0.05] hover:text-[#ede8df]"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[10px] text-[#71717a] font-mono">
                    {ws.current_user_role}
                  </span>
                </button>
              ))}
            </div>
            <div className="border-t border-white/[0.08] mt-2 pt-2">
              <button
                onClick={() => {
                  setDropdownOpen(false);
                  router.push("/workspaces");
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs text-[#ede8df] hover:bg-white/[0.08] transition-colors font-medium"
              >
                <Plus className="w-3.5 h-3.5 text-[#d4a373]" />
                Manage or Create Workspace
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Right Controls: Notifications & Profile */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-full text-[#a6a39b] hover:text-[#ede8df] hover:bg-white/[0.06] transition-colors relative">
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-[#d4a373]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/[0.05] transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-[#ede8df] text-[#08080a] font-bold flex items-center justify-center text-xs shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="text-left hidden md:block pr-1">
              <div className="text-xs font-medium text-[#ede8df]">{user?.name}</div>
              <div className="text-[10px] text-[#787672]">{user?.email}</div>
            </div>
            <ChevronDown className="w-3 h-3 text-[#787672]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-2xl p-2 z-50">
              <div className="px-3 py-2 border-b border-white/[0.08] text-xs">
                <p className="font-semibold text-[#ede8df]">{user?.name}</p>
                <p className="text-[#787672] text-[11px] truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-xl text-xs text-rose-400 hover:bg-rose-950/20 transition-colors"
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
