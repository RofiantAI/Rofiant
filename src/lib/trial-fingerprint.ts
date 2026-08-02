import { createHash, randomUUID } from "node:crypto";
import type { NextRequest, NextResponse } from "next/server";

// Device id is attacker-controlled (it's a cookie value), so it's validated
// as a UUID before ever being used in a query or trusted as a real device.
const DEVICE_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DEVICE_COOKIE = "rf_device_id";
const DEVICE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function getClientIp(req: NextRequest): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}

// Hashed with a server-only salt so we never persist a raw IP address.
export function hashIp(ip: string | null): string | null {
  if (!ip) return null;
  const salt = process.env.TRIAL_FINGERPRINT_SALT ?? "";
  return createHash("sha256").update(`${ip}:${salt}`).digest("hex");
}

export function getOrCreateDeviceId(req: NextRequest): { deviceId: string; isNew: boolean } {
  const existing = req.cookies.get(DEVICE_COOKIE)?.value;
  if (existing && DEVICE_ID_RE.test(existing)) {
    return { deviceId: existing, isNew: false };
  }
  return { deviceId: randomUUID(), isNew: true };
}

export function setDeviceCookie(res: NextResponse, deviceId: string) {
  res.cookies.set(DEVICE_COOKIE, deviceId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: DEVICE_COOKIE_MAX_AGE,
    path: "/",
  });
}

// Builds a PostgREST `.or()` filter matching either signal. Both values are
// already validated/hashed by this point, so they're safe to interpolate.
export function buildTrialClaimFilter(deviceId: string | null, ipHash: string | null): string | null {
  const clauses = [
    deviceId ? `device_id.eq.${deviceId}` : null,
    ipHash ? `ip_hash.eq.${ipHash}` : null,
  ].filter((clause): clause is string => clause !== null);
  return clauses.length ? clauses.join(",") : null;
}
