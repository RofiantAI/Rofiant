"use client";

import { Brain, Plus, Play, Pause, Trash2, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardSection,
  DashboardList,
  DashboardEmptyState,
  DashboardProductStatus,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows } from "@/components/ui/skeleton";

type Agent = {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused";
  runs: number;
  last_output?: string | null;
};

type PipelinePhase = "receive" | "plan" | "search" | "approval" | "execute";

type PipelineStepRecord = {
  phase: PipelinePhase;
  status: "done" | "waiting" | "blocked" | "skipped";
  summary: string;
  detail?: unknown;
};

const PIPELINE_PHASES: PipelinePhase[] = ["receive", "plan", "search", "approval", "execute"];

function PipelineProgress({
  pipeline,
  t,
}: {
  pipeline: PipelineStepRecord[];
  t: (key: string) => string;
}) {
  const activeCount = pipeline.filter((s) => s.status === "done").length;
  const waiting = pipeline.some((s) => s.phase === "approval" && s.status === "waiting");

  return (
    <div className="space-y-3">
      <p className="text-xs font-medium text-foreground-muted uppercase tracking-wide">
        {t("pipelineHeading")}
      </p>
      <div className="flex items-center gap-1 overflow-x-auto pb-1">
        {PIPELINE_PHASES.map((phase, i) => {
          const record = pipeline.find((s) => s.phase === phase);
          const active = i < activeCount || (waiting && phase === "approval");
          return (
            <div key={phase} className="flex items-center">
              <div className="flex flex-col items-center min-w-[72px]">
                <div
                  className={`w-8 h-8 flex items-center justify-center text-xs font-medium transition-colors rounded-md ${
                    active ? "bg-accent-primary text-black" : "bg-background-tertiary text-foreground-muted"
                  }`}
                >
                  {record?.status === "done" && phase !== "approval" ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
                <span className="text-[10px] text-foreground-muted mt-1.5 text-center leading-tight">
                  {t(`phases.${phase}`)}
                </span>
              </div>
              {i < PIPELINE_PHASES.length - 1 && (
                <div
                  className={`h-px w-4 mx-0.5 ${i < activeCount - 1 ? "bg-accent-primary" : "bg-border"}`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function AgentsAutomationTool() {
  const t = useTranslations("dashboard.agents");
  const tStatus = useTranslations("dashboard.productStatus");
  const TEMPLATES = [
    { name: t("templates.documentReviewer.name"), desc: t("templates.documentReviewer.description") },
    { name: t("templates.meetingSummarizer.name"), desc: t("templates.meetingSummarizer.description") },
    { name: t("templates.dataExtractor.name"), desc: t("templates.dataExtractor.description") },
  ];
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [runningId, setRunningId] = useState<string | null>(null);
  const [runAgent, setRunAgent] = useState<Agent | null>(null);
  const [runTask, setRunTask] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [runPipeline, setRunPipeline] = useState<PipelineStepRecord[]>([]);
  const [proposedActions, setProposedActions] = useState("");
  const [pendingRunId, setPendingRunId] = useState<string | null>(null);
  const [runPhase, setRunPhase] = useState<"idle" | "running" | "approval" | "executing" | "done">("idle");
  const [runError, setRunError] = useState("");

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAgents(data); })
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setAgents((prev) => [data, ...prev]);
      setNewName("");
      setNewDesc("");
      setShowForm(false);
    }
    setCreating(false);
  }

  async function createFromTemplate(template: { name: string; desc: string }) {
    setNewName(template.name);
    setNewDesc(template.desc);
    setShowForm(true);
  }

  async function handleToggle(agent: Agent) {
    setToggling(agent.id);
    const next = agent.status === "active" ? "paused" : "active";
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setAgents((prev) => prev.map((a) => (a.id === agent.id ? { ...a, status: next } : a)));
    setToggling(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  }

  function resetRunModal() {
    setRunAgent(null);
    setRunTask("");
    setRunOutput("");
    setRunPipeline([]);
    setProposedActions("");
    setPendingRunId(null);
    setRunPhase("idle");
    setRunError("");
  }

  async function handleRun(e: React.FormEvent) {
    e.preventDefault();
    if (!runAgent) return;
    setRunningId(runAgent.id);
    setRunError("");
    setRunOutput("");
    setRunPipeline([]);
    setProposedActions("");
    setPendingRunId(null);
    setRunPhase("running");

    const res = await fetch(`/api/agents/${runAgent.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ task: runTask.trim() }),
    });
    const data = await res.json();

    if (res.ok && data.status === "pending_approval") {
      setRunPipeline(Array.isArray(data.pipeline) ? data.pipeline : []);
      setProposedActions(data.proposedActions ?? "");
      setPendingRunId(data.runId ?? null);
      setRunPhase("approval");
    } else if (res.ok) {
      setRunOutput(data.output ?? "");
      setRunPipeline(Array.isArray(data.pipeline) ? data.pipeline : []);
      setRunPhase("done");
    } else {
      setRunError(data.error ?? t("run.error"));
      setRunPhase("idle");
    }
    setRunningId(null);
  }

  async function handleDecision(decision: "approved" | "denied") {
    if (!runAgent || !pendingRunId) return;
    setRunningId(runAgent.id);
    setRunPhase("executing");
    setRunError("");

    const res = await fetch(`/api/agents/${runAgent.id}/run`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ runId: pendingRunId, decision }),
    });
    const data = await res.json();

    if (res.ok) {
      setRunOutput(data.output ?? "");
      setRunPipeline(Array.isArray(data.pipeline) ? data.pipeline : []);
      setRunPhase("done");
      if (data.status === "completed") {
        setAgents((prev) =>
          prev.map((a) =>
            a.id === runAgent.id
              ? { ...a, runs: data.runs ?? a.runs + 1, last_output: data.output }
              : a,
          ),
        );
      }
    } else {
      setRunError(data.error ?? t("run.error"));
      setRunPhase("approval");
    }
    setRunningId(null);
  }

  return (
    <DashboardPage>
      <DashboardHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <DashboardPrimaryButton onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            {t("newAgent")}
          </DashboardPrimaryButton>
        }
      />

      <DashboardProductStatus label={tStatus("beta")}>{tStatus("agents")}</DashboardProductStatus>

      {showForm && (
        <DashboardCard>
          <h3 className="text-sm font-medium text-foreground mb-4">{t("customAgent.heading")}</h3>
          <div className="flex flex-wrap gap-2 mb-4">
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.name}
                type="button"
                onClick={() => createFromTemplate(tpl)}
                className="text-xs px-3 py-1.5 rounded-md border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
              >
                {tpl.name}
              </button>
            ))}
          </div>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("customAgent.namePlaceholder")}
              className="w-full h-9 px-3 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder={t("customAgent.descriptionPlaceholder")}
              className="w-full h-9 px-3 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <div className="flex gap-2">
              <DashboardPrimaryButton type="submit" disabled={creating}>
                {creating ? t("customAgent.creating") : t("customAgent.create")}
              </DashboardPrimaryButton>
              <DashboardSecondaryButton type="button" onClick={() => { setShowForm(false); setNewName(""); setNewDesc(""); }}>
                {t("customAgent.cancel")}
              </DashboardSecondaryButton>
            </div>
          </form>
        </DashboardCard>
      )}

      {runAgent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <DashboardCard className="w-full max-w-lg">
            <h3 className="text-sm font-medium text-foreground mb-1">{t("run.heading", { name: runAgent.name })}</h3>
            <p className="text-xs text-foreground-muted mb-4">{runAgent.description || t("run.defaultTask")}</p>
            <form onSubmit={handleRun} className="space-y-3">
              {runPhase === "idle" && (
                <textarea
                  value={runTask}
                  onChange={(e) => setRunTask(e.target.value)}
                  placeholder={t("run.taskPlaceholder")}
                  rows={3}
                  className="w-full px-3 py-2 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary resize-none"
                />
              )}
              {runError && <p className="text-xs text-red-400">{runError}</p>}
              {runPipeline.length > 0 && (
                <PipelineProgress pipeline={runPipeline} t={(k) => t(`run.${k}`)} />
              )}
              {runPhase === "approval" && proposedActions && (
                <div className="rounded-md border border-border bg-background-tertiary p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-accent-warning" />
                    <span className="text-xs font-medium text-accent-warning">{t("run.waitingApproval")}</span>
                  </div>
                  <p className="text-xs font-medium text-foreground">{t("run.proposedActions")}</p>
                  <div className="text-xs text-foreground-secondary whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {proposedActions}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => handleDecision("approved")}
                      disabled={runningId === runAgent.id}
                      className="px-3 py-1.5 text-xs font-medium bg-accent-success/10 text-accent-success border border-accent-success/20 hover:bg-accent-success/20 transition-colors disabled:opacity-50"
                    >
                      {runningId === runAgent.id ? t("run.executing") : t("run.approve")}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDecision("denied")}
                      disabled={runningId === runAgent.id}
                      className="px-3 py-1.5 text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      {t("run.deny")}
                    </button>
                  </div>
                </div>
              )}
              {runPhase === "running" && (
                <p className="text-xs text-foreground-muted">{t("run.running")}</p>
              )}
              {runPhase === "executing" && (
                <p className="text-xs text-foreground-muted">{t("run.executing")}</p>
              )}
              {runOutput && runPhase === "done" && (
                <div className="max-h-48 overflow-y-auto p-3 rounded-md bg-background-tertiary border border-border text-sm text-foreground-secondary whitespace-pre-wrap">
                  {runOutput}
                </div>
              )}
              <div className="flex gap-2 justify-end">
                <DashboardSecondaryButton type="button" onClick={resetRunModal}>
                  {t("run.close")}
                </DashboardSecondaryButton>
                {runPhase === "idle" && (
                  <DashboardPrimaryButton type="submit" disabled={runningId === runAgent.id}>
                    {runningId === runAgent.id ? t("run.running") : t("run.submit")}
                  </DashboardPrimaryButton>
                )}
              </div>
            </form>
          </DashboardCard>
        </div>
      )}

      <DashboardSection title={t("yourAgents.heading")}>
        {loading ? (
          <DashboardList>
            <SkeletonListRows rows={4} />
          </DashboardList>
        ) : agents.length === 0 ? (
          <DashboardEmptyState icon={Brain} title={t("yourAgents.empty")} />
        ) : (
          <DashboardList>
            {agents.map((agent) => (
              <div key={agent.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <Brain className="w-4 h-4 text-foreground-muted shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm font-medium text-foreground">{agent.name}</span>
                    {agent.description && (
                      <p className="text-xs text-foreground-muted truncate">{agent.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs text-foreground-muted">{t("yourAgents.runCount", { count: agent.runs })}</span>
                  <span className={`text-xs ${agent.status === "active" ? "text-accent-success" : "text-foreground-muted"}`}>
                    {agent.status === "active" ? t("yourAgents.statusActive") : t("yourAgents.statusPaused")}
                  </span>
                  <button
                    onClick={() => {
                      setRunAgent(agent);
                      setRunTask("");
                      setRunOutput(agent.last_output ?? "");
                      setRunPipeline([]);
                      setProposedActions("");
                      setPendingRunId(null);
                      setRunPhase("idle");
                      setRunError("");
                    }}
                    disabled={agent.status !== "active" || runningId === agent.id}
                    className="p-1.5 rounded hover:bg-background-tertiary disabled:opacity-40"
                    title={t("run.submit")}
                  >
                    <Play className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleToggle(agent)}
                    disabled={toggling === agent.id}
                    className="p-1.5 rounded hover:bg-background-tertiary disabled:opacity-40"
                    title={agent.status === "active" ? t("yourAgents.pause") : t("yourAgents.activate")}
                  >
                    <Pause className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={deleting === agent.id}
                    className="p-1.5 rounded hover:bg-background-tertiary disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-foreground-muted" />
                  </button>
                </div>
              </div>
            ))}
          </DashboardList>
        )}
      </DashboardSection>
    </DashboardPage>
  );
}
