import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { getUsageAnalyticsData } from "@/lib/usage-analytics";
import { UsageAnalytics } from "./usage-charts";
import { DashboardPage, ConsoleHeader } from "@/components/dashboard/ui/page-shell";

export default async function UsagePage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.usage" });
  const tTopbar = await getTranslations({ locale, namespace: "dashboard.topbar" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { chartData, sourceBreakdown, modelRows, previousPeriod } = await getUsageAnalyticsData(
    supabase,
    user.id,
    locale,
  );

  return (
    <DashboardPage>
      <ConsoleHeader title={t("title")} description={t("subtitle")} breadcrumb={[tTopbar("home"), t("title")]} />

      <UsageAnalytics
        chartData={chartData.slice(-30)}
        sourceBreakdown={sourceBreakdown}
        modelRows={modelRows}
        previousPeriod={previousPeriod}
      />
    </DashboardPage>
  );
}
