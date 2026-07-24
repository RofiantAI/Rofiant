import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";
import type { Tab } from "./settings-tab-sidebar";
import { getUserAvatarUrl, hasCustomAvatar } from "@/lib/user-avatar";
import { DashboardPage, DashboardHeader } from "@/components/dashboard/ui/page-shell";

const VALID_TABS: Tab[] = ["account", "security", "api", "notifications", "preferences", "appearance", "danger"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.settings" });
  const { tab } = await searchParams;
  const initialTab = VALID_TABS.find((v) => v === tab);

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
          plan={(user?.user_metadata?.plan ?? "free").toLowerCase()}
          initialTab={initialTab}
        />
      </div>
    </DashboardPage>
  );
}
