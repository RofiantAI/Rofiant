import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { invoke } from "@tauri-apps/api/core";
import { apiFetch } from "@/lib/api";
import { useUIStore } from "@/stores/useUIStore";
import { EMPTY_AGENT_RUN, useRunningStore } from "@/stores/useRunningStore";
import type { ConversationWithLastMessage } from "@/types/chat";

// Short synthesized beep, no audio asset needed.
function playNotificationSound() {
  const ctx = new AudioContext();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.15, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
  osc.connect(gain).connect(ctx.destination);
  osc.start();
  osc.stop(ctx.currentTime + 0.2);
  osc.onended = () => ctx.close();
}

// Only worth interrupting the user if they've looked away, and only for
// bots they opted in to (BotSettingsPanel's Notifications toggle).
function notifyIfEnabled(queryClient: ReturnType<typeof useQueryClient>, conversationId: string, body: string) {
  if (!document.hidden || Notification.permission === "denied") return;
  const conversation = queryClient
    .getQueryData<ConversationWithLastMessage[]>(["conversations"])
    ?.find((c) => c.id === conversationId);
  if (!conversation?.notifications_enabled) return;

  const fire = () => {
    new Notification(conversation.title, { body });
    if (useUIStore.getState().notificationSound) playNotificationSound();
  };
  if (Notification.permission === "granted") fire();
  else Notification.requestPermission().then((p) => p === "granted" && fire());
}

const LOCAL_TOOLS = new Set(["local_read_file", "local_write_file", "local_list_dir"]);

/** Runs a client_executed tool (see AgentTool.client_executed on the
 * backend) against the user's real filesystem via the Tauri commands in
 * src-tauri/src/lib.rs, and returns the plain-text result the model sees. */
async function runLocalTool(tool: string, args: Record<string, unknown>): Promise<string> {
  try {
    switch (tool) {
      case "local_read_file":
        return await invoke<string>("local_read_file", { path: String(args.path) });
      case "local_write_file":
        return await invoke<string>("local_write_file", {
          path: String(args.path),
          content: String(args.content ?? ""),
        });
      case "local_list_dir":
        return await invoke<string>("local_list_dir", { path: String(args.path) });
      default:
        return `Unknown local tool: ${tool}`;
    }
  } catch (err) {
    return err instanceof Error ? err.message : String(err);
  }
}

/** Parses one `event: ...\ndata: ...\n\n` SSE frame into its parts. */
function parseSseFrame(frame: string): { event: string; data: string } {
  let event = "message";
  let data = "";
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data = line.slice(5).trim();
  }
  return { event, data };
}

// Keyed by conversation id rather than held in the hook instance, so a
// stop button elsewhere in the tree can abort a run without prop-drilling
// the controller through every component between it and the composer.
const controllers = new Map<string, AbortController>();

export function stopAgentRun(conversationId: string) {
  controllers.get(conversationId)?.abort();
}

// Resolves the promise a pending tool-approval dialog is awaiting, keyed
// the same way as `controllers` so the ApprovalDialog component (which has
// no access to this closure) can answer it.
const approvalResolvers = new Map<string, (approved: boolean) => void>();

export function resolveApproval(approvalId: string, approved: boolean) {
  approvalResolvers.get(approvalId)?.(approved);
  approvalResolvers.delete(approvalId);
}

