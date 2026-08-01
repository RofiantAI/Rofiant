import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { routing } from "@/i18n/routing";
import { isSiteOwner } from "@/lib/site-owner";
import { SitePagesClient } from "./site-pages-client";
import { DashboardPage, ConsoleHeader } from "@/components/dashboard/ui/page-shell";

export default async function SiteAdminPagesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);
  if (!isSiteOwner(user.email)) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: screens } = await admin
    .from("site_screens")
    .select("*")
    .order("updated_at", { ascending: false });

  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.siteAdmin.pages" });
  const tTopbar = await getTranslations({ locale, namespace: "dashboard.topbar" });

  return (
    <DashboardPage>
      <ConsoleHeader title={t("title")} description={t("subtitle")} breadcrumb={[tTopbar("home"), t("title")]} />
      <SitePagesClient initialScreens={screens ?? []} locale={locale} />
    </DashboardPage>
  );
}
