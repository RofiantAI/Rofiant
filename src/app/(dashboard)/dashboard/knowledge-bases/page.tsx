"use client";

import { BookOpen, Plus, Trash2, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardList,
  DashboardEmptyState,
  DashboardAlert,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows } from "@/components/ui/skeleton";

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
  const t = useTranslations("dashboard.knowledgeBases");
  const [kbs, setKbs] = useState<KB[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [error, setError] = useState("");
  const [planError, setPlanError] = useState("");
  const [plan, setPlan] = useState("free");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    fetch("/api/knowledge-bases")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setKbs(d); })
      .finally(() => setLoading(false));
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((s) => setPlan((s?.user?.user_metadata?.plan ?? "free").toLowerCase()))
      .catch(() => {});
  }, []);

  async function create() {
    if (!name.trim()) return;
    setError("");
    setPlanError("");
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
    setName("");
    setDesc("");
    setShowForm(false);
  }

  async function remove(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    await fetch(`/api/knowledge-bases/${id}`, { method: "DELETE" });
    setKbs((prev) => prev.filter((k) => k.id !== id));
  }

  const limit = PLAN_LIMITS[plan];
  const atLimit = limit !== null && kbs.length >= limit;

  return (
    <DashboardPage>
      <DashboardHeader
        title={t("title")}
        description={
          <>
            {t("subtitle")}
            {limit !== null && (
              <span className="ml-1 text-foreground-muted">{t("usedCount", { used: kbs.length, limit })}</span>
            )}
          </>
        }
        action={
          <DashboardPrimaryButton
            onClick={() => {
              if (atLimit) {
                setPlanError(t("planLimitError", { limit: limit ?? 0, plural: limit === 1 ? "" : "s" }));
                return;
              }
              setShowForm(true);
              setPlanError("");
            }}
          >
            <Plus className="w-4 h-4" />
            {t("newKnowledgeBase")}
          </DashboardPrimaryButton>
        }
      />

      {planError && (
        <DashboardAlert variant="warning">
          {planError}{" "}
          <a href="/pricing" className="underline hover:no-underline">{t("viewPlans")}</a>
        </DashboardAlert>
      )}

      {showForm && (
        <DashboardCard>
          <h2 className="text-sm font-medium text-foreground mb-4">{t("createForm.heading")}</h2>
          <div className="space-y-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && create()}
              placeholder={t("createForm.namePlaceholder")}
              className="w-full h-9 px-3 rounded-md text-sm bg-background-secondary border border-border text-foreground focus:outline-none focus:border-accent-primary"
            />
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder={t("createForm.descriptionPlaceholder")}
              className="w-full h-9 px-3 rounded-md text-sm bg-background-secondary border border-border text-foreground focus:outline-none focus:border-accent-primary"
            />
            {error && <p className="text-xs text-red-400">{error}</p>}
            <div className="flex gap-2">
              <DashboardPrimaryButton onClick={create}>{t("createForm.create")}</DashboardPrimaryButton>
              <DashboardSecondaryButton onClick={() => { setShowForm(false); setError(""); }}>
                {t("createForm.cancel")}
              </DashboardSecondaryButton>
            </div>
          </div>
        </DashboardCard>
      )}

      {loading ? (
        <DashboardList>
          <SkeletonListRows rows={4} />
        </DashboardList>
      ) : kbs.length === 0 ? (
        <DashboardEmptyState
          icon={BookOpen}
          title={t("empty.heading")}
          description={t("empty.description")}
          action={
            limit === 0 ? (
              <a href="/pricing" className="text-sm text-accent-primary hover:underline">{t("empty.upgradeCta")}</a>
            ) : (
              <button onClick={() => setShowForm(true)} className="text-sm text-accent-primary hover:underline">
                {t("empty.createCta")}
              </button>
            )
          }
        />
      ) : (
        <DashboardList>
          {kbs.map((kb) => {
            const docCount = kb.knowledge_base_documents?.[0]?.count ?? 0;
            return (
              <div key={kb.id} className="flex items-center gap-4 px-5 py-3.5 group">
                <BookOpen className="w-4 h-4 text-foreground-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground">{kb.name}</div>
                  {kb.description && (
                    <div className="text-xs text-foreground-muted truncate">{kb.description}</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-xs text-foreground-muted shrink-0">
                  <FileText className="w-3 h-3" />
                  {t("list.docCount", { count: docCount, plural: docCount !== 1 ? "s" : "" })}
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={() => remove(kb.id)}
                    className="h-7 w-7 flex items-center justify-center rounded text-foreground-muted hover:text-red-400 hover:bg-red-400/10"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <Link
                    href={`/dashboard/knowledge-bases/${kb.id}`}
                    className="h-7 px-2.5 flex items-center gap-1 text-xs rounded text-foreground-secondary hover:text-foreground hover:bg-background-tertiary"
                  >
                    {t("list.manage")} <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </DashboardList>
      )}
    </DashboardPage>
  );
}
