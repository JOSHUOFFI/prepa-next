create or replace function public.handle_new_user_profile()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  profile_name text;
begin
  profile_name := nullif(
    left(
      regexp_replace(
        btrim(coalesce(new.raw_user_meta_data ->> 'full_name', '')),
        '[[:cntrl:]]',
        '',
        'g'
      ),
      120
    ),
    ''
  );

  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(profile_name, 'Student'),
    new.email,
    'student'
  )
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user_profile();

revoke update on table public.profiles from authenticated;
grant update (full_name, class_id) on table public.profiles to authenticated;

create policy "Students can update their onboarding profile"
  on public.profiles
  for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy "Students can update ungraded answers for their attempts"
  on public.exam_answers;

create policy "Students can update ungraded answers for their attempts"
  on public.exam_answers
  for update
  to authenticated
  using (
    is_correct is null
    and exists (
      select 1
      from public.exam_attempts as attempt
      where attempt.id = attempt_id
        and attempt.student_id = (select auth.uid())
        and attempt.status = 'in_progress'
    )
  )
  with check (
    is_correct is null
    and exists (
      select 1
      from public.exam_attempts as attempt
      where attempt.id = attempt_id
        and attempt.student_id = (select auth.uid())
        and attempt.status = 'in_progress'
    )
  );
