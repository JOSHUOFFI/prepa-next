create extension if not exists pgcrypto;

create table public.schools (
  id uuid primary key default gen_random_uuid(), name text not null,
  slug text not null unique, email text, phone text, address text,
  is_active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table public.classes (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  slug text not null unique, sort_order integer not null unique check (sort_order > 0),
  created_at timestamptz not null default now()
);
create table public.terms (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  slug text not null unique, sort_order integer not null unique check (sort_order > 0),
  created_at timestamptz not null default now()
);
create table public.subjects (
  id uuid primary key default gen_random_uuid(), name text not null unique,
  slug text not null unique, category text not null, is_active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade, full_name text not null,
  email text, role text not null default 'student' check (role in ('student', 'teacher', 'admin', 'super_admin')),
  class_id uuid references public.classes(id) on delete set null,
  school_id uuid references public.schools(id) on delete set null,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table public.questions (
  id uuid primary key default gen_random_uuid(), legacy_id text not null,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid references public.classes(id) on delete restrict,
  term_id uuid references public.terms(id) on delete restrict, question_text text not null,
  explanation text, points numeric(8, 2) not null default 1 check (points > 0),
  is_active boolean not null default true, created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(), unique (subject_id, legacy_id)
);
create table public.question_options (
  id uuid primary key default gen_random_uuid(), question_id uuid not null references public.questions(id) on delete restrict,
  option_label text not null, option_text text not null, is_correct boolean not null default false,
  created_at timestamptz not null default now(), unique (question_id, option_label), unique (question_id, id)
);
create table public.exam_attempts (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete restrict,
  subject_id uuid not null references public.subjects(id) on delete restrict,
  class_id uuid references public.classes(id) on delete restrict, term_id uuid references public.terms(id) on delete restrict,
  started_at timestamptz not null default now(), expires_at timestamptz not null, submitted_at timestamptz,
  status text not null default 'in_progress' check (status in ('in_progress', 'submitted', 'expired', 'abandoned')),
  total_questions integer not null default 0 check (total_questions >= 0), score numeric(10, 2) check (score is null or score >= 0),
  percentage numeric(5, 2) check (percentage is null or (percentage >= 0 and percentage <= 100)), grade text, passed boolean,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), check (expires_at >= started_at),
  check ((status = 'in_progress' and submitted_at is null) or status <> 'in_progress')
);
create table public.exam_answers (
  id uuid primary key default gen_random_uuid(), attempt_id uuid not null references public.exam_attempts(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict, selected_option_id uuid, is_correct boolean,
  answered_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique (attempt_id, question_id), foreign key (question_id, selected_option_id)
    references public.question_options(question_id, id) on delete restrict
);

create index questions_subject_id_idx on public.questions(subject_id);
create index questions_class_id_idx on public.questions(class_id);
create index questions_term_id_idx on public.questions(term_id);
create index questions_active_idx on public.questions(is_active);
create index questions_active_selection_idx on public.questions(subject_id, class_id, term_id) where is_active = true;
create index question_options_question_id_idx on public.question_options(question_id);
create index exam_attempts_student_id_idx on public.exam_attempts(student_id);
create index exam_attempts_subject_id_idx on public.exam_attempts(subject_id);
create index exam_attempts_class_id_idx on public.exam_attempts(class_id);
create index exam_attempts_term_id_idx on public.exam_attempts(term_id);
create index exam_attempts_status_idx on public.exam_attempts(status);
create index exam_answers_attempt_id_idx on public.exam_answers(attempt_id);
create index exam_answers_question_id_idx on public.exam_answers(question_id);

alter table public.schools enable row level security;
alter table public.classes enable row level security;
alter table public.terms enable row level security;
alter table public.subjects enable row level security;
alter table public.profiles enable row level security;
alter table public.questions enable row level security;
alter table public.question_options enable row level security;
alter table public.exam_attempts enable row level security;
alter table public.exam_answers enable row level security;

create policy "Authenticated users can read active classes" on public.classes for select to authenticated using (true);
create policy "Authenticated users can read active terms" on public.terms for select to authenticated using (true);
create policy "Authenticated users can read active subjects" on public.subjects for select to authenticated using (is_active);
create policy "Authenticated users can read active questions" on public.questions for select to authenticated using (is_active);
create policy "Authenticated users can read options for active questions" on public.question_options for select to authenticated
  using (exists (select 1 from public.questions q where q.id = question_id and q.is_active));
create policy "Users can read their own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Students can read their own attempts" on public.exam_attempts for select to authenticated using (student_id = (select auth.uid()));
create policy "Students can create their own attempts" on public.exam_attempts for insert to authenticated with check (
  student_id = (select auth.uid()) and status = 'in_progress' and submitted_at is null
  and score is null and percentage is null and grade is null and passed is null
);
create policy "Students can read their own answers" on public.exam_answers for select to authenticated using (exists (
  select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = (select auth.uid())
));
create policy "Students can create ungraded answers for their attempts" on public.exam_answers for insert to authenticated with check (
  is_correct is null and exists (select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = (select auth.uid()) and a.status = 'in_progress')
);
create policy "Students can update ungraded answers for their attempts" on public.exam_answers for update to authenticated
  using (is_correct is null and exists (select 1 from public.exam_attempts a where a.id = attempt_id and a.student_id = (select auth.uid()) and a.status = 'in_progress'))
  with check (is_correct is null);