import { type ReactNode } from "react";
import { Badge } from "@/components/ui/badge";

interface PageLayoutProps {
  badge?: string;
  badgeVariant?: "default" | "success" | "warning" | "error" | "info";
  title: string;
  subtitle?: string;
  children?: ReactNode;
  hero?: ReactNode;
  compact?: boolean;
}

export function PageLayout({
  badge,
  badgeVariant = "default",
  title,
  subtitle,
  children,
  hero,
  compact = false,
}: PageLayoutProps) {
  return (
    <section className={compact ? "py-16" : "py-24"}>
      <div className="mx-auto max-w-[1600px] px-4 sm:px-6 lg:px-8">
        <div className={compact ? "max-w-4xl" : "max-w-4xl"}>
          {badge && (
            <Badge variant={badgeVariant} dot className="mb-6">
              {badge}
            </Badge>
          )}
          <h1 className="text-4xl font-normal tracking-tight text-foreground sm:text-5xl lg:text-6xl">
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 text-lg leading-8 text-foreground-secondary max-w-2xl">
              {subtitle}
            </p>
          )}
        </div>

        {hero && <div className="mt-16">{hero}</div>}

        {children && <div className={hero ? "mt-16" : "mt-16"}>{children}</div>}
      </div>
    </section>
  );
}

export function PageSection({
  title,
  subtitle,
  children,
  className = "",
}: {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`mt-20 ${className}`}>
      {title && (
        <h2 className="text-2xl font-normal tracking-tight text-foreground sm:text-3xl">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="mt-3 text-base text-foreground-secondary max-w-2xl">
          {subtitle}
        </p>
      )}
      {children}
    </div>
  );
}
