import { useState } from "react";
import { Plus, Trash2, Loader2, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useBots, useCreateBot, useDeleteBot } from "@/hooks/useBots";
import { useMachine } from "@/hooks/useMachine";
import { useMachineScreen } from "@/hooks/useMachineScreen";
import { MachineScreenModal } from "@/components/machine/MachineScreenModal";

const STATUS_DOT: Record<string, string> = {
  running: "bg-emerald-500",
  creating: "bg-amber-500",
  stopped: "bg-muted-foreground",
  error: "bg-destructive",
};

export function BotsList() {
  const { data: machine } = useMachine();
  const { data: bots, isLoading } = useBots();
  const createBot = useCreateBot();
  const deleteBot = useDeleteBot();
  const [name, setName] = useState("");
  const [expanded, setExpanded] = useState(false);

  const canCreate = !!machine && machine.status !== "error";
  const machineRunning = machine?.status === "running";
  // One shared VM, so one shared screen poll -- every bot row's thumbnail
  // shows the same feed instead of each row polling independently.
  const { url: thumbUrl } = useMachineScreen(machineRunning && !!bots?.length, 4000);

  function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    createBot.mutate(trimmed, { onSuccess: () => setName("") });
  }

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <Input
          placeholder="Bot name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          disabled={!canCreate || createBot.isPending}
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={!canCreate || !name.trim() || createBot.isPending}
        >
          {createBot.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
        </Button>
      </div>

      {!canCreate && (
        <p className="text-xs text-muted-foreground">
          Create your cloud computer first before adding bots.
        </p>
      )}

      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      ) : !bots || bots.length === 0 ? (
        <p className="text-xs text-muted-foreground">No bots yet.</p>
      ) : (
        <ul className="divide-y divide-border rounded-lg border border-border bg-card">
          {bots.map((bot) => (
            <li key={bot.id} className="flex items-center justify-between gap-3 px-4 py-2.5">
              <button
                className="flex min-w-0 flex-1 items-center gap-3 text-left disabled:cursor-default"
                onClick={() => machineRunning && setExpanded(true)}
                disabled={!machineRunning}
              >
                <span className="relative h-8 w-12 shrink-0 overflow-hidden rounded border border-border bg-black/40">
                  {thumbUrl ? (
                    <img src={thumbUrl} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Monitor className="absolute inset-0 m-auto h-3.5 w-3.5 text-muted-foreground" />
                  )}
                </span>
                <span className="flex min-w-0 items-center gap-2">
                  <span className={`h-1.5 w-1.5 shrink-0 rounded-full ${STATUS_DOT[bot.status] ?? "bg-muted-foreground"}`} />
                  <span className="truncate text-sm text-foreground/90">{bot.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">{bot.status}</span>
                </span>
              </button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => deleteBot.mutate(bot.id)}
                disabled={deleteBot.isPending}
              >
                <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {expanded && <MachineScreenModal onClose={() => setExpanded(false)} />}
    </div>
  );
}
