# B6.6D.4 Implementation and Migration Specification

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Source of truth: `data/curriculum/jss1-3.json`  
Approved architecture: [STAGE_B6_6D_3_FINAL_SCHEMA_DESIGN.md](STAGE_B6_6D_3_FINAL_SCHEMA_DESIGN.md)

## 1. Executive Summary

This document is a read-only, implementation-ready specification for the approved Model B:

```text
source edition
  -> source subject
    -> source theme
      -> source subtheme
        -> source topic
          -> one or more explicit mapping decisions
            -> existing production subject/topic
```

The source hierarchy is independent of the production curriculum. Existing production tables and rows remain the operational model for questions and exams. A later importer may create new production topics only after a source topic has an approved mapping to an existing production subject. It must fail closed for missing, unresolved, ambiguous, rejected, or review-required decisions.

**Implementation status for this stage: specification only.** No migration, SQL, application code, seed data, or production data was changed.

## 2. Repository and Schema Audit

### 2.1 Current production schema

The repository migrations establish the following actual contracts:

| Relation                           | Key facts                                                                                                                  | Existing dependency                                           |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| `public.subjects`                  | `id uuid primary key`; unique `name` and `slug`; `category`, `is_active`, timestamps                                       | Student selectors, question repository, exam attempts         |
| `public.topics`                    | `id uuid primary key`; `subject_id uuid not null`; nullable `class_id` and `term_id`; name/status/timestamps               | `questions.topic_id`; admin curriculum manager/importer       |
| `public.questions`                 | `id uuid primary key`; required `subject_id`; nullable `class_id`, `term_id`, `topic_id`; unique `(subject_id, legacy_id)` | Question options, attempts, answers, snapshots                |
| `public.exam_attempts`             | `id uuid primary key`; required `student_id`, `subject_id`; nullable class/term; status and scoring fields                 | Attempt questions, answers, result snapshots, student history |
| `public.curriculum_themes`         | B6.6A table; `id text primary key`; required production `subject_id` and `class_id`                                        | Currently empty per B6.6C; admin-only RLS                     |
| `public.curriculum_subthemes`      | `id text primary key`; required `theme_id`; unique `(theme_id, name)`                                                      | Currently empty per B6.6C; admin-only RLS                     |
| `public.curriculum_objective_sets` | `id text primary key`; unique required `topic_id`; JSON objective array                                                    | Currently empty per B6.6C; admin-only RLS                     |

### 2.2 Foreign keys and delete behavior

The relevant production foreign keys use restrictive deletion:

- `topics.subject_id -> subjects.id ON DELETE RESTRICT`.
- `topics.class_id -> classes.id ON DELETE RESTRICT`.
- `topics.term_id -> terms.id ON DELETE RESTRICT`.
- `questions.subject_id -> subjects.id ON DELETE RESTRICT`.
- `questions.topic_id -> topics.id ON DELETE RESTRICT`.
- `exam_attempts.subject_id -> subjects.id ON DELETE RESTRICT`.
- `exam_attempt_questions.question_id -> questions.id ON DELETE RESTRICT`.
- `exam_answers.attempt_id -> exam_attempts.id ON DELETE RESTRICT`.
- `exam_answers.question_id -> questions.id ON DELETE RESTRICT`.
- `exam_result_question_snapshots.attempt_id -> exam_attempts.id ON DELETE RESTRICT`.

The B6.6A foreign keys also use `ON DELETE RESTRICT` for theme, subtheme, topic, and objective-set dependencies. New source tables must follow the same provenance-preserving behavior.

### 2.3 Existing uniqueness and indexes

The production topic uniqueness index is:

```sql
topics_subject_scope_name_idx
  (subject_id,
   coalesce(class_id, zero_uuid),
   coalesce(term_id, zero_uuid),
   lower(btrim(name)))
```

Other relevant indexes include production subject/active, class/term, question subject/class/term/topic, question active selection, exam-attempt subject/class/term/status, and relationship indexes on question options, attempt questions, answers, and snapshots.

