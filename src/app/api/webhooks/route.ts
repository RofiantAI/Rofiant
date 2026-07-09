import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { logAudit } from "@/lib/audit";

const ALLOWED_EVENTS = ["document.processed", "voice.processed"];

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("webhook_subscriptions")
    .select("id, url, events, active, created_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { url, events } = await req.json();

  if (!url?.trim() || !/^https:\/\//.test(url.trim())) {
    return NextResponse.json({ error: "A valid https:// URL is required" }, { status: 400 });
  }
  const selectedEvents = Array.isArray(events) ? events.filter((e) => ALLOWED_EVENTS.includes(e)) : [];
  if (selectedEvents.length === 0) {
    return NextResponse.json({ error: "Select at least one event" }, { status: 400 });
  }

  const secret = `whsec_${randomBytes(24).toString("hex")}`;

  const { data, error } = await supabase
    .from("webhook_subscriptions")
    .insert({ user_id: user.id, url: url.trim(), events: selectedEvents, secret })
    .select("id, url, events, active, created_at, secret")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  logAudit({
    userId: user.id,
    action: "webhook.created",
    detail: { webhookId: data.id, url: data.url },
    ip: req.headers.get("x-forwarded-for"),
  }).catch(() => {});

  return NextResponse.json(data);
}
