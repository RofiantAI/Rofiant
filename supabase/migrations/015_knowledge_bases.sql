-- Knowledge bases: named collections of documents used as persistent AI context.
-- Plan limits: free=0, pro=1, team/pilot=3, agency/enterprise=unlimited

CREATE TABLE IF NOT EXISTS knowledge_bases (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id      uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  agency_id     uuid        REFERENCES agencies(id) ON DELETE CASCADE,
  name          text        NOT NULL,
  description   text        NOT NULL DEFAULT '',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_base_documents (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  kb_id       uuid        NOT NULL REFERENCES knowledge_bases(id) ON DELETE CASCADE,
  document_id uuid        NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
  added_at    timestamptz NOT NULL DEFAULT now(),
  UNIQUE (kb_id, document_id)
);

CREATE INDEX IF NOT EXISTS kb_owner_idx ON knowledge_bases (owner_id, created_at DESC);
CREATE INDEX IF NOT EXISTS kb_agency_idx ON knowledge_bases (agency_id);
CREATE INDEX IF NOT EXISTS kb_docs_kb_idx ON knowledge_base_documents (kb_id);

ALTER TABLE knowledge_bases ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_base_documents ENABLE ROW LEVEL SECURITY;

-- Owners can do everything with their KBs
CREATE POLICY "kb_owner_all" ON knowledge_bases
  FOR ALL USING (owner_id = auth.uid());

-- Agency members can read agency KBs
CREATE POLICY "kb_agency_member_select" ON knowledge_bases
  FOR SELECT USING (
    agency_id IS NOT NULL AND agency_id IN (
      SELECT agency_id FROM agency_members
      WHERE user_id = auth.uid() AND status = 'active'
    )
  );

-- KB documents follow KB access
CREATE POLICY "kb_docs_owner_all" ON knowledge_base_documents
  FOR ALL USING (
    kb_id IN (SELECT id FROM knowledge_bases WHERE owner_id = auth.uid())
  );

CREATE POLICY "kb_docs_agency_select" ON knowledge_base_documents
  FOR SELECT USING (
    kb_id IN (
      SELECT kb.id FROM knowledge_bases kb
      JOIN agency_members am ON am.agency_id = kb.agency_id
      WHERE am.user_id = auth.uid() AND am.status = 'active'
    )
  );

-- SSO config per agency (stored as JSONB)
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS sso_enabled    boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS sso_provider   text        CHECK (sso_provider IN ('saml', 'oidc')),
  ADD COLUMN IF NOT EXISTS sso_config     jsonb       NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS scim_token     text;
