"use client";

import {
  Shield, Bell, Globe, Check, User, Trash2, Palette,
  LogOut, AlertTriangle, Download, Key, Monitor
} from "lucide-react";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

type Tab = "account" | "security" | "notifications" | "preferences" | "appearance" | "danger";

const NOTIF_KEYS = [
  "usage_alerts",
  "security_alerts",
  "product_updates",
  "weekly_digest",
  "api_failures",
  "billing_alerts",
] as const;
type NotifKey = (typeof NOTIF_KEYS)[number];

const NOTIF_LABELS: Record<NotifKey, { label: string; desc: string }> = {
  usage_alerts:    { label: "Usage alerts",    desc: "Notify when approaching plan limits" },
  security_alerts: { label: "Security alerts", desc: "New login detected or API key created" },
  product_updates: { label: "Product updates", desc: "New features and improvements" },
  weekly_digest:   { label: "Weekly digest",   desc: "Summary of your usage each week" },
  api_failures:    { label: "API failures",    desc: "Alert when API requests fail repeatedly" },
  billing_alerts:  { label: "Billing alerts",  desc: "Upcoming renewals and payment issues" },
};

const DEFAULT_NOTIFS: Record<NotifKey, boolean> = {
  usage_alerts: true,
  security_alerts: true,
  product_updates: false,
  weekly_digest: false,
  api_failures: true,
  billing_alerts: true,
};

function loadNotifs(): Record<NotifKey, boolean> {
  if (typeof window === "undefined") return DEFAULT_NOTIFS;
  try {
    const raw = localStorage.getItem("notif_settings");
    return raw ? { ...DEFAULT_NOTIFS, ...JSON.parse(raw) } : DEFAULT_NOTIFS;
  } catch {
    return DEFAULT_NOTIFS;
  }
}

type AccentColor = "yellow" | "blue" | "green" | "purple";
type Density = "compact" | "comfortable" | "spacious";

const ACCENT_COLORS: { id: AccentColor; label: string; value: string }[] = [
  { id: "yellow",  label: "Amber",   value: "#eab308" },
  { id: "blue",    label: "Blue",    value: "#3b82f6" },
  { id: "green",   label: "Green",   value: "#22c55e" },
  { id: "purple",  label: "Purple",  value: "#a855f7" },
];

const DENSITIES: { id: Density; label: string; desc: string }[] = [
  { id: "compact",     label: "Compact",     desc: "Tighter spacing, more on screen" },
  { id: "comfortable", label: "Comfortable", desc: "Balanced — the default" },
  { id: "spacious",    label: "Spacious",    desc: "More breathing room between elements" },
];

function applyAccent(value: string) {
  document.documentElement.style.setProperty("--accent-primary", value);
}

function loadAppearance(): { accent: AccentColor; density: Density } {
  if (typeof window === "undefined") return { accent: "yellow", density: "comfortable" };
  return {
    accent: (localStorage.getItem("pref_accent") as AccentColor) ?? "yellow",
    density: (localStorage.getItem("pref_density") as Density) ?? "comfortable",
  };
}

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "account",     label: "Account",       icon: User },
  { id: "security",    label: "Security",       icon: Shield },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "preferences", label: "Preferences",    icon: Globe },
  { id: "appearance",  label: "Appearance",     icon: Palette },
  { id: "danger",      label: "Danger zone",    icon: AlertTriangle },
];

const TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
];

const DATE_FORMATS: { value: string; label: string; example: string }[] = [
  { value: "MMM D, YYYY", label: "MMM D, YYYY",  example: "Jun 26, 2026" },
  { value: "MM/DD/YYYY",  label: "MM/DD/YYYY",   example: "06/26/2026" },
  { value: "DD/MM/YYYY",  label: "DD/MM/YYYY",   example: "26/06/2026" },
  { value: "YYYY-MM-DD",  label: "YYYY-MM-DD",   example: "2026-06-26" },
];

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`w-10 h-5 border relative transition-colors ${
        on
          ? "bg-accent-primary/20 border-accent-primary/40"
          : "bg-background-tertiary border-border"
      }`}
    >
      <div
        className={`absolute top-0.5 w-3.5 h-3.5 transition-all ${
          on ? "left-5 bg-accent-primary" : "left-0.5 bg-foreground-muted"
        }`}
      />
    </button>
  );
}

