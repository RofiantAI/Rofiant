import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_SHORTCUTS, type ShortcutBindings, type ShortcutId } from "@/lib/shortcuts";

type WorkspaceTab = "files" | "terminal" | "agent" | "cloud";
type Theme = "system" | "light" | "dark";
type FontSize = "small" | "medium" | "large";
type Density = "comfortable" | "compact";
type ChatWidth = "narrow" | "wide";
export type ToolApprovalPolicy = "risky" | "always" | "automatic";

export const FONT_SIZE_PX: Record<FontSize, number> = { small: 14, medium: 16, large: 18 };

// Runner caps a single agent run at this many model turns; the backend
// clamps whatever is sent to the same range.
export const MAX_STEPS_RANGE = { min: 1, max: 16 } as const;

interface UIState {
  activeConversationId: string | null;
  workspaceTab: WorkspaceTab;
  workspacePanelOpen: boolean;
  sidebarOpen: boolean;
  sidebarWidth: number;
  workspacePanelWidth: number;
  theme: Theme;
  selectedModel: string;
  fontSize: FontSize;
  density: Density;
  chatWidth: ChatWidth;
  showTimestamps: boolean;
  reduceMotion: boolean;
  autoSendOnDictation: boolean;
  autoOpenPanelOnTool: boolean;
  clipboardAutoFill: boolean;
  confirmBeforeDelete: boolean;
  spellCheck: boolean;
  wrapCodeBlocks: boolean;
  notificationSound: boolean;
  defaultNotifications: boolean;
  maxSteps: number;
  maxRunMinutes: number;
  toolApprovalPolicy: ToolApprovalPolicy;
  autoCheckUpdates: boolean;
  shortcuts: ShortcutBindings;
  botGalleryOpen: boolean;
  botGalleryMode: "solo" | "group";
  setBotGalleryOpen: (open: boolean) => void;
  setBotGalleryMode: (mode: "solo" | "group") => void;
  setFontSize: (size: FontSize) => void;
  setDensity: (density: Density) => void;
  setChatWidth: (width: ChatWidth) => void;
  setShowTimestamps: (value: boolean) => void;
  setReduceMotion: (value: boolean) => void;
  setAutoSendOnDictation: (value: boolean) => void;
  setAutoOpenPanelOnTool: (value: boolean) => void;
  setClipboardAutoFill: (value: boolean) => void;
  setConfirmBeforeDelete: (value: boolean) => void;
  setSpellCheck: (value: boolean) => void;
  setWrapCodeBlocks: (value: boolean) => void;
  setNotificationSound: (value: boolean) => void;
  setDefaultNotifications: (value: boolean) => void;
  setMaxSteps: (steps: number) => void;
  setMaxRunMinutes: (minutes: number) => void;
  setToolApprovalPolicy: (policy: ToolApprovalPolicy) => void;
  setAutoCheckUpdates: (value: boolean) => void;
  setShortcut: (id: ShortcutId, binding: string) => void;
  resetShortcuts: () => void;
  setWorkspaceTab: (tab: WorkspaceTab) => void;
  toggleWorkspacePanel: () => void;
  setWorkspacePanelOpen: (open: boolean) => void;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setWorkspacePanelWidth: (width: number) => void;
  setTheme: (theme: Theme) => void;
  setSelectedModel: (model: string) => void;
  selectConversation: (id: string) => void;
  clearActiveConversation: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      activeConversationId: null,
      workspaceTab: "agent",
      workspacePanelOpen: false,
      sidebarOpen: true,
      sidebarWidth: 340,
      workspacePanelWidth: 380,
      theme: "dark",
      selectedModel: "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
      fontSize: "medium",
      density: "comfortable",
      chatWidth: "narrow",
      showTimestamps: false,
      reduceMotion: false,
      autoSendOnDictation: false,
      autoOpenPanelOnTool: false,
      clipboardAutoFill: true,
      confirmBeforeDelete: true,
      spellCheck: true,
      wrapCodeBlocks: false,
      notificationSound: true,
      defaultNotifications: true,
      maxSteps: 4,
      maxRunMinutes: 10,
      toolApprovalPolicy: "risky",
      autoCheckUpdates: true,
      shortcuts: { ...DEFAULT_SHORTCUTS },
      botGalleryOpen: false,
      botGalleryMode: "solo",
      setBotGalleryOpen: (botGalleryOpen) => set({ botGalleryOpen }),
      setBotGalleryMode: (botGalleryMode) => set({ botGalleryMode }),
      setFontSize: (fontSize) => set({ fontSize }),
      setDensity: (density) => set({ density }),
      setChatWidth: (chatWidth) => set({ chatWidth }),
      setShowTimestamps: (showTimestamps) => set({ showTimestamps }),
      setReduceMotion: (reduceMotion) => set({ reduceMotion }),
      setAutoSendOnDictation: (autoSendOnDictation) => set({ autoSendOnDictation }),
      setAutoOpenPanelOnTool: (autoOpenPanelOnTool) => set({ autoOpenPanelOnTool }),
      setClipboardAutoFill: (clipboardAutoFill) => set({ clipboardAutoFill }),
      setConfirmBeforeDelete: (confirmBeforeDelete) => set({ confirmBeforeDelete }),
      setSpellCheck: (spellCheck) => set({ spellCheck }),
      setWrapCodeBlocks: (wrapCodeBlocks) => set({ wrapCodeBlocks }),
      setNotificationSound: (notificationSound) => set({ notificationSound }),
      setDefaultNotifications: (defaultNotifications) => set({ defaultNotifications }),
      setMaxSteps: (steps) =>
        set({ maxSteps: Math.min(MAX_STEPS_RANGE.max, Math.max(MAX_STEPS_RANGE.min, Math.round(steps))) }),
      setMaxRunMinutes: (minutes) => set({ maxRunMinutes: Math.min(30, Math.max(1, Math.round(minutes))) }),
      setToolApprovalPolicy: (toolApprovalPolicy) => set({ toolApprovalPolicy }),
      setAutoCheckUpdates: (autoCheckUpdates) => set({ autoCheckUpdates }),
      setShortcut: (id, binding) => set((state) => ({ shortcuts: { ...state.shortcuts, [id]: binding } })),
      resetShortcuts: () => set({ shortcuts: { ...DEFAULT_SHORTCUTS } }),
      setWorkspaceTab: (tab) => set({ workspaceTab: tab }),
      toggleWorkspacePanel: () => set((s) => ({ workspacePanelOpen: !s.workspacePanelOpen })),
      setWorkspacePanelOpen: (workspacePanelOpen) => set({ workspacePanelOpen }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
      setSidebarWidth: (width) => set({ sidebarWidth: width }),
      setWorkspacePanelWidth: (width) => set({ workspacePanelWidth: width }),
      setTheme: (theme) => set({ theme }),
      setSelectedModel: (model) => set({ selectedModel: model }),
      selectConversation: (id) => set({ activeConversationId: id }),
      clearActiveConversation: () => set({ activeConversationId: null }),
    }),
    {
      name: "ui-prefs",
      merge: (persisted, current) => {
        const saved = persisted as Partial<UIState>;
        return {
          ...current,
          ...saved,
          shortcuts: { ...DEFAULT_SHORTCUTS, ...saved.shortcuts },
        };
      },
      // Only persist layout preferences, never the active conversation,
      // that's per-session and already cleared on account switch.
      partialize: (s) => ({
        workspaceTab: s.workspaceTab,
        workspacePanelOpen: s.workspacePanelOpen,
        sidebarOpen: s.sidebarOpen,
        sidebarWidth: s.sidebarWidth,
        workspacePanelWidth: s.workspacePanelWidth,
        theme: s.theme,
        selectedModel: s.selectedModel,
        fontSize: s.fontSize,
        density: s.density,
        chatWidth: s.chatWidth,
        showTimestamps: s.showTimestamps,
        reduceMotion: s.reduceMotion,
        autoSendOnDictation: s.autoSendOnDictation,
        autoOpenPanelOnTool: s.autoOpenPanelOnTool,
        clipboardAutoFill: s.clipboardAutoFill,
        confirmBeforeDelete: s.confirmBeforeDelete,
        spellCheck: s.spellCheck,
        wrapCodeBlocks: s.wrapCodeBlocks,
        notificationSound: s.notificationSound,
        defaultNotifications: s.defaultNotifications,
        maxSteps: s.maxSteps,
        maxRunMinutes: s.maxRunMinutes,
        toolApprovalPolicy: s.toolApprovalPolicy,
        autoCheckUpdates: s.autoCheckUpdates,
        shortcuts: s.shortcuts,
      }),
    },
  ),
);
