# Stage B6.3 Curriculum Extraction Report

## Executive summary

All 36 pages of the official NERDC Mathematics JSS1-3 PDF were systematically processed with layout extraction and rendered PDFium inspection. The visible table structure supports a substantially expanded, source-backed Mathematics hierarchy for JSS1, JSS2 and JSS3.

The other 14 official PDFs remain unresolved at hierarchy-row level because their extracted/table structures have not yet been rendered and verified. No terms were assigned, no questions were generated, and no production data was changed.

## Source coverage

| Document                            |   Pages | Extraction status                      | Verified classes | Verified topics | Review required         |
| ----------------------------------- | ------: | -------------------------------------- | ---------------- | --------------: | ----------------------- |
| jss1-3_maths.pdf                    |      36 | partially_extracted; rendered verified | JSS1-JSS3        |              50 | Objective transcription |
| jss1-3_arabic.pdf                   | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_basic_science_technology.pdf | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_business_studies.pdf         | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_crs.pdf                      | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_cca.pdf                      | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_english_studies.pdf          | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_french.pdf                   | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_hausa.pdf                    | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_history.pdf                  | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_igbo.pdf                     | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_islamic.pdf                  | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_nvc.pdf                      | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_prevoc.pdf                   | pending | manual_review_required                 | none             |               0 | Document-wide           |
| jss1-3_yoruba.pdf                   | pending | manual_review_required                 | none             |               0 | Document-wide           |

Methods used: `pypdf` text extraction, layout extraction, PDFium rendering, and rendered contact-sheet inspection. No OCR executable was available locally.

## Curriculum coverage

- Classes represented: 3
- Subjects represented in verified hierarchy: 1
- Verified themes: 14
- Verified sub-themes: 16
- Verified topics: 50
- Verified objective sets: 7
- Review-required objective sets: 43
- Review-required topic records: 0
- Verified topics with source pages: 50
- Verified topics with official source URLs: 50
- Terms assigned: 0
- Unassigned verified topics: 50

### Per-subject coverage

| Subject                      | JSS1 | JSS2 | JSS3 | Themes | Sub-themes | Topics | Verified |          Review |
| ---------------------------- | ---: | ---: | ---: | -----: | ---------: | -----: | -------: | --------------: |
| Mathematics                  |   24 |   11 |   15 |     14 |         16 |     50 |       50 |               0 |
| Arabic                       |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Basic Science and Technology |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Business Studies             |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Christian Religious Studies  |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Cultural and Creative Arts   |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| English Studies              |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| French                       |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Hausa                        |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| History                      |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Igbo                         |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Islamic Religious Studies    |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| National Values Curriculum   |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Pre-Vocational Studies       |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |
| Yoruba                       |    0 |    0 |    0 |      0 |          0 |      0 |        0 | Document review |

## Mathematics hierarchy verified

The manifest preserves rendered page provenance for Mathematics topics on PDF pages 1-36. The seven B6.2 topics and their verified objective summaries were preserved. The additional 43 topics were promoted only as visible topic labels; their objective arrays remain empty with `objectivesStatus: "review_required"` pending a careful transcription pass.

## Term allocation

- Source-backed assignments: 0
- Implementation assignments: 0
- Unassigned verified topics: 50

No school term was inferred from page order or class sequence.

## Provenance quality

- Verified topics with source pages: 50
- Verified topics with source URLs: 50
- Verified objective sets with source pages: 7
- Topic records without page provenance: 0
- Unresolved documents/pages: 14 documents plus Mathematics objective transcription gaps

## Legacy and production safety

- Legacy 1,752-question bank modified: NO
- Questions generated: NO
- Questions imported: NO
- Supabase writes: 0
- Migrations created: 0
- SAFE exam code modified: NO
- RLS modified: NO
- Answer-key protection modified: NO

## Validation

- Curriculum validator: PASS
- `npm run lint`: PASS with the existing image warning
- `npm run build`: PASS
- `git diff --check`: PASS

## Status

The dataset remains `proposed-incomplete` and `readyForImport: false`. Another extraction pass is required for the 14 non-Mathematics documents and for objective transcription before proceeding to educator-reviewed term allocation.
