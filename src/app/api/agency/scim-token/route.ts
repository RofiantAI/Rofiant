import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { isOrgPlan } from "@/lib/agency-org";

export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (!isOrgPlan(plan)) {
    return NextResponse.json({ error: "SCIM requires the Ultra plan" }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: agency } = await admin
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .single();
  if (!agency) return NextResponse.json({ error: "Agency not found" }, { status: 404 });

  const token = `scim_${randomBytes(40).toString("hex")}`;
  await admin.from("agencies").update({ scim_token: token }).eq("id", agency.id);
  return NextResponse.json({ token });
}
