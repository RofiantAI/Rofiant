"use client";

import { Webhook, Plus, Trash2, Check, X, Copy } from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DashboardSection,
  DashboardCard,
  DashboardList,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows } from "@/components/ui/skeleton";

type WebhookSub = {
  id: string;
  url: string;
  events: string[];
  active: boolean;
  created_at: string;
};

type CreatedWebhook = WebhookSub & { secret: string };

const EVENT_OPTIONS = ["document.processed"];

export function WebhooksSection() {
  const t = useTranslations("dashboard.apiKeys.webhooks");
  const [hooks, setHooks] = useState<WebhookSub[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [url, setUrl] = useState("");
  const [events, setEvents] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [createdHook, setCreatedHook] = useState<CreatedWebhook | null>(null);
  const [copied, setCopied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/webhooks")
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setHooks(Array.isArray(data) ? data : []))
      .finally(() => setLoading(false));
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!url.trim() || events.length === 0) return;
    setCreating(true);
    const res = await fetch("/api/webhooks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url: url.trim(), events }),
    });
    const data = await res.json();
    if (res.ok) {
      setCreatedHook(data);
      setHooks((prev) => [data, ...prev]);
      setUrl("");
      setEvents([]);
      setShowForm(false);
    } else {
      setError(data.error ?? t("form.error"));
    }
    setCreating(false);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
    setHooks((prev) => prev.filter((h) => h.id !== id));
    setDeleting(null);
  }

  function toggleEvent(event: string) {
    setEvents((prev) => (prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event]));
  }

  return (
    <DashboardSection
      title={t("title")}
      action={
        <DashboardSecondaryButton onClick={() => setShowForm(true)}>
          <Plus className="w-3.5 h-3.5" />
          {t("addWebhook")}
        </DashboardSecondaryButton>
      }
    >
      <p className="text-xs text-foreground-muted -mt-1 mb-3">{t("subtitle")}</p>

      {showForm && (
        <DashboardCard className="mb-4">
          <form onSubmit={handleCreate} className="space-y-3">
            <input
              autoFocus
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder={t("form.urlPlaceholder")}
              className="w-full h-9 px-3 bg-background-secondary border border-border rounded text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
            />
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map((event) => (
                <button
                  key={event}
                  type="button"
                  onClick={() => toggleEvent(event)}
                  className={`h-7 px-3 text-xs font-mono border rounded transition-colors ${
                    events.includes(event)
                      ? "border-accent-primary text-accent-primary bg-accent-primary/10"
                      : "border-border text-foreground-secondary hover:bg-background-tertiary"
                  }`}
                >
                  {event}
                </button>
              ))}
            </div>
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex items-center gap-3">
              <DashboardPrimaryButton type="submit" disabled={creating}>
                {creating ? t("form.creating") : t("form.create")}
              </DashboardPrimaryButton>
              <DashboardSecondaryButton
                type="button"
                onClick={() => { setShowForm(false); setUrl(""); setEvents([]); setError(null); }}
              >
                {t("form.cancel")}
              </DashboardSecondaryButton>
            </div>
          </form>
        </DashboardCard>
      )}

      {createdHook && (
        <DashboardCard className="mb-4 border-accent-primary/30">
          <div className="flex items-start justify-between mb-2">
            <p className="text-sm font-medium text-foreground">{t("created.message")}</p>
            <button onClick={() => setCreatedHook(null)}>
              <X className="w-4 h-4 text-foreground-muted hover:text-foreground" />
            </button>
          </div>
          <div className="flex items-center gap-2 mt-3">
            <code className="flex-1 text-xs font-mono bg-background-tertiary px-3 py-2 rounded text-foreground break-all">
              {createdHook.secret}
            </code>
            <DashboardSecondaryButton
              onClick={() => {
                navigator.clipboard.writeText(createdHook.secret);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
            >
              {copied ? <Check className="w-3 h-3 text-accent-success" /> : <Copy className="w-3 h-3" />}
              {copied ? t("created.copied") : t("created.copy")}
            </DashboardSecondaryButton>
          </div>
        </DashboardCard>
      )}

      <DashboardList>
        {loading ? (
          <SkeletonListRows rows={3} />
        ) : hooks.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-foreground-secondary">{t("table.empty")}</div>
        ) : (
          hooks.map((h) => (
            <div key={h.id} className="grid grid-cols-[1fr_auto] gap-4 items-center px-5 py-4">
              <div className="flex items-center gap-3 min-w-0">
                <Webhook className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{h.url}</p>
                  <p className="text-xs text-foreground-muted font-mono">{h.events.join(", ")}</p>
                </div>
              </div>
              <button
                onClick={() => handleDelete(h.id)}
                disabled={deleting === h.id}
                className="p-1 hover:bg-background-tertiary rounded transition-colors disabled:opacity-40"
              >
                <Trash2 className="w-3 h-3 text-foreground-muted" />
              </button>
            </div>
          ))
        )}
      </DashboardList>
    </DashboardSection>
  );
}
