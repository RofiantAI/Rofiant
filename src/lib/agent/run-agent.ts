import { createGroq } from "@ai-sdk/groq";
import { Experimental_Agent, generateText, isStepCount } from "ai";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createExecuteTools, createSearchTools } from "@/lib/agent/tools";

const groq = createGroq({ apiKey: process.env.GROQ_API_KEY });
const MODEL = "llama-3.3-70b-versatile";

export const PIPELINE_PHASES = ["receive", "plan", "search", "approval", "execute"] as const;
export type PipelinePhase = (typeof PIPELINE_PHASES)[number];

export type PipelineStepRecord = {
  phase: PipelinePhase;
  status: "done" | "waiting" | "blocked" | "skipped";
  summary: string;
  detail?: unknown;
};

export type PipelineState = {
  plan: string;
  searchNotes: string;
  searchToolCalls: { tool: string; input: unknown; output: unknown }[];
  proposedActions: string;
};

export type AgentPipelineStartResult = {
  status: "pending_approval";
  pipeline: PipelineStepRecord[];
  proposedActions: string;
  plan: string;
  usage: { inputTokens: number; outputTokens: number };
};

export type AgentPipelineCompleteResult = {
  status: "completed" | "denied";
  output: string;
  pipeline: PipelineStepRecord[];
  usage: { inputTokens: number; outputTokens: number };
};

function agentInstructions(agentName: string, agentDescription: string) {
  return [
    `You are "${agentName}", an autonomous workflow agent on Rofiant.`,
    agentDescription.trim() || "Complete multi-step tasks using your tools.",
    "Never invent document contents. Cite sources by name.",
  ].join("\n");
}

function summarizeToolOutput(toolName: string, output: unknown): unknown {
  if (toolName === "read_document" && output && typeof output === "object" && "content" in output) {
    const doc = output as { content?: string | null };
    return {
      ...(output as object),
      content: doc.content
        ? `${doc.content.slice(0, 400)}${doc.content.length > 400 ? "…" : ""}`
        : doc.content,
    };
  }
  return output;
}

function extractToolCalls(
  steps: Awaited<ReturnType<InstanceType<typeof Experimental_Agent>["generate"]>>["steps"],
) {
  const calls: { tool: string; input: unknown; output: unknown }[] = [];
  for (const step of steps) {
    for (const toolCall of step.toolCalls) {
      const result = step.toolResults.find((r) => r.toolCallId === toolCall.toolCallId);
      calls.push({
        tool: toolCall.toolName,
        input: toolCall.input,
        output:
          result?.type === "tool-result"
            ? summarizeToolOutput(toolCall.toolName, result.output)
            : { error: result?.type ?? "unknown" },
      });
    }
  }
  return calls;
}

export async function startAgentPipeline({
  supabase,
  userId,
  agentName,
  agentDescription,
  task,
}: {
  supabase: SupabaseClient;
  userId: string;
  agentName: string;
  agentDescription: string;
  task: string;
}): Promise<AgentPipelineStartResult & { pipelineState: PipelineState }> {
  const pipeline: PipelineStepRecord[] = [];
  let inputTokens = 0;
  let outputTokens = 0;

  // 1. Receive task
  pipeline.push({
    phase: "receive",
    status: "done",
    summary: task.trim() || `Run default workflow for "${agentName}"`,
  });

  const resolvedTask = task.trim() || agentDescription || `Execute the default workflow for agent "${agentName}".`;

  // 2. Plan steps
  const planResult = await generateText({
    model: groq(MODEL),
    system: agentInstructions(agentName, agentDescription),
    prompt: `Task:\n${resolvedTask}\n\nCreate a numbered 3-5 step execution plan. Be specific about which documents to inspect. Output only the plan.`,
  });
  inputTokens += planResult.usage.inputTokens ?? 0;
  outputTokens += planResult.usage.outputTokens ?? 0;

  pipeline.push({
    phase: "plan",
    status: "done",
    summary: "Execution plan created",
    detail: planResult.text.trim(),
  });

  // 3. Search data
  const searchAgent = new Experimental_Agent({
    model: groq(MODEL),
    tools: createSearchTools(supabase, userId),
    stopWhen: isStepCount(8),
    instructions: [
      agentInstructions(agentName, agentDescription),
      "Search phase only. Use tools to find relevant documents.",
      `Task: ${resolvedTask}`,
      `Plan:\n${planResult.text}`,
      "Do not produce the final answer yet — only gather search results.",
    ].join("\n\n"),
  });

  const searchResult = await searchAgent.generate({
    prompt: "Execute the search phase of the plan. Call tools as needed.",
  });
  inputTokens += searchResult.usage.inputTokens ?? 0;
  outputTokens += searchResult.usage.outputTokens ?? 0;

  const searchToolCalls = extractToolCalls(searchResult.steps);
  pipeline.push({
    phase: "search",
    status: "done",
    summary: `${searchToolCalls.length} search tool call(s)`,
    detail: searchToolCalls,
  });

  // 4. Await approval — summarize proposed execution
  const approvalResult = await generateText({
    model: groq(MODEL),
    system: agentInstructions(agentName, agentDescription),
    prompt: [
      `Task: ${resolvedTask}`,
      `Plan:\n${planResult.text}`,
      `Search phase notes:\n${searchResult.text}`,
      `Search tool results:\n${JSON.stringify(searchToolCalls, null, 2)}`,
      "",
      "Summarize exactly what you will do in the execute phase (documents to read, analysis to run, output format).",
      "Write as a short bullet list the user must approve before execution proceeds.",
    ].join("\n\n"),
  });
  inputTokens += approvalResult.usage.inputTokens ?? 0;
  outputTokens += approvalResult.usage.outputTokens ?? 0;

  const proposedActions = approvalResult.text.trim();
  pipeline.push({
    phase: "approval",
    status: "waiting",
    summary: "Waiting for user approval",
    detail: proposedActions,
  });

  pipeline.push({
    phase: "execute",
    status: "skipped",
    summary: "Blocked until approved",
  });

  const pipelineState: PipelineState = {
    plan: planResult.text.trim(),
    searchNotes: searchResult.text.trim(),
    searchToolCalls,
    proposedActions,
  };

  return {
    status: "pending_approval",
    pipeline,
    proposedActions,
    plan: pipelineState.plan,
    pipelineState,
    usage: { inputTokens, outputTokens },
  };
}

