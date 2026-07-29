"use client";

import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, isTextUIPart } from "ai";
import { parseAssistantOutput } from "@/lib/chat-reasoning";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { MessageBubble, type MessageAttachment } from "./message-bubble";
import { ChatEmptyState } from "./chat-empty-state";
import { Composer } from "./composer";
import { useChatSettings } from "@/contexts/chat-settings-context";
import { playDoneSound } from "@/lib/chat-settings";
import { parseSlashCommand } from "@/lib/chat-commands";
import { loadRules, saveRules, rulesToPrompt, type Rule } from "@/lib/chat-rules";
import { loadAgents } from "@/lib/chat-agents";
import { CHAT_DISCLAIMER } from "@/lib/chat-copy";
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
const PENDING_IMAGE_KEY = (id: string) => `rofiant-pending-image-${id}`;

// Images/attachments are never persisted to Supabase — only the text is.
// An image-only send with no caption would otherwise store empty content,
// which comes back on reload as a bare empty-text history entry and makes
// the provider reject the whole conversation on the next request.
function historyContent(text: string, hasImage: boolean, hasAttachments: boolean): string {
  if (text) return text;
  if (hasImage) return "[Image]";
  if (hasAttachments) return "[Attachment]";
  return text;
}

// sessionStorage has a hard per-origin quota; a base64 image (or a large
// document) can blow past it even when nothing is actually wrong.
function trySessionStorageSet(key: string, value: string): boolean {
  try {
    sessionStorage.setItem(key, value);
    return true;
  } catch {
    return false;
  }
}

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

