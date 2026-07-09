import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { dispatchWebhook } from "@/lib/webhooks";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("voice_records")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { name, size, storage_path } = await req.json();

  const { data, error } = await supabase
    .from("voice_records")
    .insert({ user_id: user.id, name, size, storage_path, status: "processing" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  dispatchWebhook(user.id, "voice.processed", { id: data.id, name: data.name, status: data.status }).catch(
    (err) => console.error("[voice] webhook dispatch failed:", err),
  );

  return NextResponse.json(data);
}