B6.6A adds indexes for theme subject/class, subtheme theme, and non-null topic curriculum subtheme. None of these indexes provides a source-native source-topic identity independent of a production topic.

### 2.4 Existing RLS and functions

Existing production RLS must remain unchanged:

- Authenticated users can read active subjects, active questions, and permitted options.
- Students can read/create their own permitted attempt and answer records under the existing checks.
- Topics, questions, and B6.6A hierarchy tables are managed by admins/super-admins through policies checking `profiles.role`.

The repository contains exam/security functions including `submit_safe_exam_attempt(uuid)` and `admin_delete_exam_attempt(uuid)`. There are no existing curriculum mapping RPCs and no existing source-curriculum functions. The new migration must not alter or replace the exam functions.

### 2.5 Application paths

Current code treats production subject/topic identity as authoritative:

- `app/api/admin/curriculum/route.ts` reads and writes `topics` by production `subject_id`.
- `components/admin/curriculum-manager.tsx` edits production topics and selects production subjects.
- `app/api/admin/import/route.ts` resolves exact active production subject names and production topic scope.
- `services/question-import-validation.ts` validates question input but has no source-topic concept.
- `app/api/admin/questions/route.ts` and `[id]/route.ts` require topic and subject scope agreement.
- `services/supabase-question-repository.ts` resolves an active production subject by name and loads production questions by `questions.subject_id`.
- `app/exam/page.tsx` selects active production subjects.
- `app/api/exam/questions/route.ts` and `app/api/exam/attempts/route.ts` use production subject names/UUIDs.
- The dashboard and result routes read production subject IDs from attempts.

### 2.6 D3 discrepancies resolved by this specification

The D3 document is approved architecture, but its implementation detail needs these corrections:

1. A partial unique index on `source_topic_id WHERE status = 'approved'` would prohibit one source topic mapping to multiple production targets. D4 replaces it with target-aware uniqueness.
2. A single generalized topic mapping table is sufficient. A separate subject-default table is not required for correctness because every importable source topic receives an explicit mapping row. This avoids default inheritance hiding missing consolidated-topic decisions.
3. `production_topic_id` must be nullable only during controlled production-topic creation. An approved mapping is import-ready only after it points to a production topic whose `subject_id` equals `production_subject_id`.
4. Source subject identity must include edition and class scope because the current normalized dataset derives source subject IDs from class plus subject code. Display names must not be used as identity.

## 3. Approved Architecture

Model B is retained. The new source-native layer is additive and does not repurpose the existing B6.6A tables.

```text
curriculum_source_editions
        |
        v
curriculum_source_subjects
        |
        v
curriculum_source_themes
        |
        v
curriculum_source_subthemes
        |
        v
curriculum_source_topics ---- curriculum_source_objective_sets
        |
        v
curriculum_topic_mappings -- production_subject_id -> public.subjects
        |
        +-------------------- production_topic_id -> public.topics

public.subjects -> public.topics -> public.questions -> exam data
```

The source layer is authoritative for NERDC identity, hierarchy, provenance, verification, and edition history. The production layer is authoritative for student question pools, subject selectors, topic ownership, questions, and exams.

## 4. Exact New Schema

The SQL in this section is specification text only. It must not be executed in B6.6D.4.

### 4.1 `public.curriculum_source_editions`

One row represents one source curriculum release or auditable source snapshot.

```sql
create table public.curriculum_source_editions (
  id text primary key,
  source_document text not null check (length(btrim(source_document)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  version_label text not null check (length(btrim(version_label)) > 0),
  status text not null check (status in ('draft', 'review_required', 'approved', 'superseded')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_document, version_label)
);
```

The stable edition ID must come from the importer’s deterministic edition identity, not a random production UUID. The repository source currently provides document names, official URLs, schema/version metadata, and extraction status; it does not provide a verified external NERDC edition number. Therefore `version_label` must initially be an auditable manifest/retrieval label, not an invented official version claim.

### 4.2 `public.curriculum_source_subjects`

The current source hierarchy has class-scoped subject nodes. Preserve that shape rather than collapsing all classes into one row.

