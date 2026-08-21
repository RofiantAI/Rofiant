import { Sidebar } from "@/components/sidebar/Sidebar";
import { ChatView } from "@/components/chat/ChatView";
import { WorkspacePanel } from "@/components/agents/WorkspacePanel";
import { BotGallery } from "@/components/personas/BotGallery";
import { useUIStore } from "@/stores/useUIStore";

export function ChatPage() {
  const workspacePanelOpen = useUIStore((s) => s.workspacePanelOpen);

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="min-w-0 flex-1">
        <ChatView />
      </div>
      {workspacePanelOpen && <WorkspacePanel />}
      <BotGallery />
    </div>
  );
}
