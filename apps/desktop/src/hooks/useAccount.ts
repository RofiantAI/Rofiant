import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { useAuthStore } from "@/stores/useAuthStore";

interface Profile {
  id: string;
  username: string | null;
  avatar_url: string | null;
}

export function useProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, username, avatar_url")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data as Profile;
    },
    enabled: !!userId,
  });
}

export function useUpdateProfile() {
  const userId = useAuthStore((s) => s.user?.id);
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (patch: { username?: string; avatar_url?: string }) => {
      const { error } = await supabase.from("profiles").update(patch).eq("id", userId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["profile", userId] }),
  });
}

export function useDeactivateAccount() {
  return useMutation({
    mutationFn: async () => {
      await apiFetch("/api/account/deactivate", { method: "POST" });
    },
    onSuccess: () => useAuthStore.getState().signOut(),
  });
}

export function useDeleteAccount() {
  return useMutation({
    mutationFn: async () => {
      await apiFetch("/api/account", { method: "DELETE" });
    },
    onSuccess: () => useAuthStore.getState().signOut(),
  });
}
