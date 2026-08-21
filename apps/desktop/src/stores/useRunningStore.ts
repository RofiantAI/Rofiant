import { create } from "zustand";

// Which conversations have an agent run in flight right now, so the
// sidebar can show a "working" dot even for chats you've switched away
// from. Not persisted — a run in progress doesn't survive an app restart.
interface RunningState {
  running: Set<string>;
  setRunning: (conversationId: string, isRunning: boolean) => void;
}

export const useRunningStore = create<RunningState>((set) => ({
  running: new Set(),
  setRunning: (conversationId, isRunning) =>
    set((s) => {
      const next = new Set(s.running);
      if (isRunning) next.add(conversationId);
      else next.delete(conversationId);
      return { running: next };
    }),
}));
