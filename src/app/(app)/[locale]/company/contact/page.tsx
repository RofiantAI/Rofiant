"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { ErrorBanner } from "@/components/ui/error-banner";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Send } from "lucide-react";
import { useState } from "react";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

type SubmitStatus = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const t = useTranslations("company.contact");
  const [category] = useState("General");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

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
        category,
        turnstileToken,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Something went wrong. Please try again.");
      setStatus("error");
      return;
    }

    setStatus("sent");
    setName("");
    setEmail("");
    setSubject("");
    setMessage("");
  }

  return (
    <PageLayout badge={t("badge")} title={t("title")} subtitle={t("subtitle")} compact>
      <div className="max-w-xl mx-auto">
        <div
          id="contact-form"
          className="rounded-xl border border-border bg-card p-8 hover:border-border-light transition-colors"
        >
          <div className="mb-6 flex items-center justify-between gap-4">
            <h3 className="font-semibold text-foreground flex items-center gap-2">
              <Send className="w-4 h-4" />
              {t("form.heading")}
            </h3>
            <a
              href="mailto:support@rofiant.ca"
              className="text-sm text-foreground-secondary hover:text-foreground transition-colors whitespace-nowrap"
            >
              support@rofiant.ca
            </a>
          </div>
          {status === "sent" ? (
            <p className="text-sm text-accent-success">
              {t("form.sentMessage")}
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <FloatingLabelInput
                id="contact-name"
                label={t("form.name")}
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <FloatingLabelInput
                id="contact-email"
                label={t("form.email")}
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <FloatingLabelInput
                id="contact-subject"
                label={t("form.subject")}
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <div>
                <label htmlFor="contact-message" className="text-sm text-foreground-secondary block mb-1">
                  {t("form.message")}
                </label>
                <textarea
                  id="contact-message"
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background-secondary px-3 py-2.5 text-sm text-foreground outline-none resize-none transition-[border-color,box-shadow] duration-300 ease-out focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary"
                />
              </div>
              <TurnstileWidget onVerify={setTurnstileToken} />
              {error && <ErrorBanner>{error}</ErrorBanner>}
              <Button
                type="submit"
                disabled={status === "sending" || !turnstileToken}
                className="w-full"
              >
                {status === "sending" ? t("form.sending") : t("form.send")}
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
