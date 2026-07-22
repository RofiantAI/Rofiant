-- Consolidate subscription plans down to free, pro, ultra.
-- Plan is stored in auth.users.raw_user_meta_data->>'plan' (no CHECK
-- constraint backs it), so retiring the old tier names means migrating any
-- existing users off them rather than altering a schema constraint.
-- Retired tiers (team, pilot, agency, enterprise) all map to the new
-- top tier, "ultra".

UPDATE auth.users
SET raw_user_meta_data = jsonb_set(raw_user_meta_data, '{plan}', '"ultra"')
WHERE raw_user_meta_data->>'plan' IN ('team', 'pilot', 'agency', 'enterprise');
