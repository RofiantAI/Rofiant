import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

interface ConnectionStatus {
  anthropic_oauth: boolean;
  openai_api_key: boolean;
  gemini_api_key: boolean;
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

export function useOpenAIKey() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async (apiKey: string) => {
      await apiFetch("/api/providers/openai/key", {
        method: "POST",
        body: JSON.stringify({ api_key: apiKey }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/providers/openai", { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });

  return { save, disconnect };
}

export function useGeminiKey() {
  const queryClient = useQueryClient();

  const save = useMutation({
    mutationFn: async (apiKey: string) => {
      await apiFetch("/api/providers/gemini/key", {
        method: "POST",
        body: JSON.stringify({ api_key: apiKey }),
      });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });

  const disconnect = useMutation({
    mutationFn: async () => {
      await apiFetch("/api/providers/gemini", { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["provider-status"] }),
  });

  return { save, disconnect };
}
