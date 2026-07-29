"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { appUrl } from "@/lib/app-url";
import { Spinner } from "@/components/ui/spinner";

export function MfaChallengeForm() {
  const [factorId, setFactorId] = useState<string | null>(null);
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data, error }) => {
      if (error) {
        setError(error.message);
        setChecking(false);
        return;
      }
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (!verified) {
        window.location.href = appUrl("/chat");
        return;
      }
      setFactorId(verified.id);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!factorId) return;
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId,
      code,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = appUrl("/chat");
  };

  if (checking) {
    return (
      <div className="flex items-center gap-2 text-sm text-foreground-muted">
        <Spinner size="sm" />
        Checking your account…
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-normal text-foreground mb-1">
        Two-factor authentication
      </h1>
      <p className="text-sm text-foreground-muted mb-8">
        Enter the 6-digit code from your authenticator app
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="code"
            className="block text-sm font-medium text-foreground-secondary mb-2"
          >
            Verification code
          </label>
          <input
            id="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            placeholder="123456"
            required
            autoFocus
            className="w-full h-10 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors tracking-widest text-center"
          />
        </div>

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || code.length !== 6}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-button-primary text-button-primary-foreground font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading && <Spinner size="sm" />}
          {loading ? "Verifying..." : "Verify"}
        </button>
      </form>
    </div>
  );
}
