import { useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useUIStore } from "@/stores/useUIStore";
import { EMPTY_AGENT_RUN, useRunningStore } from "@/stores/useRunningStore";
import type { ConversationWithLastMessage } from "@/types/chat";

// Only worth interrupting the user if they've looked away, and only for
// bots they opted in to (BotSettingsPanel's Notifications toggle).
function notifyIfEnabled(queryClient: ReturnType<typeof useQueryClient>, conversationId: string, body: string) {
  if (!document.hidden || Notification.permission === "denied") return;
  const conversation = queryClient
    .getQueryData<ConversationWithLastMessage[]>(["conversations"])
    ?.find((c) => c.id === conversationId);
  if (!conversation?.notifications_enabled) return;

  const fire = () => new Notification(conversation.title, { body });
  if (Notification.permission === "granted") fire();
  else Notification.requestPermission().then((p) => p === "granted" && fire());
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
    async (mentionedPersonas?: string[]) => {
    if (!conversationId) return;
    if (useRunningStore.getState().runs[conversationId]?.running) return;
    setRun(conversationId, { ...EMPTY_AGENT_RUN, running: true });
    setRunning(conversationId, true);
    let failed = false;
    const controller = new AbortController();
    controllers.set(conversationId, controller);

    try {
      const res = await apiFetch("/api/messages/stream", {
        method: "POST",
        signal: controller.signal,
        body: JSON.stringify({
          conversation_id: conversationId,
          model: selectedModel,
          max_steps: maxSteps,
          max_run_minutes: maxRunMinutes,
          tool_approval_policy: toolApprovalPolicy,
          mentioned_personas: mentionedPersonas?.length ? mentionedPersonas : undefined,
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
            updateRun(conversationId, (s) => ({ ...s, draft: s.draft + payload.text, draftPersona: payload.persona ?? null }));
          } else if (event === "assistant.completed") {
            // Group chat: next bot's turn starts a fresh draft, not this
            // bot's leftover text.
            updateRun(conversationId, (s) => ({ ...s, draft: "", draftPersona: null }));
          } else if (event === "tool.approval_required") {
            const detail = payload.tool === "terminal"
              ? String(payload.arguments?.command ?? JSON.stringify(payload.arguments))
              : JSON.stringify(payload.arguments, null, 2);
            const approved = window.confirm(`Allow ${payload.tool} to run?\n\n${detail}`);
            await apiFetch(`/api/messages/approvals/${payload.approval_id}`, {
              method: "POST",
              body: JSON.stringify({ approved }),
            });
          } else if (event === "tool.started") {
            updateRun(conversationId, (s) => ({
              ...s,
              liveToolCalls: [
                ...s.liveToolCalls,
                {
                  id: payload.id,
                  conversation_id: conversationId,
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
            updateRun(conversationId, (s) => ({
              ...s,
              liveToolCalls: s.liveToolCalls.map((t) =>
                t.id === payload.id
                  ? { ...t, status, result: payload.result ?? payload.error ?? null }
                  : t,
              ),
            }));
            queryClient.invalidateQueries({ queryKey: ["tool-calls", conversationId] });
          } else if (event === "conversation.titled") {
            queryClient.invalidateQueries({ queryKey: ["conversations"] });
          } else if (event === "workspace.created") {
            queryClient.invalidateQueries({ queryKey: ["workspace-files", conversationId] });
          } else if (event === "agent.failed") {
            failed = true;
            updateRun(conversationId, (s) => ({ ...s, error: payload.error ?? "Agent run failed" }));
            notifyIfEnabled(queryClient, conversationId, payload.error ?? "Needs your input");
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      if (!failed) notifyIfEnabled(queryClient, conversationId, "Finished responding");
    } catch (err) {
      const stopped = err instanceof DOMException && err.name === "AbortError";
      if (!stopped) {
        updateRun(conversationId, (s) => ({ ...s, error: err instanceof Error ? err.message : "Agent run failed" }));
      }
      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
    } finally {
      controllers.delete(conversationId);
      updateRun(conversationId, (s) => ({ ...s, running: false, draft: "" }));
      setRunning(conversationId, false);
    }
  }, [conversationId, queryClient, selectedModel, maxSteps, maxRunMinutes, toolApprovalPolicy, setRunning, setRun, updateRun]);

  return { ...state, run };
}
