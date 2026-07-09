import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { canDeployFederalSolutions, isFederalSolutionId } from "@/lib/federal-solutions";
import { runFederalWorkflow } from "@/lib/federal-workflows/run";
import { logAudit } from "@/lib/audit";
import { isMinorUser, minorDataCollectionBlockedResponse } from "@/lib/minor-account";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isFederalSolutionId(id)) {
    return NextResponse.json({ error: "Invalid solution" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });
  if (isMinorUser(user)) return minorDataCollectionBlockedResponse();

  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  if (!canDeployFederalSolutions(plan)) {
    return NextResponse.json({ error: "Government plan required" }, { status: 403 });
  }

  const body = await req.json();
  const taskId = typeof body.taskId === "string" ? body.taskId : undefined;
  const documentIds = Array.isArray(body.documentIds)
    ? body.documentIds.filter((x: unknown) => typeof x === "string")
    : [];
  const inputText = typeof body.inputText === "string" ? body.inputText : "";
  const options =
    body.options && typeof body.options === "object" ? body.options : undefined;
  const includeReferencePack = body.includeReferencePack !== false;

  if (documentIds.length === 0 && !inputText.trim()) {
    return NextResponse.json(
      { error: "Attach at least one document or provide input text" },
      { status: 400 },
    );
  }

  try {
    const { output, usage } = await runFederalWorkflow(supabase, user.id, {
      solutionId: id,
      taskId,
      documentIds,
      inputText,
      options,
      includeReferencePack,
    });

    const { data: run, error: runError } = await supabase
      .from("federal_workflow_runs")
      .insert({
        user_id: user.id,
        solution_id: id,
        input: { taskId, inputText, options: options ?? {}, includeReferencePack },
        output,
        document_ids: documentIds,
        input_tokens: usage.inputTokens,
        output_tokens: usage.outputTokens,
      })
      .select("id, created_at")
      .single();

    if (runError) {
      console.error("[federal_workflow_runs]", runError.message);
    }

    await supabase.from("usage_events").insert({
      user_id: user.id,
      source: "federal_workflow",
      model: "llama-3.3-70b-versatile",
      input_tokens: usage.inputTokens,
      output_tokens: usage.outputTokens,
    });

    await logAudit({
      userId: user.id,
      action: "federal_workflow.run",
      detail: {
        solution_id: id,
        task_id: taskId,
        run_id: run?.id,
        document_count: documentIds.length,
      },
    });

    return NextResponse.json({
      solutionId: id,
      runId: run?.id ?? null,
      createdAt: run?.created_at ?? null,
      output,
      usage,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Workflow failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!isFederalSolutionId(id)) {
    return NextResponse.json({ error: "Invalid solution" }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { data, error } = await supabase
    .from("federal_workflow_runs")
    .select("id, solution_id, input, output, document_ids, created_at")
    .eq("user_id", user.id)
    .eq("solution_id", id)
    .order("created_at", { ascending: false })
    .limit(25);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ runs: data ?? [] });
}
