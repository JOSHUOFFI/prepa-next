# B6.6D Curriculum Import Report

Date: 2026-09-16
Project: `yvlgahcyapibgecklfuq`

## Final Status

`B6.6D BLOCKED`

The controlled import did not start. No production writes were performed.

## Pre-import Validation

Source: `data/curriculum/jss1-3.json`

- Existing validator: PASS
- Source status: `proposed-incomplete`
- Source quality gate: `readyForImport: false`
- Classes represented: 3 (`JSS1`, `JSS2`, `JSS3`)
- Subjects represented in the verified hierarchy: 13
- Themes: 41
- Sub-themes: 55
- Topics: 134
- Objective sets: 134
- Verified objective sets: 42
- Review-required objective sets: 92
- Topic stable IDs: 134 unique, 0 duplicates
- Theme stable IDs: 41 unique, 0 duplicates
- Sub-theme stable IDs: 55 unique, 0 duplicates
- Objective-set stable IDs: 134 unique, 0 duplicates
- Hierarchy/orphan validation: PASS
- Provenance validation: PASS for source-verified topics
- Term validation: PASS; all source topics have `term: null` and `termAllocation.type: "unassigned"`

Arabic and Yoruba have no represented verified hierarchy rows in the source manifest. This is a documented source coverage limitation, not an import correction.

## Import Method

No importer was created or run. Import was stopped during preflight because the existing production subject foreign-key targets do not safely cover the source subject identities.

## Blocking Mapping Conflict

B6.6A requires `curriculum_themes.subject_id` to reference an existing `public.subjects(id)`. The source hierarchy contains official identities that cannot be mapped without inventing or arbitrarily splitting/merging curriculum subjects:

- `Basic Science and Technology`: consolidated source identity; production has separate `Basic Science` and `Basic Technology` rows.
- `National Values Curriculum`: consolidated source identity; production has separate `Civic Education`, `Social Studies`, and `Government` rows.
- `Pre-Vocational Studies`: consolidated source identity; production has separate `Agricultural Science`, `Basic Technology`, and `Business Studies` rows.
- `Christian Religious Studies`: source identity requires the documented normalization to production `CRS`.
- `English Studies`: source identity requires the documented normalization to production `English`.
- `Islamic Religious Studies`: no matching production subject row.
- `French`: no matching production subject row.
- `Hausa`: no matching production subject row.
- `Igbo`: no matching production subject row.
- `Cultural and Creative Arts`: no matching production subject row.

The repository's B6.1 mapping report explicitly records these mappings as unresolved or requiring production mapping review. Creating or selecting target subject rows would violate the source-only and no-guessing requirements.

## Production Baseline

Read before import; unchanged because import did not run:

| Relation                         |  Rows |
| -------------------------------- | ----: |
| `curriculum_themes`              |     0 |
| `curriculum_subthemes`           |     0 |
| `curriculum_objective_sets`      |     0 |
| `topics`                         |     0 |
| `questions`                      | 1,750 |
| `question_options`               | 6,998 |
| `exam_attempts`                  |     8 |
| `exam_answers`                   |    98 |
| `exam_attempt_questions`         |   320 |
| `exam_result_question_snapshots` |   200 |
| `profiles`                       |     3 |

## Production Safety

- Curriculum hierarchy writes: 0
- Topic writes: 0
- Questions changed: 0
- Question options changed: 0
- Exam attempts changed: 0
- Exam answers changed: 0
- Result snapshots changed: 0
- Profiles/users changed: 0
- Terms assigned: 0
- Questions or answer keys imported: 0

## Decision

The import is blocked pending an explicit production subject-mapping decision and/or creation of authoritative target subject records outside this import stage. No data was guessed, rewritten, merged, or imported.

`B6.6D BLOCKED`
