"use client";

import { CHAT_EMPTY } from "@/lib/chat-copy";

export function ChatEmptyState() {
  return (
    <h1 className="text-xl font-medium text-[#6b6b67] tracking-tight text-center">
      {CHAT_EMPTY.title}
    </h1>
  );
}
