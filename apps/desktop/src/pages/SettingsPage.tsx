import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { openUrl } from "@tauri-apps/plugin-opener";
import { readText } from "@tauri-apps/plugin-clipboard-manager";
import { check, type Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import {
  LogOut,
  SlidersHorizontal,
  Plug,
  Palette,
  Keyboard,
  User,
  Database,
  Bot,
  // Cloud, -- VM/Cloud Computer feature disabled for now
} from "lucide-react";
// VM/Cloud Computer feature disabled for now -- see NAV and the "cloud" section below.
// import { CloudComputerStatus } from "@/components/machine/CloudComputerStatus";
// import { BotsList } from "@/components/machine/BotsList";
import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select } from "@/components/ui/select";
import { useProviderStatus, useAnthropicOAuth, useDeleteProviderKey } from "@/hooks/useProviderConnections";
import { CustomProviderModal } from "@/components/settings/CustomProviderModal";
import { useSkills, useInstallSkill, useDeleteSkill } from "@/hooks/useSkills";
import { useProfile, useUpdateProfile, useDeactivateAccount, useDeleteAccount } from "@/hooks/useAccount";
import { useAuthStore } from "@/stores/useAuthStore";
import { useUIStore, MAX_STEPS_RANGE } from "@/stores/useUIStore";
import { useConversations, useDeleteConversation } from "@/hooks/useConversations";
import { queryClient } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { CLAUDE_MODELS, FREE_MODELS } from "@/lib/models";
import { supabase } from "@/lib/supabase";
import {
  DEFAULT_SHORTCUTS,
  SHORTCUT_DEFINITIONS,
  bindingFromEvent,
  formatShortcut,
  type ShortcutId,
} from "@/lib/shortcuts";

// Anthropic's code is "<code>#<state>", both halves base64url.
const CODE_PATTERN = /^[\w-]+#[\w-]+$/;

type Section = "general" | "providers" | "agent" | "appearance" | "shortcuts" | "account" | "data";

// Grouped so the list reads as three kinds of thing — the app itself, the
// assistant behind it, and the user's own data — instead of seven equal rows.
const NAV_GROUPS: {
  label: string;
  items: { id: Section; label: string; icon: typeof SlidersHorizontal }[];
}[] = [
  {
    label: "App",
    items: [
      { id: "general", label: "General", icon: SlidersHorizontal },
      { id: "appearance", label: "Appearance", icon: Palette },
      { id: "shortcuts", label: "Shortcuts", icon: Keyboard },
    ],
  },
  {
    label: "Assistant",
    items: [
      { id: "providers", label: "Providers", icon: Plug },
      { id: "agent", label: "Agent", icon: Bot },
      // { id: "cloud", label: "Cloud Computer", icon: Cloud }, -- VM feature disabled for now
    ],
  },
  {
    label: "Your data",
    items: [
      { id: "account", label: "Account", icon: User },
      { id: "data", label: "Data", icon: Database },
    ],
  },
];

const NAV = NAV_GROUPS.flatMap((g) => g.items);

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-2 px-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {children}
    </h2>
  );
}

/** One labelled row with a control on the right. */
function Row({
  title,
  description,
  children,
  as = "div",
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  as?: "div" | "label";
}) {
  const Tag = as;
  return (
    <Tag className={cn("flex items-center justify-between gap-4 p-4", as === "label" && "cursor-pointer")}>
      <div className="min-w-0">
        <p className="text-sm text-foreground/90">{title}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </Tag>
  );
}

/** Modal confirmation for a destructive action, same focus-trap/Escape
 * pattern as FilesPanel's delete-file dialog. */
