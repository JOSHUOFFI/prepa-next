# B6.6D.2 Subject Mapping Architecture

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Source of truth: `data/curriculum/jss1-3.json`  
Input audit: [STAGE_B6_6D_1_SUBJECT_MAPPING_AUDIT.md](STAGE_B6_6D_1_SUBJECT_MAPPING_AUDIT.md)

## Scope and Safety

This stage is architecture design and read-only validation only. No schema change was implemented. No production subject, curriculum record, topic, question, exam, attempt, result, user, or profile was created, updated, deleted, or remapped. No mutation SQL, `db push`, or `db reset` was run.

The design below is a proposal for a later implementation stage. It does not authorize an import.

## Current Architecture Findings

The current production model has two different identities that are currently being treated as one:

- A source curriculum subject in `data/curriculum/jss1-3.json`, identified by a stable source code such as `BASIC_SCIENCE_TECHNOLOGY`, `NVC`, or `PREVOC`.
- A production subject in `public.subjects`, identified by an existing UUID and exposed to the application by name, slug, and category.

The existing hierarchy migration added:

- `curriculum_themes(subject_id, class_id, ...)`, where `subject_id` is required and references `public.subjects(id)`.
- `curriculum_subthemes(theme_id, ...)`.
- Nullable curriculum metadata on `topics`, including `curriculum_id` and `curriculum_subtheme_id`.
- `curriculum_objective_sets(topic_id, ...)`.

The existing leaf model remains production-oriented:

- `topics.subject_id` is required and references `subjects.id`.
- `questions.subject_id` references `subjects.id`.
- `questions.topic_id` references `topics.id`.
- `exam_attempts.subject_id` references `subjects.id`.

The current curriculum manager creates and edits flat production topics. The current bulk importer resolves an input subject by exact `subjects.name`, then looks up a topic by production `subject_id`, class, term, and normalized topic name. The question create/edit routes also require the selected topic and subject IDs to match.

Relevant implementation surfaces include [the hierarchy migration](../supabase/migrations/20260915000000_curriculum_hierarchy_foundation.sql), [the curriculum API](../app/api/admin/curriculum/route.ts), [the bulk importer](../app/api/admin/import/route.ts), [question import validation](../services/question-import-validation.ts), and [subject question loading](../services/supabase-question-repository.ts).

## Existing Subject-Resolution Flow

The current flow is:

1. A request or workbook supplies a production subject name.
2. The server loads active rows from `public.subjects`.
3. It resolves the name to one production subject UUID.
4. It searches `public.topics` using that UUID plus class, term, and normalized topic name.
5. New questions receive that same production `subject_id` and the resolved `topic_id`.
6. Exam selection and attempt creation continue to use the production subject UUID.

The exam repository also has a direct active-subject-name lookup in `getSubjectId()`. The student exam API consequently selects a production subject pool, not a source curriculum subject pool.

This flow is correct for existing production questions and exams. It is not sufficient as the source-side resolution flow for a consolidated curriculum.

## Existing Schema Constraints

The current schema does not cleanly support `source subject -> multiple production subjects`.

1. `curriculum_themes.subject_id` is non-null and has a foreign key to one production subject. A consolidated source subject therefore cannot own a theme without choosing one target or duplicating/mislabeling the source hierarchy.
2. `topics.subject_id` is non-null and can hold only one production subject per topic.
3. The existing topic uniqueness rule is scoped by production subject, class, term, and normalized name. It does not include source subject or source topic identity.
4. `questions.subject_id` and `questions.topic_id` must agree with the production topic selected by current APIs.
5. `exam_attempts.subject_id` is historical exam ownership. It must remain the production subject selected when the attempt was created.
6. `public.subjects` has no source code/key and no source curriculum relationship. Names are not a stable source identity.
7. The current importer accepts a production subject name, not a source subject code and source topic ID. It cannot distinguish two source topics with different production destinations.

The existing schema therefore supports a flat production curriculum and a one-to-one source-to-production interpretation, but not a lossless consolidated source hierarchy.

## Why Naive 1:1 Mapping Is Unsafe

The three consolidated curricula contain multiple conceptual production areas under one official source subject:

| Source subject | Existing production targets | Required decision |
| --- | --- | --- |
| Basic Science and Technology | Basic Science; Basic Technology | Each source topic must be assigned to the appropriate target. |
| National Values Curriculum | Civic Education; Social Studies; Government | The source topic/component must determine the target; the whole source subject cannot safely become one target. |
| Pre-Vocational Studies | Agricultural Science; Basic Technology; Business Studies | Agriculture, technology, and business/home-economics content must be assigned deliberately. |

