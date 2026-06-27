import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreditCard, ArrowUpRight, CheckCircle2, Zap, Users, ShieldCheck } from "lucide-react";
import Link from "next/link";

const PLAN_DETAILS: Record<string, { label: string; price: string; features: string[]; color: string }> = {
  pro: {
    label: "Pro",
    price: "$49/mo",
    color: "text-accent-secondary border-accent-secondary/20 bg-accent-secondary/10",
    features: [
      "Unlimited conversations",
      "API access",
      "Advanced AI models",
      "Document intelligence",
      "Priority support",
      "Custom agents",
    ],
  },
  team: {
    label: "Team",
    price: "$199/mo",
    color: "text-accent-primary border-accent-primary/20 bg-accent-primary/10",
    features: [
      "Everything in Pro",
      "Unlimited team members",
      "Shared workspace",
      "Team analytics",
      "Role-based access",
      "Dedicated support",
    ],
  },
};

export default async function AgencyBillingPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  const plan: string = (user.user_metadata?.plan ?? "free" as string).toLowerCase();
  const isPaid = plan === "pro" || plan === "team";
  if (!isPaid) redirect("/dashboard/agency");

  const details = PLAN_DETAILS[plan];

  const [{ count: convCount }, { count: msgCount }, { count: docCount }] = await Promise.all([
    supabase.from("conversations").select("*", { count: "exact", head: true }),
    supabase.from("messages").select("*", { count: "exact", head: true }),
    supabase.from("documents").select("*", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-normal text-foreground">Billing</h1>
        <p className="mt-1 text-sm text-foreground-secondary">
          Your subscription, plan details, and usage
        </p>
      </div>

      <div className="max-w-3xl space-y-6">
        {/* Current plan */}
        <div className="border border-border bg-card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <CreditCard className="w-3.5 h-3.5 text-foreground-muted" />
              <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
                Current plan
              </span>
            </div>
            <span className={`px-2 py-0.5 text-[10px] font-medium uppercase tracking-wider border ${details.color}`}>
              {details.label}
            </span>
          </div>

          <div className="px-5 py-5">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-2xl font-light text-foreground">{details.price}</p>
                <p className="text-sm text-foreground-secondary mt-1">
                  Billed monthly · Active subscription
                </p>
                <div className="flex items-center gap-1.5 mt-2 text-xs text-accent-success">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Subscription active
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-foreground-muted">Account</p>
                <p className="text-sm text-foreground mt-0.5">{user.email}</p>
              </div>
            </div>

            <div className="mt-6 pt-5 border-t border-border grid grid-cols-2 gap-4">
              {details.features.map((f) => (
                <div key={f} className="flex items-center gap-2 text-sm text-foreground-secondary">
                  <CheckCircle2 className="w-3.5 h-3.5 text-accent-success shrink-0" />
                  {f}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usage summary */}
        <div className="border border-border bg-card">
          <div className="flex items-center gap-2 px-5 py-4 border-b border-border">
            <Zap className="w-3.5 h-3.5 text-foreground-muted" />
            <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Usage this month
            </span>
          </div>
          <div className="grid grid-cols-3 divide-x divide-border">
            {[
              { label: "Conversations", value: convCount ?? 0, limit: "Unlimited" },
              { label: "Messages", value: msgCount ?? 0, limit: "Unlimited" },
              { label: "Documents", value: docCount ?? 0, limit: "Unlimited" },
            ].map((s) => (
              <div key={s.label} className="px-5 py-4">
                <p className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted mb-2">
                  {s.label}
                </p>
                <p className="font-mono text-xl font-light text-foreground tabular-nums">
                  {s.value.toLocaleString()}
                </p>
                <p className="text-xs text-foreground-muted mt-1">{s.limit}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Upgrade/manage */}
        {plan !== "team" && (
          <div className="border border-border bg-card p-5">
            <div className="flex items-start gap-4">
              <div className="flex items-center justify-center w-10 h-10 bg-background-tertiary border border-border shrink-0">
                <Users className="w-4 h-4 text-foreground-muted" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">Upgrade to Team</p>
                <p className="text-sm text-foreground-secondary mt-1">
                  Get unlimited team members, shared workspaces, role-based access, and dedicated support.
                </p>
                <Link
                  href="/pricing"
                  className="inline-flex items-center gap-2 mt-4 h-9 px-5 text-xs font-medium bg-foreground text-background hover:bg-foreground/90 transition-colors"
                >
                  Upgrade to Team
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Security compliance */}
        <div className="border border-border bg-card p-5">
          <div className="flex items-center gap-2 mb-4">
            <ShieldCheck className="w-3.5 h-3.5 text-foreground-muted" />
            <span className="text-xs font-medium uppercase tracking-widest text-foreground-muted">
              Compliance
            </span>
          </div>
          <div className="grid grid-cols-3 gap-4 text-sm text-foreground-secondary">
            {["FedRAMP Ready", "ITAR Compliant", "SOC 2 Type II"].map((c) => (
              <div key={c} className="flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-accent-success shrink-0" />
                {c}
              </div>
            ))}
          </div>
        </div>

        {/* Manage subscription */}
        <div className="border border-border bg-card px-5 py-4 flex items-center justify-between">
          <div>
            <p className="text-sm text-foreground">Manage subscription</p>
            <p className="text-xs text-foreground-muted mt-0.5">
              Cancel, change payment method, or download invoices
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 inline-flex items-center gap-2 h-8 px-4 text-xs font-medium border border-border text-foreground-secondary hover:border-border-light hover:text-foreground transition-colors"
          >
            Manage
            <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}
