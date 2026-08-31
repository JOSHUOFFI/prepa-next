create table public.topics (
  id uuid primary key default gen_random_uuid(),
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid references public.classes(id) on delete restrict,
  term_id uuid references public.terms(id) on delete restrict,
  name text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(name)) > 0)
);

create unique index topics_subject_scope_name_idx
  on public.topics (subject_id, coalesce(class_id, '00000000-0000-0000-0000-000000000000'::uuid), coalesce(term_id, '00000000-0000-0000-0000-000000000000'::uuid), lower(btrim(name)));
create index topics_subject_active_idx on public.topics(subject_id, is_active);
create index topics_class_term_idx on public.topics(class_id, term_id);

alter table public.questions add column if not exists topic_id uuid references public.topics(id) on delete restrict;
alter table public.questions add column if not exists difficulty text check (difficulty in ('easy', 'medium', 'hard'));
alter table public.questions add column if not exists question_type text check (question_type in ('multiple_choice', 'true_false', 'short_answer'));
alter table public.questions add column if not exists created_by uuid references public.profiles(id) on delete set null;

create index questions_subject_class_term_topic_idx on public.questions(subject_id, class_id, term_id, topic_id);
create index questions_subject_difficulty_active_idx on public.questions(subject_id, difficulty, is_active);
create index questions_subject_type_active_idx on public.questions(subject_id, question_type, is_active);
create index questions_created_by_idx on public.questions(created_by);

alter table public.topics enable row level security;

create policy "Admins can read topics"
  on public.topics for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));
create policy "Admins can create topics"
  on public.topics for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));
create policy "Admins can update topics"
  on public.topics for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));
create policy "Admins can delete topics"
  on public.topics for delete to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));

create policy "Admins can manage questions"
  on public.questions for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));
create policy "Admins can manage question options"
  on public.question_options for all to authenticated
  using (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')))
  with check (exists (select 1 from public.profiles p where p.id = (select auth.uid()) and p.role in ('admin', 'super_admin')));
