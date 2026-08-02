import { Users } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { getReferrals } from "@/lib/referrals";
import {
  DashboardPage,
  ConsoleHeader,
  DashboardMetric,
  DashboardMetricGrid,
  DashboardEmptyState,
  ReadoutList,
  ReadoutRow,
} from "@/components/dashboard/ui/page-shell";
import { ReferralLinkCard } from "./referral-link-card";

export default async function ReferralsPage() {
  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.referrals" });
  const tTopbar = await getTranslations({ locale, namespace: "dashboard.topbar" });
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const referrals = await getReferrals(supabase, user.id);
  const referralLink = `https://www.rofiant.ca/${locale}/auth/signup?ref=${user.id}`;

  return (
    <DashboardPage>
      <ConsoleHeader title={t("title")} description={t("subtitle")} breadcrumb={[tTopbar("home"), t("title")]} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <ReferralLinkCard
          link={referralLink}
          label={t("shareCard.title")}
          description={t("shareCard.description")}
          copyLabel={t("shareCard.copy")}
          copiedLabel={t("shareCard.copied")}
        />
        <div className="lg:col-span-2">
          <DashboardMetricGrid>
            <DashboardMetric icon={Users} label={t("metrics.total.label")} value={String(referrals.length)} tone="purple" />
          </DashboardMetricGrid>
        </div>
      </div>

      {referrals.length === 0 ? (
        <DashboardEmptyState
          icon={Users}
          title={t("empty.title")}
          description={t("empty.description")}
        />
      ) : (
        <ReadoutList>
          {referrals.map((r) => (
            <ReadoutRow key={r.id} className="grid-cols-[1fr_auto]">
              <span className="truncate text-foreground">{r.email ?? t("list.unknownUser")}</span>
              <span className="text-foreground-muted text-xs">
                {new Date(r.createdAt).toLocaleDateString(locale)}
              </span>
            </ReadoutRow>
          ))}
        </ReadoutList>
      )}
    </DashboardPage>
  );
}
