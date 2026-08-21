import { Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  useMachine,
  useEnsureMachine,
  useStartMachine,
  useStopMachine,
  useRestartMachine,
} from "@/hooks/useMachine";

const DOT_COLOR: Record<string, string> = {
  running: "bg-emerald-500",
  provisioning: "bg-amber-500",
  starting: "bg-amber-500",
  stopping: "bg-amber-500",
  stopped: "bg-muted-foreground",
  error: "bg-destructive",
};

/** No provider/Fly detail here on purpose -- users see state, region, bot
 * count, nothing that leaks the implementation. Desktop view lives with the
 * bots list (BotsList) instead of here -- one shared VM, one place to see it. */
export function CloudComputerStatus() {
  const { data: machine, isLoading, error } = useMachine();
  const ensure = useEnsureMachine();
  const start = useStartMachine();
  const stop = useStopMachine();
  const restart = useRestartMachine();

  if (isLoading) {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
      </section>
    );
  }

  if (error) {
    return (
      <section className="rounded-lg border border-destructive/40 bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          Couldn't reach your cloud computer.
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => ensure.mutate()}>
          Retry
        </Button>
      </section>
    );
  }

  if (!machine) {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <p className="text-sm text-foreground/90">No cloud computer yet.</p>
        <Button
          size="sm"
          className="mt-3"
          onClick={() => ensure.mutate()}
          disabled={ensure.isPending}
        >
          {ensure.isPending ? "Creating..." : "Create cloud computer"}
        </Button>
      </section>
    );
  }

  if (machine.status === "provisioning") {
    return (
      <section className="rounded-lg border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-foreground/90">
          <Loader2 className="h-4 w-4 animate-spin" />
          Creating your cloud computer...
        </div>
      </section>
    );
  }

  if (machine.status === "error") {
    return (
      <section className="rounded-lg border border-destructive/40 bg-card p-5">
        <div className="flex items-center gap-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4" />
          {machine.error_message || "Something went wrong."}
        </div>
        <Button variant="outline" size="sm" className="mt-3" onClick={() => ensure.mutate()}>
          Retry
        </Button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-sm text-foreground/90">
        <span className={`h-2 w-2 rounded-full ${DOT_COLOR[machine.status]}`} />
        {machine.status[0].toUpperCase() + machine.status.slice(1)}
      </div>
      <div className="mt-2 space-y-0.5 text-xs text-muted-foreground">
        <p>Bots: {machine.bot_count}</p>
        {machine.region && <p>Region: {machine.region}</p>}
      </div>
      <div className="mt-3 flex gap-2">
        {machine.status === "stopped" && (
          <Button size="sm" onClick={() => start.mutate()} disabled={start.isPending}>
            Start
          </Button>
        )}
        {machine.status === "running" && (
          <>
            <Button variant="outline" size="sm" onClick={() => stop.mutate()} disabled={stop.isPending}>
              Stop
            </Button>
            <Button variant="outline" size="sm" onClick={() => restart.mutate()} disabled={restart.isPending}>
              Restart
            </Button>
          </>
        )}
      </div>
    </section>
  );
}
