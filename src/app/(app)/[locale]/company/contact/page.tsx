"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/page-layout";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Briefcase,
  Headphones,
  Handshake,
  Send,
  Mail,
  MapPin,
} from "lucide-react";
import { useState } from "react";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

type SubmitStatus = "idle" | "sending" | "sent" | "error";

export default function ContactPage() {
  const t = useTranslations("company.contact");
  const [formFocused, setFormFocused] = useState<string | null>(null);
  const [category, setCategory] = useState("General");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<SubmitStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  const contacts = [
    { key: "sales", icon: Briefcase, color: "text-accent-primary" },
    { key: "support", icon: Headphones, color: "text-accent-secondary" },
    { key: "partnerships", icon: Handshake, color: "text-accent-success" },
  ] as const;

  function focusForm(topic: string) {
    setCategory(topic);
    setSubject((prev) => prev || `${topic} ${t("inquirySuffix")}`);
    document
      .getElementById("contact-form")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <PageLayout badge={t("badge")} title={t("title")} subtitle={t("subtitle")}>
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-2">
        <div className="space-y-6">
          {contacts.map((c) => {
            const Icon = c.icon;

            return (
              <Card key={c.key} variant="bordered" className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground">
                      {t(`contacts.${c.key}.title`)}
                    </h3>
                    <p className="mt-2 text-sm text-foreground-secondary">
                      {t(`contacts.${c.key}.desc`)}
                    </p>
                    <Button
                      variant="outline"
                      className="mt-4"
                      onClick={() => focusForm(t(`contacts.${c.key}.title`))}
                    >
                      {t(`contacts.${c.key}.action`)}
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}

          <div className="mt-8 p-6  bg-background-tertiary">
            <h3 className="font-semibold text-foreground mb-4 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              {t("otherWays")}
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm text-foreground-secondary">
                <Mail className="w-4 h-4 text-foreground-muted" />
                support@rofiant.ca
              </div>
            </div>
          </div>
        </div>

        <div
          id="contact-form"
          className="rounded-xl border border-border bg-card p-8 hover:border-border-light transition-colors"
        >
          <h3 className="font-semibold text-foreground mb-6 flex items-center gap-2">
            <Send className="w-4 h-4" />
            {t("form.heading")}
          </h3>
          {status === "sent" ? (
            <p className="text-sm text-accent-success">
              {t("form.sentMessage")}
            </p>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div>
                <label className="text-sm text-foreground-secondary block mb-1">
                  {t("form.name")}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={`w-full border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
                    formFocused === "name"
                      ? "border-accent-secondary"
                      : "border-border"
                  }`}
                  onFocus={() => setFormFocused("name")}
                  onBlur={() => setFormFocused(null)}
                />
              </div>
              <div>
                <label className="text-sm text-foreground-secondary block mb-1">
                  {t("form.email")}
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full  border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
                    formFocused === "email"
                      ? "border-accent-secondary"
                      : "border-border"
                  }`}
                  onFocus={() => setFormFocused("email")}
                  onBlur={() => setFormFocused(null)}
                />
              </div>
              <div>
                <label className="text-sm text-foreground-secondary block mb-1">
                  {t("form.subject")}
                </label>
                <input
                  type="text"
                  required
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className={`w-full  border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none transition-colors ${
                    formFocused === "subject"
                      ? "border-accent-secondary"
                      : "border-border"
                  }`}
                  onFocus={() => setFormFocused("subject")}
                  onBlur={() => setFormFocused(null)}
                />
              </div>
              <div>
                <label className="text-sm text-foreground-secondary block mb-1">
                  {t("form.message")}
                </label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className={`w-full  border bg-background-tertiary px-4 py-2.5 text-sm text-foreground outline-none resize-none transition-colors ${
                    formFocused === "message"
                      ? "border-accent-secondary"
                      : "border-border"
                  }`}
                  onFocus={() => setFormFocused("message")}
                  onBlur={() => setFormFocused(null)}
                />
              </div>
              <TurnstileWidget onVerify={setTurnstileToken} />
              {error && <p className="text-sm text-red-400">{error}</p>}
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
