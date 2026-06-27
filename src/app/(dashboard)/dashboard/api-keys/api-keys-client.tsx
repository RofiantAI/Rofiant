"use client";

import { Key, Copy, Plus, Trash2, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate as fmtDate } from "@/lib/user-prefs";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  created_at: string;
  last_used_at: string | null;
};

type CreatedKey = ApiKey & { key_value: string };

export function APIKeysClient() {
  const [keys, setKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [createdKey, setCreatedKey] = useState<CreatedKey | null>(null);
  const [copied, setCopied] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then(setKeys)
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setCreating(true);
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCreatedKey(data);
      setKeys((prev) => [data, ...prev]);
      setNewName("");
      setShowForm(false);
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    setKeys((prev) => prev.filter((k) => k.id !== id));
    setDeleting(null);
  }

  async function handleCopy(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  }

  function formatDate(iso: string | null) {
    if (!iso) return "—";
    return fmtDate(iso);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-foreground">API Keys</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Manage keys for programmatic access to Rofiant
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create key
        </button>
      </div>

      {showForm && (
        <div className="mb-6 bg-card border border-border p-5">
          <h3 className="text-sm font-medium text-foreground mb-4">New API key</h3>
          <form onSubmit={handleCreate} className="flex items-center gap-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Key name (e.g. Production)"
              className="flex-1 h-9 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <button
              type="submit"
              disabled={creating}
              className="h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {creating ? "Creating…" : "Create"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setNewName(""); }}
              className="h-9 px-3 text-sm border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
            >
              Cancel
            </button>
          </form>
        </div>
      )}

      {createdKey && (
        <div className="mb-6 bg-card border border-accent-primary/30 p-5">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-foreground">
              Key created — copy it now. It won&apos;t be shown again.
            </p>
            <button onClick={() => setCreatedKey(null)}>
              <X className="w-4 h-4 text-foreground-muted hover:text-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <code className="flex-1 text-xs font-mono bg-background-tertiary px-3 py-2 text-foreground break-all">
              {createdKey.key_value}
            </code>
            <button
              onClick={() => handleCopy(createdKey.key_value, "new")}
              className="shrink-0 h-8 px-3 text-xs border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors flex items-center gap-1.5"
            >
              {copied === "new" ? <Check className="w-3 h-3 text-accent-success" /> : <Copy className="w-3 h-3" />}
              {copied === "new" ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      )}

      <div className="bg-card border border-border">
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-foreground-muted uppercase tracking-wider">
          <span>Name</span>
          <span>Key prefix</span>
          <span>Created</span>
          <span></span>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-sm text-foreground-muted">Loading…</div>
        ) : keys.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-foreground-secondary">
            No API keys yet. Create one above.
          </div>
        ) : (
          keys.map((k, i) => (
            <div
              key={k.id}
              className={`grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-5 py-4 ${
                i < keys.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <span className="text-sm text-foreground">{k.name}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-foreground-secondary bg-background-tertiary px-2 py-1">
                  {k.key_prefix}…
                </code>
                <button
                  onClick={() => handleCopy(k.key_prefix, k.id)}
                  className="p-1 hover:bg-background-tertiary transition-colors"
                >
                  {copied === k.id ? (
                    <Check className="w-3 h-3 text-accent-success" />
                  ) : (
                    <Copy className="w-3 h-3 text-foreground-muted" />
                  )}
                </button>
              </div>
              <span className="text-xs text-foreground-muted">{formatDate(k.created_at)}</span>
              <button
                onClick={() => handleDelete(k.id)}
                disabled={deleting === k.id}
                className="p-1 hover:bg-background-tertiary transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3 text-foreground-muted" />
              </button>
            </div>
          ))
        )}
      </div>

      <div className="mt-6 bg-card border border-border p-5">
        <div className="flex items-start gap-4">
          <Key className="w-5 h-5 text-foreground-muted mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-foreground">Authentication</h3>
            <p className="text-sm text-foreground-secondary mt-1">
              Include your API key in the Authorization header:
            </p>
            <code className="block mt-3 text-xs font-mono bg-background-tertiary p-3 text-foreground-secondary">
              Authorization: Bearer rofiant_sk_...
            </code>
            <a
              href="/resources/api-reference"
              className="inline-flex items-center justify-center h-8 px-3 text-xs font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors mt-4"
            >
              View API reference
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
