import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { PERSONAS } from "@/lib/personas";
import { PersonaFace } from "@/components/personas/PersonaFace";
import { useUIStore } from "@/stores/useUIStore";
import { useCreateConversation } from "@/hooks/useConversations";
import { Spinner } from "@/components/ui/spinner";

// New chat starts here, not with a blank thread: picking a bot is what creates
// the conversation, so its persona is fixed for the life of the chat (the
// system prompt is rebuilt from it on every run, so a mid-chat switch would
// rewrite the premise of the history).
export function BotGallery() {
  const open = useUIStore((s) => s.botGalleryOpen);
  const setOpen = useUIStore((s) => s.setBotGalleryOpen);
  const galleryMode = useUIStore((s) => s.botGalleryMode);
  const selectConversation = useUIStore((s) => s.selectConversation);
  const createConversation = useCreateConversation();
  const [groupMode, setGroupMode] = useState(false);
  const [picked, setPicked] = useState<string[]>([]);

  useEffect(() => {
    if (!open) return;
    setGroupMode(galleryMode === "group");
    setPicked([]);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, galleryMode, setOpen]);

  if (!open) return null;

  function start(persona: string, name: string) {
    createConversation.mutate(
      { title: name, persona },
      {
        onSuccess: (conversation) => {
          selectConversation(conversation.id);
          setOpen(false);
          setGroupMode(false);
          setPicked([]);
        },
      },
    );
  }

  function toggle(id: string) {
    setPicked((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  function startGroup() {
    if (picked.length < 2) return;
    createConversation.mutate(
      { title: "Group chat", persona: picked[0], personas: picked },
      {
        onSuccess: (conversation) => {
          selectConversation(conversation.id);
          setOpen(false);
          setGroupMode(false);
          setPicked([]);
        },
      },
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6"
      onClick={() => setOpen(false)}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bot-gallery-title"
        onKeyDown={(e) => {
          if (e.key !== "Tab") return;
          const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button:not(:disabled)"));
          if (controls.length === 0) return;
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }}
        className="w-full max-w-2xl rounded-2xl border border-border bg-card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 id="bot-gallery-title" className="text-lg font-semibold text-foreground">
              {groupMode ? "Pick 2 or more bots" : "Pick a bot"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {groupMode
                ? "All picked bots see the chat and reply in turn."
                : "Each one is a different way of working. You can't switch a chat's bot later."}
            </p>
          </div>
          <button
            autoFocus
            onClick={() => {
              setGroupMode((v) => !v);
              setPicked([]);
            }}
            className="shrink-0 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            {groupMode ? "Solo chat" : "Group chat"}
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 gap-2">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              onClick={() => (groupMode ? toggle(p.id) : start(p.id, p.name))}
              disabled={createConversation.isPending}
              className={cn(
                "flex items-start gap-3 rounded-xl border p-3 text-left transition-colors hover:bg-accent disabled:opacity-50",
                groupMode && picked.includes(p.id) ? "border-primary bg-accent" : "border-border",
              )}
            >
              <PersonaFace persona={p.id} size={36} />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{p.name}</span>
                <span className="block text-xs text-muted-foreground">{p.tagline}</span>
              </span>
            </button>
          ))}
        </div>

        {groupMode && (
          <button
            onClick={startGroup}
            disabled={picked.length < 2 || createConversation.isPending}
            className="mt-4 w-full rounded-xl bg-primary py-2 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-40"
          >
            Start group chat ({picked.length})
          </button>
        )}

        {createConversation.isPending && (
          <div className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <Spinner className="h-3.5 w-3.5" />
            Starting chat...
          </div>
        )}
      </div>
    </div>
  );
}
