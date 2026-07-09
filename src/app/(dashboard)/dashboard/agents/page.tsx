import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { PlanToolGate } from "@/components/dashboard/plan-tool-gate";
import { AgentsAutomationTool } from "@/components/services/tools/agents-automation-tool";

export default async function AgentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = (user?.user_metadata?.plan ?? "free").toLowerCase();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.products.agents" });

  return (
    <PlanToolGate plan={plan} tool="agents" title={t("title")} description={t("subtitle")}>
      <AgentsAutomationTool />
    </PlanToolGate>
  );
}
