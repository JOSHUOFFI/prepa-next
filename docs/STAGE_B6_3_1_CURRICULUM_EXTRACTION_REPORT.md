# Stage B6.3.1 Curriculum Extraction Report

## Result

**Partially completed.** The remaining 14 official NERDC PDFs were inventoried, downloaded from the official source, and inspected with layout extraction plus rendered PDFium contact sheets. High-confidence JSS1 hierarchy rows were promoted for eight documents. The remaining documents and continuation pages remain explicitly unresolved.

Mathematics B6.3 data was preserved unchanged.

## Method

- Confirmed official PDF URLs from the NERDC JSS1-3 landing page.
- Downloaded only the 14 in-scope official PDFs to temporary storage.
- Recorded page counts and initial class/header signals.
- Used `pypdf` normal/layout extraction for page discovery.
- Used PDFium rendering with Pillow for visual inspection of first curriculum pages.
- Promoted only visibly readable topic labels with source pages.
- Left objective arrays empty with `objectivesStatus: "review_required"` unless already verified in B6.2.
- No OCR executable was available locally.

## Source coverage

| Subject/document             | Pages | Extraction status      | Verified classes | Verified topics | Review-required items      |
| ---------------------------- | ----: | ---------------------- | ---------------- | --------------: | -------------------------- |
| Arabic                       |    28 | manual_review_required | 0                |               0 | Entire hierarchy           |
| Basic Science and Technology |   111 | partially_extracted    | JSS1             |               3 | Remaining pages/objectives |
| Business Studies             |    67 | partially_extracted    | JSS1             |               3 | Remaining pages/objectives |
| CRS                          |    43 | partially_extracted    | JSS1             |               2 | Remaining pages/objectives |
| Cultural and Creative Arts   |    37 | partially_extracted    | JSS1             |               3 | Remaining pages/objectives |
| English Studies              |    66 | partially_extracted    | JSS1             |               3 | Remaining pages/objectives |
| French                       |    20 | partially_extracted    | JSS1             |               2 | Remaining pages/objectives |
| Hausa                        |    44 | manual_review_required | 0                |               0 | Entire hierarchy           |
| History                      |    20 | partially_extracted    | JSS1             |               3 | Remaining pages/objectives |
| Igbo                         |    57 | manual_review_required | 0                |               0 | Entire hierarchy           |
| Islamic Religious Studies    |   113 | partially_extracted    | JSS1             |               1 | Remaining pages/objectives |
| National Values Curriculum   |    58 | manual_review_required | 0                |               0 | Entire hierarchy           |
| Pre-Vocational Studies       |    34 | manual_review_required | 0                |               0 | Entire hierarchy           |
| Yoruba                       |    40 | manual_review_required | 0                |               0 | Entire hierarchy           |

## Coverage totals

Across the verified hierarchy in the manifest:

- Classes represented: 3
- Subjects represented: 9 total, including Mathematics
- Themes: 24
- Sub-themes: 27
- Topics: 70
- Verified objective sets: 7
- Review-required objective sets: 63
- Verified topics with source pages and URLs: 70
- Source-backed term assignments: 0
- Implementation term assignments: 0
- Unassigned topics: 70

Per-class topic counts:

| Class | Mathematics | Other verified subjects | Total topics |
| ----- | ----------: | ----------------------: | -----------: |
| JSS1  |          24 |                      20 |           44 |
| JSS2  |          11 |                       0 |           11 |
| JSS3  |          15 |                       0 |           15 |

## Verified JSS1 subject slices

- Basic Science and Technology: Family Health; Environmental Pollution; Living and Non-Living Things.
- Business Studies: Introduction to Business Studies; The Office; Right Attitude to Work.
- Christian Religious Studies: Who is God; God's Creation.
- Cultural and Creative Arts: Introduction to Arts: History; Types of Crafts; Practical works in Tie and Dye.
- English Studies: Reading for maximum understanding; Reading for main and supporting ideas; Reading to answer specific questions.
- French: Décrire des traits physiques; Parler du temps.
- History: Meaning of History; Sources of History; Importance of History.
- Islamic Religious Studies: Suratul-Fatihah.

These labels are preserved from the official source wording where readable. They are not term allocations and do not imply question readiness.

## Objective issues

The hierarchy was prioritized over objective transcription. The seven original Mathematics objective sets remain verified. The 63 newly added non-Mathematics/continuation topic records have `objectivesStatus: "review_required"` and empty objective arrays.

## Safety checks

- No term allocations added.
- No questions generated.
- Legacy 1,752-question bank unchanged.
- Supabase writes: 0.
- Migrations: 0.
- RLS unchanged.
- SAFE exam architecture unchanged.
- No UI changes.

## Validation

- `node scripts/validate-curriculum-dataset.mjs`: PASS
- `npm run lint`: PASS with existing image warning
- `npm run build`: PASS
- `git diff --check`: PASS

## Readiness

`readyForImport` remains `false`. The dataset is not ready for term allocation or import until remaining documents, continuation pages, subject mappings, and objectives receive review.
