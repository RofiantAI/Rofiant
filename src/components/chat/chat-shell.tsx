"use client";

import { useCallback, useState } from "react";
import { usePathname } from "next/navigation";
import { ChatSidebar } from "./sidebar";
import { ChatTabs } from "./chat-tabs";
import { BetaBanner } from "./beta-banner";
import { ChatShellContext } from "@/contexts/chat-shell-context";
import { ChatTabsContext } from "@/contexts/chat-tabs-context";
import { useIsDesktopViewport } from "@/lib/hooks/use-is-desktop-viewport";
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
  const [draftVersion, setDraftVersion] = useState(0);
  const bumpDraft = useCallback(() => setDraftVersion((v) => v + 1), []);
  const pathname = usePathname();
  const isSettings = pathname?.startsWith("/chat/settings");

  // Sidebar defaults open (tracks viewport via matchMedia — narrow screens
  // start collapsed so it doesn't push the chat pane down to near-nothing)
  // until the user manually toggles it, at which point their choice sticks.
  const isDesktopViewport = useIsDesktopViewport();
  const [manualOpen, setManualOpen] = useState<boolean | null>(null);
  const open = manualOpen ?? isDesktopViewport;

  return (
    <ChatShellContext.Provider
      value={{
        sidebarOpen: open,
        openSidebar: () => setManualOpen(true),
        closeSidebar: () => setManualOpen(false),
      }}
    >
      <ChatTabsContext.Provider value={{ draftVersion, bumpDraft }}>
        <div className="flex h-screen overflow-hidden bg-background">
          {!isSettings && open && (
            <div
              className="fixed inset-0 z-30 bg-black/50 md:hidden"
              onClick={() => setManualOpen(false)}
            />
          )}
          {!isSettings && (
            <div
              className="fixed inset-y-0 left-0 z-40 shrink-0 overflow-hidden md:relative md:z-auto"
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
