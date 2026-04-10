-- ═══════════════════════════════════════
-- DIA — Database Schema for Supabase
-- Run this in: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════

-- 1. Profiles (extends auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null default '',
  score numeric(10,2) not null default 0,
  day_start_time time not null default '07:00',
  daily_plan_time time not null default '21:00',
  timezone text default 'America/Sao_Paulo',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on profiles for insert with check (auth.uid() = id);

-- 2. Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  color text not null default '#f97316',
  archived_at timestamptz,
  created_at timestamptz not null default now()
);

alter table projects enable row level security;
create policy "Users own projects" on projects for all using (auth.uid() = user_id);

-- 3. Tasks
create type task_category as enum ('exercise', 'tedious_task', 'brain_in', 'brain_out', 'brain_wave', 'social');
create type task_status as enum ('not_started', 'done', 'tomorrow', 'return');
create type task_source as enum ('manual', 'suggestion', 'recurrence');

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid references projects(id) on delete set null,
  title text not null,
  description text,
  category task_category not null default 'brain_out',
  status task_status not null default 'not_started',
  urgency integer not null default 3 check (urgency between 1 and 5),
  importance integer not null default 3 check (importance between 1 and 5),
  tediousness integer not null default 1 check (tediousness between 1 and 5),
  effort_minutes integer default 30,
  scheduled_time time,
  source task_source not null default 'manual',
  planned_date date,
  completed_at timestamptz,
  archived_at timestamptz,
  order_index integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table tasks enable row level security;
create policy "Users own tasks" on tasks for all using (auth.uid() = user_id);

create index idx_tasks_user_status on tasks(user_id, status);
create index idx_tasks_planned_date on tasks(user_id, planned_date);

-- 4. Daily Plans
create type plan_status as enum ('draft', 'planned', 'closed');

create table if not exists daily_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  planned_at timestamptz,
  status plan_status not null default 'draft',
  day_score numeric(5,2) default 0,
  bonus_score numeric(5,2) default 0,
  penalty_score numeric(5,2) default 0,
  total_score numeric(5,2) default 0,
  had_exercise boolean default false,
  completed_frog boolean default false,
  completed_all_categories boolean default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, date)
);

alter table daily_plans enable row level security;
create policy "Users own plans" on daily_plans for all using (auth.uid() = user_id);

create index idx_plans_user_date on daily_plans(user_id, date);

-- 5. Daily Plan Tasks (junction table)
create table if not exists daily_plan_tasks (
  id uuid primary key default gen_random_uuid(),
  daily_plan_id uuid not null references daily_plans(id) on delete cascade,
  task_id uuid not null references tasks(id) on delete cascade,
  order_index integer not null default 0,
  scheduled_time time,
  is_frog boolean not null default false,
  status task_status not null default 'not_started',
  was_completed boolean default false,
  was_postponed boolean default false,
  carried_to_next_day boolean default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table daily_plan_tasks enable row level security;
create policy "Users own plan tasks" on daily_plan_tasks for all
  using (exists (select 1 from daily_plans dp where dp.id = daily_plan_id and dp.user_id = auth.uid()));

-- 6. Badges
create table if not exists badges (
  id uuid primary key default gen_random_uuid(),
  code text unique not null,
  name text not null,
  description text not null,
  icon text not null,
  unlock_rule jsonb
);

-- Seed badges
insert into badges (code, name, description, icon) values
  ('first_plan', 'Primeiro Plano', 'Criar o primeiro DailyPlan', '📋'),
  ('seven_plans', 'Semana Forte', '7 dias planejados', '📅'),
  ('thirty_plans', 'Mês Dedicado', '30 dias planejados', '🗓️'),
  ('first_frog', 'Primeiro Sapo', 'Concluir o primeiro sapo', '🐸'),
  ('ten_frogs', 'Caçador de Sapos', '10 sapos concluídos', '🏆'),
  ('seven_exercise', 'Atleta', '7 dias com exercício', '💪'),
  ('five_perfect', 'Perfeccionista', '5 dias com 6/6 categorias', '⭐'),
  ('week_streak', 'Sem Parar', '7 dias consecutivos', '🔥')
on conflict (code) do nothing;

-- 7. User Badges
create table if not exists user_badges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  badge_id uuid not null references badges(id) on delete cascade,
  unlocked_at timestamptz not null default now(),
  unique(user_id, badge_id)
);

alter table user_badges enable row level security;
create policy "Users own badges" on user_badges for all using (auth.uid() = user_id);

-- ═══════════════════════════════════════
-- Done! Now go to Authentication → Settings
-- and disable "Confirm email" for easier testing.
-- ═══════════════════════════════════════
