import { useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useConversations } from "@/hooks/useConversations";
import { FOCUS_COMPOSER_EVENT, matchesShortcut, type ShortcutId } from "@/lib/shortcuts";
import { useUIStore } from "@/stores/useUIStore";

export function GlobalShortcuts() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: conversations = [] } = useConversations();
  const shortcuts = useUIStore((s) => s.shortcuts);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      const entry = (Object.entries(shortcuts) as [ShortcutId, string][]).find(([, binding]) =>
        binding !== shortcuts.sendMessage && matchesShortcut(event, binding),
      );
      if (!entry) return;
      event.preventDefault();
      const [action] = entry;
      const state = useUIStore.getState();

      if (action === "newChat") {
        navigate("/");
        state.setBotGalleryMode("solo");
        state.setBotGalleryOpen(true);
      } else if (action === "openSettings") {
        navigate("/settings");
      } else if (action === "focusComposer") {
        if (location.pathname !== "/") navigate("/");
        window.setTimeout(() => window.dispatchEvent(new Event(FOCUS_COMPOSER_EVENT)), 0);
      } else if (action === "toggleSidebar") {
        if (location.pathname === "/") state.toggleSidebar();
      } else if (action === "toggleWorkspace") {
        state.toggleWorkspacePanel();
      } else if (action === "previousChat" || action === "nextChat") {
        if (conversations.length === 0) return;
        const current = conversations.findIndex((c) => c.id === state.activeConversationId);
        const direction = action === "nextChat" ? 1 : -1;
        const index = current < 0 ? 0 : (current + direction + conversations.length) % conversations.length;
        state.selectConversation(conversations[index].id);
        navigate("/");
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [conversations, location.pathname, navigate, shortcuts]);

  return null;
}