export function useAgentRun(conversationId: string | null) {
  const queryClient = useQueryClient();
  const state = useRunningStore((s) =>
    conversationId ? (s.runs[conversationId] ?? EMPTY_AGENT_RUN) : EMPTY_AGENT_RUN,
  );
  const selectedModel = useUIStore((s) => s.selectedModel);
  const maxSteps = useUIStore((s) => s.maxSteps);
  const maxRunMinutes = useUIStore((s) => s.maxRunMinutes);
  const toolApprovalPolicy = useUIStore((s) => s.toolApprovalPolicy);
  const setRunning = useRunningStore((s) => s.setRunning);
  const setRun = useRunningStore((s) => s.setRun);
  const updateRun = useRunningStore((s) => s.updateRun);

  const run = useCallback(
    async (mentionedPersonas?: string[], conversationIdOverride?: string) => {
    const id = conversationIdOverride ?? conversationId;
    if (!id) return;
    if (useRunningStore.getState().runs[id]?.running) return;
    setRun(id, { ...EMPTY_AGENT_RUN, running: true, startedAt: Date.now() });
    setRunning(id, true);
    let failed = false;
    const controller = new AbortController();
    controllers.set(id, controller);

    try {
      const res = await apiFetch("/api/messages/stream", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          conversation_id: id,
          model: selectedModel,
          max_steps: maxSteps,
          max_run_minutes: maxRunMinutes,
          tool_approval_policy: toolApprovalPolicy,
          mentioned_personas: mentionedPersonas?.length ? mentionedPersonas : undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        }),
      });

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        const frames = buffer.split("\n\n");
        buffer = frames.pop() ?? "";

        for (const frame of frames) {
          const { event, data } = parseSseFrame(frame);
          if (!data) continue;
          const payload = JSON.parse(data);

          if (event === "assistant.delta") {
            updateRun(id, (s) => ({ ...s, draft: s.draft + payload.text, draftPersona: payload.persona ?? null }));
          } else if (event === "assistant.completed") {
            // Group chat: next bot's turn starts a fresh draft, not this
            // bot's leftover text.
            updateRun(id, (s) => ({ ...s, draft: "", draftPersona: null }));
          } else if (event === "tool.approval_required") {
            const detail =
              payload.tool === "terminal"
                ? String(payload.arguments?.command ?? JSON.stringify(payload.arguments))
                : LOCAL_TOOLS.has(payload.tool)
                  ? String(payload.arguments?.path ?? JSON.stringify(payload.arguments))
                  : JSON.stringify(payload.arguments, null, 2);
            const approved = await new Promise<boolean>((resolve) => {
              approvalResolvers.set(payload.approval_id, resolve);
              updateRun(id, (s) => ({
                ...s,
                pendingApproval: { approvalId: payload.approval_id, tool: payload.tool, detail },
              }));
            });
            updateRun(id, (s) => ({ ...s, pendingApproval: null }));
            await apiFetch(`/api/messages/approvals/${payload.approval_id}`, {
              method: "POST",
              body: JSON.stringify({ approved }),
            });
          } else if (event === "tool.client_exec_required") {
            // Already past approval (either the user said yes to
            // tool.approval_required above, or the policy is "automatic") --
            // this just does the real local file I/O and reports the result
            // back so the agent loop can continue.
            const result = await runLocalTool(payload.tool, payload.arguments);
            await apiFetch(`/api/messages/tool-results/${payload.id}`, {
              method: "POST",
              body: JSON.stringify({ result }),
            });
          } else if (event === "tool.started") {
            updateRun(id, (s) => ({
              ...s,
              liveToolCalls: [
                ...s.liveToolCalls,
                {
                  id: payload.id,
                  conversation_id: id,
                  tool_name: payload.tool,
                  arguments: payload.arguments,
                  result: null,
                  status: "running",
                  created_at: new Date().toISOString(),
                },
              ],
            }));
          } else if (event === "tool.completed" || event === "tool.failed") {
            const status = event === "tool.completed" ? "completed" : "failed";
            updateRun(id, (s) => ({
              ...s,
              liveToolCalls: s.liveToolCalls.map((t) =>
                t.id === payload.id
                  ? { ...t, status, result: payload.result ?? payload.error ?? null }
                  : t,
              ),
            }));
            queryClient.invalidateQueries({ queryKey: ["tool-calls", id] });
          } else if (event === "conversation.titled") {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          } else if (event === "workspace.created") {
            queryClient.invalidateQueries({ queryKey: ["workspace-files", id] });
          } else if (event === "agent.failed") {
            failed = true;
            updateRun(id, (s) => ({ ...s, error: payload.error ?? "Agent run failed" }));
            notifyIfEnabled(queryClient, id, payload.error ?? "Needs your input");
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["messages", id] });
      if (!failed) notifyIfEnabled(queryClient, id, "Finished responding");
    } catch (err) {
      const stopped = err instanceof DOMException && err.name === "AbortError";
      if (!stopped) {
        updateRun(id, (s) => ({ ...s, error: err instanceof Error ? err.message : "Agent run failed" }));
      }
      queryClient.invalidateQueries({ queryKey: ["messages", id] });
    } finally {
      controllers.delete(id);
      updateRun(id, (s) => ({ ...s, running: false, draft: "" }));
      setRunning(id, false);
    }
  }, [conversationId, queryClient, selectedModel, maxSteps, maxRunMinutes, toolApprovalPolicy, setRunning, setRun, updateRun]);

  return { ...state, run };
}
