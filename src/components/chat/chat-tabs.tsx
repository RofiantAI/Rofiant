"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { X, Plus, MessageSquare } from "lucide-react";
import { useChatTabs } from "@/contexts/chat-tabs-context";

type Conversation = {
  id: string;
  title: string;
};

type Tab = {
  id: string | null; // null = draft "new chat" tab, not yet a real conversation
  title: string;
};

const STORAGE_KEY = "chat-open-tabs";

function loadTabs(): Tab[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as Tab[]) : [];
  } catch {
    return [];
  }
}

function saveTabs(tabs: Tab[]) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tabs));
  } catch {
    // ignore storage failures (private browsing, quota, etc.)
  }
}

export function ChatTabs({ conversations }: { conversations: Conversation[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useParams<{ id?: string }>();
  const activeId = params?.id ?? null;
  const { bumpDraft } = useChatTabs();

  const [tabs, setTabs] = useState<Tab[]>([]);
  const lastActiveKey = useRef<string>("new");

  useEffect(() => {
    // localStorage is unavailable during SSR, so tabs start empty (matching
    // the server render) and hydrate from storage right after mount.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTabs(loadTabs());
  }, []);

  useEffect(() => {
    const key = activeId ?? "new";
    setTabs((prev) => {
      const exists = prev.some((t) => (t.id ?? "new") === key);
      let next = prev;

      if (!exists) {
        if (activeId && lastActiveKey.current === "new") {
          // draft tab just became a real conversation: upgrade it in place
          const match = conversations.find((c) => c.id === activeId);
          next = prev.map((t) =>
            t.id === null ? { id: activeId, title: match?.title ?? "New chat" } : t
          );
          if (!next.some((t) => t.id === activeId)) {
            next = [...next, { id: activeId, title: match?.title ?? "New chat" }];
          }
        } else {
          const match = activeId ? conversations.find((c) => c.id === activeId) : undefined;
          next = [...prev, { id: activeId, title: activeId ? match?.title ?? "Chat" : "New chat" }];
        }
      }

      lastActiveKey.current = key;
      saveTabs(next);
      return next;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, pathname]);

  // keep titles fresh as conversations load/rename
  useEffect(() => {
    // Bundled with the saveTabs localStorage write below (a real external-
    // system side effect), so this stays in an effect rather than render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTabs((prev) => {
      let changed = false;
      const next = prev.map((t) => {
        if (!t.id) return t;
        const match = conversations.find((c) => c.id === t.id);
        if (match && match.title !== t.title) {
          changed = true;
          return { ...t, title: match.title };
        }
        return t;
      });
      if (!changed) return prev;
      saveTabs(next);
      return next;
    });
  }, [conversations]);

  function openTab(tab: Tab) {
    router.push(tab.id ? `/chat/${tab.id}` : "/chat");
  }

  function closeTab(tab: Tab, e: React.MouseEvent) {
    e.stopPropagation();
    let navigateTo: string | null = null;
    setTabs((prev) => {
      const idx = prev.findIndex((t) => (t.id ?? "new") === (tab.id ?? "new"));
      const next = prev.filter((t) => (t.id ?? "new") !== (tab.id ?? "new"));
      saveTabs(next);

      const wasActive = (activeId ?? "new") === (tab.id ?? "new");
      if (wasActive) {
        const fallback = next[idx - 1] ?? next[idx] ?? next[next.length - 1];
        navigateTo = fallback ? (fallback.id ? `/chat/${fallback.id}` : "/chat") : "/chat";
      }
      return next;
    });
    if (navigateTo) router.push(navigateTo);
  }

  function handleNew() {
    if (activeId === null) {
      // already sitting on the draft tab — reset it instead of a no-op navigation
      bumpDraft();
      return;
    }
    router.push("/chat");
  }

  if (tabs.length === 0) return null;

  return (
    <div className="flex items-center h-11 shrink-0 border-b border-border bg-background pr-2">
      <div className="flex items-center h-full overflow-x-auto min-w-0 px-1 gap-0.5">
        {tabs.map((tab) => {
          const isActive = (activeId ?? "new") === (tab.id ?? "new");
          return (
            <button
              key={tab.id ?? "new"}
              type="button"
              onClick={() => openTab(tab)}
              className={`group relative flex items-center gap-1.5 h-7 pl-2.5 pr-1.5 text-[13px] rounded-md max-w-[200px] shrink-0 transition-colors my-auto cursor-pointer ${
                isActive
                  ? "bg-background-tertiary text-foreground"
                  : "text-foreground-secondary hover:bg-background-tertiary/50 hover:text-foreground"
              }`}
            >
              <MessageSquare className="w-3 h-3 shrink-0 text-foreground-muted" />
              <span className="truncate">{tab.title}</span>
              <span
                role="button"
                tabIndex={-1}
                onClick={(e) => closeTab(tab, e)}
                className="shrink-0 opacity-0 group-hover:opacity-100 rounded p-0.5 hover:bg-background-tertiary transition-opacity"
              >
                <X className="w-3 h-3" />
              </span>
            </button>
          );
        })}
        <button
          type="button"
          onClick={handleNew}
          title="New chat tab"
          className="flex items-center justify-center w-7 h-7 rounded-md shrink-0 text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
