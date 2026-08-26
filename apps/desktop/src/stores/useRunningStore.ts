import { create } from "zustand";
import type { ToolCall } from "@/types/chat";

export interface PendingApproval {
  approvalId: string;
  tool: string;
  detail: string;
}

export interface AgentRunState {
  running: boolean;
  draft: string;
  draftPersona: string | null;
  error: string | null;
  liveToolCalls: ToolCall[];
  pendingApproval: PendingApproval | null;
  startedAt: number | null;
}

export const EMPTY_AGENT_RUN: AgentRunState = {
  running: false,
  draft: "",
  draftPersona: null,
  error: null,
  liveToolCalls: [],
  pendingApproval: null,
  startedAt: null,
};

// Which conversations have an agent run in flight right now, so the
// sidebar can show a "working" dot even for chats you've switched away
// from. Not persisted — a run in progress doesn't survive an app restart.
interface RunningState {
  running: Set<string>;
  runs: Record<string, AgentRunState>;
  setRunning: (conversationId: string, isRunning: boolean) => void;
  setRun: (conversationId: string, run: AgentRunState) => void;
  updateRun: (conversationId: string, update: (run: AgentRunState) => AgentRunState) => void;
  removeRun: (conversationId: string) => void;
}

export const useRunningStore = create<RunningState>((set) => ({
  running: new Set(),
  runs: {},
  setRunning: (conversationId, isRunning) =>
    set((s) => {
      const next = new Set(s.running);
      if (isRunning) next.add(conversationId);
      else next.delete(conversationId);
      return { running: next };
    }),
  setRun: (conversationId, run) => set((s) => ({ runs: { ...s.runs, [conversationId]: run } })),
  updateRun: (conversationId, update) =>
    set((s) => ({
      runs: { ...s.runs, [conversationId]: update(s.runs[conversationId] ?? EMPTY_AGENT_RUN) },
    })),
  removeRun: (conversationId) =>
    set((s) => {
      const runs = { ...s.runs };
      delete runs[conversationId];
      const running = new Set(s.running);
      running.delete(conversationId);
      return { runs, running };
    }),
}));
