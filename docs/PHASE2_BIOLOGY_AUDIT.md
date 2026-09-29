# Phase 2 Biology Question Bank Audit

Audit date: 2026-09-26

## Source and subject

- Canonical production subject: Biology, `bb3d3ab5-ba77-47f5-967d-0b850e406480`.
- Source: `data/legacy-question-bank.ts`, the `Biology` array, records `B1` through `B160`.
- The array contains 160 Biology-oriented records. It has no citation to an exam, publisher, syllabus, or source document, so no such provenance is claimed.
- There was no Biology-specific seed script before this pass.
- All 160 source records already existed in production. This pass inserted zero questions.

## Remediation

Archived without deleting source records:

| IDs        | Reason                                                                                    |
| ---------- | ----------------------------------------------------------------------------------------- |
| B17        | Ambiguous: carrots and vitamin-A-rich meat such as liver can both be sources.             |
| B46, B140  | B46 repeats B140's transpiration question less precisely; B46 archived.                   |
| B113       | Renewable-resource classification is not a Biology question.                              |
| B128       | Tests geological weathering rather than a biological process.                             |
| B129, B108 | Identical stem about a flightless bird; B129 archived.                                    |
| B135, B1   | Near-duplicate mitochondrial energy-function question; B135 archived.                     |
| B137, B105 | Overlapping photosynthesis gas item; B137 also ambiguously refers to daytime gas release. |
| B144, B83  | Near-duplicate gamete-fusion question; B144 archived.                                     |
| B152, B8   | Near-duplicate basic-unit-of-life question; B152 archived.                                |
| B154, B11  | Near-duplicate photosynthesis question; B154 archived.                                    |
| B160       | Evaporation is a physical state change without a Biology context.                         |

Stems were clarified, without changing the keyed answer, for B6, B16, B23, B30, B82, B109, B112, B155, and B156. The edits qualify typical animal cells, starch digestion, ABO-only red-cell compatibility (excluding Rh), pollen carrying male gametes, energy in most ecosystems, the described cattle-egret interaction, respiratory waste gas, and a full adult dentition. Explanations for B16, B82, and B112 were replaced with concise, scoped explanations. Sixty-two boilerplate explanations from the legacy source are omitted from production rather than presented as teaching material.

## Curriculum and classification

Production has no Biology themes, subthemes, or topics. The repository's extracted curriculum is for JSS1-3 and contains no Biology curriculum; the Biology catalogue identity is SSS. The hierarchy schema requires a class on every theme, while the Biology source and production questions are global and do not establish a class allocation. No curriculum hierarchy, source provenance, class allocation, or topic mapping was invented. The 149 active questions therefore remain unassigned pending an authoritative Biology curriculum and compatible scope.

## Live result

- Source: 160; inserted: 0; active: 149; archived/inactive: 11.
- Active question option integrity: 0 invalid option sets, 0 missing correct answers, 0 multiple correct answers, and 0 repeated options within a question.
- Exact duplicate stems: 0. Exact duplicate question-plus-option sets: 0.
- Eight option-set groups recur across questions with different stems; none is a full duplicate question.
- Difficulty: 147 easy, 2 medium, 0 hard. Medium items are B60 (biome attributes) and B112 (the described species interaction).
- Topics: 149 unassigned. Biology themes: 0; subthemes: 0; topics: 0; Biology orphaned hierarchy rows: 0; duplicate Biology topic names: 0.
- Catalogue mapping remains `biology` to the canonical subject UUID. Its stored `availability_status` remains `mapped_no_questions` and was not edited.
- Existing exam eligibility logic counts active global questions and requires 40. Biology has 149 active global questions with options and the stored status is not a blocking status, so the actual selector state is **Available**. No readiness override was made.

## Remaining limitations

The pool is usable under the current exam gate, but it is not fully curriculum-ready: no authoritative Biology hierarchy is available, so content-aware topic assignments cannot be made honestly. The legacy bank is uncited, and explanations outside the specifically corrected items still warrant subject-matter review before being treated as authoritative teaching material.
