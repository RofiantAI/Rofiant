"use client";

import { BookOpen, Plus, Trash2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

type KB = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  knowledge_base_documents: { count: number }[];
};

const PLAN_LIMITS: Record<string, number | null> = {
  free: 0, pro: 1, team: 3, pilot: 3, agency: null, enterprise: null,
};

export default function KnowledgeBasesPage() {
  const [kbs, setKbs] = useState<KB[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");
  const [plan, setPlan] = useState("free");

  useEffect(() => {
    fetch("/api/knowledge-bases")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setKbs(d); })
      .catch(() => {})
      .finally(() => setLoading(false));
    // Get plan from session
    fetch("/api/auth/session").then((r) => r.json()).then((s) => {
      setPlan((s?.user?.user_metadata?.plan ?? "free").toLowerCase());
    }).catch(() => {});
  }, []);

  async function create() {
    if (!name.trim()) return;
    setError(""); setPlanError("");
    const res = await fetch("/api/knowledge-bases", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim(), description: desc.trim() }),
    });
    const data = await res.json();
    if (!res.ok) {
      if (res.status === 403) setPlanError(data.error);
      else setError(data.error ?? "Failed to create");
      return;
    }
    setKbs((prev) => [data, ...prev]);
    setName(""); setDesc(""); setCreating(false);
  }

  async function remove(id: string) {
    if (!confirm("Delete this knowledge base? This cannot be undone.")) return;
    await fetch(`/api/knowledge-bases/${id}`, { method: "DELETE" });
    setKbs((prev) => prev.filter((k) => k.id !== id));
  }

  const limit = PLAN_LIMITS[plan];
  const atLimit = limit !== null && kbs.length >= limit;

  return (
    <div>
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-normal text-foreground">Knowledge Bases</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Named collections of documents the AI uses as persistent context in chat.
            {limit !== null && (
              <span className="ml-1 text-foreground-muted">({kbs.length}/{limit} used)</span>
            )}
          </p>
        </div>
        <button
          onClick={() => { if (atLimit) { setPlanError(`Your plan allows up to ${limit} knowledge base${limit === 1 ? "" : "s"}. Upgrade to create more.`); return; } setCreating(true); setPlanError(""); }}
          className="h-8 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5"
        >
          <Plus className="w-3.5 h-3.5" />
          New knowledge base
        </button>
      </div>

      {planError && (
        <div className="mb-6 px-4 py-3 bg-orange-500/10 border border-orange-500/30 text-sm text-orange-400">
          {planError}{" "}
          <a href="/pricing" className="underline hover:no-underline">View plans →</a>
        </div>
      )}

      {creating && (
        <div className="mb-6 bg-card border border-border p-5">
          <h2 className="text-sm font-medium text-foreground mb-4">New knowledge base</h2>
          <div className="space-y-3">
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Name</label>
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && create()}
                placeholder="e.g. FY2026 Policy Documents"
                className="w-full h-8 px-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light"
              />
            </div>
            <div>
              <label className="block text-xs text-foreground-muted mb-1">Description (optional)</label>
              <input
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="What documents belong here?"
                className="w-full h-8 px-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light"
              />
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2 pt-1">
              <button onClick={create} className="h-8 px-4 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors">
                Create
              </button>
              <button onClick={() => { setCreating(false); setError(""); }} className="h-8 px-4 text-xs border border-border text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="bg-card border border-border p-8 text-center text-sm text-foreground-muted">Loading…</div>
      ) : kbs.length === 0 ? (
        <div className="bg-card border border-border p-16 text-center">
          <BookOpen className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No knowledge bases yet</p>
          <p className="text-sm text-foreground-secondary mb-4">
            Create one and add documents to give the AI persistent context across chats.
          </p>
          {limit === 0 ? (
            <a href="/pricing" className="text-sm text-accent-primary hover:underline">Upgrade your plan to create knowledge bases →</a>
          ) : (
            <button onClick={() => setCreating(true)} className="text-sm text-accent-primary hover:underline">
              Create your first knowledge base →
            </button>
          )}
        </div>
      ) : (
        <div className="divide-y divide-border border border-border bg-card">
          {kbs.map((kb) => {
            const docCount = kb.knowledge_base_documents?.[0]?.count ?? 0;
            return (
              <div key={kb.id} className="flex items-center gap-4 px-5 py-4 hover:bg-background-tertiary/50 transition-colors group">
                <BookOpen className="w-4 h-4 text-foreground-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{kb.name}</div>
                  {kb.description && (
                    <div className="text-xs text-foreground-muted truncate mt-0.5">{kb.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground-muted shrink-0">
                  <FileText className="w-3 h-3" />
                  {docCount} doc{docCount !== 1 ? "s" : ""}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => remove(kb.id)}
                    className="h-7 w-7 flex items-center justify-center text-foreground-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href={`/dashboard/knowledge-bases/${kb.id}`}
                    className="h-7 px-2.5 flex items-center gap-1 text-xs text-foreground-secondary hover:text-foreground hover:bg-background-tertiary transition-colors"
                  >
                    Manage <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
