"use client";

import { useState } from "react";
import { X, Cpu, MessageSquare, Layout, Bell, Check, Lock, Database, Download, Trash2, AlertTriangle } from "lucide-react";
import { useChatSettings } from "@/contexts/chat-settings-context";
import { FREE_MODELS, PRO_MODELS } from "@/lib/chat-settings";
import type { ChatSettings } from "@/lib/chat-settings";

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
  { id: "interface", label: "Interface", icon: Layout },
  { id: "data", label: "Data controls", icon: Database },
  { id: "notifications", label: "Notifications", icon: Bell },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={`relative w-10 h-5 border transition-colors shrink-0 ${
        checked
          ? "bg-accent-primary/20 border-accent-primary/40"
          : "bg-background-tertiary border-border"
      }`}
    >
      <span
        className={`absolute top-0.5 w-3.5 h-3.5 transition-all ${
          checked ? "left-5 bg-accent-primary" : "left-0.5 bg-foreground-muted"
        }`}
      />
    </button>
  );
}

function Row({ label, desc, children }: { label: string; desc?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-6 py-4 border-b border-border last:border-0">
      <div className="min-w-0">
        <p className="text-sm text-foreground">{label}</p>
        {desc && <p className="text-xs text-foreground-muted mt-0.5">{desc}</p>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}

export function ChatSettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, isPro, save } = useChatSettings();
  const [draft, setDraft] = useState<ChatSettings>({ ...settings });
  const [active, setActive] = useState("model");
  const [saved, setSaved] = useState(false);
  const [deleteStatus, setDeleteStatus] = useState<"idle" | "confirming" | "deleting" | "done">("idle");
  const [exportStatus, setExportStatus] = useState<"idle" | "exporting" | "done">("idle");

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
    if (deleteStatus !== "confirming") { setDeleteStatus("confirming"); return; }
    setDeleteStatus("deleting");
    await fetch("/api/conversations", { method: "DELETE" });
    setDeleteStatus("done");
    setTimeout(() => { setDeleteStatus("idle"); onClose(); window.location.href = "/chat"; }, 1500);
  }

  function handleSave() {
    save(draft);
    setSaved(true);
    setTimeout(() => { setSaved(false); onClose(); }, 600);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70" onClick={onClose} />
      <div className="relative bg-background border border-border w-full max-w-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <h2 className="text-sm font-medium text-foreground">Settings</h2>
          <button onClick={onClose} className="flex items-center justify-center w-7 h-7 hover:bg-background-tertiary transition-colors">
            <X className="w-4 h-4 text-foreground-muted" />
          </button>
        </div>

        <div className="flex h-80">
          {/* Sidebar nav */}
          <nav className="w-44 shrink-0 border-r border-border py-3">
            {SECTIONS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActive(id)}
                className={`flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors ${
                  active === id
                    ? "text-foreground bg-background-tertiary"
                    : "text-foreground-secondary hover:text-foreground hover:bg-background-tertiary"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {label}
              </button>
            ))}
          </nav>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-6 py-4">

            {/* MODEL */}
            {active === "model" && (
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wider mb-4">Model</p>
                <div className="space-y-2">
                  {FREE_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => patch({ model: m.id })}
                      className={`flex items-center justify-between w-full px-4 py-3 border text-left transition-colors ${
                        draft.model === m.id
                          ? "border-foreground bg-background-tertiary"
                          : "border-border hover:border-border-light"
                      }`}
                    >
                      <div>
                        <p className="text-sm text-foreground">{m.name}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">{m.desc}</p>
                      </div>
                      {draft.model === m.id && <Check className="w-4 h-4 text-foreground shrink-0" />}
                    </button>
                  ))}

                  <p className="text-xs text-foreground-muted uppercase tracking-wider pt-3 pb-1">Pro models</p>
                  {PRO_MODELS.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => isPro && patch({ model: m.id })}
                      disabled={!isPro}
                      className={`flex items-center justify-between w-full px-4 py-3 border text-left transition-colors ${
                        !isPro
                          ? "border-border opacity-50 cursor-not-allowed"
                          : draft.model === m.id
                          ? "border-foreground bg-background-tertiary"
                          : "border-border hover:border-border-light"
                      }`}
                    >
                      <div>
                        <p className="text-sm text-foreground">{m.name}</p>
                        <p className="text-xs text-foreground-muted mt-0.5">{m.desc}</p>
                      </div>
                      {!isPro
                        ? <Lock className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                        : draft.model === m.id
                        ? <Check className="w-4 h-4 text-foreground shrink-0" />
                        : null}
                    </button>
                  ))}

                  {!isPro && (
                    <a
                      href="/pricing"
                      className="block mt-3 text-center text-xs text-accent-primary hover:underline"
                    >
                      Upgrade to Pro to unlock more models →
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* BEHAVIOR */}
            {active === "behavior" && (
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wider mb-4">Behavior</p>

                <div className="mb-5">
                  <label className="block text-sm text-foreground mb-2">Custom instructions</label>
                  <p className="text-xs text-foreground-muted mb-2">
                    Added to every conversation as a system prompt. Use this to set your role, preferred formats, or standing context.
                  </p>
                  <textarea
                    value={draft.customInstructions}
                    onChange={(e) => patch({ customInstructions: e.target.value })}
                    placeholder="e.g. You are assisting a contracting officer at a federal agency. Always cite sources. Use plain language."
                    rows={5}
                    className="w-full px-3 py-2 bg-background-tertiary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-border-light transition-colors resize-none"
                  />
                  <p className="text-xs text-foreground-muted mt-1 text-right">{draft.customInstructions.length} / 2000</p>
                </div>

                <Row label="Context limit" desc="Number of previous messages sent with each request">
                  <select
                    value={draft.contextLimit}
                    onChange={(e) => patch({ contextLimit: Number(e.target.value) })}
                    className="h-8 px-2 bg-background-tertiary border border-border text-sm text-foreground focus:outline-none appearance-none cursor-pointer"
                  >
                    {CONTEXT_OPTIONS.map((o) => (
                      <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                  </select>
                </Row>

                <Row label="Enter to send" desc="Press Enter to send. Shift+Enter for a new line.">
                  <Toggle checked={draft.enterToSend} onChange={(v) => patch({ enterToSend: v })} />
                </Row>

                <Row label="Auto-generate titles" desc="Name conversations automatically from the first message">
                  <Toggle checked={draft.autoTitle} onChange={(v) => patch({ autoTitle: v })} />
                </Row>
              </div>
            )}

            {/* INTERFACE */}
            {active === "interface" && (
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wider mb-4">Interface</p>

                <Row label="Font size" desc="Size of text in the message thread">
                  <div className="flex gap-1">
                    {(["sm", "md", "lg"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => patch({ fontSize: s })}
                        className={`w-9 h-8 text-xs border transition-colors ${
                          draft.fontSize === s
                            ? "border-foreground text-foreground bg-background-tertiary"
                            : "border-border text-foreground-secondary hover:border-border-light"
                        }`}
                      >
                        {s === "sm" ? "S" : s === "md" ? "M" : "L"}
                      </button>
                    ))}
                  </div>
                </Row>

                <Row label="Message density" desc="Spacing between messages">
                  <div className="flex gap-1">
                    {(["compact", "comfortable"] as const).map((d) => (
                      <button
                        key={d}
                        onClick={() => patch({ density: d })}
                        className={`px-3 h-8 text-xs border transition-colors ${
                          draft.density === d
                            ? "border-foreground text-foreground bg-background-tertiary"
                            : "border-border text-foreground-secondary hover:border-border-light"
                        }`}
                      >
                        {d.charAt(0).toUpperCase() + d.slice(1)}
                      </button>
                    ))}
                  </div>
                </Row>

                <Row label="Show timestamps" desc="Display time below each message">
                  <Toggle checked={draft.showTimestamps} onChange={(v) => patch({ showTimestamps: v })} />
                </Row>
              </div>
            )}

            {/* NOTIFICATIONS */}
            {active === "notifications" && (
              <div>
                <p className="text-xs text-foreground-muted uppercase tracking-wider mb-4">Notifications</p>
                <Row label="Response sound" desc="Play a tone when a response finishes streaming">
                  <Toggle checked={draft.responseSound} onChange={(v) => patch({ responseSound: v })} />
                </Row>
              </div>
            )}

            {/* DATA CONTROLS */}
            {active === "data" && (
              <div className="space-y-5">
                <p className="text-xs text-foreground-muted uppercase tracking-wider">Data controls</p>

                {/* Export */}
                <div className="border border-border p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Download className="w-4 h-4 text-foreground-muted" />
                    <p className="text-sm text-foreground font-medium">Export chats</p>
                  </div>
                  <p className="text-xs text-foreground-muted">Download all your conversations as a JSON file.</p>
                  <button
                    onClick={handleExport}
                    disabled={exportStatus === "exporting"}
                    className="h-8 px-3 text-xs font-medium border border-border text-foreground hover:bg-background-tertiary disabled:opacity-50 transition-colors flex items-center gap-1.5"
                  >
                    {exportStatus === "done" ? (
                      <><Check className="w-3.5 h-3.5 text-accent-success" /> Downloaded</>
                    ) : exportStatus === "exporting" ? (
                      "Exporting…"
                    ) : (
                      <><Download className="w-3.5 h-3.5" /> Export chats</>
                    )}
                  </button>
                </div>

                {/* Delete all */}
                <div className="border border-red-500/20 p-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <Trash2 className="w-4 h-4 text-red-400" />
                    <p className="text-sm text-red-400 font-medium">Delete all chats</p>
                  </div>
                  <p className="text-xs text-foreground-muted">Permanently delete every conversation. This cannot be undone.</p>
                  {deleteStatus === "done" ? (
                    <p className="text-xs text-accent-success flex items-center gap-1">
                      <Check className="w-3 h-3" /> All chats deleted.
                    </p>
                  ) : (
                    <div className="flex items-center gap-2">
                      {deleteStatus === "confirming" && (
                        <div className="flex items-center gap-1.5 text-xs text-red-400">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Are you sure? Click again to confirm.
                        </div>
                      )}
                      <button
                        onClick={handleDeleteAll}
                        disabled={deleteStatus === "deleting"}
                        className={`h-8 px-3 text-xs font-medium border transition-colors disabled:opacity-50 flex items-center gap-1.5 ${
                          deleteStatus === "confirming"
                            ? "border-red-500/60 bg-red-500/20 text-red-400 hover:bg-red-500/30"
                            : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        }`}
                      >
                        {deleteStatus === "deleting" ? (
                          "Deleting…"
                        ) : (
                          <><Trash2 className="w-3.5 h-3.5" /> {deleteStatus === "confirming" ? "Yes, delete all" : "Delete all chats"}</>
                        )}
                      </button>
                      {deleteStatus === "confirming" && (
                        <button
                          onClick={() => setDeleteStatus("idle")}
                          className="h-8 px-3 text-xs border border-border text-foreground-secondary hover:bg-background-tertiary transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-border shrink-0">
          <button onClick={onClose} className="h-8 px-4 text-sm text-foreground-secondary border border-border hover:bg-background-tertiary transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSave}
            className={`h-8 px-4 text-sm transition-colors flex items-center gap-2 ${
              saved ? "bg-accent-success text-background" : "bg-foreground text-background hover:bg-foreground/90"
            }`}
          >
            {saved && <Check className="w-3.5 h-3.5" />}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>
    </div>
  );
}
