drop policy if exists "Authenticated users can read active questions"
  on public.questions;

drop policy if exists "Authenticated users can read options for active questions"
  on public.question_options;
