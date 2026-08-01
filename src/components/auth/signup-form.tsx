"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { createClient } from "@/lib/supabase/client";
import { appUrl } from "@/lib/app-url";
import { Link } from "@/i18n/navigation";
import { FloatingLabelInput } from "@/components/ui/floating-label-input";
import { Spinner } from "@/components/ui/spinner";
import { TurnstileWidget } from "@/components/ui/turnstile-widget";

const MAX_AGE = 120;
const MINOR_AGE = 18;

// Signup opened from the desktop app (see ROFIANT_SIGNUP_URL in
// rofiant-desktop's src/lib/auth-redirect.ts) carries this marker so the
// post-confirmation redirect hands the session back to the app's custom URL
// scheme instead of landing in the web dashboard.
const DESKTOP_REDIRECT = "rofiant://auth-callback";

export function SignupForm() {
  const t = useTranslations("auth.signup");
  const searchParams = useSearchParams();
  const isDesktopClient = searchParams.get("client") === "desktop";
  const [step, setStep] = useState<1 | 2>(1);
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogleSignup = async () => {
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

  const handleEmailContinue = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setStep(2);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const parsedAge = Number.parseInt(age, 10);
    if (!Number.isFinite(parsedAge) || parsedAge < 1 || parsedAge > MAX_AGE) {
      setError(t("errors.invalidAge"));
      return;
    }

    const isMinor = parsedAge < MINOR_AGE;
    if (!isMinor && !name.trim()) {
      setError(t("errors.nameRequired"));
      return;
    }

    if (password !== confirmPassword) {
      setError(t("errors.passwordMismatch"));
      return;
    }

    setLoading(true);

    const next = isDesktopClient ? DESKTOP_REDIRECT : appUrl("/dashboard");
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        name,
        age: parsedAge,
        turnstileToken,
        redirectTo,
      }),
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      setError(typeof data.error === "string" ? data.error : t("errors.createFailed"));
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <div className="text-center">
        <h1 className="text-2xl font-normal text-foreground mb-2">
          {t("checkEmailTitle")}
        </h1>
        <p className="text-sm text-foreground-muted">
          {t("checkEmailBody", { email })}
        </p>
      </div>
    );
  }

  const termsLink = (chunks: React.ReactNode) => (
    <Link
      href="/legal/terms-of-service"
      className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors"
    >
      {chunks}
    </Link>
  );

  const parsedAgePreview = Number.parseInt(age, 10);
  const showMinorNotice =
    age.trim() !== "" && Number.isFinite(parsedAgePreview) && parsedAgePreview < MINOR_AGE;
  const nameRequired = !showMinorNotice;

  const privacyLink = (chunks: React.ReactNode) => (
    <Link
      href="/legal/privacy-policy"
      className="text-foreground underline underline-offset-2 hover:text-foreground-secondary transition-colors"
    >
      {chunks}
    </Link>
  );

  return (
    <div>
      <h1 className="text-2xl font-normal text-foreground mb-1">
        {step === 1 ? t("stepEmailTitle") : t("stepDetailsTitle")}
      </h1>
      <p className="text-sm text-foreground-muted mb-8">
        {step === 1 ? t("stepEmailSubtitle") : t("stepDetailsSubtitle", { email })}
      </p>

      {step === 1 ? (
        <>
          <form onSubmit={handleEmailContinue} className="space-y-5">
            <FloatingLabelInput
              id="email"
              label={t("email")}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
              autoFocus
            />

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
                {error}
              </div>
            )}

            <button
              type="submit"
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-button-primary text-button-primary-foreground font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {t("continue")}
            </button>
          </form>

          <div className="mt-5 flex items-center gap-3">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-foreground-muted">{t("or")}</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignup}
            disabled={googleLoading}
            className="mt-4 w-full h-10 flex items-center justify-center gap-2 rounded-lg border border-border bg-background-secondary text-sm text-foreground font-medium hover:bg-background-secondary/80 transition-colors disabled:opacity-50 disabled:pointer-events-none"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 01-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z" fill="#34A853"/>
              <path d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            {googleLoading && <Spinner size="sm" />}
            {googleLoading ? t("googleLoading") : t("google")}
          </button>
        </>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <FloatingLabelInput
            id="name"
            label={t("name")}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required={nameRequired}
            autoComplete="name"
            autoFocus
          />

          <FloatingLabelInput
            id="age"
            label={t("age")}
            type="number"
            inputMode="numeric"
            min={1}
            max={MAX_AGE}
            value={age}
            onChange={(e) => setAge(e.target.value)}
            required
          />

          {showMinorNotice ? (
            <p className="text-xs text-foreground-muted leading-relaxed border border-border bg-background-secondary px-3 py-2">
              {t("minorNotice")}
            </p>
          ) : null}

          <FloatingLabelInput
            id="password"
            label={t("password")}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <FloatingLabelInput
            id="confirm-password"
            label={t("confirmPassword")}
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
          />

          <TurnstileWidget onVerify={setTurnstileToken} />

          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-sm text-red-400">
              {error}
            </div>
          )}

          <p className="text-xs text-foreground-muted leading-relaxed">
            {t.rich("agreement", { terms: termsLink, privacy: privacyLink })}
          </p>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => {
                setError(null);
                setTurnstileToken(null);
                setStep(1);
              }}
              className="h-10 px-4 rounded-lg border border-border bg-background-secondary text-sm text-foreground font-medium hover:bg-background-secondary/80 transition-colors"
            >
              {t("back")}
            </button>
            <button
              type="submit"
              disabled={loading || !turnstileToken}
              className="flex-1 h-10 flex items-center justify-center gap-2 rounded-lg bg-button-primary text-button-primary-foreground font-medium text-sm hover:bg-foreground/90 transition-colors disabled:opacity-50 disabled:pointer-events-none"
            >
              {loading && <Spinner size="sm" />}
              {loading ? t("creatingAccount") : t("createAccount")}
            </button>
          </div>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-foreground-muted">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/auth/login"
          className="text-foreground hover:text-foreground-secondary transition-colors font-medium"
        >
          {t("signIn")}
        </Link>
      </p>
    </div>
  );
}
