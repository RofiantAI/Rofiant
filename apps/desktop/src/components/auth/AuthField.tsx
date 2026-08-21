import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface AuthFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  icon: LucideIcon;
  endAdornment?: ReactNode;
}

export const AuthField = forwardRef<HTMLInputElement, AuthFieldProps>(
  ({ icon: Icon, endAdornment, className, ...props }, ref) => (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        ref={ref}
        className={cn("h-11 rounded-xl pl-10", endAdornment && "pr-10", className)}
        {...props}
      />
      {endAdornment && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2">{endAdornment}</div>
      )}
    </div>
  ),
);
AuthField.displayName = "AuthField";
