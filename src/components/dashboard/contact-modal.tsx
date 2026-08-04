"use client";

import { useState } from "react";
import { X, Send } from "lucide-react";
import { useTranslations } from "next-intl";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

type SubmitStatus = "idle" | "sending" | "sent" | "error";

export function ContactModal({
  open,
  onClose,
  name,
  email,
}: {
  open: boolean;
  onClose: () => void;
  name: string;
  email?: string;
}) {
  const t = useTranslations("dashboard.contactModal");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  function handleClose() {
    onClose();
    setStatus("idle");
    setSubject("");
    setMessage("");
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("sending");
    setError(null);

    const res = await fetch("/api/contact", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        subject,
        message,
        category: "Support",
        turnstileToken,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? t("genericError"));
      setStatus("error");
      return;
    }

    setStatus("sent");
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={handleClose} />
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-background-secondary shadow-xl">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-sm font-semibold text-foreground">{t("title")}</h2>
          <button
            type="button"
            onClick={handleClose}
            aria-label={t("close")}
            className="text-foreground-muted hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5">
          {status === "sent" ? (
            <div className="py-6 text-center">
              <p className="text-sm font-medium text-foreground">{t("sentTitle")}</p>
              <p className="mt-1 text-sm text-foreground-secondary">{t("sentMessage")}</p>
              <button
                type="button"
                onClick={handleClose}
                className="btn-clay-secondary mt-5 inline-flex h-9 items-center justify-center rounded-full px-4 text-sm"
              >
                {t("close")}
              </button>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <p className="text-sm text-foreground-secondary">{t("subtitle")}</p>
              <div>
                <label className="block mb-1 text-sm text-foreground-secondary">{t("subject")}</label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder={t("subjectPlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-accent-primary transition-colors"
                />
              </div>
              <div>
                <label className="block mb-1 text-sm text-foreground-secondary">{t("message")}</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t("messagePlaceholder")}
                  className="w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted outline-none resize-none focus:border-accent-primary transition-colors"
                />
              </div>
              <TurnstileWidget onVerify={setTurnstileToken} />
              {error && <p className="text-sm text-accent-error">{error}</p>}
              <button
                type="submit"
                disabled={status === "sending" || !turnstileToken}
                className="btn-clay-primary inline-flex w-full h-9 items-center justify-center gap-2 rounded-full text-sm font-medium"
              >
                <Send className="w-4 h-4" />
                {status === "sending" ? t("sending") : t("send")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
