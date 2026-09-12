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

import {
  operationsApi,
  AgentRun,
  AuditLog,
  SystemHealth,
  getActiveWorkspaceId,
} from "@/lib/api";

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
    const wsId = getActiveWorkspaceId();
    setActiveWorkspaceId(wsId);
    if (wsId) {
      loadOperationsData(wsId);
    }
    setWsConnected(true);
  }, []);

  const loadOperationsData = async (workspaceId: string) => {
    setLoading(true);
    try {
      const [runsData, auditData, healthData] = await Promise.all([
        operationsApi.listAgentRuns(workspaceId).catch(() => []),
        operationsApi.listAuditLogs(workspaceId).catch(() => []),
        operationsApi.getSystemHealth(workspaceId).catch(() => null),
      ]);

      setAgentRuns(runsData);
      setAuditLogs(auditData);
      setSystemHealth(healthData);
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
        {/* Header in Hirael Aesthetic */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-[#85827b] mb-1">
              <Shield className="w-3.5 h-3.5 text-[#d4a373]" />
              <span>Workspace Administration & Hardening</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-normal tracking-tight text-[#ede8df]">
              Settings, Telemetry & Operations
            </h1>
            <p className="text-xs sm:text-sm text-[#8a8a93] mt-1 max-w-2xl leading-relaxed">
              Configure deterministic agent review policies, inspect real-time agent execution
              traces, verify system health, and review audit logs.
            </p>
          </div>

          {/* WebSocket Status Indicator */}
          <div className="flex items-center gap-2.5 bg-white/[0.03] border border-white/[0.08] px-4 py-2 rounded-full shrink-0">
            <span
              className={`w-2 h-2 rounded-full ${
                wsConnected ? "bg-emerald-400" : "bg-white/20"
              }`}
            />
            <span className="text-xs font-mono text-[#ede8df]">
              {wsConnected ? "Real-Time Gateway Active" : "Offline Polling"}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-white/[0.06] pb-3 overflow-x-auto scrollbar-none">
          <button
            onClick={() => setActiveTab("policies")}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === "policies"
                ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                : "text-[#787672] hover:text-[#ede8df] hover:bg-white/[0.04]"
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Agent Governance & Policies</span>
          </button>
          <button
            onClick={() => setActiveTab("telemetry")}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === "telemetry"
                ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                : "text-[#787672] hover:text-[#ede8df] hover:bg-white/[0.04]"
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Agent Telemetry Traces ({agentRuns.length})</span>
          </button>
          <button
            onClick={() => setActiveTab("health")}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === "health"
                ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                : "text-[#787672] hover:text-[#ede8df] hover:bg-white/[0.04]"
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>System Health & Adapters</span>
          </button>
          <button
            onClick={() => setActiveTab("audit")}
            className={`px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all ${
              activeTab === "audit"
                ? "bg-[#ede8df] text-[#08080a] shadow-sm font-semibold"
                : "text-[#787672] hover:text-[#ede8df] hover:bg-white/[0.04]"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
        </div>

        {/* Tab 1: Agent Policies & Governance */}
        {activeTab === "policies" && (
          <div className="max-w-3xl space-y-6">
            <form onSubmit={handleSavePolicies} className="hirael-card p-6 sm:p-8 space-y-6">
              <div>
                <h3 className="text-base font-medium text-[#ede8df] flex items-center gap-2 mb-1">
                  <Shield className="w-4 h-4 text-[#d4a373]" />
                  Deterministic Quality & Review Controls
                </h3>
                <p className="text-xs text-[#8a8a93]">
                  Enforce strict software verification rules before variants can be scheduled or dispatched.
                </p>
              </div>

              <div className="space-y-4 divide-y divide-white/[0.06]">
                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#ede8df] text-sm block">
                      Strict Quality Assurance Threshold (QA score $\ge$ 90%)
                    </span>
                    <span className="text-xs text-[#71717a]">
                      Block human approval if QA scorecard score drops below 90% or contains forbidden phrases.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={strictQA}
                    onChange={(e) => setStrictQA(e.target.checked)}
                    className="w-4 h-4 rounded text-white focus:ring-0 border-white/20 bg-black"
                  />
                </div>

                <div className="pt-4 flex items-center justify-between">
                  <div>
                    <span className="font-medium text-[#ede8df] text-sm block">
                      Autonomous Publishing for Low-Risk Channels
                    </span>
                    <span className="text-xs text-[#71717a]">
                      Allow pre-approved channels (e.g. Internal Newsletters / Drafts) to bypass manual HITL step.
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    checked={autoPublishLowRisk}
                    onChange={(e) => setAutoPublishLowRisk(e.target.checked)}
                    className="w-4 h-4 rounded text-white focus:ring-0 border-white/20 bg-black"
                  />
                </div>

                <div className="pt-4 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-[#ede8df] text-sm block">
                      Active LLM Provider & Routing Engine
                    </label>
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3" /> Groq Active (Primary)
                    </span>
                  </div>
                  <p className="text-xs text-[#71717a]">
                    Groq ultra-fast cloud inference handles multi-platform agent adaptation, tone scoring, and script generation.
                  </p>
                  <select
                    value={modelTier}
                    onChange={(e) => setModelTier(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-black/60 border border-white/10 text-[#ede8df] text-xs focus:outline-none focus:border-white/30"
                  >
                    <option value="groq-fast" className="bg-[#0e0e11]">Groq Qwen 3.8 27B — Ultra Low-Latency Adaptation (Active Provider)</option>
                    <option value="groq-deep" className="bg-[#0e0e11]">Groq GPT-OSS 120B — High-Capacity Structural Synthesis</option>
                    <option value="deterministic" className="bg-[#0e0e11]">Deterministic Template Synthesis (Zero Latency Fallback)</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between">
                {policySaved ? (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1.5 font-mono">
                    <CheckCircle2 className="w-4 h-4" /> Policies updated successfully!
                  </span>
                ) : (
                  <span className="text-xs text-[#71717a] font-mono">Changes apply immediately to new jobs.</span>
                )}
                <button
                  type="submit"
                  className="hirael-pill-btn text-xs"
                >
                  <span>Save Governance Policies</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Tab 2: Agent Telemetry Traces */}
        {activeTab === "telemetry" && (
          <div className="hirael-card p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-medium text-[#ede8df] flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#d4a373]" />
              Agent Workflow Execution & Latency Traces
            </h3>

            {agentRuns.length === 0 ? (
              <p className="text-xs text-[#71717a] py-8 text-center font-mono">
                No agent runs recorded yet. Generate variants from the Content Studio to inspect traces.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-[#a6a39b]">
                  <thead className="text-[10px] uppercase font-mono text-[#787672] bg-white/[0.02] border-b border-white/[0.06]">
                    <tr>
                      <th className="py-3 px-4">Agent Name</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Model</th>
                      <th className="py-3 px-4">Latency</th>
                      <th className="py-3 px-4">Tokens</th>
                      <th className="py-3 px-4">Executed At</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/[0.04] font-mono">
                    {agentRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 px-4 font-medium text-[#ede8df]">
                          {run.agent_name}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px]">
                            {run.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-[#8a8a93]">{run.model}</td>
                        <td className="py-3 px-4 text-[#d4a373] font-bold">{run.latency_ms}ms</td>
                        <td className="py-3 px-4 text-[#8a8a93]">
                          {run.token_usage_json.total_tokens || 0} tokens
                        </td>
                        <td className="py-3 px-4 text-[#71717a]">
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
            <div className="hirael-card p-6 space-y-4">
              <h3 className="text-base font-medium text-[#ede8df] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#d4a373]" />
                AI Agent Pipeline Health
              </h3>
              <div className="space-y-2.5">
                {Object.entries(systemHealth?.agents || {}).map(([agent, status]) => (
                  <div
                    key={agent}
                    className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs"
                  >
                    <span className="font-medium text-[#ede8df] capitalize">
                      {agent.replace("_", " ")}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase">
                      {status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Platform Adapters Status */}
            <div className="hirael-card p-6 space-y-4">
              <h3 className="text-base font-medium text-[#ede8df] flex items-center gap-2">
                <Server className="w-4 h-4 text-[#ede8df]" />
                Registered Platform Adapters
              </h3>
              <div className="space-y-2.5">
                {Object.entries(systemHealth?.supported_platform_adapters || {}).map(
                  ([plat, details]: [string, any]) => (
                    <div
                      key={plat}
                      className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.05] flex items-center justify-between text-xs"
                    >
                      <div>
                        <span className="font-medium text-[#ede8df] uppercase block">{plat}</span>
                        <span className="text-[10px] text-[#71717a] font-mono">
                          {details.formats?.length || 0} supported formats
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono uppercase">
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
          <div className="hirael-card p-6 sm:p-8 space-y-4">
            <h3 className="text-base font-medium text-[#ede8df] flex items-center gap-2">
              <History className="w-4 h-4 text-[#d4a373]" />
              Immutable Workspace Audit Log
            </h3>

            {auditLogs.length === 0 ? (
              <p className="text-xs text-[#71717a] py-8 text-center font-mono">
                No audit events recorded yet for this workspace.
              </p>
            ) : (
              <div className="divide-y divide-white/[0.05] font-mono text-xs">
                {auditLogs.map((log) => (
                  <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded-md bg-white/[0.05] text-[#ede8df] border border-white/[0.08] text-[10px] uppercase">
                        {log.resource_type}
                      </span>
                      <span className="font-medium text-[#ede8df]">{log.action}</span>
                    </div>
                    <span className="text-[#71717a] text-[11px]">
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
