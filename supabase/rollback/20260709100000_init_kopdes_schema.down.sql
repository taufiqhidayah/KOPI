-- =============================================================================
-- Kopdes Intelligence — ROLLBACK for 20260709100000_init_kopdes_schema.sql
--
-- ⚠️  Supabase CLI has NO native "down" migrations. Do NOT place this file in
--     supabase/migrations/ — it would be applied as a forward migration and
--     wipe your schema. Run it MANUALLY only when you intend to roll back:
--
--       supabase db reset                         # local: full reset (preferred)
--       psql "$SUPABASE_DB_URL" -f supabase/rollback/20260709100000_init_kopdes_schema.down.sql
--
-- Dropping the tables with CASCADE also removes their triggers, policies,
-- indexes and foreign keys. Order is reverse of creation.
-- =============================================================================

-- Tables (reverse dependency order; CASCADE clears dependents)
drop table if exists public.monthly_revenues     cascade;
drop table if exists public.financial_summaries  cascade;
drop table if exists public.aspiration_analyses  cascade;
drop table if exists public.aspirations          cascade;
drop table if exists public.members              cascade;
drop table if exists public.cooperatives         cascade;

-- Shared trigger function (safe to drop after tables/triggers are gone)
drop function if exists public.set_updated_at();

-- Enums
drop type if exists public.aspiration_status;
drop type if exists public.aspiration_category;
