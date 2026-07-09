import { type HTMLAttributes, forwardRef } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "bordered" | "elevated";
  noHover?: boolean;
}

const variantStyles: Record<string, string> = {
  default: "bg-card",
  bordered: "bg-card border border-border",
  elevated: "bg-card border border-border shadow-lg",
};

const hoverStyles: Record<string, string> = {
  default: "",
  bordered: "",
  elevated: "",
};

export const Card = forwardRef<HTMLDivElement, CardProps>(
  ({ variant = "bordered", noHover = false, className = "", children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={` overflow-hidden ${variantStyles[variant]} ${noHover ? "" : hoverStyles[variant]} ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = "Card";

export const CardHeader = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => {
  return (
    <div ref={ref} className={`p-6 ${className}`} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = "CardHeader";

export const CardContent = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => {
  return (
    <div ref={ref} className={`p-6 pt-0 ${className}`} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = "CardContent";

export const CardFooter = forwardRef<
  HTMLDivElement,
  HTMLAttributes<HTMLDivElement>
>(({ className = "", children, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={`p-6 pt-0 flex items-center ${className}`}
      {...props}
    >
      {children}
    </div>
  );
});

CardFooter.displayName = "CardFooter";
