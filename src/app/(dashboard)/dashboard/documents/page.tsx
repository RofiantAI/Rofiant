"use client";

import { FileText, Upload, FileSearch, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate as fmtDate } from "@/lib/user-prefs";

type Doc = {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "indexed" | "failed";
  created_at: string;
};

const SUPPORTED = ["pdf", "docx", "txt", "csv", "md"];
const ACCEPT = ".pdf,.docx,.txt,.csv,.md,text/plain,text/csv,text/markdown";

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/documents")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setDocs(data); })
      .finally(() => setLoading(false));
  }, []);

  async function uploadFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED.includes(ext)) {
      setUploadError(`Unsupported file type .${ext}. Accepted: ${SUPPORTED.join(", ")}`);
      return;
    }

    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setUploadError("Not authenticated."); return; }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: storageErr } = await supabase.storage.from("documents").upload(path, file);
    if (storageErr) {
      setUploading(false);
      setUploadError(`Storage error: ${storageErr.message}`);
      return;
    }

    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: ext.toUpperCase(), size: file.size, storage_path: path }),
    });
    const doc = await res.json();
    if (res.ok) {
      setDocs((prev) => [doc, ...prev]);
    } else {
      setUploadError(`Save error: ${doc.error ?? "Unknown error"}`);
    }
    setUploading(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) await uploadFile(file);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/documents/${id}`, { method: "DELETE" });
    setDocs((prev) => prev.filter((d) => d.id !== id));
    setDeleting(null);
  }

  function formatDate(iso: string) {
    return fmtDate(iso);
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-foreground">Documents</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Upload and manage documents for AI search and analysis
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-60 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload"}
        </button>
      </div>

      <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => { setUploadError(""); handleFiles(e.target.files); }} />

      {uploadError && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 text-xs text-red-400">
          {uploadError}
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
        onClick={() => fileRef.current?.click()}
        className={`bg-card border border-dashed p-12 text-center cursor-pointer transition-colors ${
          dragging ? "border-accent-primary bg-accent-primary/5" : "border-border hover:border-border-light"
        }`}
      >
        <div className="w-12 h-12 bg-background-tertiary flex items-center justify-center mx-auto mb-4">
          <FileText className="w-6 h-6" />
        </div>
        <h3 className="text-foreground font-medium">
          {uploading ? "Uploading…" : "Upload documents"}
        </h3>
        <p className="text-sm text-foreground-secondary mt-2 max-w-md mx-auto">
          Drag and drop files or click to browse. Documents are indexed for search
          and used by Chat AI for grounded responses.
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {SUPPORTED.map((type) => (
            <span key={type} className="px-2 py-1 text-xs font-mono bg-background-tertiary text-foreground-muted">
              .{type}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wider">
          All documents
        </h2>
        {loading ? (
          <div className="bg-card border border-border p-8 text-center text-sm text-foreground-muted">Loading…</div>
        ) : docs.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <FileSearch className="w-5 h-5 text-foreground-muted mx-auto mb-3" />
            <p className="text-sm text-foreground-secondary">
              No documents uploaded yet. Upload files to start searching and analyzing.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border">
            {docs.map((doc, i) => (
              <div
                key={doc.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < docs.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-foreground-muted shrink-0" />
                  <span className="text-sm text-foreground truncate">{doc.name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-foreground-muted">{doc.type}</span>
                  <span className="text-xs text-foreground-muted">{fmt(doc.size)}</span>
                  {doc.status === "indexed" ? (
                    <CheckCircle className="w-3 h-3 text-accent-success" />
                  ) : (
                    <Clock className="w-3 h-3 text-foreground-muted" />
                  )}
                  <span className="text-xs text-foreground-muted">{formatDate(doc.created_at)}</span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-1 hover:bg-background-tertiary transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3 h-3 text-foreground-muted" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
