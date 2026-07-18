-- Dravonix Project Estimator — initial schema.
-- Clean, purpose-built tables. No generic questionnaire/page tables —
-- estimator answers are stored as validated structured JSON that mirrors
-- the canonical EstimatorState type in src/lib/estimator/schema.ts.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------
-- profiles: administrator accounts (linked 1:1 to auth.users)
-- ---------------------------------------------------------------------
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role text not null default 'admin' check (role in ('admin', 'staff')),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- services: the editable pricing catalog. Admins may edit price_min,
-- price_max and active — they cannot insert arbitrary new questionnaire
-- concepts through this table, only price/availability for the fixed
-- service catalog defined in src/lib/estimator/services.ts.
-- ---------------------------------------------------------------------
create table services (
  id text primary key,
  name text not null,
  category text not null check (category in ('branding', 'web', 'marketing', 'content', 'technical')),
  unit text not null check (unit in ('one_time', 'monthly')),
  price_min numeric not null check (price_min >= 0),
  price_max numeric not null check (price_max >= price_min),
  description text not null default '',
  active boolean not null default true,
  manual_quotation_possible boolean not null default false,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- leads: one row per client submission
-- ---------------------------------------------------------------------
create table leads (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  full_name text not null,
  business_name text,
  whatsapp_number text,
  email text,
  business_stage text,
  status text not null default 'new' check (
    status in ('new', 'contacted', 'qualified', 'consultation_scheduled', 'proposal_sent', 'won', 'lost', 'spam')
  ),
  privacy_accepted boolean not null default false,
  contact_consent boolean not null default false,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_term text,
  utm_content text,
  referrer text,
  session_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_reference_idx on leads (reference);
create index leads_session_idx on leads (session_id);
create index leads_status_idx on leads (status);
create index leads_created_at_idx on leads (created_at desc);

-- ---------------------------------------------------------------------
-- project_briefs: the project description, AI interpretation, and the
-- full canonical answers JSON (selected services, scope, assets, timeline)
-- ---------------------------------------------------------------------
create table project_briefs (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  project_description text not null default '',
  reference_website text,
  inspiration_link text,
  ai_interpretation jsonb,
  selected_services text[] not null default '{}',
  services_not_sure boolean not null default false,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index project_briefs_lead_id_idx on project_briefs (lead_id);

-- ---------------------------------------------------------------------
-- estimates: the deterministic pricing result for a lead
-- ---------------------------------------------------------------------
create table estimates (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  reference text not null unique,
  one_time_min numeric not null default 0,
  one_time_max numeric not null default 0,
  monthly_min numeric not null default 0,
  monthly_max numeric not null default 0,
  essential_launch jsonb not null default '{}'::jsonb,
  recommended_solution jsonb not null default '{}'::jsonb,
  optional_upgrades jsonb not null default '[]'::jsonb,
  future_expansion jsonb not null default '[]'::jsonb,
  assumptions jsonb not null default '[]'::jsonb,
  exclusions jsonb not null default '[]'::jsonb,
  estimated_timeline_label text not null default '',
  confidence text not null default 'medium' check (confidence in ('high', 'medium', 'low')),
  custom_quotation_required boolean not null default false,
  created_at timestamptz not null default now()
);

create index estimates_reference_idx on estimates (reference);
create index estimates_lead_id_idx on estimates (lead_id);

-- ---------------------------------------------------------------------
-- estimate_items: line-by-line service breakdown for an estimate
-- ---------------------------------------------------------------------
create table estimate_items (
  id uuid primary key default gen_random_uuid(),
  estimate_id uuid not null references estimates (id) on delete cascade,
  service_id text not null references services (id),
  name text not null,
  unit text not null check (unit in ('one_time', 'monthly')),
  price_min numeric not null,
  price_max numeric not null,
  notes text
);

create index estimate_items_estimate_id_idx on estimate_items (estimate_id);

-- ---------------------------------------------------------------------
-- lead_activity: status changes and internal notes
-- ---------------------------------------------------------------------
create table lead_activity (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references leads (id) on delete cascade,
  type text not null check (type in ('status_change', 'note', 'system')),
  note text,
  previous_status text,
  new_status text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index lead_activity_lead_id_idx on lead_activity (lead_id);

-- ---------------------------------------------------------------------
-- app_settings: admin-editable operational settings (WhatsApp number,
-- contact email, disclaimer text). Env vars remain the deployment-time
-- default; a row here overrides at runtime.
-- ---------------------------------------------------------------------
create table app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------
alter table profiles enable row level security;
alter table services enable row level security;
alter table leads enable row level security;
alter table project_briefs enable row level security;
alter table estimates enable row level security;
alter table estimate_items enable row level security;
alter table lead_activity enable row level security;
alter table app_settings enable row level security;

create or replace function is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (select 1 from profiles where id = auth.uid());
$$;

-- profiles: an admin can read their own row and teammates' rows
create policy "profiles_select_admin" on profiles for select using (is_admin());
create policy "profiles_update_self" on profiles for update using (id = auth.uid());

-- services: anyone can read active services (needed for public price
-- display); only admins can write
create policy "services_select_all" on services for select using (true);
create policy "services_write_admin" on services for all using (is_admin()) with check (is_admin());

-- leads / project_briefs / estimates / estimate_items: no anon access.
-- The public estimator flow writes and reads through the service-role
-- key from server-only API routes, which bypasses RLS by design.
create policy "leads_admin_all" on leads for all using (is_admin()) with check (is_admin());
create policy "project_briefs_admin_all" on project_briefs for all using (is_admin()) with check (is_admin());
create policy "estimates_admin_all" on estimates for all using (is_admin()) with check (is_admin());
create policy "estimate_items_admin_all" on estimate_items for all using (is_admin()) with check (is_admin());
create policy "lead_activity_admin_all" on lead_activity for all using (is_admin()) with check (is_admin());

-- app_settings: public read (contact cards need it), admin write
create policy "app_settings_select_all" on app_settings for select using (true);
create policy "app_settings_write_admin" on app_settings for all using (is_admin()) with check (is_admin());

-- ---------------------------------------------------------------------
-- updated_at triggers
-- ---------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_set_updated_at before update on leads
  for each row execute function set_updated_at();

create trigger project_briefs_set_updated_at before update on project_briefs
  for each row execute function set_updated_at();

create trigger services_set_updated_at before update on services
  for each row execute function set_updated_at();

create trigger app_settings_set_updated_at before update on app_settings
  for each row execute function set_updated_at();
