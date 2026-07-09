import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

function domainFromEmail(email: string): string | null {
  const at = email.lastIndexOf("@");
  if (at <= 0) return null;
  return email.slice(at + 1).trim().toLowerCase() || null;
}

export async function GET(req: NextRequest) {
  const email = new URL(req.url).searchParams.get("email")?.trim() ?? "";
  const domain = domainFromEmail(email);
  if (!domain) {
    return NextResponse.json({ available: false });
  }

  const admin = createAdminClient();
  const { data } = await admin
    .from("agencies")
    .select("sso_domain")
    .eq("sso_domain", domain)
    .limit(1)
    .maybeSingle();

  return NextResponse.json({
    available: !!data?.sso_domain,
    domain: data?.sso_domain ?? null,
  });
}
