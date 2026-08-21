import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

// Native checkbox chrome ignores theme colors on some platforms (renders
// opaque white/black). appearance-none + a hand-drawn state fixes it.
export function Checkbox({
  checked,
  onChange,
  className,
}: {
  checked: boolean;
  onChange: () => void;
  className?: string;
}) {
  return (
    <span className={cn("relative flex h-4 w-4 shrink-0 items-center justify-center", className)}>
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="peer h-4 w-4 shrink-0 appearance-none rounded border border-border bg-secondary checked:border-primary checked:bg-primary"
      />
      <Check className="pointer-events-none absolute h-3 w-3 text-primary-foreground opacity-0 peer-checked:opacity-100" />
    </span>
  );
}
