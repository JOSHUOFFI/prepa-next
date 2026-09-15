# Stage B6.3.3 Objective & Multilingual Remediation Report

## Executive summary

**Status: PARTIAL.** B6.3.3 used rendered official NERDC PDF rows and layout extraction to enrich existing topics with source-backed objectives and to promote a small number of unambiguous Hausa and Igbo records. Existing B6.3.2 data, including all 50 Mathematics topics, was preserved.

- Documents reviewed: 7 (French integrity check; National Values; Pre-Vocational Studies; Arabic; Hausa; Igbo; Yoruba).
- Documents fully resolved: 0.
- Documents partially resolved: 12.
- Documents still requiring language/rendered review: 2 (Arabic and Yoruba).
- Newly recovered topics: 7 (Hausa 3; Igbo 4).
- Newly verified objective sets: 17.

## Objective recovery

| Metric | Count |
| --- | ---: |
| Verified objectives before B6.3.3 | 7 |
| Newly verified objective sets | 17 |
| Verified objectives after B6.3.3 | 24 |
| Remaining review-required objective sets | 92 |

Objectives were promoted only where the source objective/performance-objective cell was visibly associated with the existing topic row. No objective was inferred from a topic label.

Objective recovery sources:

- French JSS1 page 3: objective for `Parler de ce que l’on fait pour se distraire`.
- National Values Curriculum JSS1 pages 2-4: objectives for `National Values`, `National Values: Honesty`, and `National Values: Self Reliance`.
- Pre-Vocational Studies JSS1 pages 2-7: objectives for the six already-verified Agriculture/Home Economics rows.
- Hausa JSS1 pages 3-5 and Igbo JSS1 pages 1-4: source-language objectives retained with their original spelling/diacritics.

## Aggregate totals

Calculated from the dataset after this stage:

| Metric | Total |
| --- | ---: |
| Verified themes | 37 |
| Verified sub-themes | 49 |
| Verified topics | 116 |
| Verified objective sets | 24 |
| Review-required objective sets | 92 |
| Unassigned topics | 116 |

## Multilingual review

### Arabic

- Rendered pages reviewed: 1 and 6-8.
- Finding: the native RTL source renders correctly, but text extraction reverses/garbles logical ordering. The rendered table of contents points to curriculum pages 10-20, but no topic/objective row was promoted without Arabic-literate row verification.
- Records recovered: 0.
- Blocker: RTL column order and topic/objective association require manual Arabic-language rendered transcription.

### Hausa

- Rendered pages reviewed: 2-5.
- Finding: Unicode text, special characters, hierarchy headers and objective cells are visually clear for the selected JSS1 rows.
- Records recovered: `Tsarin Sassauƙar Jimla` (p. 3), `Furuci` (p. 4), and `Auna Fahimta` (p. 5), under `HARSHE` / `SAURARO DA MAGANA`; objectives are retained in Hausa.
- Remaining blocker: pages 6-44 need continuation/class-boundary review.

### Igbo

- Rendered pages reviewed: 1-4.
- Finding: Igbo diacritics and table columns remain legible for selected JSS1 rows.
- Records recovered: `Ụdaasụsụ na Nsoroedide Igbo` (p. 1), `Ịkọwa ndị bụ ndị Igbo na asụsụ ha` (p. 2), `Ahịrịmfe` (p. 3), and `Nrụkọrịta ọrụ na uru ọ bara` (p. 4), with source-language objectives.
- Remaining blocker: pages 5-57 require language-aware continuation review.

### Yoruba

- Rendered pages reviewed: 1-4.
- Finding: extracted text loses critical Yoruba tonal/diacritic characters and hierarchy labels. No row was promoted because source wording could not be reliably preserved.
- Records recovered: 0.
- Blocker: Yoruba-literate rendered transcription is required.

## National Values Curriculum

Previous state was three verified JSS1 `Civic Education` / `Our Values` topics with objectives pending. B6.3.3 recovered source objective cells for all three from pages 2-4. Component/theme transitions after page 4 remain unresolved.

## Pre-Vocational Studies

Previous state was six verified JSS1 Agriculture/Home Economics topics with objectives pending. B6.3.3 recovered source objective cells for all six from pages 2-7. The remaining component/class continuation remains unresolved.

## French

Integrity review found the JSS1-JSS3 hierarchy, provenance, and duplicate controls intact. One directly rendered JSS1 objective (page 3) was added to its existing topic. Pages 19-20 remain correctly classified as acknowledgements, not curriculum continuation.

## Provenance and safety

Every newly promoted topic has the official NERDC document, source URL and actual source page in the dataset. All topics remain explicitly unassigned (`term: null`, `termAllocation.type: "unassigned"`).

- Supabase writes: 0
- Questions generated: 0
- Legacy bank modifications: 0
- Production curriculum modifications: 0
- Term assignments: 0
- OCR: not used

The dataset remains `proposed-incomplete` and `readyForImport: false`.