```sql
create table public.curriculum_source_subjects (
  id text primary key,
  edition_id text not null references public.curriculum_source_editions(id) on delete restrict,
  class_code text not null check (length(btrim(class_code)) > 0),
  subject_code text not null check (length(btrim(subject_code)) > 0),
  name text not null check (length(btrim(name)) > 0),
  status text not null check (status in ('verified', 'review_required', 'manual_review_required', 'unmapped')),
  source_document text not null check (length(btrim(source_document)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  source_pages integer[] not null default '{}',
  source_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (edition_id, class_code, subject_code)
);
```

`id` should preserve the normalized source subject ID where available. The importer must verify that the supplied ID is consistent with the source edition/class/code; it must not invent a new meaning for an existing source ID.

### 4.3 `public.curriculum_source_themes`

```sql
create table public.curriculum_source_themes (
  id text primary key,
  source_subject_id text not null references public.curriculum_source_subjects(id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  status text not null check (status in ('verified', 'review_required')),
  source_document text not null check (length(btrim(source_document)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  source_pages integer[] not null default '{}',
  source_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_subject_id, name)
);
```

### 4.4 `public.curriculum_source_subthemes`

```sql
create table public.curriculum_source_subthemes (
  id text primary key,
  theme_id text not null references public.curriculum_source_themes(id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  status text not null check (status in ('verified', 'review_required')),
  source_document text not null check (length(btrim(source_document)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  source_pages integer[] not null default '{}',
  source_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (theme_id, name)
);
```

### 4.5 `public.curriculum_source_topics`

```sql
create table public.curriculum_source_topics (
  id text primary key,
  subtheme_id text not null references public.curriculum_source_subthemes(id) on delete restrict,
  name text not null check (length(btrim(name)) > 0),
  status text not null check (status in ('verified', 'review_required')),
  term_allocation_type text not null check (term_allocation_type in ('source', 'implementation', 'review_required', 'unassigned')),
  term_id uuid references public.terms(id) on delete restrict,
  source_document text not null check (length(btrim(source_document)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  source_pages integer[] not null default '{}',
  source_order integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((term_allocation_type = 'unassigned' and term_id is null) or (term_allocation_type in ('source', 'implementation') and term_id is not null)) ,
  unique (subtheme_id, name)
);
```

The current source dataset has all topic term allocations unassigned. The source table preserves that state with `term_allocation_type = 'unassigned'` and `term_id = null`; it does not infer terms.

### 4.6 `public.curriculum_source_objective_sets`

```sql
create table public.curriculum_source_objective_sets (
  id text primary key,
  source_topic_id text not null unique references public.curriculum_source_topics(id) on delete restrict,
  status text not null check (status in ('verified', 'review_required')),
  objectives jsonb not null default '[]'::jsonb check (jsonb_typeof(objectives) = 'array'),
  source_document text not null check (length(btrim(source_document)) > 0),
  source_url text not null check (source_url ~ '^https://'),
  source_pages integer[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
```

The objective-set ID must preserve the deterministic source `objectiveSetId`. An empty objective array is valid only when status is `review_required`, matching the source validator’s status semantics.

### 4.7 `public.curriculum_topic_mappings`

One row is one candidate or decision from one source topic to one production target. Multiple rows for one source topic are allowed so one-to-many mappings and competing review candidates are representable.

```sql
create table public.curriculum_topic_mappings (
  id uuid primary key default gen_random_uuid(),
  source_topic_id text not null references public.curriculum_source_topics(id) on delete restrict,
  production_subject_id uuid references public.subjects(id) on delete restrict,
  production_topic_id uuid references public.topics(id) on delete restrict,
  status text not null check (status in ('unreviewed', 'proposed', 'approved', 'rejected', 'needs_review', 'unmapped', 'ambiguous')),
  confidence text not null check (confidence in ('high', 'medium', 'low', 'not_assessed')),
  rationale text not null check (length(btrim(rationale)) > 0),
  source_reference text,
  reviewed_by uuid references public.profiles(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (status in ('approved', 'proposed') and production_subject_id is not null)
    or (status in ('unreviewed', 'rejected', 'needs_review', 'ambiguous', 'unmapped'))
  ),
  check (production_topic_id is null or production_subject_id is not null),
  check (reviewed_at is null or reviewed_by is not null)
);
```

