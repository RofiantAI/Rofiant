"use client";

import { Mic, Upload, FileAudio, Clock, Trash2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type VoiceRecord = {
  id: string;
  name: string;
  duration: string;
  size: number;
  status: "processing" | "done" | "failed";
  created_at: string;
};

const ACCEPT = ".mp3,.wav,.mp4,.m4a,.ogg,audio/*,video/mp4";

function fmt(bytes: number) {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function VoiceAIPage() {
  const [records, setRecords] = useState<VoiceRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch("/api/voice")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setRecords(data); })
      .finally(() => setLoading(false));
  }, []);

  async function uploadFile(file: File) {
    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setUploading(false); setUploadError("Not authenticated."); return; }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: storageErr } = await supabase.storage.from("voice").upload(path, file);
    if (storageErr) {
      setUploading(false);
      setUploadError(`Storage error: ${storageErr.message}`);
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
    } else {
      setUploadError(`Save error: ${record.error ?? "Unknown error"}`);
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

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-normal text-foreground">Voice AI</h1>
          <p className="mt-1 text-sm text-foreground-secondary">
            Transcription and summarization for meetings and calls
          </p>
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center gap-2 h-9 px-4 text-sm font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 disabled:opacity-60 transition-colors"
        >
          <Upload className="w-4 h-4" />
          {uploading ? "Uploading…" : "Upload audio"}
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
          <FileAudio className="w-6 h-6" />
        </div>
        <h3 className="text-foreground font-medium">
          {uploading ? "Uploading…" : "Upload audio or video"}
        </h3>
        <p className="text-sm text-foreground-secondary mt-2 max-w-md mx-auto">
          Drag and drop MP3, WAV, MP4, or M4A files. Rofiant will transcribe and
          generate summaries with speaker identification.
        </p>
        <div className="mt-4 text-xs text-foreground-muted">
          Supports files up to 500MB
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-sm font-medium text-foreground-secondary mb-4 uppercase tracking-wider">
          Recent transcriptions
        </h2>
        {loading ? (
          <div className="bg-card border border-border p-8 text-center text-sm text-foreground-muted">Loading…</div>
        ) : records.length === 0 ? (
          <div className="bg-card border border-border p-8 text-center">
            <Clock className="w-5 h-5 text-foreground-muted mx-auto mb-3" />
            <p className="text-sm text-foreground-secondary">
              No transcriptions yet. Upload your first audio file to get started.
            </p>
          </div>
        ) : (
          <div className="bg-card border border-border">
            {records.map((r, i) => (
              <div
                key={r.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i < records.length - 1 ? "border-b border-border" : ""
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Mic className="w-4 h-4 text-foreground-muted shrink-0" />
                  <span className="text-sm text-foreground truncate">{r.name}</span>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <span className="text-xs text-foreground-muted">{fmt(r.size)}</span>
                  <span className="text-xs text-foreground-muted">{formatDate(r.created_at)}</span>
                  <button
                    onClick={() => handleDelete(r.id)}
                    disabled={deleting === r.id}
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
