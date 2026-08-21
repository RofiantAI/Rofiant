import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Settings, LogOut, MoreHorizontal, Pin, Pencil, Trash2, PanelLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useAuthStore } from "@/stores/useAuthStore";
import { useRunningStore } from "@/stores/useRunningStore";
import {
  useConversations,
  useUpdateConversation,
  useDeleteConversation,
} from "@/hooks/useConversations";
import { useHorizontalResize } from "@/hooks/useHorizontalResize";
import { useProfile } from "@/hooks/useAccount";
import { ConversationAvatar } from "@/components/personas/ConversationAvatar";
import { Skeleton } from "@/components/ui/skeleton";
import { NewChatMenu } from "@/components/sidebar/NewChatMenu";
import type { ConversationWithLastMessage } from "@/types/chat";

// Width of the icon-only rail shown when the sidebar is collapsed. The
// titlebar needs this too, to size its left segment to match.
export const SIDEBAR_COLLAPSED_WIDTH = 100;

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

// Message content is plain text, or a JSON-encoded multimodal blob (see
// MessageInput's image-attach path), the preview only ever shows text.
function previewText(c: ConversationWithLastMessage): string {
  const last = c.messages[0];
  if (!last) return "No messages yet";
  try {
    const parsed = JSON.parse(last.content);
    if (parsed?.kind === "multimodal") return parsed.text || "Sent an image";
  } catch {
    // plain text content, fall through
  }
  return last.content.replace(/\s+/g, " ").trim();
}

