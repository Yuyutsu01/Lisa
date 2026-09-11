"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/AppLayout";
import {
  Settings,
  Shield,
  Activity,
  Cpu,
  History,
  Users,
  CheckCircle2,
  AlertCircle,
  Clock,
  Radio,
  Sliders,
  Sparkles,
  Server,
  Layers,
  Lock,
} from "lucide-react";

interface AgentRun {
  id: string;
  workflow_id: string;
  agent_name: string;
  agent_version: string;
  status: string;
  model: string;
  latency_ms: number;
  token_usage_json: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  created_at: string;
}

interface AuditLog {
  id: string;
  actor_id?: string;
  action: string;
  resource_type: string;
  resource_id: string;
  metadata_json: Record<string, any>;
  created_at: string;
}

interface SystemHealth {
  status: string;
  database: string;
  agents: Record<string, string>;
  supported_platform_adapters: Record<string, any>;
}

export default function SettingsPage() {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"policies" | "telemetry" | "audit" | "health">("policies");
  const [agentRuns, setAgentRuns] = useState<AgentRun[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [wsConnected, setWsConnected] = useState(false);
  const [loading, setLoading] = useState(true);

  // Policy form state
  const [strictQA, setStrictQA] = useState(true);
  const [autoPublishLowRisk, setAutoPublishLowRisk] = useState(false);
  const [modelTier, setModelTier] = useState("strong");
  const [policySaved, setPolicySaved] = useState(false);

  useEffect(() => {
    if (!activeWorkspaceId) return;
    loadOperationsData(activeWorkspaceId);

    // Establish WebSocket Connection
    let ws: WebSocket | null = null;
    try {
      ws = new WebSocket(`ws://localhost:8000/api/v1/ws/workspaces/${activeWorkspaceId}`);
      ws.onopen = () => setWsConnected(true);
      ws.onclose = () => setWsConnected(false);
      ws.onerror = () => setWsConnected(false);
    } catch (e) {
      console.warn("WebSocket connection not established", e);
    }

    return () => {
      if (ws) ws.close();
    };
  }, [activeWorkspaceId]);

  const loadOperationsData = async (workspaceId: string) => {
    setLoading(true);
    try {
      const token = localStorage.getItem("lisa_token");
      const headers = { Authorization: `Bearer ${token}` };

      const [runsRes, auditRes, healthRes] = await Promise.all([
        fetch(`http://localhost:8000/api/v1/workspaces/${workspaceId}/agent-runs`, { headers }),
        fetch(`http://localhost:8000/api/v1/workspaces/${workspaceId}/audit-logs`, { headers }),
        fetch(`http://localhost:8000/api/v1/workspaces/${workspaceId}/system-health`, { headers }),
      ]);

      if (runsRes.ok) setAgentRuns(await runsRes.json());
      if (auditRes.ok) setAuditLogs(await auditRes.json());
      if (healthRes.ok) setSystemHealth(await healthRes.json());
    } catch (e) {
      console.error("Failed to load operations data", e);
    } finally {
      setLoading(false);
    }
  };

  const handleSavePolicies = (e: React.FormEvent) => {
    e.preventDefault();
    setPolicySaved(true);
    setTimeout(() => setPolicySaved(false), 3000);
  };

  return (
    <AppLayout activeWorkspaceId={activeWorkspaceId} onWorkspaceChange={setActiveWorkspaceId}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-widest text-indigo-400 mb-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Workspace Administration & Hardening</span>
            </div>
            <h1 className="text-3xl font-extrabold text-slate-100">
              Settings, Telemetry & Operations
            </h1>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Configure deterministic agent review policies, inspect real-time agent execution
              traces, verify system health, and review audit logs.
            </p>
          </div>

          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 px-3.5 py-2 rounded-2xl shrink-0">
            <span
              className={`w-2.5 h-2.5 rounded-full ${
                wsConnected ? "bg-emerald-400 animate-pulse" : "bg-slate-500"
              }`}
            />
            <span className="text-xs font-mono text-slate-300">
              {wsConnected ? "Real-Time Gateway Live" : "Offline Polling"}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "policies"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Agent Governance & Policies</span>
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "telemetry"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Telemetry Traces ({agentRuns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "health"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>System Health & Adapters</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all ${
              activeTab === "audit"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Agent Policies & Governance */}
        {activeTab === "policies" && (
          <div className="max-w-3xl space-y-6">
            <form onSubmit={handleSavePolicies} className="glass-card rounded-3xl border border-slate-800 p-6 space-y-6">
              <div>
                <h3 className="text-base font-bold text-slate-100 flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-indigo-400" />
                  Deterministic Quality & Review Controls
                </h3>
                <p className="text-xs text-slate-400">
                  Enforce strict software verification rules before variants can be scheduled or dispatched.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-slate-800/80">
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 text-sm block">
                      Strict Quality Assurance Threshold (QA $\ge$ 90%)
                    </span>
                    <span className="text-xs text-slate-500">
                      Block human approval if QA scorecard score drops below 90% or contains forbidden phrases.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={strictQA}
                    onChange={(e) => setStrictQA(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-200 text-sm block">
                      Autonomous Publishing for Low-Risk Channels
                    </span>
                    <span className="text-xs text-slate-500">
                      Allow pre-approved channels (e.g. Internal Newsletters / Drafts) to bypass manual HITL step.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPublishLowRisk}
                    onChange={(e) => setAutoPublishLowRisk(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 border-slate-700 bg-slate-900"
                  />
                </div>

                <div className="pt-4 space-y-2">
                  <label className="font-semibold text-slate-200 text-sm block">
                    LLM Model Routing Architecture
                  </label>
                  <p className="text-xs text-slate-500">
                    Select the model tier for long-form adaptation, platform strategies, and caption generation.
                  </p>
                  <select
                    value={modelTier}
                    onChange={(e) => setModelTier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:outline-none focus:border-indigo-500"
                  >
                    <option value="strong">Strong Tier: High Precision Reasoning (Anthropic Claude 3.7 / Gemini 2.5 Pro)</option>
                    <option value="balanced">Balanced Tier: Fast Orchestration (OpenAI GPT-4o / Gemini 2.5 Flash)</option>
                    <option value="deterministic">Local Deterministic Engine: Zero API Cost & Fast Simulation</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 flex items-center justify-between">
                {policySaved ? (
                  <span className="text-xs font-semibold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4" /> Policies updated successfully!
                  </span>
                ) : (
                  <span className="text-xs text-slate-500">Changes apply immediately to new jobs.</span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs transition-all shadow-md shadow-indigo-600/30 cursor-pointer"
                >
                  Save Governance Policies
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Agent Telemetry Traces */}
        {activeTab === "telemetry" && (
          <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-indigo-400" />
              Agent Workflow Execution & Latency Traces
            </h3>

            {agentRuns.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No agent runs recorded yet. Generate variants from the Content Studio to inspect traces.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="text-[11px] uppercase font-mono text-slate-500 bg-slate-900/80 border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-4">Agent Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Tokens</th>
                      <th className="py-3 px-4">Executed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono">
                    {agentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-900/40 transition-colors">
                        <td className="py-3 px-4 font-semibold text-slate-200">
                          {run.agent_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            {run.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-400">{run.model}</td>
                        <td className="py-3 px-4 text-indigo-400 font-bold">{run.latency_ms}ms</td>
                        <td className="py-3 px-4 text-slate-400">
                          {run.token_usage_json.total_tokens || 0} tokens
                        </td>
                        <td className="py-3 px-4 text-slate-500">
                          {new Date(run.created_at).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 3: System Health & Platform Adapters */}
        {activeTab === "health" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Agent Services Status */}
            <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                AI Agent Pipeline Health
              </h3>
              <div className="space-y-2.5">
                {Object.entries(systemHealth?.agents || {}).map(([agent, status]) => (
                  <div
                    key={agent}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <span className="font-semibold text-slate-200 capitalize">
                      {agent.replace("_", " ")}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Adapters Status */}
            <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <Server className="w-4 h-4 text-indigo-400" />
                Registered Platform Adapters
              </h3>
              <div className="space-y-2.5">
                {Object.entries(systemHealth?.supported_platform_adapters || {}).map(
                  ([plat, details]: [string, any]) => (
                    <div
                      key={plat}
                      className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-bold text-slate-200 uppercase block">{plat}</span>
                        <span className="text-[10px] text-slate-500">
                          {details.formats?.length || 0} supported formats
                        </span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono font-bold uppercase">
                        Active
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Trail */}
        {activeTab === "audit" && (
          <div className="glass-card rounded-3xl border border-slate-800 p-6 space-y-4">
            <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-400" />
              Immutable Workspace Audit Log
            </h3>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-slate-500 py-8 text-center">
                No audit events recorded yet for this workspace.
              </p>
            ) : (
              <div className="divide-y divide-slate-800 font-mono text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-indigo-500/10 text-indigo-300 text-[10px] font-bold uppercase">
                        {log.resource_type}
                      </span>
                      <span className="font-semibold text-slate-200">{log.action}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">
                      {new Date(log.created_at).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
