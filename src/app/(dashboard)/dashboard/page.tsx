import { createClient } from "@/lib/supabase/server";
import { MessageSquare, FileText, ArrowUpRight, Zap } from "lucide-react";
import Link from "next/link";
import { OverviewChart } from "./overview-chart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  const [{ count: convCount }, { count: msgCount }, { data: recentConvs }, { data: userConvs }] =
    await Promise.all([
      supabase.from("conversations").select("*", { count: "exact", head: true }),
      supabase.from("messages").select("*", { count: "exact", head: true }),
      supabase
        .from("conversations")
        .select("id, title, updated_at")
        .order("updated_at", { ascending: false })
        .limit(8),
      supabase
        .from("conversations")
        .select("id")
        .gte("created_at", fourteenDaysAgo),
    ]);

  const convIds14 = (userConvs ?? []).map((c) => c.id);
  const { data: recentMsgs } = convIds14.length > 0
    ? await supabase
        .from("messages")
        .select("created_at")
        .in("conversation_id", convIds14)
        .gte("created_at", fourteenDaysAgo)
    : { data: [] };

  const msgDayMap = new Map<string, number>();
  for (const m of recentMsgs ?? []) {
    const day = (m.created_at as string).slice(0, 10);
    msgDayMap.set(day, (msgDayMap.get(day) ?? 0) + 1);
  }
  const activityData = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (13 - i));
    const key = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    return { day: label, messages: msgDayMap.get(key) ?? 0 };
  });

  const conversations = convCount ?? 0;
  const messages = msgCount ?? 0;
  const convLimit = 100;
  const msgLimit = 1000;
  const convPct = Math.min(Math.round((conversations / convLimit) * 100), 100);
  const msgPct = Math.min(Math.round((messages / msgLimit) * 100), 100);

  const plan: string = (user?.user_metadata?.plan ?? "free" as string).toLowerCase();
  const planLabel = plan === "team" ? "Team" : plan === "pro" ? "Pro" : "Free";
  const isPaid = plan === "pro" || plan === "team";

  const name = user?.email?.split("@")[0] ?? "there";
  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  const now = new Date();
  const dateStr = now.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });

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

  return (
    <>
      {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs text-foreground-muted uppercase tracking-widest mb-1">
              {greeting}
            </p>
            <h1 className="text-3xl font-light text-foreground">{name}</h1>
          </div>
          <div className="text-right">
            <p className="text-xs text-foreground-muted">{dateStr}</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              {user?.email}
            </p>
          </div>
        </div>

        {/* Stat strip */}
        <div className="border border-border bg-card mb-8">
          <div className="grid grid-cols-4 divide-x divide-border">
            {[
              {
                label: "Conversations",
                value: conversations,
                sub: `of ${convLimit} this month`,
                href: "/chat",
              },
              {
                label: "Messages",
                value: messages,
                sub: `of ${msgLimit} this month`,
                href: "/chat",
              },
              {
                label: "Documents",
                value: 0,
                sub: "indexed",
                href: "/dashboard/documents",
              },
              {
                label: "API requests",
                value: 0,
                sub: "this month",
                href: "/dashboard/api-keys",
              },
            ].map((stat) => (
              <a
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
                <div className="text-xs text-foreground-muted mt-1">
                  {stat.sub}
                </div>
              </a>
            ))}
          </div>
        </div>

        <OverviewChart data={activityData} />

        {/* Main grid */}
        <div className="grid grid-cols-[1fr_280px] gap-6">
          {/* Recent conversations */}
          <div className="border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-3.5 h-3.5 text-foreground-muted" />
                <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                  Recent conversations
                </span>
              </div>
              <a
                href="/chat"
                className="text-xs text-foreground-muted hover:text-foreground transition-colors"
              >
                New chat →
              </a>
            </div>

            {recentConvs && recentConvs.length > 0 ? (
              <div className="divide-y divide-border">
                {recentConvs.map((c) => (
                  <a
                    key={c.id}
                    href={`/chat/${c.id}`}
                    className="group flex items-center justify-between px-5 py-3.5 hover:bg-background-tertiary transition-colors"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-border-light shrink-0 group-hover:bg-accent-primary transition-colors" />
                      <span className="text-sm text-foreground truncate">
                        {c.title}
                      </span>
                    </div>
                    <span className="text-xs text-foreground-muted shrink-0 ml-4 font-mono">
                      {relativeTime(c.updated_at)}
                    </span>
                  </a>
                ))}
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <MessageSquare className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
                <p className="text-sm text-foreground-secondary">
                  No conversations yet
                </p>
                <a
                  href="/chat"
                  className="inline-block mt-3 text-xs text-accent-primary hover:underline"
                >
                  Start your first conversation →
                </a>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="space-y-4">
            {/* Plan card */}
            <div className="border border-border bg-card p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
                  Current plan
                </span>
                <span className="px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider bg-accent-primary/10 text-accent-primary border border-accent-primary/20">
                  {planLabel}
                </span>
              </div>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-foreground-secondary">
                      Conversations
                    </span>
                    <span className="text-xs font-mono text-foreground-muted">
                      {conversations} / {convLimit}
                    </span>
                  </div>
                  <div className="h-1 bg-background-tertiary w-full">
                    <div
                      className="h-1 bg-accent-primary transition-all"
                      style={{ width: `${convPct}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs text-foreground-secondary">
                      Messages
                    </span>
                    <span className="text-xs font-mono text-foreground-muted">
                      {messages} / {msgLimit}
                    </span>
                  </div>
                  <div className="h-1 bg-background-tertiary w-full">
                    <div
                      className="h-1 bg-accent-primary transition-all"
                      style={{ width: `${msgPct}%` }}
                    />
                  </div>
                </div>
              </div>

              {!isPaid && (
                <a
                  href="/solutions"
                  className="mt-5 flex items-center justify-center gap-2 w-full h-8 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors"
                >
                  <Zap className="w-3 h-3" />
                  Upgrade plan
                </a>
              )}
            </div>

            {/* Quick actions */}
            <div className="border border-border bg-card">
              <div className="px-5 py-3 border-b border-border">
                <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
                  Quick access
                </span>
              </div>
              <div className="divide-y divide-border">
                {[
                  { label: "Chat AI", href: "/chat", icon: MessageSquare },
                  {
                    label: "Documents",
                    href: "/dashboard/documents",
                    icon: FileText,
                  },
                  { label: "API Keys", href: "/dashboard/api-keys", icon: Zap },
                ].map(({ label, href, icon: Icon }) => (
                  <a
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
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
    </>
  );
}