export function Sidebar() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const selectConversation = useUIStore((s) => s.selectConversation);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const running = useRunningStore((s) => s.running);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const { data: profile } = useProfile();
  const navigate = useNavigate();

  const onResizeStart = useHorizontalResize({
    width: sidebarWidth,
    setWidth: setSidebarWidth,
    min: 260,
    max: 520,
  });

  const { data: conversations = [], isLoading: conversationsLoading } = useConversations();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();
  const [query, setQuery] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConversationWithLastMessage | null>(null);
  const confirmBeforeDelete = useUIStore((s) => s.confirmBeforeDelete);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpenId) return;
    function onClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpenId(null);
      }
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [menuOpenId]);

  const filtered = conversations
    .filter((c) => c.title.toLowerCase().includes(query.trim().toLowerCase()))
    .sort((a, b) => Number(b.pinned) - Number(a.pinned));

  function startRename(c: ConversationWithLastMessage) {
    setRenamingId(c.id);
    setRenameValue(c.title);
    setMenuOpenId(null);
  }

  function commitRename() {
    if (renamingId && renameValue.trim()) {
      updateConversation.mutate({ id: renamingId, title: renameValue.trim() });
    }
    setRenamingId(null);
  }

  function togglePin(c: ConversationWithLastMessage) {
    updateConversation.mutate({ id: c.id, pinned: !c.pinned });
    setMenuOpenId(null);
  }

  function removeConversation(id: string) {
    deleteConversation.mutate(id, {
      onSuccess: () => {
        if (activeConversationId === id) {
          const next = conversations.find((c) => c.id !== id);
          if (next) selectConversation(next.id);
        }
      },
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    removeConversation(deleteTarget.id);
    setDeleteTarget(null);
  }

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, selectConversation]);

  const displayName = profile?.username || user?.email || "?";
  const initials = displayName.charAt(0).toUpperCase();

  if (!sidebarOpen) {
    return (
      <aside
        className="flex h-full shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-3"
        style={{ width: SIDEBAR_COLLAPSED_WIDTH }}
      >
        <button
          onClick={toggleSidebar}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <PanelLeft className="h-4 w-4" />
        </button>

        <div className="flex w-full flex-1 flex-col items-center gap-4 overflow-y-auto pt-1">
          {conversationsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-14 shrink-0 rounded-full" />
              ))
            : filtered.map((c) => (
            <button
              key={c.id}
              onClick={() => selectConversation(c.id)}
              className={cn(
                "flex h-14 w-14 shrink-0 items-center justify-center rounded-full transition-colors",
                c.id === activeConversationId ? "bg-accent" : "hover:bg-accent/60",
              )}
            >
              <ConversationAvatar conversation={c} size={48} working={running.has(c.id)} />
            </button>
              ))}
        </div>

        <NewChatMenu buttonClassName="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground" />

        <button
          onClick={() => navigate("/settings")}
          className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-accent"
        >
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="h-full w-full object-cover" />
          ) : (
            initials
          )}
        </button>
      </aside>
    );
  }

  return (
    <aside
      className="relative flex h-full shrink-0 flex-col border-r border-border bg-sidebar"
      style={{ width: sidebarWidth }}
    >
      <div
        onMouseDown={onResizeStart}
        className="absolute right-0 top-0 z-30 h-full w-1 cursor-col-resize hover:bg-ring/50"
      />
      <div className="p-4">
        <div className="flex items-center gap-2 rounded-xl bg-secondary px-3 py-2">
          <Search className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-4 pb-2">
        {conversationsLoading ? (
          <ul className="space-y-0.5">
            {Array.from({ length: 8 }).map((_, i) => (
              <li key={i} className="flex items-center gap-3 px-2.5 py-2.5">
                <Skeleton className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Skeleton className="h-3.5 w-2/3" />
                  <Skeleton className="h-3 w-4/5" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <>
        {filtered.length === 0 && (
          <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">No chats yet</p>
        )}
        <ul className="space-y-0.5">
          {filtered.map((c) => (
            <li key={c.id} className="group/row relative">
              <button
                onClick={() => selectConversation(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-accent",
                  c.id === activeConversationId && "bg-accent",
                )}
              >
                <ConversationAvatar conversation={c} size={40} working={running.has(c.id)} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    {renamingId === c.id ? (
                      <input
                        autoFocus
                        value={renameValue}
                        onChange={(e) => setRenameValue(e.target.value)}
                        onClick={(e) => e.stopPropagation()}
                        onBlur={commitRename}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") commitRename();
                          if (e.key === "Escape") setRenamingId(null);
                        }}
                        className="min-w-0 flex-1 rounded-md bg-background px-1.5 py-0.5 text-sm font-medium text-foreground focus:outline-none"
                      />
                    ) : (
                      <span className="truncate text-sm font-medium text-foreground">
                        {c.pinned && <Pin className="mr-1 inline h-3 w-3 -translate-y-px text-muted-foreground" />}
                        {c.title}
                      </span>
                    )}
                    <span className="shrink-0 text-xs text-muted-foreground group-hover/row:hidden">
                      {formatTime(c.updated_at)}
                    </span>
                  </div>
                  <p className="truncate text-xs text-muted-foreground">{previewText(c)}</p>
                </div>
              </button>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setMenuOpenId(menuOpenId === c.id ? null : c.id);
                }}
                className="absolute right-2 top-1/2 hidden -translate-y-1/2 items-center justify-center rounded-md p-1 text-muted-foreground hover:bg-secondary hover:text-foreground group-hover/row:flex"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>

              {menuOpenId === c.id && (
                <div
                  ref={menuRef}
                  className="absolute right-2 top-10 z-20 w-36 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
                >
                  <button
                    onClick={() => togglePin(c)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                  >
                    <Pin className="h-3.5 w-3.5" />
                    {c.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    onClick={() => startRename(c)}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      if (confirmBeforeDelete) setDeleteTarget(c);
                      else removeConversation(c.id);
                      setMenuOpenId(null);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
          </>
        )}
      </nav>

      <div className="flex items-center justify-between  px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-foreground">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="truncate text-sm text-foreground/90">{displayName}</span>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => navigate("/settings")}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Settings className="h-4 w-4" />
          </button>
          <button
            onClick={() => signOut()}
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
          <div className="w-80 rounded-xl border border-border bg-card p-4">
            <p className="text-sm font-medium text-foreground">Delete "{deleteTarget.title}"?</p>
            <p className="mt-1 text-xs text-muted-foreground">This can't be undone.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                className="rounded-lg px-3 py-1.5 text-sm text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                className="rounded-lg bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
