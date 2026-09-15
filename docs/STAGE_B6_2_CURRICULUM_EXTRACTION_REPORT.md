# Stage B6.2 Curriculum Extraction Report

## Source coverage

| Measure                           |                                                         Count |
| --------------------------------- | ------------------------------------------------------------: |
| Documents inspected               |                                                            15 |
| Documents fully extracted         |                                                             0 |
| Documents partially extracted     |                                        1 (`jss1-3_maths.pdf`) |
| Documents requiring manual review |                         14, plus unresolved Mathematics pages |
| Extraction methods used           | pypdf text, pypdf layout, rendered PDF inspection with PDFium |
| OCR used                          |                           No OCR binary was available locally |
| Supabase writes                   |                                                             0 |

The official source index is [NERDC JSS 1-3 Basic Education Curriculum](https://www.nerdc.gov.ng/content_manager/jss1-3.html). Only official NERDC PDF assets were used.

## Curriculum coverage

The first rendered-page pass verified a source-backed slice:

| Measure                                    |             Count |
| ------------------------------------------ | ----------------: |
| Classes represented in verified hierarchy  |        1 (`JSS1`) |
| Subjects represented in verified hierarchy | 1 (`Mathematics`) |
| Verified themes                            |                 2 |
| Verified sub-themes                        |                 3 |
| Verified topics                            |                 7 |
| Review-required topics                     |                 0 |
| Topic records with unassigned terms        |                 7 |

Verified hierarchy:

- JSS1 / Mathematics / Numbers and Numeration / Whole Numbers
  - Whole Numbers, page 1
  - LCM, page 1
  - HCF, page 2
  - Counting in Base 2, page 3
  - Conversion of base 10 numerals to binary numbers, page 3
- JSS1 / Mathematics / Numbers and Numeration / Fractions
  - Fractions, page 4
- JSS1 / Mathematics / Basic Operations / Basic Operations
  - Addition and subtraction, page 5

The page images visibly confirm the row labels, class, theme, sub-theme, objectives column, and printed page numbers. Terms remain `null` with allocation type `unassigned`.

## Per-subject coverage

| Subject                      | JSS1 topics | JSS2 topics | JSS3 topics | Themes | Sub-themes | Verified | Review required |
| ---------------------------- | ----------: | ----------: | ----------: | -----: | ---------: | -------: | --------------: |
| Mathematics                  |           7 |           0 |           0 |      2 |          3 |        7 |               0 |
| Arabic                       |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Basic Science and Technology |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Business Studies             |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Christian Religious Studies  |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Cultural and Creative Arts   |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| English Studies              |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| French                       |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Hausa                        |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| History                      |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Igbo                         |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Islamic Religious Studies    |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| National Values Curriculum   |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Pre-Vocational Studies       |           0 |           0 |           0 |      0 |          0 |        0 | Document review |
| Yoruba                       |           0 |           0 |           0 |      0 |          0 |        0 | Document review |

## Term allocation

- Source-backed term assignments: 0
- Implementation assignments: 0
- Unassigned verified topics: 7
- Review-required term assignments: 0

## Subject mapping

The verified slice maps Mathematics exactly to the existing PrePa Mathematics identity. Other subject mappings remain documented in the manifest and are not changed in production.

## Objectives

The seven verified topics include concise summaries of the readable performance-objective cells. These are summaries, not copied curriculum passages. Objective extraction for unresolved documents remains pending.

## Legacy bank and production safety

The legacy 1,752-question bank remains untouched. No question was generated, mapped, imported, or assigned to a topic. No curriculum rows, topics, migrations, or production subjects were written.

SAFE exam attempts, snapshots, RLS, answer-key protection, and server-side grading were not modified.

## Validation

- `node scripts/validate-curriculum-dataset.mjs`: PASS
- `npm run lint`: PASS with the existing image warning
- `npm run build`: PASS
- `git diff --check`: PASS

## Final status

The manifest remains `proposed-incomplete` with `readyForImport: false`. The extracted seven-topic slice is traceable; the remaining 14 documents and Mathematics pages after page 5 require rendered verification or OCR before their hierarchy can be promoted.