Required indexes and uniqueness:

```sql
create index curriculum_source_subjects_edition_idx
  on public.curriculum_source_subjects(edition_id, class_code, source_order);
create index curriculum_source_themes_subject_idx
  on public.curriculum_source_themes(source_subject_id, source_order);
create index curriculum_source_subthemes_theme_idx
  on public.curriculum_source_subthemes(theme_id, source_order);
create index curriculum_source_topics_subtheme_idx
  on public.curriculum_source_topics(subtheme_id, source_order);
create index curriculum_topic_mappings_source_status_idx
  on public.curriculum_topic_mappings(source_topic_id, status);
create index curriculum_topic_mappings_production_subject_idx
  on public.curriculum_topic_mappings(production_subject_id, status);

create unique index curriculum_topic_mappings_approved_target_idx
  on public.curriculum_topic_mappings(source_topic_id, production_subject_id, coalesce(production_topic_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status = 'approved';
```

There must **not** be a unique index on approved `source_topic_id` alone. That would violate the required one-to-many mapping capability. An approved mapping is import-consumable only when `production_subject_id` is non-null and `production_topic_id` is non-null after the production-topic creation step. The importer must reject an approved row with a null production topic as incomplete rather than guessing or silently creating a second mapping.

The database cannot safely enforce equality between `production_subject_id` and `topics.subject_id` with a simple cross-table CHECK constraint. The implementation must enforce it in the transactional resolver/import operation, or through a narrowly scoped database function if one is later approved. No such function is created in this stage.

## 5. Mapping Lifecycle and Cardinality

### 5.1 Statuses

- `unreviewed`: imported or discovered without a human mapping decision; never consumable.
- `proposed`: a candidate target has been suggested; never consumable.
- `approved`: reviewed and consumable only when both production IDs are present and consistent.
- `rejected`: explicitly rejected candidate; never consumable.
- `needs_review`: evidence is insufficient or a source/target decision remains open; never consumable.
- `unmapped`: reviewed conclusion that no production target is authorized; never consumable.
- `ambiguous`: multiple plausible targets remain; never consumable.

`confidence` records assessment (`high`, `medium`, `low`, `not_assessed`) but never overrides status. A `high` confidence proposed mapping is still blocked.

### 5.2 Cardinality

- One-to-one: one approved row for one source topic and one production target.
- Many-to-one: multiple source topics each have an approved row pointing to the same production topic.
- One-to-many: one source topic has multiple approved rows, each pointing to a distinct production subject/topic target, only where source evidence and review explicitly support it.
- Unresolved: one or more rows with `unmapped`, `ambiguous`, or `needs_review`; no approved row exists, so import stops.

The resolver returns all approved target rows in deterministic order: `source_topic_id`, then `production_subject_id`, then `production_topic_id`, then mapping UUID. It must not collapse multiple targets into one.

## 6. Resolver Contract

The future server-side resolver must use stable source IDs, never source or production display-name matching.

```ts
type ResolveSourceTopicInput = {
  sourceTopicId: string;
  editionId: string;
};

type ResolvedProductionTarget = {
  mappingId: string;
  sourceTopicId: string;
  productionSubjectId: string;
  productionTopicId: string;
  status: "approved";
};

type SourceTopicResolution =
  | { kind: "resolved"; targets: ResolvedProductionTarget[] }
  | {
      kind: "blocked";
      code:
        | "MISSING"
        | "UNMAPPED"
        | "AMBIGUOUS"
        | "REVIEW_REQUIRED"
        | "REJECTED"
        | "INCOMPLETE";
      mappingIds: string[];
    };

async function resolveSourceTopic(
  input: ResolveSourceTopicInput,
): Promise<SourceTopicResolution>;
```

Required behavior:

