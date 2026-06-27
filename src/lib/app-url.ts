const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.rofiant.ca";

const CHAT_ORIGIN =
  process.env.NEXT_PUBLIC_CHAT_URL ?? "https://chat.rofiant.ca";

export function appUrl(path: string): string {
  if (process.env.NODE_ENV === "development") return path;
  return `${APP_ORIGIN}${path}`;
}

export function chatUrl(path = ""): string {
  if (process.env.NODE_ENV === "development") return `/chat${path}`;
  return `${CHAT_ORIGIN}${path}`;
}
