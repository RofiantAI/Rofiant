import { createClient } from "@/lib/supabase/server";
import { searchText } from "@/lib/document-text";

type KbDoc = {
  name: string;
  content_text: string | null;
};

export async function getKnowledgeBaseContext(
  userId: string,
  knowledgeBaseId: string,
  query: string,
): Promise<{ name: string; excerpts: string[] }[]> {
  const supabase = await createClient();

  const { data: kb } = await supabase
    .from("knowledge_bases")
    .select("id, name")
    .eq("id", knowledgeBaseId)
    .eq("owner_id", userId)
    .single();

  if (!kb) return [];

  const { data: links } = await supabase
    .from("knowledge_base_documents")
    .select("documents(name, content_text)")
    .eq("kb_id", knowledgeBaseId);

  const docs = (links ?? [])
    .map((row) => row.documents as unknown as KbDoc | null)
    .filter((doc): doc is KbDoc => Boolean(doc?.name && doc.content_text));

  return docs
    .map((doc) => ({
      name: doc.name,
      excerpts: searchText(doc.content_text!, query, 2),
    }))
    .filter((doc) => doc.excerpts.length > 0);
}
