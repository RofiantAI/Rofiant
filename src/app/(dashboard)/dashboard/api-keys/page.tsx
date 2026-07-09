import { createClient } from "@/lib/supabase/server";
import { APIKeysClient } from "./api-keys-client";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { PlanToolGate } from "@/components/dashboard/plan-tool-gate";

export default async function APIKeysPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.products.apiKeys" });

  const plan: string = (user?.user_metadata?.plan ?? "free").toLowerCase();

  return (
    <PlanToolGate plan={plan} tool="apiKeys" title={t("title")} description={t("subtitle")}>
      <APIKeysClient />
    </PlanToolGate>
  );
}
