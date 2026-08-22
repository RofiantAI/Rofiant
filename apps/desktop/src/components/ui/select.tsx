import { Children, isValidElement, useEffect, useRef, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

// A native <select>'s closed control can be reskinned with appearance-none,
// but its open option list is OS-native chrome CSS can't touch. On some
// platforms (GTK/webkit2gtk) that renders as an unstyled light popup no
// matter the app's theme. Drawing our own popup avoids that entirely.
export function Select({
  value,
  onChange,
  className,
  chevronClassName,
  ariaLabel,
  children,
}: {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  chevronClassName?: string;
  ariaLabel?: string;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [openUp, setOpenUp] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  // Popup is absolutely positioned below the button; near the bottom of the
  // viewport (e.g. the chat composer) that clips it off-screen. Flip above
  // when there isn't roughly a menu's worth of room below.
  useEffect(() => {
    if (!open || !ref.current) return;
    const spaceBelow = window.innerHeight - ref.current.getBoundingClientRect().bottom;
    setOpenUp(spaceBelow < 200);
  }, [open]);

  const options = Children.toArray(children).filter(
    (child): child is React.ReactElement<{ value: string; children: React.ReactNode }> =>
      isValidElement(child),
  );
  const current = options.find((o) => o.props.value === value);

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      setOpen(false);
      return;
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      if (!open) setOpen(true);
      setActiveIndex((i) => (i + (e.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
      return;
    }
    if ((e.key === "Enter" || e.key === " ") && open) {
      e.preventDefault();
      const option = options[activeIndex];
      if (option) onChange(option.props.value);
      setOpen(false);
    }
  }

  return (
    <div ref={ref} className="relative inline-flex">
      <button
        type="button"
        onClick={() => {
          setActiveIndex(Math.max(0, options.findIndex((o) => o.props.value === value)));
          setOpen((v) => !v);
        }}
        onKeyDown={onKeyDown}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex items-center whitespace-nowrap rounded-md border border-input bg-secondary py-1 pl-2 pr-7 text-left text-sm text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          className,
        )}
      >
        {current?.props.children ?? value}
      </button>
      <ChevronDown
        className={cn(
          "pointer-events-none absolute right-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground transition-transform duration-150",
          open && "rotate-180",
          chevronClassName,
        )}
      />

      {open && (
        <div
          role="listbox"
          className={cn(
            "absolute left-0 z-30 min-w-[10rem] origin-top animate-in fade-in-0 zoom-in-95 space-y-0.5 overflow-hidden rounded-xl border border-border bg-popover p-1.5 shadow-xl shadow-black/20",
            openUp ? "bottom-full mb-1.5 origin-bottom" : "top-full mt-1.5",
          )}
        >
          {options.map((o) => {
            const selected = o.props.value === value;
            return (
              <button
                key={o.props.value}
                type="button"
                onClick={() => {
                  onChange(o.props.value);
                  setOpen(false);
                }}
                onMouseEnter={() => setActiveIndex(options.indexOf(o))}
                role="option"
                aria-selected={selected}
                className={cn(
                  "flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-lg px-2.5 py-1.5 text-left text-sm text-foreground transition-colors hover:bg-accent",
                  selected && "font-medium",
                  options[activeIndex] === o && "bg-accent/70",
                )}
              >
                {o.props.children}
                {selected && <Check className="ml-2 h-3.5 w-3.5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
