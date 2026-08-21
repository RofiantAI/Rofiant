import { useMutation } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api";

export function useTranscribeAudio() {
  return useMutation({
    mutationFn: async (blob: Blob) => {
      const formData = new FormData();
      formData.append("audio", blob, "recording.webm");
      const res = await apiFetch("/api/transcribe", { method: "POST", body: formData });
      const data = (await res.json()) as { text: string };
      return data.text;
    },
  });
}
