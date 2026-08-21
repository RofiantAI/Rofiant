import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import { useUIStore } from "@/stores/useUIStore";
import { useRunningStore } from "@/stores/useRunningStore";
import type { ConversationWithLastMessage, ToolCall } from "@/types/chat";

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

interface AgentRunState {
  running: boolean;
  draft: string;
  draftPersona: string | null;
  error: string | null;
  liveToolCalls: ToolCall[];
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

const INITIAL_STATE: AgentRunState = {
  running: false,
  draft: "",
  draftPersona: null,
  error: null,
  liveToolCalls: [],
};

export function useAgentRun(conversationId: string | null) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AgentRunState>(INITIAL_STATE);
  const selectedModel = useUIStore((s) => s.selectedModel);
  const maxSteps = useUIStore((s) => s.maxSteps);
  const setRunning = useRunningStore((s) => s.setRunning);

  const run = useCallback(
    async (mentionedPersonas?: string[]) => {
    if (!conversationId) return;
    setState({ ...INITIAL_STATE, running: true });
    setRunning(conversationId, true);
    let failed = false;

    try {
      const res = await apiFetch("/api/messages/stream", {
        method: "POST",
        body: JSON.stringify({
          conversation_id: conversationId,
          model: selectedModel,
          max_steps: maxSteps,
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
            setState((s) => ({ ...s, draft: s.draft + payload.text, draftPersona: payload.persona ?? null }));
          } else if (event === "assistant.completed") {
            // Group chat: next bot's turn starts a fresh draft, not this
            // bot's leftover text.
            setState((s) => ({ ...s, draft: "", draftPersona: null }));
          } else if (event === "tool.started") {
            setState((s) => ({
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
            setState((s) => ({
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
            setState((s) => ({ ...s, error: payload.error ?? "Agent run failed" }));
            notifyIfEnabled(queryClient, conversationId, payload.error ?? "Needs your input");
          }
        }
      }

      queryClient.invalidateQueries({ queryKey: ["messages", conversationId] });
      if (!failed) notifyIfEnabled(queryClient, conversationId, "Finished responding");
    } catch (err) {
      setState((s) => ({ ...s, error: err instanceof Error ? err.message : "Agent run failed" }));
    } finally {
      setState((s) => ({ ...s, running: false, draft: "" }));
      setRunning(conversationId, false);
    }
  }, [conversationId, queryClient, selectedModel, maxSteps, setRunning]);

  return { ...state, run };
}
