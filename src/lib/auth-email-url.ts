const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;

export type AuthEmailActionType =
  | "signup"
  | "invite"
  | "magiclink"
  | "recovery"
  | "email_change"
  | "email"
  | "reauthentication";

export function buildAuthVerifyUrl({
  tokenHash,
  actionType,
  redirectTo,
}: {
  tokenHash: string;
  actionType: string;
  redirectTo: string;
}) {
  const params = new URLSearchParams({
    token: tokenHash,
    type: actionType,
    redirect_to: redirectTo,
  });
  return `${SUPABASE_URL}/auth/v1/verify?${params.toString()}`;
}

export function isAuthNotificationOnly(actionType: string) {
  return actionType.endsWith("_notification");
}
