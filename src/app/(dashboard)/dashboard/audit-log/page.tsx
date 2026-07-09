import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import {
  ShieldCheck,
  KeyRound,
  Webhook,
  Download,
  Bot,
  Landmark,
  type LucideIcon,
} from "lucide-react";
import {
  DashboardPage,
  DashboardHeader,
  DashboardList,
  DashboardEmptyState,
} from "@/components/dashboard/ui/page-shell";

const DETAIL_KEYS = ["name", "keyId", "webhookId", "url", "agentName", "task", "solutionId", "runId"] as const;

const DETAIL_SOURCE_KEYS: Record<(typeof DETAIL_KEYS)[number], string> = {
  name: "name",
  keyId: "keyId",
  webhookId: "webhookId",
  url: "url",
  agentName: "agent_name",
  task: "task",
  solutionId: "solution_id",
  runId: "run_id",
};

const ACTION_ICONS: Record<string, LucideIcon> = {
  api_key: KeyRound,
  webhook: Webhook,
  data: Download,
  agent: Bot,
  federal_workflow: Landmark,
};

function actionIcon(action: string): LucideIcon {
  const dot = action.indexOf(".");
  const prefix = dot === -1 ? action : action.slice(0, dot);
  return ACTION_ICONS[prefix] ?? ShieldCheck;
}

function actionLabel(
  action: string,
  t: { has: (key: string) => boolean; (key: string): string },
): string {
  const dot = action.indexOf(".");
  if (dot === -1) return action;
  const key = `actions.${action.slice(0, dot)}.${action.slice(dot + 1)}`;
  return t.has(key) ? t(key) : action;
}

function formatAuditDetail(
  detail: Record<string, unknown>,
  t: (key: string, values?: Record<string, string | number>) => string,
): string | null {
  const parts: string[] = [];

  for (const key of DETAIL_KEYS) {
    const value = detail[DETAIL_SOURCE_KEYS[key]];
    if (typeof value === "string" && value.trim()) {
      parts.push(t(`detail.${key}`, { value }));
    }
  }

  return parts.length > 0 ? parts.join(" · ") : null;
}

function dayKey(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function dayLabel(
  date: Date,
  locale: string,
  t: (key: string) => string,
): string {
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);

  if (dayKey(date) === dayKey(today)) return t("today");
  if (dayKey(date) === dayKey(yesterday)) return t("yesterday");

  return date.toLocaleDateString(locale, {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: date.getFullYear() === today.getFullYear() ? undefined : "numeric",
  });
}

export default async function AuditLogPage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.auditLog" });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: logs } = await supabase
    .from("audit_logs")
    .select("id, action, detail, ip, created_at")
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(200);

  const groups: { key: string; label: string; entries: typeof logs }[] = [];
  for (const log of logs ?? []) {
    const date = new Date(log.created_at);
    const key = dayKey(date);
    let group = groups.find((g) => g.key === key);
    if (!group) {
      group = { key, label: dayLabel(date, locale, t), entries: [] };
      groups.push(group);
    }
    group.entries!.push(log);
  }

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />

      {!logs?.length ? (
        <DashboardEmptyState icon={ShieldCheck} title={t("empty")} />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <div key={group.key} className="space-y-3">
              <h2 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                {group.label}
              </h2>
              <DashboardList>
                {group.entries!.map((log) => {
                  const detailText =
                    log.detail && typeof log.detail === "object"
                      ? formatAuditDetail(log.detail as Record<string, unknown>, t)
                      : null;
                  const Icon = actionIcon(log.action);

                  return (
                    <div key={log.id} className="px-5 py-3.5 flex items-center gap-4">
                      <div className="shrink-0 rounded-full bg-background-tertiary p-2">
                        <Icon className="w-3.5 h-3.5 text-foreground-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{actionLabel(log.action, t)}</p>
                        {detailText && (
                          <p className="text-xs text-foreground-muted truncate mt-0.5">{detailText}</p>
                        )}
                      </div>
                      <div className="shrink-0 flex flex-col items-end gap-0.5">
                        <span className="text-xs text-foreground-muted tabular-nums">
                          {new Date(log.created_at).toLocaleTimeString(locale, {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        {log.ip && (
                          <span className="text-[11px] font-mono text-foreground-muted/70">
                            {log.ip}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </DashboardList>
            </div>
          ))}
        </div>
      )}
    </DashboardPage>
  );
}
