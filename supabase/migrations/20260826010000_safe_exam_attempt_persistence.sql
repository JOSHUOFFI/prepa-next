create table public.exam_attempt_questions (
  id uuid primary key default gen_random_uuid(),
  attempt_id uuid not null references public.exam_attempts(id) on delete restrict,
  question_id uuid not null references public.questions(id) on delete restrict,
  display_order integer not null check (display_order >= 0),
  points numeric(8, 2) not null check (points > 0),
  created_at timestamptz not null default now(),
  unique (attempt_id, question_id),
  unique (attempt_id, display_order)
);

create index exam_attempt_questions_attempt_id_idx on public.exam_attempt_questions(attempt_id);
create index exam_attempt_questions_question_id_idx on public.exam_attempt_questions(question_id);

alter table public.exam_attempt_questions enable row level security;

create policy "Students can read their own attempt questions"
  on public.exam_attempt_questions for select to authenticated
  using (exists (
    select 1 from public.exam_attempts a
    where a.id = attempt_id and a.student_id = (select auth.uid())
  ));

-- Attempts and snapshots are created by the authenticated server boundary.
-- No client insert, update, or delete policy makes the selected set mutable.

drop policy if exists "Students can update ungraded answers for their attempts"
  on public.exam_answers;

create policy "Students can update ungraded answers for their attempts"
  on public.exam_answers for update to authenticated
  using (
    is_correct is null
    and exists (
      select 1 from public.exam_attempts a
      where a.id = attempt_id
        and a.student_id = (select auth.uid())
        and a.status = 'in_progress'
    )
  )
  with check (
    is_correct is null
    and exists (
      select 1 from public.exam_attempts a
      where a.id = attempt_id
        and a.student_id = (select auth.uid())
        and a.status = 'in_progress'
    )
  );
