# B6.6D.3 Final Schema Design Review

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Source of truth: `data/curriculum/jss1-3.json`  
Prior design: [STAGE_B6_6D_2_MAPPING_ARCHITECTURE.md](STAGE_B6_6D_2_MAPPING_ARCHITECTURE.md)

## Scope and Safety

This is a read-only database architecture review. No table, column, constraint, index, policy, subject, topic, question, exam, attempt, result, user, or profile was changed. No migration was created or run. No SQL mutation, `db push`, `db reset`, importer, or curriculum import was performed.

## Executive Decision

**Recommended model: B - a fully source-native curriculum hierarchy with a separate mapping layer and the existing production curriculum layer.**

Model B is selected because the current `topics` table is already a production-owned entity, not a neutral source-curriculum leaf. Its `subject_id` is required, its uniqueness is production-subject scoped, and `questions.topic_id` and the application depend on that ownership. Making the existing hierarchy dual-purpose would couple source identity to production ownership and would require weakening assumptions that protect existing questions and exams.

Model B preserves the source hierarchy independently, maps each source topic to exactly one existing production subject only after review, and continues to expose production subject/topic IDs to the student exam system.

## Repository Evidence

The review inspected the complete B6.6D.2 design, the initial schema, the topic foundation migration, the B6.6A hierarchy migration, the curriculum manager/API, question import and validation, the question repository, exam subject selection, and exam attempt creation.

The current schema establishes:

- `subjects.id` is a UUID primary key; `subjects.name` and `subjects.slug` are unique; there is no source curriculum key.
- `topics.id` is a UUID primary key and `topics.subject_id` is `NOT NULL` with `ON DELETE RESTRICT` to `subjects(id)`.
- `topics` is unique by production subject, class, term, and normalized name through `topics_subject_scope_name_idx`.
- `questions.subject_id` references `subjects(id)` with `ON DELETE RESTRICT`.
- `questions.topic_id` references `topics(id)` with `ON DELETE RESTRICT`.
- `exam_attempts.subject_id` references `subjects(id)` with `ON DELETE RESTRICT`.
- Question options, exam answers, exam-attempt questions, and result snapshots retain further restricted references to questions and attempts.
- B6.6A added `curriculum_themes.subject_id UUID NOT NULL REFERENCES subjects(id)`, `curriculum_subthemes.theme_id`, nullable curriculum metadata on `topics`, and `curriculum_objective_sets.topic_id UUID NOT NULL UNIQUE REFERENCES topics(id)`.
- The B6.6C verification report records the B6.6A tables as present and empty, and existing production relationships as unchanged.

The current application assumes production ownership throughout:

- The curriculum manager and curriculum API read and write `topics` by production `subject_id`.
- The bulk importer resolves an exact active production subject name, then finds a topic by production subject, class, term, and normalized name.
- Question create/edit routes require the topic's `subject_id`, class, and term to match the question input.
- The question repository resolves an active production subject by name and loads questions by `questions.subject_id`.
- The exam setup page selects active production subjects.
- Exam question loading and attempt creation validate and persist the production subject UUID.
- The current RLS model gives admins management access to topics, questions, and B6.6A hierarchy tables; student policies read active production subjects/questions and own exam data.

## Models Compared

### Model A: Extend Existing Hierarchy

#### Schema diagram

```text
curriculum_source_subjects
        |
        v
curriculum_themes ------ optional production_subject_id -> subjects
        |
        v
curriculum_subthemes
        |
        v
topics ----------------- required production subject_id -> subjects
  |  ^
  |  |
  |  +---------------- questions.topic_id
  |
  +-------------------- curriculum_objective_sets.topic_id
```

#### Tables affected

Existing `curriculum_themes`, `curriculum_subthemes`, `topics`, and `curriculum_objective_sets` would be repurposed or extended. A new `curriculum_source_subjects` table and a mapping table would still be required. `subjects`, `questions`, and `exam_attempts` should not be altered.

#### Required columns and relationships

At minimum Model A would require:

- `curriculum_source_subjects(id, edition_id, code, name, status, provenance...)`.
- `curriculum_themes.source_subject_id` referencing the new source-subject table.
- A nullable or optional production ownership column on `curriculum_themes`.
- A source-topic identity on `topics`, likely using or replacing `topics.curriculum_id`.
- A mapping table from source topic to `subjects.id` and optionally `topics.id`.
- A change to the current B6.6A requirement that every theme has one production `subject_id`.

