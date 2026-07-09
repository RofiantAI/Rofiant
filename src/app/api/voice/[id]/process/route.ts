import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { transcribeAudio, summarizeTranscript } from "@/lib/voice-processing";
import { dispatchWebhook } from "@/lib/webhooks";
import { planToolDeniedResponse } from "@/lib/plan-guard";

export async function POST(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const denied = planToolDeniedResponse(
    plan,
    "voice",
    "Voice transcription requires a Pro, Team, Agency, or Enterprise plan.",
  );
  if (denied) return denied;

  const { id } = await params;

  const { data: record } = await supabase
    .from("voice_records")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!record) return NextResponse.json({ error: "Not found" }, { status: 404 });

  await supabase.from("voice_records").update({ status: "processing" }).eq("id", id);

  const { data: fileData, error: downloadError } = await supabase.storage
    .from("voice")
    .download(record.storage_path);

  if (downloadError || !fileData) {
    await supabase.from("voice_records").update({ status: "failed" }).eq("id", id);
    return NextResponse.json({ error: "Failed to download audio" }, { status: 500 });
  }

  try {
    const buffer = Buffer.from(await fileData.arrayBuffer());
    const transcript = await transcribeAudio(buffer, record.name);
    const summary = await summarizeTranscript(transcript);

    const { data: updated, error } = await supabase
      .from("voice_records")
      .update({ status: "done", transcript, summary })
      .eq("id", id)
      .select()
      .single();

    if (error) throw new Error(error.message);

    dispatchWebhook(user.id, "voice.processed", {
      id: updated.id,
      name: updated.name,
      status: updated.status,
      hasTranscript: Boolean(transcript),
    }).catch((err) => console.error("[voice] webhook dispatch failed:", err));

    return NextResponse.json(updated);
  } catch (err) {
    await supabase.from("voice_records").update({ status: "failed" }).eq("id", id);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Processing failed" },
      { status: 500 },
    );
  }
}
