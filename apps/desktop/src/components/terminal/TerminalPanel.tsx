import { useUIStore } from "@/stores/useUIStore";
import { useToolCalls } from "@/hooks/useToolCalls";
import { useAgentRun } from "@/hooks/useAgentRun";

export function TerminalPanel() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const { data: persisted = [] } = useToolCalls(activeConversationId);
  const { liveToolCalls } = useAgentRun(activeConversationId);

  const liveIds = new Set(liveToolCalls.map((t) => t.id));
  const calls = [...persisted.filter((t) => !liveIds.has(t.id)), ...liveToolCalls].filter(
    (t) => t.tool_name === "terminal",
  );

  if (calls.length === 0) {
    return (
      <div className="h-full overflow-y-auto bg-black/40 p-3 font-mono text-xs text-muted-foreground">
        No terminal output yet.
      </div>
    );
  }

  return (
    <div className="h-full space-y-3 overflow-y-auto bg-black/40 p-3 font-mono text-xs">
      {calls.map((call) => (
        <pre
          key={call.id}
          className={
            call.status === "failed"
              ? "whitespace-pre-wrap text-destructive"
              : "whitespace-pre-wrap text-foreground/90"
          }
        >
          {call.result ?? (call.status === "running" ? "running..." : "")}
        </pre>
      ))}
    </div>
  );
}
