"use client";

import { Turnstile, type TurnstileInstance } from "@marsidev/react-turnstile";
import { forwardRef } from "react";

export const TurnstileWidget = forwardRef<TurnstileInstance, { onVerify: (token: string) => void }>(
  function TurnstileWidget({ onVerify }, ref) {
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
    if (!siteKey) return null;

    return (
      <Turnstile
        ref={ref}
        siteKey={siteKey}
        onSuccess={onVerify}
        options={{ size: "flexible" }}
      />
    );
  },
);
