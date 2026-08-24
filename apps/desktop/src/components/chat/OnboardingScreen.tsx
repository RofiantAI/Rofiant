import { useNavigate } from "react-router-dom";
import { MessageSquare, FolderCode, KeyRound } from "lucide-react";
import { useUIStore } from "@/stores/useUIStore";

const FEATURES = [
  {
    icon: MessageSquare,
    title: "Ask it anything",
    body: "Chat like normal: questions, plans, quick answers.",
  },
  {
    icon: FolderCode,
    title: "It can do real work",
    body: "It reads and writes files and runs commands in its own sandbox. Nothing touches your machine.",
  },
  {
    icon: KeyRound,
    title: "Use your own account",
    body: "Connect Claude Pro/Max in Settings so it runs on your subscription.",
  },
] as const;

export function OnboardingScreen() {
  const navigate = useNavigate();
  const setBotGalleryOpen = useUIStore((s) => s.setBotGalleryOpen);

  // First chat starts the same way every later one does: pick a bot.
  const handleStart = () => setBotGalleryOpen(true);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <h1 className="text-2xl font-semibold text-foreground">Welcome</h1>
      <p className="mt-2 max-w-sm text-sm text-muted-foreground">
        Your AI agent chats, edits files, and runs commands.
      </p>

      <div className="mt-8 w-full max-w-sm space-y-5 text-left">
        {FEATURES.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary">
              <Icon className="h-4 w-4 text-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">{title}</p>
              <p className="text-xs text-muted-foreground">{body}</p>
            </div>
          </div>
        ))}
      </div>

      <button
        onClick={handleStart}
        className="mt-8 rounded-full bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground transition-all active:scale-[0.98] disabled:opacity-50"
      >
        Meet the bots
      </button>
      <button
        onClick={() => navigate("/settings", { state: { section: "providers" } })}
        className="mt-3 text-xs text-muted-foreground transition-colors hover:text-foreground"
      >
        Or connect your own AI account first
      </button>
    </div>
  );
}