The central problem remains: the existing `topics` row is required to have one production `subject_id`. An unmapped source topic cannot be represented in `topics` without inventing a production owner or making `topics.subject_id` nullable. Making it nullable would conflict with the current APIs, indexes, coverage logic, and question import assumptions.

#### Constraints and uniqueness

Model A would need to replace or supplement `curriculum_themes` uniqueness from `(subject_id, class_id, name)` with source-native uniqueness, while preserving the production topic index. It would also need to ensure that `topics.curriculum_id` is source-unique independently of production ownership.

Those changes are possible in principle, but they create two meanings for the same row: a source curriculum topic and a production topic. The existing topic uniqueness index would continue to make production ownership part of identity, while source identity would be another identity on the same record.

#### RLS implications

Existing admin-only RLS on B6.6A tables could be extended, but policies would need to distinguish source hierarchy administration from production topic administration. A source-only reviewer would otherwise need access to production-owned rows, or the policy would become more complex than the current established boundary.

#### Complexity and risks

Model A has a smaller table count but a higher semantic migration risk:

- Existing hierarchy rows would change meaning even though they are currently empty.
- `curriculum_objective_sets.topic_id` would remain tied to a production topic, preventing a clean source-only objective record for unmapped or review-required topics.
- A future developer could treat `curriculum_themes.subject_id` or `topics.subject_id` as the source owner and reintroduce the exact misclassification this review is intended to prevent.
- The application would need branching behavior in every current topic path to distinguish source and production views.
- A source topic with no approved target would need special nullable production semantics in a table currently used as the production leaf.

Model A does not protect source identity as strongly as Model B without effectively turning the existing tables into a partially new model.

### Model B: Source-Native Hierarchy Plus Mapping

#### Schema diagram

```text
curriculum_editions
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
curriculum_source_topics
        |
        +---- curriculum_source_objective_sets
        |
        v
curriculum_topic_mappings ---- production_subject_id -> subjects
             |
             +--------------- production_topic_id -> topics (nullable until created)

subjects -> topics -> questions -> question_options
subjects -> exam_attempts -> exam_attempt_questions/exam_answers/results
```

The lower production graph remains the existing application graph. The upper source graph owns source identity and provenance. The mapping table is the only bridge.

#### New tables required

The following tables are required in a later implementation. Names are design names, not migration names yet.

1. `curriculum_editions`
2. `curriculum_source_subjects`
3. `curriculum_source_themes`
4. `curriculum_source_subthemes`
5. `curriculum_source_topics`
6. `curriculum_source_objective_sets`
7. `curriculum_topic_mappings`

The existing B6.6A tables remain unchanged and are not repurposed. Because B6.6C reports them empty, a later implementation may deprecate them after explicit review, but this stage does not authorize dropping, renaming, or altering them.

#### Exact recommended columns

`curriculum_editions`:

| Column            | Type          | Requirement                                              |
| ----------------- | ------------- | -------------------------------------------------------- |
| `id`              | `text`        | Primary key; stable edition identifier.                  |
| `source_document` | `text`        | Required source document identity.                       |
| `source_url`      | `text`        | Official source URL.                                     |
| `version_label`   | `text`        | Source edition or retrieval label.                       |
| `status`          | `text`        | `draft`, `review_required`, `approved`, or `superseded`. |
| `created_at`      | `timestamptz` | Required audit timestamp.                                |
| `updated_at`      | `timestamptz` | Required audit timestamp.                                |

`curriculum_source_subjects`:

| Column                      | Type          | Requirement                                                             |
| --------------------------- | ------------- | ----------------------------------------------------------------------- |
| `id`                        | `text`        | Primary key; stable source subject ID from the source hierarchy.        |
| `edition_id`                | `text`        | Required FK to `curriculum_editions(id)`.                               |
| `class_code`                | `text`        | Source-preserved class dimension.                                       |
| `subject_code`              | `text`        | Source-preserved code such as `NVC` or `PREVOC`.                        |
| `name`                      | `text`        | Source-preserved display name.                                          |
| `status`                    | `text`        | `verified`, `review_required`, `manual_review_required`, or `unmapped`. |
| `source_document`           | `text`        | Provenance.                                                             |
| `source_url`                | `text`        | Provenance.                                                             |
| `created_at` / `updated_at` | `timestamptz` | Audit timestamps.                                                       |

`curriculum_source_themes`:

`id text primary key`, `source_subject_id text not null references curriculum_source_subjects(id) on delete restrict`, `name text not null`, `status text not null`, `source_pages integer[] not null default '{}'`, `source_document text`, `source_url text`, `created_at timestamptz not null default now()`, and `updated_at timestamptz not null default now()`.