export async function resumeAgentPipeline({
  supabase,
  userId,
  agentName,
  agentDescription,
  task,
  pipelineState,
  decision,
}: {
  supabase: SupabaseClient;
  userId: string;
  agentName: string;
  agentDescription: string;
  task: string;
  pipelineState: PipelineState;
  decision: "approved" | "denied";
}): Promise<AgentPipelineCompleteResult & { usage: { inputTokens: number; outputTokens: number } }> {
  const pipeline: PipelineStepRecord[] = [
    { phase: "receive", status: "done", summary: task },
    { phase: "plan", status: "done", summary: "Execution plan created", detail: pipelineState.plan },
    {
      phase: "search",
      status: "done",
      summary: `${pipelineState.searchToolCalls.length} search tool call(s)`,
      detail: pipelineState.searchToolCalls,
    },
  ];

  if (decision === "denied") {
    pipeline.push({
      phase: "approval",
      status: "blocked",
      summary: "Denied by user",
      detail: pipelineState.proposedActions,
    });
    pipeline.push({ phase: "execute", status: "blocked", summary: "Execution blocked" });
    return {
      status: "denied",
      output: "Agent run denied. No actions were executed.",
      pipeline,
      usage: { inputTokens: 0, outputTokens: 0 },
    };
  }

  pipeline.push({
    phase: "approval",
    status: "done",
    summary: "Approved by user",
    detail: pipelineState.proposedActions,
  });

  let inputTokens = 0;
  let outputTokens = 0;

  // 5. Execute
  const executeAgent = new Experimental_Agent({
    model: groq(MODEL),
    tools: createExecuteTools(supabase, userId),
    stopWhen: isStepCount(8),
    instructions: [
      agentInstructions(agentName, agentDescription),
      `Task: ${task}`,
      `Approved plan:\n${pipelineState.plan}`,
      `Search notes:\n${pipelineState.searchNotes}`,
      `Approved actions:\n${pipelineState.proposedActions}`,
      `Prior search results:\n${JSON.stringify(pipelineState.searchToolCalls)}`,
      "Execute the approved plan. Read documents as needed and deliver the final structured result.",
    ].join("\n\n"),
  });

  const executeResult = await executeAgent.generate({
    prompt: "Execute the approved workflow and return the final result.",
  });
  inputTokens += executeResult.usage.inputTokens ?? 0;
  outputTokens += executeResult.usage.outputTokens ?? 0;

  const executeToolCalls = extractToolCalls(executeResult.steps);
  pipeline.push({
    phase: "execute",
    status: "done",
    summary: executeToolCalls.length
      ? `Completed with ${executeToolCalls.length} read(s)`
      : "Completed",
    detail: { toolCalls: executeToolCalls, output: executeResult.text.trim() },
  });

  return {
    status: "completed",
    output: executeResult.text.trim(),
    pipeline,
    usage: { inputTokens, outputTokens },
  };
}
