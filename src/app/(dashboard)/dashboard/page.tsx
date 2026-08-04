import Link from "next/link";
import { BarChart3, CreditCard, Settings, Coins, Gauge, DollarSign, CalendarDays, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { getUsageAnalyticsData, periodDelta } from "@/lib/usage-analytics";
import { formatUsd } from "@/lib/model-rates";
import {
  DashboardPage,
  ConsoleHeader,
  DashboardCard,
  DashboardMetric,
  DashboardMetricGrid,
  DashboardSection,
  ReadoutPanel,
  ReadoutList,
  ReadoutRow,
  DashboardEmptyState,
} from "@/components/dashboard/ui/page-shell";
import { ManageBillingButton } from "@/components/dashboard/manage-billing-button";
import { OverviewUsagePanel } from "./overview-chart";

const PLAN_PRICE_MONTHLY: Record<string, number> = { free: 0, pro: 15, ultra: 30 };

export default async function DashboardOverviewPage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.home" });
  const tUsage = await getTranslations({ locale, namespace: "dashboard.usage" });
  const tTopbar = await getTranslations({ locale, namespace: "dashboard.topbar" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isPaid = plan === "pro" || plan === "ultra";

  const [
    { chartData, modelRows, totalTokens, totalRequests, totalConversations, previousPeriod },
    { data: recentEvents },
  ] = await Promise.all([
    getUsageAnalyticsData(supabase, user.id, locale),
    supabase
      .from("usage_events")
      .select("model, source, input_tokens, output_tokens, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const totalCost = modelRows.reduce((sum, m) => sum + (m.cost ?? 0), 0);
  const hasCost = modelRows.some((m) => m.cost != null);

  const vsLastPeriod = t("delta.vsLastPeriod");
  const tokensDelta = periodDelta(totalTokens, previousPeriod.tokens);
  const requestsDelta = periodDelta(totalRequests, previousPeriod.requests);
  const conversationsDelta = periodDelta(totalConversations, previousPeriod.conversations);

  const trendData = chartData.map((d) => ({ day: d.day, tokens: d.tokens }));

  return (
    <DashboardPage>
      <ConsoleHeader title={t("title")} description={t("subtitle")} breadcrumb={[tTopbar("home"), t("title")]} />

      <DashboardMetricGrid>
        <DashboardMetric
          icon={Coins}
          label={tUsage("metrics.tokens.label")}
          value={totalTokens.toLocaleString()}
          sub={tUsage("metrics.tokens.period")}
          tone="purple"
          delta={tokensDelta != null ? { value: tokensDelta, label: vsLastPeriod } : null}
          href="/dashboard/usage"
        />
        <DashboardMetric
          icon={Gauge}
          label={tUsage("metrics.requests.label")}
          value={totalRequests.toLocaleString()}
          sub={tUsage("metrics.requests.period")}
          tone="blue"
          delta={requestsDelta != null ? { value: requestsDelta, label: vsLastPeriod } : null}
          href="/dashboard/usage"
        />
        <DashboardMetric
          icon={DollarSign}
          label={tUsage("metrics.cost.label")}
          value={hasCost ? formatUsd(totalCost) : "—"}
          sub={tUsage("metrics.cost.period")}
          tone="green"
          href="/dashboard/billing"
        />
        <DashboardMetric
          icon={CalendarDays}
          label={tUsage("metrics.conversations.label")}
          value={totalConversations.toLocaleString()}
          sub={tUsage("metrics.conversations.period")}
          tone="orange"
          delta={conversationsDelta != null ? { value: conversationsDelta, label: vsLastPeriod } : null}
          href="/dashboard/usage"
        />
      </DashboardMetricGrid>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <OverviewUsagePanel data={trendData} emptyLabel={tUsage("charts.noData")} />
        </div>

        <DashboardCard className="flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted mb-1.5">
            {t("plan.title")}
          </p>
          <p className="text-sm text-foreground-secondary mb-4">
            {isPaid
              ? t("plan.paidDescription", { plan: plan === "ultra" ? "Ultra" : "Pro" })
              : t("plan.freeDescription")}
          </p>
          <p className="font-mono text-2xl font-semibold text-foreground mb-5">
            ${PLAN_PRICE_MONTHLY[plan] ?? 0}
            <span className="text-sm font-normal text-foreground-muted">{t("plan.perMonth")}</span>
          </p>
          <div className="mt-auto flex flex-col gap-2">
            {isPaid ? (
              <ManageBillingButton
                label={t("plan.manageBilling")}
                loadingLabel={t("plan.openingPortal")}
                className="btn-clay-primary inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-sm font-medium"
              />
            ) : (
              <Link
                href="/pricing"
                className="btn-clay-primary inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-sm font-medium"
              >
                {t("plan.upgrade")}
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            )}
            <Link
              href="/dashboard/billing"
              className="btn-clay-secondary inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-sm font-medium"
            >
              {t("plan.viewBilling")}
            </Link>
          </div>
        </DashboardCard>
      </div>

      <DashboardSection title={t("quickLinks.title")}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <ReadoutPanel className="dashboard-action-card">
            <Link href="/dashboard/usage" className="flex items-center gap-3 group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary/10 shrink-0">
                <BarChart3 className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t("quickLinks.usage")}</p>
                <p className="text-xs text-foreground-muted truncate">{t("quickLinks.usageDesc")}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-foreground-muted ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ReadoutPanel>
          <ReadoutPanel className="dashboard-action-card">
            <Link href="/dashboard/billing" className="flex items-center gap-3 group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary/10 shrink-0">
                <CreditCard className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t("quickLinks.billing")}</p>
                <p className="text-xs text-foreground-muted truncate">{t("quickLinks.billingDesc")}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-foreground-muted ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ReadoutPanel>
          <ReadoutPanel className="dashboard-action-card">
            <Link href="/dashboard/settings" className="flex items-center gap-3 group rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-accent-primary/10 shrink-0">
                <Settings className="w-4 h-4 text-accent-primary" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">{t("quickLinks.settings")}</p>
                <p className="text-xs text-foreground-muted truncate">{t("quickLinks.settingsDesc")}</p>
              </div>
              <ArrowRight className="w-3.5 h-3.5 text-foreground-muted ml-auto shrink-0 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </ReadoutPanel>
        </div>
      </DashboardSection>

      <DashboardSection title={t("recentActivity.title")}>
        {recentEvents && recentEvents.length > 0 ? (
          <ReadoutList>
            {recentEvents.map((ev, i) => {
              const tokens = (ev.input_tokens ?? 0) + (ev.output_tokens ?? 0);
              return (
                <ReadoutRow
                  key={`${ev.created_at}-${i}`}
                  className="grid-cols-[1fr_auto_auto] sm:grid-cols-[1fr_auto_auto]"
                >
                  <span className="text-sm text-foreground truncate">{ev.model}</span>
                  <span className="text-xs text-foreground-muted uppercase tracking-wide">{ev.source}</span>
                  <span className="text-sm text-foreground-secondary tabular-nums text-right">
                    {t("recentActivity.tokens", { count: tokens.toLocaleString() })}
                  </span>
                </ReadoutRow>
              );
            })}
          </ReadoutList>
        ) : (
          <DashboardEmptyState
            icon={Gauge}
            title={t("recentActivity.emptyTitle")}
            description={t("recentActivity.emptyDescription")}
          />
        )}
      </DashboardSection>
    </DashboardPage>
  );
}
