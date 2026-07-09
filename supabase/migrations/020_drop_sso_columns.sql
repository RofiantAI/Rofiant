-- Remove unused SAML/OIDC SSO columns (feature never shipped in UI).
-- scim_token is kept: it backs the live SCIM provisioning API
-- (src/app/api/v1/scim/v2/Users, src/app/api/agency/scim-token).
ALTER TABLE agencies
  DROP COLUMN IF EXISTS sso_enabled,
  DROP COLUMN IF EXISTS sso_provider,
  DROP COLUMN IF EXISTS sso_config;
