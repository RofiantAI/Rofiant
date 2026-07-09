import { NextResponse } from "next/server";

export const MINOR_AGE_THRESHOLD = 18;

type UserLike = { user_metadata?: Record<string, unknown> | null } | null | undefined;

export function isMinorUser(user: UserLike): boolean {
  return user?.user_metadata?.is_minor === true;
}

export function minorDataCollectionBlockedResponse() {
  return NextResponse.json(
    {
      error:
        "Minor accounts run in limited mode. Rofiant does not collect or store personal data beyond what is required to operate your account.",
    },
    { status: 403 },
  );
}

export function buildMinorSignupMetadata() {
  return {
    is_minor: true,
    data_collection_opt_out: true,
  };
}

export function buildAdultSignupMetadata(name: string, age: number) {
  return {
    is_minor: false,
    full_name: name.trim(),
    age,
  };
}
