import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, ChevronRight, Eye, File, Folder, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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
import { cn } from "@/lib/utils";
import { apiFetch } from "@/lib/api";
import { useUIStore } from "@/stores/useUIStore";
import { MonacoLspEditor } from "@/components/files/MonacoLspEditor";

// LSP is wired for these two backend language-server routes only (see
// backend/app/services/lsp.py LANGUAGE_SERVERS) — everything else keeps the
// plain Prism-highlighted textarea below.
const LSP_BY_EXT: Record<string, { route: "python" | "typescript"; languageId: string; monacoLanguage: string }> = {
  py: { route: "python", languageId: "python", monacoLanguage: "python" },
  ts: { route: "typescript", languageId: "typescript", monacoLanguage: "typescript" },
  tsx: { route: "typescript", languageId: "typescriptreact", monacoLanguage: "typescript" },
  js: { route: "typescript", languageId: "javascript", monacoLanguage: "javascript" },
  jsx: { route: "typescript", languageId: "javascriptreact", monacoLanguage: "javascript" },
};

function lspConfigForPath(path: string) {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext ? LSP_BY_EXT[ext] : undefined;
}

const LANG_BY_EXT: Record<string, string> = {
  py: "python",
  js: "javascript",
  jsx: "jsx",
  ts: "typescript",
  tsx: "tsx",
  json: "json",
  sh: "bash",
  bash: "bash",
  yml: "yaml",
  yaml: "yaml",
  html: "markup",
  xml: "markup",
  css: "css",
  rs: "rust",
  go: "go",
  sql: "sql",
  md: "markdown",
};

function languageForPath(path: string): string | undefined {
  const ext = path.split(".").pop()?.toLowerCase();
  return ext ? LANG_BY_EXT[ext] : undefined;
}

interface FileEntry {
  name: string;
  path: string;
  is_dir: boolean;
}

async function listFiles(conversationId: string, path: string): Promise<FileEntry[]> {
  const res = await apiFetch(`/api/workspaces/${conversationId}/files?path=${encodeURIComponent(path)}`);
  return res.json();
}

async function readFile(conversationId: string, path: string): Promise<string> {
  const res = await apiFetch(
    `/api/workspaces/${conversationId}/files/content?path=${encodeURIComponent(path)}`,
  );
  const data = await res.json();
  return data.content;
}

async function writeFile(conversationId: string, path: string, content: string): Promise<void> {
  await apiFetch(`/api/workspaces/${conversationId}/files/content?path=${encodeURIComponent(path)}`, {
    method: "PUT",
    body: JSON.stringify({ content }),
  });
}

async function deleteEntry(conversationId: string, path: string): Promise<void> {
  await apiFetch(`/api/workspaces/${conversationId}/files?path=${encodeURIComponent(path)}`, {
    method: "DELETE",
  });
}

async function renameEntry(conversationId: string, path: string, newName: string): Promise<void> {
  await apiFetch(
    `/api/workspaces/${conversationId}/files/rename?path=${encodeURIComponent(path)}&new_name=${encodeURIComponent(newName)}`,
    { method: "POST" },
  );
}

