import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { getOwnedAgency, getUserAgencyIds } from "@/lib/agency-broadcast";
import { DashboardPage, DashboardCard } from "@/components/dashboard/ui/page-shell";

export default async function AgencyScreenPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect(`/${routing.defaultLocale}/auth/login`);

  const agencyIds = await getUserAgencyIds(supabase, user.id);
  if (agencyIds.length === 0) notFound();

  const owned = await getOwnedAgency(supabase, user.id);

  let query = supabase
    .from("agency_screens")
    .select("*")
    .in("agency_id", agencyIds)
    .eq("slug", slug);

  if (!owned) {
    query = query.eq("published", true);
  }

  const { data: screen } = await query.maybeSingle();
  if (!screen) notFound();

  return (
    <DashboardPage>
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{screen.title}</h1>
      </div>
      <DashboardCard>
        <div className="prose prose-invert max-w-none text-sm text-foreground-secondary whitespace-pre-wrap">
          {screen.content || "—"}
        </div>
      </DashboardCard>
    </DashboardPage>
  );
}
