"use client";

import { BookOpen, FileText, Plus, Trash2, ArrowLeft, Pencil, Check, X } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, use } from "react";

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
      setAddError(d.error ?? "Failed to add");
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
    if (!confirm("Remove this document from the knowledge base?")) return;
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

  if (loading) return <div className="text-sm text-foreground-muted p-8">Loading…</div>;
  if (!kb) return (
    <div className="p-8">
      <p className="text-sm text-foreground-secondary">Knowledge base not found.</p>
      <Link href="/dashboard/knowledge-bases" className="text-sm text-accent-primary hover:underline mt-2 inline-block">← Back</Link>
    </div>
  );

  return (
    <div>
      <div className="mb-6">
        <Link href="/dashboard/knowledge-bases" className="inline-flex items-center gap-1.5 text-xs text-foreground-muted hover:text-foreground-secondary transition-colors mb-4">
          <ArrowLeft className="w-3 h-3" /> Knowledge Bases
        </Link>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  autoFocus
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") saveName(); if (e.key === "Escape") setEditingName(false); }}
                  className="text-2xl font-normal bg-transparent border-b border-border text-foreground focus:outline-none focus:border-border-light w-full max-w-sm"
                />
                <button onClick={saveName} disabled={savingName} className="text-foreground-muted hover:text-accent-success"><Check className="w-4 h-4" /></button>
                <button onClick={() => setEditingName(false)} className="text-foreground-muted hover:text-foreground"><X className="w-4 h-4" /></button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl font-normal text-foreground">{kb.name}</h1>
                <button onClick={() => setEditingName(true)} className="opacity-0 group-hover:opacity-100 text-foreground-muted hover:text-foreground transition-opacity">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {kb.description && <p className="mt-1 text-sm text-foreground-secondary">{kb.description}</p>}
          </div>
          <button
            onClick={() => { setShowAddDoc(true); setAddError(""); }}
            className="h-8 px-3 text-xs font-medium bg-button-primary text-button-primary-foreground hover:bg-foreground/90 transition-colors inline-flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-3.5 h-3.5" /> Add document
          </button>
        </div>
      </div>

      {showAddDoc && (
        <div className="mb-6 bg-card border border-border p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-medium text-foreground">Add document to knowledge base</h2>
            <button onClick={() => setShowAddDoc(false)} className="text-foreground-muted hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          {availableDocs.length === 0 ? (
            <div className="text-sm text-foreground-secondary">
              {userDocs.length === 0
                ? <>No documents uploaded yet. <Link href="/dashboard/documents" className="text-accent-primary hover:underline">Upload a document →</Link></>
                : "All your documents are already in this knowledge base."}
            </div>
          ) : (
            <div className="divide-y divide-border border border-border">
              {availableDocs.map((doc) => (
                <div key={doc.id} className="flex items-center gap-3 px-4 py-3">
                  <FileText className="w-3.5 h-3.5 text-foreground-muted shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-foreground truncate">{doc.name}</div>
                    <div className="text-xs text-foreground-muted">{formatBytes(doc.size)}</div>
                  </div>
                  <button
                    onClick={() => addDoc(doc.id)}
                    disabled={adding === doc.id}
                    className="h-7 px-3 text-xs border border-border text-foreground-secondary hover:border-border-light hover:text-foreground disabled:opacity-40 transition-colors"
                  >
                    {adding === doc.id ? "Adding…" : "Add"}
                  </button>
                </div>
              ))}
            </div>
          )}
          {addError && <p className="text-xs text-red-400 mt-3">{addError}</p>}
        </div>
      )}

      {kb.knowledge_base_documents.length === 0 ? (
        <div className="bg-card border border-border p-16 text-center">
          <BookOpen className="w-6 h-6 text-foreground-muted mx-auto mb-3" />
          <p className="text-sm font-medium text-foreground mb-1">No documents yet</p>
          <p className="text-sm text-foreground-secondary mb-4">
            Add documents from your library to include them as AI context.
          </p>
          <button onClick={() => setShowAddDoc(true)} className="text-sm text-accent-primary hover:underline">
            Add your first document →
          </button>
        </div>
      ) : (
        <div className="border border-border bg-card divide-y divide-border">
          {kb.knowledge_base_documents.map((kbDoc) => {
            const doc = kbDoc.documents;
            if (!doc) return null;
            return (
              <div key={kbDoc.id} className="flex items-center gap-3 px-5 py-4 group">
                <FileText className="w-4 h-4 text-foreground-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-foreground truncate">{doc.name}</div>
                  <div className="text-xs text-foreground-muted">
                    {formatBytes(doc.size)} · Added {new Date(kbDoc.added_at).toLocaleDateString()}
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
        </div>
      )}

      <p className="mt-4 text-xs text-foreground-muted">
        {kb.knowledge_base_documents.length} document{kb.knowledge_base_documents.length !== 1 ? "s" : ""} ·
        Last updated {new Date(kb.updated_at).toLocaleDateString()}
      </p>
    </div>
  );
}
