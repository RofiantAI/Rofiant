"use client";

import { Key, Copy, Plus, Trash2, Check, X } from "lucide-react";
import { useEffect, useState } from "react";
import { formatDate as fmtDate } from "@/lib/user-prefs";
import { useTranslations } from "next-intl";
import { WebhooksSection } from "./webhooks-section";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardList,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows } from "@/components/ui/skeleton";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  key_value: string;
  created_at: string;
  last_used_at: string | null;
};

type CreatedKey = ApiKey;

export function APIKeysClient() {
  const t = useTranslations("dashboard.apiKeys");
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
    if (!iso) return t("table.noDate");
    return fmtDate(iso);
  }

  return (
    <DashboardPage>
      <DashboardHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <DashboardPrimaryButton onClick={() => setShowForm(true)}>
            <Plus className="w-4 h-4" />
            {t("createKey")}
          </DashboardPrimaryButton>
        }
      />

      {showForm && (
        <DashboardCard>
          <h3 className="text-sm font-medium text-foreground mb-4">{t("newKeyForm.heading")}</h3>
          <form onSubmit={handleCreate} className="flex flex-wrap items-center gap-3">
            <input
              autoFocus
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={t("newKeyForm.namePlaceholder")}
              className="flex-1 min-w-[200px] h-9 px-3 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <DashboardPrimaryButton type="submit" disabled={creating}>
              {creating ? t("newKeyForm.creating") : t("newKeyForm.create")}
            </DashboardPrimaryButton>
            <DashboardSecondaryButton type="button" onClick={() => { setShowForm(false); setNewName(""); }}>
              {t("newKeyForm.cancel")}
            </DashboardSecondaryButton>
          </form>
        </DashboardCard>
      )}

      {createdKey && (
        <DashboardCard className="border-accent-primary/30">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-foreground">{t("createdKey.message")}</p>
            <button onClick={() => setCreatedKey(null)}>
              <X className="w-4 h-4 text-foreground-muted hover:text-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <code className="flex-1 text-xs font-mono bg-background-tertiary px-3 py-2 rounded text-foreground break-all">
              {createdKey.key_value}
            </code>
            <DashboardSecondaryButton onClick={() => handleCopy(createdKey.key_value, "new")}>
              {copied === "new" ? <Check className="w-3 h-3 text-accent-success" /> : <Copy className="w-3 h-3" />}
              {copied === "new" ? t("createdKey.copied") : t("createdKey.copy")}
            </DashboardSecondaryButton>
          </div>
        </DashboardCard>
      )}

      <DashboardList>
        <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-foreground-muted">
          <span>{t("table.name")}</span>
          <span>{t("table.keyPrefix")}</span>
          <span>{t("table.created")}</span>
          <span />
        </div>
        {loading ? (
          <SkeletonListRows rows={4} />
        ) : keys.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-foreground-secondary">{t("table.empty")}</div>
        ) : (
          keys.map((k) => (
            <div key={k.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 border-b border-border last:border-0">
              <span className="text-sm text-foreground">{k.name}</span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono text-foreground-secondary bg-background-tertiary px-2 py-1 rounded">
                  {k.key_prefix}…
                </code>
                <button onClick={() => handleCopy(k.key_value, k.id)} className="p-1 rounded hover:bg-background-tertiary">
                  {copied === k.id ? <Check className="w-3 h-3 text-accent-success" /> : <Copy className="w-3 h-3 text-foreground-muted" />}
                </button>
              </div>
              <span className="text-xs text-foreground-muted">{formatDate(k.created_at)}</span>
              <button
                onClick={() => handleDelete(k.id)}
                disabled={deleting === k.id}
                className="p-1 rounded hover:bg-background-tertiary disabled:opacity-40"
              >
                <Trash2 className="w-3.5 h-3.5 text-foreground-muted" />
              </button>
            </div>
          ))
        )}
      </DashboardList>

      <WebhooksSection />
    </DashboardPage>
  );
}
