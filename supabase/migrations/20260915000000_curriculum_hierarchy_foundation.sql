-- B6.6A: additive hierarchy/provenance support for the validated curriculum import.
-- This migration deliberately does not insert, update, or delete curriculum data.

create table public.curriculum_themes (
  id text primary key check (id ~ '^theme_[a-f0-9]{16}$'),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid not null references public.classes(id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  verification_status text not null check (verification_status in ('verified', 'review_required')),
  source_document text,
  source_url text,
  source_pages integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (subject_id, class_id, name)
);

create table public.curriculum_subthemes (
  id text primary key check (id ~ '^subtheme_[a-f0-9]{16}$'),
  theme_id text not null references public.curriculum_themes(id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  verification_status text not null check (verification_status in ('verified', 'review_required')),
  source_document text,
  source_url text,
  source_pages integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (theme_id, name)
);

alter table public.topics
  add column if not exists curriculum_id text unique,
  add column if not exists curriculum_subtheme_id text references public.curriculum_subthemes(id) on delete restrict,
  add column if not exists curriculum_verification_status text check (curriculum_verification_status in ('verified', 'review_required')),
  add column if not exists curriculum_source_document text,
  add column if not exists curriculum_source_url text,
  add column if not exists curriculum_source_pages integer[];

alter table public.topics
  add constraint topics_curriculum_id_format_check
  check (curriculum_id is null or curriculum_id ~ '^topic_[a-f0-9]{16}$') not valid;

create index curriculum_themes_subject_class_idx
  on public.curriculum_themes(subject_id, class_id);
create index curriculum_subthemes_theme_idx
  on public.curriculum_subthemes(theme_id);
create index topics_curriculum_subtheme_idx
  on public.topics(curriculum_subtheme_id)
  where curriculum_subtheme_id is not null;

create table public.curriculum_objective_sets (
  id text primary key check (id ~ '^objectives_[a-f0-9]{16}$'),
  topic_id uuid not null unique references public.topics(id) on delete restrict,
  verification_status text not null check (verification_status in ('verified', 'review_required')),
  objectives jsonb not null default '[]'::jsonb check (jsonb_typeof(objectives) = 'array'),
  source_document text,
  source_url text,
  source_pages integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.curriculum_themes enable row level security;
alter table public.curriculum_subthemes enable row level security;
alter table public.curriculum_objective_sets enable row level security;

create policy "Admins can manage curriculum themes"
  on public.curriculum_themes for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));

create policy "Admins can manage curriculum subthemes"
  on public.curriculum_subthemes for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));

create policy "Admins can manage curriculum objective sets"
  on public.curriculum_objective_sets for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));