`curriculum_source_subthemes`:

`id text primary key`, `theme_id text not null references curriculum_source_themes(id) on delete restrict`, `name text not null`, the same status/provenance/timestamp fields, and a unique constraint on `(theme_id, name)`.

`curriculum_source_topics`:

`id text primary key`, `subtheme_id text not null references curriculum_source_subthemes(id) on delete restrict`, `name text not null`, `status text not null`, `term_allocation_type text not null`, `term_id uuid null references terms(id) on delete restrict`, source document/url/pages, and timestamps. The source topic ID is the stable source identity and is not derived from a production UUID.

`curriculum_source_objective_sets`:

`id text primary key`, `source_topic_id text not null unique references curriculum_source_topics(id) on delete restrict`, `status text not null`, `objectives jsonb not null default '[]'::jsonb`, source document/url/pages, and timestamps. The JSON check must require an array, as B6.6A does.

`curriculum_topic_mappings`:

| Column                      | Type                   | Requirement                                                                         |
| --------------------------- | ---------------------- | ----------------------------------------------------------------------------------- |
| `id`                        | `uuid`                 | Primary key.                                                                        |
| `source_topic_id`           | `text`                 | Required FK to `curriculum_source_topics(id)`.                                      |
| `production_subject_id`     | `uuid`                 | Required FK to existing `subjects(id)`.                                             |
| `production_topic_id`       | `uuid` nullable        | FK to `topics(id)`; null before the production topic is created.                    |
| `status`                    | `text`                 | `candidate`, `approved`, `review_required`, `ambiguous`, `unmapped`, or `rejected`. |
| `rationale`                 | `text`                 | Required mapping evidence or review reason.                                         |
| `source_reference`          | `text` nullable        | Page, component, or decision reference.                                             |
| `reviewed_by`               | `uuid` nullable        | FK to `profiles(id)` with `on delete set null`.                                     |
| `reviewed_at`               | `timestamptz` nullable | Review timestamp.                                                                   |
| `created_at` / `updated_at` | `timestamptz`          | Audit timestamps.                                                                   |

The approved mapping must point to exactly one existing production subject. `production_topic_id` is nullable only during the controlled creation sequence; after import it must be non-null for an imported approved mapping. A database constraint or post-insert verification must ensure that a referenced production topic has the same `subject_id` as `production_subject_id`.

## Model B Constraints and Indexes

The source hierarchy should use stable source IDs as primary keys and enforce:

- Unique `(edition_id, subject_code, class_code)` for source subjects.
- Unique `(source_subject_id, name)` for themes.
- Unique `(theme_id, name)` for sub-themes.
- Unique `(subtheme_id, name)` for source topics, with the stable source ID remaining authoritative.
- Unique `source_topic_id` in source objective sets.
- A partial unique index on `source_topic_id` for `status = 'approved'` mappings.
- An index on `(source_topic_id, status)` and `(production_subject_id, status)`.
- A partial unique index on `production_topic_id` for approved mappings if one production topic must not represent multiple source topics.
- Checks that approved mappings have a production subject, unmapped mappings have no production target, and review/ambiguous mappings cannot be consumed by the importer.

Source hierarchy foreign keys should use `ON DELETE RESTRICT`. A source edition or topic must not be deleted while mappings or objective sets depend on it. The mapping's `production_topic_id` should also use `ON DELETE RESTRICT` so a mapped production topic cannot be removed accidentally.

## RLS Implications

Model B requires admin-only management policies on all new source and mapping tables, matching the existing `admin`/`super_admin` role test used by topics and B6.6A tables.

Recommended policy boundary:

- Admins and super-admins can read/write source curriculum and mapping decisions.
- Authenticated students do not read source mapping tables directly.
- Student exam queries continue to read active `subjects`, active `questions`, and permitted options through the existing policies.
- The server-side importer uses the service/admin client after an explicit admin authorization check.
- If non-admin source review is later required, introduce a narrowly scoped read policy; do not grant production topic or question mutation rights through the source tables.

## Requirement Comparison

