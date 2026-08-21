import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";
import type { ToolCall } from "@/types/chat";

export function useToolCalls(conversationId: string | null) {
  return useQuery({
    queryKey: ["tool-calls", conversationId],
    queryFn: async () => {
      const res = await apiFetch(`/api/workspaces/${conversationId}/tool-calls`);
      return (await res.json()) as ToolCall[];
    },
    enabled: !!conversationId,
  });
}
