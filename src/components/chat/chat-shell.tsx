"use client";

import { useState } from "react";
import { ChatSidebar } from "./sidebar";
import { ChatShellContext } from "@/contexts/chat-shell-context";
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

  return (
    <ChatShellContext.Provider
      value={{
        sidebarOpen: open,
        openSidebar: () => setOpen(true),
        closeSidebar: () => setOpen(false),
      }}
    >
      <div className="flex h-screen overflow-hidden bg-background">
        <div
          className="shrink-0 overflow-hidden"
          style={{
            width: open ? 256 : 0,
            transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          <ChatSidebar conversations={conversations} user={user} />
        </div>

        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {children}
        </main>
      </div>
    </ChatShellContext.Provider>
  );
}
