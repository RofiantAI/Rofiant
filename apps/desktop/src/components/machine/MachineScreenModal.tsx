import { useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { useMachineScreen } from "@/hooks/useMachineScreen";

export function MachineScreenModal({ onClose }: { onClose: () => void }) {
  const { url, error } = useMachineScreen(true, 1500);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-8" onClick={onClose}>
      <div
        className="relative max-h-full max-w-4xl overflow-hidden rounded-lg border border-border bg-black shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute right-2 top-2 z-10 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
        >
          <X className="h-4 w-4" />
        </button>
        {error ? (
          <p className="p-8 text-sm text-destructive">{error}</p>
        ) : url ? (
          <img src={url} alt="Cloud computer desktop" className="max-h-[80vh] w-auto" />
        ) : (
          <div className="flex h-96 w-[32rem] items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        )}
      </div>
    </div>
  );
}
