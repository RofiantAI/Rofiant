import { createAdminClient } from "@/lib/supabase/admin";
import { NextRequest, NextResponse } from "next/server";

// HEAD used by setup wizard to verify key+URL
export async function HEAD(req: NextRequest) {
  const key = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!key) return new NextResponse(null, { status: 401 });
  const supabase = createAdminClient();
  const { data } = await supabase
    .from("api_keys")
    .select("user_id")
    .eq("key_value", key)
    .single();
  return new NextResponse(null, { status: data ? 204 : 401 });
}

export async function POST(req: NextRequest) {
  const key = req.headers.get("authorization")?.replace("Bearer ", "").trim();
  if (!key) return new NextResponse("Unauthorized", { status: 401 });

  const supabase = createAdminClient();

  // Resolve API key → user_id
  const { data: keyRow } = await supabase
    .from("api_keys")
    .select("id, user_id")
    .eq("key_value", key)
    .single();

  if (!keyRow) return new NextResponse("Invalid API key", { status: 401 });
  const userId = keyRow.user_id as string;

  // Update last_used_at
  await supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", keyRow.id);

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });

  const {
    camera_id, main_road, cross_street, lat, lon,
    cars = 0, people = 0, trucks = 0, bicycles = 0, buses = 0, motorcycles = 0,
    total_vehicles = 0, total_objects = 0,
    anomaly_count = 0, anomaly_types = [],
    image_b64,
  } = body;

  if (!camera_id) return NextResponse.json({ error: "camera_id required" }, { status: 400 });

  // Upload annotated image to Supabase Storage
  let storedImageUrl: string | null = null;
  if (image_b64) {
    try {
      const imageBuffer = Buffer.from(image_b64, "base64");
      const ts          = Date.now();
      const path        = `${userId}/${camera_id}/${ts}.jpg`;

      // Ensure bucket exists (ignore error if already exists)
      await supabase.storage.createBucket("urban-images", { public: true }).catch(() => {});

      const { error: uploadErr } = await supabase.storage
        .from("urban-images")
        .upload(path, imageBuffer, { contentType: "image/jpeg", upsert: false });

      if (!uploadErr) {
        const { data: { publicUrl } } = supabase.storage
          .from("urban-images")
          .getPublicUrl(path);
        storedImageUrl = publicUrl;
      }
    } catch (e) {
      // Image upload failure is non-fatal — still store detection record
      console.error("Image upload error:", e);
    }
  }

  // Insert detection record
  const { data: inserted, error: insertErr } = await supabase
    .from("camera_detections")
    .insert({
      user_id: userId,
      camera_id,
      main_road:    main_road   ?? "",
      cross_street: cross_street ?? "",
      lat:          lat   ?? null,
      lon:          lon   ?? null,
      cars, people, trucks, bicycles, buses, motorcycles,
      total_vehicles, total_objects,
      anomaly_count,
      anomaly_types: anomaly_types ?? [],
      image_url: storedImageUrl ?? null,
    })
    .select("id")
    .single();

  if (insertErr) {
    console.error("Detection insert error:", insertErr);
    return NextResponse.json({ error: insertErr.message }, { status: 500 });
  }

  return NextResponse.json({ id: inserted?.id, image_url: storedImageUrl });
}
