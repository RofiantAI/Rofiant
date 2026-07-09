import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { sendSecurityAlertEmail } from "@/lib/email";
import { isNotifEnabled } from "@/lib/notification-prefs";
import { logAudit } from "@/lib/audit";
import { planToolDeniedResponse } from "@/lib/plan-guard";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, key_value, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const denied = planToolDeniedResponse(
    plan,
    "apiKeys",
    "API keys require a Pro, Team, Agency, or Enterprise plan.",
  );
  if (denied) return denied;

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const raw = randomBytes(48).toString("hex");
  const key_value = `sk_${raw}`;
  const key_prefix = `sk_${raw.slice(0, 12)}`;

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, name: name.trim(), key_value, key_prefix })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id,
    action: "api_key.created",
    detail: { name: name.trim(), keyId: data.id },
    ip: req.headers.get("x-forwarded-for"),
  }).catch(() => {});

  if (user.email) {
    const admin = createAdminClient();
    isNotifEnabled(admin, user.id, "security_alerts")
      .then((enabled) => {
        if (!enabled) return;
        return sendSecurityAlertEmail({
          to: user.email!,
          event: "api_key_created",
          detail: `A new API key named "${name.trim()}" was created on your account.`,
        });
      })
      .catch((err) => console.error("[api-keys] security alert email failed:", err));
  }

  return NextResponse.json({ ...data, key_value });
}
