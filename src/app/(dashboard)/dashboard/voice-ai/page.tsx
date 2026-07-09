import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { PlanToolGate } from "@/components/dashboard/plan-tool-gate";
import { VoiceAiTool } from "@/components/services/tools/voice-ai-tool";

export default async function VoiceAiPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const plan = (user?.user_metadata?.plan ?? "free").toLowerCase();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.products.voiceAi" });

  return (
    <PlanToolGate plan={plan} tool="voice" title={t("title")} description={t("subtitle")}>
      <VoiceAiTool />
    </PlanToolGate>
  );
}
