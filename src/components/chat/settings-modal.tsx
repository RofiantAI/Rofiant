"use client";

import { useState, useEffect, useRef } from "react";
import {
  X,
  Cpu,
  MessageSquare,
  Layout,
  Bell,
  Check,
  Lock,
  Database,
  Download,
  Trash2,
  AlertTriangle,
  ChevronDown,
  Sparkles,
  ListChecks,
  Users,
  Plus,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useChatSettings } from "@/contexts/chat-settings-context";
import { FREE_MODELS, PRO_MODELS } from "@/lib/chat-settings";
import type { ChatSettings } from "@/lib/chat-settings";
import { loadRules, saveRules, type Rule } from "@/lib/chat-rules";
import { loadAgents, saveAgents, type Agent } from "@/lib/chat-agents";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const CONTEXT_OPTIONS = [
  { value: 5, label: "5 messages" },
  { value: 10, label: "10 messages" },
  { value: 20, label: "20 messages" },
  { value: 50, label: "50 messages" },
  { value: 999, label: "All messages" },
];

const SECTIONS = [
  { id: "model", label: "Model", icon: Cpu },
  { id: "behavior", label: "Behavior", icon: MessageSquare },
  { id: "rules", label: "Rules", icon: ListChecks },
  { id: "agents", label: "Agents", icon: Users },
  { id: "interface", label: "Interface", icon: Layout },
  { id: "data", label: "Data controls", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function Toggle({
  checked,
  onChange,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 rounded-full border transition-colors shrink-0 ${
        checked
          ? "bg-accent-primary/20 border-accent-primary/40"
          : "bg-background-tertiary border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 w-3.5 h-3.5 rounded-full transition-all ${
          checked ? "left-5 bg-accent-primary" : "left-0.5 bg-foreground-muted"
        }`}
      />
    </button>
  );
}

function Row({
  label,
  desc,
  children,
}: {
  label: string;
  desc?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-6 px-4 py-3.5">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {desc && (
          <p className="text-xs text-foreground-muted mt-0.5 leading-relaxed">
            {desc}
          </p>
        )}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

function SettingsList({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border bg-card/50 divide-y divide-border overflow-hidden">
      {children}
    </div>
  );
}

function SegmentedControl<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex rounded-lg border border-border bg-background-tertiary p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => onChange(o.value)}
          className={`px-3 h-7 text-xs rounded-md transition-colors ${
            value === o.value
              ? "bg-background text-foreground shadow-sm"
              : "text-foreground-secondary hover:text-foreground"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  children,
  className = "",
}: {
  value: string | number;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-8 pl-3 pr-8 rounded-md bg-background-tertiary border border-border text-sm text-foreground focus:outline-none focus:border-border-light appearance-none cursor-pointer"
      >
        {children}
      </select>
      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted pointer-events-none" />
    </div>
  );
}

function ModelCard({
  model,
  selected,
  locked,
  onSelect,
}: {
  model: { id: string; name: string; desc: string };
  selected: boolean;
  locked: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={locked}
      className={`flex items-center justify-between w-full px-4 py-3 rounded-lg border text-left transition-all ${
        locked
          ? "border-border opacity-50 cursor-not-allowed"
          : selected
            ? "border-accent-primary/40 bg-accent-primary/5 shadow-sm"
            : "border-border hover:border-border-light hover:bg-background-tertiary/50"
      }`}
    >
      <div className="min-w-0">
        <p className="text-sm text-foreground font-medium">{model.name}</p>
        <p className="text-xs text-foreground-muted mt-0.5 leading-snug">
          {model.desc}
        </p>
      </div>
      {locked ? (
        <Lock className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
      ) : selected ? (
        <div className="w-5 h-5 rounded-full bg-accent-primary/20 flex items-center justify-center shrink-0">
          <Check className="w-3 h-3 text-accent-primary" />
        </div>
      ) : null}
    </button>
  );
}

export function ChatSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, isPro, save } = useChatSettings();
  const [draft, setDraft] = useState<ChatSettings>({ ...settings });
  const [active, setActive] = useState("model");
  const [saved, setSaved] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<
    "idle" | "confirming" | "deleting" | "done"
  >("idle");
  const [exportStatus, setExportStatus] = useState<
    "idle" | "exporting" | "done"
  >("idle");
  const [rules, setRules] = useState<Rule[]>(() => loadRules());
  const [newRuleText, setNewRuleText] = useState("");
  const [agents, setAgents] = useState<Agent[]>(() => loadAgents());
  const [addAgentOpen, setAddAgentOpen] = useState(false);
  const [newAgent, setNewAgent] = useState({ name: "", systemPrompt: "" });

  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  function addRule() {
    const text = newRuleText.trim();
    if (!text) return;
    const rule: Rule = { id: crypto.randomUUID(), text, createdAt: Date.now() };
    const next = [...rules, rule];
    setRules(next);
    saveRules(next);
    setNewRuleText("");
  }

  function removeRule(id: string) {
    const next = rules.filter((r) => r.id !== id);
    setRules(next);
    saveRules(next);
  }

  function addAgent() {
    const name = newAgent.name.trim();
    const systemPrompt = newAgent.systemPrompt.trim();
    if (!name || !systemPrompt) return;
    const agent: Agent = { id: crypto.randomUUID(), name, systemPrompt };
    const next = [...agents, agent];
    setAgents(next);
    saveAgents(next);
    patch({ activeAgentId: agent.id });
    setNewAgent({ name: "", systemPrompt: "" });
    setAddAgentOpen(false);
  }

  function removeAgent(id: string) {
    const next = agents.filter((a) => a.id !== id);
    setAgents(next);
    saveAgents(next);
    if (draft.activeAgentId === id) patch({ activeAgentId: null });
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onCloseRef.current();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  function patch(p: Partial<ChatSettings>) {
    setDraft((prev) => ({ ...prev, ...p }));
  }

  async function handleExport() {
    setExportStatus("exporting");
    const res = await fetch("/api/conversations");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rofiant-chats-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportStatus("done");
    setTimeout(() => setExportStatus("idle"), 2000);
  }

  async function handleDeleteAll() {
    if (deleteStatus !== "confirming") {
      setDeleteStatus("confirming");
      return;
    }
    setDeleteStatus("deleting");
    await fetch("/api/conversations", { method: "DELETE" });
    setDeleteStatus("done");
    setTimeout(() => {
      setDeleteStatus("idle");
      onClose();
      window.location.href = "/chat";
    }, 1500);
  }

  function handleSave() {
    save(draft);
    setSaved(true);
    setTimeout(() => {
      setSaved(false);
      onClose();
    }, 600);
  }

  const activeSection = SECTIONS.find((s) => s.id === active);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="chat-settings-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={() => onCloseRef.current()}
      />
      <div className="relative bg-background border border-border w-full max-w-2xl shadow-2xl flex flex-col rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0 bg-background-secondary/30">
          <div>
            <h2
              id="chat-settings-title"
              className="text-sm font-semibold text-foreground"
            >
              Chat settings
            </h2>
            <p className="text-xs text-foreground-muted mt-0.5">
              Model, behavior, and data preferences
            </p>
          </div>
          <button
            type="button"
            onClick={() => onCloseRef.current()}
            aria-label="Close settings"
            className="flex items-center justify-center w-8 h-8 rounded-lg text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="flex h-[28rem] shrink-0 overflow-hidden">
          <nav className="w-44 shrink-0 border-r border-border py-3 px-2 space-y-0.5 bg-background-secondary/20 overflow-y-auto">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActive(id)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 text-sm rounded-lg transition-colors ${
                  active === id
                    ? "text-foreground bg-background-tertiary font-medium shadow-sm"
                    : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary/60"
                }`}
              >
                <Icon
                  className={`w-4 h-4 shrink-0 ${active === id ? "text-accent-primary" : ""}`}
                />
                {label}
              </button>
            ))}
          </nav>

          <div className="flex-1 min-h-0 overflow-y-auto px-6 py-5">
            {activeSection && (
              <div className="flex items-center gap-2 mb-4">
                <activeSection.icon className="w-4 h-4 text-accent-primary" />
                <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                  {activeSection.label}
                </p>
              </div>
            )}

            {active === "model" && (
              <div className="space-y-3">
                {FREE_MODELS.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    selected={draft.model === m.id}
                    locked={false}
                    onSelect={() => patch({ model: m.id })}
                  />
                ))}

                <div className="flex items-center gap-2 pt-2">
                  <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
                    Pro models
                  </p>
                  {!isPro && (
                    <Badge variant="warning" className="rounded-md">
                      Pro
                    </Badge>
                  )}
                </div>
                {PRO_MODELS.map((m) => (
                  <ModelCard
                    key={m.id}
                    model={m}
                    selected={draft.model === m.id}
                    locked={!isPro}
                    onSelect={() => isPro && patch({ model: m.id })}
                  />
                ))}

                {!isPro && (
                  <Link
                    href="/pricing"
                    className="flex items-center justify-center gap-2 mt-2 px-4 py-2.5 rounded-lg border border-accent-primary/30 bg-accent-primary/5 text-xs text-accent-primary hover:bg-accent-primary/10 transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Upgrade to unlock Pro models
                  </Link>
                )}
              </div>
            )}

            {active === "behavior" && (
              <div className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-1">
                    Custom instructions
                  </label>
                  <p className="text-xs text-foreground-muted mb-2 leading-relaxed">
                    Tone, format, or context the AI should always keep in mind.
                  </p>
                  <textarea
                    value={draft.customInstructions}
                    onChange={(e) =>
                      patch({ customInstructions: e.target.value })
                    }
                    placeholder="e.g. Keep answers short. Use bullet points. I'm learning to code."
                    rows={5}
                    className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors resize-none"
                  />
                  <p className="text-xs text-foreground-muted mt-1.5 text-right tabular-nums">
                    {draft.customInstructions.length} / 2000
                  </p>
                </div>

                <SettingsList>
                  <Row
                    label="Context limit"
                    desc="Previous messages sent with each request"
                  >
                    <SelectField
                      value={draft.contextLimit}
                      onChange={(v) => patch({ contextLimit: Number(v) })}
                    >
                      {CONTEXT_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </SelectField>
                  </Row>

                  <Row
                    label="Enter to send"
                    desc="Shift+Enter adds a new line"
                  >
                    <Toggle
                      checked={draft.enterToSend}
                      onChange={(v) => patch({ enterToSend: v })}
                    />
                  </Row>

                  <Row
                    label="Auto-generate titles"
                    desc="Name chats from the first message"
                  >
                    <Toggle
                      checked={draft.autoTitle}
                      onChange={(v) => patch({ autoTitle: v })}
                    />
                  </Row>
                </SettingsList>
              </div>
            )}

            {active === "rules" && (
              <div className="space-y-4">
                <p className="text-xs text-foreground-muted leading-relaxed">
                  Rules are always followed by the AI, in every chat. You can also manage these with
                  <code className="mx-1 px-1 py-0.5 rounded bg-background-tertiary text-foreground">/rule</code>
                  commands in the composer.
                </p>
                <div className="flex items-center gap-2">
                  <input
                    value={newRuleText}
                    onChange={(e) => setNewRuleText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addRule();
                    }}
                    placeholder="e.g. Always answer in metric units"
                    className="flex-1 h-9 px-3 rounded-lg bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light"
                  />
                  <Button size="sm" onClick={addRule} disabled={!newRuleText.trim()}>
                    <Plus className="w-3.5 h-3.5" />
                    Add
                  </Button>
                </div>
                {rules.length === 0 ? (
                  <p className="text-xs text-foreground-muted text-center py-6">No rules yet</p>
                ) : (
                  <SettingsList>
                    {rules.map((r) => (
                      <Row key={r.id} label={r.text}>
                        <button
                          type="button"
                          onClick={() => removeRule(r.id)}
                          title="Remove rule"
                          className="flex items-center justify-center w-7 h-7 rounded-md text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </Row>
                    ))}
                  </SettingsList>
                )}
              </div>
            )}

            {active === "agents" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-foreground-muted leading-relaxed max-w-[280px]">
                    Save custom system prompts as agents and switch between them from the composer.
                  </p>
                  <Button size="sm" variant="outline" onClick={() => setAddAgentOpen(true)}>
                    <Plus className="w-3.5 h-3.5" />
                    Add agent
                  </Button>
                </div>

                {agents.length === 0 ? (
                  <p className="text-xs text-foreground-muted text-center py-6">No agents yet</p>
                ) : (
                  <SettingsList>
                    {agents.map((a) => {
                      const isActive = draft.activeAgentId === a.id;
                      return (
                        <Row key={a.id} label={a.name} desc={a.systemPrompt}>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                patch({ activeAgentId: isActive ? null : a.id, chatMode: "ask" })
                              }
                              className={`h-7 px-2.5 rounded-md text-xs transition-colors ${
                                isActive
                                  ? "bg-accent-primary/20 text-accent-primary"
                                  : "bg-background-tertiary text-foreground-secondary hover:text-foreground"
                              }`}
                            >
                              {isActive ? "Active" : "Use"}
                            </button>
                            <button
                              type="button"
                              onClick={() => removeAgent(a.id)}
                              title="Remove agent"
                              className="flex items-center justify-center w-7 h-7 rounded-md text-foreground-muted hover:text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </Row>
                      );
                    })}
                  </SettingsList>
                )}

                {addAgentOpen && (
                  <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-medium text-foreground">Add agent</p>
                      <button
                        type="button"
                        onClick={() => setAddAgentOpen(false)}
                        className="text-foreground-muted hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <input
                      value={newAgent.name}
                      onChange={(e) => setNewAgent((s) => ({ ...s, name: e.target.value }))}
                      placeholder="Name"
                      className="w-full h-9 px-3 rounded-lg bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light"
                    />
                    <textarea
                      value={newAgent.systemPrompt}
                      onChange={(e) => setNewAgent((s) => ({ ...s, systemPrompt: e.target.value }))}
                      placeholder="System prompt"
                      rows={4}
                      className="w-full px-3 py-2.5 rounded-lg bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light resize-none"
                    />
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => setAddAgentOpen(false)}>
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={addAgent}
                        disabled={!newAgent.name.trim() || !newAgent.systemPrompt.trim()}
                      >
                        Add agent
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {active === "interface" && (
              <SettingsList>
                <Row label="Font size" desc="Text size in the message thread">
                  <SegmentedControl
                    value={draft.fontSize}
                    options={[
                      { value: "sm", label: "S" },
                      { value: "md", label: "M" },
                      { value: "lg", label: "L" },
                    ]}
                    onChange={(v) => patch({ fontSize: v })}
                  />
                </Row>

                <Row label="Message density" desc="Spacing between messages">
                  <SegmentedControl
                    value={draft.density}
                    options={[
                      { value: "compact", label: "Compact" },
                      { value: "comfortable", label: "Comfortable" },
                    ]}
                    onChange={(v) => patch({ density: v })}
                  />
                </Row>

                <Row
                  label="Show timestamps"
                  desc="Display time below each message"
                >
                  <Toggle
                    checked={draft.showTimestamps}
                    onChange={(v) => patch({ showTimestamps: v })}
                  />
                </Row>
              </SettingsList>
            )}

            {active === "notifications" && (
              <SettingsList>
                <Row
                  label="Response sound"
                  desc="Play a tone when a response finishes"
                >
                  <Toggle
                    checked={draft.responseSound}
                    onChange={(v) => patch({ responseSound: v })}
                  />
                </Row>
              </SettingsList>
            )}

            {active === "data" && (
              <div className="space-y-4">
                <div className="rounded-lg border border-border bg-card/50 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-background-tertiary flex items-center justify-center">
                      <Download className="w-4 h-4 text-foreground-muted" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Export chats
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        Download all conversations as JSON
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExport}
                    disabled={exportStatus === "exporting"}
                  >
                    {exportStatus === "done" ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-accent-success" />
                        Downloaded
                      </>
                    ) : exportStatus === "exporting" ? (
                      "Exporting…"
                    ) : (
                      <>
                        <Download className="w-3.5 h-3.5" />
                        Export chats
                      </>
                    )}
                  </Button>
                </div>

                <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 space-y-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center">
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-400">
                        Delete all chats
                      </p>
                      <p className="text-xs text-foreground-muted mt-0.5">
                        Permanent — cannot be undone
                      </p>
                    </div>
                  </div>
                  {deleteStatus === "done" ? (
                    <p className="text-xs text-accent-success flex items-center gap-1.5">
                      <Check className="w-3.5 h-3.5" /> All chats deleted
                    </p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      {deleteStatus === "confirming" && (
                        <p className="flex items-center gap-1.5 text-xs text-red-400 w-full">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          Click again to confirm deletion
                        </p>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDeleteAll}
                        disabled={deleteStatus === "deleting"}
                        className={
                          deleteStatus === "confirming"
                            ? "border-red-500/60 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        }
                      >
                        {deleteStatus === "deleting" ? (
                          "Deleting…"
                        ) : (
                          <>
                            <Trash2 className="w-3.5 h-3.5" />
                            {deleteStatus === "confirming"
                              ? "Yes, delete all"
                              : "Delete all chats"}
                          </>
                        )}
                      </Button>
                      {deleteStatus === "confirming" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteStatus("idle")}
                        >
                          Cancel
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0 bg-background-secondary/30">
          <Button variant="outline" size="sm" onClick={() => onCloseRef.current()}>
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            className={
              saved ? "bg-accent-success hover:bg-accent-success/90" : ""
            }
          >
            {saved && <Check className="w-3.5 h-3.5" />}
            {saved ? "Saved" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
