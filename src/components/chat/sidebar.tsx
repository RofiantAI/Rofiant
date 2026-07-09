"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  SquarePen,
  MessageSquare,
  ChevronUp,
  Settings,
  LayoutDashboard,
  Zap,
  LogOut,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  PanelLeftClose,
  Search,
  X,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { appUrl } from "@/lib/app-url";
import { ChatSettingsModal } from "./settings-modal";
import { routing } from "@/i18n/routing";
import { BrandLogo } from "@/components/brand-logo";
import { UserAvatar } from "@/components/dashboard/user-avatar-button";
import { getUserAvatarUrl } from "@/lib/user-avatar";
import { useChatShell } from "@/contexts/chat-shell-context";

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
  pinned?: boolean;
  snippet?: string;
};

function groupByDate(conversations: Conversation[]) {
  const pinned = conversations.filter((c) => c.pinned);
  const unpinned = conversations.filter((c) => !c.pinned);

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const week = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, Conversation[]> = {
    Pinned: pinned,
    Today: [],
    Yesterday: [],
    "Previous 7 days": [],
    Older: [],
  };

  for (const c of unpinned) {
    const d = new Date(c.updated_at);
    if (d >= today) groups["Today"].push(c);
    else if (d >= yesterday) groups["Yesterday"].push(c);
    else if (d >= week) groups["Previous 7 days"].push(c);
    else groups["Older"].push(c);
  }

  return groups;
}

