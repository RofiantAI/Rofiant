"use client";

import { createContext, useContext } from "react";

type ChatShellContextValue = {
  sidebarOpen: boolean;
  openSidebar: () => void;
  closeSidebar: () => void;
};

export const ChatShellContext = createContext<ChatShellContextValue>({
  sidebarOpen: true,
  openSidebar: () => {},
  closeSidebar: () => {},
});

export function useChatShell() {
  return useContext(ChatShellContext);
}
