import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getOrgAgencyForUser, isOrgPlan, toCsv } from "@/lib/agency-org";

export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (!isOrgPlan(plan)) {
    return new Response("Access review requires Agency or Enterprise plan", { status: 403 });
  }

  const agency = await getOrgAgencyForUser(supabase, user.id);
  if (!agency) return new Response("Organization not found", { status: 404 });

  const admin = createAdminClient();
  const date = new Date().toISOString().slice(0, 10);

  const { data: members } = await admin
    .from("agency_members")
    .select("email, role, status, invited_at, joined_at")
    .eq("agency_id", agency.id)
    .order("email", { ascending: true });

  const csv = toCsv(
    ["email", "role", "status", "invited_at", "joined_at"],
    (members ?? []).map((m) => [
      m.email,
      m.role,
      m.status,
      m.invited_at,
      m.joined_at ?? "",
    ]),
  );

  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="org-member-roster-${date}.csv"`,
    },
  });
}
