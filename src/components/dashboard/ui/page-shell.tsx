import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ArrowRight } from "lucide-react";

export function DashboardPage({ children }: { children: React.ReactNode }) {
  return <div className="space-y-8">{children}</div>;
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
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        {description && (
          <p className="mt-1 text-sm text-foreground-secondary">{description}</p>
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
      className={`rounded-lg border border-border bg-card ${padding ? "p-5" : ""} ${className}`}
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
    <div className="rounded-lg border border-border bg-card divide-y divide-border overflow-hidden">
      {children}
    </div>
  );
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
      <Icon className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
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

export function DashboardMetric({
  label,
  value,
  sub,
  href,
  icon: Icon,
  trend,
  trendLabel,
}: {
  label: string;
  value: string;
  sub?: string;
  href?: string;
  icon?: LucideIcon;
  trend?: number | null;
  trendLabel?: string;
}) {
  const inner = (
    <>
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm text-foreground-secondary">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-foreground-muted" />}
      </div>
      <p className="text-2xl font-semibold tabular-nums text-foreground">{value}</p>
      {(sub || trend != null) && (
        <div className="mt-1 flex items-center gap-2 text-xs text-foreground-muted">
          {sub && <span>{sub}</span>}
          {trend != null && trend > 0 && trendLabel && (
            <span className="text-emerald-500">{trendLabel}</span>
          )}
        </div>
      )}
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="rounded-lg border border-border bg-card p-5 hover:border-border-light transition-colors"
      >
        {inner}
      </Link>
    );
  }

  return <div className="rounded-lg border border-border bg-card p-5">{inner}</div>;
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
    <div className={`rounded-lg border px-4 py-3 text-sm ${styles}`}>{children}</div>
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
    <div className="flex gap-3 rounded-lg border border-border bg-background-secondary px-4 py-3">
      <span className="shrink-0 self-start rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide border border-border text-foreground-muted">
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
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors"
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
      className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-60 transition-colors"
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
      className="inline-flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium border border-border text-foreground-secondary hover:bg-background-tertiary disabled:opacity-60 transition-colors"
    >
      {children}
    </button>
  );
}