| Requirement                                         | Model A                                                         | Model B                                               |
| --------------------------------------------------- | --------------------------------------------------------------- | ----------------------------------------------------- |
| One source subject maps to many production subjects | Possible only after weakening current ownership semantics       | Native: each source topic has its own mapping row     |
| Existing production subjects unchanged              | Yes in theory                                                   | Yes by design                                         |
| Existing topics unchanged                           | Risk of repurposing their meaning                               | Yes; only new production topics may be added          |
| Existing questions/attempts untouched               | Requires careful branching in existing topic paths              | Existing graph is not rewritten                       |
| Stable source topic identity                        | Coupled to production topic unless nullable semantics are added | Independent source-topic primary key                  |
| Reproducible/auditable edition                      | Requires additional version semantics in dual-purpose rows      | Edition is a first-class source parent                |
| Future revision isolation                           | High risk of overwrite if rows are reused                       | New edition and source rows; old mapping remains      |
| Fail closed on unresolved state                     | More application branches around production rows                | Direct mapping status gate before production creation |
| Student exam compatibility                          | Preserved only if old paths remain production-only              | Existing paths remain unchanged                       |
| Avoid new subjects                                  | Yes, but with more coupling                                     | Yes, production UUID is an FK only                    |

## Migration Complexity

### Model A

Later implementation would need to alter the semantics of the existing hierarchy migration, likely add source ownership, relax or reinterpret production ownership, migrate or backfill existing hierarchy records, and update every current hierarchy/topic query. Even with zero current hierarchy rows, the migration would change a live contract and require stronger regression testing around `topics` and `curriculum_objective_sets`.

### Model B

Later implementation creates new source-native tables and admin policies, then creates a mapping table. Existing production tables require no data rewrite. The application gains one source-to-production resolver and a controlled importer path; existing student exam paths do not need to understand source hierarchy. This is more tables, but a smaller semantic blast radius and a clearer rollback boundary.

## Application and Import Behavior

The current curriculum manager and API remain production-topic tools. A later source curriculum manager should be a separate admin workflow rather than silently changing the existing topic editor.

The later importer must accept stable source identifiers, not resolve source records by production display name. For each source topic it must:

1. Verify the edition, source subject, class, theme, sub-theme, topic, objective set, provenance, and term state.
2. Load all mapping candidates for the exact source topic.
3. Continue only when there is exactly one `approved` mapping and its production subject is active.
4. Return a structured failure for `unmapped`, `ambiguous`, `review_required`, missing, or conflicting mappings.
5. Create or reuse a production `topics` row under the approved existing `production_subject_id`.
6. Confirm the production topic's `subject_id` equals the mapping's production subject ID.
7. Attach the created production topic UUID to the mapping in the same controlled transaction.
8. Store source objective data in `curriculum_source_objective_sets`, not in the existing production-coupled objective table.
9. Import questions only after topic resolution and normal production foreign-key checks pass.

For Mathematics, Business Studies, CRS, English, and History, the mapping rows can be one approved row per source topic to the documented existing production ID. For Basic Science and Technology, National Values Curriculum, and Pre-Vocational Studies, every topic must have an explicit approved destination before import. No subject-wide fallback may override a missing topic decision for a consolidated source.

## Protection of Existing Production Data

The following existing tables remain untouched by the later schema implementation and import design:

- `subjects`
- `topics` rows and `topics.subject_id`
- `questions`
- `question_options`
- `exam_attempts`
- `exam_attempt_questions`
- `exam_answers`
- `exam_result_question_snapshots`
- `profiles`
- `auth.users`

The existing B6.6A tables `curriculum_themes`, `curriculum_subthemes`, and `curriculum_objective_sets` also remain unchanged in the recommended design. They are not used as the source-native hierarchy and must not be silently repopulated with consolidated data.

Adding new production topics is permitted only for approved source topics, with existing production subject IDs. Existing production topic rows must never be reassigned, renamed, merged, or deleted to make a source mapping fit.

## Consolidated Subjects

Model B represents each consolidated official subject once in the source hierarchy:

- Basic Science and Technology topics map individually to existing Basic Science or Basic Technology.
- National Values Curriculum topics map individually to existing Civic Education, Social Studies, or Government.
- Pre-Vocational Studies topics map individually to existing Agricultural Science, Basic Technology, or Business Studies.

The source subject is not renamed to any target, and no target subject is created. The production exam system sees only the approved existing production subject for a generated topic/question pool.

CCA, French, Hausa, Igbo, and Islamic Religious Studies remain unmapped until an explicit production decision exists. Arabic and Yoruba remain without a verified source hierarchy and cannot be inferred or promoted to production subjects.

## Revision and Versioning

Every imported source hierarchy belongs to one `curriculum_editions` row. A future NERDC revision creates a new edition and new source hierarchy records. It must not update the old edition in place or reuse a source topic ID for materially different source content.

