# Stage B6.3.4 Final Source Extraction & Completeness Audit

## Executive summary

**Status: COMPLETE.** This final broad pass continued from the B6.3.3 dataset and its gap ledger. It did not restart extraction. The available continuation evidence safely supports 18 further JSS1/JSS2 topic-and-objective rows: 11 in National Values Curriculum (JSS1 pp. 8-18) and 7 in Pre-Vocational Studies (JSS2 pp. 11-17). Each is linked to its official NERDC PDF, page, hierarchy, and explicitly unassigned term allocation.

Documents reviewed: 15. Documents fully resolved: 0. Documents partially resolved: 13. Documents requiring specialized language review: 2 (Arabic and Yoruba).

## Before/after metrics

| Metric | B6.3.3 baseline | B6.3.4 final |
| --- | ---: | ---: |
| Verified themes | 37 | 41 |
| Verified sub-themes | 49 | 55 |
| Verified topics | 116 | 134 |
| Verified objective sets | 24 | 42 |
| Remaining review-required objective sets | 92 | 92 |

Newly recovered topics: 18. Newly recovered objective sets: 18. The unchanged 92 are not treated as failures: they require a separate, safe row-by-row review before normalization/mapping.

## Document-by-document results

| Document / subject | Previous status | B6.3.4 action and result | Final classification |
| --- | --- | --- | --- |
| Basic Science and Technology | Partial | Audited existing continuation boundary; no additional unambiguous row promoted. | B |
| Business Studies | Partial | Audited existing continuation boundary; no additional unambiguous row promoted. | B |
| CRS | Partial | Audited existing continuation boundary; no additional unambiguous row promoted. | B |
| Cultural and Creative Arts | Partial | Audited existing component boundary; no additional unambiguous row promoted. | B |
| English Studies | Partial | Audited existing continuation boundary; no additional unambiguous row promoted. | B |
| French | Partial | Integrity and duplicate/provenance review; no new safe objective association. Pages 19-20 remain acknowledgements. | B |
| Hausa | Partial | Targeted integrity check of the three JSS1 source-language records; unchanged. | B |
| History | Partial | Audited existing continuation boundary; no additional unambiguous row promoted. | B |
| Igbo | Partial | Targeted integrity check of the four JSS1 source-language records; unchanged. | B |
| Islamic Religious Studies | Partial | Audited existing continuation boundary; no additional unambiguous row promoted. | B |
| Mathematics | Partial | Preservation comparison completed: 50 verified topics, unchanged. | B |
| National Values Curriculum | Partial | Rendered continuation rows pp. 8-18 promoted: 11 JSS1 topics with objective sets. | A / B |
| Pre-Vocational Studies | Partial | Rendered continuation rows pp. 11-17 promoted: 7 JSS2 Agriculture topics with objective sets. | A / B |
| Arabic | Manual review | Final RTL/table-order attempt did not establish safe topic/objective associations. | C |
| Yoruba | Manual review | Final rendered review did not permit lossless tonal/diacritic transcription and association. | C |

## Language review

### Arabic

`SPECIALIZED_LANGUAGE_REVIEW_REQUIRED`. The rendered source preserves RTL appearance, but safe logical column order, merged-cell carry-forward, and topic-to-objective association cannot be established from the available automated representation. An Arabic-literate reviewer must transcribe the rendered tables verbatim, retaining RTL order and page/row provenance.

### Hausa

The three verified JSS1 source-language records (pp. 3-5) retain their provenance and class/hierarchy association. No further row was promoted without language-aware continuation review.

### Igbo

The four verified JSS1 source-language records (pp. 1-4) retain their source spelling, provenance, and association. No further row was promoted without language-aware continuation review.

### Yoruba

`SPECIALIZED_LANGUAGE_REVIEW_REQUIRED`. The source representation cannot guarantee preservation of tonal marks, underdots, accented characters, word boundaries, and table associations together. A Yoruba-literate reviewer must transcribe the rendered pages verbatim before promotion.

## Subject-specific review

### National Values

The three B6.3.3 Civic Education rows remain unchanged. Eleven additional JSS1 continuation rows are verified on pp. 8-18, covering Social Studies Education, Social Studies, and Security Education. Later components/classes remain B pending page-by-page source review.

### Pre-Vocational Studies

The six B6.3.3 JSS1 rows remain unchanged. Seven JSS2 Agriculture continuation rows are verified on pp. 11-17. Remaining components/classes are B pending source review.

### French

The B6.3.2/B6.3.3 JSS1-JSS3 hierarchy, one verified objective, provenance, and duplicate controls remain intact. No unsupported objective was added.

### Mathematics preservation

Pre/post comparison confirms all 50 Mathematics topics remain present with their names, hierarchy, provenance, and unassigned allocation unchanged. No duplicate Mathematics topic was created.

## Safety audit

- Supabase writes: 0
- Questions generated: 0
- Legacy bank modifications: 0
- Production curriculum modifications: 0
- Term assignments: 0

The dataset remains `proposed-incomplete` and `readyForImport: false`.

## Validation

- Curriculum validator: PASS
- Duplicate/provenance/unassigned-term check: PASS
- Mathematics preservation: PASS (50 topics)
- Lint: PASS with the pre-existing `<img>` warning
- Build: PASS
- Relevant extraction/data tests: PASS (`validate-curriculum-dataset.mjs`)
- Git diff: PASS (no whitespace errors; unrelated existing application changes preserved)
