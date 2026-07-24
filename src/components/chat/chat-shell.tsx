"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatSidebar } from "./sidebar";
import { ChatTabs } from "./chat-tabs";
import { BetaBanner } from "./beta-banner";
import { ChatShellContext } from "@/contexts/chat-shell-context";
import { ChatTabsContext } from "@/contexts/chat-tabs-context";
import type { User } from "@supabase/supabase-js";

type Conversation = {
  id: string;
  title: string;
  updated_at: string;
  pinned?: boolean;
};

export function ChatShell({
  conversations,
  user,
  children,
}: {
  conversations: Conversation[];
  user: User;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  const [draftVersion, setDraftVersion] = useState(0);
  const bumpDraft = useCallback(() => setDraftVersion((v) => v + 1), []);
  const pathname = usePathname();
  const isSettings = pathname?.startsWith("/chat/settings");

  return (
    <ChatShellContext.Provider
      value={{
        sidebarOpen: open,
        openSidebar: () => setOpen(true),
        closeSidebar: () => setOpen(false),
      }}
    >
      <ChatTabsContext.Provider value={{ draftVersion, bumpDraft }}>
        <div className="flex h-screen overflow-hidden bg-background">
          {!isSettings && (
            <div
              className="shrink-0 overflow-hidden"
              style={{
                width: open ? 272 : 0,
                transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
              }}
            >
              <ChatSidebar conversations={conversations} user={user} />
            </div>
          )}

          <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
            {!isSettings && <BetaBanner />}
            {!isSettings && <ChatTabs conversations={conversations} />}
            {children}
          </main>
        </div>
      </ChatTabsContext.Provider>
    </ChatShellContext.Provider>
  );
}