export function SettingsClient({
  email,
  userId,
  displayName: initialDisplayName,
  bio: initialBio,
}: {
  email: string;
  userId: string;
  displayName: string;
  bio: string;
}) {
  const [tab, setTab] = useState<Tab>("account");

  // Account
  const [displayName, setDisplayName] = useState(initialDisplayName);
  const [displayNameSaving, setDisplayNameSaving] = useState(false);
  const [displayNameSaved, setDisplayNameSaved] = useState(false);
  const [bio, setBio] = useState(initialBio);
  const [bioSaving, setBioSaving] = useState(false);
  const [bioSaved, setBioSaved] = useState(false);

  // Password
  const [showPwForm, setShowPwForm] = useState(false);
  const [pw, setPw] = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [pwStatus, setPwStatus] = useState<"idle" | "saving" | "done" | "error">("idle");
  const [pwError, setPwError] = useState("");

  // 2FA
  const [mfaEnrolled, setMfaEnrolled] = useState(false);
  const [mfaFactorId, setMfaFactorId] = useState<string | null>(null);
  const [mfaStep, setMfaStep] = useState<"idle" | "starting" | "verifying" | "done">("idle");
  const [mfaQR, setMfaQR] = useState<string | null>(null);
  const [mfaSecret, setMfaSecret] = useState<string | null>(null);
  const [mfaEnrollId, setMfaEnrollId] = useState<string | null>(null);
  const [mfaCode, setMfaCode] = useState("");
  const [mfaError, setMfaError] = useState("");

  // Sessions
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [signedOutOthers, setSignedOutOthers] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ signedInAt: string | null }>({ signedInAt: null });

  // Notifications
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>(loadNotifs);

  // Preferences
  const [language, setLanguage] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("pref_language") ?? "en") : "en"
  );
  const [timezone, setTimezone] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("pref_timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
      : "UTC"
  );
  const [region, setRegion] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("data_region") ?? "US East") : "US East"
  );
  const [dateFormat, setDateFormat] = useState(() =>
    typeof window !== "undefined" ? (localStorage.getItem("pref_date_format") ?? "MMM D, YYYY") : "MMM D, YYYY"
  );
  const [timeFormat, setTimeFormat] = useState<"12h" | "24h">(() => {
    if (typeof window === "undefined") return "12h";
    return (localStorage.getItem("pref_time_format") as "12h" | "24h") ?? "12h";
  });
  const [prefSaved, setPrefSaved] = useState(false);

  // Appearance
  const [accent, setAccent] = useState<AccentColor>("yellow");
  const [density, setDensity] = useState<Density>("comfortable");
  const [appearanceSaved, setAppearanceSaved] = useState(false);

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Load 2FA status + session info
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.mfa.listFactors().then(({ data }) => {
      const verified = data?.totp?.find((f) => f.status === "verified");
      if (verified) {
        setMfaEnrolled(true);
        setMfaFactorId(verified.id);
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      setSessionInfo({ signedInAt: data.session?.user.last_sign_in_at ?? null });
    });
  }, []);

  // Load appearance from localStorage on mount and apply
  useEffect(() => {
    const { accent: a, density: d } = loadAppearance();
    setAccent(a);
    setDensity(d);
    const color = ACCENT_COLORS.find((c) => c.id === a);
    if (color) applyAccent(color.value);
    document.documentElement.setAttribute("data-density", d);
  }, []);

  async function saveDisplayName() {
    if (!displayName.trim()) return;
    setDisplayNameSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { display_name: displayName.trim() } });
    setDisplayNameSaving(false);
    setDisplayNameSaved(true);
    setTimeout(() => setDisplayNameSaved(false), 2000);
  }

  async function saveBio() {
    setBioSaving(true);
    const supabase = createClient();
    await supabase.auth.updateUser({ data: { bio: bio.trim() } });
    setBioSaving(false);
    setBioSaved(true);
    setTimeout(() => setBioSaved(false), 2000);
  }

  async function handlePasswordChange(e: React.FormEvent) {
    e.preventDefault();
    if (pw.length < 8) { setPwError("At least 8 characters required."); return; }
    if (pw !== pwConfirm) { setPwError("Passwords do not match."); return; }
    setPwStatus("saving");
    setPwError("");
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) {
      setPwError(error.message);
      setPwStatus("error");
    } else {
      setPwStatus("done");
      setPw("");
      setPwConfirm("");
      setTimeout(() => { setPwStatus("idle"); setShowPwForm(false); }, 2000);
    }
  }

  async function startMfaEnroll() {
    setMfaError("");
    setMfaStep("starting");
    const supabase = createClient();
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });
    if (error || !data) {
      setMfaError(error?.message ?? "Failed to start enrollment.");
      setMfaStep("idle");
      return;
    }
    setMfaEnrollId(data.id);
    setMfaQR(data.totp.qr_code);
    setMfaSecret(data.totp.secret);
    setMfaStep("verifying");
  }

  async function verifyMfa(e: React.FormEvent) {
    e.preventDefault();
    if (!mfaEnrollId) return;
    setMfaError("");
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.challengeAndVerify({
      factorId: mfaEnrollId,
      code: mfaCode,
    });
    if (error) {
      setMfaError(error.message);
    } else {
      setMfaEnrolled(true);
      setMfaFactorId(mfaEnrollId);
      setMfaStep("done");
      setMfaQR(null);
      setMfaSecret(null);
      setMfaCode("");
      setTimeout(() => setMfaStep("idle"), 2000);
    }
  }

  async function disableMfa() {
    if (!mfaFactorId) return;
    const supabase = createClient();
    const { error } = await supabase.auth.mfa.unenroll({ factorId: mfaFactorId });
    if (!error) {
      setMfaEnrolled(false);
      setMfaFactorId(null);
    }
  }

  function cancelMfaEnroll() {
    setMfaStep("idle");
    setMfaQR(null);
    setMfaSecret(null);
    setMfaCode("");
    setMfaError("");
    setMfaEnrollId(null);
  }

  function toggleNotif(key: NotifKey) {
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    localStorage.setItem("notif_settings", JSON.stringify(next));
  }

  function savePreferences() {
    localStorage.setItem("pref_language", language);
    localStorage.setItem("pref_timezone", timezone);
    localStorage.setItem("data_region", region);
    localStorage.setItem("pref_date_format", dateFormat);
    localStorage.setItem("pref_time_format", timeFormat);
    document.documentElement.lang = language;
    setPrefSaved(true);
    setTimeout(() => setPrefSaved(false), 2000);
  }

  function saveAppearance() {
    const color = ACCENT_COLORS.find((c) => c.id === accent)!;
    localStorage.setItem("pref_accent", accent);
    localStorage.setItem("pref_density", density);
    applyAccent(color.value);
    document.documentElement.setAttribute("data-density", density);
    setAppearanceSaved(true);
    setTimeout(() => setAppearanceSaved(false), 2000);
  }

  async function signOutOtherSessions() {
    setSigningOutOthers(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "others" });
    setSigningOutOthers(false);
    setSignedOutOthers(true);
    setTimeout(() => setSignedOutOthers(false), 3000);
  }

  async function deleteAccount() {
    if (deleteConfirm !== email) return;
    setDeleting(true);
    alert(`Account deletion requires admin verification. A deletion request has been sent to support for ${email}.`);
    setDeleting(false);
  }

  const initials = displayName
    ? displayName.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2)
    : email[0]?.toUpperCase() ?? "?";

  const previewTime = new Date().toLocaleTimeString(language, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: timeFormat === "12h",
    timeZone: timezone,
  });

  return (
    <div className="flex gap-8">
      {/* Tab sidebar */}
      <nav className="w-40 flex-shrink-0 space-y-0.5">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left ${
              tab === id
                ? "bg-background-tertiary text-foreground"
                : "text-foreground-secondary hover:text-foreground hover:bg-background-secondary"
            }`}
          >
            <Icon className={`w-3.5 h-3.5 flex-shrink-0 ${id === "danger" && tab !== "danger" ? "text-red-400/60" : ""}`} />
            <span className={id === "danger" ? "text-red-400/80" : ""}>{label}</span>
          </button>
        ))}
      </nav>

      {/* Panel */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* ── ACCOUNT ── */}
        {tab === "account" && (
          <div className="bg-card border border-border p-6 space-y-6">
            <h2 className="text-sm font-medium text-foreground">Account</h2>

            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-accent-primary/10 border border-accent-primary/20 flex items-center justify-center">
                <span className="text-lg font-medium text-accent-primary">{initials}</span>
              </div>
              <div>
                <p className="text-sm text-foreground">{displayName || email}</p>
                <p className="text-xs text-foreground-muted mt-0.5">{email}</p>
              </div>
            </div>

            {/* Display name */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Display name
              </label>
              <div className="flex gap-2">
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveDisplayName()}
                  placeholder="Your name"
                  className="flex-1 h-9 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
                />
                <button
                  onClick={saveDisplayName}
                  disabled={displayNameSaving || !displayName.trim()}
                  className="h-9 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-1.5"
                >
                  {displayNameSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : displayNameSaving ? "Saving…" : "Save"}
                </button>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Bio
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="A short description about yourself"
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-foreground-muted">{bio.length}/200</span>
                <button
                  onClick={saveBio}
                  disabled={bioSaving}
                  className="h-7 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors flex items-center gap-1"
                >
                  {bioSaved ? <><Check className="w-3 h-3" /> Saved</> : bioSaving ? "Saving…" : "Save bio"}
                </button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Email
              </label>
              <p className="text-sm text-foreground">{email}</p>
              <p className="text-xs text-foreground-muted mt-1">Contact support to change your email address.</p>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                User ID
              </label>
              <code className="text-xs font-mono text-foreground-secondary bg-background-tertiary px-2 py-1 break-all">
                {userId}
              </code>
            </div>

            {/* Password */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">Password</p>
                  <p className="text-xs text-foreground-muted">Change your account password</p>
                </div>
                {!showPwForm && (
                  <button
                    onClick={() => setShowPwForm(true)}
                    className="h-8 px-3 text-xs font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
                  >
                    Change
                  </button>
                )}
              </div>
              {showPwForm && (
                <form onSubmit={handlePasswordChange} className="space-y-3 mt-4 pt-4 border-t border-border">
                  <input
                    autoFocus
                    type="password"
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder="New password"
                    className="w-full h-9 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
                  />
                  <input
                    type="password"
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    placeholder="Confirm new password"
                    className="w-full h-9 px-3 bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
                  />
                  {pwError && <p className="text-xs text-red-400">{pwError}</p>}
                  {pwStatus === "done" && (
                    <p className="text-xs text-accent-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> Password updated.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={pwStatus === "saving"}
                      className="h-8 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                    >
                      {pwStatus === "saving" ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPwForm(false);
                        setPw(""); setPwConfirm(""); setPwError(""); setPwStatus("idle");
                      }}
                      className="h-8 px-3 text-xs border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ── SECURITY ── */}
        {tab === "security" && (
          <div className="space-y-4">
            {/* 2FA */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-3 mb-5">
                <Key className="w-4 h-4 text-foreground-muted" />
                <h2 className="text-sm font-medium text-foreground">Two-factor authentication</h2>
                {mfaEnrolled && (
                  <span className="ml-auto text-xs text-accent-success flex items-center gap-1">
                    <Check className="w-3 h-3" /> Active
                  </span>
                )}
              </div>

              {mfaEnrolled ? (
                <div className="space-y-4">
                  <p className="text-sm text-foreground-secondary">
                    Your account is protected with an authenticator app (TOTP).
                  </p>
                  <button
                    onClick={disableMfa}
                    className="h-8 px-3 text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    Disable 2FA
                  </button>
                </div>
              ) : mfaStep === "verifying" ? (
                <div className="space-y-4">
                  <p className="text-xs text-foreground-muted">
                    Scan this QR code with your authenticator app (Google Authenticator, Authy, 1Password, etc.)
                  </p>
                  {mfaQR && (
                    <div className="w-40 h-40 bg-white p-2 inline-block">
                      <img src={mfaQR} alt="2FA QR code" className="w-full h-full" />
                    </div>
                  )}
                  {mfaSecret && (
                    <div>
                      <p className="text-xs text-foreground-muted mb-1">Or enter the key manually:</p>
                      <code className="text-xs font-mono bg-background-tertiary px-2 py-1 text-foreground-secondary break-all block">
                        {mfaSecret}
                      </code>
                    </div>
                  )}
                  <form onSubmit={verifyMfa} className="space-y-3">
                    <div>
                      <label className="block text-xs text-foreground-muted mb-1">Enter the 6-digit code from your app</label>
                      <input
                        autoFocus
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        inputMode="numeric"
                        className="w-36 h-9 px-3 bg-background-secondary border border-border text-sm text-foreground font-mono tracking-widest placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
                      />
                    </div>
                    {mfaError && <p className="text-xs text-red-400">{mfaError}</p>}
                    <div className="flex gap-2">
                      <button
                        type="submit"
                        disabled={mfaCode.length !== 6}
                        className="h-8 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-50 transition-colors"
                      >
                        Verify &amp; enable
                      </button>
                      <button
                        type="button"
                        onClick={cancelMfaEnroll}
                        className="h-8 px-3 text-xs border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              ) : mfaStep === "done" ? (
                <p className="text-sm text-accent-success flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> 2FA enabled successfully.
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-foreground-secondary">
                    Add an extra layer of security using a TOTP authenticator app. Available on all plans.
                  </p>
                  {mfaError && <p className="text-xs text-red-400">{mfaError}</p>}
                  <button
                    onClick={startMfaEnroll}
                    disabled={mfaStep === "starting"}
                    className="h-8 px-3 text-xs font-medium border border-border text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
                  >
                    {mfaStep === "starting" ? "Loading…" : "Set up 2FA"}
                  </button>
                </div>
              )}
            </div>

            {/* Sessions */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-3 mb-5">
                <LogOut className="w-4 h-4 text-foreground-muted" />
                <h2 className="text-sm font-medium text-foreground">Sessions</h2>
              </div>

              {/* Current session info */}
              <div className="mb-5 p-4 bg-background-secondary border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-3.5 h-3.5 text-foreground-muted" />
                  <span className="text-xs font-medium text-foreground">Current session</span>
                  <span className="ml-auto text-xs text-accent-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-success inline-block" />
                    Active
                  </span>
                </div>
                <div className="space-y-1 text-xs text-foreground-muted">
                  <div className="flex justify-between">
                    <span>Signed in</span>
                    <span className="text-foreground-secondary">
                      {sessionInfo.signedInAt
                        ? new Date(sessionInfo.signedInAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Account</span>
                    <span className="text-foreground-secondary">{email}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-foreground-secondary mb-4">
                Sign out all other active sessions across your other devices.
              </p>
              {signedOutOthers && (
                <p className="text-xs text-accent-success flex items-center gap-1 mb-3">
                  <Check className="w-3 h-3" /> All other sessions signed out.
                </p>
              )}
              <button
                onClick={signOutOtherSessions}
                disabled={signingOutOthers}
                className="h-8 px-3 text-xs font-medium border border-border text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
              >
                {signingOutOthers ? "Signing out…" : "Sign out other sessions"}
              </button>
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <div className="bg-card border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-4 h-4 text-foreground-muted" />
              <h2 className="text-sm font-medium text-foreground">Notifications</h2>
            </div>
            <div className="space-y-0">
              {NOTIF_KEYS.map((key) => {
                const { label, desc } = NOTIF_LABELS[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3.5 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm text-foreground">{label}</p>
                      <p className="text-xs text-foreground-muted">{desc}</p>
                    </div>
                    <Toggle on={notifs[key]} onClick={() => toggleNotif(key)} />
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PREFERENCES ── */}
        {tab === "preferences" && (
          <div className="bg-card border border-border p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-foreground-muted" />
              <h2 className="text-sm font-medium text-foreground">Preferences</h2>
            </div>

            {/* Language */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Language
              </label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent-primary"
              >
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese (Simplified)</option>
                <option value="pt">Portuguese</option>
                <option value="ar">Arabic</option>
                <option value="ko">Korean</option>
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Timezone
              </label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 px-3 bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent-primary"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-xs text-foreground-muted mt-2">
                Current time:{" "}
                <span className="text-foreground font-mono">{previewTime}</span>
              </p>
            </div>

            {/* Date format */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Date format
              </label>
              <div className="grid grid-cols-2 gap-2">
                {DATE_FORMATS.map((fmt) => (
                  <button
                    key={fmt.value}
                    onClick={() => setDateFormat(fmt.value)}
                    className={`flex items-center justify-between px-3 py-2.5 border text-left transition-colors ${
                      dateFormat === fmt.value
                        ? "border-accent-primary/40 bg-accent-primary/5"
                        : "border-border hover:border-border-light"
                    }`}
                  >
                    <span className="text-xs font-mono text-foreground">{fmt.label}</span>
                    <span className="text-xs text-foreground-muted">{fmt.example}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Time format */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Time format
              </label>
              <div className="flex gap-2">
                {(["12h", "24h"] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setTimeFormat(fmt)}
                    className={`flex-1 h-9 text-xs font-medium border transition-colors ${
                      timeFormat === fmt
                        ? "border-accent-primary/40 bg-accent-primary/5 text-foreground"
                        : "border-border text-foreground-secondary hover:text-foreground hover:border-border-light"
                    }`}
                  >
                    {fmt === "12h" ? "12-hour (2:30 PM)" : "24-hour (14:30)"}
                  </button>
                ))}
              </div>
            </div>

            {/* Data region */}
            <div className="pt-4 border-t border-border">
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                Data region
              </label>
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-3.5 h-3.5 text-foreground-muted" />
                <span className="text-xs text-foreground-muted">Controls where your data is stored and processed.</span>
              </div>
              <select
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                className="w-full h-10 px-3 bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent-primary mt-2"
              >
                <option>US East</option>
                <option>US West</option>
                <option>EU West</option>
                <option>EU Central</option>
                <option>Asia Pacific</option>
              </select>
            </div>

            <div className="pt-2">
              <button
                onClick={savePreferences}
                className="h-8 px-4 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors flex items-center gap-1.5"
              >
                {prefSaved ? <><Check className="w-3.5 h-3.5" /> Saved</> : "Save preferences"}
              </button>
            </div>
          </div>
        )}

        {/* ── APPEARANCE ── */}
        {tab === "appearance" && (
          <div className="bg-card border border-border p-6 space-y-6">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-foreground-muted" />
              <h2 className="text-sm font-medium text-foreground">Appearance</h2>
            </div>

            {/* Accent color */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-3 uppercase tracking-wider">
                Accent color
              </label>
              <div className="flex gap-3">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAccent(c.id)}
                    title={c.label}
                    className={`w-9 h-9 border-2 transition-all flex items-center justify-center ${
                      accent === c.id ? "border-foreground scale-110" : "border-transparent hover:border-border-light"
                    }`}
                    style={{ backgroundColor: `${c.value}22`, borderColor: accent === c.id ? c.value : undefined }}
                  >
                    <span
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: c.value }}
                    />
                  </button>
                ))}
              </div>
              <p className="text-xs text-foreground-muted mt-2">
                Selected: <span className="text-foreground">{ACCENT_COLORS.find((c) => c.id === accent)?.label}</span>
              </p>
            </div>

            {/* UI Density */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-3 uppercase tracking-wider">
                UI density
              </label>
              <div className="space-y-2">
                {DENSITIES.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDensity(d.id)}
                    className={`w-full flex items-center justify-between px-4 py-3 border text-left transition-colors ${
                      density === d.id
                        ? "border-accent-primary/40 bg-accent-primary/5"
                        : "border-border hover:border-border-light"
                    }`}
                  >
                    <div>
                      <p className="text-sm text-foreground">{d.label}</p>
                      <p className="text-xs text-foreground-muted">{d.desc}</p>
                    </div>
                    {density === d.id && <Check className="w-3.5 h-3.5 text-accent-primary" />}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={saveAppearance}
                className="h-8 px-4 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors flex items-center gap-1.5"
              >
                {appearanceSaved ? <><Check className="w-3.5 h-3.5" /> Applied</> : "Apply"}
              </button>
            </div>
          </div>
        )}

        {/* ── DANGER ZONE ── */}
        {tab === "danger" && (
          <div className="space-y-4">
            {/* Export */}
            <div className="bg-card border border-border p-6">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-4 h-4 text-foreground-muted" />
                <h2 className="text-sm font-medium text-foreground">Export data</h2>
              </div>
              <p className="text-sm text-foreground-secondary mb-4">
                Download all your data including conversations, documents, agents, and account settings.
              </p>
              <button
                onClick={() =>
                  alert(`A data export will be prepared and emailed to ${email} within 24 hours.`)
                }
                className="h-8 px-3 text-xs font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
              >
                Request export
              </button>
            </div>

            {/* Delete */}
            <div className="bg-card border border-red-500/20 p-6">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-medium text-red-400">Delete account</h2>
              </div>
              <p className="text-sm text-foreground-secondary mb-5">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>
              <div className="space-y-3">
                <div>
                  <label className="block text-xs text-foreground-muted mb-1.5">
                    Type <span className="text-foreground font-medium">{email}</span> to confirm
                  </label>
                  <input
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={email}
                    className="w-full h-9 px-3 bg-background-secondary border border-red-500/30 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-red-500/60"
                  />
                </div>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== email || deleting}
                  className="h-8 px-3 text-xs font-medium bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? "Deleting…" : "Delete my account"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
