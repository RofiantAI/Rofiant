"use client";

import { Brain, Plus, Play, Pause, Trash2, List } from "lucide-react";
import { useEffect, useState } from "react";

type Agent = {
  id: string;
  name: string;
  description: string;
  status: "active" | "paused";
  runs: number;
};

const TEMPLATES = [
  { name: "Document reviewer", desc: "Review uploaded documents and flag key items" },
  { name: "Meeting summarizer", desc: "Summarize transcripts and extract action items" },
  { name: "Data extractor", desc: "Pull structured data from unstructured text" },
];

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState<string | null>(null);
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");

  useEffect(() => {
    fetch("/api/agents")
      .then((r) => r.json())
      .then(setAgents)
      .finally(() => setLoading(false));
  }, []);

  async function createFromTemplate(t: { name: string; desc: string }) {
    setCreating(t.name);
    const res = await fetch("/api/agents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: t.name, description: t.desc }),
    });
    const data = await res.json();
    if (res.ok) setAgents((prev) => [data, ...prev]);
    setCreating(null);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating("custom");
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
    setCreating(null);
  }

  async function handleToggle(agent: Agent) {
    setToggling(agent.id);
    const next = agent.status === "active" ? "paused" : "active";
    await fetch(`/api/agents/${agent.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    setAgents((prev) => prev.map((a) => a.id === agent.id ? { ...a, status: next } : a));
    setToggling(null);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/agents/${id}`, { method: "DELETE" });
    setAgents((prev) => prev.filter((a) => a.id !== id));
    setDeleting(null);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-foreground">Agents</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            AI workflow assistants with approval gates and audit trails
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New agent
        </button>
      </div>

      {showForm && (
        <div className="mb-8 bg-card border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">Custom agent</h3>
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Agent name"
              className="w-full h-9 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
              className="w-full h-9 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={creating === "custom"}
                className="h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors"
              >
                {creating === "custom" ? "Creating…" : "Create"}
              </button>
              <button
                type="button"
                onClick={() => { setShowForm(false); setNewName(""); setNewDesc(""); }}
                className="h-9 px-3 text-sm border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="mb-8">
        <h2 className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wider">
          Templates
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          {TEMPLATES.map((t) => (
            <button
              key={t.name}
              onClick={() => createFromTemplate(t)}
              disabled={creating === t.name}
              className="bg-card border border-border p-5 hover:border-border-light transition-colors text-left disabled:opacity-60"
            >
              <div className="w-10 h-10 bg-background-tertiary flex items-center justify-center mb-4">
                <Brain className="w-5 h-5" />
              </div>
              <h3 className="font-medium text-foreground">{t.name}</h3>
              <p className="text-sm text-foreground-secondary mt-1">{t.desc}</p>
              {creating === t.name && (
                <p className="text-xs text-foreground-muted mt-2">Creating…</p>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wider">
          Your agents
        </h2>
        {loading ? (
          <div className="bg-card border border-border p-8 text-center text-sm text-foreground-muted">
            Loading…
          </div>
        ) : agents.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <List className="w-5 h-5 text-foreground-muted mx-auto mb-3" />
            <p className="text-sm text-foreground-secondary">
              No agents created yet. Choose a template above or build from scratch.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border">
            {agents.map((agent, i) => (
              <div
                key={agent.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < agents.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3">
                  <Brain className="w-4 h-4 text-foreground-muted" />
                  <div>
                    <span className="text-sm text-foreground">{agent.name}</span>
                    {agent.description && (
                      <p className="text-xs text-foreground-muted">{agent.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs text-foreground-muted">{agent.runs} runs</span>
                  <span className={`text-xs ${agent.status === "active" ? "text-accent-success" : "text-foreground-muted"}`}>
                    {agent.status}
                  </span>
                  <button
                    onClick={() => handleToggle(agent)}
                    disabled={toggling === agent.id}
                    className="p-1 hover:bg-background-tertiary transition-colors disabled:opacity-40"
                    title={agent.status === "active" ? "Pause" : "Activate"}
                  >
                    {agent.status === "active" ? (
                      <Pause className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                  </button>
                  <button
                    onClick={() => handleDelete(agent.id)}
                    disabled={deleting === agent.id}
                    className="p-1 hover:bg-background-tertiary transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3 text-foreground-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
