import { type HTMLAttributes, forwardRef } from "react";

type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  dot?: boolean;
}

const variantStyles: Record<BadgeVariant, string> = {
  default: "bg-badge-bg text-foreground-secondary border-badge-border",
  success: "bg-accent-success/10 text-accent-success border-accent-success/20",
  warning: "bg-accent-warning/10 text-accent-warning border-accent-warning/20",
  error: "bg-red-500/10 text-red-500 border-red-500/20",
  info: "bg-accent-secondary/10 text-accent-secondary border-accent-secondary/20",
};

const dotColors: Record<BadgeVariant, string> = {
  default: "bg-foreground-secondary",
  success: "bg-accent-success",
  warning: "bg-accent-warning",
  error: "bg-red-500",
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
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium  border ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {dot && (
          <span className={`w-1.5 h-1.5  ${dotColors[variant]}`} />
        )}
        {children}
      </span>
    );
  },
);

Badge.displayName = "Badge";
