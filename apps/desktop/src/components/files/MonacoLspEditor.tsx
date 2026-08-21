import { useEffect, useRef } from "react";
import { monaco } from "@/lib/monacoSetup";
import { LspClient } from "@/lib/lspClient";

const SEVERITY_TO_MONACO: Record<number, monaco.MarkerSeverity> = {
  1: monaco.MarkerSeverity.Error,
  2: monaco.MarkerSeverity.Warning,
  3: monaco.MarkerSeverity.Info,
  4: monaco.MarkerSeverity.Hint,
};

const COMPLETION_KIND_TO_MONACO: Record<number, monaco.languages.CompletionItemKind> = {
  1: monaco.languages.CompletionItemKind.Text,
  2: monaco.languages.CompletionItemKind.Method,
  3: monaco.languages.CompletionItemKind.Function,
  4: monaco.languages.CompletionItemKind.Constructor,
  5: monaco.languages.CompletionItemKind.Field,
  6: monaco.languages.CompletionItemKind.Variable,
  7: monaco.languages.CompletionItemKind.Class,
  8: monaco.languages.CompletionItemKind.Interface,
  9: monaco.languages.CompletionItemKind.Module,
  10: monaco.languages.CompletionItemKind.Property,
  14: monaco.languages.CompletionItemKind.Keyword,
  22: monaco.languages.CompletionItemKind.Struct,
};

interface LspHover {
  contents: string | { value: string } | Array<string | { value: string }>;
}

interface LspCompletionItem {
  label: string;
  kind?: number;
  detail?: string;
  insertText?: string;
}

function hoverToText(hover: LspHover | null): string {
  if (!hover) return "";
  const parts = Array.isArray(hover.contents) ? hover.contents : [hover.contents];
  return parts.map((p) => (typeof p === "string" ? p : p.value)).join("\n\n");
}

export function MonacoLspEditor({
  conversationId,
  path,
  route,
  languageId,
  monacoLanguage,
  value,
  onChange,
}: {
  conversationId: string;
  path: string;
  route: string;
  languageId: string;
  monacoLanguage: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  // path is part of the key the parent uses to remount this component per
  // file, so `value` here only ever matters as the initial buffer content.
  useEffect(() => {
    if (!containerRef.current) return;

    const editor = monaco.editor.create(containerRef.current, {
      value,
      language: monacoLanguage,
      automaticLayout: true,
      minimap: { enabled: false },
      fontSize: 12,
      fontFamily: "ui-monospace, monospace",
      theme: "vs-dark",
      // Our container sits inside an overflow-auto/flex ancestor (the Files
      // panel), which clips/misplaces Monaco's default absolutely-positioned
      // suggest/hover widgets — render them against the viewport instead.
      fixedOverflowWidgets: true,
    });

    const client = new LspClient(conversationId, route, languageId);
    let version = 1;
    let changeTimer: ReturnType<typeof setTimeout> | null = null;
    let disposed = false;

    const hoverProvider = monaco.languages.registerHoverProvider(monacoLanguage, {
      provideHover: async (_model, position) => {
        try {
          const result = (await client.hover(path, position.lineNumber - 1, position.column - 1)) as
            | LspHover
            | null;
          const text = hoverToText(result);
          if (!text) return null;
          return { contents: [{ value: text }] };
        } catch {
          return null;
        }
      },
    });

    const completionProvider = monaco.languages.registerCompletionItemProvider(monacoLanguage, {
      triggerCharacters: [".", "'", '"', "/"],
      provideCompletionItems: async (model, position) => {
        try {
          const result = (await client.completion(path, position.lineNumber - 1, position.column - 1)) as
            | LspCompletionItem[]
            | { items: LspCompletionItem[] }
            | null;
          const items = Array.isArray(result) ? result : (result?.items ?? []);
          const word = model.getWordUntilPosition(position);
          const range = {
            startLineNumber: position.lineNumber,
            endLineNumber: position.lineNumber,
            startColumn: word.startColumn,
            endColumn: word.endColumn,
          };
          return {
            suggestions: items.map((item) => ({
              label: item.label,
              kind: COMPLETION_KIND_TO_MONACO[item.kind ?? 1] ?? monaco.languages.CompletionItemKind.Text,
              detail: item.detail,
              insertText: item.insertText ?? item.label,
              range,
            })),
          };
        } catch {
          return { suggestions: [] };
        }
      },
    });

    client.onDiagnostics((_uri, diagnostics) => {
      const model = editor.getModel();
      if (!model || disposed) return;
      monaco.editor.setModelMarkers(
        model,
        "lsp",
        diagnostics.map((d) => ({
          severity: SEVERITY_TO_MONACO[d.severity ?? 1] ?? monaco.MarkerSeverity.Error,
          message: d.message,
          startLineNumber: d.range.start.line + 1,
          startColumn: d.range.start.character + 1,
          endLineNumber: d.range.end.line + 1,
          endColumn: d.range.end.character + 1,
        })),
      );
    });

    client
      .connect()
      .then(() => {
        if (disposed) return;
        client.didOpen(path, editor.getValue());
      })
      .catch((err) => {
        console.error("LSP connect failed", err);
      });

    const changeSub = editor.onDidChangeModelContent(() => {
      const text = editor.getValue();
      onChange(text);
      if (changeTimer) clearTimeout(changeTimer);
      changeTimer = setTimeout(() => {
        version += 1;
        client.didChange(path, text, version);
      }, 300);
    });

    return () => {
      disposed = true;
      if (changeTimer) clearTimeout(changeTimer);
      changeSub.dispose();
      hoverProvider.dispose();
      completionProvider.dispose();
      client.didClose(path);
      client.dispose();
      editor.dispose();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- one editor instance per mount, keyed by path upstream
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
