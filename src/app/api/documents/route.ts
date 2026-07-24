import { NextRequest, NextResponse } from "next/server";
import { dispatchWebhook } from "@/lib/webhooks";
import { extractTextFromBuffer, truncateText } from "@/lib/document-text";
import { classifyDocument, summarizeDocument } from "@/lib/document-processing";
import { isMinorUser, minorDataCollectionBlockedResponse } from "@/lib/minor-account";
import { planToolDeniedResponse } from "@/lib/plan-guard";
import { getAuthedUser } from "@/lib/api-auth";

async function indexDocument(
  supabase: Awaited<ReturnType<typeof getAuthedUser>>["supabase"],
  userId: string,
  doc: { id: string; name: string; type: string; storage_path: string },
) {
  const { data: fileData, error: downloadError } = await supabase.storage
    .from("documents")
    .download(doc.storage_path);

  if (downloadError || !fileData) {
    await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
    return;
  }

  const buffer = Buffer.from(await fileData.arrayBuffer());

  try {
    const raw = await extractTextFromBuffer(buffer, doc.type);
    const contentText = truncateText(raw);
    const category = await classifyDocument(doc.name, contentText);
    const summary = await summarizeDocument(doc.name, contentText);

    await supabase
      .from("documents")
      .update({ status: "indexed", content_text: contentText, category, summary })
      .eq("id", doc.id)
      .eq("user_id", userId);
  } catch {
    await supabase.from("documents").update({ status: "failed" }).eq("id", doc.id);
  }
}

export async function GET(req: NextRequest) {
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (isMinorUser(user)) {
    return NextResponse.json([]);
  }

  const { data, error } = await supabase
    .from("documents")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await getAuthedUser(req);
  if (!user) return new Response("Unauthorized", { status: 401 });

  if (isMinorUser(user)) {
    return minorDataCollectionBlockedResponse();
  }

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const denied = planToolDeniedResponse(
    plan,
    "documents",
    "Document uploads require a Pro, Team, or Pilot plan or higher.",
  );
  if (denied) return denied;

  const { name, type, size, storage_path } = await req.json();

  const { data, error } = await supabase
    .from("documents")
    .insert({ user_id: user.id, name, type, size, storage_path, status: "uploading" })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await indexDocument(supabase, user.id, data);

  const { data: indexed } = await supabase
    .from("documents")
    .select("*")
    .eq("id", data.id)
    .single();

  dispatchWebhook(user.id, "document.processed", {
    id: data.id,
    name: data.name,
    status: indexed?.status ?? data.status,
    category: indexed?.category ?? null,
  }).catch((err) => console.error("[documents] webhook dispatch failed:", err));

  return NextResponse.json(indexed ?? data);
}
