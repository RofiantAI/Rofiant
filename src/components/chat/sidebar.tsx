"use client";

import { usePathname, useRouter } from "next/navigation";
import {
  SquarePen, MessageSquare, ChevronUp, Settings, LayoutDashboard, Zap, LogOut,
  User, MoreHorizontal, Pin, PinOff, Pencil, Trash2, PanelLeftClose,
} from "lucide-react";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import { useEffect, useRef, useState, useCallback } from "react";
import { appUrl } from "@/lib/app-url";
import { ChatSettingsModal } from "./settings-modal";

type Conversation = { id: string; title: string; updated_at: string; pinned?: boolean };

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
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    if (dropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [dropdownOpen]);

  function submitRename() {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== c.title) onRename(c.id, trimmed);
    setRenaming(false);
  }

  return (
    <div className="relative group/item">
      {renaming ? (
        <div className="flex items-center gap-2 px-4 py-2">
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-foreground-muted" />
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={submitRename}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitRename();
              if (e.key === "Escape") { setRenaming(false); setRenameValue(c.title); }
            }}
            className="flex-1 min-w-0 text-sm bg-background-tertiary text-foreground px-1 py-0.5 outline-none border border-border"
          />
        </div>
      ) : (
        <a
          href={`/chat/${c.id}`}
          className={`flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
            active
              ? "bg-background-tertiary text-foreground"
              : "text-foreground-secondary hover:bg-background-tertiary hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5 shrink-0 text-foreground-muted" />
          <span className="truncate flex-1">{c.title}</span>
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setDropdownOpen((v) => !v);
            }}
            className="opacity-0 group-hover/item:opacity-100 shrink-0 p-0.5 hover:bg-background-secondary rounded transition-opacity"
            aria-label="Chat options"
          >
            <MoreHorizontal className="w-3.5 h-3.5 text-foreground-muted" />
          </button>
        </a>
      )}

      {dropdownOpen && (
        <div
          ref={dropdownRef}
          className="absolute right-2 top-full z-50 mt-0.5 w-40 bg-background-secondary border border-border shadow-lg py-1"
        >
          <button
            onClick={() => { onPin(c.id, !c.pinned); setDropdownOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
          >
            {c.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
            {c.pinned ? "Unpin" : "Pin"}
          </button>
          <button
            onClick={() => { setRenaming(true); setRenameValue(c.title); setDropdownOpen(false); }}
            className="flex items-center gap-2 w-full px-3 py-2 text-sm text-foreground-secondary hover:bg-background-tertiary hover:text-foreground transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
          <button
            onClick={() => { onDelete(c.id); setDropdownOpen(false); }}
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
  onToggle,
}: {
  conversations: Conversation[];
  user: SupabaseUser;
  onToggle?: () => void;
}) {
  const plan = (user.user_metadata?.plan ?? "free").toLowerCase();
  const isPro = plan === "pro" || plan === "team";
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [conversations, setConversations] = useState(initialConversations);

  useEffect(() => {
    setConversations(initialConversations);
  }, [initialConversations]);
  const groups = groupByDate(conversations);
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

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/auth/login");
  }

  const handleRename = useCallback(async (id: string, newTitle: string) => {
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, title: newTitle } : c))
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

  const handleDelete = useCallback(async (id: string) => {
    setConversations((prev) => prev.filter((c) => c.id !== id));
    await fetch(`/api/conversations/${id}`, { method: "DELETE" });
    if (pathname === `/chat/${id}`) router.push("/chat");
  }, [pathname, router]);

  return (
    <>
      <aside className="w-64 shrink-0 flex flex-col border-r border-border bg-background-secondary h-full">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-border">
          <a href="/chat" className="flex items-center gap-2">
            <img src="/logo-light.svg" alt="Rofiant" className="h-5 w-auto" />
          </a>
          <div className="flex items-center gap-1">
            <a
              href="/chat"
              className="flex items-center justify-center w-8 h-8 hover:bg-background-tertiary transition-colors"
              title="New chat"
            >
              <SquarePen className="w-4 h-4 text-foreground-muted" />
            </a>
            {onToggle && (
              <button
                onClick={onToggle}
                className="flex items-center justify-center w-8 h-8 hover:bg-background-tertiary transition-colors"
                title="Close sidebar"
              >
                <PanelLeftClose className="w-4 h-4 text-foreground-muted" />
              </button>
            )}
          </div>
        </div>

        {/* Conversation list */}
        <nav className="flex-1 overflow-y-auto py-2">
          {Object.entries(groups).map(([label, items]) => {
            if (!items.length) return null;
            return (
              <div key={label} className="mb-2">
                <div className="px-4 py-1 text-xs text-foreground-muted font-medium uppercase tracking-wider">
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
          {conversations.length === 0 && (
            <p className="px-4 py-3 text-xs text-foreground-muted">
              No conversations yet
            </p>
          )}
        </nav>

        {/* Footer */}
        <div
          className="border-t border-border px-3 py-3 relative"
          ref={menuRef}
        >
          {menuOpen && (
            <div className="absolute bottom-full left-3 right-3 mb-1 bg-background-secondary border border-border shadow-lg py-1">
              <button
                onClick={() => { setSettingsOpen(true); setMenuOpen(false); }}
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
                  href="/solutions"
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
            onClick={() => setMenuOpen((v) => !v)}
            className="flex items-center gap-2 w-full px-2 py-2 hover:bg-background-tertiary transition-colors group"
          >
            <User className="w-4 h-4 text-foreground-muted shrink-0" />
            <span className="flex-1 text-sm text-foreground-secondary text-left">
              My account
            </span>
            <ChevronUp
              className={`w-3.5 h-3.5 text-foreground-muted transition-transform ${menuOpen ? "rotate-180" : ""}`}
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
