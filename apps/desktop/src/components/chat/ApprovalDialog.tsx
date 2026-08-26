import { Button } from "@/components/ui/button";
import { resolveApproval } from "@/hooks/useAgentRun";
import type { PendingApproval } from "@/stores/useRunningStore";

export function ApprovalDialog({ approval }: { approval: PendingApproval }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg border border-border bg-background p-4 shadow-lg">
        <p className="text-sm font-medium text-foreground">Allow {approval.tool} to run?</p>
        <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap rounded bg-muted p-2 text-xs text-muted-foreground">
          {approval.detail}
        </pre>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => resolveApproval(approval.approvalId, false)}>
            Cancel
          </Button>
          <Button onClick={() => resolveApproval(approval.approvalId, true)}>OK</Button>
        </div>
      </div>
    </div>
  );
}
