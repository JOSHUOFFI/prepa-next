# B6.6D.5 Subject Availability and Class/Term Dependency Audit

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Scope: read-only production and repository audit

## 1. Executive Summary

Two independent issues were found.

1. **Accounting and History are not broken by mapping or routing.** Their active production subject rows and UUIDs exist and both appear in the frontend, but each has zero production questions. Exam generation therefore returns `EXAM_UNAVAILABLE`.
2. **The student exam flow unnecessarily requires class and term.** The question repository already supports a subject-only/global pool when class and term are omitted, but both exam API routes currently reject omitted values. The attempt route also validates scoped question metadata and stores class/term on new attempts.

An additional concrete data/filtering defect exists: Mathematics has one scoped question for `JSS1`/`First Term`. When that exact selection is made, the repository chooses the one-question scoped pool and does not fall back to the 150-question global pool, so the exam fails the 40-question minimum. This is class/term selection behavior, not a subject-ID problem.

The recommended direction is to simplify new student exam generation to production subject only while retaining existing class/term columns and historical records. This is feasible, but it requires a small coordinated application change before implementation can begin.

## 2. Subject Availability Findings

The read-only production query found 18 active subjects and 1,750 active questions. Every active question had at least one option. Every active question had `topic_id = null`; 1 question had non-null class/term metadata and the remaining questions were global pools.

All active subject rows have valid UUIDs and appear in `app/exam/page.tsx`, which loads active subjects from `public.subjects` without filtering by question availability. `ExamSetup` also leaves every subject selectable and displays a hard-coded `questionCount: 0` for every option, so the count shown in the UI is not a production count.

