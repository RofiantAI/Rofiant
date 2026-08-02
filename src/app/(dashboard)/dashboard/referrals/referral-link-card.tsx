"use client";

import { useState } from "react";
import { Check, Copy } from "lucide-react";
import { DashboardCard } from "@/components/dashboard/ui/page-shell";

export function ReferralLinkCard({
  link,
  label,
  description,
  copyLabel,
  copiedLabel,
}: {
  link: string;
  label: string;
  description: string;
  copyLabel: string;
  copiedLabel: string;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <DashboardCard className="lg:col-span-1 flex flex-col">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted mb-2">{label}</p>
      <p className="text-sm text-foreground-secondary mb-4">{description}</p>
      <div className="mt-auto flex items-center gap-2">
        <input
          readOnly
          value={link}
          onFocus={(e) => e.currentTarget.select()}
          className="flex-1 min-w-0 h-9 px-3 rounded-lg border border-border bg-background-secondary text-xs font-mono text-foreground-secondary truncate focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary"
        />
        <button
          type="button"
          onClick={handleCopy}
          className="inline-flex items-center justify-center gap-1.5 h-9 px-3 shrink-0 rounded-lg text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? copiedLabel : copyLabel}
        </button>
      </div>
    </DashboardCard>
  );
}
