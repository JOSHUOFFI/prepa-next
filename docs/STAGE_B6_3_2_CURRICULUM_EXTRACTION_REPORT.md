# Stage B6.3.2 Curriculum Extraction Remediation Report

## Summary

**Result: PARTIAL.** This remediation preserved the B6.3.1 hierarchy and added only rows verified against freshly downloaded official NERDC PDFs. No existing verified record was deleted or altered.

- Documents remediated with newly verified records: French, National Values Curriculum, and Pre-Vocational Studies.
- Documents reviewed without safe new promotion: Arabic, Hausa, Igbo, and Yoruba.
- Documents still partially extracted from B6.3.1: Basic Science and Technology, Business Studies, CRS, CCA, English Studies, History, and Islamic Religious Studies.
- New verified topics: 39 (30 French, 3 National Values, 6 Pre-Vocational Studies).
- Newly verified objectives: 0. Objective cells are deliberately retained as `review_required` unless safely transcribed in full.

## Aggregate dataset totals

Calculated from `data/curriculum/jss1-3.json` after remediation:

| Metric | Total |
| --- | ---: |
| Verified classes represented | 3 |
| Verified subjects represented | 12 |
| Verified themes | 34 |
| Verified sub-themes | 46 |
| Verified topics | 109 |
| Verified objectives | 7 |
| Objectives requiring review | 102 |
| Unassigned topics | 109 |

The 50 verified Mathematics topics from B6.3 remain present and unchanged.

## Per-document status

| Document | B6.3.1 status | B6.3.2 status | Pages reviewed in B6.3.2 | Topics recovered | Objectives recovered | Remaining gap/confidence |
| --- | --- | --- | --- | ---: | ---: | --- |
| Arabic | manual review | manual review | 1, 6-8 rendered | 0 | 0 | RTL rendering is clear, but extracted ordering is reversed and curriculum tables on later indexed pages need Arabic-aware row review. |
| Basic Science and Technology | partial | partial | Source inventory retained | 0 | 0 | Pages 4-111 and objectives remain unresolved. |
| Business Studies | partial | partial | Source inventory retained | 0 | 0 | Pages 4-67 and objectives remain unresolved. |
| CRS | partial | partial | Source inventory retained | 0 | 0 | Pages 4-43 and objectives remain unresolved. |
| Cultural and Creative Arts | partial | partial | Source inventory retained | 0 | 0 | Pages 4-37 and objectives remain unresolved. |
| English Studies | partial | partial | Source inventory retained | 0 | 0 | Pages 4-66 and objectives remain unresolved. |
| French | partial | partial | 1-18 rendered/layout reviewed; 19-20 inspected | 30 | 0 | Topic hierarchy is readable across JSS1-JSS3; pages 19-20 are acknowledgement tables, while objective transcription requires separate review. |
| Hausa | manual review | manual review | 2-5 rendered/layout reviewed | 0 | 0 | Unicode text is present, but row segmentation and continuation mapping require language-aware validation. |
| History | partial | partial | Source inventory retained | 0 | 0 | Pages 4-20 and objectives remain unresolved. |
| Igbo | manual review | manual review | 1-4 rendered/layout reviewed | 0 | 0 | Unicode text and headings survive, but table row boundaries require language-aware review. |
| Islamic Religious Studies | partial | partial | Source inventory retained | 0 | 0 | Pages 3-113 and objectives remain unresolved. |
| National Values Curriculum | manual review | partial | 2-8 rendered/layout reviewed | 3 | 0 | Civic Education / Our Values rows are clear; component/theme transitions and remaining pages require review before further mapping. |
| Pre-Vocational Studies | manual review | partial | 1-7 rendered/layout reviewed | 6 | 0 | JSS1 Agriculture and Home Economics rows are clear; remaining component/class continuation requires review. |
| Yoruba | manual review | manual review | 1-4 rendered/layout reviewed | 0 | 0 | Text extraction loses critical characters and headings; visual language-aware transcription is needed. |

## Evidence for newly verified records

All new topics retain `sourceDocument`, official NERDC `sourceUrl`, and actual `sourcePages` in the dataset.

- French: JSS1 pages 1-4; JSS2 pages 5-11; JSS3 pages 12-18. Rendered PDF inspection confirmed the class, `THEME`, `SUB-THEME`, and `SUJET` columns. The exact French source labels were retained.
- National Values Curriculum: JSS1 Civic Education / Our Values, pages 2-4: `National Values`, `National Values: Honesty`, and `National Values: Self Reliance`.
- Pre-Vocational Studies: JSS1 Agriculture / Concept and Medium of Agricultural Production, pages 2-5; and Home Economics / Family Living and Resource Management, pages 6-7.

## Extraction methods

- Official NERDC PDFs downloaded to temporary storage.
- `pypdf` normal and layout extraction for text/table discovery.
- PDFium (`pypdfium2`) rendered inspection for source-cell verification.
- No OCR was used.

## Safety

- Supabase writes: 0
- Questions generated: 0
- Legacy bank modifications: 0
- Term assignments: 0
- Production curriculum modifications: 0
- Migrations, RLS, SAFE, and answer-key protection changes: 0

`status` remains `proposed-incomplete` and `readyForImport` remains `false`.
