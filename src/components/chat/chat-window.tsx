"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  Paperclip,
  FileText,
  X,
  ChevronDown,
} from "lucide-react";
import { MessageBubble, type MessageAttachment } from "./message-bubble";
import { useChatSettings } from "@/contexts/chat-settings-context";
import { playDoneSound } from "@/lib/chat-settings";
import type { UIMessage } from "ai";

type DocMeta = { id: string; name: string; type: string };

const fontSizeClass = { sm: "text-xs", md: "text-sm", lg: "text-base" };
const densityClass = { compact: "space-y-3", comfortable: "space-y-6" };

type InitialMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

function toUIMessages(raw: InitialMessage[]): UIMessage[] {
  return raw.map((m) => ({
    id: m.id,
    role: m.role,
    parts: [{ type: "text" as const, text: m.content }],
    metadata: undefined,
  }));
}

const PENDING_KEY = (id: string) => `rofiant-pending-${id}`;

export function ChatWindow({
  conversationId,
  initialMessages,
  title,
}: {
  conversationId?: string;
  initialMessages?: InitialMessage[];
  title?: string;
} = {}) {
  const router = useRouter();
  const { settings } = useChatSettings();
  const [activeId] = useState(conversationId);
  const [inputValue, setInputValue] = useState("");
  const didAutoSend = useRef(false);

  const [pendingMessage, setPendingMessage] = useState<string | null>(null);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Document attachment state
  const [allDocs, setAllDocs] = useState<DocMeta[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [docPickerOpen, setDocPickerOpen] = useState(false);
  const [docLoadError, setDocLoadError] = useState("");
  const docPickerRef = useRef<HTMLDivElement>(null);
  // Pre-fetched content passed into body at send time
  const pendingDocContentsRef = useRef<{ name: string; text: string }[]>([]);
  // Maps user-message index (0-based) → attachments shown in that bubble
  const [msgAttachments, setMsgAttachments] = useState<Map<number, MessageAttachment[]>>(new Map());
  const userMsgCountRef = useRef(0);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllDocs(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (
        docPickerRef.current &&
        !docPickerRef.current.contains(e.target as Node)
      ) {
        setDocPickerOpen(false);
      }
    }
    if (docPickerOpen) document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [docPickerOpen]);

  function toggleDoc(id: string) {
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          conversationId: activeId,
          model: settings.model,
          customInstructions: settings.customInstructions,
          contextLimit: settings.contextLimit,
          documentContents: pendingDocContentsRef.current,
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeId,
      settings.model,
      settings.customInstructions,
      settings.contextLimit,
    ],
  );

  const { messages, sendMessage, status, stop } = useChat({
    messages: initialMessages ? toUIMessages(initialMessages) : undefined,
    transport,
    onFinish() {
      if (settings.responseSound) playDoneSound();
      router.refresh();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const [fetchingDocs, setFetchingDocs] = useState(false);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Read pending message from sessionStorage on mount (client-only, new chat flow).
  useEffect(() => {
    if (!conversationId) return;
    const key = PENDING_KEY(conversationId);
    const val = sessionStorage.getItem(key);
    if (val) {
      sessionStorage.removeItem(key);
      setPendingMessage(val);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Auto-send the pending message once it's read from sessionStorage.
  useEffect(() => {
    if (!pendingMessage || !activeId || didAutoSend.current) return;
    didAutoSend.current = true;
    router.refresh();
    supabaseInsertUserMessage(activeId, pendingMessage).then(() => {
      sendMessage({ text: pendingMessage });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingMessage]);

  async function fetchDocContents(): Promise<{ name: string; text: string }[]> {
    const results: { name: string; text: string }[] = [];
    for (const id of selectedDocIds) {
      const res = await fetch(`/api/documents/${id}/content`);
      if (res.ok) {
        const data = await res.json();
        results.push({ name: data.name, text: data.text });
      } else {
        const err = await res.json().catch(() => ({}));
        setDocLoadError(
          `Failed to load "${allDocs.find((d) => d.id === id)?.name ?? id}": ${err.error ?? res.status}`,
        );
        return [];
      }
    }
    return results;
  }

  async function submit() {
    if (!inputValue.trim() || isLoading) return;
    const text = inputValue.trim();
    setDocLoadError("");

    // Pre-fetch doc contents before sending
    if (selectedDocIds.size > 0) {
      setFetchingDocs(true);
      const contents = await fetchDocContents();
      setFetchingDocs(false);
      if (contents.length !== selectedDocIds.size) return; // error shown
      pendingDocContentsRef.current = contents;
      // Record which attachments go on this user message
      const idx = userMsgCountRef.current;
      const attachmentMeta: MessageAttachment[] = Array.from(selectedDocIds).map((id) => {
        const d = allDocs.find((x) => x.id === id);
        return { name: d?.name ?? id, type: d?.type ?? "" };
      });
      setMsgAttachments((prev) => new Map(prev).set(idx, attachmentMeta));
    } else {
      pendingDocContentsRef.current = [];
    }
    userMsgCountRef.current += 1;

    setInputValue("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";

    if (!activeId) {
      const res = await fetch("/api/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: settings.autoTitle ? text.slice(0, 60) : "New chat",
        }),
      });
      if (!res.ok) {
        console.error("Failed to create conversation:", await res.text());
        return;
      }
      const conv = await res.json();
      sessionStorage.setItem(PENDING_KEY(conv.id), text);
      router.push(`/chat/${conv.id}`);
    } else {
      await supabaseInsertUserMessage(activeId, text);
      await sendMessage({ text });
    }
  }

  async function supabaseInsertUserMessage(convId: string, content: string) {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, content }),
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  }

  function onTextareaChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInputValue(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
  }

  const isEmpty = messages.length === 0 && !pendingMessage;
  const msgFontSize = fontSizeClass[settings.fontSize];
  const msgDensity = densityClass[settings.density];

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center h-full gap-6 px-4">
            <div className="text-center">
              <img
                src="/logo-light.svg"
                alt="Rofiant"
                className="h-8 w-auto mx-auto mb-4"
              />
              <h1 className="text-2xl font-normal text-foreground">
                What can I help with?
              </h1>
            </div>
            <div className="grid grid-cols-2 gap-2 max-w-lg w-full">
              {[
                "Summarize this document",
                "Draft a policy memo",
                "Analyze this contract",
                "Generate an incident report",
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  onClick={() => {
                    setInputValue(suggestion);
                    textareaRef.current?.focus();
                  }}
                  className="text-left px-4 py-3 text-sm text-foreground-secondary border border-border hover:border-border-light hover:text-foreground transition-colors bg-card"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className={`max-w-3xl mx-auto px-4 py-8 ${msgDensity}`}>
            {(() => {
              let userIdx = 0;
              return messages.map((m) => {
                const text = m.parts
                  .filter(isTextUIPart)
                  .map((p) => p.text)
                  .join("");
                const attachments = m.role === "user" ? msgAttachments.get(userIdx) : undefined;
                if (m.role === "user") userIdx++;
                return (
                  <MessageBubble
                    key={m.id}
                    role={m.role}
                    content={text}
                    fontSize={msgFontSize}
                    showTimestamp={settings.showTimestamps}
                    attachments={attachments}
                  />
                );
              });
            })()}
            {isLoading && messages[messages.length - 1]?.role === "user" && (
              <MessageBubble
                role="assistant"
                content=""
                loading
                fontSize={msgFontSize}
              />
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <div className="px-4 pb-6 pt-2">
        {docLoadError && (
          <div className="max-w-3xl mx-auto mb-2 px-3 py-2 bg-red-500/10 border border-red-500/30 text-xs text-red-400">
            {docLoadError}
          </div>
        )}
        <div className="max-w-3xl mx-auto border border-border bg-card focus-within:border-border-light transition-colors">
          {/* Selected doc chips */}
          {selectedDocIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pt-3">
              {Array.from(selectedDocIds).map((id) => {
                const doc = allDocs.find((d) => d.id === id);
                if (!doc) return null;
                return (
                  <span
                    key={id}
                    className="inline-flex items-center gap-1.5 px-2 py-1 bg-background-tertiary border border-border text-xs text-foreground-secondary"
                  >
                    <FileText className="w-3 h-3 text-foreground-muted" />
                    <span className="max-w-[160px] truncate">{doc.name}</span>
                    <button
                      onClick={() => toggleDoc(id)}
                      className="text-foreground-muted hover:text-foreground"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                );
              })}
            </div>
          )}

          <textarea
            ref={textareaRef}
            value={inputValue}
            onChange={onTextareaChange}
            onKeyDown={onKeyDown}
            placeholder="Message Rofiant…"
            rows={1}
            className="w-full px-4 pt-4 pb-2 bg-transparent text-foreground placeholder:text-foreground-muted text-sm resize-none focus:outline-none"
            style={{ height: "auto" }}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            {/* Document picker */}
            <div className="relative" ref={docPickerRef}>
              <button
                type="button"
                onClick={() => setDocPickerOpen((v) => !v)}
                className={`flex items-center gap-1 h-8 px-2 text-xs transition-colors ${
                  selectedDocIds.size > 0
                    ? "text-accent-primary"
                    : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
                }`}
                title="Attach documents"
              >
                <Paperclip className="w-4 h-4" />
                {selectedDocIds.size > 0 && (
                  <span className="font-medium">{selectedDocIds.size}</span>
                )}
                <ChevronDown className="w-3 h-3" />
              </button>

              {docPickerOpen && (
                <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border shadow-lg z-50">
                  <div className="px-3 py-2 border-b border-border">
                    <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
                      Attach documents
                    </span>
                  </div>
                  {allDocs.length === 0 ? (
                    <div className="px-3 py-4 text-xs text-foreground-muted text-center">
                      No documents uploaded yet.{" "}
                      <a
                        href="/dashboard/documents"
                        className="text-accent-primary hover:underline"
                      >
                        Upload one →
                      </a>
                    </div>
                  ) : (
                    <div className="max-h-52 overflow-y-auto">
                      {allDocs.map((doc) => {
                        const checked = selectedDocIds.has(doc.id);
                        return (
                          <button
                            key={doc.id}
                            onClick={() => toggleDoc(doc.id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2.5 text-left text-sm transition-colors hover:bg-background-tertiary ${
                              checked
                                ? "text-foreground"
                                : "text-foreground-secondary"
                            }`}
                          >
                            <div
                              className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center ${
                                checked
                                  ? "border-accent-primary bg-accent-primary/20"
                                  : "border-border"
                              }`}
                            >
                              {checked && (
                                <div className="w-1.5 h-1.5 bg-accent-primary" />
                              )}
                            </div>
                            <FileText className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                            <span className="truncate text-xs">{doc.name}</span>
                            <span className="ml-auto text-[10px] text-foreground-muted shrink-0">
                              {doc.type}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={isLoading ? stop : submit}
              disabled={fetchingDocs || (!isLoading && !inputValue.trim())}
              className="flex items-center justify-center w-8 h-8 bg-foreground rounded-md text-background disabled:opacity-30 disabled:cursor-not-allowed hover:bg-foreground/90 transition-colors"
            >
              {isLoading ? (
                <Square className="w-3.5 h-3.5 fill-current" />
              ) : fetchingDocs ? (
                <span className="w-3.5 h-3.5 border border-background border-t-transparent rounded-full animate-spin" />
              ) : (
                <ArrowUp className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
        <p className="text-center text-xs text-foreground-muted mt-3">
          Rofiant AI can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  );
}
