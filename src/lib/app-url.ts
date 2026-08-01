const APP_ORIGIN =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://app.rofiant.ca";

export function appUrl(path: string): string {
  if (process.env.NODE_ENV === "development") return path;
  return `${APP_ORIGIN}${path}`;
}
