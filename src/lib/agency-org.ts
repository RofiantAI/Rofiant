import type { SupabaseClient } from "@supabase/supabase-js";
import { getOwnedAgency } from "@/lib/agency-broadcast";

export function isOrgPlan(plan: string): boolean {
  return plan === "agency" || plan === "enterprise";
}

export async function getOrgAgencyForUser(
  supabase: SupabaseClient,
  userId: string,
) {
  return getOwnedAgency(supabase, userId);
}

export function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function toCsv(headers: string[], rows: string[][]): string {
  const lines = [
    headers.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];
  return lines.join("\n");
}
