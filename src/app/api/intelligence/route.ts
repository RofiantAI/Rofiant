import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Python program POSTs here with API key auth
// POST /api/intelligence
// Headers: x-api-key: <INTELLIGENCE_INGEST_KEY>
// Body: single event or array of events

export async function POST(req: NextRequest) {
  const apiKey = req.headers.get("x-api-key");
  if (!apiKey || apiKey !== process.env.INTELLIGENCE_INGEST_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const events = Array.isArray(body) ? body : [body];

  const rows = events.map((e: Record<string, unknown>) => ({
    agency_id: e.agency_id,
    source: e.source ?? "python_program",
    source_id: e.source_id ?? null,
    event_type: e.event_type ?? "observation",
    severity: e.severity ?? "low",
    location_label: e.location_label ?? null,
    lat: e.lat ?? null,
    lng: e.lng ?? null,
    confidence: e.confidence ?? null,
    summary: e.summary ?? "",
    raw_data: e.raw_data ?? null,
    image_url: e.image_url ?? null,
  }));

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("intelligence_events")
    .insert(rows)
    .select("id, created_at");

  if (error) {
    console.error("[intelligence ingest]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ inserted: data?.length ?? 0, ids: data?.map((r) => r.id) });
}
