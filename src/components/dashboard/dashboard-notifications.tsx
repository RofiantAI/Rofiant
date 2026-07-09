"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UserNotification } from "@/lib/user-notifications";

function timeAgo(iso: string, t: ReturnType<typeof useTranslations<"dashboard.notifications">>) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t("justNow");
  if (mins < 60) return t("minutesAgo", { count: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t("hoursAgo", { count: hours });
  const days = Math.floor(hours / 24);
  return t("daysAgo", { count: days });
}

export function DashboardNotifications() {
  const router = useRouter();
  const t = useTranslations("dashboard.notifications");
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      if (!res.ok) return;
      const data = (await res.json()) as {
        notifications: UserNotification[];
        unreadCount: number;
      };
      setNotifications(data.notifications ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchNotifications();
    const interval = window.setInterval(() => void fetchNotifications(), 60_000);
    return () => window.clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    if (!open) return;
    void fetchNotifications();
  }, [open, fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function markRead(id: string) {
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) =>
        n.id === id ? { ...n, read_at: new Date().toISOString() } : n,
      ),
    );
    setUnreadCount((c) => Math.max(0, c - 1));
  }

  async function readAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "read_all" }),
    });
    const now = new Date().toISOString();
    setNotifications((prev) => prev.map((n) => ({ ...n, read_at: n.read_at ?? now })));
    setUnreadCount(0);
  }

  async function clearAll() {
    await fetch("/api/notifications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "clear_all" }),
    });
    setNotifications([]);
    setUnreadCount(0);
  }

  async function openNotification(notification: UserNotification) {
    if (!notification.read_at) await markRead(notification.id);
    setOpen(false);
    if (notification.href) router.push(notification.href);
  }

  return (
    <div ref={containerRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t("ariaLabel")}
        aria-expanded={open}
        className="relative flex items-center justify-center w-11 h-11 rounded-lg border border-border bg-background hover:bg-background-tertiary transition-colors"
      >
        <Bell className="w-5 h-5 text-foreground-secondary" />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent-primary text-[10px] font-semibold text-background flex items-center justify-center">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[calc(100%+8px)] z-50 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-border bg-background-secondary shadow-xl overflow-hidden">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-border">
            <p className="text-sm font-medium text-foreground">{t("title")}</p>
            {notifications.length > 0 && (
              <div className="flex items-center gap-3">
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => void readAll()}
                    className="text-xs font-medium text-accent-primary hover:underline"
                  >
                    {t("readAll")}
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void clearAll()}
                  className="text-xs font-medium text-foreground-muted hover:text-foreground hover:underline"
                >
                  {t("clearAll")}
                </button>
              </div>
            )}
          </div>

          <div className="max-h-[min(400px,60vh)] overflow-y-auto">
            {loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-sm text-foreground-muted text-center">
                {t("loading")}
              </p>
            )}
            {!loading && notifications.length === 0 && (
              <p className="px-4 py-6 text-sm text-foreground-muted text-center">
                {t("empty")}
              </p>
            )}
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => void openNotification(notification)}
                className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-background-tertiary ${
                  notification.read_at ? "opacity-75" : "bg-background-tertiary/40"
                }`}
              >
                <span
                  className={`mt-1.5 w-2 h-2 shrink-0 rounded-full ${
                    notification.read_at ? "bg-transparent" : "bg-accent-primary"
                  }`}
                />
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-foreground truncate">
                    {notification.title}
                  </span>
                  {notification.body && (
                    <span className="block text-xs text-foreground-muted mt-0.5 line-clamp-2">
                      {notification.body}
                    </span>
                  )}
                  <span className="block text-[11px] text-foreground-muted mt-1">
                    {timeAgo(notification.created_at, t)}
                  </span>
                </span>
              </button>
            ))}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-border px-4 py-2">
              <Link
                href="/dashboard/audit-log"
                onClick={() => setOpen(false)}
                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                {t("viewActivity")}
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
