import { cn } from "@/lib/utils";
import { Markdown } from "@/components/chat/Markdown";
import { useUIStore } from "@/stores/useUIStore";
import { personaFor } from "@/lib/personas";
import type { Message } from "@/types/chat";

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
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

  return (
    <div className="animate-in fade-in slide-in-from-bottom-2 space-y-1.5 duration-300 ease-out">
      {!isUser && group && message.persona && (
        <p className="text-xs font-medium text-muted-foreground">{personaFor(message.persona).name}</p>
      )}
      {(isUser || showTimestamps) && (
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
    </div>
  );
}
