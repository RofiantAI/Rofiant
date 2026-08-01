import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { createClient } from "@/lib/supabase/server";
import { SettingsClient } from "./settings-client";
import type { Tab } from "./settings-tab-sidebar";
import { getUserAvatarUrl, hasCustomAvatar } from "@/lib/user-avatar";
import { DashboardPage, ConsoleHeader } from "@/components/dashboard/ui/page-shell";

const VALID_TABS: Tab[] = ["account", "security", "notifications", "preferences", "appearance", "danger"];

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.settings" });
  const tTopbar = await getTranslations({ locale, namespace: "dashboard.topbar" });
  const { tab } = await searchParams;
  const initialTab = VALID_TABS.find((v) => v === tab);
  const plan = (user?.user_metadata?.plan ?? "free").toLowerCase();

  return (
    <DashboardPage>
      <ConsoleHeader title={t("title")} description={t("subtitle")} breadcrumb={[tTopbar("home"), t("title")]} />
      <div className="max-w-4xl">
        <SettingsClient
          email={user?.email ?? ""}
          userId={user?.id ?? ""}
          displayName={user?.user_metadata?.display_name ?? ""}
          bio={user?.user_metadata?.bio ?? ""}
          avatarUrl={user ? getUserAvatarUrl(user) : null}
          hasCustomAvatar={user ? hasCustomAvatar(user) : false}
          plan={plan}
          initialTab={initialTab}
        />
      </div>
    </DashboardPage>
  );
}
