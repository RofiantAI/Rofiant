import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";
import { getUserAvatarUrl, hasCustomAvatar } from "@/lib/user-avatar";
import { DashboardPage, DashboardHeader } from "@/components/dashboard/ui/page-shell";

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.settings" });

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />
      <div className="max-w-4xl">
        <SettingsClient
          email={user?.email ?? ""}
          userId={user?.id ?? ""}
          displayName={user?.user_metadata?.display_name ?? ""}
          bio={user?.user_metadata?.bio ?? ""}
          avatarUrl={user ? getUserAvatarUrl(user) : null}
          hasCustomAvatar={user ? hasCustomAvatar(user) : false}
        />
      </div>
    </DashboardPage>
  );
}
