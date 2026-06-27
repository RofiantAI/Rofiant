"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  MessageSquare,
  Mic,
  FileText,
  Brain,
  Key,
  BarChart3,
  Settings,
  LogOut,
  Building2,
  Users,
  CreditCard,
  Radio,
  Activity,
  Sliders,
  BookOpen,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

const products = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/chat", label: "Chat AI", icon: MessageSquare },
  { href: "/dashboard/voice-ai", label: "Voice AI", icon: Mic },
  { href: "/dashboard/documents", label: "Documents", icon: FileText },
  { href: "/dashboard/agents", label: "Agents", icon: Brain },
];

const account = [
  { href: "/dashboard/api-keys", label: "API Keys", icon: Key },
  { href: "/dashboard/usage", label: "Usage", icon: BarChart3 },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

const agencyNav = [
  { href: "/dashboard/agency", label: "Overview", icon: Building2, exact: true },
  { href: "/dashboard/agency/intelligence", label: "Intelligence", icon: Radio },
  { href: "/dashboard/agency/members", label: "Members", icon: Users, teamOnly: true },
  { href: "/dashboard/agency/billing", label: "Billing", icon: CreditCard },
  { href: "/dashboard/agency/settings", label: "Settings", icon: Settings },
  { href: "/dashboard/knowledge-bases", label: "Knowledge Bases", icon: BookOpen },
  { href: "/dashboard/urban", label: "Urban AI", icon: Activity },
  { href: "/dashboard/urban/control", label: "Urban Control", icon: Sliders },
];

function NavItem({
  href,
  label,
  icon: Icon,
  exact = false,
}: {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  exact?: boolean;
}) {
  const pathname = usePathname();
  const active = exact
    ? pathname === href
    : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`flex items-center gap-2.5 px-3 py-2 text-sm transition-colors rounded-none ${
        active
          ? "bg-background-tertiary text-foreground"
          : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
      }`}
    >
      <Icon
        className={`w-3.5 h-3.5 shrink-0 ${active ? "text-accent-primary" : "text-foreground-muted"}`}
      />
      {label}
    </Link>
  );
}

export function DashboardSidebar({
  email,
  plan = "free",
}: {
  email?: string;
  plan?: string;
}) {
  const router = useRouter();
  const isPaid = ["pro", "team", "pilot", "agency", "enterprise"].includes(plan);
  const isTeam = ["team", "pilot", "agency", "enterprise"].includes(plan);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
  };

  const initial = email ? email[0].toUpperCase() : "?";
  const planLabel =
    plan === "enterprise" ? "Enterprise"
    : plan === "agency" ? "Agency"
    : plan === "pilot" ? "Pilot"
    : plan === "team" ? "Team"
    : plan === "pro" ? "Pro"
    : "Free";

  return (
    <aside className="w-56 shrink-0 min-h-screen border-r border-border bg-background-secondary flex flex-col">
      {/* Logo */}
      <div className="px-4 py-5 border-b border-border">
        <Link href="/dashboard">
          <img src="/logo-light.svg" alt="Rofiant" className="h-5 w-auto" />
        </Link>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 px-2 flex flex-col gap-0.5 overflow-y-auto">
        <p className="px-3 pt-1 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
          Workspace
        </p>
        {products.map((item) => (
          <NavItem key={item.href} {...item} exact={item.href === "/dashboard"} />
        ))}

        {/* Agency section — only for paying users */}
        {isPaid && (
          <>
            <p className="px-3 pt-4 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
              Agency
            </p>
            {agencyNav
              .filter((item) => !("teamOnly" in item && item.teamOnly && !isTeam))
              .map((item) => (
                <NavItem key={item.href} {...item} />
              ))}
          </>
        )}

        <p className="px-3 pt-4 pb-1.5 text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
          Account
        </p>
        {account.map((item) => (
          <NavItem key={item.href} {...item} />
        ))}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-6 h-6 shrink-0 bg-background-tertiary border border-border flex items-center justify-center text-[10px] font-medium text-foreground-secondary">
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-foreground truncate">{email ?? "—"}</p>
            <p className="text-[10px] text-foreground-muted">{planLabel} plan</p>
          </div>
        </div>
        <button
          onClick={handleSignOut}
          className="flex items-center gap-2.5 w-full px-3 py-2 text-xs text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors mt-0.5"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </aside>
  );
}
