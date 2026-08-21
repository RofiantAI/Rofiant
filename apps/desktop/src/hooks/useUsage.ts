import { useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface UsageTotals {
  input_tokens: number;
  output_tokens: number;
}

interface UsageSummary {
  session: UsageTotals;
  week: UsageTotals;
}

/** Fetched on demand (from the /usage slash command), not a live query — the
 * numbers only need to be current at the moment the user asks. */
export function useUsageFetch() {
  const queryClient = useQueryClient();
  return async (conversationId: string): Promise<UsageSummary> => {
    return queryClient.fetchQuery({
      queryKey: ["usage-summary", conversationId],
      queryFn: async () => {
        const res = await apiFetch(`/api/usage/summary?conversation_id=${conversationId}`);
        return (await res.json()) as UsageSummary;
      },
      staleTime: 0,
    });
  };
}
