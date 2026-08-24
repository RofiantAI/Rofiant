import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { X, Minus, Square, PanelLeft, PanelRight, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";
import { useConversations } from "@/hooks/useConversations";
import { ConversationAvatar } from "@/components/personas/ConversationAvatar";
import { BotSettingsPanel } from "@/components/personas/BotSettingsPanel";
import { SIDEBAR_COLLAPSED_WIDTH } from "@/components/sidebar/Sidebar";
import { NewChatMenu } from "@/components/sidebar/NewChatMenu";

const appWindow = getCurrentWindow();

const WINDOW_CONTROLS = [
  { key: "minimize", Icon: Minus, action: () => appWindow.minimize(), danger: false },
  { key: "maximize", Icon: Square, action: () => appWindow.toggleMaximize(), danger: false },
  { key: "close", Icon: X, action: () => appWindow.close(), danger: true },
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
    <div data-tauri-drag-region className="relative flex h-11 w-full shrink-0 items-stretch bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute bottom-0 right-0 border-b border-border transition-[left] duration-200 ease-out"
        style={{
          left: isChatPage
            ? sidebarOpen
              ? sidebarWidth
              : SIDEBAR_COLLAPSED_WIDTH
            : isSettingsPage
              ? "14rem"
              : 0,
        }}
      />
      <div
        data-tauri-drag-region
        className={cn(
          "flex shrink-0 flex-row items-center justify-start gap-3 px-3 transition-[width] duration-200 ease-out",
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
        {isChatPage && (
          <button
            onClick={toggleSidebar}
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
            className="flex h-6 w-6 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <PanelLeft className="h-3.5 w-3.5" />
          </button>
        )}

        {isSettingsPage && (
          <Link
            to="/"
            aria-label="Back"
            className="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
        )}
        
        {isChatPage && (
          <NewChatMenu
            className="ml-auto"
            buttonClassName="flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground active:scale-90 disabled:opacity-50"
            placement={sidebarOpen ? "below" : "below-left"}
          />
        )}
      </div>

      {isChatPage && (
        <div
          data-tauri-drag-region
          className="flex min-w-0 flex-1 items-center justify-between px-4"
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
            aria-label="Workspace panel"
            aria-pressed={workspacePanelOpen}
            className={cn(
              "flex h-7 w-7 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground",
              workspacePanelOpen && "bg-accent text-foreground",
            )}
          >
            <PanelRight className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="ml-auto flex shrink-0 items-stretch">
        {WINDOW_CONTROLS.map(({ key, Icon, action, danger }) => (
          <button
            key={key}
            aria-label={key}
            onClick={action}
            className={cn(
              "flex h-11 w-12 items-center justify-center transition-colors",
              focused ? "text-foreground/80" : "text-muted-foreground",
              danger ? "hover:bg-destructive hover:text-destructive-foreground" : "hover:bg-accent hover:text-foreground",
            )}
          >
            <Icon className={key === "close" ? "h-4 w-4" : "h-3.5 w-3.5"} strokeWidth={1.25} />
          </button>
        ))}
      </div>

      {botSettingsOpen && activeConversation && (
        <BotSettingsPanel conversation={activeConversation} onClose={() => setBotSettingsOpen(false)} />
      )}
    </div>
  );
}
