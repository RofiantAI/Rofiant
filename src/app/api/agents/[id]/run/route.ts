import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { resumeAgentPipeline, startAgentPipeline, type PipelineState } from "@/lib/agent/run-agent";
import { isMinorUser, minorDataCollectionBlockedResponse } from "@/lib/minor-account";

async function recordUsage(
  supabase: Awaited<ReturnType<typeof createClient>>,
  userId: string,
  inputTokens: number,
  outputTokens: number,
) {
  await supabase.from("usage_events").insert({
    user_id: userId,
    source: "agents",
    model: "llama-3.3-70b-versatile",
    input_tokens: inputTokens,
    output_tokens: outputTokens,
  });
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return new NextResponse("Unauthorized", { status: 401 });
  if (isMinorUser(user)) return minorDataCollectionBlockedResponse();

  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const task = typeof body.task === "string" ? body.task.trim() : "";
  const runId = typeof body.runId === "string" ? body.runId : "";
  const decision = body.decision === "approved" || body.decision === "denied" ? body.decision : null;

  const { data: agent } = await supabase
    .from("agents")
    .select("*")
    .eq("id", id)
    .eq("user_id", user.id)
    .single();

  if (!agent) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (agent.status !== "active") {
    return NextResponse.json({ error: "Agent is paused" }, { status: 400 });
  }

  const taskText = task || agent.description || `Run the ${agent.name} workflow.`;

  // Resume pending run (approval step)
  if (runId && decision) {
    const { data: pendingRun } = await supabase
      .from("agent_runs")
      .select("*")
      .eq("id", runId)
      .eq("agent_id", id)
      .eq("user_id", user.id)
      .eq("status", "pending_approval")
      .single();

    if (!pendingRun) {
      return NextResponse.json({ error: "Pending run not found" }, { status: 404 });
    }

    const pipelineState = pendingRun.pipeline_state as PipelineState;

    try {
      const result = await resumeAgentPipeline({
        supabase,
        userId: user.id,
        agentName: agent.name,
        agentDescription: agent.description ?? "",
        task: pendingRun.task,
        pipelineState,
        decision,
      });

      const priorUsage = (pendingRun.pipeline_state as PipelineState & { usage?: { inputTokens: number; outputTokens: number } }).usage;
      const totalInput = (priorUsage?.inputTokens ?? 0) + result.usage.inputTokens;
      const totalOutput = (priorUsage?.outputTokens ?? 0) + result.usage.outputTokens;

      if (result.status === "completed") {
        const runs = (agent.runs ?? 0) + 1;
        await supabase
          .from("agent_runs")
          .update({
            status: "completed",
            steps: result.pipeline,
            output: result.output,
            pipeline_state: { ...pipelineState, usage: { inputTokens: totalInput, outputTokens: totalOutput } },
          })
          .eq("id", runId);

        await supabase
          .from("agents")
          .update({ runs, last_output: result.output })
          .eq("id", id);

        await recordUsage(supabase, user.id, result.usage.inputTokens, result.usage.outputTokens);

        return NextResponse.json({
          status: "completed",
          output: result.output,
          pipeline: result.pipeline,
          runs,
          runId,
        });
      }

      await supabase
        .from("agent_runs")
        .update({
          status: "denied",
          steps: result.pipeline,
          output: result.output,
        })
        .eq("id", runId);

      return NextResponse.json({
        status: "denied",
        output: result.output,
        pipeline: result.pipeline,
        runId,
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Agent run failed";
      await supabase
        .from("agent_runs")
        .update({ status: "failed", output: message })
        .eq("id", runId);
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  // Start new pipeline
  try {
    const result = await startAgentPipeline({
      supabase,
      userId: user.id,
      agentName: agent.name,
      agentDescription: agent.description ?? "",
      task: taskText,
    });

    const { data: runRecord } = await supabase
      .from("agent_runs")
      .insert({
        agent_id: id,
        user_id: user.id,
        task: taskText,
        status: "pending_approval",
        steps: result.pipeline,
        pipeline_state: {
          ...result.pipelineState,
          usage: result.usage,
        },
      })
      .select("id")
      .single();

    await recordUsage(supabase, user.id, result.usage.inputTokens, result.usage.outputTokens);

    return NextResponse.json({
      status: "pending_approval",
      runId: runRecord?.id,
      pipeline: result.pipeline,
      plan: result.plan,
      proposedActions: result.proposedActions,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Agent run failed";

    await supabase.from("agent_runs").insert({
      agent_id: id,
      user_id: user.id,
      task: taskText,
      status: "failed",
      steps: [],
      output: message,
    });

    return NextResponse.json({ error: message }, { status: 500 });
  }
}
