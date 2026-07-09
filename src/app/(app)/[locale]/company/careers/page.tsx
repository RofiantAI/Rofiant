"use client";

import { useTranslations } from "next-intl";
import { PageLayout } from "@/components/page-layout";
import { Card } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { Mail } from "lucide-react";
import { useState } from "react";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

export default function CareersPage() {
  const t = useTranslations("company.careers");
  const [email, setEmail] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await fetch("/api/careers/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, turnstileToken }),
      });
      if (!res.ok) throw new Error("failed");
      setStatus("success");
      setEmail("");
    } catch {
      setStatus("error");
    }
  };

  return (
    <PageLayout
      badge={t("badge")}
      title={t("title")}
      subtitle={t("subtitle")}
    >
      <p className="text-foreground-secondary mb-8 text-lg">
        {t("intro")}
      </p>

      <Card variant="bordered" noHover className="p-8 text-center">
        <div className="w-12 h-12 rounded-lg bg-background-tertiary flex items-center justify-center mx-auto mb-4">
          <Mail className="w-5 h-5" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          {t("comingSoon.title")}
        </h3>
        <p className="text-foreground-muted mb-6 max-w-md mx-auto">
          {t("comingSoon.description")}
        </p>

        {status === "success" ? (
          <p className="text-sm text-accent-primary font-medium">{t("comingSoon.success")}</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto"
          >
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={t("comingSoon.emailPlaceholder")}
              required
              disabled={status === "loading"}
              className="flex-1 h-10 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading" || !turnstileToken}
              className="h-10 px-5 flex items-center justify-center gap-2 bg-button-primary text-button-primary-foreground font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none whitespace-nowrap"
            >
              {status === "loading" && <Spinner size="sm" />}
              {status === "loading" ? t("comingSoon.submitting") : t("comingSoon.submit")}
            </button>
          </form>
        )}
        {status !== "success" && (
          <div className="mt-4 flex justify-center">
            <TurnstileWidget onVerify={setTurnstileToken} />
          </div>
        )}

        {status === "error" && (
          <p className="mt-3 text-sm text-red-400">{t("comingSoon.error")}</p>
        )}
      </Card>
    </PageLayout>
  );
}
