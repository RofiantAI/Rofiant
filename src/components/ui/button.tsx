import { type ButtonHTMLAttributes, forwardRef } from "react";
import { Spinner } from "./spinner";

type ButtonVariant = "primary" | "secondary" | "outline" | "ghost";
type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
}

const spinnerSize: Record<ButtonSize, "sm" | "md"> = {
  sm: "sm",
  md: "sm",
  lg: "md",
};

const variantStyles: Record<ButtonVariant, string> = {
  primary:
    "bg-button-primary text-button-primary-foreground hover:bg-foreground/90",
  secondary:
    "bg-button-secondary text-button-secondary-foreground hover:bg-background-tertiary",
  outline:
    "bg-button-outline text-button-outline-foreground border border-border hover:bg-background-tertiary hover:border-border-light",
  ghost:
    "bg-transparent text-foreground hover:bg-background-tertiary",
};

const sizeStyles: Record<ButtonSize, string> = {
  sm: "h-8 px-3 text-sm",
  md: "h-10 px-4 text-sm",
  lg: "h-12 px-6 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      className = "",
      children,
      isLoading = false,
      disabled,
      ...props
    },
    ref,
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed font-medium rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:pointer-events-none ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
        {...props}
      >
        {isLoading && <Spinner size={spinnerSize[size]} />}
        {children}
      </button>
    );
  },
);

Button.displayName = "Button";
