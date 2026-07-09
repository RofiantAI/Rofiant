import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { PlanToolGate } from "@/components/dashboard/plan-tool-gate";
import { DocumentIntelligenceTool } from "@/components/services/tools/document-intelligence-tool";

export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = (user?.user_metadata?.plan ?? "free").toLowerCase();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.products.documents" });

  return (
    <PlanToolGate plan={plan} tool="documents" title={t("title")} description={t("subtitle")}>
      <DocumentIntelligenceTool />
    </PlanToolGate>
  );
}
