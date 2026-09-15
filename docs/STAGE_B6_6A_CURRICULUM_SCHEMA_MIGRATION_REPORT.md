# Stage B6.6A Curriculum Schema Migration Report

## Current blocker

B6.6 correctly stopped without importing: `public.topics` is a flat leaf table and cannot preserve the validated theme/sub-theme hierarchy, objective verification state, or source provenance. The linked Supabase CLI cannot authenticate (`28P01`), so production migration application remains unavailable.

## Existing schema

`subjects` and `classes` are reusable reference tables. `topics` has a UUID primary key and is referenced by `questions.topic_id`; `questions` is in turn referenced by question options and exam records. `topics.term_id` is nullable, which is compatible with the required unassigned term state. Existing topic RLS restricts management to admins.

## Proposed schema

The migration adds `curriculum_themes` (subject/class parent) and `curriculum_subthemes` (theme parent), then extends—not replaces—`topics` with nullable stable curriculum ID, sub-theme foreign key, verification status, and provenance fields. `curriculum_objective_sets` provides one status-preserving JSON objective array per topic. Subject/class and existing topic UUID concepts are reused.

## Compatibility

No existing row is rewritten or removed. New `topics` fields are nullable, so existing flat topics and all `questions.topic_id` relationships remain valid. No question, option, exam, result, user, profile, or authentication object is altered. The migration adds only hierarchy tables, additive leaf metadata, indexes, checks, and admin-only RLS policies consistent with `topics`.

## Migration

`supabase/migrations/20260915000000_curriculum_hierarchy_foundation.sql`

## Production status

- Migration applied to production: NO
- Curriculum imported: NO
- Questions changed: 0
- Exam data changed: 0
- Production data changed: 0

## Remaining blocker

Supabase authentication (`28P01`) must be repaired before the migration can be applied and B6.6 can be safely retried. No import, term assignment, question generation, UI work, or production write was performed.

## Local validation

The source dataset validator passes and a static migration review confirms additive ordering, valid parent references to existing `subjects`/`classes`/`topics`, nullable extensions for backward compatibility, unique stable IDs, and admin-only RLS policies. The local Supabase database lint could not run because the Supabase CLI is not locally installed and sandboxed dependency retrieval is unavailable; this does not authorize applying the migration. Application lint and build are run separately below.
