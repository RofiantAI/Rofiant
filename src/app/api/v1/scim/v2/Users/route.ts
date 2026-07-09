import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { apiRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import { findOrCreateAuthUser } from "@/lib/agency-provision";

// SCIM 2.0 Users endpoint — supports provisioning from IdPs like Okta/Azure AD.
// Auth: Bearer token stored in agencies.scim_token (Agency and Enterprise plans only).

function scimUser(member: { id: string; email: string; role: string; status: string; user_id?: string }) {
  const active = member.status === "active";
  return {
    schemas: ["urn:ietf:params:scim:schemas:core:2.0:User"],
    id: member.id,
    userName: member.email,
    active,
    roles: [{ value: member.role, primary: true }],
    meta: { resourceType: "User" },
  };
}

async function resolveAgency(req: NextRequest) {
  const auth = req.headers.get("authorization") ?? "";
  if (!auth.startsWith("Bearer ")) return null;
  const token = auth.slice(7);

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("agencies")
    .select("id, owner_id")
    .eq("scim_token", token)
    .single();
  return data ?? null;
}

// GET /api/v1/scim/v2/Users
export async function GET(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await enforceRatelimit(apiRatelimit, ip);
  if (limited) return limited;

  const agency = await resolveAgency(req);
  if (!agency) return new NextResponse(JSON.stringify({ detail: "Unauthorized" }), { status: 401 });

  const supabase = createAdminClient();
  const { data: members } = await supabase
    .from("agency_members")
    .select("id, email, role, status, user_id")
    .eq("agency_id", agency.id)
    .order("email");

  const resources = (members ?? []).map(scimUser);
  return NextResponse.json({
    schemas: ["urn:ietf:params:scim:api:messages:2.0:ListResponse"],
    totalResults: resources.length,
    startIndex: 1,
    itemsPerPage: resources.length,
    Resources: resources,
  });
}

// POST /api/v1/scim/v2/Users — provision a new user
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for") ?? "unknown";
  const limited = await enforceRatelimit(apiRatelimit, ip);
  if (limited) return limited;

  const agency = await resolveAgency(req);
  if (!agency) return new NextResponse(JSON.stringify({ detail: "Unauthorized" }), { status: 401 });

  const body = await req.json();
  const email: string = body.userName ?? body.emails?.[0]?.value ?? "";
  if (!email) return NextResponse.json({ detail: "userName required" }, { status: 400 });

  const supabase = createAdminClient();
  const { user: authUser, error: provisionError } = await findOrCreateAuthUser(supabase, email);
  if (!authUser) {
    return NextResponse.json({ detail: provisionError ?? "Failed to provision user" }, { status: 500 });
  }

  const { data, error } = await supabase
    .from("agency_members")
    .insert({
      agency_id: agency.id,
      user_id: authUser.id,
      email: email.trim().toLowerCase(),
      role: "member",
      status: "active",
      invited_at: new Date().toISOString(),
      joined_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error?.code === "23505") return NextResponse.json({ detail: "User already exists" }, { status: 409 });
  if (error) return NextResponse.json({ detail: error.message }, { status: 500 });

  return NextResponse.json(scimUser(data), { status: 201 });
}
