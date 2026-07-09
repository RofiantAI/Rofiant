"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  ClipboardCheck,
  Download,
  Users,
  ShieldCheck,
  CheckCircle2,
  Calendar,
} from "lucide-react";
import {
  DashboardCard,
  DashboardSection,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardAlert,
  DashboardMetricGrid,
  DashboardMetric,
} from "@/components/dashboard/ui/page-shell";

type Member = {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  joined_at: string | null;
};

export function AccessReviewClient({
  members,
  lastReviewAt,
  lastReviewNotes,
}: {
  members: Member[];
  lastReviewAt: string | null;
  lastReviewNotes: string | null;
}) {
  const t = useTranslations("dashboard.agency.accessReview");
  const [notes, setNotes] = useState(lastReviewNotes ?? "");
  const [reviewedAt, setReviewedAt] = useState(lastReviewAt);
  const [loading, setLoading] = useState<"roster" | "audit" | "complete" | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const active = members.filter((m) => m.status === "active").length;
  const pending = members.filter((m) => m.status === "pending").length;
  const admins = members.filter((m) => m.role === "admin").length;

  async function downloadExport(type: "roster" | "audit") {
    setError("");
    setLoading(type);
    try {
      const res = await fetch(`/api/agency/access-review/export?type=${type}`);
      if (!res.ok) throw new Error(t("errors.exportFailed"));
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      const filename = match?.[1] ?? `org-${type}.csv`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.exportFailed"));
    } finally {
      setLoading(null);
    }
  }

  async function completeReview(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading("complete");
    try {
      const res = await fetch("/api/agency/access-review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("errors.completeFailed"));
      setReviewedAt(data.last_access_review_at);
      setSuccess(t("complete.success"));
    } catch (err) {
      setError(err instanceof Error ? err.message : t("errors.completeFailed"));
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="space-y-6">
      {error && <DashboardAlert variant="warning">{error}</DashboardAlert>}
      {success && <p className="text-sm text-accent-success">{success}</p>}

      <DashboardMetricGrid>
        <DashboardMetric label={t("stats.total")} value={String(members.length)} icon={Users} />
        <DashboardMetric label={t("stats.active")} value={String(active)} sub={t("stats.activeSub")} />
        <DashboardMetric label={t("stats.pending")} value={String(pending)} sub={t("stats.pendingSub")} />
        <DashboardMetric label={t("stats.admins")} value={String(admins)} icon={ShieldCheck} />
      </DashboardMetricGrid>

      <div className="grid gap-6 lg:grid-cols-2">
        <DashboardCard>
          <h3 className="text-sm font-medium text-foreground mb-1">{t("exports.title")}</h3>
          <p className="text-sm text-foreground-secondary mb-4">{t("exports.description")}</p>
          <div className="flex flex-col sm:flex-row gap-3">
            <DashboardSecondaryButton
              onClick={() => downloadExport("roster")}
              disabled={loading !== null}
            >
              <Download className="w-4 h-4" />
              {loading === "roster" ? t("exports.downloading") : t("exports.roster")}
            </DashboardSecondaryButton>
            <DashboardSecondaryButton
              onClick={() => downloadExport("audit")}
              disabled={loading !== null}
            >
              <Download className="w-4 h-4" />
              {loading === "audit" ? t("exports.downloading") : t("exports.auditLog")}
            </DashboardSecondaryButton>
          </div>
        </DashboardCard>

        <DashboardCard>
          <div className="flex items-start gap-3">
            <Calendar className="w-4 h-4 text-foreground-muted mt-0.5 shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-foreground">{t("lastReview.title")}</h3>
              <p className="text-sm text-foreground-secondary mt-1">
                {reviewedAt
                  ? t("lastReview.completed", {
                      date: new Date(reviewedAt).toLocaleDateString(undefined, {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      }),
                    })
                  : t("lastReview.never")}
              </p>
            </div>
          </div>
        </DashboardCard>
      </div>

      <DashboardSection title={t("roster.title")}>
        <p className="text-sm text-foreground-secondary -mt-1 mb-3">{t("roster.description")}</p>
        <DashboardCard padding={false}>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-5 py-3 font-medium text-foreground-muted">{t("roster.email")}</th>
                  <th className="px-5 py-3 font-medium text-foreground-muted">{t("roster.role")}</th>
                  <th className="px-5 py-3 font-medium text-foreground-muted">{t("roster.status")}</th>
                  <th className="px-5 py-3 font-medium text-foreground-muted">{t("roster.joined")}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((m) => (
                  <tr key={m.id} className="border-b border-border last:border-0">
                    <td className="px-5 py-3 text-foreground">{m.email}</td>
                    <td className="px-5 py-3 text-foreground-secondary capitalize">{m.role}</td>
                    <td className="px-5 py-3 capitalize">
                      <span className={m.status === "active" ? "text-accent-success" : "text-foreground-muted"}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-foreground-muted tabular-nums">
                      {m.joined_at
                        ? new Date(m.joined_at).toLocaleDateString()
                        : new Date(m.invited_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DashboardCard>
      </DashboardSection>

      <DashboardCard>
        <form onSubmit={completeReview} className="space-y-4">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-4 h-4 text-foreground-muted" />
            <h3 className="text-sm font-medium text-foreground">{t("complete.title")}</h3>
          </div>
          <p className="text-sm text-foreground-secondary">{t("complete.description")}</p>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("complete.notesPlaceholder")}
            rows={3}
            maxLength={2000}
            className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors resize-none"
          />
          <DashboardPrimaryButton type="submit" disabled={loading !== null}>
            <CheckCircle2 className="w-4 h-4" />
            {loading === "complete" ? t("complete.submitting") : t("complete.submit")}
          </DashboardPrimaryButton>
        </form>
      </DashboardCard>
    </div>
  );
}
