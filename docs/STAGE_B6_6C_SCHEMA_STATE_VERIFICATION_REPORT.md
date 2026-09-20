# B6.6C Schema State Verification Report

Date: 2026-09-16
Project: `yvlgahcyapibgecklfuq`

## Migration History

- Command: `npx supabase migration list --linked`
- Result: PASS
- Local and remote migration: `20260915000000 | 20260915000000 | 2026-09-15 00:00:00`
- Migration source: `supabase/migrations/20260915000000_curriculum_hierarchy_foundation.sql`
- The migration was not reapplied.

## Remote Schema

Result: PASS. The following B6.6A tables exist in `public`:

- `curriculum_themes`
- `curriculum_subthemes`
- `curriculum_objective_sets`

The B6.6A columns exist on `topics` with the expected definitions:

- `curriculum_id`: `text`, nullable, unique, no default
- `curriculum_subtheme_id`: `text`, nullable, no default
- `curriculum_verification_status`: `text`, nullable, no default
- `curriculum_source_document`: `text`, nullable, no default
- `curriculum_source_url`: `text`, nullable, no default
- `curriculum_source_pages`: `integer[]`, nullable, no default

The new table columns, defaults, and nullability match the migration, including `source_pages integer[] not null default '{}'`, timestamp defaults, and the objective `jsonb not null default '[]'::jsonb` field.

## Constraints and Indexes

Result: PASS.

- Primary keys and uniqueness constraints match the migration.
- Foreign keys exist for theme subject/class, subtheme theme, objective-set topic, and topic subtheme relationships, all with `ON DELETE RESTRICT`.
- Verification-status and identifier-format checks exist.
- The topic curriculum-ID format check is present as intentionally `NOT VALID`, matching the migration.
- The objective JSON check enforces an array.
- Expected indexes exist:
  - `curriculum_themes_subject_class_idx`
  - `curriculum_subthemes_theme_idx`
  - `topics_curriculum_subtheme_idx` with the expected non-null predicate
  - unique indexes created by the primary keys and unique constraints

## RLS and Policies

Result: PASS.

Row-level security is enabled on all three new hierarchy tables. Each has the intended authenticated `ALL` policy:

- `Admins can manage curriculum themes`
- `Admins can manage curriculum subthemes`
- `Admins can manage curriculum objective sets`

Each policy checks `profiles.role` for `admin` or `super_admin` using the authenticated user ID, for both `USING` and `WITH CHECK`.

## Existing Relationships

Result: PASS.

- `questions.topic_id` remains a foreign key to `topics(id)` with `ON DELETE RESTRICT`.
- Existing question-option, exam-attempt-question, exam-answer, and result-question-snapshot foreign keys remain present.
- Existing exam attempt relationships to classes, subjects, terms, and profiles remain present.
- No existing exam, question, or result relationship was modified by this verification.

## Production Safety

All inspection was read-only. No migration push, reset, repair, import, or data mutation was performed.

Observed current row counts:

| Relation                               |  Rows |
| -------------------------------------- | ----: |
| `curriculum_themes`                    |     0 |
| `curriculum_subthemes`                 |     0 |
| `curriculum_objective_sets`            |     0 |
| `topics`                               |     0 |
| `topics` with non-null `curriculum_id` |     0 |
| `questions`                            | 1,750 |
| `question_options`                     | 6,998 |
| `exam_attempts`                        |     8 |
| `exam_attempt_questions`               |   320 |
| `exam_answers`                         |    98 |
| `exam_result_question_snapshots`       |   200 |
| `profiles`                             |     3 |

The hierarchy tables are empty and no curriculum import has been performed. Existing production data was not altered by this verification.

## Decision

- Migration history: PASS
- Remote schema: PASS
- Constraints/indexes: PASS
- RLS/policies: PASS
- Existing relationships: PASS
- Production safety: PASS
- Curriculum import: NOT PERFORMED

**READY FOR CURRICULUM IMPORT**
