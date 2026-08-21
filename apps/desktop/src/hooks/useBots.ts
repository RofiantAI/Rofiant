import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface CloudBot {
  id: string;
  name: string;
  status: "creating" | "running" | "stopped" | "error" | "deleted";
  config: Record<string, unknown>;
}

const QUERY_KEY = ["bots"];

export function useBots() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<CloudBot[]> => {
      const res = await apiFetch("/api/bots");
      return res.json();
    },
  });
}

export function useCreateBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (name: string): Promise<CloudBot> => {
      const res = await apiFetch("/api/bots", {
        method: "POST",
        body: JSON.stringify({ name, config: {} }),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["machine"] }); // bot_count changed
    },
  });
}

export function useDeleteBot() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (botId: string): Promise<void> => {
      await apiFetch(`/api/bots/${botId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEY });
      queryClient.invalidateQueries({ queryKey: ["machine"] });
    },
  });
}
