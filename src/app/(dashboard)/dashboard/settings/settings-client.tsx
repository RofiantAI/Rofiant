"use client";

import {
  Bell, Globe, Check, Trash2, Palette,
  LogOut, Download, Key, Monitor,
  Plus, Copy, X, Lock,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useTheme } from "next-themes";
import { createClient } from "@/lib/supabase/client";
import { routing } from "@/i18n/routing";
import {
  DashboardCard,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
  DashboardList,
  DashboardUpgradeGate,
} from "@/components/dashboard/ui/page-shell";
import { ProfileAvatarUpload } from "@/components/dashboard/profile-avatar-upload";
import { Button } from "@/components/ui/button";
import { PasswordInput } from "@/components/ui/password-input";
import { SkeletonListRows } from "@/components/ui/skeleton";
import { formatDate as fmtDate } from "@/lib/user-prefs";
import { canAccessTool, upgradeTargetForTool } from "@/lib/service-plan-access";
import { SettingsTabSidebar, type Tab } from "./settings-tab-sidebar";
import { WebhooksSection } from "../api-keys/webhooks-section";

type ApiKey = {
  id: string;
  name: string;
  key_prefix: string;
  key_value: string;
  created_at: string;
  last_used_at: string | null;
};

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  es: "Spanish",
  fr: "French",
  de: "German",
};

const NOTIF_KEYS = [
  "usage_alerts",
  "security_alerts",
  "product_updates",
  "weekly_digest",
  "api_failures",
  "billing_alerts",
] as const;
type NotifKey = (typeof NOTIF_KEYS)[number];

