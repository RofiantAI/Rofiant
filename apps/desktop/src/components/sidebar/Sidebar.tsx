import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { CircleHelp, Search, Settings, LogOut, MoreHorizontal, Pin, Pencil, Trash2 } from "lucide-react";
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
import { ContactModal } from "@/components/sidebar/ContactModal";
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
  const clearActiveConversation = useUIStore((s) => s.clearActiveConversation);
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

  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError } = useConversations();
  const updateConversation = useUpdateConversation();
  const deleteConversation = useDeleteConversation();
  const [query, setQuery] = useState("");
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const [compactMenuTop, setCompactMenuTop] = useState(0);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<ConversationWithLastMessage | null>(null);
  const confirmBeforeDelete = useUIStore((s) => s.confirmBeforeDelete);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [lastClickedId, setLastClickedId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const profileMenuRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (!profileMenuOpen) return;
    function closeProfileMenu(e: MouseEvent | KeyboardEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") setProfileMenuOpen(false);
        return;
      }
      if (profileMenuRef.current && !profileMenuRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", closeProfileMenu);
    document.addEventListener("keydown", closeProfileMenu);
    return () => {
      document.removeEventListener("mousedown", closeProfileMenu);
      document.removeEventListener("keydown", closeProfileMenu);
    };
  }, [profileMenuOpen]);

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
          else clearActiveConversation();
        }
      },
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    removeConversation(deleteTarget.id);
    setDeleteTarget(null);
  }

  // Ctrl/Cmd toggles one chat; Shift selects the range since the last
  // clicked one (both against the currently filtered/sorted order, so a
  // search doesn't select chats the user can't see). A plain click while
  // some are selected clears the selection instead of opening a chat --
  // least surprising, matches file-manager multi-select conventions.
  function handleRowClick(event: React.MouseEvent, c: ConversationWithLastMessage) {
    if (event.shiftKey && lastClickedId) {
      const ids = filtered.map((x) => x.id);
      const from = ids.indexOf(lastClickedId);
      const to = ids.indexOf(c.id);
      if (from !== -1 && to !== -1) {
        const [start, end] = from < to ? [from, to] : [to, from];
        setSelectedIds((prev) => {
          const next = new Set(prev);
          for (let i = start; i <= end; i++) next.add(ids[i]);
          return next;
        });
      }
      return;
    }
    if (event.ctrlKey || event.metaKey) {
      setSelectedIds((prev) => {
        const next = new Set(prev);
        if (next.has(c.id)) next.delete(c.id);
        else next.add(c.id);
        return next;
      });
      setLastClickedId(c.id);
      return;
    }
    if (selectedIds.size > 0) {
      setSelectedIds(new Set());
      return;
    }
    setLastClickedId(c.id);
    selectConversation(c.id);
  }

  async function confirmBulkDelete() {
    setBulkDeleting(true);
    try {
      await Promise.all([...selectedIds].map((id) => deleteConversation.mutateAsync(id)));
      if (activeConversationId && selectedIds.has(activeConversationId)) {
        const next = conversations.find((c) => !selectedIds.has(c.id));
        if (next) selectConversation(next.id);
        else clearActiveConversation();
      }
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
    } finally {
      setBulkDeleting(false);
    }
  }

  useEffect(() => {
    if (selectedIds.size === 0) return;
    function onEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setSelectedIds(new Set());
    }
    document.addEventListener("keydown", onEscape);
    return () => document.removeEventListener("keydown", onEscape);
  }, [selectedIds]);

  useEffect(() => {
    if (!activeConversationId && conversations.length > 0) {
      selectConversation(conversations[0].id);
    }
  }, [activeConversationId, conversations, selectConversation]);

  const displayName = profile?.username || user?.email || "?";
  const initials = displayName.charAt(0).toUpperCase();
  const deleteDialog = deleteTarget && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onKeyDown={(e) => {
      if (e.key === "Escape") setDeleteTarget(null);
      if (e.key !== "Tab") return;
      const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button"));
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="delete-chat-title" className="w-80 rounded-xl border border-border bg-card p-4">
        <p id="delete-chat-title" className="text-sm font-medium text-foreground">Delete "{deleteTarget.title}"?</p>
        <p className="mt-1 text-xs text-muted-foreground">This can't be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button onClick={() => setDeleteTarget(null)} autoFocus className="rounded-lg px-3 py-1.5 text-sm text-foreground hover:bg-accent">Cancel</button>
          <button onClick={confirmDelete} className="rounded-lg bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-90">Delete</button>
        </div>
      </div>
    </div>
  );

  const bulkDeleteDialog = bulkDeleteOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onKeyDown={(e) => {
      if (e.key === "Escape" && !bulkDeleting) setBulkDeleteOpen(false);
    }}>
      <div role="dialog" aria-modal="true" aria-labelledby="bulk-delete-title" className="w-80 rounded-xl border border-border bg-card p-4">
        <p id="bulk-delete-title" className="text-sm font-medium text-foreground">
          Delete {selectedIds.size} chat{selectedIds.size === 1 ? "" : "s"}?
        </p>
        <p className="mt-1 text-xs text-muted-foreground">This can't be undone.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => setBulkDeleteOpen(false)}
            disabled={bulkDeleting}
            autoFocus
            className="rounded-lg px-3 py-1.5 text-sm text-foreground hover:bg-accent disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmBulkDelete}
            disabled={bulkDeleting}
            className="rounded-lg bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-90 disabled:opacity-50"
          >
            {bulkDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );

  if (!sidebarOpen) {
    return (
      <aside
        className="app-sidebar app-sidebar-collapsing flex h-full shrink-0 flex-col items-center gap-2 border-r border-border bg-sidebar py-3"
        style={{
          width: SIDEBAR_COLLAPSED_WIDTH,
          "--sidebar-expanded-width": `${sidebarWidth}px`,
        } as CSSProperties}
      >
        <div className="flex w-full flex-1 flex-col items-center gap-4 overflow-y-auto">
          {conversationsLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-14 shrink-0 rounded-full" />
              ))
            : filtered.map((c) => (
            <div key={c.id} className="group/compact relative h-14 w-20 shrink-0">
              <button
                onClick={() => selectConversation(c.id)}
                aria-label={`Open ${c.title}`}
                className={cn(
                  "flex h-full w-full items-center justify-center rounded-xl transition-colors",
                  c.id === activeConversationId ? "bg-accent" : "hover:bg-accent/60",
                )}
              >
                <ConversationAvatar conversation={c} size={48} working={running.has(c.id)} />
              </button>
              <button
                onClick={(event) => {
                  const nextOpen = menuOpenId !== c.id;
                  if (nextOpen) {
                    const { top } = event.currentTarget.getBoundingClientRect();
                    setCompactMenuTop(Math.max(8, Math.min(top, window.innerHeight - 112)));
                  }
                  setMenuOpenId(nextOpen ? c.id : null);
                }}
                aria-label={`Actions for ${c.title}`}
                aria-haspopup="menu"
                aria-expanded={menuOpenId === c.id}
                className={cn(
                  "absolute bottom-1 right-1 flex h-6 w-6 items-center justify-center rounded-full bg-popover text-muted-foreground shadow-sm transition-opacity hover:text-foreground focus:opacity-100 group-hover/compact:opacity-100 group-focus-within/compact:opacity-100",
                  c.id === activeConversationId ? "opacity-100" : "opacity-0",
                )}
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
              {menuOpenId === c.id && createPortal(
                <div
                  ref={menuRef}
                  role="menu"
                  className="fixed z-50 w-36 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
                  style={{ left: SIDEBAR_COLLAPSED_WIDTH + 8, top: compactMenuTop }}
                >
                  <button role="menuitem" onClick={() => togglePin(c)} className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent">
                    <Pin className="h-3.5 w-3.5" />
                    {c.pinned ? "Unpin" : "Pin"}
                  </button>
                  <button
                    role="menuitem"
                    onClick={() => {
                      selectConversation(c.id);
                      startRename(c);
                      toggleSidebar();
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    role="menuitem"
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
                </div>,
                document.body,
              )}
            </div>
              ))}
        </div>

        <div ref={profileMenuRef} className="relative shrink-0">
          {profileMenuOpen && (
            <div
              role="menu"
              className="absolute bottom-0 left-full z-40 ml-2 w-40 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
            >
              <button
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  navigate("/settings");
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                <Settings className="h-4 w-4" />
                Settings
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  setContactOpen(true);
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                <CircleHelp className="h-4 w-4" />
                Help
              </button>
              <button
                role="menuitem"
                onClick={() => {
                  setProfileMenuOpen(false);
                  void signOut();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
              >
                <LogOut className="h-4 w-4" />
                Log out
              </button>
            </div>
          )}
          <button
            onClick={() => setProfileMenuOpen((open) => !open)}
            aria-label="Open account menu"
            aria-haspopup="menu"
            aria-expanded={profileMenuOpen}
            className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-foreground transition-colors hover:bg-accent"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </button>
        </div>

        {contactOpen && <ContactModal email={user?.email} onClose={() => setContactOpen(false)} />}
        {deleteDialog}
      </aside>
    );
  }

  return (
    <aside
      className="app-sidebar app-sidebar-expanding relative flex h-full max-w-[45vw] shrink-0 flex-col border-r border-border bg-sidebar"
      style={{
        width: sidebarWidth,
        "--sidebar-expanded-width": `${sidebarWidth}px`,
      } as CSSProperties}
    >
      <div
        onMouseDown={onResizeStart}
        role="separator"
        aria-label="Resize sidebar"
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
        ) : conversationsError ? (
          <p className="px-2.5 py-6 text-center text-sm text-destructive">Couldn't load chats.</p>
        ) : (
          <>
        {filtered.length === 0 && (
          <p className="px-2.5 py-6 text-center text-sm text-muted-foreground">
            {query.trim() ? "No matching chats" : "No chats yet"}
          </p>
        )}
        {selectedIds.size > 0 && (
          <div className="mb-1 flex items-center justify-between rounded-lg bg-secondary px-3 py-2">
            <span className="text-xs text-muted-foreground">{selectedIds.size} selected</span>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedIds(new Set())}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Cancel
              </button>
              <button
                onClick={() => setBulkDeleteOpen(true)}
                className="flex items-center gap-1 text-xs text-destructive hover:opacity-80"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
            </div>
          </div>
        )}
        <ul className="space-y-0.5">
          {filtered.map((c) => (
            <li key={c.id} className="group/row relative">
              <button
                onClick={(e) => handleRowClick(e, c)}
                aria-label={`Open ${c.title}`}
                aria-pressed={selectedIds.has(c.id)}
                className={cn(
                  "flex w-full items-center gap-3 rounded-xl px-2.5 py-2.5 text-left transition-colors hover:bg-accent",
                  c.id === activeConversationId && "bg-accent",
                  selectedIds.has(c.id) && "bg-primary/10 ring-1 ring-inset ring-primary/40",
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
                aria-label={`Actions for ${c.title}`}
                className="absolute right-2 top-1/2 flex -translate-y-1/2 items-center justify-center rounded-md p-1 text-muted-foreground opacity-0 hover:bg-secondary hover:text-foreground focus:opacity-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100"
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

      <div ref={profileMenuRef} className="relative border-t border-border">
        {profileMenuOpen && (
          <div
            role="menu"
            className="absolute bottom-full left-3 right-3 z-40 mb-2 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg"
          >
            <button
              role="menuitem"
              onClick={() => {
                setProfileMenuOpen(false);
                navigate("/settings");
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
            >
              <Settings className="h-4 w-4" />
              Settings
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setProfileMenuOpen(false);
                setContactOpen(true);
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
            >
              <CircleHelp className="h-4 w-4" />
              Help
            </button>
            <button
              role="menuitem"
              onClick={() => {
                setProfileMenuOpen(false);
                void signOut();
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm text-foreground hover:bg-accent"
            >
              <LogOut className="h-4 w-4" />
              Log out
            </button>
          </div>
        )}
        <button
          onClick={() => setProfileMenuOpen((open) => !open)}
          aria-label="Open account menu"
          aria-haspopup="menu"
          aria-expanded={profileMenuOpen}
          className="flex w-full min-w-0 items-center gap-2.5 px-4 py-3 text-left transition-colors hover:bg-accent/60"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-foreground">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="h-full w-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <span className="truncate text-sm text-foreground/90">{displayName}</span>
        </button>
      </div>

      {contactOpen && <ContactModal email={user?.email} onClose={() => setContactOpen(false)} />}
      {deleteDialog}
      {bulkDeleteDialog}
    </aside>
  );
}
