"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { appUrl } from "@/lib/app-url";
import { Link } from "@/i18n/navigation";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { ErrorBanner } from "@/components/ui/error-banner";
import { Spinner } from "@/components/ui/spinner";

export function ResetPasswordForm() {
  const [checking, setChecking] = useState(true);
  const [validSession, setValidSession] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data }) => {
      setValidSession(!!data.session);
      setChecking(false);
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setDone(true);
    setLoading(false);
    setTimeout(() => {
      window.location.href = appUrl("/dashboard");
    }, 1500);
  };

  if (checking) {
    return null;
  }

  if (!validSession) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-normal text-foreground mb-2">Link expired</h1>
        <p className="text-sm text-foreground-muted">
          This password reset link is invalid or has expired. Request a new one from the sign-in page.
        </p>
        <Link
          href="/auth/login"
          className="mt-6 inline-block text-sm text-foreground hover:text-foreground-secondary transition-colors font-medium"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-normal text-foreground mb-2">Password updated</h1>
        <p className="text-sm text-foreground-muted">Taking you to your dashboard...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-normal text-foreground mb-1">Set a new password</h1>
      <p className="text-sm text-foreground-muted mb-8">
        Choose a new password for your account.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <FloatingLabelInput
          id="new-password"
          label="New password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="new-password"
          required
        />

        <FloatingLabelInput
          id="confirm-password"
          label="Confirm password"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          autoComplete="new-password"
          required
        />

        {error && <ErrorBanner>{error}</ErrorBanner>}

        <button
          type="submit"
          disabled={loading}
          className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-button-primary text-button-primary-foreground font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading && <Spinner size="sm" />}
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
