"use client";

import { useCallback, useEffect, useState } from "react";
import { Megaphone, X } from "lucide-react";

export type AnnouncementItem = {
  id: string;
  title: string;
  body: string;
  variant: "info" | "warning" | "critical";
};

const STORAGE_KEY = "rofiant_dismissed_announcements";
const POLL_MS = 15_000;

function getDismissed(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

function dismiss(id: string) {
  const next = getDismissed();
  next.add(id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify([...next]));
}

const variantStyles = {
  info: "bg-accent-primary/10 border-accent-primary/30 text-foreground",
  warning: "bg-orange-500/10 border-orange-500/30 text-orange-200",
  critical: "bg-red-500/10 border-red-500/30 text-red-300",
};

export function AnnouncementBanner({
  announcements: initialAnnouncements = [],
  dismissLabel = "Dismiss",
}: {
  announcements?: AnnouncementItem[];
  dismissLabel?: string;
}) {
  const tDismiss = dismissLabel;
  const [announcements, setAnnouncements] = useState(initialAnnouncements);
  const [visible, setVisible] = useState<AnnouncementItem[]>([]);

  const applyVisible = useCallback((items: AnnouncementItem[]) => {
    const dismissed = getDismissed();
    setVisible(items.filter((a) => !dismissed.has(a.id)));
  }, []);

  useEffect(() => {
    setAnnouncements(initialAnnouncements);
  }, [initialAnnouncements]);

  useEffect(() => {
    applyVisible(announcements);
  }, [announcements, applyVisible]);

  useEffect(() => {
    let cancelled = false;

    async function fetchLive() {
      try {
        const res = await fetch("/api/site/announcements", { cache: "no-store" });
        if (!res.ok || cancelled) return;
        const data = (await res.json()) as AnnouncementItem[];
        if (Array.isArray(data) && !cancelled) {
          setAnnouncements(data);
        }
      } catch {
        /* ignore network errors */
      }
    }

    void fetchLive();
    const interval = window.setInterval(fetchLive, POLL_MS);
    const onFocus = () => void fetchLive();
    window.addEventListener("focus", onFocus);

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      window.removeEventListener("focus", onFocus);
    };
  }, []);

  const handleDismiss = (id: string) => {
    dismiss(id);
    setVisible((prev) => prev.filter((a) => a.id !== id));
  };

  if (visible.length === 0) return null;

  return (
    <div className="border-b border-border">
      {visible.map((item) => (
        <div
          key={item.id}
          className={`flex items-start gap-3 px-4 sm:px-8 py-3 border-b border-border last:border-b-0 ${variantStyles[item.variant]}`}
        >
          <Megaphone className="w-4 h-4 shrink-0 mt-0.5 opacity-80" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{item.title}</p>
            <p className="text-sm opacity-90 mt-0.5 whitespace-pre-wrap">{item.body}</p>
          </div>
          <button
            onClick={() => handleDismiss(item.id)}
            aria-label={tDismiss}
            className="shrink-0 p-1 opacity-70 hover:opacity-100 transition-opacity"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}