function ConversationItem({
  c,
  active,
  onRename,
  onPin,
  onDelete,
  snippet,
}: {
  c: Conversation;
  active: boolean;
  onRename: (id: string, newTitle: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
  snippet?: string;
}) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState(c.title);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (renaming && inputRef.current) inputRef.current.select();
  }, [renaming]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== c.title) onRename(c.id, trimmed);
    setRenaming(false);
  }

  return (
    <div className="relative group/item mx-2">
      {renaming ? (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background-tertiary border border-border">
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-foreground-muted" />
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") {
                setRenaming(false);
                setRenameValue(c.title);
              }
            }}
            className="flex-1 min-w-0 text-sm bg-background text-foreground px-2 py-1 outline-none border border-border rounded-md focus:border-border-light"
          />
        </div>
      ) : (
        <a
          href={`/chat/${c.id}`}
          className={`relative flex items-start gap-2.5 px-3 py-2.5 text-sm rounded-lg transition-colors ${
            active
              ? "bg-background-tertiary text-foreground shadow-sm"
              : "text-foreground-secondary hover:bg-background-tertiary/70 hover:text-foreground"
          }`}
        >
          {active && (
            <span className="absolute left-0 top-2 bottom-2 w-0.5 rounded-full bg-accent-primary" />
          )}
          <MessageSquare
            className={`w-3.5 h-3.5 shrink-0 mt-0.5 ${active ? "text-accent-primary" : "text-foreground-muted"}`}
          />
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">{c.title}</span>
            {snippet && (
              <span className="block truncate text-xs text-foreground-muted mt-0.5 leading-snug">
                {snippet}
              </span>
            )}
          </span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropdownOpen((v) => !v);
            }}
            className="opacity-0 group-hover/item:opacity-100 shrink-0 p-1 hover:bg-background-secondary rounded-md transition-opacity"
            aria-label="Chat options"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-foreground-muted" />
          </button>
        </a>
      )}

      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-2 top-full z-50 mt-1 w-44 rounded-lg bg-card border border-border shadow-xl py-1 overflow-hidden"
        >
          <button
            onClick={() => {
              onPin(c.id, !c.pinned);
              setDropdownOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
          >
            {c.pinned ? (
              <PinOff className="w-3.5 h-3.5" />
            ) : (
              <Pin className="w-3.5 h-3.5" />
            )}
            {c.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => {
              setRenaming(true);
              setRenameValue(c.title);
              setDropdownOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
          <button
            onClick={() => {
              onDelete(c.id);
              setDropdownOpen(false);
            }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-red-400 hover:bg-background-tertiary transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

export function ChatSidebar({
  conversations: initialConversations,
  user,
}: {
  conversations: Conversation[];
  user: SupabaseUser;
}) {
  const { closeSidebar } = useChatShell();
  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isPro = plan !== "free";
  const displayName =
    user.user_metadata?.display_name?.trim() ||
    user.user_metadata?.full_name?.trim() ||
    user.email?.split("@")[0] ||
    "Account";
  const avatarUrl = getUserAvatarUrl(user);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [conversations, setConversations] = useState(initialConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const localSearchResults = useMemo(() => {
    if (!isSearching) return null;
    const q = trimmedQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, isSearching, trimmedQuery]);

  useEffect(() => {
    if (!isSearching) {
      setSearchResults(null);
      setSearchLoading(false);
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await fetch(
          `/api/conversations/search?q=${encodeURIComponent(trimmedQuery)}`,
          { signal: controller.signal },
        );
        if (!res.ok) throw new Error("Search failed");
        const data = (await res.json()) as Conversation[];
        setSearchResults(data);
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setSearchResults(null);
        }
      } finally {
        if (!controller.signal.aborted) setSearchLoading(false);
      }
    }, 250);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [trimmedQuery, isSearching]);

  const displayedConversations = isSearching
    ? (searchResults ?? localSearchResults ?? [])
    : conversations;
  const groups = isSearching
    ? { Results: displayedConversations }
    : groupByDate(conversations);
  const [menuOpen, setMenuOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (
        e.key === "Escape" &&
        document.activeElement === searchInputRef.current
      ) {
        setSearchQuery("");
        searchInputRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push(`/${routing.defaultLocale}/auth/login`);
  }

  const handleRename = useCallback(async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c)),
    );
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: newTitle }),
    });
  }, []);

  const handlePin = useCallback(async (id: string, pinned: boolean) => {
    setConversations((prev) => {
      const updated = prev.map((c) => (c.id === id ? { ...c, pinned } : c));
      return [
        ...updated.filter((c) => c.pinned),
        ...updated.filter((c) => !c.pinned),
      ];
    });
    await fetch(`/api/conversations/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pinned }),
    });
  }, []);

  const handleDelete = useCallback(
    async (id: string) => {
      setConversations((prev) => prev.filter((c) => c.id !== id));
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (pathname === `/chat/${id}`) router.push("/chat");
    },
    [pathname, router],
  );

  return (
    <>
      <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-background-secondary/80 h-full">
        <div className="flex items-center justify-between px-4 py-3.5 border-b border-border">
          <a href="/chat" className="flex items-center gap-2">
            <BrandLogo className="w-10 h-auto" />
          </a>
          <div className="flex items-center gap-0.5">
            <a
              href="/chat"
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors"
              title="New chat"
            >
              <SquarePen className="w-4 h-4 text-foreground-muted" />
            </a>
            <button
              type="button"
              onClick={closeSidebar}
              className="flex items-center justify-center w-8 h-8 rounded-lg hover:bg-background-tertiary transition-colors"
              title="Close sidebar"
            >
              <PanelLeftClose className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>
        </div>

        <div className="px-3 py-2.5 border-b border-border space-y-2">
          <a
            href="/chat"
            className="flex items-center justify-center gap-2 w-full h-9 rounded-lg border border-border bg-card/60 text-sm text-foreground-secondary hover:text-foreground hover:bg-background-tertiary hover:border-border-light transition-colors"
          >
            <SquarePen className="w-3.5 h-3.5" />
            New chat
          </a>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
            <input
              ref={searchInputRef}
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chats"
              className="w-full h-8 pl-8 pr-8 rounded-lg bg-background-tertiary/80 border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light focus:ring-1 focus:ring-accent-primary/20 transition-shadow"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-foreground-muted hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            ) : (
              <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden sm:inline text-[10px] text-foreground-muted border border-border rounded-md px-1.5 py-0.5 bg-background/50">
                ⌘K
              </kbd>
            )}
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto py-2">
          {isSearching &&
            searchLoading &&
            displayedConversations.length === 0 && (
              <p className="px-4 py-3 text-xs text-foreground-muted">
                Searching…
              </p>
            )}
          {Object.entries(groups).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label} className="mb-1">
                <div className="px-5 py-1.5 text-[11px] text-foreground-muted font-medium uppercase tracking-wider">
                  {label}
                </div>
                {items.map((c) => (
                  <ConversationItem
                    key={c.id}
                    c={c}
                    active={pathname === `/chat/${c.id}`}
                    onRename={handleRename}
                    onPin={handlePin}
                    onDelete={handleDelete}
                    snippet={c.snippet}
                  />
                ))}
              </div>
            );
          })}
          {isSearching &&
            !searchLoading &&
            displayedConversations.length === 0 && (
              <p className="px-4 py-3 text-xs text-foreground-muted">
                No chats match &ldquo;{trimmedQuery}&rdquo;
              </p>
            )}
          {!isSearching && conversations.length === 0 && (
            <div className="px-5 py-8 text-center">
              <MessageSquare className="w-8 h-8 text-foreground-muted/40 mx-auto mb-2" />
              <p className="text-xs text-foreground-muted">No conversations yet</p>
              <a
                href="/chat"
                className="inline-block mt-3 text-xs text-accent-primary hover:underline"
              >
                Start a chat
              </a>
            </div>
          )}
        </nav>

        {/* Footer */}
        <div
          className="border-t border-border px-3 py-3 relative"
          ref={menuRef}
        >
          {menuOpen && (
            <div className="absolute bottom-full rounded-lg left-3 right-3 mb-1.5 bg-card border border-border shadow-xl py-1 overflow-hidden">
              <button
                onClick={() => {
                  setSettingsOpen(true);
                  setMenuOpen(false);
                }}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
              >
                <Settings className="w-4 h-4" />
                Settings
              </button>
              <a
                href={appUrl("/dashboard")}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                Dashboard
              </a>
              {!isPro && (
                <a
                  href="/pricing"
                  className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
                >
                  <Zap className="w-4 h-4" />
                  Upgrade
                </a>
              )}
              <div className="my-1 border-t border-border" />
              <button
                onClick={handleSignOut}
                className="flex items-center gap-3 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Sign out
              </button>
            </div>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-label="My account"
            className="flex items-center gap-3 w-full px-2 py-2 rounded-lg hover:bg-background-tertiary transition-colors"
          >
            <UserAvatar avatarUrl={avatarUrl} className="w-8 h-8 shrink-0 border border-border" />
            <span className="flex-1 min-w-0 text-left text-sm text-foreground truncate">
              {displayName}
            </span>
            <ChevronUp
              className={`w-3.5 h-3.5 shrink-0 text-foreground-muted transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>
        </div>
      </aside>

      {settingsOpen && (
        <ChatSettingsModal onClose={() => setSettingsOpen(false)} />
      )}
    </>
  );
}
