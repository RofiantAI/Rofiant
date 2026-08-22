import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FilesPanel } from "@/components/files/FilesPanel";
import { TerminalPanel } from "@/components/terminal/TerminalPanel";
import { AgentActivity } from "@/components/agents/AgentActivity";
// VM/Cloud Computer feature disabled for now -- see CloudPanel usage below.
// import { CloudPanel } from "@/components/machine/CloudPanel";
import { useUIStore } from "@/stores/useUIStore";
import { useHorizontalResize } from "@/hooks/useHorizontalResize";

export function WorkspacePanel() {
  const workspaceTab = useUIStore((s) => s.workspaceTab);
  const setWorkspaceTab = useUIStore((s) => s.setWorkspaceTab);
  const workspacePanelWidth = useUIStore((s) => s.workspacePanelWidth);
  const setWorkspacePanelWidth = useUIStore((s) => s.setWorkspacePanelWidth);

  const onResizeStart = useHorizontalResize({
    width: workspacePanelWidth,
    setWidth: setWorkspacePanelWidth,
    min: 300,
    max: 640,
    fromRight: true,
  });

  return (
    <Tabs
      value={workspaceTab}
      onValueChange={(v) => setWorkspaceTab(v as "files" | "terminal" | "agent")}
      className="workspace-panel relative flex h-full max-w-[55vw] shrink-0 animate-in slide-in-from-right flex-col border-l border-border bg-sidebar duration-200 ease-out"
      style={{ width: workspacePanelWidth }}
    >
      <div
        onMouseDown={onResizeStart}
        role="separator"
        aria-label="Resize workspace panel"
        className="absolute left-0 top-0 z-30 h-full w-1 cursor-col-resize hover:bg-ring/50"
      />
      <TabsList>
        <TabsTrigger value="agent">Agent Activity</TabsTrigger>
        <TabsTrigger value="files">Files</TabsTrigger>
        <TabsTrigger value="terminal">Terminal</TabsTrigger>
        {/* <TabsTrigger value="cloud">Cloud</TabsTrigger> */}
      </TabsList>
      <TabsContent value="agent">
        <AgentActivity />
      </TabsContent>
      <TabsContent value="files">
        <FilesPanel />
      </TabsContent>
      <TabsContent value="terminal">
        <TerminalPanel />
      </TabsContent>
      {/* <TabsContent value="cloud">
        <CloudPanel />
      </TabsContent> */}
    </Tabs>
  );
}