A source-subject-only mapping would either discard valid target distinctions, place all topics under an arbitrary target, or require duplicate source topics. Any of those choices would distort curriculum ownership and could make future questions, coverage, and exam pools appear under the wrong production subject.

The already-existing production IDs must remain exactly as they are:

- Mathematics: `91f37d59-3401-47c5-ae18-46ead707c570`
- Business Studies: `5b894bfe-6f29-41a6-907c-26a4c2f11fff`
- CRS: `5e4ff239-fd12-4765-b035-70ea77ecee6c`
- English: `a0e64f96-d382-4cee-9f84-b1e6b5e075c6`
- History: `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412`
- Basic Science: `7c901feb-d013-4c90-9585-6c0fe317b472`
- Basic Technology: `46aa307a-5002-48dd-b4ba-7798a2f5e258`
- Civic Education: `f0d8904d-842b-478c-b3ba-e2e3054429a1`
- Social Studies: `a84c1eac-8827-433b-9e89-535b96540f53`
- Government: `d9dabed8-efa8-46fb-9637-ca4c30caa97d`
- Agricultural Science: `ab79e100-9e4c-4a9e-b952-19df15b2443c`

No new production subject is needed for this architecture.

## Recommended Mapping Model

Use a source-native hierarchy and a normalized mapping decision layer:

```text
source subject
  -> source theme
    -> source sub-theme
      -> source topic
        -> mapping decision(s)
          -> existing production subject
```

The mapping decision layer should support both:

- A subject-level default for safe one-to-one mappings.
- A source-topic-level override for consolidated curricula.

Topic-level mapping is the controlling rule. A topic override takes precedence over a subject default. A default must never silently apply when an override is required or unresolved.

### Proposed resolution semantics

For a source topic, resolve in this order:

1. Find an approved topic-level mapping for the exact stable source topic ID.
2. If none exists, find an approved subject-level default for the source subject.
3. If no approved mapping exists, return `UNMAPPED`.
4. If more than one approved target is possible, return `AMBIGUOUS` and stop.
5. If the source record or mapping is not approved for import, return `REVIEW_REQUIRED` and stop.

The importer may create a production `topics` row only after this resolver returns exactly one approved existing production subject UUID. The resolver must never create a subject, guess from a name, or fall back to a related legacy subject.

## Proposed Schema Changes, Not Implemented

The current hierarchy tables need a source identity independent of production ownership. The smallest coherent future change is additive where possible, with a controlled relaxation of the existing hierarchy table's production subject requirement.

### 1. `curriculum_source_subjects`

| Column | Type | Requirement |
| --- | --- | --- |
| `id` | `text` | Primary key; stable source subject code, for example `NVC`. |
| `name` | `text` | Required source-preserved name. |
| `source_document` | `text` | Required or review-required provenance reference. |
| `source_url` | `text` | Official source URL. |
| `source_status` | `text` | `verified`, `review_required`, `manual_review_required`, or `unmapped`. |
| `created_at` | `timestamptz` | Audit timestamp. |
| `updated_at` | `timestamptz` | Audit timestamp. |

Add a format check for the source code and a unique normalized name only if that does not prevent legitimate source revisions. The stable code, not the display name, is the identity.

### 2. Source ownership on hierarchy rows

Add `source_subject_id text not null references curriculum_source_subjects(id) on delete restrict` to `curriculum_themes`, and make the current production `subject_id` nullable or replace its required ownership role with an optional resolved target. The source theme must be owned by the source subject even when it maps to several production subjects.

`curriculum_subthemes` can continue to reference `curriculum_themes`. The source topic identity remains the existing stable `topics.curriculum_id` value, but the topic row must also carry `source_subject_id` or obtain it through its theme/sub-theme path for efficient validation.

The future schema must enforce that a source topic cannot be inserted without a valid source hierarchy path. It must not require one production subject at the source-theme level.

### 3. `curriculum_subject_mappings`

Create one normalized decision table with these columns:

| Column | Type | Requirement |
| --- | --- | --- |
| `id` | `uuid` | Primary key. |
| `source_subject_id` | `text` | Required FK to `curriculum_source_subjects(id)`. |
| `source_topic_id` | `text` nullable | FK to the stable source topic ID; null means subject-level default. |
| `production_subject_id` | `uuid` nullable | FK to `public.subjects(id)`; only existing production IDs are allowed. |
| `mapping_scope` | `text` | `subject_default` or `topic_override`. |
| `status` | `text` | `approved`, `review_required`, `ambiguous`, `unmapped`, or `rejected`. |
| `rationale` | `text` | Required decision evidence or review reason. |
| `source_reference` | `text` nullable | Document/page or decision record reference. |
| `reviewed_by` | `uuid` nullable | FK to the reviewing profile if an audit identity is required. |
| `reviewed_at` | `timestamptz` nullable | Review timestamp. |
| `created_at` | `timestamptz` | Audit timestamp. |
| `updated_at` | `timestamptz` | Audit timestamp. |

Recommended constraints and indexes:

- `production_subject_id` must be non-null for an approved candidate and null for an explicitly `unmapped` decision.
- `mapping_scope = 'subject_default'` requires `source_topic_id is null`.
- `mapping_scope = 'topic_override'` requires `source_topic_id is not null`.
- A source topic override must belong to the stated source subject.
- Add an index on `(source_subject_id, source_topic_id, status)`.
- Add a partial unique index allowing at most one approved mapping per source subject default and at most one approved mapping per source topic override.
- Allow multiple non-approved candidate rows so `ambiguous` decisions can preserve competing targets without selecting one.

This table represents mapping decisions, not production subject creation. The production UUID is a foreign key only.

### 4. Optional explicit source-topic table

If relying on the existing `topics` table as the source-topic carrier would make the migration too coupled to production ownership, introduce `curriculum_source_topics` instead:

`id text primary key`, `source_subtheme_id text not null`, `name text not null`, `source_status text not null`, provenance fields, `objective_set_id text`, and term-allocation fields. Then add `topics.curriculum_source_topic_id text null references curriculum_source_topics(id)` as a nullable bridge.

This is the cleaner long-term model, but it duplicates some existing B6.6A hierarchy semantics. It should be chosen only if the implementation cannot safely make `curriculum_themes` source-native. It is not required to decide the mapping architecture in this stage.

## The Three Consolidated Curricula

The mapping table should contain a subject default only where every source topic has the same production destination. For the three consolidated curricula, the import gate should require topic overrides for every source topic whose target differs.

### A. Basic Science and Technology

Keep one source subject and its original themes/sub-themes/topics. Map each source topic to either the existing Basic Science UUID or Basic Technology UUID. Do not rename the source subject to either target, and do not duplicate the source hierarchy merely to satisfy production ownership.

### B. National Values Curriculum

Keep the source subject as `NVC`. Map each source topic/component to Civic Education, Social Studies, or Government only with an explicit approved topic-level decision. A broad default is unsafe because the source document includes multiple target domains.

### C. Pre-Vocational Studies

Keep the source subject as `PREVOC`. Map agriculture-related topics to Agricultural Science, technology-related topics to Basic Technology, and business-related topics only to Business Studies when the reviewed source evidence supports that decision. The table must preserve the decision and rationale per topic; labels alone are not an automatic rule.

## Alternative Approaches Considered

### Source subject -> production subject only

Rejected for consolidated curricula. It works for Mathematics, Business Studies, CRS, English, and History after their documented normalization, but cannot distinguish multiple target domains within one source subject.

### Source topic -> production subject only

Semantically sufficient for the three consolidated cases, but it needs a separate source-subject/hierarchy model. Without source-native ownership, the existing required `curriculum_themes.subject_id` still forces an invalid production target before topic mapping is reached.

### Optional topic override over a subject default

Recommended. It minimizes rows for safe one-to-one subjects while allowing exact per-topic decisions for consolidated subjects. The resolver and constraints must prevent an unresolved override from silently inheriting a default.

### Duplicate the source hierarchy once per production subject

Rejected. It loses the single official source identity, risks duplicate topics and objective sets, and makes later NERDC revisions difficult to reconcile.

### Create new production subjects for official consolidated names

Rejected for this stage and contrary to the audit decision. It would change the product catalog and would not solve the need to distribute individual topics when one source document contains multiple production domains.

## Trade-offs

The recommended model adds a mapping resolution step and requires an import preflight to prove that every imported source topic has exactly one approved target. That is deliberate complexity in exchange for preserving source fidelity and preventing silent subject misclassification.

It also means a production topic may be one representation of a source topic, while the source hierarchy remains independently addressable. Existing question and exam queries stay production-oriented. Source-oriented reporting must join through the source topic and mapping tables rather than reinterpret historical production IDs.

