import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

async function resolveAgency(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);
  const supabase = createAdminClient();
  const { data } = await supabase.from("agencies").select("id").eq("scim_token", token).single();
  return data ?? null;
}

// PATCH /api/v1/scim/v2/Users/[id] — update (e.g. deactivate)
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agency = await resolveAgency(req);
  if (!agency) return new NextResponse(JSON.stringify({ detail: "Unauthorized" }), { status: 401 });

  const body = await req.json();
  const supabase = createAdminClient();

  const patch: Record<string, unknown> = {};
  if (typeof body.active === "boolean") patch.status = body.active ? "active" : "suspended";
  if (body.roles?.[0]?.value) patch.role = body.roles[0].value;

  const { data, error } = await supabase
    .from("agency_members")
    .update(patch)
    .eq("id", id)
    .eq("agency_id", agency.id)
    .select()
    .single();

  if (error || !data) return NextResponse.json({ detail: "Not found" }, { status: 404 });
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: data.id,
    userName: data.email,
    active: data.status === "active",
    meta: { resourceType: "User" },
  });
}

// DELETE /api/v1/scim/v2/Users/[id] — deprovision
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const agency = await resolveAgency(req);
  if (!agency) return new NextResponse(JSON.stringify({ detail: "Unauthorized" }), { status: 401 });

  const supabase = createAdminClient();
  await supabase.from("agency_members").delete().eq("id", id).eq("agency_id", agency.id);
  return new NextResponse(null, { status: 204 });
}
