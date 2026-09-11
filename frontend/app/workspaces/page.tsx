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
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2.5">
            <Users className="w-6 h-6 text-indigo-400" />
            Workspaces & Team Roles
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Manage multi-tenant workspace environments, invite team members, and configure RBAC roles.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Workspaces List & Create */}
          <div className="glass-card rounded-2xl p-6 space-y-5">
            <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              Your Workspaces
            </h2>

            <div className="space-y-2">
              {workspaces.map((ws) => (
                <div
                  key={ws.id}
                  className={`p-3.5 rounded-xl border text-xs flex items-center justify-between transition-all ${
                    activeWorkspaceId === ws.id
                      ? "bg-indigo-600/15 border-indigo-500/40 text-slate-100 shadow-sm"
                      : "bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/60"
                  }`}
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold">{ws.name}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{ws.slug}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/20 text-indigo-300 font-mono">
                    {ws.current_user_role?.toUpperCase()}
                  </span>
                </div>
              ))}
            </div>

            {/* Create Workspace */}
            <form onSubmit={handleCreateWorkspace} className="border-t border-slate-800 pt-4 space-y-2">
              <label className="block text-xs text-slate-400 font-medium">Create New Workspace</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  placeholder="e.g. Growth Agency HQ"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
                <button
                  type="submit"
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </form>
          </div>

          {/* Members Management & RBAC */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                Team Members & Access Control (RBAC)
              </h2>
              <span className="text-xs text-slate-400 font-mono">{members.length} Members</span>
            </div>

            {/* Invite Form */}
            <form onSubmit={handleInviteMember} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
              <p className="text-xs font-semibold text-slate-300">Invite New Team Member</p>
              {inviteError && (
                <p className="text-[11px] text-rose-400">{inviteError}</p>
              )}
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  required
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="colleague@company.com"
                  className="flex-1 px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-100 outline-none focus:border-indigo-500"
                />
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 outline-none"
                >
                  <option value="admin">Admin (Manage settings & integrations)</option>
                  <option value="editor">Editor (Create, adapt, schedule)</option>
                  <option value="reviewer">Reviewer (Review and approve)</option>
                  <option value="viewer">Viewer (Read-only)</option>
                </select>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 text-white text-xs font-medium flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite
                </button>
              </div>
            </form>

            {/* Members List */}
            <div className="space-y-3">
              {members.map((m) => (
                <div
                  key={m.id}
                  className="p-3.5 rounded-xl bg-slate-900/50 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-200">{m.user_name || "User"}</p>
                    <p className="text-[11px] text-slate-500">{m.user_email}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {m.role === "owner" ? (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 font-mono text-[11px] font-semibold">
                        OWNER
                      </span>
                    ) : (
                      <select
                        value={m.role}
                        onChange={(e) => handleUpdateRole(m.user_id, e.target.value)}
                        className="px-2.5 py-1 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 text-xs outline-none"
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
                        className="text-slate-500 hover:text-rose-400 p-1"
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
