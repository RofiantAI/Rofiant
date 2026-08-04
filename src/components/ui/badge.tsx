import { type HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-badge-bg text-foreground-secondary",
  success: "bg-accent-success/10 text-accent-success",
  warning: "bg-accent-warning/10 text-accent-warning",
  error: "bg-accent-error/10 text-accent-error",
  info: "bg-accent-secondary/10 text-accent-secondary",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-foreground-secondary",
  success: "bg-accent-success",
  warning: "bg-accent-warning",
  error: "bg-accent-error",
  info: "bg-accent-secondary",
};

export const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  (
    { variant = "default", dot = false, className = "", children, ...props },
    ref,
  ) => {
    return (
      <span
        ref={ref}
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-full shadow-clay-sm ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {dot && (
          <span className={`w-1.5 h-1.5 rounded-full ${dotColors[variant]}`} />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
