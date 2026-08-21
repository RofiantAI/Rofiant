import { useState } from "react";
import { Loader2 } from "lucide-react";
import { CloudComputerStatus } from "@/components/machine/CloudComputerStatus";
import { BotsList } from "@/components/machine/BotsList";
import { MachineScreenModal } from "@/components/machine/MachineScreenModal";
import { useMachine } from "@/hooks/useMachine";
import { useMachineScreen } from "@/hooks/useMachineScreen";

/** The right-sidebar "Cloud" tab: status + a live-ish view of the VM's
 * desktop (polled screenshot) + the bots running on it, all in one place --
 * no trip to Settings needed. */
export function CloudPanel() {
  const { data: machine } = useMachine();
  const running = machine?.status === "running";
  const { url, error } = useMachineScreen(running, 2000);
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="h-full space-y-4 overflow-y-auto p-4">
      <CloudComputerStatus />

      {running && (
        <button
          onClick={() => url && setExpanded(true)}
          disabled={!url}
          className="block w-full overflow-hidden rounded-lg border border-border bg-black/40 text-left disabled:cursor-default"
        >
          {error ? (
            <p className="p-4 text-xs text-destructive">{error}</p>
          ) : url ? (
            <img src={url} alt="Cloud computer desktop" className="w-full" />
          ) : (
            <div className="flex h-48 items-center justify-center">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </button>
      )}

      {expanded && <MachineScreenModal onClose={() => setExpanded(false)} />}

      <div>
        <p className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Bots
        </p>
        <BotsList />
      </div>
    </div>
  );
}