const NOTIF_MSG_KEY: Record<NotifKey, string> = {
  usage_alerts: "usageAlerts",
  security_alerts: "securityAlerts",
  product_updates: "productUpdates",
  weekly_digest: "weeklyDigest",
  api_failures: "apiFailures",
  billing_alerts: "billingAlerts",
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

const ACCENT_COLORS: { id: AccentColor; value: string }[] = [
  { id: "yellow",  value: "#eab308" },
  { id: "blue",    value: "#2563eb" },
  { id: "green",   value: "#22c55e" },
  { id: "purple",  value: "#a855f7" },
];

const DENSITIES: { id: Density }[] = [
  { id: "compact" },
  { id: "comfortable" },
  { id: "spacious" },
];

const THEMES: { id: "light" | "dark" | "system" }[] = [
  { id: "light" },
  { id: "dark" },
  { id: "system" },
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
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onClick}
      className={`relative w-9 h-5 rounded-full shrink-0 cursor-pointer ring-1 ring-inset transition-colors duration-150 ${
        on
          ? "bg-accent-success ring-accent-success"
          : "bg-background-tertiary ring-border hover:ring-border-light"
      }`}
    >
      <span
        className={`absolute left-0.5 top-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-150 ${
          on ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
  labelledBy,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
  labelledBy?: string;
}) {
  return (
    <div
      role="group"
      aria-labelledby={labelledBy}
      className="inline-flex items-center gap-0.5 p-0.5 rounded-lg bg-background-tertiary border border-border"
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={`px-3 h-7 rounded-md text-xs transition-colors ${
            value === opt.value
              ? "bg-card text-foreground shadow-sm"
              : "text-foreground-muted hover:text-foreground"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

export function SettingsClient({
  email,
  userId,
  displayName: initialDisplayName,
  bio: initialBio,
  avatarUrl,
  hasCustomAvatar,
  plan,
  backHref,
  backLabel,
  initialTab,
  tab: controlledTab,
  onTabChange,
  hideSidebar,
}: {
  email: string;
  userId: string;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  hasCustomAvatar: boolean;
  plan: string;
  backHref?: string;
  backLabel?: string;
  initialTab?: Tab;
  tab?: Tab;
  onTabChange?: (tab: Tab) => void;
  hideSidebar?: boolean;
}) {
  const router = useRouter();
  const t = useTranslations("dashboard.settings");
  const tApi = useTranslations("dashboard.apiKeys");
  const tGate = useTranslations("dashboard.planGate");
  const [internalTab, setInternalTab] = useState<Tab>(initialTab ?? "account");
  const tab = controlledTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;
  const canUseApiKeys = canAccessTool(plan, "apiKeys");

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

  // Export
  const [exportLoading, setExportLoading] = useState(false);

  const handleExport = async () => {
    setExportLoading(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition");
      const match = disposition?.match(/filename="(.+)"/);
      const filename = match?.[1] ?? "rofiant-export.json";
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExportLoading(false);
    }
  };

  // Sessions
  const [signingOutOthers, setSigningOutOthers] = useState(false);
  const [signedOutOthers, setSignedOutOthers] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ signedInAt: string | null }>({ signedInAt: null });

  // Notifications
  const [notifs, setNotifs] = useState<Record<NotifKey, boolean>>(loadNotifs);

  // Preferences
  const [language, setLanguage] = useState(() => {
    if (typeof window === "undefined") return "en";
    const cookieMatch = document.cookie.match(/(?:^|; )NEXT_LOCALE=([^;]+)/);
    return cookieMatch?.[1] ?? localStorage.getItem("pref_language") ?? "en";
  });
  const [timezone, setTimezone] = useState(() =>
    typeof window !== "undefined"
      ? (localStorage.getItem("pref_timezone") ?? Intl.DateTimeFormat().resolvedOptions().timeZone)
      : "UTC"
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
  const { theme, setTheme } = useTheme();
  const [accent, setAccent] = useState<AccentColor>("yellow");
  const [density, setDensity] = useState<Density>("comfortable");
  const [appearanceSaved, setAppearanceSaved] = useState(false);

  // Danger
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleting, setDeleting] = useState(false);

  // API keys
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [apiKeysLoading, setApiKeysLoading] = useState(true);
  const [apiKeyCreating, setApiKeyCreating] = useState(false);
  const [newApiKeyName, setNewApiKeyName] = useState("");
  const [showApiKeyForm, setShowApiKeyForm] = useState(false);
  const [createdApiKey, setCreatedApiKey] = useState<ApiKey | null>(null);
  const [copiedApiKeyId, setCopiedApiKeyId] = useState<string | null>(null);
  const [deletingApiKeyId, setDeletingApiKeyId] = useState<string | null>(null);

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

  // Load notification prefs from Supabase (falls back to localStorage/defaults)
  useEffect(() => {
    const supabase = createClient();
    supabase
      .from("user_settings")
      .select("notification_prefs")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.notification_prefs) {
          setNotifs((prev) => ({ ...prev, ...data.notification_prefs }));
        }
      });
  }, []);

  // Load API keys (only if the plan actually has access)
  useEffect(() => {
    if (!canUseApiKeys) return;
    fetch("/api/api-keys")
      .then((r) => r.json())
      .then(setApiKeys)
      .finally(() => setApiKeysLoading(false));
  }, [canUseApiKeys]);

  // Load appearance from localStorage on mount and apply. Deferred to an
  // effect since localStorage is unavailable during SSR.
  useEffect(() => {
    const { accent: a, density: d } = loadAppearance();
    // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (pw.length < 8) { setPwError(t("account.passwordTooShort")); return; }
    if (pw !== pwConfirm) { setPwError(t("account.passwordMismatch")); return; }
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

  async function toggleNotif(key: NotifKey) {
    const next = { ...notifs, [key]: !notifs[key] };
    setNotifs(next);
    localStorage.setItem("notif_settings", JSON.stringify(next));

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase
      .from("user_settings")
      .upsert({ user_id: user.id, notification_prefs: next, updated_at: new Date().toISOString() });
  }

  async function handleCreateApiKey(e: React.FormEvent) {
    e.preventDefault();
    if (!newApiKeyName.trim()) return;
    setApiKeyCreating(true);
    const res = await fetch("/api/api-keys", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newApiKeyName.trim() }),
    });
    const data = await res.json();
    if (res.ok) {
      setCreatedApiKey(data);
      setApiKeys((prev) => [data, ...prev]);
      setNewApiKeyName("");
      setShowApiKeyForm(false);
    }
    setApiKeyCreating(false);
  }

  async function handleDeleteApiKey(id: string) {
    setDeletingApiKeyId(id);
    await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
    setApiKeys((prev) => prev.filter((k) => k.id !== id));
    setDeletingApiKeyId(null);
  }

  async function handleCopyApiKey(text: string, id: string) {
    await navigator.clipboard.writeText(text);
    setCopiedApiKeyId(id);
    setTimeout(() => setCopiedApiKeyId(null), 2000);
  }

  function formatApiKeyDate(iso: string | null) {
    if (!iso) return tApi("table.noDate");
    return fmtDate(iso);
  }

  function savePreferences() {
    localStorage.setItem("pref_language", language);
    localStorage.setItem("pref_timezone", timezone);
    localStorage.setItem("pref_date_format", dateFormat);
    localStorage.setItem("pref_time_format", timeFormat);
    document.documentElement.lang = language;
    document.cookie = `NEXT_LOCALE=${language}; path=/; max-age=31536000`;
    router.refresh();
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
    alert(t("danger.deleteAlert", { email }));
    setDeleting(false);
  }

  const previewTime = new Date().toLocaleTimeString(language, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: timeFormat === "12h",
    timeZone: timezone,
  });

  return (
    <div className="flex flex-col md:flex-row gap-6 md:gap-8">
      {/* Tab sidebar */}
      {!hideSidebar && (
        <SettingsTabSidebar tab={tab} setTab={setTab} t={t} backHref={backHref} backLabel={backLabel} />
      )}

      {/* Panel */}
      <div className="flex-1 min-w-0 space-y-4">

        {/* ── ACCOUNT ── */}
        {tab === "account" && (
          <DashboardCard className="space-y-6">
            <h2 className="text-sm font-medium text-foreground">{t("account.heading")}</h2>

            {/* Avatar */}
            <ProfileAvatarUpload
              userId={userId}
              avatarUrl={avatarUrl}
              hasCustomAvatar={hasCustomAvatar}
              displayName={displayName}
              email={email}
            />

            {/* Display name */}
            <div>
              <label htmlFor="settings-display-name" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("account.displayName")}
              </label>
              <div className="flex gap-2">
                <input
                  id="settings-display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && saveDisplayName()}
                  placeholder={t("account.displayNamePlaceholder")}
                  className="flex-1 h-9 px-3 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-border-light"
                />
                <Button
                  size="xs"
                  onClick={saveDisplayName}
                  disabled={displayNameSaving || !displayName.trim()}
                >
                  {displayNameSaved ? <><Check className="w-3.5 h-3.5" /> {t("account.saved")}</> : displayNameSaving ? t("account.saving") : t("account.save")}
                </Button>
              </div>
            </div>

            {/* Bio */}
            <div>
              <label htmlFor="settings-bio" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("account.bio")}
              </label>
              <textarea
                id="settings-bio"
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder={t("account.bioPlaceholder")}
                maxLength={200}
                rows={3}
                className="w-full px-3 py-2 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-border-light resize-none"
              />
              <div className="flex items-center justify-between mt-1.5">
                <span className="text-xs text-foreground-muted">{t("account.bioCount", { count: bio.length })}</span>
                <Button
                  size="xs"
                  onClick={saveBio}
                  disabled={bioSaving}
                >
                  {bioSaved ? <><Check className="w-3 h-3" /> {t("account.saved")}</> : bioSaving ? t("account.saving") : t("account.saveBio")}
                </Button>
              </div>
            </div>

            {/* Email */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("account.email")}
              </label>
              <p className="text-sm text-foreground">{email}</p>
              <p className="text-xs text-foreground-muted mt-1">{t("account.emailHint")}</p>
            </div>

            {/* User ID */}
            <div>
              <label className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("account.userId")}
              </label>
              <code className="text-xs font-mono text-foreground-secondary bg-background-tertiary rounded-md px-2 py-1 break-all">
                {userId}
              </code>
            </div>

            {/* Password */}
            <div className="pt-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-foreground">{t("account.password")}</p>
                  <p className="text-xs text-foreground-muted">{t("account.passwordHint")}</p>
                </div>
                {!showPwForm && (
                  <button
                    onClick={() => setShowPwForm(true)}
                    className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors"
                  >
                    {t("account.change")}
                  </button>
                )}
              </div>
              {showPwForm && (
                <form onSubmit={handlePasswordChange} className="space-y-3 mt-4 pt-4 border-t border-border">
                  <PasswordInput
                    autoFocus
                    value={pw}
                    onChange={(e) => setPw(e.target.value)}
                    placeholder={t("account.newPassword")}
                    autoComplete="new-password"
                    className="w-full h-9 px-3 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-border-light"
                  />
                  <PasswordInput
                    value={pwConfirm}
                    onChange={(e) => setPwConfirm(e.target.value)}
                    placeholder={t("account.confirmPassword")}
                    autoComplete="new-password"
                    className="w-full h-9 px-3 rounded-lg bg-card border border-border text-sm text-foreground placeholder:text-foreground-muted outline-none focus:border-border-light"
                  />
                  {pwError && <p className="text-xs text-red-400">{pwError}</p>}
                  {pwStatus === "done" && (
                    <p className="text-xs text-accent-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> {t("account.passwordUpdated")}
                    </p>
                  )}
                  <div className="flex gap-2">
                    <Button
                      type="submit"
                      size="xs"
                      disabled={pwStatus === "saving"}
                    >
                      {pwStatus === "saving" ? t("account.saving") : t("account.save")}
                    </Button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowPwForm(false);
                        setPw(""); setPwConfirm(""); setPwError(""); setPwStatus("idle");
                      }}
                      className="h-8 px-3 rounded-lg text-xs border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
                    >
                      {t("account.cancel")}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </DashboardCard>
        )}

        {/* ── SECURITY ── */}
        {tab === "security" && (
          <div className="space-y-4">
            {/* 2FA */}
            <DashboardCard>
              <div className="flex items-center gap-3 mb-5">
                <Key className="w-4 h-4 text-foreground-muted" />
                <h2 className="text-sm font-medium text-foreground">{t("security.twoFactor")}</h2>
                {mfaEnrolled && (
                  <span className="ml-auto text-xs text-accent-success flex items-center gap-1">
                    <Check className="w-3 h-3" /> {t("security.active")}
                  </span>
                )}
              </div>

              {mfaEnrolled ? (
                <div className="space-y-4">
                  <p className="text-sm text-foreground-secondary">
                    {t("security.totpProtected")}
                  </p>
                  <button
                    onClick={disableMfa}
                    className="h-8 px-3 rounded-lg text-xs font-medium border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors"
                  >
                    {t("security.disable2fa")}
                  </button>
                </div>
              ) : mfaStep === "verifying" ? (
                <div className="space-y-4">
                  <p className="text-xs text-foreground-muted">
                    {t("security.scanQr")}
                  </p>
                  {mfaQR && (
                    <div className="w-40 h-40 rounded-lg bg-white p-2 inline-block">
                      <img src={mfaQR} alt="2FA QR code" className="w-full h-full" />
                    </div>
                  )}
                  {mfaSecret && (
                    <div>
                      <p className="text-xs text-foreground-muted mb-1">{t("security.manualKey")}</p>
                      <code className="text-xs font-mono bg-background-tertiary rounded-md px-2 py-1 text-foreground-secondary break-all block">
                        {mfaSecret}
                      </code>
                    </div>
                  )}
                  <form onSubmit={verifyMfa} className="space-y-3">
                    <div>
                      <label htmlFor="settings-mfa-code" className="block text-xs text-foreground-muted mb-1">{t("security.enterCode")}</label>
                      <input
                        id="settings-mfa-code"
                        autoFocus
                        value={mfaCode}
                        onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                        placeholder="000000"
                        inputMode="numeric"
                        className="w-36 h-9 px-3 rounded-lg bg-background-secondary border border-border text-sm text-foreground font-mono tracking-widest placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
                      />
                    </div>
                    {mfaError && <p className="text-xs text-red-400">{mfaError}</p>}
                    <div className="flex gap-2">
                      <Button
                        type="submit"
                        size="xs"
                        disabled={mfaCode.length !== 6}
                      >
                        {t("security.verifyAndEnable")}
                      </Button>
                      <button
                        type="button"
                        onClick={cancelMfaEnroll}
                        className="h-8 px-3 rounded-lg text-xs border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
                      >
                        {t("security.cancel")}
                      </button>
                    </div>
                  </form>
                </div>
              ) : mfaStep === "done" ? (
                <p className="text-sm text-accent-success flex items-center gap-1.5">
                  <Check className="w-4 h-4" /> {t("security.twoFaEnabled")}
                </p>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-foreground-secondary">
                    {t("security.twoFaDesc")}
                  </p>
                  {mfaError && <p className="text-xs text-red-400">{mfaError}</p>}
                  <button
                    onClick={startMfaEnroll}
                    disabled={mfaStep === "starting"}
                    className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
                  >
                    {mfaStep === "starting" ? t("security.loading") : t("security.setup2fa")}
                  </button>
                </div>
              )}
            </DashboardCard>

            {/* Sessions */}
            <DashboardCard>
              <div className="flex items-center gap-3 mb-5">
                <LogOut className="w-4 h-4 text-foreground-muted" />
                <h2 className="text-sm font-medium text-foreground">{t("security.sessions")}</h2>
              </div>

              {/* Current session info */}
              <div className="mb-5 p-4 rounded-lg bg-background-secondary border border-border">
                <div className="flex items-center gap-2 mb-3">
                  <Monitor className="w-3.5 h-3.5 text-foreground-muted" />
                  <span className="text-xs font-medium text-foreground">{t("security.currentSession")}</span>
                  <span className="ml-auto text-xs text-accent-success flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent-success inline-block" />
                    {t("security.active")}
                  </span>
                </div>
                <div className="space-y-1 text-xs text-foreground-muted">
                  <div className="flex justify-between">
                    <span>{t("security.signedIn")}</span>
                    <span className="text-foreground-secondary">
                      {sessionInfo.signedInAt
                        ? new Date(sessionInfo.signedInAt).toLocaleString()
                        : "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t("security.account")}</span>
                    <span className="text-foreground-secondary">{email}</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-foreground-secondary mb-4">
                {t("security.signOutOthersDesc")}
              </p>
              {signedOutOthers && (
                <p className="text-xs text-accent-success flex items-center gap-1 mb-3">
                  <Check className="w-3 h-3" /> {t("security.allOthersSignedOut")}
                </p>
              )}
              <button
                onClick={signOutOtherSessions}
                disabled={signingOutOthers}
                className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors"
              >
                {signingOutOthers ? t("security.signingOut") : t("security.signOutOthers")}
              </button>
            </DashboardCard>
          </div>
        )}

        {/* ── API ── */}
        {tab === "api" && (
          canUseApiKeys ? (
            <div className="space-y-4">
              <DashboardCard>
                <div className="flex items-center justify-between gap-4 mb-1">
                  <div className="flex items-center gap-3">
                    <Key className="w-4 h-4 text-foreground-muted" />
                    <h2 className="text-sm font-medium text-foreground">{tApi("title")}</h2>
                  </div>
                  <DashboardPrimaryButton onClick={() => setShowApiKeyForm(true)}>
                    <Plus className="w-4 h-4" />
                    {tApi("createKey")}
                  </DashboardPrimaryButton>
                </div>
                <p className="text-sm text-foreground-secondary mb-5">{tApi("subtitle")}</p>

                {showApiKeyForm && (
                  <form onSubmit={handleCreateApiKey} className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-border">
                    <input
                      autoFocus
                      type="text"
                      value={newApiKeyName}
                      onChange={(e) => setNewApiKeyName(e.target.value)}
                      placeholder={tApi("newKeyForm.namePlaceholder")}
                      className="flex-1 min-w-[200px] h-9 px-3 rounded-lg bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
                    />
                    <DashboardPrimaryButton type="submit" disabled={apiKeyCreating}>
                      {apiKeyCreating ? tApi("newKeyForm.creating") : tApi("newKeyForm.create")}
                    </DashboardPrimaryButton>
                    <DashboardSecondaryButton
                      type="button"
                      onClick={() => { setShowApiKeyForm(false); setNewApiKeyName(""); }}
                    >
                      {tApi("newKeyForm.cancel")}
                    </DashboardSecondaryButton>
                  </form>
                )}

                {createdApiKey && (
                  <div className="mb-5 p-4 rounded-lg border border-accent-primary/30">
                    <div className="flex items-start justify-between mb-2">
                      <p className="text-sm font-medium text-foreground">{tApi("createdKey.message")}</p>
                      <button onClick={() => setCreatedApiKey(null)}>
                        <X className="w-4 h-4 text-foreground-muted hover:text-foreground" />
                      </button>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <code className="flex-1 text-xs font-mono bg-background-tertiary rounded-md px-3 py-2 text-foreground break-all">
                        {createdApiKey.key_value}
                      </code>
                      <DashboardSecondaryButton onClick={() => handleCopyApiKey(createdApiKey.key_value, "new")}>
                        {copiedApiKeyId === "new" ? <Check className="w-3 h-3 text-accent-success" /> : <Copy className="w-3 h-3" />}
                        {copiedApiKeyId === "new" ? tApi("createdKey.copied") : tApi("createdKey.copy")}
                      </DashboardSecondaryButton>
                    </div>
                  </div>
                )}

                <DashboardList>
                  <div className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 px-5 py-3 border-b border-border text-xs font-medium text-foreground-muted">
                    <span>{tApi("table.name")}</span>
                    <span>{tApi("table.keyPrefix")}</span>
                    <span>{tApi("table.created")}</span>
                    <span />
                  </div>
                  {apiKeysLoading ? (
                    <SkeletonListRows rows={4} />
                  ) : apiKeys.length === 0 ? (
                    <div className="px-5 py-8 text-center text-sm text-foreground-secondary">{tApi("table.empty")}</div>
                  ) : (
                    apiKeys.map((k) => (
                      <div key={k.id} className="grid grid-cols-[1fr_1fr_1fr_auto] gap-4 items-center px-5 py-3.5 border-b border-border last:border-0">
                        <span className="text-sm text-foreground">{k.name}</span>
                        <div className="flex items-center gap-2">
                          <code className="text-xs font-mono text-foreground-secondary bg-background-tertiary rounded-md px-2 py-1">
                            {k.key_prefix}…
                          </code>
                          <button onClick={() => handleCopyApiKey(k.key_value, k.id)} className="p-1 rounded-md hover:bg-background-tertiary">
                            {copiedApiKeyId === k.id ? <Check className="w-3 h-3 text-accent-success" /> : <Copy className="w-3 h-3 text-foreground-muted" />}
                          </button>
                        </div>
                        <span className="text-xs text-foreground-muted">{formatApiKeyDate(k.created_at)}</span>
                        <button
                          onClick={() => handleDeleteApiKey(k.id)}
                          disabled={deletingApiKeyId === k.id}
                          className="p-1 rounded-md hover:bg-background-tertiary disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-foreground-muted" />
                        </button>
                      </div>
                    ))
                  )}
                </DashboardList>
              </DashboardCard>

              <WebhooksSection />
            </div>
          ) : (
            <DashboardCard>
              <DashboardUpgradeGate
                icon={Lock}
                title={tGate("title", { plan: tGate(`plans.${upgradeTargetForTool("apiKeys").plan}`) })}
                description={tGate("description", { tool: tGate("tools.apiKeys") })}
                ctaHref="/pricing"
                ctaLabel={tGate("cta", { plan: tGate(`plans.${upgradeTargetForTool("apiKeys").plan}`) })}
              />
            </DashboardCard>
          )
        )}

        {/* ── NOTIFICATIONS ── */}
        {tab === "notifications" && (
          <DashboardCard>
            <div className="flex items-center gap-3 mb-6">
              <Bell className="w-4 h-4 text-foreground-muted" />
              <h2 className="text-sm font-medium text-foreground">{t("notifications.heading")}</h2>
            </div>
            <div className="space-y-0">
              {NOTIF_KEYS.map((key) => {
                const msgKey = NOTIF_MSG_KEY[key];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between py-3.5 border-b border-border last:border-0"
                  >
                    <div>
                      <p className="text-sm text-foreground">{t(`notifications.${msgKey}.label`)}</p>
                      <p className="text-xs text-foreground-muted">{t(`notifications.${msgKey}.desc`)}</p>
                    </div>
                    <Toggle on={notifs[key]} onClick={() => toggleNotif(key)} />
                  </div>
                );
              })}
            </div>
          </DashboardCard>
        )}

        {/* ── PREFERENCES ── */}
        {tab === "preferences" && (
          <DashboardCard className="space-y-6">
            <div className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-foreground-muted" />
              <h2 className="text-sm font-medium text-foreground">{t("preferences.heading")}</h2>
            </div>

            {/* Language */}
            <div>
              <label htmlFor="settings-language" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("preferences.language")}
              </label>
              <select
                id="settings-language"
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent-primary"
              >
                {routing.locales.map((l) => (
                  <option key={l} value={l}>
                    {LOCALE_LABELS[l]}
                  </option>
                ))}
              </select>
            </div>

            {/* Timezone */}
            <div>
              <label htmlFor="settings-timezone" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("preferences.timezone")}
              </label>
              <select
                id="settings-timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full h-10 px-3 rounded-lg bg-background-secondary border border-border text-sm text-foreground focus:outline-none focus:border-accent-primary"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-xs text-foreground-muted mt-2">
                {t("preferences.currentTime")}{" "}
                <span className="text-foreground font-mono">{previewTime}</span>
              </p>
            </div>

            {/* Date format */}
            <div>
              <label id="settings-date-format-label" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("preferences.dateFormat")}
              </label>
              <SegmentedControl
                labelledBy="settings-date-format-label"
                value={dateFormat}
                onChange={setDateFormat}
                options={DATE_FORMATS.map((fmt) => ({ value: fmt.value, label: fmt.label }))}
              />
              <p className="text-xs text-foreground-muted mt-2 font-mono">
                {DATE_FORMATS.find((fmt) => fmt.value === dateFormat)?.example}
              </p>
            </div>

            {/* Time format */}
            <div>
              <label id="settings-time-format-label" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("preferences.timeFormat")}
              </label>
              <SegmentedControl
                labelledBy="settings-time-format-label"
                value={timeFormat}
                onChange={setTimeFormat}
                options={[
                  { value: "12h" as const, label: t("preferences.time12h") },
                  { value: "24h" as const, label: t("preferences.time24h") },
                ]}
              />
            </div>

            <div className="pt-2">
              <DashboardPrimaryButton onClick={savePreferences}>
                {prefSaved ? <><Check className="w-3.5 h-3.5" /> {t("preferences.saved")}</> : t("preferences.savePreferences")}
              </DashboardPrimaryButton>
            </div>
          </DashboardCard>
        )}

        {/* ── APPEARANCE ── */}
        {tab === "appearance" && (
          <DashboardCard className="space-y-4 max-w-md">
            <div className="flex items-center gap-3">
              <Palette className="w-4 h-4 text-foreground-muted" />
              <h2 className="text-sm font-medium text-foreground">{t("appearance.heading")}</h2>
            </div>

            {/* Theme */}
            <div>
              <label id="settings-theme-label" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("appearance.theme")}
              </label>
              <SegmentedControl
                labelledBy="settings-theme-label"
                value={theme ?? "system"}
                onChange={setTheme}
                options={THEMES.map(({ id }) => ({
                  value: id,
                  label: t(`appearance.themes.${id}.label`),
                }))}
              />
              <p className="text-xs text-foreground-muted mt-1.5">
                {t(`appearance.themes.${theme ?? "system"}.desc`)}
              </p>
            </div>

            {/* Accent color */}
            <div>
              <label id="settings-accent-color-label" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("appearance.accentColor")}
              </label>
              <div role="group" aria-labelledby="settings-accent-color-label" className="flex gap-3">
                {ACCENT_COLORS.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => setAccent(c.id)}
                    title={t(`appearance.accentNames.${c.id}`)}
                    className={`w-9 h-9 rounded-md border-2 transition-colors flex items-center justify-center ${
                      accent === c.id ? "border-foreground" : "border-transparent hover:border-border-light"
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
              <p className="text-xs text-foreground-muted mt-1.5">
                {t("appearance.selected")} <span className="text-foreground">{t(`appearance.accentNames.${accent}`)}</span>
              </p>
            </div>

            {/* UI Density */}
            <div>
              <label id="settings-ui-density-label" className="block text-xs font-medium text-foreground-secondary mb-2 uppercase tracking-wider">
                {t("appearance.uiDensity")}
              </label>
              <SegmentedControl
                labelledBy="settings-ui-density-label"
                value={density}
                onChange={setDensity}
                options={DENSITIES.map((d) => ({
                  value: d.id,
                  label: t(`appearance.densities.${d.id}.label`),
                }))}
              />
              <p className="text-xs text-foreground-muted mt-1.5">
                {t(`appearance.densities.${density}.desc`)}
              </p>
            </div>

            <div>
              <DashboardPrimaryButton onClick={saveAppearance}>
                {appearanceSaved ? <><Check className="w-3.5 h-3.5" /> {t("appearance.applied")}</> : t("appearance.apply")}
              </DashboardPrimaryButton>
            </div>
          </DashboardCard>
        )}

        {/* ── DANGER ZONE ── */}
        {tab === "danger" && (
          <div className="space-y-4">
            {/* Export */}
            <DashboardCard>
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-4 h-4 text-foreground-muted" />
                <h2 className="text-sm font-medium text-foreground">{t("danger.exportData")}</h2>
              </div>
              <p className="text-sm text-foreground-secondary mb-4">
                {t("danger.exportDesc")}
              </p>
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="h-8 px-3 rounded-lg text-xs font-medium border border-border text-foreground hover:bg-background-tertiary transition-colors disabled:opacity-50 disabled:pointer-events-none"
              >
                {exportLoading ? t("danger.exporting") : t("danger.requestExport")}
              </button>
            </DashboardCard>

            {/* Delete */}
            <DashboardCard className="border-red-500/20">
              <div className="flex items-center gap-3 mb-4">
                <Trash2 className="w-4 h-4 text-red-400" />
                <h2 className="text-sm font-medium text-red-400">{t("danger.deleteAccount")}</h2>
              </div>
              <p className="text-sm text-foreground-secondary mb-5">
                {t("danger.deleteDesc")}
              </p>
              <div className="space-y-3">
                <div>
                  <label htmlFor="settings-delete-confirm" className="block text-xs text-foreground-muted mb-1.5">
                    {t("danger.typeToConfirm", { email })}
                  </label>
                  <input
                    id="settings-delete-confirm"
                    value={deleteConfirm}
                    onChange={(e) => setDeleteConfirm(e.target.value)}
                    placeholder={email}
                    className="w-full h-9 px-3 rounded-lg bg-background-secondary border border-red-500/30 text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-red-500/60"
                  />
                </div>
                <button
                  onClick={deleteAccount}
                  disabled={deleteConfirm !== email || deleting}
                  className="h-8 px-3 rounded-lg text-xs font-medium bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {deleting ? t("danger.deleting") : t("danger.deleteMyAccount")}
                </button>
              </div>
            </DashboardCard>
          </div>
        )}
      </div>
    </div>
  );
}
