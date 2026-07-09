import Link from "next/link";
import { Check, Lock, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
} from "@/components/dashboard/ui/page-shell";
import {
  HUB_TOOLS,
  canAccessTool,
  upgradeTargetForTool,
  TOOL_DASHBOARD_HREFS,
  normalizePlan,
  type ProductTool,
} from "@/lib/service-plan-access";

export default async function DashboardServicesHubPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = normalizePlan(user?.user_metadata?.plan);
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.servicesHub" });
  const tGate = await getTranslations({ locale, namespace: "dashboard.planGate" });
  const planLabel = tGate(`plans.${plan}`);

  return (
    <DashboardPage>
      <DashboardHeader
        title={t("title")}
        description={t("subtitle", { plan: planLabel })}
      />

      <div className="grid gap-3">
        {HUB_TOOLS.map((tool: ProductTool) => {
          const included = canAccessTool(plan, tool);
          const href = TOOL_DASHBOARD_HREFS[tool];
          const target = upgradeTargetForTool(tool);
          const upgradePlanLabel = tGate(`plans.${target.plan}`);

          return (
            <DashboardCard key={tool} padding={false}>
              <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h2 className="text-sm font-medium text-foreground">
                      {tGate(`tools.${tool}`)}
                    </h2>
                    {included ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                        <Check className="w-3 h-3" />
                        {t("included")}
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-background-tertiary px-2 py-0.5 text-[11px] font-medium text-foreground-muted">
                        <Lock className="w-3 h-3" />
                        {t("upgradeTo", { plan: upgradePlanLabel })}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground-secondary">
                    {t(`descriptions.${tool}`)}
                  </p>
                </div>

                {included && href ? (
                  <Link
                    href={href}
                    className="inline-flex shrink-0 items-center justify-center gap-2 h-9 px-4 text-sm font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
                  >
                    {t("open")}
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                ) : (
                  <Link
                    href={`/${locale}${target.href}`}
                    className="inline-flex shrink-0 items-center justify-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
                  >
                    {t("upgradeCta", { plan: upgradePlanLabel })}
                  </Link>
                )}
              </div>
            </DashboardCard>
          );
        })}
      </div>
    </DashboardPage>
  );
}
