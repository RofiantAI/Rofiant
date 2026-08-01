import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import { isSiteOwner } from "@/lib/site-owner";
import { DashboardPage, DashboardCard, ConsoleHeader } from "@/components/dashboard/ui/page-shell";

export default async function SiteScreenDashboardPage({
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

  let query = supabase.from("site_screens").select("*").eq("slug", slug);
  if (!isSiteOwner(user.email)) {
    query = query.eq("published", true);
  }

  const { data: screen } = await query.maybeSingle();
  if (!screen) notFound();

  return (
    <DashboardPage>
      <ConsoleHeader title={screen.title} />
      <DashboardCard>
        <div className="text-sm text-foreground-secondary whitespace-pre-wrap">
          {screen.content || "—"}
        </div>
      </DashboardCard>
    </DashboardPage>
  );
}