1. Confirm the source topic exists and belongs to the requested edition.
2. Load all mapping candidates for the exact source topic.
3. Return `MISSING` if no source topic exists.
4. Return `REVIEW_REQUIRED` if any source hierarchy/objective state required by the import is not import-approved.
5. Return `UNMAPPED` if the reviewed mapping state explicitly has no target and no approved target exists.
6. Return `AMBIGUOUS` if competing candidates remain or more than one target exists without explicit approved one-to-many authorization.
7. Return `REJECTED` if all available decisions are rejected.
8. Return `INCOMPLETE` if an approved row lacks a production topic, lacks a subject, points to an inactive subject, or points to a topic whose `topics.subject_id` differs.
9. Return `resolved` only with one or more approved, complete, active, subject-consistent targets.

The importer must treat every blocked result as a hard error for that import batch. There is no display-name fallback, default target, legacy-target fallback, or automatic subject creation.

## 7. RLS and Security Model

RLS must be enabled on every new table. Policies must be admin-only, matching the existing role predicate:

```sql
exists (
  select 1
  from public.profiles p
  where p.id = (select auth.uid())
    and p.role in ('admin', 'super_admin')
)
```

For each new source and mapping table:

- `SELECT`: admins and super-admins only.
- `INSERT`: admins and super-admins only.
- `UPDATE`: admins and super-admins only, with the same `USING` and `WITH CHECK` predicate.
- `DELETE`: admins and super-admins only, with restrictive foreign keys preventing orphaned provenance.
- Students and unauthenticated users: no direct access.
- Service-role/admin client: permitted for server-side import operations, but only after the application’s explicit admin authorization and resolver checks.

No policy is added to production `subjects`, `topics`, `questions`, or exam tables. No existing RLS policy is weakened. Any future source review role must receive a narrow source-table policy rather than production write access.

## 8. Exact Migration Ordering

The later implementation must use a new migration after the existing B6.6A migration. The migration must be additive and dependency-ordered:

1. Create `curriculum_source_editions` with primary key, checks, unique constraint, and timestamps.
2. Create `curriculum_source_subjects` with its FK to editions and source identity constraints.
3. Create `curriculum_source_themes` with its FK to source subjects.
4. Create `curriculum_source_subthemes` with its FK to source themes.
5. Create `curriculum_source_topics` with its FK to source subthemes and optional term FK.
6. Create `curriculum_source_objective_sets` with its unique source-topic FK.
7. Create `curriculum_topic_mappings` with FKs to source topics, existing production subjects/topics, and reviewer profiles.
8. Create non-unique navigation indexes.
9. Create approved-target partial uniqueness only after the mapping table exists.
10. Enable RLS on all new tables.
11. Add admin-only policies for SELECT/INSERT/UPDATE/DELETE on all new tables.
12. Validate migration metadata and existing production fingerprints before any seed/import operation.

No `ALTER TABLE` is required on `subjects`, `topics`, `questions`, or `exam_attempts`. The existing B6.6A tables are neither altered nor repopulated by this migration.

## 9. Seed and Source Import Strategy

No seed or source import occurs in D4. A later importer must:

1. Derive a deterministic edition ID from the source manifest/document identity and version label.
2. Insert or verify one edition row; reject conflicting metadata for an existing edition.
3. Insert source subjects using the stable IDs present in the normalized source hierarchy. Verify class and subject code against the canonical path.
4. Insert themes, subthemes, topics, and objective sets in parent-first order using their existing deterministic IDs.
5. Preserve source wording, source pages, official URLs, extraction status, verification status, objective status, and unassigned term state.
6. Use upsert only when the incoming canonical source values match; conflicting changes must create a new edition or fail, never overwrite the old edition.
7. Insert mapping decisions separately from source data. A source row without an approved mapping remains source-only.
8. Create/reuse a production topic only after resolver approval, using the existing production subject UUID and a deterministic source-topic linkage.
9. Re-running the same edition must produce zero duplicate source nodes and zero duplicate approved mapping decisions.

Do not invent production IDs, source codes, source pages, term allocations, or mappings for CCA, French, Hausa, Igbo, Islamic Religious Studies, Arabic, or Yoruba.

## 10. Consolidated-Subject Test Cases

