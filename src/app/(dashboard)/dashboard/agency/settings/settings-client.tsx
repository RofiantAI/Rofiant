"use client";

import { useState } from "react";
import {
  Building2, Save, AlertTriangle, Check, Globe, Shield,
  Users, Bell, ChevronDown, X, Plus, Lock, Copy, RefreshCw,
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
    <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
      <Icon className="w-3.5 h-3.5 text-foreground-muted" />
      <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
        {label}
      </span>
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
  return (
    <button
      onClick={onClick}
      disabled={saving || disabled}
      className="h-8 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground disabled:opacity-40 transition-colors inline-flex items-center gap-2"
    >
      {saved ? (
        <><Check className="w-3.5 h-3.5 text-accent-success" /> Saved</>
      ) : saving ? (
        "Saving…"
      ) : (
        <><Save className="w-3.5 h-3.5" /> Save</>
      )}
    </button>
  );
}

function useSave() {
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
      setError(json.error ?? "Failed to save");
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
  isSSOPlan,
  ssoEnabled: initialSsoEnabled,
  ssoProvider: initialSsoProvider,
  ssoConfig: initialSsoConfig,
  scimToken: initialScimToken,
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
  isSSOPlan: boolean;
  ssoEnabled: boolean;
  ssoProvider: string;
  ssoConfig: Record<string, string>;
  scimToken: string;
}) {
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

  // SSO
  const [ssoEnabled, setSsoEnabled] = useState(initialSsoEnabled);
  const [ssoProvider, setSsoProvider] = useState(initialSsoProvider);
  const [ssoConfig, setSsoConfig] = useState<Record<string, string>>(initialSsoConfig ?? {});
  const [scimToken, setScimToken] = useState(initialScimToken);
  const [generatingScim, setGeneratingScim] = useState(false);
  const [copiedScim, setCopiedScim] = useState(false);
  const sso = useSave();

  const planLabel =
    plan === "enterprise" ? "Enterprise"
    : plan === "agency" ? "Agency"
    : plan === "pilot" ? "Pilot"
    : plan === "team" ? "Team"
    : "Pro";

  async function generateScimToken() {
    setGeneratingScim(true);
    const res = await fetch("/api/agency/scim-token", { method: "POST" });
    if (res.ok) {
      const d = await res.json();
      setScimToken(d.token);
    }
    setGeneratingScim(false);
  }

  function copyScimToken() {
    navigator.clipboard.writeText(scimToken);
    setCopiedScim(true);
    setTimeout(() => setCopiedScim(false), 2000);
  }

  function addDomain() {
    const d = domainInput.trim().toLowerCase().replace(/^@/, "");
    if (!d) return;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
      setDomainError("Invalid domain (e.g. example.com)");
      return;
    }
    if (domains.includes(d)) {
      setDomainError("Already added");
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
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-foreground">Agency settings</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Configure your agency workspace, security, and notification preferences
        </p>
      </div>

      <div className="max-w-2xl space-y-6">

        {/* ── AGENCY PROFILE ── */}
        <div className="border border-border bg-card">
          <SectionHeader icon={Building2} label="Agency profile" />
          <div className="px-5 py-5 space-y-5">
            {/* Name */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">Agency name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Agency"
                maxLength={80}
                className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors"
              />
            </div>

            {/* Description */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">Description</label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A short description of your agency…"
                maxLength={300}
                rows={3}
                className="w-full px-3 py-2 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors resize-none"
              />
              <p className="text-[11px] text-foreground-muted mt-1 text-right">
                {description.length}/300
              </p>
            </div>

            {/* Website */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://example.com"
                  className="w-full h-9 pl-8 pr-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors"
                />
              </div>
            </div>

            {/* Owner */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">Owner</label>
              <div className="flex items-center gap-3 h-9 px-3 bg-background-tertiary border border-border">
                <div className="w-5 h-5 shrink-0 bg-background border border-border flex items-center justify-center text-[10px] font-medium text-foreground-secondary uppercase">
                  {ownerEmail[0]}
                </div>
                <span className="text-sm text-foreground-secondary">{ownerEmail}</span>
                <span className="ml-auto text-[10px] font-medium text-accent-primary">owner</span>
              </div>
            </div>

            {/* Plan */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">Plan</label>
              <div className="flex items-center justify-between h-9 px-3 bg-background-tertiary border border-border">
                <span className="text-sm text-foreground-secondary">{planLabel} plan</span>
                <a href="/pricing" className="text-xs text-accent-primary hover:underline">
                  {plan === "team" ? "Manage" : "Upgrade"} →
                </a>
              </div>
            </div>

            {/* Agency ID */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">Agency ID</label>
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
        <div className="border border-border bg-card">
          <SectionHeader icon={Users} label="Member defaults" />
          <div className="px-5 py-5 space-y-5">
            {/* Default role */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">
                Default role for new members
              </label>
              <div className="relative">
                <select
                  value={defaultRole}
                  onChange={(e) => setDefaultRole(e.target.value)}
                  className="w-full h-9 pl-3 pr-8 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light appearance-none transition-colors"
                >
                  <option value="member">Member — standard access</option>
                  <option value="admin">Admin — full agency access</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
              </div>
              <p className="text-[11px] text-foreground-muted mt-1.5">
                Applied when accepting invitations. Can be changed per member.
              </p>
            </div>

            {/* Members can invite */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">Members can invite others</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Allow members (not just admins) to send invitations
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
        <div className="border border-border bg-card">
          <SectionHeader icon={Shield} label="Security" />
          <div className="px-5 py-5 space-y-5">
            {/* Require 2FA */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm text-foreground">Require two-factor authentication</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Members without 2FA enabled will be blocked from accessing agency resources
                </p>
              </div>
              <Toggle on={twofa} onClick={() => setTwofa((v) => !v)} />
            </div>

            {/* Allowed domains */}
            <div>
              <label className="block text-xs text-foreground-secondary mb-2">
                Restrict invites to email domains
              </label>
              <p className="text-[11px] text-foreground-muted mb-3">
                Leave empty to allow any email address. Add domains to restrict (e.g.{" "}
                <span className="font-mono">acme.com</span>).
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
                  placeholder="example.com"
                  className="flex-1 h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors font-mono"
                />
                <button
                  onClick={addDomain}
                  className="h-9 px-3 text-xs border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors inline-flex items-center gap-1.5"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
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
        <div className="border border-border bg-card">
          <SectionHeader icon={Bell} label="Notifications" />
          <div className="px-5 py-5 space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-border">
              <div>
                <p className="text-sm text-foreground">Member joined</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Email when someone accepts an invitation
                </p>
              </div>
              <Toggle on={notifyJoined} onClick={() => setNotifyJoined((v) => !v)} />
            </div>
            <div className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm text-foreground">Member left or removed</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Email when a member leaves or is removed from the agency
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

        {/* ── SSO / SCIM ── */}
        {isSSOPlan ? (
          <div className="border border-border bg-card">
            <SectionHeader icon={Lock} label="Single Sign-On & SCIM" />
            <div className="px-5 py-5 space-y-5">
              {/* Enable SSO */}
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm text-foreground">Enable SSO</p>
                  <p className="text-xs text-foreground-muted mt-0.5">
                    Require members to authenticate via your identity provider
                  </p>
                </div>
                <Toggle on={ssoEnabled} onClick={() => setSsoEnabled((v) => !v)} />
              </div>

              {ssoEnabled && (
                <>
                  {/* Provider */}
                  <div>
                    <label className="block text-xs text-foreground-secondary mb-2">Provider type</label>
                    <div className="relative">
                      <select
                        value={ssoProvider}
                        onChange={(e) => setSsoProvider(e.target.value)}
                        className="w-full h-9 pl-3 pr-8 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light appearance-none transition-colors"
                      >
                        <option value="saml">SAML 2.0 (Okta, Azure AD, ADFS)</option>
                        <option value="oidc">OIDC (Google Workspace, Auth0)</option>
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
                    </div>
                  </div>

                  {ssoProvider === "saml" && (
                    <>
                      <div>
                        <label className="block text-xs text-foreground-secondary mb-2">IdP Metadata URL</label>
                        <input
                          type="url"
                          value={ssoConfig.metadata_url ?? ""}
                          onChange={(e) => setSsoConfig({ ...ssoConfig, metadata_url: e.target.value })}
                          placeholder="https://your-idp.example.com/saml/metadata"
                          className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors"
                        />
                      </div>
                      <div className="px-4 py-3 bg-background-tertiary border border-border text-xs text-foreground-secondary space-y-1">
                        <p className="font-medium text-foreground mb-2">SP settings (provide to your IdP)</p>
                        <p>ACS URL: <span className="font-mono text-foreground">{typeof window !== "undefined" ? window.location.origin : ""}/api/auth/saml/acs</span></p>
                        <p>Entity ID: <span className="font-mono text-foreground">rofiant:{agencyId}</span></p>
                      </div>
                    </>
                  )}

                  {ssoProvider === "oidc" && (
                    <>
                      <div>
                        <label className="block text-xs text-foreground-secondary mb-2">Discovery URL</label>
                        <input
                          type="url"
                          value={ssoConfig.discovery_url ?? ""}
                          onChange={(e) => setSsoConfig({ ...ssoConfig, discovery_url: e.target.value })}
                          placeholder="https://accounts.google.com/.well-known/openid-configuration"
                          className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-foreground-secondary mb-2">Client ID</label>
                        <input
                          type="text"
                          value={ssoConfig.client_id ?? ""}
                          onChange={(e) => setSsoConfig({ ...ssoConfig, client_id: e.target.value })}
                          className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light transition-colors"
                        />
                      </div>
                      <div>
                        <label className="block text-xs text-foreground-secondary mb-2">Client Secret</label>
                        <input
                          type="password"
                          value={ssoConfig.client_secret ?? ""}
                          onChange={(e) => setSsoConfig({ ...ssoConfig, client_secret: e.target.value })}
                          className="w-full h-9 px-3 text-sm bg-background border border-border text-foreground focus:outline-none focus:border-border-light transition-colors"
                        />
                      </div>
                    </>
                  )}
                </>
              )}

              {sso.error && <p className="text-xs text-red-400">{sso.error}</p>}
              <div className="pt-1">
                <SaveButton
                  onClick={() => sso.save({ sso_enabled: ssoEnabled, sso_provider: ssoProvider, sso_config: ssoConfig })}
                  saving={sso.saving}
                  saved={sso.saved}
                />
              </div>

              {/* SCIM */}
              <div className="border-t border-border pt-5">
                <p className="text-sm text-foreground mb-1">SCIM provisioning</p>
                <p className="text-xs text-foreground-muted mb-4">
                  Automatically sync users from your IdP. Use this token in your IdP SCIM connector.
                </p>
                <div className="flex gap-2 mb-2">
                  <div className="flex-1 h-9 px-3 flex items-center bg-background border border-border font-mono text-xs text-foreground-secondary overflow-hidden">
                    {scimToken ? scimToken.slice(0, 32) + "…" : <span className="text-foreground-muted italic">No token generated yet</span>}
                  </div>
                  {scimToken && (
                    <button onClick={copyScimToken} className="h-9 px-3 border border-border text-xs text-foreground-secondary hover:text-foreground hover:border-border-light transition-colors inline-flex items-center gap-1.5">
                      {copiedScim ? <Check className="w-3.5 h-3.5 text-accent-success" /> : <Copy className="w-3.5 h-3.5" />}
                      {copiedScim ? "Copied" : "Copy"}
                    </button>
                  )}
                  <button onClick={generateScimToken} disabled={generatingScim} className="h-9 px-3 border border-border text-xs text-foreground-secondary hover:text-foreground hover:border-border-light disabled:opacity-40 transition-colors inline-flex items-center gap-1.5">
                    <RefreshCw className={`w-3.5 h-3.5 ${generatingScim ? "animate-spin" : ""}`} />
                    {scimToken ? "Rotate" : "Generate"}
                  </button>
                </div>
                <p className="text-[11px] text-foreground-muted">
                  SCIM endpoint: <span className="font-mono">{typeof window !== "undefined" ? window.location.origin : ""}/api/v1/scim/v2/Users</span>
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="border border-border bg-card px-5 py-5">
            <div className="flex items-start gap-3">
              <Lock className="w-4 h-4 text-foreground-muted shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-foreground">SSO & SCIM</p>
                <p className="text-xs text-foreground-muted mt-1">
                  Single sign-on and automated user provisioning are available on Pilot, Agency, and Enterprise plans.
                </p>
                <a href="/pricing" className="text-xs text-accent-primary hover:underline mt-2 inline-block">Upgrade →</a>
              </div>
            </div>
          </div>
        )}

        {/* ── DANGER ZONE ── */}
        <div className="border border-red-900/40 bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-red-900/40">
            <AlertTriangle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-xs font-medium uppercase tracking-widest text-red-400">
              Danger zone
            </span>
          </div>
          <div className="px-5 py-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-foreground">Cancel subscription</p>
                <p className="text-xs text-foreground-muted mt-0.5">
                  Your agency will revert to the free plan at the end of the billing period
                </p>
              </div>
              <a
                href="/pricing"
                className="shrink-0 h-8 px-4 text-xs font-medium border border-red-900/40 text-red-400 hover:border-red-400 hover:bg-red-400/10 transition-colors inline-flex items-center"
              >
                Cancel subscription
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
