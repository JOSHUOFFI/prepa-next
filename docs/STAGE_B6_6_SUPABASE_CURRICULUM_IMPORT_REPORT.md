# Stage B6.6 Supabase Curriculum Import Report

## Source

- Dataset: `data/curriculum/jss1-3.json`
- B6.5 release gate: PASS

## Pre-import result

**B6.6 STATUS: BLOCKED.** No curriculum data was written.

The normalized source validator passes with 41 themes, 55 sub-themes, 134 topics, 42 verified objective sets, 92 review-required objective sets, 385 unique IDs, 50 Mathematics topics, and no term allocation.

Read-only production preflight found 18 subjects, 5 classes, 3 terms, 0 topics, 1,750 questions, 6,998 question options, 8 exam attempts, and 98 exam answers. The production schema does not expose `curriculum_themes`, `curriculum_subthemes`, or `curriculum_objective_sets` (PostgREST `PGRST205`). The existing `topics` table only stores subject/class/term/name and cannot preserve the required hierarchy, objective status, or source provenance.

The linked Supabase CLI also cannot authenticate to inspect/apply migrations: the temporary `supabase_admin` login is rejected with PostgreSQL authentication error `28P01`.

## Import and verification

- Subjects imported: 0
- Classes imported: 0
- Themes imported: 0
- Sub-themes imported: 0
- Topics imported: 0
- Objective sets imported: 0
- Verified objective sets imported: 0
- Review-required objective sets imported: 0
- Duplicate/orphan/provenance/status/unassigned-term/Mathematics post-import checks: not run, because no write was safe.

## Production safety

- Questions changed: 0
- Question options changed: 0
- Exam attempts changed: 0
- Results changed: 0
- Users/profiles changed: 0
- Unrelated production tables changed: 0

## Idempotency

No importer was run. A safe idempotent importer requires an authenticated schema migration that adds the missing hierarchy/objective/provenance representation (or restores the migration that owns it), followed by a fresh preflight.

## Final decision

`B6.6 STATUS: BLOCKED`

Concrete blocker: the linked production schema cannot represent the normalized B6.5 curriculum and migration access is currently unavailable. This prevents a lossless controlled import; no partial import was attempted.
