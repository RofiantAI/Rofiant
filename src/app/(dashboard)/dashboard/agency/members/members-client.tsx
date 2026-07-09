"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import {
  Users,
  Trash2,
  ChevronDown,
  UserPlus,
  Mail,
  Check,
  AlertCircle,
} from "lucide-react";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardList,
  DashboardPrimaryButton,
} from "@/components/dashboard/ui/page-shell";

type Member = {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  joined_at: string | null;
};

const ROLES = ["admin", "member"] as const;

export function MembersClient({
  initialMembers,
  ownerEmail,
  isTeamPlan,
}: {
  initialMembers: Member[];
  ownerEmail: string;
  isTeamPlan: boolean;
}) {
  const t = useTranslations("dashboard.agency.members");

  function relativeTime(iso: string) {
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (mins < 1) return t("relativeTime.justNow");
    if (mins < 60) return t("relativeTime.minutes", { count: mins });
    if (hrs < 24) return t("relativeTime.hours", { count: hrs });
    return t("relativeTime.days", { count: days });
  }

  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    setInviteError("");
    setInviteSuccess("");

    const res = await fetch("/api/agency/members", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole }),
    });

    if (res.ok) {
      const member = await res.json();
      setMembers((prev) => [member, ...prev]);
      setInviteEmail("");
      setInviteSuccess(t("invite.successMessage", { email: member.email }));
      setTimeout(() => setInviteSuccess(""), 4000);
    } else {
      const err = await res.json();
      setInviteError(err.error ?? t("invite.errorFallback"));
    }
    setInviting(false);
  };

  const handleRemove = async (id: string) => {
    setActionError("");
    setConfirmRemoveId(null);
    setRemovingId(id);
    const res = await fetch(`/api/agency/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    } else {
      const err = await res.json().catch(() => ({}));
      setActionError(err.error ?? t("removeErrorFallback"));
    }
    setRemovingId(null);
  };

  const handleRoleChange = async (id: string, role: string) => {
    setActionError("");
    setChangingRoleId(id);
    const res = await fetch(`/api/agency/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      const updated = await res.json();
      setMembers((prev) =>
        prev.map((m) => (m.id === id ? { ...m, role: updated.role } : m)),
      );
    } else {
      const err = await res.json().catch(() => ({}));
      setActionError(err.error ?? t("roleErrorFallback"));
    }
    setChangingRoleId(null);
  };

  return (
    <DashboardPage>
      <DashboardHeader title={t("title")} description={t("subtitle")} />

      {isTeamPlan ? (
        <DashboardCard>
          <h2 className="text-sm font-medium text-foreground mb-4">{t("invite.title")}</h2>
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder={t("invite.emailPlaceholder")}
                className="w-full h-9 pl-9 pr-3 text-sm bg-background border border-border text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors"
                required
              />
            </div>
            <div className="relative">
              <select
                value={inviteRole}
                onChange={(e) =>
                  setInviteRole(e.target.value as typeof inviteRole)
                }
                className="h-9 px-3 pr-8 text-sm bg-background border border-border text-foreground appearance-none focus:outline-none focus:border-border-light transition-colors cursor-pointer"
              >
                <option value="admin">{t("invite.roleAdmin")}</option>
                <option value="member">{t("invite.roleMember")}</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="h-9 px-5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {inviting ? t("invite.sending") : t("invite.sendInvite")}
            </button>
          </form>

          {inviteError && (
            <div className="flex items-center gap-2 mt-3 text-xs text-red-400">
              <AlertCircle className="w-3.5 h-3.5" />
              {inviteError}
            </div>
          )}
          {inviteSuccess && (
            <div className="flex items-center gap-2 mt-3 text-xs text-accent-success">
              <Check className="w-3.5 h-3.5" />
              {inviteSuccess}
            </div>
          )}
        </DashboardCard>
      ) : (
        <DashboardCard className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-foreground-muted" />
            <div>
              <p className="text-sm text-foreground">
                {t("upgradeBanner.title")}
              </p>
              <p className="text-xs text-foreground-muted mt-0.5">
                {t("upgradeBanner.subtitle")}
              </p>
            </div>
          </div>
          <a
            href="/pricing"
            className="shrink-0 h-8 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors inline-flex items-center"
          >
            {t("upgradeBanner.cta")}
          </a>
        </DashboardCard>
      )}

      {actionError && (
        <div className="flex items-center gap-2 text-xs text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          {actionError}
        </div>
      )}

      <DashboardList>
        <div className="flex items-center justify-between px-5 py-3 border-b border-border">
          <span className="text-sm font-medium text-foreground">{t("table.title")}</span>
          <span className="text-xs text-foreground-muted tabular-nums">
            {t("table.total", { count: members.length })}
          </span>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
            <p className="text-sm text-foreground-secondary">{t("table.empty")}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {members.map((m) => {
              const isOwner = m.email === ownerEmail;
              const isChanging = changingRoleId === m.id;
              const isRemoving = removingId === m.id;

              return (
                <div key={m.id} className="flex items-center gap-4 px-5 py-4">
                  {/* Avatar */}
                  <div className="w-7 h-7 shrink-0 bg-background-tertiary border border-border flex items-center justify-center text-[11px] font-medium text-foreground-secondary uppercase">
                    {m.email[0]}
                  </div>

                  {/* Email + joined */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground truncate">
                        {m.email}
                      </p>
                      {isOwner && (
                        <span className="text-[10px] font-medium text-accent-primary shrink-0">
                          {t("table.owner")}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-foreground-muted mt-0.5">
                      {m.status === "active" && m.joined_at
                        ? t("table.joined", { time: relativeTime(m.joined_at) })
                        : t("table.invited", { time: relativeTime(m.invited_at) })}
                    </p>
                  </div>

                  {/* Status badge */}
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 border shrink-0 ${
                      m.status === "active"
                        ? "text-accent-success border-accent-success/20 bg-accent-success/10"
                        : "text-foreground-muted border-border bg-background-tertiary"
                    }`}
                  >
                    {m.status}
                  </span>

                  {/* Role selector */}
                  {!isOwner && isTeamPlan ? (
                    <div className="relative shrink-0">
                      <select
                        value={m.role}
                        onChange={(e) => handleRoleChange(m.id, e.target.value)}
                        disabled={isChanging}
                        className="h-7 pl-2 pr-6 text-xs bg-background border border-border text-foreground-secondary appearance-none focus:outline-none focus:border-border-light transition-colors cursor-pointer disabled:opacity-50"
                      >
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r.charAt(0).toUpperCase() + r.slice(1)}
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 text-foreground-muted pointer-events-none" />
                    </div>
                  ) : (
                    <span className="text-xs text-foreground-secondary capitalize shrink-0 w-16 text-right">
                      {m.role}
                    </span>
                  )}

                  {/* Remove */}
                  {!isOwner && isTeamPlan && (
                    confirmRemoveId === m.id ? (
                      <div className="shrink-0 flex items-center gap-1.5">
                        <button
                          onClick={() => handleRemove(m.id)}
                          disabled={isRemoving}
                          className="h-7 px-2 text-[10px] font-medium bg-red-400/10 text-red-400 border border-red-400/30 hover:bg-red-400/20 transition-colors disabled:opacity-50"
                        >
                          {isRemoving ? t("table.removing") : t("table.confirm")}
                        </button>
                        <button
                          onClick={() => setConfirmRemoveId(null)}
                          className="h-7 px-2 text-[10px] text-foreground-muted hover:text-foreground border border-border transition-colors"
                        >
                          {t("table.cancel")}
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmRemoveId(m.id)}
                        className="shrink-0 w-7 h-7 flex items-center justify-center text-foreground-muted hover:text-red-400 hover:bg-red-400/10 transition-colors"
                        title={t("table.removeTooltip")}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )
                  )}
                </div>
              );
            })}
          </div>
        )}
      </DashboardList>
    </DashboardPage>
  );
}
