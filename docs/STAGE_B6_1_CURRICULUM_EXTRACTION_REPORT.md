# Stage B6.1 Curriculum Extraction Report

## Result

The official document set was inspected individually. The manifest remains `proposed-incomplete` and `readyForImport: false`. No questions were generated and no Supabase rows were written.

## Official sources inspected

Primary index: [NERDC JSS 1-3 Basic Education Curriculum](https://www.nerdc.gov.ng/content_manager/jss1-3.html).

PDFs inspected:

- `jss1-3_arabic.pdf`
- `jss1-3_basic_science_technology.pdf`
- `jss1-3_business_studies.pdf`
- `jss1-3_crs.pdf`
- `jss1-3_cca.pdf`
- `jss1-3_english_studies.pdf`
- `jss1-3_french.pdf`
- `jss1-3_hausa.pdf`
- `jss1-3_history.pdf`
- `jss1-3_igbo.pdf`
- `jss1-3_islamic.pdf`
- `jss1-3_maths.pdf`
- `jss1-3_nvc.pdf`
- `jss1-3_prevoc.pdf`
- `jss1-3_yoruba.pdf`

## Processing summary

| Measure                                    |                Count |
| ------------------------------------------ | -------------------: |
| Documents inspected                        |                   15 |
| Fully extracted and verified               |                    0 |
| Partially extracted                        |                    1 |
| Requiring manual review                    |                   15 |
| Classes represented in the PrePa dimension |                    3 |
| Terms represented in the PrePa dimension   |                    3 |
| Verified themes retained                   | 5 Mathematics themes |
| Verified sub-themes retained as topic data |                    0 |
| Verified topics                            |                    0 |
| Review-required topic records              |                    0 |

The zero topic count is intentional. A review-required document is not converted into guessed topic records.

## Verified source facts retained

The Mathematics document clearly exposes these JSS curriculum themes:

- Numbers and Numeration
- Basic Operations
- Algebraic Processes
- Mensuration and Geometry
- Everyday Statistics

The document also exposes class and sub-theme headings, but wrapped topic cells cannot be reconstructed reliably from the current text extraction alone. These themes remain source metadata, not imported topics.

## Subject mapping

| Official subject identity                                           | Proposed PrePa identity         | Status                                     |
| ------------------------------------------------------------------- | ------------------------------- | ------------------------------------------ |
| Mathematics                                                         | Mathematics                     | exact                                      |
| History                                                             | History                         | exact                                      |
| Christian Religious Studies                                         | CRS                             | normalized                                 |
| English Studies                                                     | English                         | normalized, product naming review required |
| Basic Science and Technology                                        | Basic Science and Technology    | consolidated, production mapping required  |
| Business Studies                                                    | Business Studies                | exact name exists, scope review required   |
| National Values Curriculum                                          | National Values Curriculum      | consolidated, production mapping required  |
| Pre-Vocational Studies                                              | Pre-Vocational Studies          | consolidated, production mapping required  |
| Arabic, CCA, French, Hausa, Igbo, Islamic Religious Studies, Yoruba | No automatic production mapping | unmapped/review required                   |

No production subject rows were created, renamed, deleted, or modified.

## Term allocation

| Allocation type      |                                               Count |
| -------------------- | --------------------------------------------------: |
| Source-backed        |                                                   0 |
| PrePa implementation |                                                   0 |
| Unassigned           |                                     0 topic records |
| Review-required      | 0 topic records; document-level review remains open |

The NERDC documents inspected do not provide a universal three-term allocation. Term allocation is intentionally deferred to a separate sequencing pass.

## Legacy bank

The legacy bank remains read-only:

- Total: 1,752
- Valid: 1,749
- Rejected: 3
- Duplicate IDs: 0
- Duplicate text: 33
- Definitely mappable: 0
- Probably mappable: 0
- Ambiguous: 1,749
- Not mappable: 3

## Production and security

- Curriculum database writes: 0
- Question writes: 0
- Migrations: 0
- Legacy bank changes: 0
- SAFE architecture changes: 0

RLS, answer-key protection, server-side grading, attempts, snapshots, and submission behavior were not changed.

## Validation

- `node scripts/validate-curriculum-dataset.mjs`: PASS
- JSON diagnostics: PASS
- `npm run lint`: PASS with the existing image warning
- `npm run build`: PASS
- `git diff --check`: PASS

## Remaining blockers

The complete hierarchy cannot be declared verified until each PDF's table cells are reviewed page by page or extracted with a reliable table-aware/OCR workflow. See [STAGE_B6_1_SOURCE_GAPS.md](STAGE_B6_1_SOURCE_GAPS.md).
