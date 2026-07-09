"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Building2, Save, AlertTriangle, Check, Globe, Shield,
  Users, Bell, ChevronDown, X, Plus, Key, Copy,
} from "lucide-react";

function Toggle({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={on}
      className={`w-10 h-5 border relative transition-colors shrink-0 ${
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

function SectionHeader({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
  return (
    <div className="flex items-center gap-2 px-5 py-3 border-b border-border">
      <Icon className="w-4 h-4 text-foreground-muted" />
      <span className="text-sm font-medium text-foreground">{label}</span>
    </div>
  );
}

function SaveButton({
  onClick,
  saving,
  saved,
  disabled,
}: {
  onClick: () => void;
  saving: boolean;
  saved: boolean;
  disabled?: boolean;
}) {
  const t = useTranslations("dashboard.agency.settings.save");
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="h-8 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground disabled:opacity-40 transition-colors inline-flex items-center gap-2"
    >
      {saved ? (
        <><Check className="w-3.5 h-3.5 text-accent-success" /> {t("saved")}</>
      ) : saving ? (
        t("saving")
      ) : (
        <><Save className="w-3.5 h-3.5" /> {t("save")}</>
      )}
    </button>
  );
}

function useSave() {
  const t = useTranslations("dashboard.agency.settings.errors");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  async function save(body: Record<string, unknown>) {
    setSaving(true);
    setSaved(false);
    setError("");
    const res = await fetch("/api/agency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (res.ok) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      const json = await res.json().catch(() => ({}));
      setError(json.error ?? t("saveFailed"));
    }
    setSaving(false);
  }

  return { saving, saved, error, setError, save };
}

export function AgencySettingsClient({
  agencyId,
  agencyName,
  agencyDescription,
  agencyWebsite,
  defaultMemberRole,
  membersCanInvite,
  require2fa,
  allowedDomains,
  notifyMemberJoined,
  notifyMemberLeft,
  ownerEmail,
  plan,
  scimConfigured: initialScimConfigured,
  ssoDomain: initialSsoDomain,
}: {
  agencyId: string;
  agencyName: string;
  agencyDescription: string;
  agencyWebsite: string;
  defaultMemberRole: string;
  membersCanInvite: boolean;
  require2fa: boolean;
  allowedDomains: string[];
  notifyMemberJoined: boolean;
  notifyMemberLeft: boolean;
  ownerEmail: string;
  plan: string;
  scimConfigured: boolean;
  ssoDomain: string;
}) {
  const t = useTranslations("dashboard.agency.settings");
  // Profile
  const [name, setName] = useState(agencyName);
  const [description, setDescription] = useState(agencyDescription);
  const [website, setWebsite] = useState(agencyWebsite);
  const profile = useSave();

  // Member defaults
  const [defaultRole, setDefaultRole] = useState(defaultMemberRole);
  const [canInvite, setCanInvite] = useState(membersCanInvite);
  const members = useSave();

  // Security
  const [twofa, setTwofa] = useState(require2fa);
  const [domains, setDomains] = useState<string[]>(allowedDomains);
  const [domainInput, setDomainInput] = useState("");
  const [domainError, setDomainError] = useState("");
  const security = useSave();

  // Notifications
  const [notifyJoined, setNotifyJoined] = useState(notifyMemberJoined);
  const [notifyLeft, setNotifyLeft] = useState(notifyMemberLeft);
  const notifications = useSave();

  const planLabel =
    plan === "enterprise" ? "Enterprise"
    : plan === "agency" ? "Agency"
    : plan === "pilot" ? "Pilot"
    : plan === "team" ? "Team"
    : "Pro";

  const isOrgPlan = plan === "agency" || plan === "enterprise";

  const [scimConfigured, setScimConfigured] = useState(initialScimConfigured);
  const [ssoDomain, setSsoDomain] = useState(initialSsoDomain);
  const [ssoSaving, setSsoSaving] = useState(false);
  const [ssoSaved, setSsoSaved] = useState(false);
  const [ssoError, setSsoError] = useState("");
  const [scimToken, setScimToken] = useState<string | null>(null);
  const [scimGenerating, setScimGenerating] = useState(false);
  const [scimError, setScimError] = useState("");
  const [scimCopied, setScimCopied] = useState<"endpoint" | "token" | null>(null);

  const scimEndpoint =
    typeof window !== "undefined" ? `${window.location.origin}/api/v1/scim/v2/Users` : "/api/v1/scim/v2/Users";

  async function copyScim(value: string, kind: "endpoint" | "token") {
    await navigator.clipboard.writeText(value);
    setScimCopied(kind);
    setTimeout(() => setScimCopied(null), 2000);
  }

  async function generateScimToken() {
    setScimGenerating(true);
    setScimError("");
    setScimToken(null);
    const res = await fetch("/api/agency/scim-token", { method: "POST" });
    const json = await res.json().catch(() => ({}));
    if (res.ok && json.token) {
      setScimToken(json.token);
      setScimConfigured(true);
    } else {
      setScimError(json.error ?? t("scim.generateFailed"));
    }
    setScimGenerating(false);
  }

  async function saveSsoDomain() {
    setSsoSaving(true);
    setSsoSaved(false);
    setSsoError("");
    const res = await fetch("/api/agency", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sso_domain: ssoDomain.trim() || null }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok) {
      setSsoSaved(true);
      setTimeout(() => setSsoSaved(false), 2500);
    } else {
      setSsoError(typeof json.error === "string" ? json.error : t("errors.saveFailed"));
    }
    setSsoSaving(false);
  }

  const navItems = [
    { id: "profile", label: t("nav.profile") },
    { id: "members", label: t("nav.members") },
    { id: "security", label: t("nav.security") },
    { id: "notifications", label: t("nav.notifications") },
    ...(isOrgPlan ? [{ id: "sso", label: t("nav.sso") }] : []),
    { id: "danger", label: t("nav.danger") },
  ];

  function addDomain() {
    const d = domainInput.trim().toLowerCase().replace(/^@/, "");
    if (!d) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      setDomainError(t("security.invalidDomain"));
      return;
    }
    if (domains.includes(d)) {
      setDomainError(t("security.domainAlreadyAdded"));
      return;
    }
    setDomains([...domains, d]);
    setDomainInput("");
    setDomainError("");
  }

  function removeDomain(d: string) {
    setDomains(domains.filter((x) => x !== d));
  }

  return (
    <>
      {/* Section jump-nav */}
      <div className="max-w-2xl mb-6 flex flex-wrap gap-2 sticky top-0 z-10 bg-background py-2 -mx-1 px-1">
        {navItems.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="h-7 px-3 text-xs border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors inline-flex items-center"
          >
            {s.label}
          </a>
        ))}
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── AGENCY PROFILE ── */}
        <div id="profile" className="border border-border bg-card scroll-mt-16">
          <SectionHeader icon={Building2} label={t("profile.title")} />
          <div className="px-5 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">{t("profile.nameLabel")}</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("profile.namePlaceholder")}
                maxLength={80}
                className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">{t("profile.descriptionLabel")}</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("profile.descriptionPlaceholder")}
                maxLength={300}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors resize-none"
              />
              <p className="text-[11px] text-foreground-muted mt-1 text-right">
                {t("profile.descriptionCount", { count: description.length })}
              </p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">{t("profile.websiteLabel")}</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder={t("profile.websitePlaceholder")}
                  className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors"
                />
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">{t("profile.ownerLabel")}</label>
              <div className="flex items-center gap-3 h-9 px-3 bg-background-tertiary border border-border">
                <div className="w-5 h-5 shrink-0 bg-background border border-border flex items-center justify-center text-[10px] font-medium text-foreground-secondary uppercase">
                  {ownerEmail[0]}
                </div>
                <span className="text-sm text-foreground-secondary">{ownerEmail}</span>
                <span className="ml-auto text-[10px] font-medium text-accent-primary">{t("profile.ownerBadge")}</span>
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">{t("profile.planLabel")}</label>
              <div className="flex items-center justify-between h-9 px-3 bg-background-tertiary border border-border">
                <span className="text-sm text-foreground-secondary">{planLabel} {t("profile.planSuffix")}</span>
                <a href="/pricing" className="text-xs text-accent-primary hover:underline">
                  {plan === "team" ? t("profile.planManage") : t("profile.planUpgrade")}
                </a>
              </div>
            </div>

            {/* Agency ID */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">{t("profile.agencyIdLabel")}</label>
              <div className="flex items-center h-9 px-3 bg-background-tertiary border border-border">
                <span className="text-xs font-mono text-foreground-muted">{agencyId}</span>
              </div>
            </div>

            {profile.error && <p className="text-xs text-red-400">{profile.error}</p>}
            <div className="pt-1">
              <SaveButton
                onClick={() => profile.save({ name, description, website })}
                saving={profile.saving}
                saved={profile.saved}
                disabled={!name.trim()}
              />
            </div>
          </div>
        </div>

        {/* ── MEMBER DEFAULTS ── */}
        <div id="members" className="border border-border bg-card scroll-mt-16">
          <SectionHeader icon={Users} label={t("members.title")} />
          <div className="px-5 py-5 space-y-5">
            {/* Default role */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">
                {t("members.defaultRoleLabel")}
              </label>
              <div className="relative">
                <select
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light appearance-none transition-colors"
                >
                  <option value="member">{t("members.roleMemberOption")}</option>
                  <option value="admin">{t("members.roleAdminOption")}</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
              </div>
              <p className="text-[11px] text-foreground-muted mt-1.5">
                {t("members.defaultRoleHint")}
              </p>
            </div>

            {/* Members can invite */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">{t("members.canInviteTitle")}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {t("members.canInviteDescription")}
                </p>
              </div>
              <Toggle on={canInvite} onClick={() => setCanInvite((v) => !v)} />
            </div>

            {members.error && <p className="text-xs text-red-400">{members.error}</p>}
            <div className="pt-1">
              <SaveButton
                onClick={() => members.save({ default_member_role: defaultRole, members_can_invite: canInvite })}
                saving={members.saving}
                saved={members.saved}
              />
            </div>
          </div>
        </div>

        {/* ── SECURITY ── */}
        <div id="security" className="border border-border bg-card scroll-mt-16">
          <SectionHeader icon={Shield} label={t("security.title")} />
          <div className="px-5 py-5 space-y-5">
            {/* Require 2FA */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">{t("security.require2faTitle")}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {t("security.require2faDescription")}
                </p>
              </div>
              <Toggle on={twofa} onClick={() => setTwofa((v) => !v)} />
            </div>

            {/* Allowed domains */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">
                {t("security.domainsLabel")}
              </label>
              <p className="text-[11px] text-foreground-muted mb-3">
                {t.rich("security.domainsHint", {
                  example: (chunks) => <span className="font-mono">{chunks}</span>,
                })}
              </p>

              {domains.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {domains.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center gap-1.5 px-2 py-1 bg-background-tertiary border border-border text-xs font-mono text-foreground-secondary"
                    >
                      @{d}
                      <button
                        onClick={() => removeDomain(d)}
                        className="text-foreground-muted hover:text-foreground transition-colors"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="flex gap-2">
                <input
                  type="text"
                  value={domainInput}
                  onChange={(e) => { setDomainInput(e.target.value); setDomainError(""); }}
                  onKeyDown={(e) => e.key === "Enter" && addDomain()}
                  placeholder={t("security.domainPlaceholder")}
                  className="flex-1 h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors font-mono"
                />
                <button
                  onClick={addDomain}
                  className="h-9 px-3 text-xs border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t("security.addDomain")}
                </button>
              </div>
              {domainError && <p className="text-xs text-red-400 mt-1.5">{domainError}</p>}
            </div>

            {security.error && <p className="text-xs text-red-400">{security.error}</p>}
            <div className="pt-1">
              <SaveButton
                onClick={() => security.save({ require_2fa: twofa, allowed_domains: domains })}
                saving={security.saving}
                saved={security.saved}
              />
            </div>
          </div>
        </div>

        {/* ── NOTIFICATIONS ── */}
        <div id="notifications" className="border border-border bg-card scroll-mt-16">
          <SectionHeader icon={Bell} label={t("notifications.title")} />
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm text-foreground">{t("notifications.memberJoinedTitle")}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {t("notifications.memberJoinedDescription")}
                </p>
              </div>
              <Toggle on={notifyJoined} onClick={() => setNotifyJoined((v) => !v)} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-foreground">{t("notifications.memberLeftTitle")}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {t("notifications.memberLeftDescription")}
                </p>
              </div>
              <Toggle on={notifyLeft} onClick={() => setNotifyLeft((v) => !v)} />
            </div>

            {notifications.error && <p className="text-xs text-red-400">{notifications.error}</p>}
            <div className="pt-1">
              <SaveButton
                onClick={() => notifications.save({ notify_member_joined: notifyJoined, notify_member_left: notifyLeft })}
                saving={notifications.saving}
                saved={notifications.saved}
              />
            </div>
          </div>
        </div>

        {/* ── SSO & SCIM (Agency / Enterprise only) ── */}
        {isOrgPlan && (
          <div id="sso" className="border border-border bg-card scroll-mt-16">
            <SectionHeader icon={Key} label={t("scim.title")} />
            <div className="px-5 py-5 space-y-5">
              <p className="text-sm text-foreground-secondary">{t("scim.description")}</p>
              <p className="text-xs text-foreground-muted">{t("scim.cacPivNote")}</p>

              <div>
                <label className="block text-xs text-foreground-secondary mb-2">{t("scim.ssoDomainLabel")}</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={ssoDomain}
                    onChange={(e) => setSsoDomain(e.target.value.toLowerCase())}
                    placeholder={t("scim.ssoDomainPlaceholder")}
                    className="flex-1 h-9 px-3 bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent-primary/50"
                  />
                  <SaveButton
                    onClick={saveSsoDomain}
                    saving={ssoSaving}
                    saved={ssoSaved}
                  />
                </div>
                <p className="text-xs text-foreground-muted mt-2">{t("scim.ssoDomainHelp")}</p>
                {ssoError && <p className="text-xs text-red-400 mt-2">{ssoError}</p>}
              </div>

              <div>
                <label className="block text-xs text-foreground-secondary mb-2">{t("scim.endpointLabel")}</label>
                <div className="flex gap-2">
                  <div className="flex-1 flex items-center h-9 px-3 bg-background-tertiary border border-border overflow-hidden">
                    <span className="text-xs font-mono text-foreground-muted truncate">{scimEndpoint}</span>
                  </div>
                  <button
                    onClick={() => copyScim(scimEndpoint, "endpoint")}
                    className="h-9 px-3 text-xs border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors inline-flex items-center gap-1.5 shrink-0"
                  >
                    {scimCopied === "endpoint" ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
                    {scimCopied === "endpoint" ? t("scim.copied") : t("scim.copy")}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs text-foreground-secondary mb-2">{t("scim.tokenLabel")}</label>
                <p className="text-xs text-foreground-muted mb-3">
                  {scimConfigured ? t("scim.tokenConfigured") : t("scim.tokenNotConfigured")}
                </p>
                <button
                  onClick={generateScimToken}
                  disabled={scimGenerating}
                  className="h-9 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground disabled:opacity-40 transition-colors inline-flex items-center gap-2"
                >
                  {scimGenerating ? t("scim.generating") : scimConfigured ? t("scim.regenerate") : t("scim.generate")}
                </button>
              </div>

              {scimToken && (
                <div className="border border-accent-primary/30 bg-accent-primary/5 p-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{t("scim.tokenRevealTitle")}</p>
                    <p className="text-xs text-foreground-muted mt-1">{t("scim.tokenRevealDescription")}</p>
                  </div>
                  <div className="flex gap-2">
                    <div className="flex-1 flex items-center h-9 px-3 bg-background border border-border overflow-hidden">
                      <span className="text-xs font-mono text-foreground truncate">{scimToken}</span>
                    </div>
                    <button
                      onClick={() => copyScim(scimToken, "token")}
                      className="h-9 px-3 text-xs border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors inline-flex items-center gap-1.5 shrink-0"
                    >
                      {scimCopied === "token" ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
                      {scimCopied === "token" ? t("scim.copied") : t("scim.copyToken")}
                    </button>
                  </div>
                </div>
              )}

              {scimError && <p className="text-xs text-red-400">{scimError}</p>}
            </div>
          </div>
        )}

        {/* ── DANGER ZONE ── */}
        <div id="danger" className="border border-red-900/40 bg-card scroll-mt-16">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-900/40">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-sm font-medium text-red-400">
              {t("danger.title")}
            </span>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">{t("danger.cancelTitle")}</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  {t("danger.cancelDescription")}
                </p>
              </div>
              <a
                href="/pricing"
                className="shrink-0 h-8 px-4 text-xs font-medium border border-red-900/40 text-red-400 hover:border-red-400 hover:bg-red-400/10 transition-colors inline-flex items-center"
              >
                {t("danger.cancelCta")}
              </a>
            </div>
          </div>
        </div>

      </div>
    </>
  );
}