These are test fixtures and resolver scenarios only; they are not mapping decisions or seed data.

### Basic Science and Technology

Use the actual source code `BASIC_SCIENCE_TECHNOLOGY` and the verified source topic IDs from the dataset. The test must prove that two source topics from the same source subject can resolve to different existing production subject IDs: Basic Science (`7c901feb-d013-4c90-9585-6c0fe317b472`) and Basic Technology (`46aa307a-5002-48dd-b4ba-7798a2f5e258`). It must also prove that a missing target blocks import rather than applying the first target to all topics.

The test must not assert a target for a specific topic unless a separate reviewed mapping decision exists; the audit records the target set, not automatic topic-level assignments.

### National Values Curriculum

Use source code `NVC` and the source hierarchy records already present in the dataset. The test must support distinct reviewed mapping rows to Civic Education (`f0d8904d-842b-478c-b3ba-e2e3054429a1`), Social Studies (`a84c1eac-8827-433b-9e89-535b96540f53`), and Government (`d9dabed8-efa8-46fb-9637-ca4c30caa97d`). It must verify that a source topic with competing candidates returns `AMBIGUOUS` until one approved decision or an explicit reviewed one-to-many decision exists.

### Pre-Vocational Studies

Use source code `PREVOC` and verify that agriculture, technology, and business-related targets can coexist under the same source subject. The test must use only explicit reviewed mapping rows and must not infer a target from topic wording alone.

## 11. Existing Production Data Protection

The later migration must not insert, update, delete, rename, re-key, or reinterpret existing rows in:

- `subjects`
- `topics`
- `questions`
- `exam_attempts`
- related question/attempt/result tables
- `profiles` or `auth.users`

New `curriculum_topic_mappings` rows may reference existing production subjects/topics. New production topics are a separate approved import operation, not a side effect of the schema migration.

### Required pre/post verification

Before and after the migration, record:

1. Exact row counts for `subjects`, `topics`, `questions`, and `exam_attempts`.
2. Ordered ID snapshots for those four tables.
3. Relationship snapshots for `questions(subject_id, topic_id)`, `exam_attempts(subject_id)`, `exam_attempt_questions(attempt_id, question_id)`, `exam_answers(attempt_id, question_id)`, and result snapshots.
4. Critical content hashes over stable ordered projections, for example SHA-256 of canonical JSON containing IDs, subject/topic IDs, names, question text, and attempt status/scoring fields.
5. Existing constraint/index/policy metadata from the catalog.

The safest repository procedure is a read-only preflight query/script that writes its report outside production, followed by the same report after migration. Counts alone are insufficient because a delete/insert could preserve counts while changing IDs.

The post-migration report must show identical production ID sets, relationship projections, and content hashes. New source-table rows, if any, must be reported separately.

## 12. Rollback Strategy

### Schema rollback

Before source data exists, drop only the new tables in reverse dependency order if a migration rollback is explicitly approved:

```text
curriculum_topic_mappings
curriculum_source_objective_sets
curriculum_source_topics
curriculum_source_subthemes
curriculum_source_themes
curriculum_source_subjects
curriculum_source_editions
```

Do not drop, alter, or roll back existing B6.6A or production tables as part of this design.

### Seed-data rollback

Delete or archive only source rows created by the failed edition import, in reverse FK order, after verifying no mapping or approved production link remains. A superseded edition should normally be archived, not deleted.

### Mapping rollback

Revoke or archive mapping decisions by status transition or batch identifier. Do not delete historical approved/rejected decisions if auditability is required. A revoked mapping must make the resolver fail closed.

### Production-data rollback

The schema migration performs no production-data writes, so it has no production-data rollback. A later approved importer must separately record created production topic IDs and may archive/delete only newly created, unreferenced topics. It must never delete or rewrite existing subjects/topics/questions/attempts or any row referenced by questions or attempts.

## 13. Historical Exam Safety Tests

Before import approval, tests must prove:

