"use client";

import { useState } from "react";

export function ExportDataButton({ label, loadingLabel }: { label: string; loadingLabel: string }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      const filename = match?.[1] ?? "rofiant-export.json";

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={loading}
      className="shrink-0 inline-flex items-center gap-2 h-8 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors disabled:opacity-50 disabled:pointer-events-none"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}
