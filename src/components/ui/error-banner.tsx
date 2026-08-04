import { type HTMLAttributes, forwardRef } from "react";

type ErrorBannerVariant = "error" | "warning";

interface ErrorBannerProps extends HTMLAttributes<HTMLDivElement> {
  variant?: ErrorBannerVariant;
}

const variantStyles: Record<ErrorBannerVariant, string> = {
  error: "bg-accent-error/10 border-accent-error/20 text-accent-error",
  warning: "bg-accent-warning/10 border-accent-warning/20 text-accent-warning",
};

export const ErrorBanner = forwardRef<HTMLDivElement, ErrorBannerProps>(
  ({ variant = "error", className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        role="alert"
        className={`p-3 rounded-lg border text-sm ${variantStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

ErrorBanner.displayName = "ErrorBanner";
