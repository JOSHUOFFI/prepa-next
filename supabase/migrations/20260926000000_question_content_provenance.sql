alter table public.questions
  add column if not exists content_provenance text not null default 'legacy_uncited';

alter table public.questions
  drop constraint if exists questions_content_provenance_check;

alter table public.questions
  add constraint questions_content_provenance_check
  check (content_provenance in ('legacy_uncited', 'prepa_authored', 'officially_sourced'));