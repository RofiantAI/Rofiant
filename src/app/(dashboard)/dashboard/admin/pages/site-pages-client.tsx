"use client";

import { useState } from "react";
import { Plus, Trash2, Eye, EyeOff, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  DashboardCard,
  DashboardSection,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardAlert,
  ReadoutList,
} from "@/components/dashboard/ui/page-shell";

const fieldClass =
  "bg-card border border-border rounded-lg text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-border-light";

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

export function SitePagesClient({
  initialScreens,
  locale,
}: {
  initialScreens: Screen[];
  locale: string;
}) {
  const t = useTranslations("dashboard.siteAdmin.pages");
  const [screens, setScreens] = useState(initialScreens);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [screenTitle, setScreenTitle] = useState("");
  const [screenSlug, setScreenSlug] = useState("");
  const [screenContent, setScreenContent] = useState("");
  const [screenNavLabel, setScreenNavLabel] = useState("");

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
      {error && <DashboardAlert variant="warning">{error}</DashboardAlert>}

      <DashboardCard>
        <form onSubmit={createScreen} className="space-y-4">
          <h3 className="text-sm font-medium text-foreground">{t("screens.createTitle")}</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              value={screenTitle}
              onChange={(e) => setScreenTitle(e.target.value)}
              placeholder={t("screens.titlePlaceholder")}
              className={`h-9 px-3 ${fieldClass}`}
              required
            />
            <input
              value={screenSlug}
              onChange={(e) => setScreenSlug(e.target.value)}
              placeholder={t("screens.slugPlaceholder")}
              className={`h-9 px-3 ${fieldClass}`}
            />
          </div>
          <input
            value={screenNavLabel}
            onChange={(e) => setScreenNavLabel(e.target.value)}
            placeholder={t("screens.navLabelPlaceholder")}
            className={`w-full h-9 px-3 ${fieldClass}`}
          />
          <textarea
            value={screenContent}
            onChange={(e) => setScreenContent(e.target.value)}
            placeholder={t("screens.contentPlaceholder")}
            rows={8}
            className={`w-full px-3 py-2 resize-y font-mono ${fieldClass}`}
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
          <ReadoutList>
            {screens.map((s) => (
              <div key={s.id} className="flex items-start justify-between gap-4 px-5 py-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium text-foreground">{s.title}</p>
                    <code className="font-mono text-xs text-foreground-muted bg-background-tertiary px-1.5 py-0.5 rounded">
                      /{locale}/pages/{s.slug}
                    </code>
                    {!s.published && (
                      <span className="font-mono text-[10px] uppercase tracking-wide text-foreground-muted">
                        {t("draft")}
                      </span>
                    )}
                    <span className="font-mono text-[11px] text-foreground-muted">
                      {new Date(s.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-foreground-muted mt-1">
                    {t("screens.navLabel")}: {s.nav_label ?? s.title}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  <Link
                    href={`/${locale}/pages/${s.slug}`}
                    target="_blank"
                    className="btn-clay-secondary inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm"
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
                    className="inline-flex items-center justify-center w-9 h-9 rounded-xl border border-border text-foreground-muted shadow-clay-sm hover:text-accent-error hover:border-accent-error/30 active:shadow-clay-inset transition-[color,border-color,box-shadow]"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </ReadoutList>
        )}
      </DashboardSection>
    </div>
  );
}
