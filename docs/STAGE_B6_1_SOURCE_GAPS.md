# Stage B6.1 Source Gaps

The following gaps are recorded explicitly. No topic names or objectives were guessed to close them.

| Document                              | Class     | Subject                      | Pages          | Hierarchy level                  | Problem                                                                                    | Recommended next action                                          |
| ------------------------------------- | --------- | ---------------------------- | -------------- | -------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------------------------------------- |
| `jss1-3_arabic.pdf`                   | JSS1-JSS3 | Arabic                       | Document-wide  | Theme/sub-theme/topic/objectives | Table extraction is not stable enough to preserve row boundaries.                          | Manual page review or table-aware OCR.                           |
| `jss1-3_basic_science_technology.pdf` | JSS1-JSS3 | Basic Science and Technology | Document-wide  | Theme/sub-theme/topic/objectives | Layout extraction does not expose reliable topic rows.                                     | Manual page review and subject-component mapping.                |
| `jss1-3_business_studies.pdf`         | JSS1-JSS3 | Business Studies             | Document-wide  | Topic/objectives                 | Several labels wrap across columns and are truncated by plain extraction.                  | Verify each row against the rendered PDF.                        |
| `jss1-3_crs.pdf`                      | JSS1-JSS3 | Christian Religious Studies  | Document-wide  | Topic/objectives                 | Topic and objective cells are interleaved.                                                 | Rendered page review.                                            |
| `jss1-3_cca.pdf`                      | JSS1-JSS3 | Cultural and Creative Arts   | Document-wide  | Theme/sub-theme/topic/objectives | Source table structure not reliably extracted.                                             | Rendered page review.                                            |
| `jss1-3_english_studies.pdf`          | JSS1-JSS3 | English Studies              | Document-wide  | Theme/sub-theme/topic/objectives | Automated extraction returned incomplete row coverage.                                     | Rendered page review and preserve language-skill groupings.      |
| `jss1-3_french.pdf`                   | JSS1-JSS3 | French                       | Document-wide  | Theme/sub-theme/topic/objectives | Source table structure not reliably extracted.                                             | Rendered page review.                                            |
| `jss1-3_hausa.pdf`                    | JSS1-JSS3 | Hausa                        | Document-wide  | Theme/sub-theme/topic/objectives | Source table structure not reliably extracted.                                             | Rendered page review.                                            |
| `jss1-3_history.pdf`                  | JSS1-JSS3 | History                      | Document-wide  | Class/topic/objectives           | Class headings and topic cells are interleaved in extraction.                              | Verify class boundaries visually.                                |
| `jss1-3_igbo.pdf`                     | JSS1-JSS3 | Igbo                         | Document-wide  | Theme/sub-theme/topic/objectives | Source table structure not reliably extracted.                                             | Rendered page review.                                            |
| `jss1-3_islamic.pdf`                  | JSS1-JSS3 | Islamic Religious Studies    | Document-wide  | Theme/sub-theme/topic/objectives | Source table structure not reliably extracted.                                             | Rendered page review.                                            |
| `jss1-3_maths.pdf`                    | JSS1-JSS3 | Mathematics                  | PDF pages 1-36 | Topic/objectives                 | Themes and sub-themes are visible, but wrapped topic labels need row-level reconstruction. | Verify topic cells against rendered pages before promoting them. |
| `jss1-3_nvc.pdf`                      | JSS1-JSS3 | National Values Curriculum   | Document-wide  | Theme/sub-theme/topic/objectives | Source table structure not reliably extracted.                                             | Rendered page review and confirm subject components.             |
| `jss1-3_prevoc.pdf`                   | JSS1-JSS3 | Pre-Vocational Studies       | Document-wide  | Topic/objectives                 | Topic labels wrap across columns.                                                          | Verify agriculture and home-economics components visually.       |
| `jss1-3_yoruba.pdf`                   | JSS1-JSS3 | Yoruba                       | Document-wide  | Theme/sub-theme/topic/objectives | Source table structure not reliably extracted.                                             | Rendered page review.                                            |

## Term allocation gap

No universal term allocation was found in the inspected NERDC documents. Every extracted topic must remain `unassigned` until a separate educator-reviewed sequencing pass assigns `implementation` terms.

## Subject mapping gap

The official consolidated subjects do not map one-to-one onto all existing PrePa subject rows. In particular, Basic Science and Technology, National Values, and Pre-Vocational Studies need an explicit product mapping decision before production subject IDs can be selected.

## Safety rule

These gaps are blockers for import. They are not reasons to create approximate topics, assign legacy questions, generate questions, or write to Supabase.
