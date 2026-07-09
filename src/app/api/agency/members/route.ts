import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { sendInviteEmail } from "@/lib/email";
import { findOrCreateAuthUser } from "@/lib/agency-provision";


export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("owner_id", user.id)
    .single();

  if (!agency) {
    const { data: created } = await supabase
      .from("agencies")
      .insert({ owner_id: user.id, name: "My Agency" })
      .select()
      .single();
    if (created) {
      await supabase.from("agency_members").insert({
        agency_id: created.id,
        user_id: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      agency = created;
    }
  }

  if (!agency) return NextResponse.json({ error: "Failed to get agency" }, { status: 500 });

  const { data: members, error } = await supabase
    .from("agency_members")
    .select("*")
    .eq("agency_id", agency.id)
    .order("invited_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(members ?? []);
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isTeamOrAbove = ["team", "pilot", "agency", "enterprise"].includes(plan);
  if (!isTeamOrAbove) {
    return NextResponse.json({ error: "Team plan or above required to invite members" }, { status: 403 });
  }

  const { email, role } = await req.json();
  if (!email?.trim() || !role) return NextResponse.json({ error: "Email and role required" }, { status: 400 });

  let { data: agency } = await supabase
    .from("agencies")
    .select("id, name")
    .eq("owner_id", user.id)
    .single();

  if (!agency) {
    const { data: created } = await supabase
      .from("agencies")
      .insert({ owner_id: user.id, name: "My Agency" })
      .select()
      .single();
    if (created) {
      await supabase.from("agency_members").insert({
        agency_id: created.id,
        user_id: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      agency = created;
    }
  }

  if (!agency) return NextResponse.json({ error: "Failed to get agency" }, { status: 500 });

  const normalizedEmail = email.trim().toLowerCase();
  const admin = createAdminClient();

  const { user: authUser, error: provisionError } = await findOrCreateAuthUser(admin, normalizedEmail);
  if (!authUser) {
    return NextResponse.json({ error: provisionError ?? "Failed to provision user" }, { status: 500 });
  }

  // Check not already a member
  const { data: existing } = await supabase
    .from("agency_members")
    .select("id")
    .eq("agency_id", agency.id)
    .eq("email", normalizedEmail)
    .single();

  if (existing) return NextResponse.json({ error: "Already a member" }, { status: 409 });

  // Add as pending — they must accept in their own dashboard
  const { data: member, error: memberError } = await supabase
    .from("agency_members")
    .insert({
      agency_id: agency.id,
      user_id: authUser.id,
      email: normalizedEmail,
      role,
      status: "pending",
    })
    .select()
    .single();

  if (memberError) return NextResponse.json({ error: memberError.message }, { status: 500 });

  // Send notification email (best-effort)
  sendInviteEmail({
    to: normalizedEmail,
    agencyName: agency.name,
    invitedByEmail: user.email!,
    role,
  }).catch((err) => console.error("[agency/invite] email send failed:", err));

  return NextResponse.json(member, { status: 201 });
}
