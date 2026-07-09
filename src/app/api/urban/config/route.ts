import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const DEFAULTS = {
  datasource_url:    "",
  datasource_auth:   "",
  scan_interval:     60,
  concurrency:       20,
  confidence:        0.25,
  infer_size:        1280,
  model_name:        "yolov8n.pt",
  crowd_threshold:   20,
  traffic_threshold: 30,
};

// Called by the Python service using its API key (Bearer token)
async function resolveUserFromApiKey(req: NextRequest): Promise<string | null> {
  const key = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!key?.startsWith("sk_")) return null;
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_value", key)
    .single();
  return data?.user_id ?? null;
}

export async function GET(req: NextRequest) {
  // Allow Python service to fetch config via API key
  const apiKeyUserId = await resolveUserFromApiKey(req);
  let userId: string;

  if (apiKeyUserId) {
    userId = apiKeyUserId;
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return new NextResponse("Unauthorized", { status: 401 });
    userId = user.id;
  }

  const supabase = createAdminClient();
  const { data } = await supabase
    .from("urban_ai_settings")
    .select("*")
    .eq("user_id", userId)
    .single();

  return NextResponse.json(data ?? { user_id: userId, ...DEFAULTS });
}

export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const body = await req.json().catch(() => ({}));
  const allowed = [
    "datasource_url", "datasource_auth", "scan_interval", "concurrency",
    "confidence", "infer_size", "model_name", "crowd_threshold", "traffic_threshold",
  ];
  const patch: Record<string, unknown> = { updated_at: new Date().toISOString() };
  for (const k of allowed) {
    if (k in body) patch[k] = body[k];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("urban_ai_settings")
    .upsert({ user_id: user.id, ...DEFAULTS, ...patch })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}
