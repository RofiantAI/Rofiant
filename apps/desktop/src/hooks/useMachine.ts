import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export type MachineState =
  | "provisioning"
  | "starting"
  | "running"
  | "stopping"
  | "stopped"
  | "error";

export interface MachineStatus {
  status: MachineState;
  region: string | null;
  bot_count: number;
  error_message: string | null;
}

const QUERY_KEY = ["machine"];

/** null response means the user has no cloud computer yet -- not an error. */
export function useMachine() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<MachineStatus | null> => {
      const res = await apiFetch("/api/machine");
      return res.json();
    },
    // Provisioning/starting/stopping are transient -- poll until settled.
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      return status === "provisioning" || status === "starting" || status === "stopping"
        ? 3000
        : false;
    },
  });
}

function useMachineAction(path: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<MachineStatus> => {
      const res = await apiFetch(path, { method: "POST" });
      return res.json();
    },
    onSuccess: (data) => queryClient.setQueryData(QUERY_KEY, data),
  });
}

export const useEnsureMachine = () => useMachineAction("/api/machine/ensure");
export const useStartMachine = () => useMachineAction("/api/machine/start");
export const useStopMachine = () => useMachineAction("/api/machine/stop");
export const useRestartMachine = () => useMachineAction("/api/machine/restart");
