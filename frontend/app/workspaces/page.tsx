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
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="border-b border-white/[0.07] pb-5">
          <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#85827b] mb-1">
            <Users className="w-3.5 h-3.5 text-[#d4a373]" />
            <span>Workspace Roster & Multi-Tenancy</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#ede8df]">
            Workspaces & Team Roles
          </h1>
          <p className="text-xs sm:text-sm text-[#8a8a93] mt-1 max-w-2xl leading-relaxed">
            Manage multi-tenant workspace environments, invite team members, and configure RBAC roles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspaces List & Create */}
          <div className="hirael-card p-6 space-y-5">
            <h2 className="text-xs font-mono uppercase tracking-wider text-[#85827b] flex items-center gap-2">
              <Building2 className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Your Workspaces</span>
            </h2>

            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between transition-all ${
                    activeWorkspaceId === ws.id
                      ? "bg-white/[0.06] border-white/20 text-[#ede8df] shadow-sm"
                      : "bg-white/[0.02] border-white/[0.05] text-[#8a8a93] hover:bg-white/[0.04]"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-[#ede8df]">{ws.name}</p>
                    <p className="text-[10px] text-[#71717a] font-mono">{ws.slug}</p>
                  </div>
                  <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-white/[0.04] text-[#d4a373] border border-white/[0.08] font-mono">
                    {ws.current_user_role?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Create Workspace */}
            <form onSubmit={handleCreateWorkspace} className="border-t border-white/[0.06] pt-4 space-y-2.5">
              <label className="block text-[11px] font-mono text-[#71717a]">Create New Workspace</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Growth Agency HQ"
                  className="flex-1 px-3.5 py-2 rounded-full bg-white/[0.03] border border-white/10 text-xs text-[#ede8df] outline-none focus:border-white/30"
                />
                <button
                  type="submit"
                  className="w-8 h-8 rounded-full bg-[#ede8df] hover:bg-white text-[#08080a] flex items-center justify-center cursor-pointer shrink-0 transition-transform active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Members Management & RBAC */}
          <div className="lg:col-span-2 hirael-card p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
              <h2 className="text-xs font-mono uppercase tracking-wider text-[#85827b] flex items-center gap-2">
                <Shield className="w-3.5 h-3.5 text-[#d4a373]" />
                <span>Team Members & Access Control (RBAC)</span>
              </h2>
              <span className="text-xs text-[#71717a] font-mono">{members.length} Members</span>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06] space-y-3">
              <p className="text-xs font-medium text-[#ede8df]">Invite New Team Member</p>
              {inviteError && (
                <p className="text-[11px] text-rose-400 font-mono">{inviteError}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 px-3.5 py-2 rounded-full bg-black/60 border border-white/10 text-xs text-[#ede8df] outline-none focus:border-white/30"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3.5 py-2 rounded-full bg-[#0e0e12] border border-white/10 text-xs text-[#ede8df] outline-none"
                >
                  <option value="admin">Admin (Manage settings & integrations)</option>
                  <option value="editor">Editor (Create, adapt, schedule)</option>
                  <option value="reviewer">Reviewer (Review and approve)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="submit"
                  className="hirael-pill-btn text-xs py-2 px-4 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Invite</span>
                </button>
              </div>
            </form>

            {/* Members List */}
            <div className="space-y-2.5">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-medium text-[#ede8df]">{m.user_name || "User"}</p>
                    <p className="text-[11px] text-[#71717a] font-mono">{m.user_email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.role === "owner" ? (
                      <span className="px-2.5 py-1 rounded-full bg-white/[0.06] text-[#d4a373] border border-white/[0.08] font-mono text-[10px] font-semibold">
                        OWNER
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.user_id, e.target.value)}
                        className="px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[#ede8df] text-xs outline-none"
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
                        className="text-[#71717a] hover:text-rose-400 p-1 transition-colors"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
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
