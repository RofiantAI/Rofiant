import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export interface Skill {
  id: string;
  name: string;
  description: string;
  source_url: string;
  created_at: string;
}

export function useSkills() {
  return useQuery({
    queryKey: ["skills"],
    queryFn: async () => {
      const res = await apiFetch("/api/skills");
      return (await res.json()) as Skill[];
    },
  });
}

export function useInstallSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (sourceUrl: string) => {
      const res = await apiFetch("/api/skills", {
        method: "POST",
        body: JSON.stringify({ source_url: sourceUrl }),
      });
      return (await res.json()) as Skill;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skills"] }),
  });
}

export function useDeleteSkill() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiFetch(`/api/skills/${id}`, { method: "DELETE" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["skills"] }),
  });
}
