import Link from "next/link";
import { Coins, DollarSign, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { getUsageAnalyticsData } from "@/lib/usage-analytics";
import { formatUsd } from "@/lib/model-rates";
import {
  DashboardPage,
  ConsoleHeader,
  DashboardCard,
  DashboardMetric,
  DashboardMetricGrid,
} from "@/components/dashboard/ui/page-shell";
import { ManageBillingButton } from "@/components/dashboard/manage-billing-button";
import { BillingPlanTiers } from "./billing-plan-tiers";

const PLAN_PRICE_MONTHLY: Record<string, number> = { free: 0, pro: 15, ultra: 30 };

export default async function BillingPage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.billing" });
  const tUsage = await getTranslations({ locale, namespace: "dashboard.usage" });
  const tTopbar = await getTranslations({ locale, namespace: "dashboard.topbar" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isPaid = plan === "pro" || plan === "ultra";
  const price = PLAN_PRICE_MONTHLY[plan] ?? 0;

  const { modelRows, totalTokens } = await getUsageAnalyticsData(supabase, user.id, locale);
  const totalCost = modelRows.reduce((sum, m) => sum + (m.cost ?? 0), 0);
  const hasCost = modelRows.some((m) => m.cost != null);

  return (
    <DashboardPage>
      <ConsoleHeader title={t("title")} description={t("subtitle")} breadcrumb={[tTopbar("home"), t("title")]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <DashboardCard className="lg:col-span-1 flex flex-col">
          <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted mb-2">
            {t("currentPlan.title")}
          </p>
          <p className="font-mono text-3xl font-semibold text-foreground mb-1">
            {price === 0 ? (
              t("currentPlan.free")
            ) : (
              <>
                ${price}
                <span className="text-sm font-normal text-foreground-muted">{t("plans.perMonth")}</span>
              </>
            )}
          </p>
          <div className="mt-auto pt-4">
            {isPaid ? (
              <ManageBillingButton
                label={t("currentPlan.manageBilling")}
                loadingLabel={t("currentPlan.openingPortal")}
                className="btn-clay-primary inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-sm font-medium w-full"
              />
            ) : (
              <p className="text-xs text-foreground-muted">{t("currentPlan.noBillingAccount")}</p>
            )}
          </div>
        </DashboardCard>

        <div className="lg:col-span-2">
          <DashboardMetricGrid>
            <DashboardMetric
              icon={Coins}
              label={tUsage("metrics.tokens.label")}
              value={totalTokens.toLocaleString()}
              sub={tUsage("metrics.tokens.period")}
              tone="purple"
            />
            <DashboardMetric
              icon={DollarSign}
              label={tUsage("metrics.cost.label")}
              value={hasCost ? formatUsd(totalCost) : "—"}
              sub={tUsage("metrics.cost.period")}
              tone="green"
            />
          </DashboardMetricGrid>
          <Link
            href="/dashboard/usage"
            className="mt-3 inline-flex items-center gap-1.5 rounded text-xs font-medium text-accent-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
          >
            {t("usageThisCycle.viewFullUsage")}
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      <BillingPlanTiers plan={plan} isPaid={isPaid} />
    </DashboardPage>
  );
}
