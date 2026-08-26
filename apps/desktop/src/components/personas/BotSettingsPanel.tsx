import { useEffect, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { PersonaFace } from "@/components/personas/PersonaFace";
import { PERSONAS, personaFor } from "@/lib/personas";
import { useUpdateConversation } from "@/hooks/useConversations";
import type { ConversationWithLastMessage } from "@/types/chat";

export function BotSettingsPanel({
  conversation,
  onClose,
}: {
  conversation: ConversationWithLastMessage;
  onClose: () => void;
}) {
  const updateConversation = useUpdateConversation();
  const [name, setName] = useState(conversation.title);
  const [subtitle, setSubtitle] = useState(conversation.subtitle ?? "");
  const [description, setDescription] = useState(conversation.description ?? "");
  const [addingBot, setAddingBot] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(conversation.notifications_enabled);

  useEffect(() => {
    setNotificationsEnabled(conversation.notifications_enabled);
  }, [conversation.notifications_enabled]);

  function toggleNotifications() {
    const next = !notificationsEnabled;
    setNotificationsEnabled(next);
    // Permission prompts only work from a real click. Requesting it here
    // (not later when a run finishes) is the only time it can succeed.
    if (next && Notification.permission === "default") Notification.requestPermission();
    updateConversation.mutate(
      { id: conversation.id, notifications_enabled: next },
      { onError: () => setNotificationsEnabled(!next) },
    );
  }

  const isGroup = (conversation.personas?.length ?? 0) > 1;
  const roster = conversation.personas ?? [];
  const addableBots = PERSONAS.filter((p) => !roster.includes(p.id));

  function addBot(id: string) {
    updateConversation.mutate({ id: conversation.id, personas: [...roster, id] });
    setAddingBot(false);
  }

  function removeBot(id: string) {
    const next = roster.filter((p) => p !== id);
    if (next.length === 0) return;
    updateConversation.mutate({ id: conversation.id, personas: next, persona: next[0] });
  }

  useEffect(() => {
    if (!name.trim() || name === conversation.title) return;
    const t = setTimeout(() => updateConversation.mutate({ id: conversation.id, title: name.trim() }), 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name]);

  useEffect(() => {
    if (subtitle === (conversation.subtitle ?? "")) return;
    const t = setTimeout(
      () => updateConversation.mutate({ id: conversation.id, subtitle: subtitle || null }),
      500,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtitle]);

  useEffect(() => {
    if (description === (conversation.description ?? "")) return;
    const t = setTimeout(
      () => updateConversation.mutate({ id: conversation.id, description: description || null }),
      500,
    );
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [description]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <aside
        className="absolute right-0 top-0 flex h-full w-80 animate-in slide-in-from-right flex-col border-l border-border bg-sidebar duration-200 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
          </button>
          <h2 className="text-sm font-semibold text-foreground">Settings</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        {isGroup ? (
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="flex -space-x-2">
              {roster.map((id) => (
                <PersonaFace key={id} persona={id} size={44} className="ring-2 ring-sidebar" />
              ))}
            </div>
            <p className="text-sm font-medium text-foreground">{roster.length} bots</p>
          </div>
        ) : (
          <div className="flex flex-col items-center py-4">
            <PersonaFace persona={conversation.persona} size={64} />
          </div>
        )}

        <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-4">
          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Title</span>
            <input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Describe what your agent does"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-muted-foreground">Description</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this agent is for"
              rows={3}
              className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            />
          </label>

          {isGroup && (
            <div className="relative">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Bots</span>
                {addableBots.length > 0 && (
                  <button
                    onClick={() => setAddingBot((v) => !v)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                  >
                    <Plus className="h-3 w-3" />
                    Add
                  </button>
                )}
              </div>

              <div className="space-y-1 rounded-lg border border-border bg-card p-2">
                {roster.map((id) => (
                  <div key={id} className="flex items-center justify-between gap-2 rounded-md px-1 py-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <PersonaFace persona={id} size={24} />
                      <span className="truncate text-sm text-foreground">{personaFor(id).name}</span>
                    </span>
                    <button
                      onClick={() => removeBot(id)}
                      disabled={roster.length <= 1}
                      className="shrink-0 text-muted-foreground hover:text-destructive disabled:opacity-30"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>

              {addingBot && (
                <div className="absolute right-0 top-full z-10 mt-1 w-44 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
                  {addableBots.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => addBot(p.id)}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                    >
                      <PersonaFace persona={p.id} size={20} />
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="rounded-lg border border-border bg-card p-3">
            <div className="flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Notifications</p>
                <p className="text-xs text-muted-foreground">
                  Get notified when this agent finishes or needs input
                </p>
              </div>
              <button
                role="switch"
                aria-checked={notificationsEnabled}
                onClick={toggleNotifications}
                className={`relative h-5 w-9 shrink-0 overflow-hidden rounded-full transition-colors ${
                  notificationsEnabled ? "bg-primary" : "bg-secondary"
                }`}
              >
                <span
                  className={`absolute left-0.5 top-0.5 h-4 w-4 rounded-full bg-background transition-transform ${
                    notificationsEnabled ? "translate-x-4" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </div>
      </aside>
    </div>
  );
}