- Existing question IDs remain identical.
- Existing topic IDs remain identical.
- Every existing question retains the same `subject_id` and `topic_id`.
- Every existing exam attempt retains the same `subject_id`, status, score, percentage, grade, and timestamps.
- Existing attempt-question, answer, and result-snapshot relationships remain valid and unchanged.
- Existing exam subject selection returns the same active production subjects.
- Existing question repository selection returns the same production question IDs for the same subject/class/term inputs.
- Existing exam attempt creation and submission/grading RPCs behave unchanged.
- Adding source rows or mapping candidates does not expose source data to student-facing queries.

## 14. Application Impact Analysis

### No change required for schema implementation

- Existing production subject selectors and dashboard queries.
- Existing production topic manager behavior.
- Existing question CRUD behavior.
- Existing exam question loading, attempt creation, answer submission, grading, and result lookup.
- Existing production RLS policies and exam RPCs.

### Future integration required before source curriculum import

- A server-side source-topic resolver implementing the contract in section 6.
- A source curriculum admin workflow for editions, hierarchy review, and mapping decisions.
- A source importer that accepts source IDs and editions, not production subject names.
- A production-topic creation/linking operation that checks subject consistency transactionally.
- Mapping coverage, fail-closed, idempotency, revision, and rollback tests.
- Admin API/reference endpoints for source hierarchy and mappings, with no student exposure.

### Must change before importing curriculum-derived questions

- `app/api/admin/import/route.ts` must not be used unchanged for source curriculum imports because it expects `row.subject` to be an exact production subject name and resolves topics by production name/scope.
- `services/question-import-validation.ts` must accept or be wrapped by a source-topic validation path that resolves stable source IDs first.
- Question import must receive the resolved production subject/topic IDs from the resolver and verify their consistency.
- The current curriculum manager must remain production-topic tooling; a separate source/mapping workflow must be added rather than changing its meaning invisibly.

No application code is modified by D4.

## 15. Implementation Sequence After Approval

The following sequence is the only proposed next path:

1. Obtain separate approval to implement the D4 schema.
2. Create one additive migration containing the seven new source/mapping tables, constraints, indexes, RLS, and admin policies in the dependency order above.
3. Run migration parse/lint and linked-schema verification; do not import data yet.
4. Run production pre/post identity and relationship checks.
5. Implement and unit-test the resolver without enabling curriculum import.
6. Implement source-only dry-run ingestion and validate deterministic IDs, provenance, duplicates, and edition isolation.
7. Create reviewed mapping decisions through an admin-only workflow; leave unresolved source topics blocked.
8. Run consolidated-subject and historical-exam safety tests.
9. Obtain a separate import approval.
10. Run a dry-run import with zero production writes.
11. Only after dry-run approval, create new production topics for approved mappings and verify each topic’s production subject ID.
12. Import curriculum-derived questions only under a separately approved operation.
13. Run post-import verification and retain the audit report.

## 16. Final Implementation Gate

**BLOCKED — DO NOT IMPLEMENT**

This document is implementation-ready, but the user explicitly limits B6.6D.4 to read-only specification work. No migration may be created or executed in this stage. The following are exact blockers before implementation:

- Separate approval to create the additive source/mapping migration is required.
- The implementation environment must confirm the linked Supabase migration/authentication path before any migration operation.
- Mapping decisions for consolidated topics remain unresolved and must be reviewed before import.
- Source quality remains `proposed-incomplete` and `readyForImport: false`; review-required objective sets, term allocation, and source coverage remain gates.
- The future importer and resolver do not yet exist and must pass the fail-closed and historical-safety tests above.

When these blockers are separately cleared, the next stage may implement only the seven new source/mapping tables and their admin-only policies. It must not modify production subject/topic/question/exam data as an implicit migration side effect.

## Final Status

```text
B6.6D.4 STATUS: BLOCKED
DOCUMENT: docs/STAGE_B6_6D_4_IMPLEMENTATION_MIGRATION_SPEC.md
PRODUCTION DATA MODIFIED: NO
DATABASE MODIFIED: NO
APPLICATION CODE MODIFIED: NO
READY FOR IMPLEMENTATION: NO
```

`B6.6D.4 COMPLETE — IMPLEMENTATION AND MIGRATION SPECIFICATION`
