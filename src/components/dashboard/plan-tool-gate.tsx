import { Lock } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import {
  DashboardPage,
  DashboardHeader,
  DashboardUpgradeGate,
} from "@/components/dashboard/ui/page-shell";
import {
  canAccessTool,
  upgradeTargetForTool,
  type ProductTool,
} from "@/lib/service-plan-access";

export async function PlanToolGate({
  plan,
  tool,
  title,
  description,
  children,
}: {
  plan: string;
  tool: ProductTool;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  if (canAccessTool(plan, tool)) return <>{children}</>;

  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.planGate" });
  const target = upgradeTargetForTool(tool);
  const planLabel = t(`plans.${target.plan}`);

  return (
    <DashboardPage>
      <DashboardHeader title={title} description={description} />
      <DashboardUpgradeGate
        icon={Lock}
        title={t("title", { plan: planLabel })}
        description={t("description", { tool: t(`tools.${tool}`) })}
        ctaHref={`/${locale}${target.href}`}
        ctaLabel={t("cta", { plan: planLabel })}
      />
    </DashboardPage>
  );
}
