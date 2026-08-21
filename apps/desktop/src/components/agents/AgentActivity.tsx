import type { ReactNode } from "react";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useToolCalls } from "@/hooks/useToolCalls";
import { useAgentRun } from "@/hooks/useAgentRun";
import type { ToolCall, ToolCallStatus } from "@/types/chat";

const statusIcon: Record<ToolCallStatus, ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  running: <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

export function AgentActivity() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const { data: persisted = [] } = useToolCalls(activeConversationId);
  const { liveToolCalls } = useAgentRun(activeConversationId);

  // Live (in-progress) calls first by id, so a completed live entry doesn't
  // show up twice once the persisted row lands: it just swaps in place.
  const liveIds = new Set(liveToolCalls.map((t) => t.id));
  const calls: ToolCall[] = [...persisted.filter((t) => !liveIds.has(t.id)), ...liveToolCalls];

  if (calls.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No agent activity yet.</p>;
  }

  return (
    <ul className="space-y-1.5 p-3 font-mono text-xs">
      {calls.map((call) => (
        <li
          key={call.id}
          className="animate-in fade-in flex items-center gap-2 rounded-md bg-secondary/50 px-2.5 py-1.5 duration-200"
        >
          {statusIcon[call.status]}
          <span className={cn("font-semibold", call.status === "failed" && "text-destructive")}>
            {call.tool_name}
          </span>
          <span className="truncate text-muted-foreground">{JSON.stringify(call.arguments)}</span>
        </li>
      ))}
    </ul>
  );
}
