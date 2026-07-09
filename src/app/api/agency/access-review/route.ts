import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logAudit } from "@/lib/audit";
import { getOrgAgencyForUser, isOrgPlan } from "@/lib/agency-org";

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (!isOrgPlan(plan)) {
    return NextResponse.json({ error: "Access review requires Agency or Enterprise plan" }, { status: 403 });
  }

  const agency = await getOrgAgencyForUser(supabase, user.id);
  if (!agency) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

  const body = await req.json().catch(() => ({}));
  const notes = typeof body.notes === "string" ? body.notes.trim().slice(0, 2000) : "";

  const admin = createAdminClient();
  const reviewedAt = new Date().toISOString();
  const { data, error } = await admin
    .from("agencies")
    .update({
      last_access_review_at: reviewedAt,
      last_access_review_by: user.id,
      last_access_review_notes: notes || null,
    })
    .eq("id", agency.id)
    .select("id, last_access_review_at, last_access_review_notes")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const ip = req.headers.get("x-forwarded-for");
  await logAudit({
    userId: user.id,
    agencyId: agency.id,
    action: "access_review.completed",
    detail: { notes: notes || null },
    ip,
  });

  return NextResponse.json(data);
}