The subject-default/override model is smaller than a fully versioned curriculum system, but it needs explicit revision/version fields later if the same source code is reused for materially different NERDC editions. Provenance and stable source IDs should therefore be retained from the first implementation.

## Protection of Existing Production Relationships

The future implementation must obey these rules:

- Never update `subjects.id`, `topics.subject_id`, `questions.subject_id`, `questions.topic_id`, or `exam_attempts.subject_id` for existing rows.
- Never delete or merge existing production subjects or topics as part of curriculum import.
- Insert only new production topic rows for approved source topics, with an existing production subject UUID selected by the resolver.
- Keep all question and exam APIs operating on production subject/topic IDs.
- Treat historical questions and attempts as production records; do not retroactively attach them to a source curriculum mapping.
- Use `ON DELETE RESTRICT` for source hierarchy and mapping foreign keys where a deletion could orphan provenance or a decision.
- Make the import idempotent on stable source IDs and the approved production target scope.

The existing 1,750-question bank and all existing exam relationships therefore remain untouched. A future source mapping is metadata and routing logic; it is not a permission to rewrite historical ownership.

## Eventual Import Resolution

For each verified source topic, a future importer should:

1. Validate the source class, source subject code, theme, sub-theme, topic ID, objective-set ID, provenance, and term state.
2. Load the source topic's mapping decisions.
3. Resolve one approved topic override, or one approved subject default when no override is required.
4. Stop with a structured error for `UNMAPPED`, `REVIEW_REQUIRED`, or `AMBIGUOUS`.
5. Validate that the resolved production UUID exists and is active in `public.subjects`; do not resolve by display-name fallback.
6. Upsert source hierarchy and provenance using stable source IDs.
7. Create or reuse a production `topics` row with the resolved production UUID, class, term, and source topic metadata.
8. Link the objective set to that production topic without changing any existing question row.
9. Import questions only when their source topic resolved successfully and the normal production subject/topic foreign-key checks pass.

For a source topic mapped to a production subject, the production topic name may remain the source wording. The source stable ID and mapping record are the authoritative disambiguators; normalized display-name matching must not decide cross-subject ownership.

## Unmapped and Ambiguous Subjects

Unmapped source subjects and topics remain source-side records with provenance and status, but produce no production `topics` row and no questions. This applies to Cultural and Creative Arts, French, Hausa, Igbo, and Islamic Religious Studies until an explicit production decision exists.

Arabic and Yoruba additionally remain `NO_VERIFIED_SOURCE_HIERARCHY`; they must not be treated as importable production subjects or inferred mappings. Their source review status stays visible without creating production targets.

An ambiguous mapping is represented by non-approved candidate mapping rows with `status = 'ambiguous'` or `status = 'review_required'`, a rationale, and the candidate production UUIDs. Because there is no approved row, the importer must stop rather than choose one. An explicit `unmapped` decision is different: it records that the source item was reviewed and intentionally has no production target.

## Future NERDC Revisions

Source identity and production mapping must be separated so a new NERDC edition can be loaded without rewriting old decisions. Future revisions should use a source-document or curriculum-edition identifier, preserve old stable IDs as historical records, and create new source hierarchy IDs when the canonical path changes.

Mapping decisions should be versioned or scoped to the source edition. A changed topic can then receive a new override without changing the mapping or production ownership of an older edition. Removed or superseded topics should be archived at the source layer, not deleted from production when questions or attempts depend on the existing production topic.

## Validation Performed

Read-only repository inspection confirmed:

- The applied hierarchy migration requires a single production `subject_id` on each theme.
- The production topic schema requires one `subject_id` and is referenced by questions.
- The importer resolves subjects by production name and topics by production subject/class/term/name.
- Exam selection and attempts use production subject UUIDs.
- The source dataset contains stable source subject/topic IDs and the three consolidated source subjects identified in B6.6D.1.

The document was added without database access or mutation. Repository lint is the only applicable executable validation for this Markdown-only change; it does not authorize schema or data changes.

## Final Answer

**Can PrePa safely import the current NERDC curriculum without forcing consolidated source subjects into a single production subject?**

**Yes, but not with the current subject-resolution schema and importer unchanged.** PrePa can do so after adopting a source-native hierarchy plus an approved mapping decision layer with topic-level overrides. The consolidated subjects must resolve each source topic to an existing production subject before production topics or questions are created. Until that architecture and the remaining mapping decisions are implemented and validated, the current NERDC curriculum must remain blocked from import.

`B6.6D.2 COMPLETE — MAPPING ARCHITECTURE DESIGN ONLY`
