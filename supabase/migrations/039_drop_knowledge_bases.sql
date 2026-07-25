-- Drop tables backing the Knowledge Bases feature (UI and API routes removed):
-- src/app/api/knowledge-bases/*, src/lib/knowledge-base-context.ts. No remaining
-- callers reference knowledge_bases / knowledge_base_documents.

DROP TABLE IF EXISTS knowledge_base_documents;
DROP TABLE IF EXISTS knowledge_bases;
