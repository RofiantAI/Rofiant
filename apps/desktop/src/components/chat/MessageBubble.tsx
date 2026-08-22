import { useState } from "react";
import { Check, Copy, ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Markdown } from "@/components/chat/Markdown";
import { useUIStore } from "@/stores/useUIStore";
import { personaFor } from "@/lib/personas";
import { FeedbackModal, type FeedbackRating } from "@/components/chat/FeedbackModal";
import type { Message } from "@/types/chat";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

function formatDuration(durationMs: number) {
  const seconds = Math.max(1, Math.round(durationMs / 1000));
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  const remainder = seconds % 60;
  return remainder ? `${minutes}m ${remainder}s` : `${minutes}m`;
}

function parseMultimodal(content: string): { text: string; images: { media_type: string; data: string }[] } | null {
  try {
    const parsed = JSON.parse(content);
    if (parsed && parsed.kind === "multimodal") {
      return { text: parsed.text ?? "", images: parsed.images ?? [] };
    }
  } catch {
    // Plain text content, not our JSON envelope.
  }
  return null;
}

export function MessageBubble({ message, group = false }: { message: Message; group?: boolean }) {
  const isUser = message.role === "user";
  const multimodal = parseMultimodal(message.content);
  const showTimestamps = useUIStore((s) => s.showTimestamps);
  const [copied, setCopied] = useState(false);
  const [feedbackRating, setFeedbackRating] = useState<FeedbackRating | null>(null);

  async function copyResponse() {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-1.5 duration-300 ease-out">
      {!isUser && group && message.persona && (
        <p className="text-xs font-medium text-muted-foreground">{personaFor(message.persona).name}</p>
      )}
      {showTimestamps && (
        <p className="text-center text-xs text-muted-foreground">
          {formatTime(message.created_at)}
        </p>
      )}
      <div className={cn("flex", isUser ? "justify-end" : "justify-start")}>
        <div
          className={cn(
            "max-w-[75%] rounded-3xl px-4 py-2.5 text-[0.9375rem] leading-relaxed",
            isUser ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground",
          )}
        >
          {multimodal ? (
            <div className="space-y-2">
              {multimodal.images.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {multimodal.images.map((img, i) => (
                    <img
                      key={i}
                      src={`data:${img.media_type};base64,${img.data}`}
                      alt="User attachment"
                      className="h-32 w-32 rounded-xl object-cover"
                    />
                  ))}
                </div>
              )}
              {multimodal.text && <p className="whitespace-pre-wrap">{multimodal.text}</p>}
            </div>
          ) : isUser ? (
            // What the user typed, verbatim. No markdown pass, so stray
            // asterisks or underscores in their text stay as written.
            <p className="whitespace-pre-wrap">{message.content}</p>
          ) : (
            <Markdown>{message.content}</Markdown>
          )}
        </div>
      </div>
      {!isUser && message.id !== "draft" && (
        <div className="flex items-center gap-3 pl-1 text-xs text-muted-foreground">
          <button
            type="button"
            onClick={copyResponse}
            aria-label={copied ? "Copied response" : "Copy response"}
            className="flex items-center gap-1.5 rounded-md px-1.5 py-1 transition-colors hover:bg-accent hover:text-foreground"
          >
            {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={() => setFeedbackRating("up")}
            aria-label="Share positive feedback"
            className="rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground"
          >
            <ThumbsUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setFeedbackRating("down")}
            aria-label="Share negative feedback"
            className="rounded-md p-1 transition-colors hover:bg-accent hover:text-foreground"
          >
            <ThumbsDown className="h-3.5 w-3.5" />
          </button>
          {message.duration_ms != null && (
            <span>Worked for {formatDuration(message.duration_ms)}</span>
          )}
        </div>
      )}
      {feedbackRating && (
        <FeedbackModal
          rating={feedbackRating}
          message={message}
          onClose={() => setFeedbackRating(null)}
        />
      )}
    </div>
  );
}