| Subject | Production UUID | Frontend | Selectable | Questions | Eligible with options | Generation/start result |
| --- | --- | --- | --- | ---: | ---: | --- |
| Accounting | `1696fc62-d7e6-4547-a01f-f140644ef1b8` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |
| Agricultural Science | `ab79e100-9e4c-4a9e-b952-19df15b2443c` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |
| Basic Science | `7c901feb-d013-4c90-9585-6c0fe317b472` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |
| Basic Technology | `46aa307a-5002-48dd-b4ba-7798a2f5e258` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |
| Biology | `bb3d3ab5-ba77-47f5-967d-0b850e406480` | Yes | Yes | 160 | 160 | Succeeds with global pool |
| Business Studies | `5b894bfe-6f29-41a6-907c-26a4c2f11fff` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |
| Chemistry | `46a1093b-2ac5-4e2b-835b-f009a72cb359` | Yes | Yes | 190 | 190 | Succeeds with global pool |
| Civic Education | `f0d8904d-842b-478c-b3ba-e2e3054429a1` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |
| Commerce | `d319d302-334b-4eb4-b403-b46f7a794a09` | Yes | Yes | 200 | 200 | Succeeds with global pool |
| CRS | `5e4ff239-fd12-4765-b035-70ea77ecee6c` | Yes | Yes | 200 | 200 | Succeeds with global pool |
| Economics | `a55ad82b-4630-491b-ae8d-76613c147d27` | Yes | Yes | 200 | 200 | Succeeds with global pool |
| English | `a0e64f96-d382-4cee-9f84-b1e6b5e075c6` | Yes | Yes | 99 | 99 | Succeeds with global pool |
| Government | `d9dabed8-efa8-46fb-9637-ca4c30caa97d` | Yes | Yes | 200 | 200 | Succeeds with global pool |
| History | `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |
| Literature | `91f5f142-acbf-42bb-b85e-c58ef9d15d54` | Yes | Yes | 200 | 200 | Succeeds with global pool |
| Mathematics | `91f37d59-3401-47c5-ae18-46ead707c570` | Yes | Yes | 151 | 151 | Usually succeeds; JSS1/First Term fails due to one-question scoped pool |
| Physics | `1812a3d8-cfb8-4564-ae3b-5611c8c2357c` | Yes | Yes | 150 | 150 | Succeeds with global pool |
| Social Studies | `a84c1eac-8827-433b-9e89-535b96540f53` | Yes | Yes | 0 | 0 | Fails `EXAM_UNAVAILABLE` |

The live counts differ from older B5/B6 reports for some subjects and attempt totals. This audit uses the current read-only production query: 1,750 questions and 15 attempts.

## 3. Accounting Findings

Accounting exists as an active production subject with a valid UUID and is rendered by the subject selector. The production query found zero questions, zero active questions, zero eligible questions with options, and no topic links. The question repository therefore returns an empty pool, and `/api/exam/questions` returns HTTP 422 with `EXAM_UNAVAILABLE`.

**Actual cause:** missing production questions, not an invalid subject ID, topic mismatch, RLS failure, curriculum mapping, or class/term filtering.

## 4. History Findings

History has the same technical profile as Accounting: valid active subject row, frontend visibility, selectable subject, zero questions, zero eligible questions, and no topic links. It fails at question-pool generation with `EXAM_UNAVAILABLE`.

**Actual cause:** missing production questions, not a mapping or foreign-key resolution failure.

## 5. Other Problematic Subjects

The same no-question condition affects Agricultural Science, Basic Science, Basic Technology, Business Studies, Civic Education, and Social Studies. These are the eight zero-question subjects in the current production bank, including Accounting and History.

The subjects that currently have sufficient global pools are Biology, Chemistry, Commerce, CRS, Economics, English, Government, Literature, Mathematics, and Physics. Government and Economics now have 200 questions each; older documentation describing them as below the 40-question threshold is stale.

## 6. Question-Bank Findings

The current read-only production question audit found:

- 1,750 questions total.
- 1,750 active questions.
- 1,750 questions with at least one option and therefore eligible at the option-filter stage.
- 1,750 questions with `topic_id = null`.
- 1 question with non-null class/term metadata; the other 1,749 are global.
- 0 topics in `public.topics` in the current production snapshot.
- No evidence that Accounting or History questions are hidden by topic foreign keys; they have no question rows at all.

The question repository filters by `questions.subject_id` and `is_active`, then removes questions without options. It does not filter by topic. Therefore the zero-question failures are directly attributable to subject-pool absence.

The Mathematics exception is concrete. Question `a96a0798-0836-4ffb-9c8f-d845ee6b81f4` is scoped to class `JSS1` and `First Term`. When both values are supplied and that scoped query returns one row, `getQuestionRows()` returns that scoped result instead of the global Mathematics pool. The API then rejects the one-question result because 40 questions are required.

RLS is not the cause of the current student pool behavior: the server-side question repository uses the Supabase admin client, and the API authenticates the student before calling it. The production migration also intentionally removed direct authenticated read policies for questions/options; questions are served through the server boundary.

## 7. Class/Term Dependency Findings

### A. Required for current exam functionality

- `/api/exam/questions` currently rejects requests without `classLevel` and `term`.
- `loadSafeExamQuestions()` resolves class and term IDs when both are supplied and first attempts a scoped question pool.
- `/api/exam/attempts` currently requires class and term, resolves their UUIDs, checks question scope, and inserts `exam_attempts.class_id` and `term_id`.
- Remote attempt recovery reads class and term from the attempt and rejects recovery if either is absent.
- Results APIs read class and term for historical display.

These are current implementation requirements, not proof that subject-only generation is conceptually required.

### B. Student-UX-only

- `app/exam/page.tsx` loads class and term rows and passes them to `ExamSetup`.
- `ExamSetup` renders class and term selectors, validates them, sends them as question-query parameters, includes them in local state, and includes them in remote attempt creation.
- The exam header and result export display class and term.

The subject selector itself is independent of class/term. The frontend currently marks every subject `questionCount: 0`, which is misleading but does not prevent selection.

### C. Optional/future curriculum metadata

- `questions.class_id` and `questions.term_id` remain useful for authoring, teacher tools, curriculum coverage, reporting, and future scoped exams.
- `topics.class_id` and `topics.term_id` remain production curriculum metadata.
- Admin question-bank filters, curriculum-manager filters, result filters, and coverage calculations use class/term and should remain available.
- `profiles.class_id` remains account/class metadata and is not a reason to require student exam selection.
- Source-native NERDC edition/theme/subtheme/topic data should retain its own class/term/source metadata; the student exam selector should not be coupled to it.

## 8. Current Exam Flow

```text
app/exam/page.tsx
  -> active public.subjects list
  -> ExamSetup: first name, last name, class, term, subject
  -> GET /api/exam/questions?subject=&classLevel=&term=
  -> loadSafeExamQuestions(subject, classLevel, term)
  -> scoped questions if any; otherwise global questions
  -> require at least 40 questions with options
  -> POST /api/exam/attempts with subject, class, term, question IDs
  -> validate subject and scope; insert exam_attempts
  -> insert exam_attempt_questions snapshot
  -> local safe exam state and `/exam/take`
  -> answer API and `submit_safe_exam_attempt` RPC
  -> result snapshots, grading, and results API
