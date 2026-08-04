"use client";

import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";

const inputBase =
  "peer w-full h-10 px-3 rounded-2xl bg-background-secondary shadow-clay-inset text-sm text-foreground " +
  "placeholder:text-transparent focus:outline-none focus:ring-2 focus:ring-accent-primary/50 " +
  "transition-[box-shadow] duration-300 ease-out";

const labelBase =
  "pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-foreground-muted " +
  "transition-[top,transform,font-size,color] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] " +
  "peer-focus:top-0 peer-focus:-translate-y-1/2 peer-focus:text-xs peer-focus:text-foreground-secondary " +
  "peer-focus:[&>span]:bg-background " +
  "peer-[:not(:placeholder-shown)]:top-0 peer-[:not(:placeholder-shown)]:-translate-y-1/2 " +
  "peer-[:not(:placeholder-shown)]:text-xs peer-[:not(:placeholder-shown)]:text-foreground-secondary " +
  "peer-[:not(:placeholder-shown)]:[&>span]:bg-background";

const labelMaskBase = "inline-block leading-none px-1 transition-colors duration-300";

interface FloatingLabelInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const FloatingLabelInput = forwardRef<
  HTMLInputElement,
  FloatingLabelInputProps
>(function FloatingLabelInput(
  { id, label, className, type = "text", ...props },
  ref,
) {
  const [visible, setVisible] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (visible ? "text" : "password") : type;

  return (
    <div className="relative">
      <input
        ref={ref}
        id={id}
        type={inputType}
        className={`${inputBase} ${isPassword ? "pr-10" : ""} ${className ?? ""}`}
        {...props}
        placeholder=" "
      />
      <label htmlFor={id} className={labelBase}>
        <span className={labelMaskBase}>{label}</span>
      </label>
      {isPassword ? (
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground transition-colors"
        >
          {visible ? (
            <EyeOff className="w-4 h-4" aria-hidden="true" />
          ) : (
            <Eye className="w-4 h-4" aria-hidden="true" />
          )}
        </button>
      ) : null}
    </div>
  );
});
