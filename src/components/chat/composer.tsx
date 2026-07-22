"use client";

import { useEffect, useRef, useState } from "react";
import {
  ArrowUp,
  Plus,
  ChevronDown,
  Check,
  X,
  Terminal,
  Square,
  Mic,
  Loader2,
  ListChecks,
  MessageCircle,
  Bot,
  Paperclip,
  FileText,
} from "lucide-react";
import { ModelSwitcher } from "./model-switcher";
import { useChatSettings } from "@/contexts/chat-settings-context";
import { SLASH_COMMANDS } from "@/lib/chat-commands";
import { loadAgents, type Agent } from "@/lib/chat-agents";
import { isVisionModel, VISION_MODEL_ID } from "@/lib/chat-settings";

const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

type DocMeta = { id: string; name: string; type: string };

export function Composer({
  value,
  onValueChange,
  onSubmit,
  isLoading,
  onStop,
  disabled,
  allDocs,
  selectedDocIds,
  onToggleDoc,
  docLoadError,
  onDismissDocError,
  maxWidth = "max-w-3xl",
}: {
  value: string;
  onValueChange: (v: string) => void;
  onSubmit: (text: string, image?: string) => void;
  isLoading: boolean;
  onStop: () => void;
  disabled?: boolean;
  allDocs: DocMeta[];
  selectedDocIds: Set<string>;
  onToggleDoc: (id: string) => void;
  docLoadError?: string;
  onDismissDocError: () => void;
  maxWidth?: string;
}) {
  const { settings, update } = useChatSettings();
  const [image, setImage] = useState<string | null>(null);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const [modeOpen, setModeOpen] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [commandIndex, setCommandIndex] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [voiceError, setVoiceError] = useState<string | null>(null);

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const docPickerRef = useRef<HTMLDivElement>(null);
  const modeRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isRecordingRef = useRef(false);
  const transcribeChainRef = useRef<Promise<void>>(Promise.resolve());
  const segmentTimeoutRef = useRef<number | null>(null);
  const SEGMENT_MS = 3000;

  const commandMatches = value.startsWith("/")
    ? SLASH_COMMANDS.filter((c) => c.cmd.toLowerCase().startsWith(value.toLowerCase()))
    : [];
  const showCommandMenu =
    commandMatches.length > 0 && !(commandMatches.length === 1 && commandMatches[0].cmd === value);

  useEffect(() => {
    setCommandIndex(0);
  }, [value]);

  function applyCommand(cmd: string) {
    onValueChange(`${cmd} `);
    textareaRef.current?.focus();
  }

  useEffect(() => {
    if (!docPickerOpen) return;
    function onClick(e: MouseEvent) {
      if (docPickerRef.current && !docPickerRef.current.contains(e.target as Node)) {
        setDocPickerOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [docPickerOpen]);

  useEffect(() => {
    if (!modeOpen) return;
    setAgents(loadAgents());
    function onClick(e: MouseEvent) {
      if (modeRef.current && !modeRef.current.contains(e.target as Node)) {
        setModeOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [modeOpen]);

  async function readImageFile(
    file: File,
  ): Promise<{ ok: true; dataUrl: string } | { ok: false; error: string }> {
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Only image files are supported." };
    }
    if (file.size > MAX_IMAGE_BYTES) {
      return { ok: false, error: "Image is too large (max 5MB)." };
    }
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    return { ok: true, dataUrl };
  }

  async function attachImage(file: File) {
    const result = await readImageFile(file);
    if (!result.ok) {
      setAttachError(result.error);
      return;
    }
    setAttachError(null);
    setImage(result.dataUrl);
    if (!isVisionModel(settings.model)) update({ model: VISION_MODEL_ID });
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void attachImage(file);
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    const file = item.getAsFile();
    if (!file) return;
    e.preventDefault();
    void attachImage(file);
  }

  function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.slice(result.indexOf(",") + 1));
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  async function transcribeSegment(blob: Blob, mimeType: string, isFinal: boolean) {
    if (blob.size === 0) return;
    if (isFinal) setIsTranscribing(true);
    try {
      const base64 = await blobToBase64(blob);
      const res = await fetch("/api/transcribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ audioBase64: base64, mimeType }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Transcription failed");
      if (data.text) {
        onValueChange(value ? `${value} ${data.text}` : data.text);
        textareaRef.current?.focus();
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Transcription failed";
      console.error("transcribe failed", err);
      setVoiceError(message);
    } finally {
      if (isFinal) setIsTranscribing(false);
    }
  }

  function runSegment() {
    const stream = streamRef.current;
    if (!stream || !isRecordingRef.current) return;
    const mimeType = MediaRecorder.isTypeSupported("audio/webm") ? "audio/webm" : "audio/ogg";
    const recorder = new MediaRecorder(stream, { mimeType });
    const chunks: Blob[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onstop = () => {
      const isFinal = !isRecordingRef.current;
      if (!isFinal) runSegment();
      const blob = new Blob(chunks, { type: mimeType });
      transcribeChainRef.current = transcribeChainRef.current.then(() =>
        transcribeSegment(blob, mimeType, isFinal),
      );
      if (isFinal) {
        void transcribeChainRef.current.then(() => {
          stream.getTracks().forEach((t) => t.stop());
          streamRef.current = null;
        });
      }
    };
    mediaRecorderRef.current = recorder;
    recorder.start();
    segmentTimeoutRef.current = window.setTimeout(() => {
      if (recorder.state !== "inactive") recorder.stop();
    }, SEGMENT_MS);
  }

  async function startRecording() {
    setVoiceError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      isRecordingRef.current = true;
      transcribeChainRef.current = Promise.resolve();
      setIsRecording(true);
      runSegment();
    } catch {
      setVoiceError("Microphone access denied");
    }
  }

  function stopRecording() {
    isRecordingRef.current = false;
    setIsRecording(false);
    if (segmentTimeoutRef.current !== null) {
      window.clearTimeout(segmentTimeoutRef.current);
      segmentTimeoutRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    mediaRecorderRef.current = null;
  }

  function toggleRecording() {
    if (isRecording) stopRecording();
    else void startRecording();
  }

  function submit() {
    const trimmed = value.trim();
    if ((!trimmed && !image) || disabled || isLoading) return;
    onSubmit(trimmed, image ?? undefined);
    onValueChange("");
    setImage(null);
    setAttachError(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
  }

  const activeAgent = agents.find((a) => a.id === settings.activeAgentId) ?? null;
  const modeLabel = activeAgent ? activeAgent.name : settings.chatMode === "plan" ? "Plan" : "Ask";
  const ModeIcon = activeAgent ? Bot : settings.chatMode === "plan" ? ListChecks : MessageCircle;

  return (
    <>
      {docLoadError && (
        <div
          className={`${maxWidth} mx-auto mb-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400 flex items-center justify-between gap-2`}
        >
          <span>{docLoadError}</span>
          <button type="button" onClick={onDismissDocError} className="shrink-0 text-red-500/70 hover:text-red-500">
            <X className="w-3 h-3" />
          </button>
        </div>
      )}
      <div className={`${maxWidth} mx-auto relative`}>
        {showCommandMenu && (
          <div className="absolute bottom-full left-0 mb-2 w-full rounded-lg border border-border bg-card shadow-lg py-1 z-10 overflow-hidden">
            {commandMatches.map((c, i) => (
              <button
                key={c.cmd}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => applyCommand(c.cmd)}
                className={`w-full flex items-center gap-2 px-3 py-1.5 text-left transition-colors ${
                  i === commandIndex ? "bg-background-tertiary" : "hover:bg-background-tertiary"
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                <span className="text-[13px] text-foreground font-medium">{c.cmd}</span>
                <span className="text-[11px] text-foreground-muted truncate">{c.desc}</span>
              </button>
            ))}
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm shadow-[0_2px_8px_rgba(0,0,0,0.06)] focus-within:border-border-light focus-within:ring-1 focus-within:ring-accent-primary/15 transition-all">
          {image && (
            <div className="flex items-center gap-2 px-3 pt-2.5">
              <div className="relative shrink-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={image} alt="Attached" className="w-10 h-10 rounded-md object-cover border border-border" />
                <button
                  type="button"
                  onClick={() => setImage(null)}
                  title="Remove image"
                  className="absolute -top-1.5 -right-1.5 flex items-center justify-center w-4 h-4 rounded-full bg-foreground text-background cursor-pointer"
                >
                  <X className="w-2.5 h-2.5" />
                </button>
              </div>
            </div>
          )}

          {selectedDocIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 px-3 pt-2.5">
              {Array.from(selectedDocIds).map((id) => {
                const doc = allDocs.find((d) => d.id === id);
                if (!doc) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-background-tertiary border border-border text-xs text-foreground-secondary rounded-lg"
                  >
                    <FileText className="w-3 h-3 text-foreground-muted" />
                    <span className="max-w-[160px] truncate">{doc.name}</span>
                    <button
                      type="button"
                      onClick={() => onToggleDoc(id)}
                      className="text-foreground-muted hover:text-foreground cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          {attachError && (
            <div className="flex items-center justify-between gap-2 px-3 pt-2 text-[11px] text-red-500">
              <span>{attachError}</span>
              <button type="button" onClick={() => setAttachError(null)} className="shrink-0 text-red-500/70 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}
          {voiceError && (
            <div className="flex items-center justify-between gap-2 px-3 pt-2 text-[11px] text-red-500">
              <span>{voiceError}</span>
              <button type="button" onClick={() => setVoiceError(null)} className="shrink-0 text-red-500/70 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-end gap-2 px-3 pt-2.5">
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center justify-center w-6 h-6 rounded-md text-foreground-muted hover:text-foreground hover:bg-background-tertiary transition-colors shrink-0 cursor-pointer"
              title="Attach image"
            >
              <Plus className="w-4 h-4" />
            </button>
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => {
                onValueChange(e.target.value);
                e.target.style.height = "auto";
                e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
              }}
              onKeyDown={(e) => {
                if (showCommandMenu) {
                  if (e.key === "ArrowDown") {
                    e.preventDefault();
                    setCommandIndex((i) => (i + 1) % commandMatches.length);
                    return;
                  }
                  if (e.key === "ArrowUp") {
                    e.preventDefault();
                    setCommandIndex((i) => (i - 1 + commandMatches.length) % commandMatches.length);
                    return;
                  }
                  if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
                    e.preventDefault();
                    applyCommand(commandMatches[commandIndex].cmd);
                    return;
                  }
                  if (e.key === "Escape") {
                    e.preventDefault();
                    onValueChange("");
                    return;
                  }
                }
                if (e.key === "Enter" && !e.shiftKey && settings.enterToSend) {
                  e.preventDefault();
                  submit();
                }
              }}
              onPaste={handlePaste}
              rows={1}
              placeholder="Ask anything..."
              className="flex-1 resize-none bg-transparent text-foreground placeholder:text-foreground-muted text-sm outline-none py-1 max-h-40"
            />
          </div>

          <div className="flex items-center justify-between px-3 pb-2 pt-1">
            <div className="flex items-center gap-1 min-w-0">
              <div className="relative" ref={modeRef}>
                <button
                  type="button"
                  onClick={() => setModeOpen((v) => !v)}
                  className="flex items-center gap-1 h-8 px-2 text-xs text-foreground-muted hover:text-foreground hover:bg-background-tertiary rounded-md transition-colors cursor-pointer"
                >
                  <ModeIcon className="w-3.5 h-3.5" />
                  {modeLabel}
                  <ChevronDown className="w-3 h-3" />
                </button>
                {modeOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-56 rounded-lg border border-border bg-card shadow-lg py-1 px-0.5 z-10">
                    <button
                      type="button"
                      onClick={() => {
                        update({ chatMode: "ask", activeAgentId: null });
                        setModeOpen(false);
                      }}
                      className="w-[calc(100%-2px)] mx-px flex items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-background-tertiary rounded-md cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <MessageCircle className="w-3.5 h-3.5 text-foreground-muted" />
                        <span>
                          <span className="block text-[13px] text-foreground font-medium leading-tight">Ask</span>
                          <span className="block text-[11px] text-foreground-muted leading-tight">Normal chat</span>
                        </span>
                      </span>
                      {settings.chatMode === "ask" && !activeAgent && (
                        <Check className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        update({ chatMode: "plan", activeAgentId: null });
                        setModeOpen(false);
                      }}
                      className="w-[calc(100%-2px)] mx-px flex items-center justify-between gap-2 px-3 py-1.5 text-left transition-colors hover:bg-background-tertiary rounded-md cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <ListChecks className="w-3.5 h-3.5 text-foreground-muted" />
                        <span>
                          <span className="block text-[13px] text-foreground font-medium leading-tight">Plan</span>
                          <span className="block text-[11px] text-foreground-muted leading-tight">
                            Outline steps before acting
                          </span>
                        </span>
                      </span>
                      {settings.chatMode === "plan" && !activeAgent && (
                        <Check className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                      )}
                    </button>
                    {agents.length > 0 && (
                      <>
                        <div className="my-1 border-t border-border" />
                        <div className="px-3 pt-1 pb-0.5 text-[10px] font-medium text-foreground-muted uppercase tracking-wide">
                          Agents
                        </div>
                        <div className="max-h-40 overflow-y-auto">
                          {agents.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => {
                                update({ activeAgentId: a.id });
                                setModeOpen(false);
                              }}
                              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-left transition-colors hover:bg-background-tertiary cursor-pointer"
                            >
                              <span className="flex items-center gap-2 min-w-0">
                                <Bot className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                                <span className="text-[13px] text-foreground font-medium truncate">{a.name}</span>
                              </span>
                              {settings.activeAgentId === a.id && (
                                <Check className="w-3.5 h-3.5 text-accent-primary shrink-0" />
                              )}
                            </button>
                          ))}
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>

              <ModelSwitcher disabled={isLoading} />

              
            </div>

            {isLoading ? (
              <button
                type="button"
                onClick={onStop}
                title="Stop generating"
                className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background transition-colors shrink-0 cursor-pointer"
              >
                <Square className="w-3 h-3 fill-current" />
              </button>
            ) : isRecording || (!value.trim() && !image) ? (
              <button
                type="button"
                onClick={toggleRecording}
                disabled={isTranscribing}
                title={isRecording ? "Stop recording" : "Speak"}
                className={`flex items-center justify-center w-8 h-8 rounded-full transition-colors shrink-0 cursor-pointer ${
                  isRecording
                    ? "text-red-500 bg-red-500/10 animate-pulse"
                    : "bg-foreground text-background disabled:bg-background-tertiary disabled:text-foreground-muted"
                }`}
              >
                {isTranscribing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mic className="w-4 h-4" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={submit}
                disabled={disabled}
                className="flex items-center justify-center w-8 h-8 rounded-full bg-foreground text-background disabled:opacity-30 disabled:cursor-not-allowed transition-colors shrink-0 cursor-pointer"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
