import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { getDashboardLocale } from "@/i18n/dashboard-locale";
import { routing } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgAgencyForUser, isOrgPlan } from "@/lib/agency-org";
import { AccessReviewClient } from "./access-review-client";
import { DashboardPage, DashboardHeader } from "@/components/dashboard/ui/page-shell";

export default async function AccessReviewPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (!isOrgPlan(plan)) redirect("/dashboard/agency");

  const agency = await getOrgAgencyForUser(supabase, user.id);
  if (!agency) redirect("/dashboard/agency");

  const admin = createAdminClient();
  const [{ data: members }, { data: agencyMeta }] = await Promise.all([
    admin
      .from("agency_members")
      .select("id, email, role, status, invited_at, joined_at")
      .eq("agency_id", agency.id)
      .order("email", { ascending: true }),
    admin
      .from("agencies")
      .select("last_access_review_at, last_access_review_notes")
      .eq("id", agency.id)
      .single(),
  ]);

  const locale = await getDashboardLocale();
  const t = await getTranslations({ locale, namespace: "dashboard.agency.accessReview" });

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />
      <AccessReviewClient
        members={members ?? []}
        lastReviewAt={agencyMeta?.last_access_review_at ?? null}
        lastReviewNotes={agencyMeta?.last_access_review_notes ?? null}
      />
    </DashboardPage>
  );
}
