import { createClient } from "@/lib/supabase/server";
import {
  MessageSquare,
  FileText,
  Zap,
  ArrowRight,
  Plus,
  Coins,
  Brain,
  KeyRound,
  ShieldCheck,
  Bot,
  Webhook,
  Download,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { OverviewChart } from "./overview-chart";
import {
  DashboardPage,
  DashboardHeader,
  DashboardMetricGrid,
  DashboardMetric,
  DashboardCard,
  DashboardSection,
  DashboardList,
} from "@/components/dashboard/ui/page-shell";
import { canAccessTool } from "@/lib/service-plan-access";

const FREE_DAILY_MESSAGE_LIMIT = 100;

const AUDIT_DETAIL_KEYS = ["name", "keyId", "webhookId", "url", "agentName", "task"] as const;
const AUDIT_DETAIL_SOURCE: Record<(typeof AUDIT_DETAIL_KEYS)[number], string> = {
  name: "name",
  keyId: "keyId",
  webhookId: "webhookId",
  url: "url",
  agentName: "agent_name",
  task: "task",
};

const AUDIT_ICONS: Record<string, typeof ShieldCheck> = {
  api_key: KeyRound,
  webhook: Webhook,
  data: Download,
  agent: Bot,
};

function auditActionIcon(action: string) {
  const dot = action.indexOf(".");
  const prefix = dot === -1 ? action : action.slice(0, dot);
  return AUDIT_ICONS[prefix] ?? ShieldCheck;
}

function auditActionLabel(
  action: string,
  tAudit: { has: (key: string) => boolean; (key: string): string },
) {
  const dot = action.indexOf(".");
  if (dot === -1) return action;
  const key = `actions.${action.slice(0, dot)}.${action.slice(dot + 1)}`;
  return tAudit.has(key) ? tAudit(key) : action;
}

function formatAuditDetail(
  detail: Record<string, unknown>,
  tAudit: (key: string, values?: Record<string, string | number>) => string,
) {
  const parts: string[] = [];
  for (const key of AUDIT_DETAIL_KEYS) {
    const value = detail[AUDIT_DETAIL_SOURCE[key]];
    if (typeof value === "string" && value.trim()) {
      parts.push(tAudit(`detail.${key}`, { value }));
    }
  }
  return parts.length > 0 ? parts.join(" · ") : null;
}

export default async function OverviewPage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.overview" });
  const tAudit = await getTranslations({ locale, namespace: "dashboard.auditLog" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const userId = user.id;
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();
  const todayStart = new Date(new Date().getFullYear(), new Date().getMonth(), new Date().getDate()).toISOString();

  const { data: userConvs } = await supabase
    .from("conversations")
    .select("id, created_at")
    .eq("user_id", userId);

  const convIds = (userConvs ?? []).map((c) => c.id);

  const [
    { count: convCount },
    { count: docCount },
    { count: apiCount },
    { data: recentConvs },
    { data: recentDocs },
    { data: usageEvents },
    { data: monthlyUsage },
    { data: usageEventsWithModel },
    { data: recentAuditLogs },
    { data: recentAgents },
    { count: agentCount },
    { count: apiKeyCount },
    { count: docsProcessing },
    { count: docsFailed },
    msgCounts,
  ] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("documents").select("*", { count: "exact", head: true }).eq("user_id", userId).eq("status", "indexed"),
    supabase
      .from("usage_events")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("source", "api")
      .gte("created_at", monthStart),
    supabase
      .from("conversations")
      .select("id, title, updated_at")
      .eq("user_id", userId)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("documents")
      .select("id, name, status, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("usage_events")
      .select("input_tokens, output_tokens, created_at")
      .eq("user_id", userId)
      .gte("created_at", fourteenDaysAgo),
    supabase
      .from("usage_events")
      .select("input_tokens, output_tokens")
      .eq("user_id", userId)
      .gte("created_at", monthStart),
    supabase
      .from("usage_events")
      .select("model, input_tokens, output_tokens")
      .eq("user_id", userId)
      .gte("created_at", fourteenDaysAgo),
    supabase
      .from("audit_logs")
      .select("id, action, detail, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("agents")
      .select("id, name, status, runs")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(4),
    supabase.from("agents").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("api_keys").select("*", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "processing"),
    supabase
      .from("documents")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "failed"),
    convIds.length > 0
      ? Promise.all([
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("conversation_id", convIds)
            .gte("created_at", fourteenDaysAgo),
          supabase
            .from("messages")
            .select("created_at")
            .in("conversation_id", convIds)
            .gte("created_at", fourteenDaysAgo),
          supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .in("conversation_id", convIds)
            .eq("role", "user")
            .gte("created_at", todayStart),
        ])
      : Promise.resolve([
          { count: 0 },
          { data: [] },
          { count: 0 },
        ] as const),
  ]);

  const msgCount14d = msgCounts[0].count ?? 0;
  const recentMsgs = msgCounts[1].data ?? [];
  const msgsToday = msgCounts[2].count ?? 0;

  const msgDayMap = new Map<string, number>();
  for (const m of recentMsgs) {
    const day = (m.created_at as string).slice(0, 10);
    msgDayMap.set(day, (msgDayMap.get(day) ?? 0) + 1);
  }

  const tokenDayMap = new Map<string, number>();
  for (const e of usageEvents ?? []) {
    const day = (e.created_at as string).slice(0, 10);
    tokenDayMap.set(day, (tokenDayMap.get(day) ?? 0) + (e.input_tokens ?? 0) + (e.output_tokens ?? 0));
  }

  const activityData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return {
      day: label,
      messages: msgDayMap.get(key) ?? 0,
      tokens: tokenDayMap.get(key) ?? 0,
    };
  });

  const modelUsage = new Map<string, number>();
  for (const ev of usageEventsWithModel ?? []) {
    const tokens = (ev.input_tokens ?? 0) + (ev.output_tokens ?? 0);
    modelUsage.set(ev.model, (modelUsage.get(ev.model) ?? 0) + tokens);
  }
  const topModels = Array.from(modelUsage.entries())
    .map(([model, tokens]) => ({ model, tokens }))
    .sort((a, b) => b.tokens - a.tokens)
    .slice(0, 4);

  const tokensMonth = (usageEvents ?? []).reduce(
    (sum, e) => sum + (e.input_tokens ?? 0) + (e.output_tokens ?? 0),
    0,
  );

  const tokensMonthTotal = (monthlyUsage ?? []).reduce(
    (sum, e) => sum + (e.input_tokens ?? 0) + (e.output_tokens ?? 0),
    0,
  );

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const hasDocuments = canAccessTool(plan, "documents");
  const hasAgents = canAccessTool(plan, "agents");
  const hasApiKeys = canAccessTool(plan, "apiKeys");
  const planLabel =
    plan === "enterprise"
      ? t("plan.enterprise")
      : plan === "agency"
        ? t("plan.agency")
        : plan === "pilot"
          ? t("plan.pilot")
          : plan === "team"
            ? t("plan.team")
            : plan === "pro"
              ? t("plan.pro")
              : t("plan.free");
  const isPaid = plan !== "free";
  const displayName = user.user_metadata?.full_name?.trim() || user.email?.split("@")[0] || "there";

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return t("recentConversations.justNow");
    if (mins < 60) return t("recentConversations.minutesAgo", { count: mins });
    if (hrs < 24) return t("recentConversations.hoursAgo", { count: hrs });
    return t("recentConversations.daysAgo", { count: days });
  }

  const metrics = [
    {
      label: t("stats.messages.label"),
      value: msgCount14d.toLocaleString(),
      sub: t("stats.messages.sub"),
      trend: msgsToday,
      href: "/chat",
      icon: MessageSquare,
    },
    {
      label: t("stats.conversations.label"),
      value: (convCount ?? 0).toLocaleString(),
      sub: t("stats.conversations.sub"),
      trend: null,
      href: "/chat",
      icon: MessageSquare,
    },
    ...(hasDocuments
      ? [
          {
            label: t("stats.documents.label"),
            value: (docCount ?? 0).toLocaleString(),
            sub: t("stats.documents.sub"),
            trend: null,
            href: "/dashboard/documents",
            icon: FileText,
          },
        ]
      : []),
    {
      label: hasApiKeys ? t("stats.apiRequests.label") : t("stats.tokens.label"),
      value: hasApiKeys
        ? (apiCount ?? 0).toLocaleString()
        : tokensMonth.toLocaleString(),
      sub: hasApiKeys ? t("stats.apiRequests.sub") : t("stats.tokens.sub"),
      trend: null,
      href: hasApiKeys ? "/dashboard/api-keys" : "/dashboard/usage",
      icon: hasApiKeys ? Zap : Coins,
    },
  ];

  function documentStatusLabel(status: string) {
    if (status === "indexed") return t("recentDocuments.statusIndexed");
    if (status === "failed") return t("recentDocuments.statusFailed");
    return t("recentDocuments.statusProcessing");
  }

  const dailyUsagePct = Math.min(100, Math.round((msgsToday / FREE_DAILY_MESSAGE_LIMIT) * 100));
  const activeAgents = (recentAgents ?? []).filter((a) => a.status === "active").length;

  return (
    <DashboardPage>
      <DashboardHeader
        title={t("title")}
        description={t.rich("subtitle", {
          name: displayName,
          bold: (chunks) => <span className="font-semibold text-foreground">{chunks}</span>,
        })}
        action={
          <Link
            href="/chat"
            className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors shrink-0"
          >
            <Plus className="w-4 h-4" />
            {t("newChat")}
          </Link>
        }
      />

      <DashboardMetricGrid>
        {metrics.map(({ label, value, sub, trend, href, icon: Icon }) => (
          <DashboardMetric
            key={label}
            label={label}
            value={value}
            sub={sub}
            href={href}
            icon={Icon}
            trend={trend}
            trendLabel={trend !== null && trend > 0 ? t("stats.todayDelta", { count: trend }) : undefined}
          />
        ))}
      </DashboardMetricGrid>

      {(hasDocuments && ((docsProcessing ?? 0) > 0 || (docsFailed ?? 0) > 0)) ? (
        <div className="space-y-2">
          {(docsProcessing ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-orange-500/30 bg-orange-500/10 px-4 py-3 text-sm text-orange-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t("documentAlerts.processing", { count: docsProcessing ?? 0 })}</span>
              <Link href="/dashboard/documents" className="ml-auto text-xs hover:underline shrink-0">
                {t("documentAlerts.view")}
              </Link>
            </div>
          )}
          {(docsFailed ?? 0) > 0 && (
            <div className="flex items-center gap-3 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{t("documentAlerts.failed", { count: docsFailed ?? 0 })}</span>
              <Link href="/dashboard/documents" className="ml-auto text-xs hover:underline shrink-0">
                {t("documentAlerts.view")}
              </Link>
            </div>
          )}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <OverviewChart data={activityData} />

          {topModels.length > 0 && (
            <DashboardSection title={t("modelBreakdown.title")}>
              <DashboardList>
                {topModels.map((m) => (
                  <div
                    key={m.model}
                    className="flex items-center justify-between gap-4 px-5 py-3.5"
                  >
                    <code className="text-sm font-mono text-foreground truncate">{m.model}</code>
                    <span className="text-sm text-foreground-secondary tabular-nums shrink-0">
                      {t("modelBreakdown.tokens", { count: m.tokens.toLocaleString() })}
                    </span>
                  </div>
                ))}
              </DashboardList>
              <p className="text-xs text-foreground-muted">{t("modelBreakdown.period")}</p>
            </DashboardSection>
          )}

          <DashboardCard padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">{t("recentConversations.title")}</h2>
              <Link
                href="/chat"
                className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                {t("recentConversations.viewAll")}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentConvs && recentConvs.length > 0 ? (
              <div className="divide-y divide-border">
                {recentConvs.map((c) => (
                  <Link
                    key={c.id}
                    href={`/chat/${c.id}`}
                    className="flex items-center justify-between px-5 py-3.5 hover:bg-background-tertiary transition-colors"
                  >
                    <span className="text-sm text-foreground truncate pr-4">{c.title}</span>
                    <span className="text-xs text-foreground-muted shrink-0 tabular-nums">
                      {relativeTime(c.updated_at)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-foreground-secondary">{t("recentConversations.empty")}</p>
                <Link href="/chat" className="inline-block mt-3 text-sm text-accent-primary hover:underline">
                  {t("recentConversations.startFirst")}
                </Link>
              </div>
            )}
          </DashboardCard>

          <DashboardCard padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">{t("recentActivity.title")}</h2>
              <Link
                href="/dashboard/audit-log"
                className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                {t("recentActivity.viewAll")}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentAuditLogs && recentAuditLogs.length > 0 ? (
              <div className="divide-y divide-border">
                {recentAuditLogs.map((log) => {
                  const Icon = auditActionIcon(log.action);
                  const detailText =
                    log.detail && typeof log.detail === "object"
                      ? formatAuditDetail(log.detail as Record<string, unknown>, tAudit)
                      : null;

                  return (
                    <div key={log.id} className="flex items-center gap-3 px-5 py-3.5">
                      <div className="shrink-0 rounded-full bg-background-tertiary p-2">
                        <Icon className="w-3.5 h-3.5 text-foreground-muted" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-foreground">{auditActionLabel(log.action, tAudit)}</p>
                        {detailText && (
                          <p className="text-xs text-foreground-muted truncate mt-0.5">{detailText}</p>
                        )}
                      </div>
                      <span className="text-xs text-foreground-muted shrink-0 tabular-nums">
                        {relativeTime(log.created_at)}
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-foreground-secondary">{t("recentActivity.empty")}</p>
              </div>
            )}
          </DashboardCard>
        </div>

        <div className="space-y-4">
          <DashboardCard>
            <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">{t("plan.title")}</p>
            <p className="mt-2 text-xl font-semibold text-foreground">{planLabel}</p>
            <p className="mt-1 text-sm text-foreground-secondary">
              {isPaid ? t("plan.paidDescription") : t("plan.freeDescription", { limit: 100 })}
            </p>
            {!isPaid && (
              <div className="mt-4 pt-4 border-t border-border">
                <div className="flex items-center justify-between text-xs text-foreground-muted mb-2">
                  <span>{t("dailyUsage.title")}</span>
                  <span className="tabular-nums">
                    {t("dailyUsage.used", { used: msgsToday, limit: FREE_DAILY_MESSAGE_LIMIT })}
                  </span>
                </div>
                <div className="h-1.5 bg-background-tertiary overflow-hidden">
                  <div
                    className="h-full bg-foreground transition-[width]"
                    style={{ width: `${dailyUsagePct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-foreground-muted">{t("dailyUsage.resetsDaily")}</p>
              </div>
            )}
            {isPaid && (
              <div className="mt-4 pt-4 border-t border-border space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">{t("planUsage.tokens")}</span>
                  <span className="text-foreground tabular-nums">{tokensMonthTotal.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-foreground-muted">{t("planUsage.apiRequests")}</span>
                  <span className="text-foreground tabular-nums">{(apiCount ?? 0).toLocaleString()}</span>
                </div>
              </div>
            )}
            {!isPaid ? (
              <Link
                href={`/${locale}/pricing`}
                className="mt-4 flex items-center justify-center gap-2 w-full h-9 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
              >
                <Zap className="w-4 h-4" />
                {t("plan.upgrade")}
              </Link>
            ) : (
              <Link
                href="/dashboard/usage"
                className="mt-4 flex items-center justify-center w-full h-9 text-sm border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
              >
                {t("plan.viewUsage")}
              </Link>
            )}
          </DashboardCard>

          {hasDocuments && (
          <DashboardCard padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">{t("recentDocuments.title")}</h2>
              <Link
                href="/dashboard/documents"
                className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                {t("recentDocuments.viewAll")}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {recentDocs && recentDocs.length > 0 ? (
              <div className="divide-y divide-border">
                {recentDocs.map((doc) => (
                  <Link
                    key={doc.id}
                    href="/dashboard/documents"
                    className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-background-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <FileText className="w-4 h-4 text-foreground-muted shrink-0" />
                      <span className="text-sm text-foreground truncate">{doc.name}</span>
                    </div>
                    <span className="text-xs text-foreground-muted shrink-0">
                      {documentStatusLabel(doc.status)}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="px-5 py-10 text-center">
                <p className="text-sm text-foreground-secondary">{t("recentDocuments.empty")}</p>
                <Link
                  href="/dashboard/documents"
                  className="inline-block mt-3 text-sm text-accent-primary hover:underline"
                >
                  {t("recentDocuments.uploadFirst")}
                </Link>
              </div>
            )}
          </DashboardCard>
          )}

          {hasAgents && (
          <DashboardCard padding={false}>
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="text-sm font-medium text-foreground">{t("agentsPanel.title")}</h2>
              <Link
                href="/dashboard/agents"
                className="inline-flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                {t("agentsPanel.viewAll")}
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {(agentCount ?? 0) > 0 ? (
              <>
                <div className="px-5 py-3 border-b border-border text-xs text-foreground-muted">
                  {t("agentsPanel.summary", {
                    active: activeAgents,
                    total: agentCount ?? 0,
                  })}
                </div>
                <div className="divide-y divide-border">
                  {(recentAgents ?? []).map((agent) => (
                    <Link
                      key={agent.id}
                      href="/dashboard/agents"
                      className="flex items-center justify-between gap-3 px-5 py-3.5 hover:bg-background-tertiary transition-colors"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Brain className="w-4 h-4 text-foreground-muted shrink-0" />
                        <span className="text-sm text-foreground truncate">{agent.name}</span>
                      </div>
                      <span className="text-xs text-foreground-muted shrink-0 tabular-nums">
                        {t("agentsPanel.runs", { count: agent.runs ?? 0 })}
                      </span>
                    </Link>
                  ))}
                </div>
              </>
            ) : (
              <div className="px-5 py-8 text-center">
                <p className="text-sm text-foreground-secondary">{t("agentsPanel.empty")}</p>
                <Link
                  href="/dashboard/agents"
                  className="inline-block mt-3 text-sm text-accent-primary hover:underline"
                >
                  {t("agentsPanel.createFirst")}
                </Link>
              </div>
            )}
          </DashboardCard>
          )}

          {hasApiKeys && (
            <DashboardCard>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                    {t("apiKeysPanel.title")}
                  </p>
                  <p className="mt-2 text-2xl font-semibold tabular-nums text-foreground">
                    {apiKeyCount ?? 0}
                  </p>
                  <p className="mt-1 text-xs text-foreground-muted">{t("apiKeysPanel.sub")}</p>
                </div>
                <KeyRound className="w-5 h-5 text-foreground-muted" />
              </div>
              <Link
                href="/dashboard/api-keys"
                className="mt-4 flex items-center justify-center w-full h-9 text-sm border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
              >
                {t("apiKeysPanel.manage")}
              </Link>
            </DashboardCard>
          )}
        </div>
      </div>
    </DashboardPage>
  );
}
