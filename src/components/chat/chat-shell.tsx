"use client";

import { useState } from "react";
import { PanelLeftOpen } from "lucide-react";
import { ChatSidebar } from "./sidebar";
import type { User } from "@supabase/supabase-js";

type Conversation = { id: string; title: string; updated_at: string; pinned?: boolean };

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
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar wrapper — animates width */}
      <div
        className="shrink-0 overflow-hidden"
        style={{
          width: open ? 256 : 0,
          transition: "width 220ms cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <ChatSidebar
          conversations={conversations}
          user={user}
          onToggle={() => setOpen(false)}
        />
      </div>

      {/* Main content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {/* Reopen button — fades in when sidebar is closed */}
        <button
          onClick={() => setOpen(true)}
          className="absolute top-3 left-3 z-10 flex items-center justify-center w-7 h-7 text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
          title="Open sidebar"
          style={{
            opacity: open ? 0 : 1,
            pointerEvents: open ? "none" : "auto",
            transition: "opacity 180ms ease",
            transitionDelay: open ? "0ms" : "120ms",
          }}
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        {children}
      </main>
    </div>
  );
}
