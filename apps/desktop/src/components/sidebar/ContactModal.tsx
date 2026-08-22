import { useEffect, useRef, useState, type FormEvent } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

interface ContactModalProps {
  email?: string;
  onClose: () => void;
}

const WEB3FORMS_ENDPOINT = "https://api.web3forms.com/submit";
const SUPPORT_CATEGORIES = [
  "General question",
  "Technical issue",
  "Account issue",
  "Feedback",
] as const;

export function ContactModal({ email = "", onClose }: ContactModalProps) {
  const [category, setCategory] = useState<(typeof SUPPORT_CATEGORIES)[number]>("General question");
  const [message, setMessage] = useState("");
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
          subject: `Kiro support request: ${category}`,
          from_name: "Kiro desktop app",
          email,
          category,
          message,
        }),
      });
      const result = (await response.json()) as { success?: boolean };
      if (!response.ok || !result.success) throw new Error("Web3Forms rejected the request");
      setStatus("sent");
      setMessage("");
    } catch {
      setStatus("error");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="contact-title"
        onKeyDown={(event) => {
          if (event.key !== "Tab") return;
          const controls = Array.from(event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
          ));
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
          else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
        }}
        className="w-full max-w-md rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 id="contact-title" className="text-lg font-semibold text-foreground">Contact support</h2>
            <p className="mt-1 text-sm text-muted-foreground">Tell us what you need help with.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close contact form"
            className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={submit} className="mt-5 space-y-4">
          <label className="block text-sm text-foreground">
            Email
            <input
              name="email"
              type="email"
              value={email}
              readOnly
              className="mt-1.5 w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-muted-foreground outline-none"
            />
          </label>
          <div className="text-sm text-foreground [&>div]:mt-1.5 [&>div]:flex [&>div]:w-full">
            <span>Category</span>
            <Select
              value={category}
              onChange={(value) => setCategory(value as (typeof SUPPORT_CATEGORIES)[number])}
              ariaLabel="Support category"
              className="w-full justify-between rounded-lg bg-background px-3 py-2"
            >
              {SUPPORT_CATEGORIES.map((option) => (
                <option key={option} value={option}>{option}</option>
              ))}
            </Select>
          </div>
          <label className="block text-sm text-foreground">
            How can we help?
            <textarea
              name="message"
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              required
              autoFocus
              rows={6}
              placeholder="Describe your question or issue..."
              className="mt-1.5 w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-ring"
            />
          </label>

          {status === "sent" && (
            <p role="status" className="text-sm text-emerald-500">Message sent. We'll get back to you by email.</p>
          )}
          {status === "error" && (
            <p role="alert" className="text-sm text-destructive">Couldn't send your message. Please try again.</p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={submitting || !message.trim()}>
              {submitting ? "Sending..." : "Send message"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
