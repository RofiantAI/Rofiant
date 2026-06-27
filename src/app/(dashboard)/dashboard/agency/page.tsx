import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import {
  Users,
  Building2,
  MessageSquare,
  FileText,
  Brain,
  ArrowUpRight,
  UserCheck,
  Clock,
} from "lucide-react";
import Link from "next/link";

export default async function AgencyOverviewPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const plan: string = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isPaid = plan === "pro" || plan === "team";

  if (!isPaid) {
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-2xl font-normal text-foreground">Agency</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Manage your agency, team members, and billing
          </p>
        </div>
        <div className="border border-border bg-card p-10 flex flex-col items-center text-center max-w-md mx-auto mt-16">
          <div className="flex items-center justify-center w-12 h-12 mb-5 bg-background-tertiary border border-border">
            <Building2 className="w-5 h-5 text-foreground-muted" />
          </div>
          <h2 className="text-lg font-normal text-foreground mb-2">
            Agency dashboard requires a paid plan
          </h2>
          <p className="text-sm text-foreground-secondary mb-8">
            Upgrade to Pro or Team to access agency management, member controls, and billing.
          </p>
          <Link
            href="/pricing"
            className="inline-flex items-center gap-2 h-10 px-6 text-sm font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
          >
            View plans
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    );
  }

  // Get or create agency
  let { data: agency } = await supabase
    .from("agencies")
    .select("*")
    .eq("owner_id", user.id)
    .single();

  if (!agency) {
    const { data: created } = await supabase
      .from("agencies")
      .insert({ owner_id: user.id, name: "My Agency" })
      .select()
      .single();

    if (created) {
      await supabase.from("agency_members").insert({
        agency_id: created.id,
        user_id: user.id,
        email: user.email,
        role: "admin",
        status: "active",
        joined_at: new Date().toISOString(),
      });
      agency = created;
    }
  }

  const [
    { data: members },
    { count: convCount },
    { count: msgCount },
    { count: docCount },
    { count: agentCount },
  ] = await Promise.all([
    supabase
      .from("agency_members")
      .select("id, email, role, status, invited_at, joined_at")
      .eq("agency_id", agency?.id ?? "")
      .limit(5)
      .order("invited_at", { ascending: false }),
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }),
    supabase.from("agents").select("*", { count: "exact", head: true }),
  ]);

  const allMembers = members ?? [];
  const activeMembers = allMembers.filter((m) => m.status === "active").length;
  const pendingMembers = allMembers.filter((m) => m.status === "pending").length;

  const planLabel = plan === "team" ? "Team" : "Pro";

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-normal text-foreground">
              {agency?.name ?? "My Agency"}
            </h1>
            <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
              {planLabel}
            </span>
          </div>
          <p className="text-sm text-foreground-secondary">
            Agency overview — manage members, usage, and settings
          </p>
        </div>
        {plan === "team" && (
          <Link
            href="/dashboard/agency/members"
            className="inline-flex items-center gap-2 h-9 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors"
          >
            <Users className="w-3.5 h-3.5" />
            Invite member
          </Link>
        )}
      </div>

      {/* Stat strip */}
      <div className="border border-border bg-card mb-6">
        <div className="grid grid-cols-4 divide-x divide-border">
          {[
            {
              label: "Team members",
              value: activeMembers,
              sub: pendingMembers > 0 ? `${pendingMembers} pending invite` : "active",
              href: "/dashboard/agency/members",
              icon: Users,
            },
            {
              label: "Conversations",
              value: convCount ?? 0,
              sub: "your workspace",
              href: "/chat",
              icon: MessageSquare,
            },
            {
              label: "Documents",
              value: docCount ?? 0,
              sub: "indexed",
              href: "/dashboard/documents",
              icon: FileText,
            },
            {
              label: "Agents",
              value: agentCount ?? 0,
              sub: "deployed",
              href: "/dashboard/agents",
              icon: Brain,
            },
          ].map((stat) => (
            <Link
              key={stat.label}
              href={stat.href}
              className="group px-6 py-5 hover:bg-background-tertiary transition-colors"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
                  {stat.label}
                </span>
                <ArrowUpRight className="w-3 h-3 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity mt-0.5" />
              </div>
              <div className="font-mono text-2xl font-light text-foreground tabular-nums">
                {stat.value.toLocaleString()}
              </div>
              <div className="text-xs text-foreground-muted mt-1">{stat.sub}</div>
            </Link>
          ))}
        </div>
      </div>

      {/* Main grid */}
      <div className="grid grid-cols-[1fr_280px] gap-6">
        {/* Team members preview */}
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <Users className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                Team members
              </span>
            </div>
            <Link
              href="/dashboard/agency/members"
              className="text-xs text-foreground-muted hover:text-foreground transition-colors"
            >
              Manage →
            </Link>
          </div>

          {allMembers.length > 0 ? (
            <div className="divide-y divide-border">
              {allMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between px-5 py-3.5"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-6 h-6 shrink-0 bg-background-tertiary border border-border flex items-center justify-center text-[10px] font-medium text-foreground-secondary uppercase">
                      {m.email[0]}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-foreground truncate">{m.email}</p>
                      <p className="text-[10px] text-foreground-muted capitalize">{m.role}</p>
                    </div>
                  </div>
                  <span
                    className={`text-[10px] font-medium uppercase tracking-wider px-2 py-0.5 border ${
                      m.status === "active"
                        ? "text-accent-success border-accent-success/20 bg-accent-success/10"
                        : "text-foreground-muted border-border bg-background-tertiary"
                    }`}
                  >
                    {m.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-5 py-12 text-center">
              <Users className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
              <p className="text-sm text-foreground-secondary mb-1">No team members yet</p>
              {plan === "team" && (
                <Link
                  href="/dashboard/agency/members"
                  className="inline-block mt-2 text-xs text-accent-primary hover:underline"
                >
                  Invite your first member →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Right column */}
        <div className="space-y-4">
          {/* Agency quick links */}
          <div className="border border-border bg-card">
            <div className="px-5 py-3 border-b border-border">
              <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
                Agency controls
              </span>
            </div>
            <div className="divide-y divide-border">
              {[
                { label: "Members", href: "/dashboard/agency/members", icon: Users, show: plan === "team" },
                { label: "Billing", href: "/dashboard/agency/billing", icon: UserCheck, show: true },
                { label: "Settings", href: "/dashboard/agency/settings", icon: Building2, show: true },
              ]
                .filter((i) => i.show)
                .map(({ label, href, icon: Icon }) => (
                  <Link
                    key={label}
                    href={href}
                    className="group flex items-center justify-between px-5 py-3 hover:bg-background-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-3.5 h-3.5 text-foreground-muted" />
                      <span className="text-sm text-foreground-secondary group-hover:text-foreground transition-colors">
                        {label}
                      </span>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-foreground-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                  </Link>
                ))}
            </div>
          </div>

          {/* Agency info */}
          <div className="border border-border bg-card p-5">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
                Plan details
              </span>
              <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                {planLabel}
              </span>
            </div>
            <div className="space-y-2 text-xs text-foreground-secondary">
              {plan === "team"
                ? [
                    "Unlimited team members",
                    "Shared workspace",
                    "Priority support",
                    "Advanced analytics",
                  ]
                : ["Single user", "API access", "Advanced models", "Priority support"]}
            </div>
            {plan !== "team" && (
              <Link
                href="/pricing"
                className="mt-4 flex items-center justify-center gap-2 w-full h-8 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors"
              >
                Upgrade to Team
                <ArrowUpRight className="w-3 h-3" />
              </Link>
            )}
          </div>

          {/* Created */}
          {agency && (
            <div className="border border-border bg-card px-5 py-4">
              <div className="flex items-center gap-2 text-xs text-foreground-muted">
                <Clock className="w-3.5 h-3.5" />
                Agency created{" "}
                {new Date(agency.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
