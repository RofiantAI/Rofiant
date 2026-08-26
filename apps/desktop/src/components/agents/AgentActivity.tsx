import type { ReactNode } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import { CheckCircle2, Loader2, Search, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useToolCalls } from "@/hooks/useToolCalls";
import { useAgentRun } from "@/hooks/useAgentRun";
import type { ToolCall, ToolCallStatus } from "@/types/chat";

const statusIcon: Record<ToolCallStatus, ReactNode> = {
  completed: <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />,
  running: <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />,
  failed: <XCircle className="h-3.5 w-3.5 text-destructive" />,
};

interface SearchResult {
  title: string;
  url: string;
  description: string;
}

// The tool returns "title\nurl\ndescription" blocks separated by a blank
// line (see backend web_search.py) — plain text over the wire, parsed back
// into cards here rather than teaching the tool to emit structured JSON.
function parseSearchResults(result: string): SearchResult[] {
  return result
    .split("\n\n")
    .map((block) => {
      const [title, url, ...rest] = block.split("\n");
      return { title: title ?? "", url: url ?? "", description: rest.join(" ") };
    })
    .filter((r) => r.url.startsWith("http"));
}

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function faviconUrl(url: string): string {
  return `https://www.google.com/s2/favicons?sz=32&domain=${encodeURIComponent(hostname(url))}`;
}

function WebSearchCall({ call }: { call: ToolCall }) {
  const query = String(call.arguments.query ?? "");
  const results = call.status === "completed" && call.result ? parseSearchResults(call.result) : [];

  return (
    <li className="animate-in fade-in space-y-2 rounded-lg border border-border/50 bg-secondary/30 p-3 font-sans duration-200">
      <div className="flex items-center gap-2 text-xs">
        <Search className={cn("h-3.5 w-3.5 text-primary", call.status === "running" && "animate-pulse")} />
        <span className="text-muted-foreground">
          {call.status === "running" ? "Searching the web for " : "Searched the web for "}
        </span>
        <span className="font-semibold text-foreground">&ldquo;{query}&rdquo;</span>
        {statusIcon[call.status]}
      </div>

      {results.length > 0 && (
        <ol className="grid gap-1.5 sm:grid-cols-2">
          {results.map((r, i) => (
            <li key={i}>
              <a
                href={r.url}
                rel="noreferrer"
                className="block rounded-md border border-border/50 bg-background/60 p-2 transition-colors hover:border-primary/50 hover:bg-background"
                onClick={(e) => {
                  // target="_blank" doesn't reliably route to the OS default
                  // browser inside the Tauri webview; openUrl always does.
                  e.preventDefault();
                  openUrl(r.url);
                }}
              >
                <p className="flex items-center gap-1.5 truncate text-xs font-medium text-foreground">
                  <img src={faviconUrl(r.url)} alt="" className="h-3.5 w-3.5 shrink-0 rounded-sm" />
                  <span className="truncate">{r.title}</span>
                </p>
                <p className="truncate text-[0.6875rem] text-primary/80">{hostname(r.url)}</p>
                <p className="mt-0.5 line-clamp-2 text-[0.6875rem] text-muted-foreground">{r.description}</p>
              </a>
            </li>
          ))}
        </ol>
      )}

      {call.status === "completed" && results.length === 0 && call.result && (
        <p className="text-xs text-muted-foreground">{call.result}</p>
      )}
      {call.status === "failed" && (
        <p className="text-xs text-destructive">{call.result ?? "Search failed."}</p>
      )}
    </li>
  );
}

export function AgentActivity() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const { data: persisted = [] } = useToolCalls(activeConversationId);
  const { liveToolCalls } = useAgentRun(activeConversationId);

  // Live (in-progress) calls first by id, so a completed live entry doesn't
  // show up twice once the persisted row lands: it just swaps in place.
  const liveIds = new Set(liveToolCalls.map((t) => t.id));
  const calls: ToolCall[] = [...persisted.filter((t) => !liveIds.has(t.id)), ...liveToolCalls];

  if (calls.length === 0) {
    return <p className="p-4 text-sm text-muted-foreground">No agent activity yet.</p>;
  }

  return (
    <ul className="space-y-1.5 p-3 font-mono text-xs">
      {calls.map((call) =>
        call.tool_name === "web_search" ? (
          <WebSearchCall key={call.id} call={call} />
        ) : (
          <li
            key={call.id}
            className="animate-in fade-in flex items-center gap-2 rounded-md bg-secondary/50 px-2.5 py-1.5 duration-200"
          >
            {statusIcon[call.status]}
            <span className={cn("font-semibold", call.status === "failed" && "text-destructive")}>
              {call.tool_name}
            </span>
            <span className="truncate text-muted-foreground">{JSON.stringify(call.arguments)}</span>
          </li>
        ),
      )}
    </ul>
  );
}
