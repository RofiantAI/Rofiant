import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { useSaveCustomProvider } from "@/hooks/useProviderConnections";

export function CustomProviderModal({
  defaultBaseUrl,
  defaultModel,
  onClose,
}: {
  defaultBaseUrl: string;
  defaultModel: string;
  onClose: () => void;
}) {
  const [baseUrl, setBaseUrl] = useState(defaultBaseUrl);
  const [apiKey, setApiKey] = useState("");
  const [model, setModel] = useState(defaultModel);
  const save = useSaveCustomProvider();

  async function handleSave() {
    await save.mutateAsync({ base_url: baseUrl.trim(), api_key: apiKey.trim(), model: model.trim() });
    onClose();
  }

  const canSave = baseUrl.trim() && apiKey.trim() && model.trim() && !save.isPending;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md space-y-4 rounded-lg border border-border bg-background p-5 shadow-lg">
        <div>
          <p className="text-sm font-medium text-foreground">Custom provider</p>
          <p className="text-xs text-muted-foreground">
            Any OpenAI-compatible /chat/completions endpoint: self-hosted, or a third-party API.
          </p>
        </div>

        <div className="space-y-3">
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Base URL</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              autoFocus
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">API key</label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-muted-foreground">Model</label>
            <Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="gpt-4o-mini" />
          </div>
        </div>

        {save.isError && <p className="text-xs text-destructive">Couldn't save. Check the details and try again.</p>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={save.isPending}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!canSave}>
            {save.isPending && <Spinner className="h-4 w-4" />}
            Save
          </Button>
        </div>
      </div>
    </div>
  );
}
