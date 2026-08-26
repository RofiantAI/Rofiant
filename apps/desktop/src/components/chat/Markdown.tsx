import { useState } from "react";
import { openUrl } from "@tauri-apps/plugin-opener";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Prism from "prismjs";
import "prismjs/components/prism-python";
import "prismjs/components/prism-bash";
import "prismjs/components/prism-json";
import "prismjs/components/prism-yaml";
import "prismjs/components/prism-markup";
import "prismjs/components/prism-markdown";
import "prismjs/components/prism-css";
import "prismjs/components/prism-typescript";
import "prismjs/components/prism-jsx";
import "prismjs/components/prism-tsx";
import "prismjs/components/prism-rust";
import "prismjs/components/prism-go";
import "prismjs/components/prism-sql";
import "prismjs/themes/prism-tomorrow.css";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/stores/useUIStore";

function CodeBlock({ lang, code }: { lang: string | undefined; code: string }) {
  const [copied, setCopied] = useState(false);
  const wrap = useUIStore((s) => s.wrapCodeBlocks);
  const grammar = lang && Prism.languages[lang];
  const html = grammar ? Prism.highlight(code, grammar, lang) : undefined;

  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-[#0d0d0d]">
      <div className="flex items-center justify-between border-b border-white/10 px-3 py-1.5 text-xs text-white/50">
        <span className="font-mono">{lang || "text"}</span>
        <button
          type="button"
          aria-label={copied ? "Copied" : "Copy code"}
          onClick={async () => {
            await navigator.clipboard.writeText(code);
            setCopied(true);
            window.setTimeout(() => setCopied(false), 1500);
          }}
          className="flex items-center gap-1 rounded px-1.5 py-0.5 transition-colors hover:bg-white/10 hover:text-white"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
      <pre
        className={cn(
          "p-3 font-mono text-[0.85em] leading-normal",
          wrap ? "whitespace-pre-wrap break-words" : "overflow-x-auto",
        )}
      >
        {html ? (
          <code dangerouslySetInnerHTML={{ __html: html }} />
        ) : (
          <code>{code}</code>
        )}
      </pre>
    </div>
  );
}

// Element styles live here rather than in a typography plugin: only these
// tags ever show up in model output, and each needs bubble-scale spacing
// (tight margins, no oversized headings) that prose defaults get wrong.
export function Markdown({ children, className }: { children: string; className?: string }) {
  return (
    <div className={cn("space-y-2 break-words", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="whitespace-pre-wrap">{children}</p>,
          ul: ({ children }) => <ul className="list-disc space-y-1 pl-5">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal space-y-1 pl-5">{children}</ol>,
          li: ({ children }) => <li className="[&>p]:inline">{children}</li>,
          h1: ({ children }) => <h1 className="text-base font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold">{children}</h3>,
          strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
          em: ({ children }) => <em className="italic">{children}</em>,
          a: ({ children, href }) => (
            <a
              href={href}
              rel="noreferrer"
              className="underline underline-offset-2"
              onClick={(e) => {
                // A plain target="_blank" anchor inside the Tauri webview
                // doesn't reliably route to the OS default browser (it can
                // launch whatever the platform associates with http(s), e.g.
                // an installed app) — openUrl always goes to the real browser.
                e.preventDefault();
                if (href) openUrl(href);
              }}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-current/30 pl-3 opacity-90">{children}</blockquote>
          ),
          hr: () => <hr className="border-current/20" />,
          // Fenced blocks carry a `language-xxx` class on the inner `code`
          // element; inline code doesn't. `pre` (below) reads that off its
          // child to render a highlighted CodeBlock instead, so this handler
          // only ever runs for genuine inline code.
          code: ({ children, className }) => {
            if (/language-/.test(className ?? "")) return <code className={className}>{children}</code>;
            return (
              <code className="rounded bg-black/25 px-1 py-0.5 font-mono text-[0.85em]">{children}</code>
            );
          },
          pre: ({ children }) => {
            const codeEl = Array.isArray(children) ? children[0] : children;
            const props = (codeEl as { props?: { className?: string; children?: unknown } })?.props ?? {};
            const lang = /language-(\w+)/.exec(props.className ?? "")?.[1];
            const code = String(props.children ?? "").replace(/\n$/, "");
            return <CodeBlock lang={lang} code={code} />;
          },
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-[0.9em]">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-current/20 px-2 py-1 font-semibold">{children}</th>
          ),
          td: ({ children }) => <td className="border border-current/20 px-2 py-1">{children}</td>,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
