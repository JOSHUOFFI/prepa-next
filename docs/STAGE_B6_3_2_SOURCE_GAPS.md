# Stage B6.3.2 Remaining Source Gaps

This ledger lists only gaps remaining after B6.3.2 rendered-PDF remediation.

| Subject/document | Remaining pages/area | Hierarchy level | Why unresolved | Recommended next action |
| --- | --- | --- | --- | --- |
| Arabic | Indexed curriculum pages 10-20 | Theme, sub-theme, topic, objectives | PDFium preserves correct RTL visual order, while text extraction reverses/garbles the logical order. | Arabic-literate manual transcription of rendered table rows; retain Arabic source text verbatim. |
| Basic Science and Technology | 4-111 | Continuation hierarchy and objectives | Only initial JSS1 rows are promoted. | Render by class/component and reconcile continuation rows before promotion. |
| Business Studies | 4-67 | Continuation hierarchy and objectives | Later themes/classes have not been safely reviewed. | Render table pages through each class boundary. |
| CRS | 4-43 | Continuation hierarchy and objectives | Only initial JSS1 rows are promoted. | Render sequentially and record page-level topic provenance. |
| Cultural and Creative Arts | 4-37 | Continuation hierarchy and objectives | Component changes can alter table context. | Review component transitions before mapping hierarchy. |
| English Studies | 4-66 | Continuation hierarchy and objectives | Reading slice is verified; later skills/themes are not. | Review table pages through JSS1-JSS3 class transitions. |
| French | Objective cells on pages 1-18 | Objectives | Topic labels are verified through page 18, but objectives were not transcribed as complete source evidence; pages 19-20 are acknowledgements, not curriculum continuation. | Perform objective-focused review. |
| Hausa | 2-44 | Topic/objective row boundaries | Hausa Unicode is present, but layout extraction does not reliably maintain all table/continuation boundaries. | Hausa-literate rendered review, preserving diacritics and original wording. |
| History | 4-20 | Continuation hierarchy and objectives | Only initial JSS1 Concept of History rows are promoted. | Render later themes/class sections before promotion. |
| Igbo | 1-57 | Topic/objective row boundaries | Igbo source text and headings survive extraction, but visual table segmentation is not sufficient for mass promotion. | Igbo-literate rendered review, retaining orthography and diacritics. |
| Islamic Religious Studies | 3-113 | Continuation hierarchy and objectives | Only the initial JSS1 Qur'an row is promoted. | Render by theme and class; retain official terminology. |
| National Values Curriculum | 5-58 | Component/theme transitions, objectives | Pages 2-4 are clear Civic Education / Our Values rows; subsequent duplicated/transition headers require component-aware mapping. | Review each component transition and record source terminology before schema mapping. |
| Pre-Vocational Studies | 8-34 | Component/class continuation, objectives | JSS1 Agriculture and Home Economics slices are clear; later components/classes remain unreviewed. | Render remaining component transitions and class boundaries. |
| Yoruba | 1-40 | Theme, sub-theme, topic, objectives | Text extraction drops critical Yoruba characters and headings, making it unsafe to normalize labels. | Yoruba-literate rendered review with verbatim source transcription. |

## Objective policy

No objective was invented or inferred. All newly promoted topics use `objectivesStatus: "review_required"`, empty objective arrays, and explicit unassigned term allocation.
