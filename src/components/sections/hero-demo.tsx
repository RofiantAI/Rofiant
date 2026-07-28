import { Card } from "@/components/ui/card";

const ITEMS = [
  { dest: "Screenshots / 2026", count: 18 },
  { dest: "Invoices / Q3", count: 6 },
] as const;

const MORE_COUNT = 3;
const TOTAL_FILES = 42;
const TOTAL_FOLDERS = 6;

export function HeroDemo() {
  return (
    <Card
      variant="elevated"
      noHover
      className="w-full max-w-md motion-safe:animate-[hero-card-in_0.6s_ease-out_0.15s_both]"
    >
      <div className="flex items-start gap-3 p-5 pb-4">
        <img
          src="/icon.svg"
          alt=""
          aria-hidden
          className="h-9 w-9 shrink-0 rounded-[10px] border border-border"
        />
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">
            Rofiant wants to change files
          </p>
          <p className="mt-0.5 text-sm text-foreground-muted">
            Move {TOTAL_FILES} files into {TOTAL_FOLDERS} folders in{" "}
            <span className="font-medium text-foreground-secondary">
              ~/Downloads
            </span>
          </p>
        </div>
      </div>

      <div className="mx-5 divide-y divide-border rounded-lg border border-border text-sm">
        {ITEMS.map((item) => (
          <div
            key={item.dest}
            className="flex items-center justify-between px-3 py-2 text-foreground-secondary"
          >
            <span className="truncate">{item.dest}</span>
            <span className="shrink-0 text-foreground-muted">
              {item.count} files
            </span>
          </div>
        ))}
        <div className="px-3 py-2 text-foreground-muted">
          +{MORE_COUNT} more folders
        </div>
      </div>

      <div className="flex border-t border-border mt-5">
        <button className="flex-1 rounded-bl-xl py-3 text-sm font-medium text-foreground-secondary hover:bg-background-tertiary transition-colors">
          Not now
        </button>
        <div className="w-px bg-border" />
        <button className="flex-1 rounded-br-xl py-3 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors">
          Approve
        </button>
      </div>
    </Card>
  );
}
