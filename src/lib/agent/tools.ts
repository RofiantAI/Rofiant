import { tool } from "ai";
import { z } from "zod";
import type { SupabaseClient } from "@supabase/supabase-js";
import { searchText, truncateText } from "@/lib/document-text";
import { getKnowledgeBaseContext } from "@/lib/knowledge-base-context";

const READ_DOC_MAX_CHARS = 12_000;

export function createSearchTools(supabase: SupabaseClient, userId: string) {
  return {
    list_documents: tool({
      description:
        "List indexed documents owned by the user. Returns id, name, type, category, summary, and status.",
      inputSchema: z.object({
        limit: z.number().int().min(1).max(25).optional(),
      }),
      execute: async ({ limit = 15 }) => {
        const { data, error } = await supabase
          .from("documents")
          .select("id, name, type, category, summary, status, created_at")
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(limit);

        if (error) return { error: error.message, documents: [] as const };
        return { documents: data ?? [] };
      },
    }),

    search_documents: tool({
      description: "Full-text search across indexed document content.",
      inputSchema: z.object({
        query: z.string().min(1),
        limit: z.number().int().min(1).max(10).optional(),
      }),
      execute: async ({ query, limit = 5 }) => {
        const { data, error } = await supabase
          .from("documents")
          .select("id, name, type, category, summary, content_text")
          .eq("user_id", userId)
          .eq("status", "indexed")
          .not("content_text", "is", null);

        if (error) return { error: error.message, results: [] as const };

        const results = (data ?? [])
          .flatMap((doc) => {
            const excerpts = searchText(doc.content_text ?? "", query, 2);
            if (excerpts.length === 0) return [];
            return [{ id: doc.id, name: doc.name, type: doc.type, category: doc.category, summary: doc.summary, excerpts }];
          })
          .slice(0, limit);

        return { query, results };
      },
    }),

    list_knowledge_bases: tool({
      description: "List knowledge bases the user can search.",
      inputSchema: z.object({}),
      execute: async () => {
        const { data, error } = await supabase
          .from("knowledge_bases")
          .select("id, name, description, created_at")
          .eq("owner_id", userId)
          .order("created_at", { ascending: false });

        if (error) return { error: error.message, knowledge_bases: [] as const };
        return { knowledge_bases: data ?? [] };
      },
    }),

    search_knowledge_base: tool({
      description: "Search a knowledge base for relevant document excerpts.",
      inputSchema: z.object({
        knowledge_base_id: z.string().uuid(),
        query: z.string().min(1),
      }),
      execute: async ({ knowledge_base_id, query }) => {
        const results = await getKnowledgeBaseContext(userId, knowledge_base_id, query);
        return { knowledge_base_id, query, results };
      },
    }),
  };
}

export function createExecuteTools(supabase: SupabaseClient, userId: string) {
  return {
    read_document: tool({
      description: "Read a document by id. Use ids discovered during the search phase.",
      inputSchema: z.object({
        document_id: z.string().uuid(),
      }),
      execute: async ({ document_id }) => {
        const { data, error } = await supabase
          .from("documents")
          .select("id, name, type, category, summary, content_text, status")
          .eq("id", document_id)
          .eq("user_id", userId)
          .single();

        if (error || !data) return { error: "Document not found" };

        const content = data.content_text
          ? truncateText(data.content_text, READ_DOC_MAX_CHARS)
          : null;

        return {
          id: data.id,
          name: data.name,
          type: data.type,
          category: data.category,
          status: data.status,
          summary: data.summary,
          content,
        };
      },
    }),
  };
}

/** @deprecated Use createSearchTools / createExecuteTools */
export function createUserAgentTools(supabase: SupabaseClient, userId: string) {
  return { ...createSearchTools(supabase, userId), ...createExecuteTools(supabase, userId) };
}

export type SearchTools = ReturnType<typeof createSearchTools>;
export type ExecuteTools = ReturnType<typeof createExecuteTools>;
