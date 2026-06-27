"use client";

import { useEffect, useState } from "react";
import { FileText } from "lucide-react";
import { formatTime } from "@/lib/user-prefs";
import ReactMarkdown from "react-markdown";

export type MessageAttachment = { name: string; type: string };

export function MessageBubble({
  role,
  content,
  loading,
  fontSize = "text-sm",
  showTimestamp = false,
  attachments,
}: {
  role: "user" | "assistant" | string;
  content: string;
  loading?: boolean;
  fontSize?: string;
  showTimestamp?: boolean;
  attachments?: MessageAttachment[];
}) {
  const isUser = role === "user";
  const time = showTimestamp ? formatTime() : null;

  if (isUser) {
    return (
      <div className="flex flex-col items-end gap-1">
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end max-w-[80%]">
            {attachments.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1.5 bg-background-secondary border border-border text-xs text-foreground-secondary"
              >
                <FileText className="w-3 h-3 text-foreground-muted shrink-0" />
                <span className="max-w-[180px] truncate">{a.name}</span>
                <span className="text-foreground-muted font-mono">{a.type}</span>
              </div>
            ))}
          </div>
        )}
        <div
          className={`max-w-[80%] px-4 py-3 bg-background-tertiary text-foreground ${fontSize} leading-relaxed whitespace-pre-wrap`}
        >
          {content}
        </div>
        {time && <span className="text-xs text-foreground-muted">{time}</span>}
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start ">
      <div className="w-7 h-7 shrink-0 flex items-center justify-center mt-0.5 ">
        {/*Do not change icon*/}
        <img src="/icon.svg" alt="" className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0 ">
        <div
          className={`text-foreground ${fontSize} leading-relaxed pt-0.5 prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:bg-background-tertiary prose-code:bg-background-tertiary prose-code:px-1 prose-code:rounded`}
        >
          {loading ? (
            <ThinkingDots />
          ) : (
            <ReactMarkdown>{content}</ReactMarkdown>
          )}
        </div>
        {time && !loading && (
          <span className="text-xs text-foreground-muted mt-1 block">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

function ThinkingDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const id = setInterval(() => setDots((d) => (d % 3) + 1), 500);
    return () => clearInterval(id);
  }, []);
  return <span className="text-foreground-muted">{"•".repeat(dots)}</span>;
}
