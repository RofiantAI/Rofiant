import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isOrgPlan } from "@/lib/agency-org";

async function getOrCreateAgency(supabase: Awaited<ReturnType<typeof createClient>>, userId: string, email: string) {
  const { data: existing } = await supabase
    .from("agencies")
    .select("*")
    .eq("owner_id", userId)
    .single();

  if (existing) return existing;

  const { data: agency, error } = await supabase
    .from("agencies")
    .insert({ owner_id: userId, name: "My Agency" })
    .select()
    .single();

  if (error || !agency) return null;

  // Auto-add owner as active admin member
  await supabase.from("agency_members").insert({
    agency_id: agency.id,
    user_id: userId,
    email,
    role: "admin",
    status: "active",
    joined_at: new Date().toISOString(),
  });

  return agency;
}

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  if (plan === "free") return NextResponse.json({ error: "Paid plan required" }, { status: 403 });

  const agency = await getOrCreateAgency(supabase, user.id, user.email!);
  if (!agency) return NextResponse.json({ error: "Failed to get agency" }, { status: 500 });

  const { data: members } = await supabase
    .from("agency_members")
    .select("id, email, role, status, invited_at, joined_at")
    .eq("agency_id", agency.id);

  return NextResponse.json({ agency, members: members ?? [] });
}

const ALLOWED_PATCH_FIELDS = [
  "name",
  "description",
  "website",
  "default_member_role",
  "members_can_invite",
  "require_2fa",
  "allowed_domains",
  "notify_member_joined",
  "notify_member_left",
  "sso_domain",
] as const;

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  const update: Record<string, unknown> = {};
  for (const field of ALLOWED_PATCH_FIELDS) {
    if (field in body) update[field] = body[field];
  }

  if ("name" in update) {
    if (!update.name || !(update.name as string).trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    update.name = (update.name as string).trim();
  }

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if ("sso_domain" in update) {
    if (!isOrgPlan(plan)) {
      return NextResponse.json({ error: "SSO domain requires Agency or Enterprise plan" }, { status: 403 });
    }
    const raw = (update.sso_domain as string | null)?.trim().toLowerCase() ?? "";
    if (raw && !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(raw)) {
      return NextResponse.json({ error: "Invalid SSO domain" }, { status: 400 });
    }
    update.sso_domain = raw || null;
  }

  if (Object.keys(update).length === 0) {
    return NextResponse.json({ error: "No valid fields provided" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agencies")
    .update(update)
    .eq("owner_id", user.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
