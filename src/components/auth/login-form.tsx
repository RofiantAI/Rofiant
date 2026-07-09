"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { appUrl } from "@/lib/app-url";
import { Link } from "@/i18n/navigation";
import { PasswordInput } from "@/components/ui/password-input";
import { Spinner } from "@/components/ui/spinner";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [ssoDomain, setSsoDomain] = useState<string | null>(null);
  const [resetMode, setResetMode] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  useEffect(() => {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) {
      setSsoDomain(null);
      return;
    }

    const timer = window.setTimeout(async () => {
      const res = await fetch(`/api/auth/sso-domain?email=${encodeURIComponent(normalized)}`);
      const data = await res.json().catch(() => ({}));
      setSsoDomain(data.available && data.domain ? data.domain : null);
    }, 300);

    return () => window.clearTimeout(timer);
  }, [email]);

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(appUrl("/dashboard"))}`,
      },
    });
    if (error) {
      setError(error.message);
      setGoogleLoading(false);
    }
  };

  const handleSsoLogin = async () => {
    if (!ssoDomain) return;
    setError(null);
    setSsoLoading(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithSSO({
      domain: ssoDomain,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(appUrl("/dashboard"))}`,
      },
    });
    if (error) {
      setError(error.message);
      setSsoLoading(false);
      return;
    }
    if (data?.url) {
      window.location.href = data.url;
      return;
    }
    setError("Organization SSO is not configured for this domain yet.");
    setSsoLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
      options: { captchaToken: turnstileToken ?? undefined },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    window.location.href = appUrl("/dashboard");
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResetLoading(true);

    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(appUrl("/dashboard/settings"))}`;

    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, turnstileToken, redirectTo }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : "Could not send reset email");
      setResetLoading(false);
      return;
    }

    setResetSent(true);
    setResetLoading(false);
  };

  if (resetSent) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-normal text-foreground mb-2">Check your email</h1>
        <p className="text-sm text-foreground-muted">
          If an account exists for{" "}
          <span className="text-foreground font-medium">{email}</span>, we sent a reset link.
        </p>
        <button
          type="button"
          onClick={() => {
            setResetSent(false);
            setResetMode(false);
            setError(null);
          }}
          className="mt-6 text-sm text-foreground hover:text-foreground-secondary transition-colors font-medium"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  if (resetMode) {
    return (
      <div>
        <h1 className="text-2xl font-normal text-foreground mb-1">Reset password</h1>
        <p className="text-sm text-foreground-muted mb-8">
          Enter your email and we&apos;ll send a reset link.
        </p>

        <form onSubmit={handleResetPassword} className="space-y-5">
          <div>
            <label
              htmlFor="reset-email"
              className="block text-sm font-medium text-foreground-secondary mb-2"
            >
              Email
            </label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full h-10 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
            />
          </div>

          <TurnstileWidget onVerify={setTurnstileToken} />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={resetLoading || !turnstileToken}
            className="w-full h-10 flex items-center justify-center gap-2 bg-button-primary text-button-primary-foreground font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            {resetLoading && <Spinner size="sm" />}
            {resetLoading ? "Sending..." : "Send reset link"}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setResetMode(false);
            setError(null);
          }}
          className="mt-6 w-full text-center text-sm text-foreground-muted hover:text-foreground transition-colors"
        >
          Back to sign in
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-normal text-foreground mb-1">
        Welcome back
      </h1>
      <p className="text-sm text-foreground-muted mb-8">
        Sign in to your account
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-foreground-secondary mb-2"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            className="w-full h-10 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-foreground-secondary mb-2"
          >
            Password
          </label>
          <PasswordInput
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            autoComplete="current-password"
            className="w-full h-10 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50 focus:border-accent-primary transition-colors"
          />
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={() => {
              setResetMode(true);
              setError(null);
            }}
            className="text-xs text-foreground-muted hover:text-foreground transition-colors"
          >
            Forgot password?
          </button>
        </div>

        <TurnstileWidget onVerify={setTurnstileToken} />

        {error && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading || !turnstileToken}
          className="w-full h-10 flex items-center justify-center gap-2 bg-button-primary text-button-primary-foreground font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {loading && <Spinner size="sm" />}
          {loading ? "Signing in..." : "Sign in"}
        </button>
      </form>

      <div className="mt-5 flex items-center gap-3">
        <div className="flex-1 h-px bg-border" />
        <span className="text-xs text-foreground-muted">or</span>
        <div className="flex-1 h-px bg-border" />
      </div>

      <button
        type="button"
        onClick={handleGoogleLogin}
        disabled={googleLoading || loading || ssoLoading}
        className="mt-4 w-full h-10 flex items-center justify-center gap-2 border border-border bg-background-secondary text-sm text-foreground font-medium hover:bg-background-secondary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
      >
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
          <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
          <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
          <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
        </svg>
        {googleLoading && <Spinner size="sm" />}
        {googleLoading ? "Redirecting..." : "Continue with Google"}
      </button>

      {ssoDomain && (
        <button
          type="button"
          onClick={handleSsoLogin}
          disabled={ssoLoading || loading || googleLoading}
          className="mt-3 w-full h-10 flex items-center justify-center gap-2 border border-border bg-background-secondary text-sm text-foreground font-medium hover:bg-background-secondary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
        >
          {ssoLoading && <Spinner size="sm" />}
          {ssoLoading ? "Redirecting..." : `Continue with organization SSO (${ssoDomain})`}
        </button>
      )}

      <p className="mt-6 text-center text-sm text-foreground-muted">
        Don&apos;t have an account?{" "}
        <Link
          href="/auth/signup"
          className="text-foreground hover:text-foreground-secondary transition-colors font-medium"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}
