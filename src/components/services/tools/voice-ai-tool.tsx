"use client";

import { Mic, Upload, FileAudio, Trash2, Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useTranslations } from "next-intl";
import {
  DashboardPage,
  DashboardHeader,
  DashboardCard,
  DashboardSection,
  DashboardList,
  DashboardEmptyState,
  DashboardAlert,
  DashboardProductStatus,
  DashboardPrimaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows } from "@/components/ui/skeleton";

type VoiceRecord = {
  id: string;
  name: string;
  size: number;
  status: "processing" | "done" | "failed";
  transcript?: string | null;
  summary?: string | null;
  created_at: string;
};

const ACCEPT = ".mp3,.wav,.mp4,.m4a,.ogg,audio/*,video/mp4";

function fmt(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function VoiceAiTool({ embedded = false }: { embedded?: boolean }) {
  const t = useTranslations("dashboard.voiceAi");
  const tStatus = useTranslations("dashboard.productStatus");
  const [records, setRecords] = useState<VoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/voice")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecords(data); })
      .finally(() => setLoading(false));
  }, []);

  async function processRecord(id: string) {
    setProcessingId(id);
    setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "processing" } : r)));
    const res = await fetch(`/api/voice/${id}/process`, { method: "POST" });
    const data = await res.json();
    if (res.ok) {
      setRecords((prev) => prev.map((r) => (r.id === id ? data : r)));
      setExpandedId(id);
    } else {
      setUploadError(data.error ?? t("errors.processError"));
      setRecords((prev) => prev.map((r) => (r.id === id ? { ...r, status: "failed" } : r)));
    }
    setProcessingId(null);
  }

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setUploadError(t("errors.notAuthenticated")); return; }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: storageErr } = await supabase.storage.from("voice").upload(path, file);
    if (storageErr) {
      setUploading(false);
      setUploadError(t("errors.storageError", { message: storageErr.message }));
      return;
    }

    const res = await fetch("/api/voice", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: file.name, size: file.size, storage_path: path }),
    });
    const record = await res.json();
    if (res.ok) {
      setRecords((prev) => [record, ...prev]);
      await processRecord(record.id);
    } else {
      setUploadError(t("errors.saveError", { message: record.error ?? t("errors.unknownError") }));
    }
    setUploading(false);
  }

  async function handleFiles(files: FileList | null) {
    if (!files) return;
    for (const file of Array.from(files)) await uploadFile(file);
  }

  async function handleDelete(id: string) {
    setDeleting(id);
    await fetch(`/api/voice/${id}`, { method: "DELETE" });
    setRecords((prev) => prev.filter((r) => r.id !== id));
    setDeleting(null);
  }

  function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  }

  const body = (
    <>
      {!embedded && (
        <DashboardProductStatus label={tStatus("beta")}>{tStatus("voiceAi")}</DashboardProductStatus>
      )}

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
            <FileAudio className="w-5 h-5 text-foreground-muted" />
          </div>
          <p className="text-sm font-medium text-foreground">{uploading ? t("uploading") : t("dropzone.heading")}</p>
          <p className="text-sm text-foreground-secondary mt-1">{t("dropzone.description")}</p>
          <p className="text-xs text-foreground-muted mt-2">{t("dropzone.sizeLimit")}</p>
        </div>
      </DashboardCard>

      <DashboardSection title={t("recent.heading")}>
        {loading ? (
          <DashboardList>
            <SkeletonListRows rows={4} />
          </DashboardList>
        ) : records.length === 0 ? (
          <DashboardEmptyState icon={Mic} title={t("recent.empty")} />
        ) : (
          <DashboardList>
            {records.map((r) => (
              <div key={r.id} className="px-5 py-4">
                <div className="flex items-center justify-between gap-4">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="flex items-center gap-3 min-w-0 text-left flex-1"
                  >
                    <Mic className="w-4 h-4 text-foreground-muted shrink-0" />
                    <div className="min-w-0">
                      <span className="text-sm font-medium text-foreground truncate block">{r.name}</span>
                      <span className="text-xs text-foreground-muted">
                        {r.status === "processing" ? t("status.processing") : r.status === "failed" ? t("status.failed") : t("status.done")}
                      </span>
                    </div>
                  </button>
                  <div className="flex items-center gap-3 shrink-0 text-xs text-foreground-muted">
                    <span>{fmt(r.size)}</span>
                    <span>{formatDate(r.created_at)}</span>
                    {(r.status === "processing" || processingId === r.id) && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    )}
                    {r.status === "failed" && (
                      <button onClick={() => processRecord(r.id)} className="text-accent-primary hover:underline">
                        {t("retry")}
                      </button>
                    )}
                    <button
                      onClick={() => handleDelete(r.id)}
                      disabled={deleting === r.id}
                      className="p-1 rounded hover:bg-background-tertiary disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                {expandedId === r.id && (r.transcript || r.summary) && (
                  <div className="mt-4 space-y-3 pl-7 border-l-2 border-border ml-2">
                    {r.summary && (
                      <div>
                        <p className="text-xs font-medium text-foreground-secondary mb-1">{t("summaryLabel")}</p>
                        <p className="text-sm text-foreground-secondary whitespace-pre-wrap">{r.summary}</p>
                      </div>
                    )}
                    {r.transcript && (
                      <div>
                        <p className="text-xs font-medium text-foreground-secondary mb-1">{t("transcriptLabel")}</p>
                        <p className="text-sm text-foreground-muted whitespace-pre-wrap max-h-48 overflow-y-auto">{r.transcript}</p>
                      </div>
                    )}
                  </div>
                )}
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
          <DashboardPrimaryButton onClick={() => fileRef.current?.click()} disabled={uploading || processingId !== null}>
            <Upload className="w-4 h-4" />
            {uploading ? t("uploading") : t("uploadAudio")}
          </DashboardPrimaryButton>
        }
      />
      {body}
    </DashboardPage>
  );
}
