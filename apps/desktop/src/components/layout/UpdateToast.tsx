import { useEffect, useState } from "react";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUIStore } from "@/stores/useUIStore";

// ponytail: checks once on launch, not polled. Add an interval if users
// leave the app open for days and miss updates.
export function UpdateToast() {
  const autoCheckUpdates = useUIStore((s) => s.autoCheckUpdates);
  const [update, setUpdate] = useState<Update | null>(null);
  const [installing, setInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!autoCheckUpdates) return;
    check().then(setUpdate).catch(() => {});
  }, [autoCheckUpdates]);

  if (!update || dismissed) return null;

  const install = async () => {
    setInstalling(true);
    setError(false);
    try {
      await update.downloadAndInstall();
      await relaunch();
    } catch {
      setError(true);
      setInstalling(false);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-80 rounded-lg border border-border bg-popover p-4 shadow-lg animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-sm font-medium">Update available</p>
          <p className="text-xs text-muted-foreground">
            {error ? "Couldn't install the update. Try again." : `Version ${update.version} is ready to install.`}
          </p>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-muted-foreground hover:text-foreground"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      <Button size="sm" className="mt-3 w-full" onClick={install} disabled={installing}>
        <Download className="h-4 w-4" />
        {installing ? "Installing…" : "Install and restart"}
      </Button>
    </div>
  );
}
