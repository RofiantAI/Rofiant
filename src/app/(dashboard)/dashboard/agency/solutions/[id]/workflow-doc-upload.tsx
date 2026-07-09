"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Loader2, Upload } from "lucide-react";
import { useTranslations } from "next-intl";

const SUPPORTED = ["pdf", "docx", "txt", "csv", "md"];
const ACCEPT = ".pdf,.docx,.txt,.csv,.md";

export type WorkflowDoc = {
  id: string;
  name: string;
  type: string;
  status: string;
};

export function WorkflowDocUpload({
  docs,
  selectedDocs,
  onDocsChange,
  onSelectionChange,
}: {
  docs: WorkflowDoc[];
  selectedDocs: string[];
  onDocsChange: (docs: WorkflowDoc[]) => void;
  onSelectionChange: (ids: string[]) => void;
}) {
  const t = useTranslations("dashboard.agency.solutions.workflow");
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function uploadFile(file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
    if (!SUPPORTED.includes(ext)) {
      setUploadError(t("upload.unsupported", { ext, types: SUPPORTED.join(", ") }));
      return;
    }

    setUploading(true);
    setUploadError("");
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setUploading(false);
      setUploadError(t("upload.authRequired"));
      return;
    }

    const path = `${user.id}/${Date.now()}-${file.name}`;
    const { error: storageErr } = await supabase.storage.from("documents").upload(path, file);
    if (storageErr) {
      setUploading(false);
      setUploadError(storageErr.message);
      return;
    }

    const res = await fetch("/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: file.name,
        type: ext.toUpperCase(),
        size: file.size,
        storage_path: path,
      }),
    });
    const doc = await res.json();
    if (res.ok) {
      const indexed = doc.status === "indexed" ? doc : { ...doc, status: "indexed" };
      onDocsChange([indexed, ...docs.filter((d) => d.id !== doc.id)]);
      if (indexed.status === "indexed") {
        onSelectionChange([...selectedDocs, doc.id]);
      }
    } else {
      setUploadError(doc.error ?? t("upload.failed"));
    }
    setUploading(false);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs text-foreground-muted">{t("inputs.documents")}</label>
        <button
          type="button"
          disabled={uploading}
          onClick={() => fileRef.current?.click()}
          className="inline-flex items-center gap-1.5 text-xs text-accent-primary hover:underline disabled:opacity-50"
        >
          {uploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
          {uploading ? t("upload.uploading") : t("upload.addFiles")}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              void Array.from(e.target.files).reduce(
                (p, f) => p.then(() => uploadFile(f)),
                Promise.resolve(),
              );
            }
            e.target.value = "";
          }}
        />
      </div>

      {uploadError && <p className="text-xs text-red-400">{uploadError}</p>}

      {docs.length === 0 ? (
        <p className="text-sm text-foreground-muted border border-dashed border-border rounded-md p-4 text-center">
          {t("inputs.noDocumentsInline")}
        </p>
      ) : (
        <div className="max-h-48 overflow-y-auto rounded-md border border-border divide-y divide-border">
          {docs.map((doc) => (
            <label
              key={doc.id}
              className="flex items-center gap-3 px-3 py-2 text-sm cursor-pointer hover:bg-background-tertiary"
            >
              <input
                type="checkbox"
                checked={selectedDocs.includes(doc.id)}
                disabled={doc.status !== "indexed"}
                onChange={(e) => {
                  onSelectionChange(
                    e.target.checked
                      ? [...selectedDocs, doc.id]
                      : selectedDocs.filter((id) => id !== doc.id),
                  );
                }}
                className="rounded border-border"
              />
              <span className="text-foreground truncate">{doc.name}</span>
              <span className="text-xs text-foreground-muted ml-auto capitalize">{doc.status}</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
