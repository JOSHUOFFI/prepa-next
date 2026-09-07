create or replace function public.admin_delete_exam_attempt(p_attempt_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if not exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'super_admin')
  ) then
    raise exception using errcode = '42501', message = 'Admin access required.';
  end if;

  delete from public.exam_result_question_snapshots where attempt_id = p_attempt_id;
  delete from public.exam_answers where attempt_id = p_attempt_id;
  delete from public.exam_attempt_questions where attempt_id = p_attempt_id;
  delete from public.exam_attempts where id = p_attempt_id;

  if not found then
    raise exception using errcode = 'P0002', message = 'Result not found.';
  end if;
end;
$$;

revoke execute on function public.admin_delete_exam_attempt(uuid) from public;
grant execute on function public.admin_delete_exam_attempt(uuid) to authenticated;