Mapping decisions are edition-specific through the source topic FK. An old approved mapping remains auditable even if a new edition maps a similarly named topic to a different production subject. Superseded source editions are archived, not deleted, when mappings or production topics depend on them.

## Rollback Design

Rollback of the later implementation must be additive and ordered:

1. Before import, a failed migration can be rolled back by dropping only newly created source/mapping tables in reverse dependency order, after confirming they contain no protected data.
2. After source data exists, rollback must archive or delete only rows created by the new stage, in reverse FK order, and only after a dependency check.
3. If production topics/questions have been created, do not delete them automatically if questions or attempts reference them. Archive newly created unreferenced topics or perform an explicitly approved data remediation.
4. Never roll back by updating or deleting existing subjects, topics, questions, attempts, results, profiles, or users.
5. A failed per-topic import must leave no partially approved mapping or orphaned source/prod link; use a transaction for each source topic or an import batch with a durable status.

## Required Testing Before Import

Before any curriculum import, the later implementation must pass:

- Migration parse/lint and a clean linked migration status check.
- Schema checks for every primary key, foreign key, `NOT NULL`, check, unique constraint, partial index, and delete action described above.
- RLS tests proving admin management and student denial for source/mapping tables.
- Existing production regression checks proving subject IDs, topic IDs, question-topic links, exam-attempt subject links, and result snapshots are unchanged.
- Source hierarchy validation for stable IDs, duplicates, orphans, provenance, objective status, and term allocation.
- Mapping coverage tests proving every approved importable source topic has exactly one approved target.
- Fail-closed tests for missing, unmapped, ambiguous, rejected, and review-required mappings.
- Cross-subject integrity tests proving a mapping's production topic has the declared production subject ID.
- Idempotency tests for rerunning the same edition and mapping set.
- Revision tests proving a new edition does not modify the old edition or its mappings.
- Import rollback tests for failure during source insert, production topic insert, objective insert, question insert, and option insert.
- Existing application tests for curriculum manager, question importer, question repository, exam selection, attempt creation, grading, and result lookup.
- A read-only preflight comparing row counts and relationship checks before and after a dry run.

## Exact Later Migration Sequence

No migration is authorized or created in B6.6D.3. If this design is approved later, the sequence should be:

1. Create `curriculum_editions` with checks, indexes, and admin-only RLS.
2. Create source subjects, themes, sub-themes, source topics, and source objective sets with restrictive foreign keys and admin-only RLS.
3. Create `curriculum_topic_mappings` with production subject/topic foreign keys, status checks, indexes, and approved-row uniqueness.
4. Verify the migration against the linked schema and confirm existing production row counts and relationship fingerprints are unchanged.
5. Add application resolver and source import code behind a disabled/admin-only gate.
6. Run source-only dry-run validation and mapping coverage tests.
7. Only after a separate approval, import source hierarchy and approved mappings; create new production topics only where the resolver returns one approved existing subject ID.
8. Run post-import relationship, provenance, idempotency, and rollback verification.

The existing B6.6A migration is not altered, reapplied, or retroactively repurposed by this sequence.

## Implementation Gate

**Schema implementation is not authorized in B6.6D.3.**

The next implementation stage, if separately approved, would create the source-native tables and the `curriculum_topic_mappings` table described above. It would not alter the existing B6.6A tables, production subject rows, existing topic ownership, questions, exams, attempts, results, users, or profiles.

Data that must not be modified:

- Existing `public.subjects` rows and IDs.
- Existing `public.topics` rows, `subject_id`, names, and relationships.
- Existing questions, question options, exams, attempts, answers, result snapshots, users, and profiles.
- Existing B6.6A hierarchy rows or semantics.

Before curriculum import, the migration, RLS, source validation, mapping coverage, fail-closed behavior, idempotency, revision isolation, relationship fingerprints, and rollback tests must all pass. Any `UNMAPPED`, `AMBIGUOUS`, `REVIEW_REQUIRED`, missing, or conflicting source-topic mapping must block import.

## Final Recommendation

Model B is the only reviewed design that satisfies the requirements without making a production-owned table serve as both source truth and production routing object. It supports one NERDC source subject distributing topics to multiple existing production subjects, keeps production IDs unchanged, preserves historical relationships, provides independent source identities and editions, and leaves the student exam system on its current production subject/topic contract.

`B6.6D.3 COMPLETE — FINAL SCHEMA DESIGN REVIEW`
