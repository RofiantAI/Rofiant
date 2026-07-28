"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("offline", callback);
  window.addEventListener("online", callback);
  return () => {
    window.removeEventListener("offline", callback);
    window.removeEventListener("online", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function OfflineToast() {
  const isOnline = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [prevIsOnline, setPrevIsOnline] = useState(isOnline);
  const [justReconnected, setJustReconnected] = useState(false);

  if (isOnline !== prevIsOnline) {
    setPrevIsOnline(isOnline);
    setJustReconnected(isOnline);
  }

  useEffect(() => {
    if (!justReconnected) return;
    const timer = setTimeout(() => setJustReconnected(false), 3000);
    return () => clearTimeout(timer);
  }, [justReconnected]);

  const status = !isOnline ? "offline" : justReconnected ? "online" : null;

  if (!status) return null;

  const isOffline = status === "offline";

  return (
    <div
      key={status}
      className="fixed right-6 z-50 flex items-center gap-3 border border-border-light bg-background-secondary shadow-lg px-5 py-3"
      style={{
        bottom: "calc(1.5rem + var(--cookie-banner-height, 0px))",
        animation: "toast-in 0.3s ease-out",
      }}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${isOffline ? "bg-red-500" : "bg-green-500"}`} />
      <p className="text-sm font-medium text-foreground">
        {isOffline ? "You're not connected to the internet" : "You're back online"}
      </p>
    </div>
  );
}
