import { useEffect, useRef, useState, type FormEvent } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuthStore } from "@/stores/useAuthStore";
import type { Message } from "@/types/chat";

export type FeedbackRating = "up" | "down";

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const REASONS = {
  up: ["Solved my task", "Followed my instructions", "Good output quality", "Fast and efficient", "Useful autonomy", "Other"],
  down: ["Didn't solve my task", "Didn't follow my instructions", "Incorrect output", "Too slow", "Too much autonomy", "Other"],
} as const;

export function FeedbackModal({
  rating,
  message,
  onClose,
}: {
  rating: FeedbackRating;
  message: Message;
  onClose: () => void;
}) {
  const email = useAuthStore((state) => state.user?.email ?? "");
  const [selected, setSelected] = useState<string[]>([]);
  const [details, setDetails] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "sent" | "error">("idle");
  const previousFocus = useRef(document.activeElement as HTMLElement | null);

  useEffect(() => () => previousFocus.current?.focus(), []);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  function toggleReason(reason: string) {
    setSelected((current) => current.includes(reason)
      ? current.filter((item) => item !== reason)
      : [...current, reason]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const accessKey = import.meta.env.VITE_WEB3FORMS_ACCESS_KEY;
    if (!accessKey) {
      setStatus("error");
      return;
    }

    setSubmitting(true);
    setStatus("idle");
    try {
      const response = await fetch(WEB3FORMS_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          access_key: accessKey,
          subject: `Rofiant AI response feedback: ${rating === "up" ? "Helpful" : "Unhelpful"}`,
          from_name: "Rofiant desktop app",
          email,
          rating: rating === "up" ? "Helpful" : "Unhelpful",
          reasons: selected.join(", ") || "No reason selected",
          details: details.trim() || "No details provided",
          message_id: message.id,
          conversation_id: message.conversation_id,
          ai_response: message.content.slice(0, 6000),
        }),
      });
      const result = (await response.json()) as { success?: boolean };
      if (!response.ok || !result.success) throw new Error("Web3Forms rejected the request");
      setStatus("sent");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="feedback-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ));
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        className="w-full max-w-xl rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between gap-4">
          <h2 id="feedback-title" className="text-lg font-semibold text-foreground">Share feedback</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close feedback form"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {status === "sent" ? (
          <div className="mt-5 space-y-4">
            <p role="status" className="text-sm text-foreground">Thanks. Your feedback was sent.</p>
            <div className="flex justify-end"><Button autoFocus onClick={onClose}>Done</Button></div>
          </div>
        ) : (
          <form onSubmit={submit} className="mt-5 space-y-4">
            <div className="flex flex-wrap gap-2">
              {REASONS[rating].map((reason) => (
                <button
                  key={reason}
                  type="button"
                  aria-pressed={selected.includes(reason)}
                  onClick={() => toggleReason(reason)}
                  className={cn(
                    "rounded-full border border-border px-3 py-1.5 text-sm transition-colors hover:bg-accent",
                    selected.includes(reason) && "border-primary bg-accent text-foreground",
                  )}
                >
                  {selected.includes(reason) ? "✓" : "+"} {reason}
                </button>
              ))}
            </div>
            <textarea
              autoFocus
              value={details}
              onChange={(event) => setDetails(event.target.value)}
              rows={6}
              placeholder="Share details (optional)"
              aria-label="Feedback details"
              className="w-full resize-y rounded-xl border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
            />
            <p className="text-xs text-muted-foreground">Your feedback is sent to the Rofiant team.</p>
            {status === "error" && (
              <p role="alert" className="text-sm text-destructive">Couldn't send your feedback. Please try again.</p>
            )}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Sending..." : "Submit"}
            </Button>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
}
