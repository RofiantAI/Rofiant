"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  ShieldCheck,
  ClipboardCheck,
  KeyRound,
  FileText,
  Lock,
  ArrowRight,
} from "lucide-react";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardList,
  DashboardEmptyState,
} from "@/components/dashboard/ui/page-shell";

type AuditEntry = {
  id: string;
  action: string;
  detail: Record<string, unknown> | null;
  ip: string | null;
  created_at: string;
};

const COMPLIANCE_LINKS = [
  { href: "/legal/fedramp", key: "fedramp", icon: ShieldCheck },
  { href: "/legal/soc2", key: "soc2", icon: FileText },
  { href: "/legal/itar-policy", key: "itar", icon: Lock },
] as const;

const ADMIN_LINKS = [
  { href: "/dashboard/audit-log", key: "auditLog", icon: ShieldCheck },
  { href: "/dashboard/agency/access-review", key: "accessReview", icon: ClipboardCheck },
  { href: "/dashboard/api-keys", key: "apiKeys", icon: KeyRound },
] as const;

export function SovereignAiTool({ logs }: { logs: AuditEntry[] }) {
  const t = useTranslations("services.tools.sovereignAi");

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {COMPLIANCE_LINKS.map(({ href, key, icon: Icon }) => (
          <Link key={key} href={href} target="_blank" rel="noopener noreferrer">
            <DashboardCard className="p-4 h-full hover:border-foreground/20 transition-colors">
              <Icon className="w-5 h-5 text-foreground-muted mb-2" />
              <p className="text-sm font-medium text-foreground">{t(`compliance.${key}.title`)}</p>
              <p className="text-xs text-foreground-secondary mt-1">{t(`compliance.${key}.desc`)}</p>
            </DashboardCard>
          </Link>
        ))}
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-wider mb-4">
          {t("adminTools")}
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {ADMIN_LINKS.map(({ href, key, icon: Icon }) => (
            <Link
              key={key}
              href={href}
              className="flex items-center justify-between gap-2 px-4 py-3 border border-border bg-card hover:bg-background-secondary transition-colors text-sm"
            >
              <span className="flex items-center gap-2 text-foreground">
                <Icon className="w-4 h-4 text-foreground-muted" />
                {t(`admin.${key}`)}
              </span>
              <ArrowRight className="w-4 h-4 text-foreground-muted" />
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10">
        <div className="flex items-center justify-between gap-4 mb-4">
          <h2 className="text-sm font-medium text-foreground">{t("recentActivity")}</h2>
          <Link href="/dashboard/audit-log" className="text-xs text-foreground-secondary hover:text-foreground">
            {t("viewAll")}
          </Link>
        </div>
        {!logs.length ? (
          <DashboardEmptyState icon={ShieldCheck} title={t("empty")} />
        ) : (
          <DashboardList>
            {logs.slice(0, 10).map((log) => (
              <div key={log.id} className="px-5 py-3.5 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-foreground truncate">{log.action}</p>
                  {log.detail && typeof log.detail === "object" && "name" in log.detail && (
                    <p className="text-xs text-foreground-muted truncate mt-0.5">
                      {String(log.detail.name)}
                    </p>
                  )}
                </div>
                <span className="text-xs text-foreground-muted tabular-nums shrink-0">
                  {new Date(log.created_at).toLocaleString()}
                </span>
              </div>
            ))}
          </DashboardList>
        )}
      </div>
    </DashboardPage>
  );
}
