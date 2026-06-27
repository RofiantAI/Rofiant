import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { IntelligenceClient } from "./intelligence-client";

export const dynamic = "force-dynamic";

export default async function IntelligencePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isPaid = plan === "pro" || plan === "team";
  if (!isPaid) redirect("/dashboard/agency");

  const admin = createAdminClient();

  const { data: agency } = await admin
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  // Also allow members to view via their agency
  const agencyId: string | null = agency?.id ?? (await (async () => {
    const { data } = await admin
      .from("agency_members")
      .select("agency_id")
      .eq("user_id", user.id)
      .eq("status", "active")
      .limit(1)
      .single();
    return data?.agency_id ?? null;
  })());

  if (!agencyId) redirect("/dashboard/agency");

  const { data: events } = await admin
    .from("intelligence_events")
    .select("id, source, source_id, event_type, severity, location_label, lat, lng, confidence, summary, image_url, resolved_at, created_at")
    .eq("agency_id", agencyId)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <IntelligenceClient
      agencyId={agencyId}
      initial={events ?? []}
    />
  );
}
