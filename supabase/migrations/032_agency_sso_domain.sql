-- SAML SSO domain for Agency / Enterprise org login (CAC/PIV via IdP).
ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS sso_domain text;

CREATE INDEX IF NOT EXISTS agencies_sso_domain_idx
  ON agencies (sso_domain)
  WHERE sso_domain IS NOT NULL;
