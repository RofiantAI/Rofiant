"use client";

import { useState } from "react";
import {
  Megaphone,
  Layout,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardSection,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardAlert,
} from "@/components/dashboard/ui/page-shell";

type Announcement = {
  id: string;
  title: string;
  body: string;
  variant: "info" | "warning" | "critical";
  active: boolean;
  created_at: string;
};

type Screen = {
  id: string;
  slug: string;
  title: string;
  content: string;
  published: boolean;
  show_in_nav: boolean;
  nav_label: string | null;
  updated_at: string;
};

export function SiteBroadcastClient({
  initialAnnouncements,
  initialScreens,
  locale,
}: {
  initialAnnouncements: Announcement[];
  initialScreens: Screen[];
  locale: string;
}) {
  const t = useTranslations("dashboard.siteAdmin.broadcast");
  const [tab, setTab] = useState<"announcements" | "screens">("announcements");
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [screens, setScreens] = useState(initialScreens);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [annTitle, setAnnTitle] = useState("");
  const [annBody, setAnnBody] = useState("");
  const [annVariant, setAnnVariant] = useState<"info" | "warning" | "critical">("info");

  const [screenTitle, setScreenTitle] = useState("");
  const [screenSlug, setScreenSlug] = useState("");
  const [screenContent, setScreenContent] = useState("");
  const [screenNavLabel, setScreenNavLabel] = useState("");

  async function createAnnouncement(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/site/announcements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: annTitle, body: annBody, variant: annVariant }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errors.createFailed"));
      setAnnouncements((prev) => [data, ...prev]);
      setAnnTitle("");
      setAnnBody("");
      setAnnVariant("info");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function toggleAnnouncement(id: string, active: boolean) {
    const res = await fetch(`/api/site/announcements/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ active }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setAnnouncements((prev) => prev.map((a) => (a.id === id ? data : a)));
  }

  async function deleteAnnouncement(id: string) {
    const res = await fetch(`/api/site/announcements/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setAnnouncements((prev) => prev.filter((a) => a.id !== id));
  }

  async function createScreen(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/site/screens", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: screenTitle,
          slug: screenSlug || undefined,
          content: screenContent,
          nav_label: screenNavLabel || screenTitle,
          published: true,
          show_in_nav: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errors.createFailed"));
      setScreens((prev) => [data, ...prev]);
      setScreenTitle("");
      setScreenSlug("");
      setScreenContent("");
      setScreenNavLabel("");
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.createFailed"));
    } finally {
      setLoading(false);
    }
  }

  async function toggleScreenPublished(id: string, published: boolean) {
    const res = await fetch(`/api/site/screens/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published }),
    });
    if (!res.ok) return;
    const data = await res.json();
    setScreens((prev) => prev.map((s) => (s.id === id ? data : s)));
  }

  async function deleteScreen(id: string) {
    const res = await fetch(`/api/site/screens/${id}`, { method: "DELETE" });
    if (!res.ok) return;
    setScreens((prev) => prev.filter((s) => s.id !== id));
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-2 border-b border-border">
        <button
          onClick={() => setTab("announcements")}
          className={`px-4 py-2 text-sm border-b-2 transition-colors ${
            tab === "announcements"
              ? "border-accent-primary text-foreground"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            {t("tabs.announcements")}
          </span>
        </button>
        <button
          onClick={() => setTab("screens")}
          className={`px-4 py-2 text-sm border-b-2 transition-colors ${
            tab === "screens"
              ? "border-accent-primary text-foreground"
              : "border-transparent text-foreground-muted hover:text-foreground"
          }`}
        >
          <span className="inline-flex items-center gap-2">
            <Layout className="w-4 h-4" />
            {t("tabs.screens")}
          </span>
        </button>
      </div>

      {error && <DashboardAlert variant="warning">{error}</DashboardAlert>}

      {tab === "announcements" && (
        <>
          <DashboardCard>
            <form onSubmit={createAnnouncement} className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">{t("announcements.createTitle")}</h3>
              <input
                value={annTitle}
                onChange={(e) => setAnnTitle(e.target.value)}
                placeholder={t("announcements.titlePlaceholder")}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md"
                required
              />
              <textarea
                value={annBody}
                onChange={(e) => setAnnBody(e.target.value)}
                placeholder={t("announcements.bodyPlaceholder")}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md resize-y"
                required
              />
              <div className="flex flex-wrap items-center gap-3">
                <select
                  value={annVariant}
                  onChange={(e) => setAnnVariant(e.target.value as typeof annVariant)}
                  className="h-9 px-3 text-sm bg-background border border-border rounded-md"
                >
                  <option value="info">{t("announcements.variantInfo")}</option>
                  <option value="warning">{t("announcements.variantWarning")}</option>
                  <option value="critical">{t("announcements.variantCritical")}</option>
                </select>
                <DashboardPrimaryButton type="submit" disabled={loading}>
                  <Plus className="w-4 h-4" />
                  {loading ? t("saving") : t("announcements.publish")}
                </DashboardPrimaryButton>
              </div>
            </form>
          </DashboardCard>

          <DashboardSection title={t("announcements.listTitle")}>
            {announcements.length === 0 ? (
              <DashboardCard>
                <p className="text-sm text-foreground-secondary">{t("announcements.empty")}</p>
              </DashboardCard>
            ) : (
              <div className="space-y-3">
                {announcements.map((a) => (
                  <DashboardCard key={a.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium text-foreground">{a.title}</p>
                          <span className="text-[10px] uppercase tracking-wide text-foreground-muted border border-border px-1.5 py-0.5 rounded">
                            {a.variant}
                          </span>
                          {!a.active && (
                            <span className="text-[10px] uppercase tracking-wide text-foreground-muted">
                              {t("inactive")}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-foreground-secondary mt-1 whitespace-pre-wrap">{a.body}</p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <DashboardSecondaryButton onClick={() => toggleAnnouncement(a.id, !a.active)}>
                          {a.active ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {a.active ? t("announcements.deactivate") : t("announcements.activate")}
                        </DashboardSecondaryButton>
                        <button
                          onClick={() => deleteAnnouncement(a.id)}
                          className="inline-flex items-center justify-center w-9 h-9 border border-border text-foreground-muted hover:text-red-400 hover:border-red-500/30 transition-colors"
                          aria-label={t("delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </DashboardCard>
                ))}
              </div>
            )}
          </DashboardSection>
        </>
      )}

      {tab === "screens" && (
        <>
          <DashboardCard>
            <form onSubmit={createScreen} className="space-y-4">
              <h3 className="text-sm font-medium text-foreground">{t("screens.createTitle")}</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <input
                  value={screenTitle}
                  onChange={(e) => setScreenTitle(e.target.value)}
                  placeholder={t("screens.titlePlaceholder")}
                  className="h-9 px-3 text-sm bg-background border border-border rounded-md"
                  required
                />
                <input
                  value={screenSlug}
                  onChange={(e) => setScreenSlug(e.target.value)}
                  placeholder={t("screens.slugPlaceholder")}
                  className="h-9 px-3 text-sm bg-background border border-border rounded-md"
                />
              </div>
              <input
                value={screenNavLabel}
                onChange={(e) => setScreenNavLabel(e.target.value)}
                placeholder={t("screens.navLabelPlaceholder")}
                className="w-full h-9 px-3 text-sm bg-background border border-border rounded-md"
              />
              <textarea
                value={screenContent}
                onChange={(e) => setScreenContent(e.target.value)}
                placeholder={t("screens.contentPlaceholder")}
                rows={8}
                className="w-full px-3 py-2 text-sm bg-background border border-border rounded-md resize-y font-mono"
              />
              <DashboardPrimaryButton type="submit" disabled={loading}>
                <Plus className="w-4 h-4" />
                {loading ? t("saving") : t("screens.publish")}
              </DashboardPrimaryButton>
            </form>
          </DashboardCard>

          <DashboardSection title={t("screens.listTitle")}>
            {screens.length === 0 ? (
              <DashboardCard>
                <p className="text-sm text-foreground-secondary">{t("screens.empty")}</p>
              </DashboardCard>
            ) : (
              <div className="space-y-3">
                {screens.map((s) => (
                  <DashboardCard key={s.id}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="text-sm font-medium text-foreground">{s.title}</p>
                          <code className="text-xs text-foreground-muted bg-background-tertiary px-1.5 py-0.5 rounded">
                            /{locale}/pages/{s.slug}
                          </code>
                          {!s.published && (
                            <span className="text-[10px] uppercase tracking-wide text-foreground-muted">
                              {t("draft")}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-foreground-muted mt-1">
                          {t("screens.navLabel")}: {s.nav_label ?? s.title}
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 flex-wrap">
                        <Link
                          href={`/${locale}/pages/${s.slug}`}
                          target="_blank"
                          className="inline-flex items-center gap-1.5 h-9 px-3 text-sm border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                          {t("screens.preview")}
                        </Link>
                        <DashboardSecondaryButton onClick={() => toggleScreenPublished(s.id, !s.published)}>
                          {s.published ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          {s.published ? t("screens.unpublish") : t("screens.publishAction")}
                        </DashboardSecondaryButton>
                        <button
                          onClick={() => deleteScreen(s.id)}
                          className="inline-flex items-center justify-center w-9 h-9 border border-border text-foreground-muted hover:text-red-400 hover:border-red-500/30 transition-colors"
                          aria-label={t("delete")}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </DashboardCard>
                ))}
              </div>
            )}
          </DashboardSection>
        </>
      )}
    </div>
  );
}
