import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { createClient } from "@/lib/supabase/server";
import { getUserAvatarUrl, hasCustomAvatar } from "@/lib/user-avatar";
import { getUsageAnalyticsData } from "@/lib/usage-analytics";
import { ChatSettingsShell } from "./chat-settings-shell";

export default async function Page() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const locale = await getDashboardLocale();

  if (!user) return null;

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isPro = plan !== "free";
  const displayName =
    user.user_metadata?.display_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Account";

  const { chartData, sourceBreakdown, modelRows } = await getUsageAnalyticsData(
    supabase,
    user.id,
    locale,
  );

  const { count: referralCount } = await supabase
    .from("referrals")
    .select("id", { count: "exact", head: true })
    .eq("referrer_id", user.id);

  return (
    <div className="h-full min-h-0">
      <ChatSettingsShell
        displayName={displayName}
        avatarUrl={getUserAvatarUrl(user)}
        isPro={isPro}
        plan={plan}
        chartData={chartData}
        sourceBreakdown={sourceBreakdown}
        modelRows={modelRows}
        referralCount={referralCount ?? 0}
        settingsProps={{
          email: user.email ?? "",
          userId: user.id,
          displayName: user.user_metadata?.display_name ?? "",
          bio: user.user_metadata?.bio ?? "",
          avatarUrl: getUserAvatarUrl(user),
          hasCustomAvatar: hasCustomAvatar(user),
          plan,
        }}
      />
    </div>
  );
}
