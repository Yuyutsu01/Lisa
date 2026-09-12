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
import { Building2, ChevronDown, Bell, LogOut, Plus, PanelLeftClose, PanelLeftOpen } from "lucide-react";

interface NavbarProps {
  onWorkspaceChange?: (workspaceId: string) => void;
  onToggleSidebar?: () => void;
  sidebarOpen?: boolean;
}

export function Navbar({ onWorkspaceChange, onToggleSidebar, sidebarOpen = true }: NavbarProps) {
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
    <header className="h-14 sm:h-16 border-b border-white/[0.07] bg-[#0a0a0c]/85 backdrop-blur-md px-4 sm:px-6 lg:px-8 flex items-center justify-between z-20 shrink-0">
      {/* Left Area: Sidebar Toggle & Workspace Selector */}
      <div className="flex items-center gap-2.5 sm:gap-3.5">
        {onToggleSidebar && (
          <button
            onClick={onToggleSidebar}
            title={sidebarOpen ? "Hide sidebar" : "Show sidebar"}
            className="p-2 sm:p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:border-white/20 text-[#a6a39b] hover:text-[#ede8df] hover:bg-white/[0.07] transition-all duration-200 cursor-pointer active:scale-95 flex items-center justify-center"
          >
            {sidebarOpen ? (
              <PanelLeftClose className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            ) : (
              <PanelLeftOpen className="w-4 h-4 sm:w-4.5 sm:h-4.5 text-[#d4a373]" />
            )}
          </button>
        )}

        {/* Workspace Selector */}
        <div className="relative">
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className="flex items-center gap-2.5 px-3.5 py-1.5 sm:py-2 rounded-full bg-white/[0.04] border border-white/[0.08] hover:border-white/20 text-xs sm:text-[13.5px] font-medium text-[#ede8df] transition-all duration-200 active:scale-[0.97] hover:bg-white/[0.07] cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#d4a373]" />
            <span>{currentWorkspace?.name || "Select Workspace"}</span>
            <span className="text-[10px] sm:text-[11px] px-2.5 py-0.5 rounded-full bg-white/10 text-[#ede8df] font-mono">
              {currentWorkspace?.current_user_role?.toUpperCase() || "OWNER"}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-[#a6a39b] ml-0.5" />
          </button>

        {dropdownOpen && (
          <div className="absolute top-full left-0 mt-2 w-72 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-2xl p-2 z-50">
            <div className="text-[11px] font-semibold text-[#787672] px-3 py-1.5 uppercase tracking-wider font-mono">
              Workspaces
            </div>
            <div className="space-y-1">
              {workspaces.map((ws) => (
                <button
                  key={ws.id}
                  onClick={() => handleSelectWorkspace(ws)}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] text-left transition-colors ${
                    currentWorkspace?.id === ws.id
                      ? "bg-white/10 text-[#ede8df] font-medium"
                      : "text-[#a6a39b] hover:bg-white/[0.05] hover:text-[#ede8df]"
                  }`}
                >
                  <span className="truncate">{ws.name}</span>
                  <span className="text-[11px] text-[#71717a] font-mono">
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
                className="w-full flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs sm:text-[13px] text-[#ede8df] hover:bg-white/[0.08] transition-colors font-medium"
              >
                <Plus className="w-4 h-4 text-[#d4a373]" />
                Manage or Create Workspace
              </button>
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Right Controls: Notifications & Profile */}
      <div className="flex items-center gap-3.5">
        <button className="p-2.5 rounded-full text-[#a6a39b] hover:text-[#ede8df] hover:bg-white/[0.06] transition-colors relative">
          <Bell className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
          <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#d4a373]" />
        </button>

        <div className="relative">
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2.5 p-1 rounded-full hover:bg-white/[0.05] transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-[#ede8df] text-[#08080a] font-bold flex items-center justify-center text-xs sm:text-sm shadow-sm">
              {user?.name ? user.name[0].toUpperCase() : "U"}
            </div>
            <div className="text-left hidden md:block pr-1">
              <div className="text-xs sm:text-[13px] font-medium text-[#ede8df]">{user?.name}</div>
              <div className="text-[11px] text-[#787672]">{user?.email}</div>
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-[#787672]" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-[#0e0e11] border border-white/10 shadow-2xl p-2 z-50">
              <div className="px-3.5 py-2.5 border-b border-white/[0.08] text-xs">
                <p className="font-semibold text-[#ede8df] text-xs sm:text-[13px]">{user?.name}</p>
                <p className="text-[#787672] text-[11px] truncate">{user?.email}</p>
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3.5 py-2 mt-1 rounded-xl text-xs sm:text-[13px] text-rose-400 hover:bg-rose-950/20 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
