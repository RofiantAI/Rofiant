import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { role } = await req.json();
  if (!role || !["admin", "member"].includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  // Verify caller owns the agency this member belongs to
  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id, email")
    .eq("id", id)
    .single();

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("id", member.agency_id)
    .eq("owner_id", user.id)
    .single();

  if (!agency) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Prevent downgrading yourself (owner)
  if (member.email === user.email) {
    return NextResponse.json({ error: "Cannot change your own role" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("agency_members")
    .update({ role })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: member } = await supabase
    .from("agency_members")
    .select("agency_id, email")
    .eq("id", id)
    .single();

  if (!member) return NextResponse.json({ error: "Member not found" }, { status: 404 });

  const { data: agency } = await supabase
    .from("agencies")
    .select("id")
    .eq("id", member.agency_id)
    .eq("owner_id", user.id)
    .single();

  if (!agency) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (member.email === user.email) {
    return NextResponse.json({ error: "Cannot remove yourself" }, { status: 400 });
  }

  const { error } = await supabase.from("agency_members").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ deleted: true });
}
