import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("api_keys")
    .select("id, name, key_prefix, created_at, last_used_at")
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
  const isPaid = plan === "pro" || plan === "team";
  if (!isPaid) return new Response("API access requires a paid plan", { status: 403 });

  const { name } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });

  const raw = randomBytes(48).toString("hex");
  const key_value = `rofiant_sk_${raw}`;
  const key_prefix = `rofiant_sk_${raw.slice(0, 12)}`;

  const { data, error } = await supabase
    .from("api_keys")
    .insert({ user_id: user.id, name: name.trim(), key_value, key_prefix })
    .select("id, name, key_prefix, created_at")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ...data, key_value });
}
