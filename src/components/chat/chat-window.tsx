"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import { parseAssistantOutput } from "@/lib/chat-reasoning";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowUp,
  Square,
  Paperclip,
  FileText,
  X,
  ChevronDown,
  PanelLeftOpen,
} from "lucide-react";
import { MessageBubble, type MessageAttachment } from "./message-bubble";
import { ChatEmptyState } from "./chat-empty-state";
import { ModelSwitcher } from "./model-switcher";
import { useChatSettings } from "@/contexts/chat-settings-context";
import { useChatShell } from "@/contexts/chat-shell-context";
import { playDoneSound } from "@/lib/chat-settings";
import { CHAT_DISCLAIMER, CHAT_INPUT_PLACEHOLDER } from "@/lib/chat-copy";
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
const PENDING_ATTACHMENTS_KEY = (id: string) =>
  `rofiant-pending-attachments-${id}`;
const PENDING_DOC_CONTENTS_KEY = (id: string) =>
  `rofiant-pending-doc-contents-${id}`;

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
  const { sidebarOpen, openSidebar } = useChatShell();
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
  const [msgAttachments, setMsgAttachments] = useState<
    Map<number, MessageAttachment[]>
  >(new Map());
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

  const uiInitialMessages = useMemo(
    () => (initialMessages ? toUIMessages(initialMessages) : undefined),
    [initialMessages],
  );

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => ({
          conversationId: activeId,
          model: settings.model,
          customInstructions: settings.customInstructions,
          contextLimit: settings.contextLimit,
          knowledgeBaseId: settings.knowledgeBaseId || undefined,
          documentContents: pendingDocContentsRef.current,
        }),
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      activeId,
      settings.model,
      settings.customInstructions,
      settings.contextLimit,
      settings.knowledgeBaseId,
    ],
  );

  const {
    messages,
    sendMessage,
    setMessages,
    status,
    stop,
    error,
    clearError,
    regenerate,
  } = useChat({
    messages: uiInitialMessages,
    transport,
    onFinish() {
      if (settings.responseSound) playDoneSound();
      router.refresh();
    },
  });

  const isLoading = status === "streaming" || status === "submitted";
  const [fetchingDocs, setFetchingDocs] = useState(false);

  const lastMessageId = messages.at(-1)?.id;

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastMessageId, messages.length, isLoading]);

  // Read pending message from sessionStorage on mount (client-only, new chat flow).
  useEffect(() => {
    if (!conversationId) return;
    const key = PENDING_KEY(conversationId);
    const val = sessionStorage.getItem(key);
    if (val) {
      sessionStorage.removeItem(key);
      setPendingMessage(val);
      userMsgCountRef.current = 1;
    }
    const attKey = PENDING_ATTACHMENTS_KEY(conversationId);
    const attVal = sessionStorage.getItem(attKey);
    if (attVal) {
      sessionStorage.removeItem(attKey);
      const attachmentMeta: MessageAttachment[] = JSON.parse(attVal);
      setMsgAttachments((prev) => new Map(prev).set(0, attachmentMeta));
    }
    const docKey = PENDING_DOC_CONTENTS_KEY(conversationId);
    const docVal = sessionStorage.getItem(docKey);
    if (docVal) {
      sessionStorage.removeItem(docKey);
      pendingDocContentsRef.current = JSON.parse(docVal);
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

  async function submit(textOverride?: string) {
    const text = (textOverride ?? inputValue).trim();
    if (!text || isLoading) return;
    setDocLoadError("");
    clearError();

    // Pre-fetch doc contents before sending
    let attachmentMeta: MessageAttachment[] = [];
    if (selectedDocIds.size > 0) {
      setFetchingDocs(true);
      const contents = await fetchDocContents();
      setFetchingDocs(false);
      if (contents.length !== selectedDocIds.size) return; // error shown
      pendingDocContentsRef.current = contents;
      // Record which attachments go on this user message
      const idx = userMsgCountRef.current;
      attachmentMeta = Array.from(selectedDocIds).map((id) => {
        const d = allDocs.find((x) => x.id === id);
        return { name: d?.name ?? id, type: d?.type ?? "" };
      });
      setMsgAttachments((prev) => new Map(prev).set(idx, attachmentMeta));
    } else {
      pendingDocContentsRef.current = [];
    }
    userMsgCountRef.current += 1;
    setSelectedDocIds(new Set());

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
      if (attachmentMeta.length > 0) {
        sessionStorage.setItem(
          PENDING_ATTACHMENTS_KEY(conv.id),
          JSON.stringify(attachmentMeta),
        );
        sessionStorage.setItem(
          PENDING_DOC_CONTENTS_KEY(conv.id),
          JSON.stringify(pendingDocContentsRef.current),
        );
      }
      router.push(`/chat/${conv.id}`);
    } else {
      await supabaseInsertUserMessage(activeId, text);
      await sendMessage({ text });
    }
  }

  async function handleEditMessage(index: number, content: string) {
    const truncated = messages.slice(0, index);
    const newUserCount = truncated.filter((m) => m.role === "user").length;
    setMessages(truncated);
    setMsgAttachments((prev) => {
      const next = new Map<number, MessageAttachment[]>();
      prev.forEach((v, k) => {
        if (k < newUserCount) next.set(k, v);
      });
      return next;
    });
    userMsgCountRef.current = newUserCount + 1;
    clearError();
    if (activeId) {
      await supabaseInsertUserMessage(activeId, content);
    }
    await sendMessage({ text: content });
  }

  async function supabaseInsertUserMessage(convId: string, content: string) {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, content }),
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey && settings.enterToSend) {
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
  const showTopBar = !sidebarOpen || Boolean(title);

  function renderTopBar() {
    if (!showTopBar) return null;

    return (
      <header className="shrink-0 flex items-center h-12 px-3 border-b border-border/60 bg-background/80 backdrop-blur-sm">
        {!sidebarOpen ? (
          <button
            type="button"
            onClick={openSidebar}
            className="flex items-center justify-center w-8 h-8 shrink-0 rounded-lg border border-border/60 text-foreground-muted hover:text-foreground hover:bg-background-tertiary hover:border-border transition-colors"
            title="Open sidebar"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-8 shrink-0" aria-hidden />
        )}
        {title ? (
          <h1 className="flex-1 min-w-0 text-center text-sm font-medium text-foreground truncate px-2">
            {title}
          </h1>
        ) : (
          <div className="flex-1" />
        )}
        <div className="w-8 shrink-0" aria-hidden />
      </header>
    );
  }

  function renderComposer(maxWidth = "max-w-3xl") {
    return (
      <>
        {docLoadError && (
          <div
            className={`${maxWidth} mx-auto mb-2 px-3 py-2.5 rounded-lg bg-red-500/10 border border-red-500/30 text-xs text-red-400`}
          >
            {docLoadError}
          </div>
        )}
        <div
          className={`${maxWidth} mx-auto border border-border bg-card/80 backdrop-blur-sm focus-within:border-border-light focus-within:ring-1 focus-within:ring-accent-primary/15 transition-all rounded-2xl shadow-sm`}
        >
          {selectedDocIds.size > 0 && (
            <div className="flex flex-wrap gap-1.5 px-4 pt-3">
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
            placeholder={CHAT_INPUT_PLACEHOLDER}
            rows={1}
            className="w-full px-4 pt-4 pb-2 bg-transparent text-foreground placeholder:text-foreground-muted text-sm resize-none focus:outline-none"
            style={{ height: "auto" }}
          />
          <div className="flex items-center justify-between px-3 pb-3">
            <div className="flex items-center gap-1 min-w-0">
              <ModelSwitcher disabled={isLoading} />
              <div className="relative" ref={docPickerRef}>
                <button
                  type="button"
                  onClick={() => setDocPickerOpen((v) => !v)}
                  className={`flex items-center gap-1 h-8 px-2 text-xs transition-colors rounded-md ${
                    selectedDocIds.size > 0
                      ? "text-accent-primary"
                      : "text-foreground-muted hover:text-foreground hover:bg-background-tertiary"
                  }`}
                  title="Attach a file"
                >
                  <Paperclip className="w-4 h-4" />
                  {selectedDocIds.size > 0 && (
                    <span className="font-medium">{selectedDocIds.size}</span>
                  )}
                  <ChevronDown className="w-3 h-3" />
                </button>

                {docPickerOpen && (
                  <div className="absolute bottom-full left-0 mb-2 w-64 bg-card border border-border rounded-xl shadow-xl z-50 overflow-auto">
                    <div className="px-3 py-2 border-b border-border">
                      <span className="text-[10px] font-medium uppercase tracking-widest text-foreground-muted">
                        Your files
                      </span>
                    </div>
                    {allDocs.length === 0 ? (
                      <div className="px-3 py-4 text-xs text-foreground-muted text-center">
                        No files yet.{" "}
                        <a
                          href="/dashboard/documents"
                          className="text-accent-primary hover:underline"
                        >
                          Add some →
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
                                className={`w-3.5 h-3.5 border shrink-0 flex items-center justify-center rounded-sm ${
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
                              <span className="truncate text-xs">
                                {doc.name}
                              </span>
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
            </div>

            <button
              type="button"
              onClick={isLoading ? stop : () => submit()}
              disabled={fetchingDocs || (!isLoading && !inputValue.trim())}
              className={`flex items-center justify-center w-9 h-9 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                inputValue.trim() && !isLoading
                  ? "bg-foreground text-background hover:bg-foreground/90 shadow-sm"
                  : isLoading
                    ? "bg-foreground text-background hover:bg-foreground/90"
                    : "bg-background-tertiary text-foreground-muted border border-border"
              }`}
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
      </>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {renderTopBar()}

      <div className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex flex-col items-center justify-center min-h-full px-4 py-10">
            <div className="w-full max-w-2xl">
              <ChatEmptyState />
              <div className="mt-6">{renderComposer("max-w-2xl")}</div>
              <p className="text-center text-xs text-foreground-muted mt-4">
                {CHAT_DISCLAIMER}
              </p>
            </div>
          </div>
        ) : (
          <div className={`max-w-3xl mx-auto px-4 py-8 ${msgDensity}`}>
            {(() => {
              let userIdx = 0;
              return messages.map((m, i) => {
                const rawText = m.parts
                  .filter(isTextUIPart)
                  .map((p) => p.text)
                  .join("");
                const parsed = parseAssistantOutput(rawText);
                const isStreamingAssistant =
                  isLoading &&
                  i === messages.length - 1 &&
                  m.role === "assistant";
                const attachments =
                  m.role === "user" ? msgAttachments.get(userIdx) : undefined;
                if (m.role === "user") userIdx++;
                return (
                  <MessageBubble
                    key={m.id}
                    role={m.role}
                    content={m.role === "assistant" ? parsed.answer : rawText}
                    loading={
                      isStreamingAssistant &&
                      (parsed.isThinking || !parsed.answer)
                    }
                    fontSize={msgFontSize}
                    showTimestamp={settings.showTimestamps}
                    attachments={attachments}
                    onEdit={
                      m.role === "user" && !isLoading
                        ? (newContent: string) =>
                            handleEditMessage(i, newContent)
                        : undefined
                    }
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
            {error && !isLoading && (
              <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">
                <span>
                  {error.message ||
                    "Something went wrong generating a response."}
                </span>
                <div className="flex items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => regenerate()}
                    className="underline hover:no-underline"
                  >
                    Retry
                  </button>
                  <button
                    type="button"
                    onClick={() => clearError()}
                    className="text-red-400/70 hover:text-red-400"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {!isEmpty && (
        <div className="relative shrink-0">
          <div className="pointer-events-none absolute -top-8 left-0 right-0 h-8 bg-gradient-to-t from-background to-transparent" />
          <div className="px-4 pb-6 pt-2 bg-background">
            {renderComposer()}
            <p className="text-center text-xs text-foreground-muted mt-3 max-w-3xl mx-auto">
              {CHAT_DISCLAIMER}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
