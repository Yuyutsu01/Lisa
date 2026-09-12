"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  workspacesApi,
  Workspace,
  WorkspaceMember,
  getActiveWorkspaceId,
} from "@/lib/api";
import {
  Users,
  Building2,
  UserPlus,
  Shield,
  Trash2,
  CheckCircle2,
  Plus,
} from "lucide-react";

export default function WorkspacesPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [members, setMembers] = useState<WorkspaceMember[]>([]);
  const [loading, setLoading] = useState(true);

  // New Workspace form
  const [newWsName, setNewWsName] = useState("");

  // Invite member form
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("editor");
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    loadWorkspacesData(wsId);
  }, []);

  const loadWorkspacesData = async (wsId: string | null) => {
    try {
      setLoading(true);
      const wsList = await workspacesApi.list();
      setWorkspaces(wsList);

      const targetId = wsId || (wsList.length > 0 ? wsList[0].id : null);
      if (targetId) {
        const membersList = await workspacesApi.listMembers(targetId);
        setMembers(membersList);
      }
    } catch (err) {
      console.error("Failed to load workspaces", err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateWorkspace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWsName.trim()) return;

    try {
      const created = await workspacesApi.create({ name: newWsName.trim() });
      setWorkspaces([...workspaces, created]);
      setNewWsName("");
    } catch (err) {
      console.error("Failed to create workspace", err);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeWorkspaceId || !inviteEmail.trim()) return;
    setInviteError(null);

    try {
      const member = await workspacesApi.inviteMember(activeWorkspaceId, {
        email: inviteEmail.trim(),
        role: inviteRole,
      });
      setMembers([...members, member]);
      setInviteEmail("");
    } catch (err: any) {
      setInviteError(err.message || "Failed to invite member");
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!activeWorkspaceId) return;
    try {
      const updated = await workspacesApi.updateMemberRole(activeWorkspaceId, userId, newRole);
      setMembers(members.map((m) => (m.user_id === userId ? updated : m)));
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!activeWorkspaceId) return;
    try {
      await workspacesApi.removeMember(activeWorkspaceId, userId);
      setMembers(members.filter((m) => m.user_id !== userId));
    } catch (err) {
      console.error("Failed to remove member", err);
    }
  };

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-white/[0.08] pb-6">
          <div className="flex items-center gap-2.5 text-[11px] sm:text-xs lg:text-[13px] font-mono uppercase tracking-widest text-[#85827b] mb-1.5">
            <Users className="w-4 h-4 text-[#d4a373]" />
            <span>Workspace Roster &amp; Multi-Tenancy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-normal tracking-tight text-[#ede8df]">
            Workspaces &amp; Team Roles
          </h1>
          <p className="text-xs sm:text-sm lg:text-[15px] xl:text-[15.5px] text-[#8a8a93] mt-2 max-w-3xl leading-relaxed">
            Manage multi-tenant workspace environments, invite team members, and configure RBAC roles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspaces List & Create */}
          <div className="hirael-card p-6 sm:p-7 space-y-6 rounded-2xl sm:rounded-3xl">
            <h2 className="text-xs sm:text-sm lg:text-[15px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
              <Building2 className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
              <span>Your Workspaces</span>
            </h2>

            <div className="space-y-3">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-4 rounded-2xl border text-xs sm:text-sm flex items-center justify-between transition-all ${
                    activeWorkspaceId === ws.id
                      ? "bg-white/[0.06] border-white/20 text-[#ede8df] shadow-sm"
                      : "bg-white/[0.02] border-white/[0.05] text-[#8a8a93] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="space-y-1">
                    <p className="font-medium text-[#ede8df] text-sm sm:text-base">{ws.name}</p>
                    <p className="text-xs text-[#71717a] font-mono">{ws.slug}</p>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-white/[0.04] text-[#d4a373] border border-white/[0.08] font-mono">
                    {ws.current_user_role?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Create Workspace */}
            <form onSubmit={handleCreateWorkspace} className="border-t border-white/[0.06] pt-5 space-y-3">
              <label className="block text-xs font-mono text-[#85827b]">Create New Workspace</label>
              <div className="flex gap-2.5">
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Growth Agency HQ"
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-black/40 border border-white/10 text-xs sm:text-sm text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
                />
                <button
                  type="submit"
                  className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-[#ede8df] hover:bg-white text-[#08080a] flex items-center justify-center cursor-pointer shrink-0 transition-transform active:scale-95 shadow-sm"
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </form>
          </div>

          {/* Members Management & RBAC */}
          <div className="lg:col-span-2 hirael-card p-6 sm:p-8 space-y-6 rounded-2xl sm:rounded-3xl">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h2 className="text-xs sm:text-sm lg:text-[15px] font-mono uppercase tracking-wider text-[#ede8df] flex items-center gap-2.5">
                <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-[#d4a373]" />
                <span>Team Members &amp; Access Control (RBAC)</span>
              </h2>
              <span className="text-xs text-[#71717a] font-mono px-2.5 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08]">
                {members.length} Members
              </span>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="p-5 sm:p-6 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3.5">
              <p className="text-xs sm:text-sm font-medium text-[#ede8df]">Invite New Team Member</p>
              {inviteError && (
                <p className="text-xs text-rose-400 font-mono">{inviteError}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 px-4 py-2.5 sm:py-3 rounded-xl bg-black/60 border border-white/10 text-xs sm:text-sm text-[#ede8df] outline-none focus:border-[#d4a373]/60 focus:ring-1 focus:ring-[#d4a373]/20"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-4 py-2.5 sm:py-3 rounded-xl bg-[#0e0e12] border border-white/10 text-xs sm:text-sm text-[#ede8df] outline-none cursor-pointer focus:border-[#d4a373]/60"
                >
                  <option value="admin">Admin (Manage settings &amp; integrations)</option>
                  <option value="editor">Editor (Create, adapt, schedule)</option>
                  <option value="reviewer">Reviewer (Review and approve)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="submit"
                  className="hirael-pill-btn text-xs sm:text-sm py-2.5 sm:py-3 px-5 cursor-pointer shrink-0 flex items-center justify-center gap-2 font-medium"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Invite</span>
                </button>
              </div>
            </form>

            {/* Members List */}
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-4 sm:p-4.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs sm:text-sm"
                >
                  <div className="space-y-1">
                    <p className="font-medium text-[#ede8df] text-sm sm:text-base">{m.user_name || "User"}</p>
                    <p className="text-xs text-[#71717a] font-mono">{m.user_email}</p>
                  </div>

                  <div className="flex items-center gap-3.5">
                    {m.role === "owner" ? (
                      <span className="px-3 py-1 rounded-full bg-white/[0.06] text-[#d4a373] border border-white/[0.08] font-mono text-xs font-semibold">
                        OWNER
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.user_id, e.target.value)}
                        className="px-3.5 py-1.5 rounded-xl bg-black/60 border border-white/10 text-[#ede8df] text-xs sm:text-sm outline-none cursor-pointer focus:border-[#d4a373]/60"
                      >
                        <option value="admin">Admin</option>
                        <option value="editor">Editor</option>
                        <option value="reviewer">Reviewer</option>
                        <option value="viewer">Viewer</option>
                      </select>
                    )}

                    {m.role !== "owner" && (
                      <button
                        onClick={() => handleRemoveMember(m.user_id)}
                        className="text-[#71717a] hover:text-rose-400 p-1.5 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
