create or replace function public.submit_safe_exam_attempt(p_attempt_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  attempt_row public.exam_attempts%rowtype;
  question_row record;
  answer_row record;
  total_points numeric := 0;
  score_value numeric := 0;
  answered_count integer := 0;
  correct_count integer := 0;
  percentage_value numeric := 0;
  grade_value text;
  message_value text;
  status_value text;
  now_value timestamptz := now();
begin
  select * into attempt_row
  from public.exam_attempts
  where id = p_attempt_id and student_id = (select auth.uid())
  for update;

  if not found then
    raise exception using errcode = '42501', message = 'Attempt not found.';
  end if;

  if attempt_row.status <> 'in_progress' then
    return jsonb_build_object(
      'attemptId', attempt_row.id,
      'score', attempt_row.score,
      'totalPoints', coalesce((select sum(points) from public.exam_attempt_questions where attempt_id = attempt_row.id), 0),
      'percentage', attempt_row.percentage,
      'grade', attempt_row.grade,
      'passed', attempt_row.passed,
      'totalQuestions', attempt_row.total_questions,
      'answeredQuestions', (select count(*) from public.exam_answers where attempt_id = attempt_row.id),
      'status', attempt_row.status,
      'startedAt', attempt_row.started_at,
      'expiresAt', attempt_row.expires_at,
      'submittedAt', attempt_row.submitted_at,
      'performanceMessage', case
        when attempt_row.grade = 'A+' then 'Outstanding performance'
        when attempt_row.grade = 'A' then 'Excellent work'
        when attempt_row.grade = 'B' then 'Very good job'
        when attempt_row.grade = 'C' then 'Good effort'
        when attempt_row.grade = 'D' then 'Pass'
        else 'Needs improvement'
      end
    );
  end if;

  if not exists (select 1 from public.exam_attempt_questions where attempt_id = attempt_row.id)
     or (select count(*) from public.exam_attempt_questions where attempt_id = attempt_row.id) <> attempt_row.total_questions then
    raise exception using errcode = '22023', message = 'Attempt question snapshot is invalid.';
  end if;

  for question_row in
    select aq.question_id, aq.points
    from public.exam_attempt_questions aq
    where aq.attempt_id = attempt_row.id
    order by aq.display_order
  loop
    total_points := total_points + question_row.points;
    select ea.selected_option_id into answer_row
    from public.exam_answers ea
    where ea.attempt_id = attempt_row.id and ea.question_id = question_row.question_id;

    if found and answer_row.selected_option_id is not null then
      answered_count := answered_count + 1;
      if exists (
        select 1 from public.question_options qo
        where qo.question_id = question_row.question_id
          and qo.id = answer_row.selected_option_id
          and qo.is_correct = true
      ) then
        score_value := score_value + question_row.points;
        correct_count := correct_count + 1;
        update public.exam_answers
        set is_correct = true, updated_at = now_value
        where attempt_id = attempt_row.id and question_id = question_row.question_id;
      else
        update public.exam_answers
        set is_correct = false, updated_at = now_value
        where attempt_id = attempt_row.id and question_id = question_row.question_id;
      end if;
    end if;
  end loop;

  percentage_value := case when total_points > 0 then round((score_value / total_points) * 100) else 0 end;
  if percentage_value >= 80 then grade_value := 'A+'; message_value := 'Outstanding performance';
  elsif percentage_value >= 70 then grade_value := 'A'; message_value := 'Excellent work';
  elsif percentage_value >= 60 then grade_value := 'B'; message_value := 'Very good job';
  elsif percentage_value >= 50 then grade_value := 'C'; message_value := 'Good effort';
  elsif percentage_value >= 40 then grade_value := 'D'; message_value := 'Pass';
  else grade_value := 'F'; message_value := 'Needs improvement';
  end if;

  status_value := case when now_value >= attempt_row.expires_at then 'expired' else 'submitted' end;
  update public.exam_attempts
  set score = score_value, percentage = percentage_value, grade = grade_value,
      passed = percentage_value >= 50, status = status_value,
      submitted_at = now_value, updated_at = now_value
  where id = attempt_row.id;

  return jsonb_build_object(
    'attemptId', attempt_row.id, 'score', score_value, 'totalPoints', total_points,
    'percentage', percentage_value, 'grade', grade_value, 'passed', percentage_value >= 50,
    'totalQuestions', attempt_row.total_questions, 'answeredQuestions', answered_count,
    'correctAnswers', correct_count, 'status', status_value,
    'startedAt', attempt_row.started_at, 'expiresAt', attempt_row.expires_at,
    'submittedAt', now_value, 'performanceMessage', message_value
  );
end;
$$;

grant execute on function public.submit_safe_exam_attempt(uuid) to authenticated;
revoke execute on function public.submit_safe_exam_attempt(uuid) from public;
