"use client";

import { useEffect, useRef, useState } from "react";
import { FileText, Copy, Check, Pencil, X } from "lucide-react";
import { TypingDots } from "./thinking-block";
import { formatTime } from "@/lib/user-prefs";
import ReactMarkdown from "react-markdown";
import { PrismAsyncLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";

export type MessageAttachment = { name: string; type: string };

export function MessageBubble({
  role,
  content,
  loading,
  fontSize = "text-sm",
  showTimestamp = false,
  attachments,
  onEdit,
}: {
  role: "user" | "assistant" | string;
  content: string;
  loading?: boolean;
  fontSize?: string;
  showTimestamp?: boolean;
  attachments?: MessageAttachment[];
  onEdit?: (newContent: string) => void;
}) {
  const isUser = role === "user";
  const time = showTimestamp ? formatTime() : null;
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(content);
  const editRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isEditing && editRef.current) {
      const el = editRef.current;
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
      el.style.height = "auto";
      el.style.height = `${el.scrollHeight}px`;
    }
  }, [isEditing]);

  function startEdit() {
    setEditValue(content);
    setIsEditing(true);
  }

  function cancelEdit() {
    setIsEditing(false);
  }

  function saveEdit() {
    const trimmed = editValue.trim();
    setIsEditing(false);
    if (trimmed && trimmed !== content) onEdit?.(trimmed);
  }

  if (isUser) {
    if (isEditing) {
      return (
        <div className="flex flex-col items-end gap-2">
          <textarea
            ref={editRef}
            value={editValue}
            onChange={(e) => {
              setEditValue(e.target.value);
              e.target.style.height = "auto";
              e.target.style.height = `${e.target.scrollHeight}px`;
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                saveEdit();
              } else if (e.key === "Escape") {
                cancelEdit();
              }
            }}
            className={`max-w-[80%] min-w-[240px] w-full px-4 py-3 bg-background-tertiary text-foreground ${fontSize} leading-relaxed resize-none rounded-xl border border-border-light focus:outline-none focus:ring-1 focus:ring-accent-primary/20`}
            rows={1}
          />
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1 px-3 py-1.5 text-xs text-foreground-secondary hover:text-foreground rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
            <button
              type="button"
              onClick={saveEdit}
              disabled={!editValue.trim()}
              className="px-3 py-1.5 text-xs bg-foreground text-background rounded-lg hover:bg-foreground/90 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Send
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end gap-1 group/msg">
        <div
          className={`max-w-[85%] px-4 py-3 bg-background-tertiary/80 border border-border/60 text-foreground ${fontSize} leading-relaxed whitespace-pre-wrap rounded-2xl rounded-br-md`}
        >
          {content}
        </div>
        {attachments && attachments.length > 0 && (
          <div className="flex flex-wrap gap-1.5 justify-end max-w-[80%]">
            {attachments.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-background-secondary/80 border border-border text-xs text-foreground-secondary"
              >
                <FileText className="w-3 h-3 text-foreground-muted shrink-0" />
                <span className="max-w-[180px] truncate">{a.name}</span>
                <span className="text-foreground-muted font-mono">
                  {a.type}
                </span>
              </div>
            ))}
          </div>
        )}
        <div className="flex items-center gap-0.5 opacity-0 group-hover/msg:opacity-100 transition-opacity">
          <CopyButton text={content} />
          {onEdit && (
            <button
              type="button"
              onClick={startEdit}
              title="Edit"
              className="p-1.5 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background-tertiary transition-colors"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
        {time && <span className="text-xs text-foreground-muted">{time}</span>}
      </div>
    );
  }

  return (
    <div className="flex gap-3 items-start group/assistant">
      <div className="w-8 h-8 shrink-0 flex items-center justify-center mt-0.5">
        {/*Do not change icon*/}
        <img src="/icon.svg" alt="" className="w-[26px] h-auto" />
      </div>
      <div className="flex-1 min-w-0">
        <div
          className={`text-foreground ${fontSize} leading-relaxed pt-0.5 prose prose-invert max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-ol:my-1 prose-li:my-0 prose-pre:m-0 prose-pre:bg-transparent prose-pre:p-0 prose-pre:border-0 prose-code:bg-background-tertiary prose-code:px-1 prose-code:rounded [&_pre_code]:bg-transparent [&_pre_code]:p-0`}
        >
          {loading && !content ? (
            <TypingDots />
          ) : content ? (
            <ReactMarkdown components={{ pre: CodeBlock }}>
              {content}
            </ReactMarkdown>
          ) : null}
        </div>
        {time && !loading && (
          <span className="text-xs text-foreground-muted mt-1 block">
            {time}
          </span>
        )}
      </div>
    </div>
  );
}

function extractText(node: React.ReactNode): string {
  if (node == null || typeof node === "boolean") return "";
  if (typeof node === "string" || typeof node === "number") return String(node);
  if (Array.isArray(node)) return node.map(extractText).join("");
  if (
    typeof node === "object" &&
    "props" in node &&
    (node as React.ReactElement<{ children?: React.ReactNode }>).props
  ) {
    return extractText(
      (node as React.ReactElement<{ children?: React.ReactNode }>).props
        .children,
    );
  }
  return "";
}

function CopyButton({
  text,
  label = false,
}: {
  text: string;
  label?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy"
      className={
        label
          ? "flex items-center gap-1 text-xs text-foreground-muted hover:text-foreground transition-colors"
          : "p-1.5 text-foreground-muted hover:text-foreground rounded-lg hover:bg-background-tertiary transition-colors"
      }
    >
      {copied ? (
        <Check className="w-3.5 h-3.5" />
      ) : (
        <Copy className="w-3.5 h-3.5" />
      )}
      {label && <span>{copied ? "Copied" : "Copy"}</span>}
    </button>
  );
}

function getCodeElement(
  children: React.ReactNode,
):
  | React.ReactElement<{ className?: string; children?: React.ReactNode }>
  | undefined {
  const arr = Array.isArray(children) ? children : [children];
  return arr.find(
    (
      c,
    ): c is React.ReactElement<{
      className?: string;
      children?: React.ReactNode;
    }> => typeof c === "object" && c != null && "props" in c,
  );
}

function CodeBlock({ children }: React.HTMLAttributes<HTMLPreElement>) {
  const codeEl = getCodeElement(children);
  const codeText = extractText(codeEl?.props.children ?? children).replace(
    /\n$/,
    "",
  );
  const match = /language-(\w+)/.exec(codeEl?.props.className ?? "");
  const language = match?.[1] ?? "text";

  return (
    <div className="rounded-lg border border-border overflow-hidden my-3">
      <div className="flex items-center justify-between px-3 py-1.5 bg-background-secondary border-b border-border">
        <span className="text-xs text-foreground-muted font-mono">
          {language}
        </span>
        <CopyButton text={codeText} label />
      </div>
      <SyntaxHighlighter
        language={language}
        style={vscDarkPlus}
        customStyle={{
          margin: 0,
          padding: "1rem",
          background: "var(--background-tertiary)",
          fontSize: "0.8125rem",
          borderRadius: 0,
        }}
        codeTagProps={{ style: { fontFamily: "var(--font-mono, monospace)" } }}
      >
        {codeText}
      </SyntaxHighlighter>
    </div>
  );
}
