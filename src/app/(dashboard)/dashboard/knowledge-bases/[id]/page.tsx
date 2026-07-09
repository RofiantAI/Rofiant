"use client";

import { BookOpen, FileText, Plus, Trash2, ArrowLeft, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";
import { useTranslations } from "next-intl";
import {
  DashboardPage,
  DashboardCard,
  DashboardList,
  DashboardEmptyState,
  DashboardPrimaryButton,
  DashboardSecondaryButton,
} from "@/components/dashboard/ui/page-shell";
import { SkeletonListRows, SkeletonPageHeader } from "@/components/ui/skeleton";

type Doc = { id: string; name: string; type: string; size: number };
type KBDoc = { id: string; document_id: string; added_at: string; documents: Doc };
type KB = {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  knowledge_base_documents: KBDoc[];
};
type UserDoc = { id: string; name: string; type: string; size: number };

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}

export default function KBDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const t = useTranslations("dashboard.knowledgeBases.detail");
  const [kb, setKb] = useState<KB | null>(null);
  const [loading, setLoading] = useState(true);
  const [userDocs, setUserDocs] = useState<UserDoc[]>([]);
  const [showAddDoc, setShowAddDoc] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [addError, setAddError] = useState("");
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [savingName, setSavingName] = useState(false);

  useEffect(() => {
    fetch(`/api/knowledge-bases/${id}`)
      .then((r) => r.json())
      .then((d) => { if (d.id) { setKb(d); setNameInput(d.name); } })
      .finally(() => setLoading(false));
    fetch("/api/documents")
      .then((r) => r.json())
      .then((d) => { if (Array.isArray(d)) setUserDocs(d); })
      .catch(() => {});
  }, [id]);

  async function addDoc(docId: string) {
    setAdding(docId); setAddError("");
    const res = await fetch(`/api/knowledge-bases/${id}/documents`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: docId }),
    });
    if (!res.ok) {
      const d = await res.json();
      setAddError(d.error ?? t("failedToAdd"));
      setAdding(null);
      return;
    }
    const kbRes = await fetch(`/api/knowledge-bases/${id}`);
    const kbData = await kbRes.json();
    if (kbData.id) setKb(kbData);
    setAdding(null);
    setShowAddDoc(false);
  }

  async function removeDoc(docId: string) {
    if (!confirm(t("removeConfirm"))) return;
    await fetch(`/api/knowledge-bases/${id}/documents`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ document_id: docId }),
    });
    setKb((prev) => prev ? {
      ...prev,
      knowledge_base_documents: prev.knowledge_base_documents.filter((d) => d.document_id !== docId),
    } : prev);
  }

  async function saveName() {
    if (!nameInput.trim() || !kb) return;
    setSavingName(true);
    const res = await fetch(`/api/knowledge-bases/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: nameInput.trim() }),
    });
    if (res.ok) {
      const d = await res.json();
      setKb((prev) => prev ? { ...prev, name: d.name } : prev);
      setEditingName(false);
    }
    setSavingName(false);
  }

  const docIds = new Set(kb?.knowledge_base_documents.map((d) => d.document_id) ?? []);
  const availableDocs = userDocs.filter((d) => !docIds.has(d.id));

  if (loading) {
    return (
      <DashboardPage>
        <SkeletonPageHeader />
        <div className="mt-8">
          <DashboardList>
            <SkeletonListRows rows={5} />
          </DashboardList>
        </div>
      </DashboardPage>
    );
  }
  if (!kb) {
    return (
      <DashboardPage>
        <p className="text-sm text-foreground-secondary">{t("notFound")}</p>
        <Link href="/dashboard/knowledge-bases" className="text-sm text-accent-primary hover:underline mt-2 inline-block">
          {t("backLink")}
        </Link>
      </DashboardPage>
    );
  }

  return (
    <DashboardPage>
      <Link
        href="/dashboard/knowledge-bases"
        className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground-secondary transition-colors -mt-2"
      >
        <ArrowLeft className="w-3 h-3" /> {t("back")}
      </Link>

      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          {editingName ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                className="text-2xl font-semibold tracking-tight bg-transparent border-b border-border text-foreground focus:outline-none focus:border-border-light w-full max-w-sm"
              />
              <button onClick={saveName} disabled={savingName} className="text-foreground-muted hover:text-accent-success"><Check className="w-4 h-4" /></button>
              <button onClick={() => setEditingName(false)} className="text-foreground-muted hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
          ) : (
            <div className="flex items-center gap-2 group">
              <h1 className="text-2xl font-semibold tracking-tight text-foreground">{kb.name}</h1>
              <button onClick={() => setEditingName(true)} className="opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-foreground transition-opacity">
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          {kb.description && <p className="mt-1 text-sm text-foreground-secondary">{kb.description}</p>}
        </div>
        <DashboardPrimaryButton onClick={() => { setShowAddDoc(true); setAddError(""); }}>
          <Plus className="w-3.5 h-3.5" /> {t("addDocument")}
        </DashboardPrimaryButton>
      </div>

      {showAddDoc && (
        <DashboardCard>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">{t("addDocForm.heading")}</h2>
            <button onClick={() => setShowAddDoc(false)} className="text-foreground-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          {availableDocs.length === 0 ? (
            <div className="text-sm text-foreground-secondary">
              {userDocs.length === 0
                ? <>{t("addDocForm.noDocsUploaded")} <Link href="/dashboard/documents" className="text-accent-primary hover:underline">{t("addDocForm.uploadLink")}</Link></>
                : t("addDocForm.allDocsAdded")}
            </div>
          ) : (
            <DashboardList>
              {availableDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{doc.name}</div>
                    <div className="text-xs text-foreground-muted">{formatBytes(doc.size)}</div>
                  </div>
                  <DashboardSecondaryButton onClick={() => addDoc(doc.id)} disabled={adding === doc.id}>
                    {adding === doc.id ? t("addDocForm.adding") : t("addDocForm.add")}
                  </DashboardSecondaryButton>
                </div>
              ))}
            </DashboardList>
          )}
          {addError && <p className="text-xs text-red-400 mt-3">{addError}</p>}
        </DashboardCard>
      )}

      {kb.knowledge_base_documents.length === 0 ? (
        <DashboardEmptyState
          icon={BookOpen}
          title={t("empty.heading")}
          description={t("empty.description")}
          action={
            <button onClick={() => setShowAddDoc(true)} className="text-sm text-accent-primary hover:underline">
              {t("empty.cta")}
            </button>
          }
        />
      ) : (
        <DashboardList>
          {kb.knowledge_base_documents.map((kbDoc) => {
            const doc = kbDoc.documents;
            if (!doc) return null;
            return (
              <div key={kbDoc.id} className="flex items-center gap-3 px-5 py-4 group">
                <FileText className="w-4 h-4 text-foreground-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">{doc.name}</div>
                  <div className="text-xs text-foreground-muted">
                    {formatBytes(doc.size)} · {t("addedOn", { date: new Date(kbDoc.added_at).toLocaleDateString() })}
                  </div>
                </div>
                <button
                  onClick={() => removeDoc(kbDoc.document_id)}
                  className="h-7 w-7 flex items-center justify-center text-foreground-muted hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })}
        </DashboardList>
      )}

      <p className="text-xs text-foreground-muted">
        {t("footerSummary", {
          count: kb.knowledge_base_documents.length,
          plural: kb.knowledge_base_documents.length !== 1 ? "s" : "",
          date: new Date(kb.updated_at).toLocaleDateString(),
        })}
      </p>
    </DashboardPage>
  );
}