export function FilesPanel() {
  const activeConversationId = useUIStore((s) => s.activeConversationId);
  const [childrenByPath, setChildrenByPath] = useState<Record<string, FileEntry[]>>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [selectedContent, setSelectedContent] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<"view" | "edit">("view");
  const [saving, setSaving] = useState(false);
  const [menuOpenPath, setMenuOpenPath] = useState<string | null>(null);
  const [renamingPath, setRenamingPath] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{ entry: FileEntry; dirKey: string } | null>(null);
  const confirmBeforeDelete = useUIStore((s) => s.confirmBeforeDelete);
  const editHighlightRef = useRef<HTMLPreElement>(null);
  const readRequestRef = useRef(0);

  const loadDir = useCallback(
    async (path: string) => {
      if (!activeConversationId) return;
      try {
        const entries = await listFiles(activeConversationId, path);
        setChildrenByPath((prev) => ({ ...prev, [path]: entries }));
        setError(null);
      } catch {
        setError("No workspace yet. The agent creates one the first time it uses a tool.");
      }
    },
    [activeConversationId],
  );

  useEffect(() => {
    readRequestRef.current += 1;
    setChildrenByPath({});
    setExpanded(new Set());
    setSelected(null);
    setSelectedContent(null);
    setError(null);
    if (activeConversationId) loadDir(".");
  }, [activeConversationId, loadDir]);

  function toggleFolder(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
        if (!childrenByPath[path]) loadDir(path);
      }
      return next;
    });
  }

  async function selectFile(path: string) {
    const request = ++readRequestRef.current;
    const conversationId = activeConversationId;
    setSelected(path);
    setMode("view");
    if (!conversationId) return;
    try {
      const content = await readFile(conversationId, path);
      if (request === readRequestRef.current && useUIStore.getState().activeConversationId === conversationId) {
        setSelectedContent(content);
      }
    } catch (err) {
      if (request === readRequestRef.current && useUIStore.getState().activeConversationId === conversationId) {
        setSelectedContent(`// failed to load file\n// ${err instanceof Error ? err.message : String(err)}`);
      }
    }
  }

  function clearSelectionUnder(path: string) {
    if (selected === path || selected?.startsWith(`${path}/`)) {
      setSelected(null);
      setSelectedContent(null);
    }
  }

  async function removeEntry(entry: FileEntry, dirKey: string) {
    if (!activeConversationId) return;
    try {
      await deleteEntry(activeConversationId, entry.path);
      clearSelectionUnder(entry.path);
      await loadDir(dirKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete");
    }
  }

  async function commitRename(entry: FileEntry, dirKey: string, newName: string) {
    setRenamingPath(null);
    if (!activeConversationId || !newName.trim() || newName === entry.name) return;
    try {
      await renameEntry(activeConversationId, entry.path, newName.trim());
      clearSelectionUnder(entry.path);
      await loadDir(dirKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to rename");
    }
  }

  async function saveFile() {
    if (!activeConversationId || !selected || selectedContent === null) return;
    setSaving(true);
    try {
      await writeFile(activeConversationId, selected, selectedContent);
      setMode("view");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save file");
    } finally {
      setSaving(false);
    }
  }

  const rootEntries = childrenByPath["."];

  const highlightedHtml = useMemo(() => {
    if (!selected || !selectedContent) return null;
    const lang = languageForPath(selected);
    const grammar = lang && Prism.languages[lang];
    if (!grammar) return null;
    return Prism.highlight(selectedContent, grammar, lang);
  }, [selected, selectedContent]);

  return (
    <div className="flex h-full">
      <div className="w-56 shrink-0 overflow-y-auto border-r border-border p-2">
        {!activeConversationId ? (
          <p className="p-2 text-xs text-muted-foreground">No conversation selected.</p>
        ) : error ? (
          <p className="p-2 text-xs text-muted-foreground">{error}</p>
        ) : rootEntries === undefined ? (
          <p className="p-2 text-xs text-muted-foreground">Loading...</p>
        ) : rootEntries.length === 0 ? (
          <p className="p-2 text-xs text-muted-foreground">Empty workspace.</p>
        ) : (
          <FileTreeNodes
            entries={rootEntries}
            dirKey="."
            depth={0}
            expanded={expanded}
            childrenByPath={childrenByPath}
            onToggleFolder={toggleFolder}
            onSelectFile={selectFile}
            selected={selected}
            menuOpenPath={menuOpenPath}
            setMenuOpenPath={setMenuOpenPath}
            renamingPath={renamingPath}
            setRenamingPath={setRenamingPath}
            onRename={commitRename}
            onDelete={(entry, dirKey) => {
              if (confirmBeforeDelete) setDeleteTarget({ entry, dirKey });
              else removeEntry(entry, dirKey);
            }}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        {selected && (
          <div className="flex shrink-0 items-center justify-between border-b border-border px-3 py-1.5">
            <span className="truncate text-xs text-muted-foreground">{selected}</span>
            <div className="flex items-center gap-1">
              {mode === "edit" && (
                <button
                  onClick={saveFile}
                  disabled={saving}
                  className="rounded-md px-2 py-1 text-xs font-medium text-primary hover:bg-accent disabled:opacity-50"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              )}
              <div className="flex items-center rounded-md bg-secondary p-0.5">
                <button
                  onClick={() => setMode("view")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-xs",
                    mode === "view" ? "bg-accent text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Eye className="h-3 w-3" /> View
                </button>
                <button
                  onClick={() => setMode("edit")}
                  className={cn(
                    "flex items-center gap-1 rounded px-2 py-1 text-xs",
                    mode === "edit" ? "bg-accent text-foreground" : "text-muted-foreground",
                  )}
                >
                  <Pencil className="h-3 w-3" /> Edit
                </button>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-auto p-3 font-mono text-xs">
          {!selected ? (
            <p className="text-muted-foreground">Select a file to view its contents.</p>
          ) : mode === "edit" && activeConversationId && lspConfigForPath(selected) ? (
            <MonacoLspEditor
              key={selected}
              conversationId={activeConversationId}
              path={selected}
              value={selectedContent ?? ""}
              onChange={setSelectedContent}
              {...lspConfigForPath(selected)!}
            />
          ) : mode === "edit" ? (
            <div className="relative h-full w-full">
              {highlightedHtml && (
                <pre
                  ref={editHighlightRef}
                  aria-hidden
                  className="pointer-events-none absolute inset-0 overflow-auto whitespace-pre-wrap"
                  dangerouslySetInnerHTML={{ __html: highlightedHtml }}
                />
              )}
              <textarea
                value={selectedContent ?? ""}
                onChange={(e) => setSelectedContent(e.target.value)}
                onScroll={(e) => {
                  const pre = editHighlightRef.current;
                  if (pre) {
                    pre.scrollTop = e.currentTarget.scrollTop;
                    pre.scrollLeft = e.currentTarget.scrollLeft;
                  }
                }}
                spellCheck={false}
                className={cn(
                  "relative h-full w-full resize-none whitespace-pre-wrap bg-transparent outline-none",
                  highlightedHtml ? "text-transparent caret-foreground" : "text-foreground/90",
                )}
              />
            </div>
          ) : highlightedHtml ? (
            <pre
              className="whitespace-pre-wrap"
              dangerouslySetInnerHTML={{ __html: highlightedHtml }}
            />
          ) : (
            <pre className="whitespace-pre-wrap text-foreground/90">{selectedContent}</pre>
          )}
        </div>
      </div>

      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onKeyDown={(e) => {
          if (e.key === "Escape") setDeleteTarget(null);
          if (e.key !== "Tab") return;
          const controls = Array.from(e.currentTarget.querySelectorAll<HTMLElement>("button"));
          const first = controls[0];
          const last = controls[controls.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus(); }
        }}>
          <div role="dialog" aria-modal="true" aria-labelledby="delete-file-title" className="w-80 rounded-xl border border-border bg-card p-4">
            <p id="delete-file-title" className="text-sm font-medium text-foreground">Delete "{deleteTarget.entry.name}"?</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {deleteTarget.entry.is_dir ? "The folder and everything in it. " : ""}This can't be undone.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setDeleteTarget(null)}
                autoFocus
                className="rounded-lg px-3 py-1.5 text-sm text-foreground hover:bg-accent"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  removeEntry(deleteTarget.entry, deleteTarget.dirKey);
                  setDeleteTarget(null);
                }}
                className="rounded-lg bg-destructive px-3 py-1.5 text-sm text-destructive-foreground hover:opacity-90"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FileTreeNodes({
  entries,
  dirKey,
  depth,
  expanded,
  childrenByPath,
  onToggleFolder,
  onSelectFile,
  selected,
  menuOpenPath,
  setMenuOpenPath,
  renamingPath,
  setRenamingPath,
  onRename,
  onDelete,
}: {
  entries: FileEntry[];
  dirKey: string;
  depth: number;
  expanded: Set<string>;
  childrenByPath: Record<string, FileEntry[]>;
  onToggleFolder: (path: string) => void;
  onSelectFile: (path: string) => void;
  selected: string | null;
  menuOpenPath: string | null;
  setMenuOpenPath: (path: string | null) => void;
  renamingPath: string | null;
  setRenamingPath: (path: string | null) => void;
  onRename: (entry: FileEntry, dirKey: string, newName: string) => void;
  onDelete: (entry: FileEntry, dirKey: string) => void;
}) {
  return (
    <ul className="text-sm">
      {entries.map((entry) => {
        const isOpen = expanded.has(entry.path);
        return (
          <li key={entry.path} className="group/row relative">
            <button
              onClick={() => (entry.is_dir ? onToggleFolder(entry.path) : onSelectFile(entry.path))}
              aria-expanded={entry.is_dir ? isOpen : undefined}
              style={{ paddingLeft: `${depth * 14 + 8}px` }}
              className={cn(
                "flex w-full items-center gap-1.5 rounded-md py-1 pr-2 text-left hover:bg-accent",
                selected === entry.path && "bg-accent",
              )}
            >
              {entry.is_dir ? (
                isOpen ? (
                  <ChevronDown className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                )
              ) : (
                <File className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
              )}
              {entry.is_dir && <Folder className="h-3.5 w-3.5 shrink-0 text-primary" />}
              {renamingPath === entry.path ? (
                <input
                  autoFocus
                  defaultValue={entry.name}
                  onClick={(e) => e.stopPropagation()}
                  onBlur={(e) => onRename(entry, dirKey, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onRename(entry, dirKey, e.currentTarget.value);
                    if (e.key === "Escape") setRenamingPath(null);
                  }}
                  className="min-w-0 flex-1 rounded-md bg-background px-1.5 py-0.5 text-sm text-foreground focus:outline-none"
                />
              ) : (
                <span className="truncate">{entry.name}</span>
              )}
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpenPath(menuOpenPath === entry.path ? null : entry.path);
              }}
              aria-label={`Actions for ${entry.name}`}
              className="absolute right-1 top-0.5 flex items-center justify-center rounded-md p-1 text-muted-foreground opacity-0 hover:bg-secondary hover:text-foreground focus:opacity-100 group-hover/row:opacity-100 group-focus-within/row:opacity-100"
            >
              <MoreHorizontal className="h-3.5 w-3.5" />
            </button>

            {menuOpenPath === entry.path && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setMenuOpenPath(null)} />
                <div className="absolute right-1 top-7 z-20 w-32 overflow-hidden rounded-lg border border-border bg-popover py-1 shadow-lg">
                  <button
                    onClick={() => {
                      setMenuOpenPath(null);
                      setRenamingPath(entry.path);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-foreground hover:bg-accent"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Rename
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpenPath(null);
                      onDelete(entry, dirKey);
                    }}
                    className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm text-destructive hover:bg-accent"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </>
            )}
            {entry.is_dir && isOpen && childrenByPath[entry.path] && (
              <FileTreeNodes
                entries={childrenByPath[entry.path]}
                dirKey={entry.path}
                depth={depth + 1}
                expanded={expanded}
                childrenByPath={childrenByPath}
                onToggleFolder={onToggleFolder}
                onSelectFile={onSelectFile}
                selected={selected}
                menuOpenPath={menuOpenPath}
                setMenuOpenPath={setMenuOpenPath}
                renamingPath={renamingPath}
                setRenamingPath={setRenamingPath}
                onRename={onRename}
                onDelete={onDelete}
              />
            )}
          </li>
        );
      })}
    </ul>
  );
}
