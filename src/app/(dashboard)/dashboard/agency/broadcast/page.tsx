import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { routing } from "@/i18n/routing";
import { getOwnedAgency } from "@/lib/agency-broadcast";
import { BroadcastClient } from "./broadcast-client";
import { DashboardPage, DashboardHeader } from "@/components/dashboard/ui/page-shell";

export default async function AgencyBroadcastPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isOrgPlan = plan === "agency" || plan === "enterprise";
  if (!isOrgPlan) redirect("/dashboard/agency");

  const agency = await getOwnedAgency(supabase, user.id);
  if (!agency) redirect("/dashboard/agency");

  const [{ data: announcements }, { data: screens }] = await Promise.all([
    supabase
      .from("agency_announcements")
      .select("*")
      .eq("agency_id", agency.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("agency_screens")
      .select("*")
      .eq("agency_id", agency.id)
      .order("updated_at", { ascending: false }),
  ]);

  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.agency.broadcast" });

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />
      <BroadcastClient
        initialAnnouncements={announcements ?? []}
        initialScreens={screens ?? []}
      />
    </DashboardPage>
  );
}
