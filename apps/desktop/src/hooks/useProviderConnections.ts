import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface ConnectionStatus {
  anthropic_oauth: boolean;
  openai_api_key: boolean;
  gemini_api_key: boolean;
  custom_provider: boolean;
  custom_provider_base_url: string | null;
  custom_provider_model: string | null;
}

interface AnthropicAuthStart {
  authorize_url: string;
  code_verifier: string;
}

export function useProviderStatus() {
  return useQuery({
    queryKey: ["provider-status"],
    queryFn: async () => {
      const res = await apiFetch("/api/providers/status");
      return (await res.json()) as ConnectionStatus;
    },
  });
}

export function useAnthropicOAuth() {
  const queryClient = useQueryClient();

  const start = useMutation({
    mutationFn: async () => {
      const res = await apiFetch("/api/providers/anthropic/start", { method: "POST" });
      return (await res.json()) as AnthropicAuthStart;
    },
  });

  const exchange = useMutation({
    mutationFn: async ({ code, codeVerifier }: { code: string; codeVerifier: string }) => {
      await apiFetch("/api/providers/anthropic/exchange", {
        method: "POST",
        body: JSON.stringify({ code, code_verifier: codeVerifier }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/providers/anthropic", { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });

  return { start, exchange, disconnect };
}

export function useDeleteProviderKey(provider: "openai" | "gemini" | "custom") {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch(`/api/providers/${provider}`, { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });
}

export function useSaveCustomProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (body: { base_url: string; api_key: string; model: string }) =>
      apiFetch("/api/providers/custom", { method: "POST", body: JSON.stringify(body) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });
}
