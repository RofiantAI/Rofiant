"use client";

import { useEffect, useState } from "react";

export function OfflineToast() {
  const [status, setStatus] = useState<"offline" | "online" | null>(null);

  useEffect(() => {
    if (!navigator.onLine) setStatus("offline");

    function handleOffline() {
      setStatus("offline");
    }
    function handleOnline() {
      setStatus("online");
    }

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    if (status !== "online") return;
    const timer = setTimeout(() => setStatus(null), 3000);
    return () => clearTimeout(timer);
  }, [status]);

  if (!status) return null;

  const isOffline = status === "offline";

  return (
    <div
      key={status}
      className="fixed bottom-6 right-6 z-50 flex items-center gap-3 border border-border-light bg-background-secondary shadow-lg px-5 py-3"
      style={{ animation: "toast-in 0.3s ease-out" }}
    >
      <span className={`h-2 w-2 rounded-full shrink-0 ${isOffline ? "bg-red-500" : "bg-green-500"}`} />
      <p className="text-sm font-medium text-foreground">
        {isOffline ? "You're not connected to the internet" : "You're back online"}
      </p>
    </div>
  );
}
