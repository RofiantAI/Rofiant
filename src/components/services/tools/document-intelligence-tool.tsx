"use client";

import { FileText, Upload, FileSearch, CheckCircle, Clock, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate as fmtDate } from "@/lib/user-prefs";
import { useTranslations } from "next-intl";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardSection,
  DashboardList,
  DashboardEmptyState,
  DashboardAlert,
  DashboardPrimaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows } from "@/components/ui/skeleton";
import { ContradictionScanner } from "@/components/services/tools/contradiction-scanner";

type Doc = {
  id: string;
  name: string;
  type: string;
  size: number;
  status: "uploading" | "indexed" | "failed";
  category?: string | null;
  created_at: string;
};

type SearchResult = {
  id: string;
  name: string;
  type: string;
  category?: string | null;
  excerpts: string[];
};

const SUPPORTED = ["pdf", "docx", "txt", "csv", "md"];
const ACCEPT = ".pdf,.docx,.txt,.csv,.md,text/plain,text/csv,text/markdown";

function fmt(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function DocumentIntelligenceTool({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("dashboard.documents");
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
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
      setUploadError(t("errors.unsupportedType", { ext, types: SUPPORTED.join(", ") }));
      return;
    }

    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setUploadError(t("errors.notAuthenticated")); return; }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: storageErr } = await supabase.storage.from("documents").upload(path, file);
    if (storageErr) {
      setUploading(false);
      setUploadError(t("errors.storageError", { message: storageErr.message }));
      return;
    }

    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, type: ext.toUpperCase(), size: file.size, storage_path: path }),
    });
    const doc = await res.json();
    if (res.ok) setDocs((prev) => [doc, ...prev]);
    else setUploadError(t("errors.saveError", { message: doc.error ?? t("errors.unknownError") }));
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

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!searchQuery.trim()) { setSearchResults([]); return; }
    setSearching(true);
    const res = await fetch(`/api/documents/search?q=${encodeURIComponent(searchQuery.trim())}`);
    const data = await res.json();
    setSearchResults(Array.isArray(data.results) ? data.results : []);
    setSearching(false);
  }

  const body = (
    <>
      <input ref={fileRef} type="file" accept={ACCEPT} multiple className="hidden" onChange={(e) => { setUploadError(""); handleFiles(e.target.files); }} />

      {uploadError && <DashboardAlert>{uploadError}</DashboardAlert>}

      <DashboardCard
        padding={false}
        className={`border-dashed cursor-pointer transition-colors ${dragging ? "border-accent-primary bg-accent-primary/5" : "hover:border-border-light"}`}
      >
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
          onClick={() => fileRef.current?.click()}
          className="p-10 text-center"
        >
          <div className="w-10 h-10 rounded-md bg-background-tertiary flex items-center justify-center mx-auto mb-3">
            <FileText className="w-5 h-5 text-foreground-muted" />
          </div>
          <p className="text-sm font-medium text-foreground">{uploading ? t("uploading") : t("dropzone.heading")}</p>
          <p className="text-sm text-foreground-secondary mt-1 max-w-md mx-auto">{t("dropzone.description")}</p>
        </div>
      </DashboardCard>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t("search.placeholder")}
          className="flex-1 h-9 px-3 rounded-md bg-background-secondary border border-border text-sm text-foreground placeholder:text-foreground-muted focus:outline-none focus:border-accent-primary"
        />
        <DashboardPrimaryButton type="submit" disabled={searching}>
          {searching ? t("search.searching") : t("search.button")}
        </DashboardPrimaryButton>
      </form>

      {searchResults.length > 0 && (
        <DashboardSection title={t("search.resultsHeading", { count: searchResults.length })}>
          <DashboardList>
            {searchResults.map((result) => (
              <div key={result.id} className="px-5 py-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-4 h-4 text-foreground-muted" />
                  <span className="text-sm font-medium text-foreground">{result.name}</span>
                  {result.category && (
                    <span className="text-xs px-2 py-0.5 rounded bg-background-tertiary text-foreground-muted">{result.category}</span>
                  )}
                </div>
                {result.excerpts.map((excerpt, i) => (
                  <p key={i} className="text-xs text-foreground-muted line-clamp-2 mt-1">{excerpt}</p>
                ))}
              </div>
            ))}
          </DashboardList>
        </DashboardSection>
      )}

      <ContradictionScanner docs={docs} />

      <DashboardSection title={t("allDocuments.heading")}>
        {loading ? (
          <DashboardList>
            <SkeletonListRows rows={5} />
          </DashboardList>
        ) : docs.length === 0 ? (
          <DashboardEmptyState icon={FileSearch} title={t("allDocuments.empty")} />
        ) : (
          <DashboardList>
            {docs.map((doc) => (
              <div key={doc.id} className="flex items-center justify-between gap-4 px-5 py-3.5">
                <div className="flex items-center gap-3 min-w-0">
                  <FileText className="w-4 h-4 text-foreground-muted shrink-0" />
                  <div className="min-w-0">
                    <span className="text-sm text-foreground truncate block">{doc.name}</span>
                    {doc.category && <span className="text-xs text-foreground-muted">{doc.category}</span>}
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 text-xs text-foreground-muted">
                  <span>{doc.type}</span>
                  <span>{fmt(doc.size)}</span>
                  {doc.status === "indexed" ? (
                    <CheckCircle className="w-3.5 h-3.5 text-accent-success" />
                  ) : (
                    <Clock className="w-3.5 h-3.5" />
                  )}
                  <span>{fmtDate(doc.created_at)}</span>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    disabled={deleting === doc.id}
                    className="p-1 rounded hover:bg-background-tertiary transition-colors disabled:opacity-40"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </DashboardList>
        )}
      </DashboardSection>
    </>
  );

  if (embedded) return body;

  return (
    <DashboardPage>
      <DashboardHeader
        title={t("title")}
        description={t("subtitle")}
        action={
          <DashboardPrimaryButton onClick={() => fileRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4" />
            {uploading ? t("uploading") : t("upload")}
          </DashboardPrimaryButton>
        }
      />
      {body}
    </DashboardPage>
  );
}
