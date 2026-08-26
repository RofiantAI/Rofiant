import { Hand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { resolveApproval } from "@/hooks/useAgentRun";
import type { PendingApproval } from "@/stores/useRunningStore";

// Friendlier phrasing than the raw snake_case tool name; also decides
// whether approval.detail reads as a shell command (terminal, "$ ...") or a
// plain path (the local_* tools, which touch the user's real computer).
const APPROVAL_COPY: Record<string, { question: string; isCommand: boolean }> = {
  terminal: { question: "Allow this command to run?", isCommand: true },
  local_read_file: { question: "Allow reading this file on your computer?", isCommand: false },
  local_write_file: { question: "Allow writing this file on your computer?", isCommand: false },
  local_list_dir: { question: "Allow listing this folder on your computer?", isCommand: false },
};

// Sits inline above the composer instead of a blocking full-screen modal --
// the rest of the app (sidebar, scrolling chat, other conversations) stays
// usable while a tool call waits on the user. The orange left rail is the
// only accent here; the buttons stay neutral since Allow is the expected
// path for most tool calls, unlike the full-access confirm.
export function ApprovalBar({ approval }: { approval: PendingApproval }) {
  const copy = APPROVAL_COPY[approval.tool] ?? {
    question: `Allow ${approval.tool} to run?`,
    isCommand: false,
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="approval-bar-in mx-2 mb-2 mt-2 flex items-center justify-between gap-4 rounded-2xl border border-border border-l-2 border-l-orange-500 bg-card px-4 py-3 shadow-lg"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-orange-500">
          <Hand className="h-3 w-3" />
          Waiting for approval
        </div>
        <p className="mt-1 text-sm font-medium text-foreground">{copy.question}</p>
        <pre className="mt-1.5 max-h-24 overflow-auto whitespace-pre-wrap rounded bg-muted px-2 py-1.5 font-mono text-xs text-muted-foreground">
          {copy.isCommand && <span className="select-none text-muted-foreground/60">$ </span>}
          {approval.detail}
        </pre>
      </div>
      <div className="flex shrink-0 gap-2">
        <Button variant="outline" size="sm" onClick={() => resolveApproval(approval.approvalId, false)}>
          Cancel
        </Button>
        <Button size="sm" autoFocus onClick={() => resolveApproval(approval.approvalId, true)}>
          Allow
        </Button>
      </div>
    </div>
  );
}