export function ChatWindow({
  conversationId,
  initialMessages,
}: {
  conversationId?: string;
  initialMessages?: InitialMessage[];
} = {}) {
  const router = useRouter();
  const { settings } = useChatSettings();
  const [activeId] = useState(conversationId);
  const [inputValue, setInputValue] = useState("");
  const didAutoSend = useRef(false);

  const [pendingMessage, setPendingMessage] = useState<string | null>(null);
  const pendingImageRef = useRef<string | undefined>(undefined);

  const bottomRef = useRef<HTMLDivElement>(null);

  // Document attachment state
  const [allDocs, setAllDocs] = useState<DocMeta[]>([]);
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());
  const [docLoadError, setDocLoadError] = useState("");
  // Pre-fetched content passed into body at send time
  const pendingDocContentsRef = useRef<{ name: string; text: string }[]>([]);
  // Maps user-message index (0-based) → attachments shown in that bubble
  const [msgAttachments, setMsgAttachments] = useState<
    Map<number, MessageAttachment[]>
  >(new Map());
  // Maps user-message index (0-based) → attached image shown in that bubble
  const [msgImages, setMsgImages] = useState<Map<number, string>>(new Map());
  const userMsgCountRef = useRef(0);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setAllDocs(data);
      })
      .catch(() => {});
  }, []);

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
      // body() is only invoked by useChat at send-time (not during this render),
      // so reading pendingDocContentsRef.current here is safe despite the lint.
      // eslint-disable-next-line react-hooks/refs
      new DefaultChatTransport({
        api: "/api/chat",
        body: () => {
          const agents = loadAgents();
          const agent = settings.activeAgentId
            ? agents.find((a) => a.id === settings.activeAgentId)
            : undefined;
          return {
            conversationId: activeId,
            model: settings.model,
            customInstructions: settings.customInstructions,
            contextLimit: settings.contextLimit,
            documentContents: pendingDocContentsRef.current,
            mode: settings.chatMode,
            agentSystemPrompt: agent?.systemPrompt,
            rulesPrompt: rulesToPrompt(loadRules()),
          };
        },
      }),
    [
      activeId,
      settings.model,
      settings.customInstructions,
      settings.contextLimit,
      settings.chatMode,
      settings.activeAgentId,
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
      // One-time cross-navigation handoff value; sessionStorage is unavailable
      // during SSR and this doesn't affect initial paint.
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    const imgKey = PENDING_IMAGE_KEY(conversationId);
    const imgVal = sessionStorage.getItem(imgKey);
    if (imgVal) {
      sessionStorage.removeItem(imgKey);
      pendingImageRef.current = imgVal;
      setMsgImages((prev) => new Map(prev).set(0, imgVal));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function supabaseInsertUserMessage(convId: string, content: string) {
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ conversationId: convId, content }),
    });
  }

  // Auto-send the pending message once it's read from sessionStorage.
  useEffect(() => {
    if (!pendingMessage || !activeId || didAutoSend.current) return;
    didAutoSend.current = true;
    router.refresh();
    supabaseInsertUserMessage(activeId, pendingMessage).then(() => {
      sendMessage({ text: pendingMessage }, { body: { image: pendingImageRef.current } });
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

  function pushLocalExchange(userText: string, replyText: string) {
    setMessages((prev) => [
      ...prev,
      { id: makeId(), role: "user", parts: [{ type: "text", text: userText }] },
      { id: makeId(), role: "assistant", parts: [{ type: "text", text: replyText }] },
    ]);
  }

  function handleSlashCommand(raw: string) {
    const command = parseSlashCommand(raw);
    if (!command) return false;

    switch (command.type) {
      case "clear": {
        setMessages([]);
        setMsgAttachments(new Map());
        setMsgImages(new Map());
        userMsgCountRef.current = 0;
        break;
      }
      case "rule-create": {
        if (!command.text) {
          pushLocalExchange(raw, "Usage: /rule create <rule text>");
          break;
        }
        const rule: Rule = { id: makeId(), text: command.text, createdAt: Date.now() };
        const next = [...loadRules(), rule];
        saveRules(next);
        pushLocalExchange(raw, `Added rule: "${command.text}"`);
        break;
      }
      case "rule-list": {
        const rules = loadRules();
        const listText = rules.length
          ? rules.map((r, i) => `${i + 1}. ${r.text}`).join("\n")
          : "No rules yet. Use /rule create <text> to add one.";
        pushLocalExchange(raw, listText);
        break;
      }
      case "rule-remove": {
        const rules = loadRules();
        const idx = Number(command.target) - 1;
        const target = rules[idx] ?? rules.find((r) => r.id === command.target);
        if (!target) {
          pushLocalExchange(raw, `No rule found for "${command.target}". Use /rule list to see rules.`);
          break;
        }
        saveRules(rules.filter((r) => r.id !== target.id));
        pushLocalExchange(raw, `Removed rule: "${target.text}"`);
        break;
      }
      case "unknown": {
        pushLocalExchange(raw, `Unknown command: ${command.raw}`);
        break;
      }
    }
    return true;
  }

  async function submit(textOverride?: string, image?: string) {
    const text = (textOverride ?? inputValue).trim();
    if ((!text && !image) || isLoading) return;
    setDocLoadError("");
    clearError();

    if (handleSlashCommand(text)) {
      setInputValue("");
      return;
    }

    // Index of the user message this send will create
    const idx = userMsgCountRef.current;

    // Pre-fetch doc contents before sending
    let attachmentMeta: MessageAttachment[] = [];
    if (selectedDocIds.size > 0) {
      setFetchingDocs(true);
      const contents = await fetchDocContents();
      setFetchingDocs(false);
      if (contents.length !== selectedDocIds.size) return; // error shown
      pendingDocContentsRef.current = contents;
      // Record which attachments go on this user message
      attachmentMeta = Array.from(selectedDocIds).map((id) => {
        const d = allDocs.find((x) => x.id === id);
        return { name: d?.name ?? id, type: d?.type ?? "" };
      });
      setMsgAttachments((prev) => new Map(prev).set(idx, attachmentMeta));
    } else {
      pendingDocContentsRef.current = [];
    }
    if (image) setMsgImages((prev) => new Map(prev).set(idx, image));
    userMsgCountRef.current += 1;
    setSelectedDocIds(new Set());

    setInputValue("");

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
      trySessionStorageSet(
        PENDING_KEY(conv.id),
        historyContent(text, !!image, attachmentMeta.length > 0),
      );
      if (attachmentMeta.length > 0) {
        trySessionStorageSet(
          PENDING_ATTACHMENTS_KEY(conv.id),
          JSON.stringify(attachmentMeta),
        );
        trySessionStorageSet(
          PENDING_DOC_CONTENTS_KEY(conv.id),
          JSON.stringify(pendingDocContentsRef.current),
        );
      }
      if (image && !trySessionStorageSet(PENDING_IMAGE_KEY(conv.id), image)) {
        setDocLoadError("Image too large to carry over — sent without it.");
      }
      router.push(`/chat/${conv.id}`);
    } else {
      await supabaseInsertUserMessage(
        activeId,
        historyContent(text, !!image, attachmentMeta.length > 0),
      );
      await sendMessage({ text }, { body: { image } });
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
    setMsgImages((prev) => {
      const next = new Map<number, string>();
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


  const isEmpty = messages.length === 0 && !pendingMessage;
  const msgFontSize = fontSizeClass[settings.fontSize];
  const msgDensity = densityClass[settings.density];

  function renderComposer(maxWidth = "max-w-3xl") {
    return (
      <Composer
        value={inputValue}
        onValueChange={setInputValue}
        onSubmit={(text, image) => submit(text, image)}
        isLoading={isLoading}
        onStop={stop}
        disabled={fetchingDocs}
        allDocs={allDocs}
        selectedDocIds={selectedDocIds}
        onToggleDoc={toggleDoc}
        docLoadError={docLoadError}
        onDismissDocError={() => setDocLoadError("")}
        maxWidth={maxWidth}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex-1 min-h-0 overflow-y-auto">
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
                const image =
                  m.role === "user" ? msgImages.get(userIdx) : undefined;
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
                    image={image}
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
