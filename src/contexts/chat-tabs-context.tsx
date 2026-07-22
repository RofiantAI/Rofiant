"use client";

import { createContext, useContext } from "react";

type ChatTabsContextValue = {
  draftVersion: number;
  bumpDraft: () => void;
};

export const ChatTabsContext = createContext<ChatTabsContextValue>({
  draftVersion: 0,
  bumpDraft: () => {},
});

export function useChatTabs() {
  return useContext(ChatTabsContext);
}
