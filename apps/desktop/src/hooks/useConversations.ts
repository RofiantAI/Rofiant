import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/lib/supabase";
import { apiFetch } from "@/lib/api";
import { DEFAULT_PERSONA } from "@/lib/personas";
import type { Conversation, ConversationWithLastMessage } from "@/types/chat";

export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("conversations")
        .select("*, messages(content, role, created_at)")
        .order("updated_at", { ascending: false })
        .order("created_at", { referencedTable: "messages", ascending: false })
        .limit(1, { referencedTable: "messages" });
      if (error) throw error;
      return data as ConversationWithLastMessage[];
    },
  });
}

export function useCreateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      title,
      persona = DEFAULT_PERSONA,
      personas,
    }: {
      title: string;
      persona?: string;
      personas?: string[];
    }) => {
      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      const userId = userData.user?.id;
      if (!userId) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("conversations")
        .insert({ user_id: userId, title, persona, personas: personas ?? null })
        .select()
        .single();
      if (error) throw error;
      return data as Conversation;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useUpdateConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      ...patch
    }: {
      id: string;
      title?: string;
      pinned?: boolean;
      persona?: string;
      personas?: string[] | null;
      subtitle?: string | null;
      description?: string | null;
      notifications_enabled?: boolean;
    }) => {
      const { error } = await supabase.from("conversations").update(patch).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      // Best-effort: kill the sandbox before the row goes away, otherwise it
      // leaks (nothing else destroys it). Deletion proceeds even if this fails.
      await apiFetch(`/api/workspaces/${id}`, { method: "DELETE" }).catch(() => {});
      const { error } = await supabase.from("conversations").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    },
  });
}
