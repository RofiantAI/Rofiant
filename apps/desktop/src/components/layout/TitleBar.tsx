import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Expand, PanelLeft, PanelRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useConversations } from "@/hooks/useConversations";
import { ConversationAvatar } from "@/components/personas/ConversationAvatar";
import { BotSettingsPanel } from "@/components/personas/BotSettingsPanel";
import { SIDEBAR_COLLAPSED_WIDTH } from "@/components/sidebar/Sidebar";
import { NewChatMenu } from "@/components/sidebar/NewChatMenu";

const appWindow = getCurrentWindow();

const DOTS = [
  { key: "close", color: "#ff5f57", inactiveColor: "#3a3a3a", Icon: X, action: () => appWindow.close() },
  { key: "minimize", color: "#febc2e", inactiveColor: "#3a3a3a", Icon: Minus, action: () => appWindow.minimize() },
  { key: "maximize", color: "#28c840", inactiveColor: "#3a3a3a", Icon: Expand, action: () => appWindow.toggleMaximize() },
] as const;

export function TitleBar() {
  const [focused, setFocused] = useState(true);
  const [botSettingsOpen, setBotSettingsOpen] = useState(false);
  const { pathname } = useLocation();
  const isChatPage = pathname === "/";
  const isSettingsPage = pathname === "/settings";

  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const workspacePanelOpen = useUIStore((s) => s.workspacePanelOpen);
  const toggleWorkspacePanel = useUIStore((s) => s.toggleWorkspacePanel);

  const { data: conversations = [] } = useConversations();
  const activeConversation = conversations.find((c) => c.id === activeConversationId);

  useEffect(() => {
    appWindow.isFocused().then(setFocused);
    const unlisten = appWindow.onFocusChanged(({ payload }) => setFocused(payload));
    return () => {
      unlisten.then((f) => f());
    };
  }, []);

  return (
    <div data-tauri-drag-region className="flex h-11 w-full shrink-0 items-stretch bg-background">
      <div
        data-tauri-drag-region
        className={cn(
          "flex shrink-0 flex-row items-center gap-3 px-3 justify-start",
          (isChatPage || isSettingsPage) && "border-r border-border bg-sidebar",
        )}
        style={
          isChatPage
            ? { width: sidebarOpen ? sidebarWidth : SIDEBAR_COLLAPSED_WIDTH }
            : isSettingsPage
              ? { width: "14rem" }
              : undefined
        }
      >
        <div className="group flex items-center gap-2">
          {DOTS.map(({ key, color, inactiveColor, Icon, action }) => (
            <button
              key={key}
              aria-label={key}
              onClick={action}
              className="flex h-3.5 w-3.5 items-center justify-center rounded-full"
              style={{ backgroundColor: focused ? color : inactiveColor }}
            >
              <Icon
                className={cn(
                  "h-2 w-2 text-black/60 opacity-0 transition-opacity",
                  focused && "group-hover:opacity-100",
                )}
                strokeWidth={3}
              />
            </button>
          ))}
        </div>

        {isChatPage && sidebarOpen && (
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {isChatPage && sidebarOpen && (
          <NewChatMenu
            className="ml-auto"
            buttonClassName="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-90 disabled:opacity-50"
          />
        )}
      </div>

      {isChatPage && (
        <div
          data-tauri-drag-region
          className="flex min-w-0 flex-1 items-center justify-between border-b border-border px-4"
        >
          <div className="flex min-w-0 items-center gap-3">
            {activeConversation && (
              <button
                onClick={() => setBotSettingsOpen(true)}
                className="flex min-w-0 items-center gap-3 rounded-md px-1 py-0.5 transition-colors hover:bg-accent"
              >
                <ConversationAvatar conversation={activeConversation} size={26} />
                <span className="truncate text-[15px] font-semibold tracking-tight text-foreground">
                  {activeConversation.title}
                </span>
              </button>
            )}
          </div>
          <button
            onClick={toggleWorkspacePanel}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              workspacePanelOpen && "bg-accent text-foreground",
            )}
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      )}

      {botSettingsOpen && activeConversation && (
        <BotSettingsPanel conversation={activeConversation} onClose={() => setBotSettingsOpen(false)} />
      )}
    </div>
  );
}
