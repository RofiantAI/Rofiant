import { useUIStore } from "@/stores/useUIStore";

export function OnboardingScreen() {
  const setBotGalleryOpen = useUIStore((s) => s.setBotGalleryOpen);

  // First chat starts the same way every later one does: pick a bot.
  const handleStart = () => setBotGalleryOpen(true);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <button
        onClick={handleStart}
        className="text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        No conversation selected. Start a new chat.
      </button>
    </div>
  );
}
