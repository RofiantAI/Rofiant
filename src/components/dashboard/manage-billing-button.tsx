"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

export function ManageBillingButton({
  label,
  loadingLabel,
  className,
}: {
  label: string;
  loadingLabel: string;
  className: string;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function openPortal() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/portal");
      const data = await res.json();
      if (!res.ok || !data.url) {
        throw new Error(data.error ?? "Failed to open billing portal");
      }
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to open billing portal");
      setLoading(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={openPortal} disabled={loading} className={className}>
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            {loadingLabel}
          </>
        ) : (
          label
        )}
      </button>
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
