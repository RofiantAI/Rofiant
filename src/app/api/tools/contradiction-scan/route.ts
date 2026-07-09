import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { runContradictionScan } from "@/lib/tools/contradiction-scan";
import { logAudit } from "@/lib/audit";
import { chatRatelimit, enforceRatelimit } from "@/lib/ratelimit";
import { isMinorUser, minorDataCollectionBlockedResponse } from "@/lib/minor-account";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (isMinorUser(user)) return minorDataCollectionBlockedResponse();

  const limited = await enforceRatelimit(chatRatelimit, user.id);
  if (limited) return limited;

  const body = await req.json();
  const documentIds = Array.isArray(body.documentIds)
    ? body.documentIds.filter((x: unknown) => typeof x === "string")
    : [];
  const focusArea = typeof body.focusArea === "string" ? body.focusArea : undefined;

  if (documentIds.length < 2) {
    return NextResponse.json({ error: "Select at least 2 documents" }, { status: 400 });
  }

  try {
    const { output, usage } = await runContradictionScan(supabase, user.id, {
      documentIds,
      focusArea,
    });

    await supabase.from("usage_events").insert({
      user_id: user.id,
      source: "contradiction_scan",
      model: "llama-3.3-70b-versatile",
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
    });

    await logAudit({
      userId: user.id,
      action: "contradiction_scan.run",
      detail: {
        document_count: documentIds.length,
        contradiction_count: output.contradictions.length,
        overall_risk: output.overallRisk,
      },
      ip: req.headers.get("x-forwarded-for"),
    });

    return NextResponse.json({ output, usage });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
