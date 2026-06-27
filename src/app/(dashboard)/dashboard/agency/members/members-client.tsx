"use client";

import { useState } from "react";
import {
  Users,
  Trash2,
  ChevronDown,
  UserPlus,
  Mail,
  Check,
  AlertCircle,
} from "lucide-react";

type Member = {
  id: string;
  email: string;
  role: string;
  status: string;
  invited_at: string;
  joined_at: string | null;
};

const ROLES = ["admin", "member"] as const;

function relativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hrs = Math.floor(mins / 60);
  const days = Math.floor(hrs / 24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}

export function MembersClient({
  initialMembers,
  ownerEmail,
  isTeamPlan,
}: {
  initialMembers: Member[];
  ownerEmail: string;
  isTeamPlan: boolean;
}) {
  const [members, setMembers] = useState<Member[]>(initialMembers);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [inviting, setInviting] = useState(false);
  const [inviteError, setInviteError] = useState("");
  const [inviteSuccess, setInviteSuccess] = useState("");
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [changingRoleId, setChangingRoleId] = useState<string | null>(null);

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
      setInviteSuccess(`Invite sent to ${member.email}`);
      setTimeout(() => setInviteSuccess(""), 4000);
    } else {
      const err = await res.json();
      setInviteError(err.error ?? "Failed to send invite");
    }
    setInviting(false);
  };

  const handleRemove = async (id: string) => {
    setRemovingId(id);
    const res = await fetch(`/api/agency/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      setMembers((prev) => prev.filter((m) => m.id !== id));
    }
    setRemovingId(null);
  };

  const handleRoleChange = async (id: string, role: string) => {
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
    }
    setChangingRoleId(null);
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-foreground">Team members</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Invite and manage who has access to your agency workspace
        </p>
      </div>

      {/* Invite form */}
      {isTeamPlan ? (
        <div className="border border-border bg-card p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <UserPlus className="w-3.5 h-3.5 text-foreground-muted" />
            <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Invite member
            </span>
          </div>
          <form onSubmit={handleInvite} className="flex gap-3">
            <div className="flex-1 relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
              <input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="colleague@example.com"
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
                <option value="admin">Admin</option>
                <option value="member">Member</option>
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
            </div>
            <button
              type="submit"
              disabled={inviting}
              className="h-9 px-5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              {inviting ? "Sending…" : "Send invite"}
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

          <div className="mt-4 pt-4 border-t border-border grid grid-cols-3 gap-4 text-xs text-foreground-muted">
            <div>
              <span className="font-medium text-foreground-secondary">
                Admin
              </span>
              <p className="mt-0.5">Full access, can invite members</p>
            </div>
            <div>
              <span className="font-medium text-foreground-secondary">
                Member
              </span>
              <p className="mt-0.5">Can use workspace tools</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="border border-border bg-card p-5 mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="w-4 h-4 text-foreground-muted" />
            <div>
              <p className="text-sm text-foreground">
                Team invitations require the Team plan
              </p>
              <p className="text-xs text-foreground-muted mt-0.5">
                Upgrade to invite unlimited members
              </p>
            </div>
          </div>
          <a
            href="/pricing"
            className="shrink-0 h-8 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors inline-flex items-center"
          >
            Upgrade →
          </a>
        </div>
      )}

      {/* Members table */}
      <div className="border border-border bg-card">
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-foreground-muted" />
            <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Members
            </span>
          </div>
          <span className="text-xs text-foreground-muted font-mono">
            {members.length} total
          </span>
        </div>

        {members.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Users className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
            <p className="text-sm text-foreground-secondary">No members yet</p>
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
                          owner
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-foreground-muted mt-0.5">
                      {m.status === "active" && m.joined_at
                        ? `Joined ${relativeTime(m.joined_at)}`
                        : `Invited ${relativeTime(m.invited_at)}`}
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
                    <button
                      onClick={() => handleRemove(m.id)}
                      disabled={isRemoving}
                      className="shrink-0 w-7 h-7 flex items-center justify-center text-foreground-muted hover:text-red-400 hover:bg-red-400/10 transition-colors disabled:opacity-50"
                      title="Remove member"
                    >
                      {isRemoving ? (
                        <span className="text-[10px]">…</span>
                      ) : (
                        <Trash2 className="w-3.5 h-3.5" />
                      )}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
