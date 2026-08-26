import type { ReactNode } from "react";
import { FileEdit, FilePlus, FileText, Folder, GitBranch, Lightbulb, Search, TerminalSquare } from "lucide-react";
import type { ToolCall } from "@/types/chat";

interface Step {
  icon: ReactNode;
  label: string;
}

const ICON_CLASS = "h-3.5 w-3.5";

function truncate(s: string, max = 60): string {
  return s.length > max ? `${s.slice(0, max - 1)}…` : s;
}

/** One narration line per tool call, except web_search calls: consecutive
 * ones collapse into a single "Ran N searches" line so a multi-query
 * research turn doesn't produce a wall of near-identical rows. */
function stepFor(call: ToolCall): Step {
  const args = call.arguments;
  switch (call.tool_name) {
    case "web_search":
      return { icon: <Search className={ICON_CLASS} />, label: `Searched for "${String(args.query ?? "")}"` };
    case "read_file":
      return { icon: <FileText className={ICON_CLASS} />, label: `Read ${truncate(String(args.path ?? ""))}` };
    case "write_file":
      return { icon: <FilePlus className={ICON_CLASS} />, label: `Wrote ${truncate(String(args.path ?? ""))}` };
    case "list_files":
      return { icon: <Folder className={ICON_CLASS} />, label: `Listed ${truncate(String(args.path ?? "the workspace"))}` };
    case "terminal":
      return { icon: <TerminalSquare className={ICON_CLASS} />, label: truncate(String(args.command ?? "Ran a command")) };
    case "git_status":
      return { icon: <GitBranch className={ICON_CLASS} />, label: "Checked git status" };
    case "git_diff":
      return { icon: <GitBranch className={ICON_CLASS} />, label: "Checked git diff" };
    default:
      return { icon: <FileEdit className={ICON_CLASS} />, label: call.tool_name };
  }
}

function buildSteps(calls: ToolCall[]): Step[] {
  const steps: Step[] = [];
  let searchRun: ToolCall[] = [];

  const flushSearches = () => {
    if (searchRun.length === 1) steps.push(stepFor(searchRun[0]));
    else if (searchRun.length > 1) {
      steps.push({ icon: <Search className={ICON_CLASS} />, label: `Ran ${searchRun.length} searches` });
    }
    searchRun = [];
  };

  for (const call of calls) {
    if (call.tool_name === "web_search") {
      searchRun.push(call);
    } else {
      flushSearches();
      steps.push(stepFor(call));
    }
  }
  flushSearches();
  return steps;
}

/** Vertical connected-dot timeline of what an agent turn actually did —
 * ends with a "Thinking" row while it's composing the reply text. Never
 * shows a step for something no tool was called for (e.g. no fabricated
 * "opened page" row — this app's web_search only fetches snippets). */
export function AgentTimeline({ calls, thinking = false }: { calls: ToolCall[]; thinking?: boolean }) {
  const steps = buildSteps(calls);
  if (thinking) steps.push({ icon: <Lightbulb className={ICON_CLASS} />, label: "Thinking" });
  if (steps.length === 0) return null;

  return (
    <div className="flex flex-col text-sm text-muted-foreground">
      {steps.map((step, i) => (
        <div key={i} className="relative flex items-center gap-2.5 py-1">
          {i < steps.length - 1 && (
            <span className="absolute left-[7px] top-6 h-[calc(100%-0.5rem)] w-px bg-border" />
          )}
          <span className="flex h-4 w-4 shrink-0 items-center justify-center">{step.icon}</span>
          <span className="truncate">{step.label}</span>
        </div>
      ))}
    </div>
  );
}
