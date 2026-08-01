import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight, TrendingUp, TrendingDown, Minus } from "lucide-react";

export function DashboardPage({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8 dashboard-page-enter">{children}</div>;
}

export function ConsoleHeader({
  title,
  description,
  action,
  breadcrumb,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
  /** Trail of labels shown top-right, e.g. ["Home", "Billing"]. */
  breadcrumb?: string[];
}) {
  return (
    <div className="flex flex-col gap-2 border-b border-border pb-5">
      {breadcrumb && breadcrumb.length > 0 && (
        <p className="font-mono text-xs text-foreground-muted sm:text-right">
          {breadcrumb.map((segment, i) => (
            <span key={i}>
              {i > 0 && <span className="mx-1.5 text-border-light">/</span>}
              {segment}
            </span>
          ))}
        </p>
      )}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="mt-1.5 text-sm text-foreground-secondary">{description}</p>
          )}
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  );
}

export function DashboardHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1.5 text-sm text-foreground-secondary">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function DashboardCard({
  children,
  className = "",
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  padding?: boolean;
}) {
  return (
    <div
      className={`dashboard-surface rounded-2xl border border-border bg-card shadow-sm ${padding ? "p-5" : ""} ${className}`}
    >
      {children}
    </div>
  );
}

export function DashboardSection({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-sm font-medium text-foreground">{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

export function DashboardList({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm divide-y divide-border overflow-hidden">
      {children}
    </div>
  );
}

// "Readout" surfaces are for machine-reported data (usage, model lists, ledgers) —
// tighter hairline borders and mono type, distinct from the soft "control"
// surfaces above (DashboardCard/DashboardList) used for things a human configures.
export function ReadoutPanel({
  title,
  subtitle,
  action,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`dashboard-readout rounded-md border border-border bg-card p-4 ${className}`}>
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            {title && <p className="text-sm font-medium text-foreground">{title}</p>}
            {subtitle && (
              <p className="mt-0.5 font-mono text-xs text-foreground-muted">{subtitle}</p>
            )}
          </div>
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function ReadoutList({ children }: { children: React.ReactNode }) {
  return (
    <div className="dashboard-readout rounded-md border border-border bg-card divide-y divide-border overflow-hidden">
      {children}
    </div>
  );
}

export function ReadoutRow({
  children,
  className = "",
  href,
}: {
  children: React.ReactNode;
  className?: string;
  href?: string;
}) {
  const rowClass = `grid items-center gap-2 sm:gap-4 px-5 py-3.5 font-mono text-sm ${className}`;
  if (href) {
    return (
      <Link href={href} className={`${rowClass} transition-colors hover:bg-background-tertiary/60 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-accent-primary`}>
        {children}
      </Link>
    );
  }
  return <div className={rowClass}>{children}</div>;
}

export function DashboardEmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <DashboardCard className="py-12 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-accent-primary/10">
        <Icon className="w-4 h-4 text-accent-primary" />
      </div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      {description && (
        <p className="text-sm text-foreground-secondary mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </DashboardCard>
  );
}

export function DashboardMetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>
  );
}

const METRIC_TONE_STYLES = {
  purple: "bg-violet-500",
  blue: "bg-blue-500",
  green: "bg-emerald-500",
  orange: "bg-amber-500",
} as const;

export function DashboardMetric({
  label,
  value,
  sub,
  href,
  icon: Icon,
  tone = "purple",
  delta,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  icon?: LucideIcon;
  tone?: keyof typeof METRIC_TONE_STYLES;
  /** Percent change vs. the prior period; pass null/omit when there's no baseline to compare against. */
  delta?: { value: number; label: string } | null;
}) {
  const DeltaIcon = delta && delta.value > 0 ? TrendingUp : delta && delta.value < 0 ? TrendingDown : Minus;
  const deltaColor =
    delta && delta.value > 0
      ? "text-accent-success"
      : delta && delta.value < 0
        ? "text-red-400"
        : "text-foreground-muted";

  const inner = (
    <>
      {Icon && (
        <div className={`mb-4 flex h-11 w-11 items-center justify-center rounded-full ${METRIC_TONE_STYLES[tone]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      )}
      <p className="font-mono text-3xl font-bold tabular-nums text-foreground">{value}</p>
      <div className="mt-2 flex items-center justify-between gap-2">
        <span className="text-xs text-foreground-muted">{label}</span>
        {delta && (
          <span className={`inline-flex items-center gap-0.5 font-mono text-xs font-medium ${deltaColor}`}>
            <DeltaIcon className="w-3 h-3" />
            {delta.value > 0 ? "+" : ""}
            {delta.value}%
          </span>
        )}
      </div>
      {sub && <p className="mt-0.5 font-mono text-[11px] text-foreground-muted">{sub}</p>}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="dashboard-surface rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md hover:border-border-light focus-visible:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      >
        {inner}
      </Link>
    );
  }

  return <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">{inner}</div>;
}

export function DashboardAlert({
  variant = "error",
  children,
}: {
  variant?: "error" | "warning";
  children: React.ReactNode;
}) {
  const styles =
    variant === "error"
      ? "bg-red-500/10 border-red-500/30 text-red-400"
      : "bg-orange-500/10 border-orange-500/30 text-orange-400";
  return (
    <div className={`rounded-xl border px-4 py-3 text-sm ${styles}`}>{children}</div>
  );
}

export function DashboardProductStatus({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-3 rounded-xl border border-border bg-background-secondary px-4 py-3">
      <span className="shrink-0 self-start rounded-full px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-border text-foreground-muted">
        {label}
      </span>
      <p className="text-sm text-foreground-secondary">{children}</p>
    </div>
  );
}

export function DashboardUpgradeGate({
  icon: Icon,
  title,
  description,
  ctaHref,
  ctaLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  ctaHref: string;
  ctaLabel: string;
}) {
  return (
    <DashboardEmptyState
      icon={Icon}
      title={title}
      description={description}
      action={
        <Link
          href={ctaHref}
          className="inline-flex items-center gap-2 h-9 px-4 rounded-full text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
        >
          {ctaLabel}
          <ArrowRight className="w-4 h-4" />
        </Link>
      }
    />
  );
}

export function DashboardPrimaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-60 transition-colors"
    >
      {children}
    </button>
  );
}

export function DashboardSecondaryButton({
  children,
  onClick,
  disabled,
  type = "button",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="inline-flex items-center justify-center gap-2 h-9 px-4 rounded-full text-sm font-medium border border-border text-foreground-secondary hover:bg-background-tertiary disabled:opacity-60 transition-colors"
    >
      {children}
    </button>
  );
}
