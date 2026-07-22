"use client";

import { ChatWindow } from "@/components/chat/chat-window";
import { useChatTabs } from "@/contexts/chat-tabs-context";

export default function ChatPage() {
  const { draftVersion } = useChatTabs();
  return <ChatWindow key={draftVersion} />;
}
