"use client";

import { usePathname, useRouter } from "next/navigation";
import NextLink from "next/link";
import { Link as LocaleLink } from "@/i18n/navigation";
import {
  Plus,
  Home,
  MessageSquare,
  Settings,
  Sparkles,
  LogOut,
  MoreHorizontal,
  Pin,
  PinOff,
  Pencil,
  Trash2,
  BookOpen,
  MessageCircle,
  Download,
  Search,
  X,
  PanelLeftClose,
  Contrast,
  CircleHelp,
  ChevronRight,
  Check,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useTheme } from "next-themes";
import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { appUrl } from "@/lib/app-url";
import { routing } from "@/i18n/routing";
import { UserAvatar } from "@/components/dashboard/user-avatar-button";
import { getUserAvatarUrl } from "@/lib/user-avatar";
import { useChatShell } from "@/contexts/chat-shell-context";
import { useConfirmDialog } from "@/components/chat/confirm-dialog";

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
}: {
  c: Conversation;
  active: boolean;
  onRename: (id: string, newTitle: string) => void;
  onPin: (id: string, pinned: boolean) => void;
  onDelete: (id: string) => void;
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
    <div className="px-2 relative">
      <div
        className={`flex w-full items-center gap-2 h-8 px-2 rounded-md text-[13px] transition-colors ${
          active
            ? "bg-background-tertiary text-foreground"
            : "text-foreground-secondary hover:bg-background-tertiary/60 hover:text-foreground"
        }`}
      >
        <a
          href={renaming ? undefined : `/chat/${c.id}`}
          onClick={(e) => renaming && e.preventDefault()}
          className="flex flex-1 min-w-0 items-center gap-2 text-left"
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-foreground-muted" />
          {renaming ? (
            <input
              ref={inputRef}
              autoFocus
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              onFocus={(e) => e.target.select()}
              onBlur={submitRename}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  submitRename();
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setRenaming(false);
                  setRenameValue(c.title);
                }
              }}
              className="flex-1 min-w-0 bg-transparent text-foreground outline-none border-b border-foreground-muted/40"
            />
          ) : (
            <span className="flex-1 min-w-0 truncate">{c.title}</span>
          )}
        </a>
        {!renaming && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropdownOpen((v) => !v);
            }}
            aria-label="Conversation options"
            className="flex items-center justify-center w-5 h-5 rounded shrink-0 text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
          >
            <MoreHorizontal className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-2 top-8 z-10 w-36 rounded-lg bg-card border border-border shadow-lg py-1 overflow-hidden"
        >
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              setRenaming(true);
              setRenameValue(c.title);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[13px] text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              onPin(c.id, !c.pinned);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[13px] text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
          >
            {c.pinned ? (
              <PinOff className="w-3.5 h-3.5" />
            ) : (
              <Pin className="w-3.5 h-3.5" />
            )}
            {c.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            type="button"
            onClick={() => {
              setDropdownOpen(false);
              onDelete(c.id);
            }}
            className="flex items-center gap-2.5 w-full px-3 py-1.5 text-[13px] text-red-400 hover:bg-background-tertiary transition-colors"
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
  const [prevInitialConversations, setPrevInitialConversations] = useState(initialConversations);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Conversation[] | null>(
    null,
  );
  const [searchLoading, setSearchLoading] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  if (initialConversations !== prevInitialConversations) {
    setPrevInitialConversations(initialConversations);
    setConversations(initialConversations);
  }

  const trimmedQuery = searchQuery.trim();
  const isSearching = trimmedQuery.length > 0;

  const [prevIsSearching, setPrevIsSearching] = useState(isSearching);
  if (isSearching !== prevIsSearching) {
    setPrevIsSearching(isSearching);
    if (!isSearching) {
      setSearchResults(null);
      setSearchLoading(false);
    }
  }

  const localSearchResults = useMemo(() => {
    if (!isSearching) return null;
    const q = trimmedQuery.toLowerCase();
    return conversations.filter((c) => c.title.toLowerCase().includes(q));
  }, [conversations, isSearching, trimmedQuery]);

  useEffect(() => {
    if (!isSearching) return;

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
  const [subMenu, setSubMenu] = useState<"appearance" | "help" | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const [themeMounted, setThemeMounted] = useState(false);
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => setThemeMounted(true), []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setSubMenu(null);
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

  const { confirm, dialog: confirmDialog } = useConfirmDialog();

  const handleDelete = useCallback(
    async (id: string) => {
      const target = conversations.find((c) => c.id === id);
      const ok = await confirm({
        title: target ? `Delete "${target.title}"?` : "Delete this chat?",
        description: "This can't be undone.",
        confirmLabel: "Delete",
        danger: true,
      });
      if (!ok) return;
      setConversations((prev) => prev.filter((c) => c.id !== id));
      await fetch(`/api/conversations/${id}`, { method: "DELETE" });
      if (pathname === `/chat/${id}`) router.push("/chat");
    },
    [conversations, pathname, router, confirm],
  );

  const [searching, setSearching] = useState(false);
  const emailName = user.email?.split("@")[0] ?? displayName;

  return (
    <aside className="w-[272px] shrink-0 flex flex-col border-r border-border bg-background h-full">
      <div className="flex items-center gap-1.5 h-11 px-3 shrink-0">
        <button
          type="button"
          onClick={closeSidebar}
          title="Close sidebar"
          className="flex items-center justify-center w-5 h-5 rounded-md text-foreground-muted hover:bg-background-tertiary hover:text-foreground transition-colors shrink-0"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
        {searching ? (
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
            <input
              ref={searchInputRef}
              autoFocus
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onBlur={() => !searchQuery && setSearching(false)}
              placeholder="Search chats"
              className="w-full h-7 pl-8 pr-7 rounded-md bg-background-tertiary text-sm text-foreground placeholder:text-foreground-muted outline-none"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearching(false);
                }}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 p-0.5 text-foreground-muted hover:text-foreground transition-colors"
                aria-label="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setSearching(true)}
            title="Search"
            className="flex items-center gap-2 w-full h-7 px-2.5 rounded-md bg-background-tertiary text-foreground-muted hover:text-foreground transition-colors"
          >
            <Search className="w-3.5 h-3.5 shrink-0" />
            <span className="text-sm">Search chats</span>
          </button>
        )}
      </div>

      <div className="px-2 pb-1">
        <NextLink
          href="/dashboard"
          className="flex items-center gap-2.5 w-full h-8 px-2 rounded-md text-sm text-foreground hover:bg-background-tertiary transition-colors"
        >
          <Home className="w-4 h-4 text-foreground-muted" />
          <span className="flex-1 text-left">Home</span>
        </NextLink>
        <NextLink
          href="/chat"
          className="flex items-center gap-2.5 w-full h-8 px-2 rounded-md text-sm text-foreground hover:bg-background-tertiary transition-colors"
        >
          <Plus className="w-4 h-4 text-foreground-muted" />
          <span className="flex-1 text-left">New Chat</span>
        </NextLink>
      </div>

      <nav className="flex-1 overflow-y-auto pb-2">
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
            <div key={label} className="mb-0.5">
              <div className="px-4 pt-3 pb-1 text-[11px] text-foreground-muted">
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
            <MessageSquare className="w-8 h-8 text-foreground-muted/30 mx-auto mb-2" />
            <p className="text-xs text-foreground-muted">No chats yet</p>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div
        className="border-t border-border px-3 py-2.5 flex items-center gap-2 relative"
        ref={menuRef}
      >
        <button
          type="button"
          onClick={() => {
            setMenuOpen((v) => !v);
            setSubMenu(null);
          }}
          className="flex items-center gap-2 flex-1 min-w-0 rounded-md hover:bg-background-tertiary transition-colors -mx-1 px-1 py-0.5"
        >
          <UserAvatar
            avatarUrl={avatarUrl}
            className="w-7 h-7 shrink-0 border border-border"
          />
          <div className="flex-1 min-w-0 text-left">
            <div className="text-[13px] text-foreground truncate leading-tight">
              {emailName}
            </div>
            <div className="text-[11px] text-foreground-muted truncate leading-tight capitalize">
              {plan}
            </div>
          </div>
        </button>
        {menuOpen && (
          <div className="absolute bottom-full left-3 mb-1.5 w-64 rounded-lg bg-card border border-border shadow-lg overflow-visible">
            <div className="px-3 py-3">
              <div className="text-sm text-foreground truncate">{emailName}</div>
              <div className="text-xs text-foreground-muted truncate">{user.email}</div>
            </div>
            {!isPro && (
              <div className="px-2 pb-2">
                <LocaleLink
                  href="/pricing"
                  className="flex items-center justify-center gap-1.5 w-full px-3 py-1.5 text-sm text-foreground border border-border rounded-md hover:bg-background-tertiary transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Upgrade to Pro
                </LocaleLink>
              </div>
            )}
            <div className="h-px bg-border" />
            <div className="py-1 px-0.5">
              <a
                href={appUrl("/chat/settings")}
                className="flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors rounded-md"
              >
                <Settings className="w-3.5 h-3.5" />
                Settings
              </a>
              <LocaleLink
                href="/download"
                className="flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors rounded-md"
              >
                <Download className="w-3.5 h-3.5" />
                Download
              </LocaleLink>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSubMenu((v) => (v === "appearance" ? null : "appearance"))}
                  className={`flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm transition-colors rounded-md ${
                    subMenu === "appearance"
                      ? "bg-background-tertiary text-foreground"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  }`}
                >
                  <Contrast className="w-3.5 h-3.5" />
                  Appearance
                  <span className="ml-auto text-xs text-foreground-muted capitalize">
                    {themeMounted ? (theme ?? "system") : "system"}
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-foreground-muted" />
                </button>
                {subMenu === "appearance" && (
                  <div className="absolute left-full top-0 ml-1 w-36 rounded-lg bg-card border border-border shadow-lg py-1 px-0.5">
                    {(
                      [
                        { id: "light", label: "Light", icon: Sun },
                        { id: "dark", label: "Dark", icon: Moon },
                        { id: "system", label: "System", icon: Monitor },
                      ] as const
                    ).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setTheme(opt.id)}
                        className="flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors rounded-md"
                      >
                        <opt.icon className="w-3.5 h-3.5" />
                        {opt.label}
                        {themeMounted && theme === opt.id && (
                          <Check className="w-3.5 h-3.5 ml-auto text-foreground" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="relative">
                <button
                  type="button"
                  onClick={() => setSubMenu((v) => (v === "help" ? null : "help"))}
                  className={`flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm transition-colors rounded-md ${
                    subMenu === "help"
                      ? "bg-background-tertiary text-foreground"
                      : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
                  }`}
                >
                  <CircleHelp className="w-3.5 h-3.5" />
                  Help
                  <ChevronRight className="w-3.5 h-3.5 text-foreground-muted ml-auto" />
                </button>
                {subMenu === "help" && (
                  <div className="absolute left-full top-0 ml-1 w-40 rounded-lg bg-card border border-border shadow-lg py-1 px-0.5">
                    <a
                      href="https://www.rofiant.ca/resources/documentation"
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors rounded-md"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      Docs
                    </a>
                    <LocaleLink
                      href="/company/contact"
                      className="flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors rounded-md"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Contact Us
                    </LocaleLink>
                  </div>
                )}
              </div>
            </div>
            <div className="h-px bg-border my-1" />
            <div className="pb-1 px-0.5">
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-[calc(100%-2px)] mx-px px-3 py-1.5 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors rounded-md"
              >
                <LogOut className="w-3.5 h-3.5" />
                Log Out
              </button>
            </div>
          </div>
        )}
        <a
          href={appUrl("/chat/settings")}
          title="Settings"
          className="flex items-center justify-center w-6 h-6 rounded-md text-foreground-muted hover:bg-background-tertiary hover:text-foreground transition-colors shrink-0"
        >
          <Settings className="w-3.5 h-3.5" />
        </a>
      </div>
      {confirmDialog}
    </aside>
  );
}
