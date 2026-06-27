export function getLanguage(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem("pref_language") ?? "en";
}

export function getTimezone(): string {
  if (typeof window === "undefined") return Intl.DateTimeFormat().resolvedOptions().timeZone;
  return localStorage.getItem("pref_timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatDate(iso: string, options?: Intl.DateTimeFormatOptions): string {
  return new Date(iso).toLocaleDateString(getLanguage(), {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: getTimezone(),
    ...options,
  });
}

export function formatTime(date: Date = new Date(), options?: Intl.DateTimeFormatOptions): string {
  return date.toLocaleTimeString(getLanguage(), {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: getTimezone(),
    ...options,
  });
}
