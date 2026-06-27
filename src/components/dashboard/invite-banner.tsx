"use client";

import { useState } from "react";
import { Building2, Check, X } from "lucide-react";
import { useRouter } from "next/navigation";

type PendingInvite = {
  id: string;
  agencyName: string;
  role: string;
};

export function InviteBanner({ invites }: { invites: PendingInvite[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(invites);
  const [loading, setLoading] = useState<string | null>(null);

  const respond = async (memberId: string, action: "accept" | "decline") => {
    setLoading(memberId);
    await fetch("/api/agency/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, action }),
    });
    setPending((prev) => prev.filter((i) => i.id !== memberId));
    setLoading(null);
    if (action === "accept") router.refresh();
  };

  if (pending.length === 0) return null;

  return (
    <div className="border-b border-border bg-card">
      {pending.map((invite) => (
        <div
          key={invite.id}
          className="flex items-center gap-4 px-8 py-3 border-b border-border last:border-b-0"
        >
          <Building2 className="w-4 h-4 text-accent-primary shrink-0" />
          <p className="flex-1 text-sm text-foreground-secondary">
            You&apos;ve been invited to join{" "}
            <span className="text-foreground font-medium">{invite.agencyName}</span> as{" "}
            <span className="capitalize">{invite.role}</span>
          </p>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => respond(invite.id, "accept")}
              disabled={loading === invite.id}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 disabled:opacity-50 transition-colors"
            >
              <Check className="w-3 h-3" />
              Accept
            </button>
            <button
              onClick={() => respond(invite.id, "decline")}
              disabled={loading === invite.id}
              className="inline-flex items-center gap-1.5 h-7 px-3 text-xs font-medium border border-border text-foreground-muted hover:text-foreground hover:border-border-light disabled:opacity-50 transition-colors"
            >
              <X className="w-3 h-3" />
              Decline
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
