-- =============================================================================
-- Kopdes Intelligence — Initial schema
-- Smart Village Cooperative Module (SIMKOPDES)
--
-- Maps the app data models found in src/lib/mock-data.ts & src/lib/ai-types.ts:
--   cooperativeInfo   -> public.cooperatives
--   currentMember     -> public.members
--   Aspiration        -> public.aspirations
--   DecisionAnalysis  -> public.aspiration_analyses
--   FinancialSummary  -> public.financial_summaries
--   MonthlyRevenue    -> public.monthly_revenues
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Enums
-- -----------------------------------------------------------------------------
create type public.aspiration_category as enum ('usulan', 'keluhan', 'pertanyaan');
create type public.aspiration_status   as enum ('menunggu', 'dalam_review', 'disetujui', 'ditolak');

-- -----------------------------------------------------------------------------
-- Shared updated_at trigger
-- -----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- -----------------------------------------------------------------------------
-- cooperatives (Koperasi Desa/Kelurahan)
-- -----------------------------------------------------------------------------
create table public.cooperatives (
  id          uuid primary key default gen_random_uuid(),
  code        text not null unique,                -- e.g. KOPDES-3301-0042
  name        text not null,
  village     text,                                -- Desa/Kelurahan
  district    text,                                -- Kecamatan
  regency     text,                                -- Kabupaten/Kota
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

comment on table public.cooperatives is 'Village cooperative (Koperasi Desa/Kelurahan Merah Putih) master data.';

create trigger trg_cooperatives_updated_at
  before update on public.cooperatives
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- members (Anggota koperasi)
-- -----------------------------------------------------------------------------
create table public.members (
  id             uuid primary key default gen_random_uuid(),
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,
  member_code    text not null,                    -- e.g. AGT-2024-0187
  name           text not null,
  nik            text,                             -- may be stored masked (3301****4521)
  join_year      smallint,
  -- Optional link to an external identity coming from the SIMKOPDES parent app
  -- (auth is agnostic / via JS Bridge token, not Supabase Auth).
  external_ref   text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  unique (cooperative_id, member_code)
);

comment on table public.members is 'Cooperative members. Auth is handled by the parent app; external_ref links to that identity.';

create index idx_members_cooperative_id on public.members (cooperative_id);

create trigger trg_members_updated_at
  before update on public.members
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- aspirations (Aspirasi anggota: usulan / keluhan / pertanyaan)
-- -----------------------------------------------------------------------------
create table public.aspirations (
  id              uuid primary key default gen_random_uuid(),
  cooperative_id  uuid not null references public.cooperatives (id) on delete cascade,
  member_id       uuid references public.members (id) on delete set null,
  -- Denormalized display fields (member data may be masked / historical snapshot)
  member_name     text not null,
  member_nik      text,
  category        public.aspiration_category not null,
  title           text not null,
  description     text not null,
  status          public.aspiration_status not null default 'menunggu',
  management_note text,
  submitted_at    timestamptz not null default now(),
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

comment on table public.aspirations is 'Member aspirations submitted via the mobile WebView; drives the transparency feed.';

create index idx_aspirations_cooperative_id on public.aspirations (cooperative_id);
create index idx_aspirations_member_id      on public.aspirations (member_id);
create index idx_aspirations_status         on public.aspirations (status);
create index idx_aspirations_submitted_at   on public.aspirations (submitted_at desc);

create trigger trg_aspirations_updated_at
  before update on public.aspirations
  for each row execute function public.set_updated_at();

-- -----------------------------------------------------------------------------
-- aspiration_analyses (AI Decision Engine output — history per aspiration)
-- Matches DecisionAnalysisResponse { score, roi, rationale, decision }.
-- -----------------------------------------------------------------------------
create table public.aspiration_analyses (
  id             uuid primary key default gen_random_uuid(),
  aspiration_id  uuid not null references public.aspirations (id) on delete cascade,
  score          smallint check (score between 1 and 10),   -- decision score 1-10
  roi            text,                                       -- ROI projection, e.g. "18-24 bulan"
  rationale      text,                                       -- brief rationale / recommendation
  decision       text,                                       -- model recommended decision
  model          text,                                       -- LLM model used, e.g. gemini-2.5-flash
  is_demo        boolean not null default false,             -- generated by fallback/demo path
  created_at     timestamptz not null default now()
);

comment on table public.aspiration_analyses is 'AI (Gemini) decision analyses generated for aspirations.';

create index idx_aspiration_analyses_aspiration_id on public.aspiration_analyses (aspiration_id, created_at desc);

-- -----------------------------------------------------------------------------
-- financial_summaries (KPI snapshot — omzet, SHU, kas + period-over-period %)
-- Matches FinancialSummary.
-- -----------------------------------------------------------------------------
create table public.financial_summaries (
  id             uuid primary key default gen_random_uuid(),
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,
  snapshot_date  date not null default current_date,
  omzet          numeric(18, 2) not null default 0,   -- revenue
  shu            numeric(18, 2) not null default 0,    -- member profit share
  kas            numeric(18, 2) not null default 0,    -- cash
  omzet_change   numeric(6, 2),                        -- % change vs previous period
  shu_change     numeric(6, 2),
  kas_change     numeric(6, 2),
  created_at     timestamptz not null default now(),
  unique (cooperative_id, snapshot_date)
);

comment on table public.financial_summaries is 'Point-in-time financial KPI snapshot per cooperative for the dashboard.';

create index idx_financial_summaries_cooperative_id on public.financial_summaries (cooperative_id, snapshot_date desc);

-- -----------------------------------------------------------------------------
-- monthly_revenues (time series for the revenue chart)
-- Matches MonthlyRevenue { month, omzet, shu }.
-- -----------------------------------------------------------------------------
create table public.monthly_revenues (
  id             uuid primary key default gen_random_uuid(),
  cooperative_id uuid not null references public.cooperatives (id) on delete cascade,
  period         date not null,                        -- first day of the month
  omzet          numeric(18, 2) not null default 0,
  shu            numeric(18, 2) not null default 0,
  created_at     timestamptz not null default now(),
  unique (cooperative_id, period)
);

comment on table public.monthly_revenues is 'Monthly omzet & SHU series powering the dashboard revenue chart.';

create index idx_monthly_revenues_cooperative_id on public.monthly_revenues (cooperative_id, period);

-- =============================================================================
-- Row Level Security
--
-- NOTE ON AUTH: this module authenticates via the SIMKOPDES parent app (JS
-- Bridge token), NOT Supabase Auth. Writes are expected to go through server
-- routes using the SERVICE ROLE key, which BYPASSES RLS. The policies below
-- therefore:
--   * expose read-only ("transparency") data to the anon/public client, and
--   * deny anonymous writes by default (only the service role can mutate).
-- Tighten these once real Supabase Auth / a claims-based bridge is wired in.
-- =============================================================================
alter table public.cooperatives         enable row level security;
alter table public.members              enable row level security;
alter table public.aspirations          enable row level security;
alter table public.aspiration_analyses  enable row level security;
alter table public.financial_summaries  enable row level security;
alter table public.monthly_revenues     enable row level security;

-- Public (transparency) read access
create policy "Public read cooperatives"
  on public.cooperatives for select
  to anon, authenticated
  using (true);

create policy "Public read aspirations"
  on public.aspirations for select
  to anon, authenticated
  using (true);

create policy "Public read aspiration analyses"
  on public.aspiration_analyses for select
  to anon, authenticated
  using (true);

create policy "Public read financial summaries"
  on public.financial_summaries for select
  to anon, authenticated
  using (true);

create policy "Public read monthly revenues"
  on public.monthly_revenues for select
  to anon, authenticated
  using (true);

-- Members table is NOT publicly readable (contains NIK); reads/writes go via
-- the service role from the server. No anon policy is intentionally added.

-- Allow members (anon client in the WebView) to submit new aspirations.
-- Status is forced to 'menunggu' so clients cannot self-approve.
create policy "Anyone can submit an aspiration"
  on public.aspirations for insert
  to anon, authenticated
  with check (status = 'menunggu');
