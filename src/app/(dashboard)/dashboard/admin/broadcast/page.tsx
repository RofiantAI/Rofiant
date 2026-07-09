import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { routing } from "@/i18n/routing";
import { isSiteOwner } from "@/lib/site-owner";
import { SiteBroadcastClient } from "./site-broadcast-client";
import { DashboardPage, DashboardHeader } from "@/components/dashboard/ui/page-shell";

export default async function SiteAdminBroadcastPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);
  if (!isSiteOwner(user.email)) redirect("/dashboard");

  const admin = createAdminClient();
  const [{ data: announcements }, { data: screens }] = await Promise.all([
    admin.from("site_announcements").select("*").order("created_at", { ascending: false }),
    admin.from("site_screens").select("*").order("updated_at", { ascending: false }),
  ]);

  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.siteAdmin.broadcast" });

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />
      <SiteBroadcastClient
        initialAnnouncements={announcements ?? []}
        initialScreens={screens ?? []}
        locale={locale}
      />
    </DashboardPage>
  );
}
