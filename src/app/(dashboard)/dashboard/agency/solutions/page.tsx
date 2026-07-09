import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { PlanToolGate } from "@/components/dashboard/plan-tool-gate";
import { FederalSolutionsClient } from "./federal-solutions-client";

export default async function FederalSolutionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = (user?.user_metadata?.plan ?? "free").toLowerCase();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.agency.solutions" });

  return (
    <PlanToolGate
      plan={plan}
      tool="workflows"
      title={t("title")}
      description={t("subtitle")}
    >
      <FederalSolutionsClient />
    </PlanToolGate>
  );
}