```

The subject list is not availability-aware, and the displayed count is hard-coded to zero. The generation endpoint is the first authoritative availability check.

## 9. Proposed Subject-Only Flow

The preferred simplified flow is technically viable for new attempts:

```text
Student
  -> Choose production subject
  -> GET /api/exam/questions?subject=
  -> load global active questions for that subject
  -> require 40 eligible questions
  -> POST /api/exam/attempts with subject and question IDs
  -> insert new attempt with class_id = null and term_id = null
  -> snapshot questions
  -> answer, submit, grade, and show result
```

The minimum coordinated change is:

1. Make class/term optional or remove them from the question route contract and call the repository with subject only.
2. Update attempt creation to accept subject plus question IDs, skip class/term lookup/scope validation, and insert null class/term for new subject-only attempts.
3. Update recovery/local state so a subject-only attempt does not fail merely because class/term are null.
4. Keep result display tolerant of null class/term while preserving historical values for old attempts.
5. Keep admin authoring, reporting, and curriculum class/term fields unchanged.

The current question repository already has the needed subject-only behavior: when no class/term is supplied, it loads questions where both `class_id` and `term_id` are null. Because 1,749 current questions are global, this is the existing production pool. The implementation should explicitly choose this global-pool contract rather than silently mixing scoped and global rows.

## 10. Technical Dependencies

Subject-only generation is **not available through the current HTTP contract**, because both exam routes require class/term. It **is available inside the repository** through optional parameters.

Dependencies that must change before subject-only implementation:

- `ExamSetup` state, validation, query parameters, and `safeExamStorage` configuration.
- `/api/exam/questions` required-parameter validation.
- `/api/exam/attempts` request validation and scoped-question check.
- Remote-attempt recovery and safe local-state typing.
- Result/header presentation for nullable new class/term values.

Dependencies that do not need to change for subject-only question delivery:

- `questions.subject_id` filtering.
- Active-question and option eligibility filtering.
- Question snapshot creation.
- Answer validation.
- `submit_safe_exam_attempt` grading logic, which grades the snapshotted questions and does not use class/term.
- Existing historical attempts and result snapshots.

## 11. Historical Data Impact

Removing class/term from the new student UI does not invalidate historical data. Current production records include 15 attempts, 600 attempt-question rows, 243 answers, and 360 result snapshots; all 15 current attempts have class/term values. Those values can remain unchanged.

The attempt schema permits nullable `class_id` and `term_id`. New subject-only attempts can therefore store null values without changing existing rows. Historical results continue to use their stored subject/class/term values, question snapshots, and grading fields.

The main compatibility requirement is application handling of null values for newly created subject-only attempts. Recovery and result presentation must stop treating class/term as mandatory for new records. Existing records must continue displaying their original metadata.

## 12. Recommended Implementation Sequence

1. Do not modify production data or curriculum mapping as part of this UX change.
2. Add read-only availability diagnostics or server-side subject availability data so the selector no longer reports a hard-coded zero.
3. Define the subject-only question API contract and make global-pool selection explicit.
4. Update attempt creation to preserve the production subject ID and snapshot the selected questions while allowing null class/term.
5. Update recovery, local state, exam header, and results for nullable new metadata.
6. Preserve class/term in admin question authoring, curriculum management, coverage, analytics, and historical results.
7. Test all currently working subjects, zero-question subjects, and the Mathematics scoped-pool edge case.
8. Test historical attempt recovery, grading, result lookup, and exports.

No implementation was performed in this audit.

## 13. Final Gate

**PASS — READY FOR IMPLEMENTATION**

The subject issues and class/term dependencies are sufficiently understood. Accounting and History have a confirmed data-availability cause: zero production questions. Subject-only exam generation is feasible with a minor coordinated application change because the repository already supports a global subject pool and the database columns are nullable.

This PASS authorizes planning/implementation of the separately reviewed application change only. It does not authorize question creation, production data repair, schema changes, curriculum import, or mapping decisions.

```text
B6.6D.5 STATUS: PASS
DOCUMENT: docs/STAGE_B6_6D_5_SUBJECT_AVAILABILITY_CLASS_TERM_AUDIT.md
DATABASE MODIFIED: NO
PRODUCTION DATA MODIFIED: NO
APPLICATION CODE MODIFIED: NO
SUBJECT ISSUES IDENTIFIED: YES
CLASS/TERM REMOVAL FEASIBLE: REQUIRES MINOR CHANGE
READY FOR IMPLEMENTATION: YES
```

`B6.6D.5 COMPLETE — SUBJECT AVAILABILITY AND CLASS/TERM AUDIT`
