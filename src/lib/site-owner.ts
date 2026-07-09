export function getSiteOwnerEmails(): string[] {
  return (process.env.SITE_OWNER_EMAILS ?? "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean);
}

export function isSiteOwner(email: string | undefined | null): boolean {
  if (!email) return false;
  return getSiteOwnerEmails().includes(email.toLowerCase());
}