function ConfirmDialog({
  title,
  description,
  confirmLabel,
  pending,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  pending: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onKeyDown={(e) => {
        if (e.key === "Escape") onCancel();
        if (e.key !== "Tab") return;
        const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button"));
        const first = controls[0];
        const last = controls[controls.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last?.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first?.focus();
        }
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="confirm-dialog-title" className="w-80 rounded-xl border border-border bg-card p-4">
        <p id="confirm-dialog-title" className="text-sm font-medium text-foreground">{title}</p>
        <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="ghost" size="sm" autoFocus onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" size="sm" disabled={pending} onClick={onConfirm}>
            {pending && <Spinner className="h-4 w-4" />}
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

/** Segmented control: same options-as-buttons pattern as the theme picker. */
function Segmented<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div className="flex gap-1 rounded-lg bg-secondary p-1">
      {options.map((o) => (
        <button
          key={o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs transition-colors",
            value === o.value
              ? "bg-primary text-primary-foreground"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function ShortcutEditor() {
  const shortcuts = useUIStore((s) => s.shortcuts);
  const setShortcut = useUIStore((s) => s.setShortcut);
  const resetShortcuts = useUIStore((s) => s.resetShortcuts);
  const [recording, setRecording] = useState<ShortcutId | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!recording) return;
    const recordingId = recording;
    function capture(event: KeyboardEvent) {
      event.preventDefault();
      event.stopImmediatePropagation();
      if (event.key === "Escape") {
        setRecording(null);
        setError(null);
        return;
      }
      const binding = bindingFromEvent(event);
      if (!binding) {
        setError("Use Ctrl/Cmd, Alt, Shift, or a function key.");
        return;
      }
      if (binding === "Enter" && recordingId !== "sendMessage") {
        setError("Enter can only be assigned to Send message.");
        return;
      }
      const conflict = SHORTCUT_DEFINITIONS.find(
        ({ id }) => id !== recordingId && shortcuts[id] === binding,
      );
      if (conflict) {
        setError(`Already used by “${conflict.label}”.`);
        return;
      }
      setShortcut(recordingId, binding);
      setRecording(null);
      setError(null);
    }
    document.addEventListener("keydown", capture, true);
    return () => document.removeEventListener("keydown", capture, true);
  }, [recording, setShortcut, shortcuts]);

  return (
    <div className="space-y-3">
      <section className="divide-y divide-border rounded-lg border border-border bg-card">
        {SHORTCUT_DEFINITIONS.map(({ id, label }) => (
          <div key={id} className="flex items-center justify-between gap-4 p-4">
            <span className="text-sm text-foreground/90">{label}</span>
            <div className="flex items-center gap-2">
              {shortcuts[id] !== DEFAULT_SHORTCUTS[id] && (
                <button
                  onClick={() => setShortcut(id, DEFAULT_SHORTCUTS[id])}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  Reset
                </button>
              )}
              <button
                onClick={() => {
                  setRecording(id);
                  setError(null);
                }}
                className={cn(
                  "min-w-28 rounded-md border px-2 py-1 text-xs",
                  recording === id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border bg-secondary text-foreground",
                )}
              >
                {recording === id ? "Press shortcut…" : formatShortcut(shortcuts[id])}
              </button>
            </div>
          </div>
        ))}
      </section>
      <div className="flex min-h-8 items-center justify-between gap-3">
        <p className={cn("text-xs", error ? "text-destructive" : "text-muted-foreground")}>
          {error ?? "Select a shortcut, then press its new key combination. Escape cancels."}
        </p>
        <Button variant="outline" size="sm" onClick={resetShortcuts}>Reset all</Button>
      </div>
    </div>
  );
}

export function SettingsPage() {
  const location = useLocation();
  const [section, setSection] = useState<Section>(
    location.state?.section === "providers" ? "providers" : "general",
  );

  const { data: status } = useProviderStatus();
  const { data: skills } = useSkills();
  const installSkill = useInstallSkill();
  const deleteSkill = useDeleteSkill();
  const [skillUrl, setSkillUrl] = useState("");
  const anthropic = useAnthropicOAuth();
  const deleteOpenAIKey = useDeleteProviderKey("openai");
  const deleteGeminiKey = useDeleteProviderKey("gemini");
  const deleteCustomProvider = useDeleteProviderKey("custom");
  const [customProviderModalOpen, setCustomProviderModalOpen] = useState(false);
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const workspacePanelOpen = useUIStore((s) => s.workspacePanelOpen);
  const toggleWorkspacePanel = useUIStore((s) => s.toggleWorkspacePanel);
  const sidebarOpen = useUIStore((s) => s.sidebarOpen);
  const toggleSidebar = useUIStore((s) => s.toggleSidebar);
  const sidebarWidth = useUIStore((s) => s.sidebarWidth);
  const setSidebarWidth = useUIStore((s) => s.setSidebarWidth);
  const workspacePanelWidth = useUIStore((s) => s.workspacePanelWidth);
  const setWorkspacePanelWidth = useUIStore((s) => s.setWorkspacePanelWidth);
  const workspaceTab = useUIStore((s) => s.workspaceTab);
  const setWorkspaceTab = useUIStore((s) => s.setWorkspaceTab);
  const theme = useUIStore((s) => s.theme);
  const setTheme = useUIStore((s) => s.setTheme);
  const selectedModel = useUIStore((s) => s.selectedModel);
  const setSelectedModel = useUIStore((s) => s.setSelectedModel);
  const fontSize = useUIStore((s) => s.fontSize);
  const setFontSize = useUIStore((s) => s.setFontSize);
  const density = useUIStore((s) => s.density);
  const setDensity = useUIStore((s) => s.setDensity);
  const chatWidth = useUIStore((s) => s.chatWidth);
  const setChatWidth = useUIStore((s) => s.setChatWidth);
  const showTimestamps = useUIStore((s) => s.showTimestamps);
  const setShowTimestamps = useUIStore((s) => s.setShowTimestamps);
  const reduceMotion = useUIStore((s) => s.reduceMotion);
  const setReduceMotion = useUIStore((s) => s.setReduceMotion);
  const autoSendOnDictation = useUIStore((s) => s.autoSendOnDictation);
  const setAutoSendOnDictation = useUIStore((s) => s.setAutoSendOnDictation);
  const autoOpenPanelOnTool = useUIStore((s) => s.autoOpenPanelOnTool);
  const setAutoOpenPanelOnTool = useUIStore((s) => s.setAutoOpenPanelOnTool);
  const clipboardAutoFill = useUIStore((s) => s.clipboardAutoFill);
  const setClipboardAutoFill = useUIStore((s) => s.setClipboardAutoFill);
  const confirmBeforeDelete = useUIStore((s) => s.confirmBeforeDelete);
  const setConfirmBeforeDelete = useUIStore((s) => s.setConfirmBeforeDelete);
  const maxSteps = useUIStore((s) => s.maxSteps);
  const setMaxSteps = useUIStore((s) => s.setMaxSteps);
  const maxRunMinutes = useUIStore((s) => s.maxRunMinutes);
  const setMaxRunMinutes = useUIStore((s) => s.setMaxRunMinutes);
  const toolApprovalPolicy = useUIStore((s) => s.toolApprovalPolicy);
  const setToolApprovalPolicy = useUIStore((s) => s.setToolApprovalPolicy);
  const autoCheckUpdates = useUIStore((s) => s.autoCheckUpdates);
  const setAutoCheckUpdates = useUIStore((s) => s.setAutoCheckUpdates);
  const spellCheck = useUIStore((s) => s.spellCheck);
  const setSpellCheck = useUIStore((s) => s.setSpellCheck);
  const wrapCodeBlocks = useUIStore((s) => s.wrapCodeBlocks);
  const setWrapCodeBlocks = useUIStore((s) => s.setWrapCodeBlocks);
  const notificationSound = useUIStore((s) => s.notificationSound);
  const setNotificationSound = useUIStore((s) => s.setNotificationSound);
  const defaultNotifications = useUIStore((s) => s.defaultNotifications);
  const setDefaultNotifications = useUIStore((s) => s.setDefaultNotifications);

  const { data: conversations = [] } = useConversations();
  const deleteConversation = useDeleteConversation();
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [deleteAllError, setDeleteAllError] = useState(false);

  const { data: profile } = useProfile();
  const displayName = profile?.username || user?.email || "?";
  const updateProfile = useUpdateProfile();
  const deactivateAccount = useDeactivateAccount();
  const deleteAccount = useDeleteAccount();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const [nameInput, setNameInput] = useState("");
  const [confirmDeactivate, setConfirmDeactivate] = useState(false);
  const [confirmDeleteAccount, setConfirmDeleteAccount] = useState(false);

  useEffect(() => {
    if (profile?.username) setNameInput(profile.username);
  }, [profile?.username]);

  const [appVersion, setAppVersion] = useState("");
  const [updateStatus, setUpdateStatus] = useState<"idle" | "checking" | "current" | "available" | "error">(
    "idle",
  );
  const [availableUpdate, setAvailableUpdate] = useState<Update | null>(null);
  const [installingUpdate, setInstallingUpdate] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  useEffect(() => {
    getVersion().then(setAppVersion);
  }, []);

  async function handleCheckForUpdates() {
    setUpdateStatus("checking");
    setUpdateError(null);
    try {
      const update = await check();
      setAvailableUpdate(update);
      setUpdateStatus(update ? "available" : "current");
    } catch {
      setUpdateStatus("error");
    }
  }

  async function handleInstallUpdate() {
    if (!availableUpdate) return;
    setInstallingUpdate(true);
    setUpdateError(null);
    try {
      await availableUpdate.downloadAndInstall();
      await relaunch();
    } catch {
      setUpdateError("Couldn't install the update. Try again.");
      setInstallingUpdate(false);
    }
  }

  async function handleExportData() {
    const { data: messages, error } = await supabase
      .from("messages")
      .select("id,conversation_id,role,content,persona,created_at")
      .order("created_at");
    if (error) throw error;
    const exportedConversations = conversations.map(({ messages: _lastMessage, ...conversation }) => conversation);
    const blob = new Blob([JSON.stringify({ exported_at: new Date().toISOString(), conversations: exportedConversations, messages }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `kiro-export-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const [pastedCode, setPastedCode] = useState("");
  const [codeVerifier, setCodeVerifier] = useState<string | null>(null);

  // While waiting for the user to approve in the browser, auto-fill the
  // code from the clipboard as soon as the app window regains focus,
  // saves a manual paste on top of the unavoidable "click Copy code" step.
  useEffect(() => {
    if (!codeVerifier || !clipboardAutoFill) return;

    async function tryAutoFill() {
      const text = await readText().catch(() => null);
      if (text && CODE_PATTERN.test(text.trim())) {
        setPastedCode(text.trim());
      }
    }

    window.addEventListener("focus", tryAutoFill);
    return () => window.removeEventListener("focus", tryAutoFill);
  }, [codeVerifier, clipboardAutoFill]);

  async function handleConnectAnthropic() {
    const { authorize_url, code_verifier } = await anthropic.start.mutateAsync();
    setCodeVerifier(code_verifier);
    await openUrl(authorize_url);
  }

  async function handleSubmitCode() {
    if (!codeVerifier || !pastedCode.trim()) return;
    await anthropic.exchange.mutateAsync({ code: pastedCode.trim(), codeVerifier });
    setPastedCode("");
    setCodeVerifier(null);
  }

  function handleResetPreferences() {
    // Drop the persisted slice and reload. Every default lives in the store
    // initializer, so a fresh boot is the reset.
    useUIStore.persist.clearStorage();
    window.location.reload();
  }

  async function handleDeleteAllConversations() {
    setDeletingAll(true);
    setDeleteAllError(false);
    try {
      await Promise.all(conversations.map((c) => deleteConversation.mutateAsync(c.id)));
      setConfirmDeleteAll(false);
    } catch {
      setDeleteAllError(true);
    } finally {
      setDeletingAll(false);
    }
  }

  async function handleAvatarChange(file: File | undefined) {
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      alert("Please choose an image under 2MB.");
      return;
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    updateProfile.mutate({ avatar_url: dataUrl });
  }

  return (
    <div className="flex h-full w-full overflow-hidden bg-background text-foreground">
      <aside className="flex w-56 shrink-0 flex-col border-r border-border bg-sidebar">
        <nav className="flex-1 space-y-5 overflow-y-auto px-3 pb-3 pt-1">
          {NAV_GROUPS.map((group) => (
            <div key={group.label}>
              <p className="px-2.5 pb-1.5 text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70">
                {group.label}
              </p>
              <div className="space-y-0.5">
                {group.items.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setSection(id)}
                    aria-current={section === id ? "page" : undefined}
                    className={cn(
                      "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm transition-colors",
                      section === id
                        ? "bg-accent font-medium text-foreground"
                        : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn("h-4 w-4 shrink-0", section === id && "text-primary")}
                    />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </nav>

        <button
          onClick={() => setSection("account")}
          className="flex items-center gap-2.5 border-t border-border px-4 py-3 text-left transition-colors hover:bg-accent/60"
        >
          <div className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-sm font-semibold text-foreground">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} className="h-full w-full object-cover" />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <span className="min-w-0 truncate text-sm text-foreground/90">{displayName}</span>
        </button>
      </aside>

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-xl space-y-6 p-8">
          <h1 className="text-lg font-semibold">
            {NAV.find((n) => n.id === section)?.label}
          </h1>

          {section === "general" && (
            <div className="space-y-6">
              <div>
                <SectionHeading>Message input</SectionHeading>
                <section className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row
                    as="label"
                    title="Send dictation automatically"
                    description="Sends as soon as the mic stops, without a second click."
                  >
                    <Checkbox
                      checked={autoSendOnDictation}
                      onChange={() => setAutoSendOnDictation(!autoSendOnDictation)}
                    />
                  </Row>
                  <Row
                    as="label"
                    title="Spellcheck"
                    description="Underline misspelled words while typing a message."
                  >
                    <Checkbox checked={spellCheck} onChange={() => setSpellCheck(!spellCheck)} />
                  </Row>
                </section>
              </div>

              <div>
                <SectionHeading>Model</SectionHeading>
                <section className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row title="Default model" description="Used for every new message until changed.">
                    <Select value={selectedModel} onChange={setSelectedModel}>
                      {[
                        ...(status?.anthropic_oauth ? CLAUDE_MODELS : []),
                        ...FREE_MODELS,
                        ...(status?.custom_provider
                          ? [{ id: "custom", label: status.custom_provider_model ?? "Custom", logo: "/custom-provider.svg" }]
                          : []),
                      ].map(
                        (m) => (
                          <option key={m.id} value={m.id}>
                            <span className="flex items-center gap-1.5">
                              <img src={m.logo} alt="" className="h-3.5 w-3.5 shrink-0" />
                              {m.label}
                            </span>
                          </option>
                        ),
                      )}
                    </Select>
                  </Row>
                </section>
              </div>

              <div>
                <SectionHeading>Conversations</SectionHeading>
                <section className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row
                    as="label"
                    title="Confirm before deleting a chat"
                    description="Off deletes immediately from the chat menu."
                  >
                    <Checkbox
                      checked={confirmBeforeDelete}
                      onChange={() => setConfirmBeforeDelete(!confirmBeforeDelete)}
                    />
                  </Row>

                  <Row
                    as="label"
                    title="Auto-fill the Claude code from the clipboard"
                    description="Reads the clipboard when the window regains focus during sign-in."
                  >
                    <Checkbox
                      checked={clipboardAutoFill}
                      onChange={() => setClipboardAutoFill(!clipboardAutoFill)}
                    />
                  </Row>
                  <Row
                    as="label"
                    title="Notifications for new chats"
                    description="Whether a newly created chat starts with desktop notifications on."
                  >
                    <Checkbox
                      checked={defaultNotifications}
                      onChange={() => setDefaultNotifications(!defaultNotifications)}
                    />
                  </Row>
                  <Row
                    as="label"
                    title="Play a sound with notifications"
                    description="Plays a short beep alongside any desktop notification."
                  >
                    <Checkbox
                      checked={notificationSound}
                      onChange={() => setNotificationSound(!notificationSound)}
                    />
                  </Row>
                </section>
              </div>

              <div>
                <SectionHeading>Updates</SectionHeading>
                <section className="rounded-lg border border-border bg-card">
                  <Row as="label" title="Check automatically" description="Checks once whenever Kiro starts.">
                    <Checkbox checked={autoCheckUpdates} onChange={() => setAutoCheckUpdates(!autoCheckUpdates)} />
                  </Row>
                  <Row
                    title="Version"
                    description={
                      updateError ?? (updateStatus === "current"
                        ? "You're on the latest version."
                        : updateStatus === "error"
                          ? "Couldn't check for updates."
                          : updateStatus === "available"
                            ? `Version ${availableUpdate?.version} is available.`
                            : `KiroBot ${appVersion}`)
                    }
                  >
                    {updateStatus === "available" ? (
                      <Button size="sm" onClick={handleInstallUpdate} disabled={installingUpdate}>
                        {installingUpdate && <Spinner className="h-4 w-4" />}
                        {installingUpdate ? "Installing…" : "Install and restart"}
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCheckForUpdates}
                        disabled={updateStatus === "checking"}
                      >
                        {updateStatus === "checking" && <Spinner className="h-4 w-4" />}
                        {updateStatus === "checking" ? "Checking…" : "Check for updates"}
                      </Button>
                    )}
                  </Row>
                </section>
              </div>
            </div>
          )}

          {section === "agent" && (
            <div className="space-y-6">
              <div>
                <SectionHeading>Run limits</SectionHeading>
                <section className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row title="Tool approval" description="Choose when the agent must ask before acting.">
                    <Select value={toolApprovalPolicy} onChange={(v) => setToolApprovalPolicy(v as typeof toolApprovalPolicy)}>
                      <option value="risky">Ask for terminal commands</option>
                      <option value="always">Ask for every tool</option>
                      <option value="automatic">Run automatically</option>
                    </Select>
                  </Row>
                  <Row
                    title="Max steps per run"
                    description={`Model turns before the agent stops on its own (${MAX_STEPS_RANGE.min}–${MAX_STEPS_RANGE.max}).`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={MAX_STEPS_RANGE.min}
                        max={MAX_STEPS_RANGE.max}
                        value={maxSteps}
                        onChange={(e) => setMaxSteps(Number(e.target.value))}
                        className="w-32 accent-primary"
                      />
                      <span className="w-6 text-right text-sm tabular-nums text-foreground/90">
                        {maxSteps}
                      </span>
                    </div>
                  </Row>
                  <Row title="Run timeout" description="Stops a slow or stuck run.">
                    <Select value={String(maxRunMinutes)} onChange={(v) => setMaxRunMinutes(Number(v))}>
                      <option value="5">5 minutes</option>
                      <option value="10">10 minutes</option>
                      <option value="20">20 minutes</option>
                      <option value="30">30 minutes</option>
                    </Select>
                  </Row>
                </section>
              </div>

              <div>
                <SectionHeading>Activity</SectionHeading>
                <section className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row
                    as="label"
                    title="Open the workspace panel on tool use"
                    description="Jumps to the Agent tab the moment a tool runs."
                  >
                    <Checkbox
                      checked={autoOpenPanelOnTool}
                      onChange={() => setAutoOpenPanelOnTool(!autoOpenPanelOnTool)}
                    />
                  </Row>
                </section>
              </div>

              <div>
                <SectionHeading>Skills</SectionHeading>
                <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                  <p className="text-xs text-muted-foreground">
                    Install a Claude-style SKILL.md from GitHub. Paste a raw.githubusercontent.com
                    link, or a github.com/.../blob/... link. Its instructions are added to every
                    agent run.
                  </p>
                  <div className="flex gap-2">
                    <Input
                      value={skillUrl}
                      onChange={(e) => setSkillUrl(e.target.value)}
                      placeholder="https://github.com/user/repo/blob/main/SKILL.md"
                    />
                    <Button
                      size="sm"
                      onClick={() => {
                        installSkill.mutate(skillUrl, { onSuccess: () => setSkillUrl("") });
                      }}
                      disabled={!skillUrl || installSkill.isPending}
                    >
                      {installSkill.isPending && <Spinner className="h-4 w-4" />}
                      Install
                    </Button>
                  </div>
                  {installSkill.isError && (
                    <p className="text-xs text-destructive">{(installSkill.error as Error).message}</p>
                  )}
                  {skills && skills.length > 0 && (
                    <div className="divide-y divide-border rounded-lg border border-border">
                      {skills.map((skill) => (
                        <div key={skill.id} className="flex items-center justify-between gap-3 p-3">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium">{skill.name}</p>
                            {skill.description && (
                              <p className="truncate text-xs text-muted-foreground">{skill.description}</p>
                            )}
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteSkill.mutate(skill.id)}
                            disabled={deleteSkill.isPending}
                          >
                            Remove
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </section>
              </div>
            </div>
          )}

          {section === "providers" && (
            <div className="space-y-4">
              <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                <div>
                  <h2 className="text-sm font-semibold">Anthropic (Claude Pro/Max)</h2>
                  <p className="text-xs text-muted-foreground">
                    Connect your Claude Pro or Max account so the agent uses your subscription
                    instead of the app's shared key.
                  </p>
                </div>

                {status?.anthropic_oauth ? (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-foreground/90">Connected</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => anthropic.disconnect.mutate()}
                      disabled={anthropic.disconnect.isPending}
                    >
                      Disconnect
                    </Button>
                  </div>
                ) : codeVerifier ? (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      Approve access in the browser tab that opened, click "Copy code", then switch
                      back. It fills in automatically.
                    </p>
                    <Input
                      value={pastedCode}
                      onChange={(e) => setPastedCode(e.target.value)}
                      placeholder="Paste code here"
                      autoFocus
                    />
                    <div className="flex gap-2">
                      <Button size="sm" onClick={handleSubmitCode} disabled={anthropic.exchange.isPending}>
                        {anthropic.exchange.isPending && <Spinner className="h-4 w-4" />}
                        {anthropic.exchange.isPending ? "Connecting..." : "Submit code"}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setCodeVerifier(null);
                          setPastedCode("");
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                    {anthropic.exchange.isError && (
                      <p className="text-xs text-destructive">Invalid or expired code. Try again.</p>
                    )}
                  </div>
                ) : (
                  <Button size="sm" onClick={handleConnectAnthropic} disabled={anthropic.start.isPending}>
                    {anthropic.start.isPending && <Spinner className="h-4 w-4" />}
                    Connect Claude Pro/Max
                  </Button>
                )}
              </section>

              <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                <div>
                  <h2 className="text-sm font-semibold">Custom provider</h2>
                  <p className="text-xs text-muted-foreground">
                    Any OpenAI-compatible endpoint: self-hosted, or a third-party API.
                  </p>
                </div>

                {status?.custom_provider ? (
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm text-foreground/90">{status.custom_provider_model}</p>
                      <p className="truncate text-xs text-muted-foreground">{status.custom_provider_base_url}</p>
                    </div>
                    <div className="flex shrink-0 gap-2">
                      <Button variant="outline" size="sm" onClick={() => setCustomProviderModalOpen(true)}>
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteCustomProvider.mutate()}
                        disabled={deleteCustomProvider.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  </div>
                ) : (
                  <Button size="sm" onClick={() => setCustomProviderModalOpen(true)}>
                    Add custom provider
                  </Button>
                )}
              </section>

              {(status?.openai_api_key || status?.gemini_api_key) && (
                <section className="space-y-3 rounded-lg border border-border bg-card p-5">
                  <div>
                    <h2 className="text-sm font-semibold">Unused provider keys</h2>
                    <p className="text-xs text-muted-foreground">
                      These providers aren't supported by the agent yet. Remove any previously saved keys.
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {status.openai_api_key && (
                      <Button variant="outline" size="sm" onClick={() => deleteOpenAIKey.mutate()} disabled={deleteOpenAIKey.isPending}>
                        Remove OpenAI key
                      </Button>
                    )}
                    {status.gemini_api_key && (
                      <Button variant="outline" size="sm" onClick={() => deleteGeminiKey.mutate()} disabled={deleteGeminiKey.isPending}>
                        Remove Gemini key
                      </Button>
                    )}
                  </div>
                </section>
              )}

            </div>
          )}

          {section === "appearance" && (
            <div className="space-y-6">
              <div>
                <SectionHeading>Theme</SectionHeading>
                <section className="flex gap-2 rounded-lg border border-border bg-card p-3">
                  {(["system", "light", "dark"] as const).map((t) => (
                    <button
                      key={t}
                      onClick={() => setTheme(t)}
                      className={cn(
                        "flex-1 rounded-md py-2 text-sm capitalize transition-colors",
                        theme === t
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-accent hover:text-foreground",
                      )}
                    >
                      {t}
                    </button>
                  ))}
                </section>
              </div>

              <div>
                <SectionHeading>Text</SectionHeading>
                <section className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row title="Font size" description="Scales the whole interface.">
                    <Segmented
                      value={fontSize}
                      onChange={setFontSize}
                      options={[
                        { value: "small", label: "Small" },
                        { value: "medium", label: "Medium" },
                        { value: "large", label: "Large" },
                      ]}
                    />
                  </Row>

                  <Row title="Message density" description="Spacing between messages in a chat.">
                    <Segmented
                      value={density}
                      onChange={setDensity}
                      options={[
                        { value: "comfortable", label: "Comfortable" },
                        { value: "compact", label: "Compact" },
                      ]}
                    />
                  </Row>

                  <Row title="Chat width" description="How wide the message column runs.">
                    <Segmented
                      value={chatWidth}
                      onChange={setChatWidth}
                      options={[
                        { value: "narrow", label: "Narrow" },
                        { value: "wide", label: "Wide" },
                      ]}
                    />
                  </Row>

                  <Row
                    as="label"
                    title="Show timestamps"
                    description="Shown above the first message after a 10+ minute gap, not on every message."
                  >
                    <Checkbox
                      checked={showTimestamps}
                      onChange={() => setShowTimestamps(!showTimestamps)}
                    />
                  </Row>

                  <Row
                    as="label"
                    title="Reduce motion"
                    description="Turns off message and menu animations."
                  >
                    <Checkbox checked={reduceMotion} onChange={() => setReduceMotion(!reduceMotion)} />
                  </Row>

                  <Row
                    as="label"
                    title="Wrap long lines in code blocks"
                    description="Off scrolls horizontally instead of wrapping."
                  >
                    <Checkbox checked={wrapCodeBlocks} onChange={() => setWrapCodeBlocks(!wrapCodeBlocks)} />
                  </Row>
                </section>
              </div>

              <div>
                <SectionHeading>Layout</SectionHeading>
                <section className="divide-y divide-border rounded-lg border border-border bg-card">
                  <Row
                    as="label"
                    title="Keep sidebar expanded"
                    description="Show chat names instead of the icon-only sidebar."
                  >
                    <Checkbox checked={sidebarOpen} onChange={toggleSidebar} />
                  </Row>

                  <Row title="Sidebar width" description="Width of the expanded chat sidebar.">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={260}
                        max={520}
                        value={sidebarWidth}
                        onChange={(e) => setSidebarWidth(Number(e.target.value))}
                        className="w-32 accent-primary"
                      />
                      <span className="w-12 text-right text-sm tabular-nums text-foreground/90">
                        {sidebarWidth}px
                      </span>
                    </div>
                  </Row>

                  <Row
                    as="label"
                    title="Open workspace panel by default"
                    description="Show files/terminal/agent activity on launch."
                  >
                    <Checkbox checked={workspacePanelOpen} onChange={toggleWorkspacePanel} />
                  </Row>

                  <Row
                    title="Default workspace tab"
                    description="Which tab the workspace panel opens to."
                  >
                    <Select
                      value={workspaceTab}
                      onChange={(v) => setWorkspaceTab(v as "files" | "terminal" | "agent")}
                    >
                      <option value="files">Files</option>
                      <option value="terminal">Terminal</option>
                      <option value="agent">Agent</option>
                    </Select>
                  </Row>

                  <Row title="Workspace panel width" description="Width of files, terminal, and agent activity.">
                    <div className="flex items-center gap-3">
                      <input
                        type="range"
                        min={300}
                        max={640}
                        value={workspacePanelWidth}
                        onChange={(e) => setWorkspacePanelWidth(Number(e.target.value))}
                        className="w-32 accent-primary"
                      />
                      <span className="w-12 text-right text-sm tabular-nums text-foreground/90">
                        {workspacePanelWidth}px
                      </span>
                    </div>
                  </Row>
                </section>
              </div>
            </div>
          )}

          {section === "shortcuts" && (
            <div>
              <SectionHeading>Keyboard shortcuts</SectionHeading>
              <ShortcutEditor />
            </div>
          )}

          {/* VM/Cloud Computer feature disabled for now -- section removed
              from Section/NAV above too. Components still exist at
              @/components/machine/{CloudComputerStatus,BotsList,CloudPanel,MachineScreenModal}. */}

          {section === "account" && (
            <div className="space-y-6">
              <div>
                <SectionHeading>Profile</SectionHeading>
                <section className="space-y-4 rounded-lg border border-border bg-card p-5">
                  <div className="flex items-center gap-4">
                    <input
                      ref={avatarInputRef}
                      type="file"
                      accept="image/*"
                      hidden
                      onChange={(e) => {
                        handleAvatarChange(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => avatarInputRef.current?.click()}
                      className="group relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-lg font-semibold text-foreground"
                    >
                      {profile?.avatar_url ? (
                        <img src={profile.avatar_url} className="h-full w-full object-cover" />
                      ) : (
                        (profile?.username ?? user?.email ?? "?").charAt(0).toUpperCase()
                      )}
                      <span className="absolute inset-0 flex items-center justify-center bg-black/50 text-[11px] font-normal text-white opacity-0 transition-opacity group-hover:opacity-100">
                        Change
                      </span>
                    </button>
                    <div>
                      <p className="text-sm text-foreground/90">Profile photo</p>
                      <p className="text-xs text-muted-foreground">JPG or PNG, under 2MB.</p>
                    </div>
                  </div>

                  <div className="flex items-end gap-2">
                    <div className="flex-1">
                      <label className="mb-1 block text-xs text-muted-foreground">Display name</label>
                      <Input
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Your name"
                      />
                    </div>
                    <Button
                      size="sm"
                      disabled={
                        !nameInput.trim() ||
                        nameInput.trim() === profile?.username ||
                        updateProfile.isPending
                      }
                      onClick={() => updateProfile.mutate({ username: nameInput.trim() })}
                    >
                      {updateProfile.isPending && <Spinner className="h-4 w-4" />}
                      Save
                    </Button>
                  </div>
                </section>
              </div>

              <div>
                <SectionHeading>Account</SectionHeading>
                <section className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
                  <span className="truncate text-sm text-foreground/90">{user?.email}</span>
                  <Button variant="outline" size="sm" onClick={() => signOut()}>
                    <LogOut className="mr-1.5 h-3.5 w-3.5" />
                    Sign out
                  </Button>
                </section>
              </div>

              <div>
                <SectionHeading>Danger zone</SectionHeading>
                <section className="divide-y divide-destructive/40 rounded-lg border border-destructive/40 bg-card">
                  <div className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-sm text-foreground/90">Deactivate account</p>
                      <p className="text-xs text-muted-foreground">
                        Locks you out and signs you out everywhere. Your data is kept. Contact
                        support to reactivate.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDeactivate(true)}
                    >
                      Deactivate
                    </Button>
                    {confirmDeactivate && (
                      <ConfirmDialog
                        title="Deactivate account?"
                        description="Locks you out and signs you out everywhere. Your data is kept. Contact support to reactivate."
                        confirmLabel="Confirm deactivate"
                        pending={deactivateAccount.isPending}
                        onCancel={() => setConfirmDeactivate(false)}
                        onConfirm={() => deactivateAccount.mutate()}
                      />
                    )}
                  </div>

                  <div className="flex items-center justify-between p-5">
                    <div>
                      <p className="text-sm text-foreground/90">Delete account</p>
                      <p className="text-xs text-muted-foreground">
                        Permanently deletes your account and every chat. Can't be undone.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => setConfirmDeleteAccount(true)}
                    >
                      Delete account
                    </Button>
                    {confirmDeleteAccount && (
                      <ConfirmDialog
                        title="Delete account?"
                        description="Permanently deletes your account and every chat. Can't be undone."
                        confirmLabel="Confirm delete"
                        pending={deleteAccount.isPending}
                        onCancel={() => setConfirmDeleteAccount(false)}
                        onConfirm={() => deleteAccount.mutate()}
                      />
                    )}
                  </div>
                </section>
              </div>
            </div>
          )}

          {section === "data" && (
            <div className="space-y-6">
              <div>
                <SectionHeading>Export</SectionHeading>
                <section className="rounded-lg border border-border bg-card">
                  <Row title="Export conversations" description="Download your conversations and messages as JSON.">
                    <Button variant="outline" size="sm" onClick={handleExportData}>Export JSON</Button>
                  </Row>
                </section>
              </div>
              <div>
                <SectionHeading>Cache</SectionHeading>
                <section className="flex items-center justify-between rounded-lg border border-border bg-card p-5">
                  <div>
                    <p className="text-sm text-foreground/90">Clear local cache</p>
                    <p className="text-xs text-muted-foreground">
                      Wipes cached conversations and status. Nothing on the server is deleted.
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => queryClient.clear()}>
                    Clear
                  </Button>
                </section>
              </div>

              <div>
                <SectionHeading>Preferences</SectionHeading>
                <section className="rounded-lg border border-border bg-card">
                  <Row
                    title="Reset settings to defaults"
                    description="Restores every preference on this page. Chats are untouched."
                  >
                    <Button variant="outline" size="sm" onClick={handleResetPreferences}>
                      Reset
                    </Button>
                  </Row>
                </section>
              </div>

              <div>
                <SectionHeading>Danger zone</SectionHeading>
                <section className="flex items-center justify-between rounded-lg border border-destructive/40 bg-card p-5">
                  <div>
                    <p className="text-sm text-foreground/90">Delete all conversations</p>
                    <p className="text-xs text-muted-foreground">
                      Permanently deletes every chat ({conversations.length}) for this account. Can't be undone.
                    </p>
                    {deleteAllError && (
                      <p role="alert" className="text-xs text-destructive">Some chats couldn't be deleted. Try again.</p>
                    )}
                  </div>
                  {confirmDeleteAll ? (
                    <div className="flex shrink-0 gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setConfirmDeleteAll(false)} disabled={deletingAll}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAllConversations}
                        disabled={conversations.length === 0 || deletingAll}
                      >
                        {deletingAll && <Spinner className="h-4 w-4" />}
                        {deletingAll ? "Deleting…" : "Confirm delete"}
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      className="shrink-0 border-destructive/40 text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        setDeleteAllError(false);
                        setConfirmDeleteAll(true);
                      }}
                      disabled={conversations.length === 0}
                    >
                      Delete all
                    </Button>
                  )}
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
      {customProviderModalOpen && (
        <CustomProviderModal
          defaultBaseUrl={status?.custom_provider_base_url ?? ""}
          defaultModel={status?.custom_provider_model ?? ""}
          onClose={() => setCustomProviderModalOpen(false)}
        />
      )}
    </div>
  );
}
