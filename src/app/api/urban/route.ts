import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const URBAN_AI_URL = process.env.URBAN_AI_URL ?? "http://localhost:8080";

async function proxyToService(path: string, init?: RequestInit) {
  try {
    const res = await fetch(`${URBAN_AI_URL}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: "Urban AI service unavailable" }, { status: 503 });
  }
}

export async function GET(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const action       = req.nextUrl.searchParams.get("action") ?? "stats";
  const limit        = Number(req.nextUrl.searchParams.get("limit") ?? "100");
  const anomaliesOnly = req.nextUrl.searchParams.get("anomalies_only") === "true";
  const cameraId     = req.nextUrl.searchParams.get("camera_id");

  // health, cameras, logs come from the Python service
  if (action === "health")   return proxyToService("/health");
  if (action === "logs")     return proxyToService("/logs");
  if (action === "cameras") {
    const l = req.nextUrl.searchParams.get("limit") ?? "100";
    return proxyToService(`/cameras?limit=${l}`);
  }

  // detections and stats served directly from Supabase (filtered by user)
  if (action === "detections") {
    let q = supabase
      .from("camera_detections")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(Math.min(limit, 500));
    if (cameraId) q = q.eq("camera_id", cameraId);
    if (anomaliesOnly) q = q.gt("anomaly_count", 0);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ total: data.length, detections: data });
  }

  if (action === "stats") {
    const { data: rows, error } = await supabase
      .from("camera_detections")
      .select("camera_id, cars, people, trucks, motorcycles, anomaly_count")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(500);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (!rows?.length) return NextResponse.json({ message: "No data yet" });

    const total_cars        = rows.reduce((s, r) => s + (r.cars         ?? 0), 0);
    const total_people      = rows.reduce((s, r) => s + (r.people       ?? 0), 0);
    const total_trucks      = rows.reduce((s, r) => s + (r.trucks       ?? 0), 0);
    const total_motorcycles = rows.reduce((s, r) => s + (r.motorcycles  ?? 0), 0);
    const total_anomalies   = rows.reduce((s, r) => s + (r.anomaly_count ?? 0), 0);
    const cameras_seen      = new Set(rows.map((r) => r.camera_id)).size;

    return NextResponse.json({
      rows_analyzed:          rows.length,
      cameras_seen,
      total_cars,
      total_people,
      total_trucks,
      total_motorcycles,
      total_anomalies,
      avg_cars_per_camera:   +(total_cars   / Math.max(cameras_seen, 1)).toFixed(1),
      avg_people_per_camera: +(total_people / Math.max(cameras_seen, 1)).toFixed(1),
    });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (plan === "free") return NextResponse.json({ error: "Paid plan required" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const qs = new URLSearchParams();
  if (body.max_cameras) qs.set("max_cameras", String(body.max_cameras));
  if (body.camera_ids)  qs.set("camera_ids", body.camera_ids);

  return proxyToService(`/scan?${qs}`, { method: "POST" });
}
