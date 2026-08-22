import { useEffect, useRef, useState } from "react";
import { Plus, User, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";

// The "+" button's dropdown: pick a solo bot or a group chat. Both routes
// open BotGallery, which does the actual conversation creation.
export function NewChatMenu({
  buttonClassName,
  className,
  placement = "below",
}: {
  buttonClassName: string;
  className?: string;
  placement?: "below" | "below-left" | "right";
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const setBotGalleryOpen = useUIStore((s) => s.setBotGalleryOpen);
  const setBotGalleryMode = useUIStore((s) => s.setBotGalleryMode);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpen]);

  function open(mode: "solo" | "group") {
    setBotGalleryMode(mode);
    setBotGalleryOpen(true);
    setMenuOpen(false);
  }

  return (
    <div ref={ref} className={cn("relative", className)}>
      <button aria-label="Create a chat" aria-expanded={menuOpen} onClick={() => setMenuOpen((v) => !v)} className={buttonClassName}>
        <Plus className="h-4 w-4" />
      </button>

      {menuOpen && (
        <div
          className={cn(
            "absolute z-40 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg",
            placement === "right"
              ? "bottom-0 left-full ml-2"
              : placement === "below-left"
                ? "left-0 top-full mt-1"
                : "right-0 top-full mt-1",
          )}
        >
          <button
            onClick={() => open("solo")}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
          >
            <User className="h-3.5 w-3.5" />
            New bot
          </button>
          <button
            onClick={() => open("group")}
            className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
          >
            <Users className="h-3.5 w-3.5" />
            New group chat
          </button>
        </div>
      )}
    </div>
  );
}
