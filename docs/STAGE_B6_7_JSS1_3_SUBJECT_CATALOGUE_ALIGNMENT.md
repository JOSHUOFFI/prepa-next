# B6.7 JSS1-JSS3 Production Subject Catalogue Alignment

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Scope: read-only audit and alignment design

## 1. Executive Summary

**VERIFIED FACT:** The current production catalogue contains 18 active subjects with immutable UUID primary keys, unique names/slugs, category labels, and 1,750 active questions. The current question bank has usable pools for 10 subjects and zero questions for 8 subjects. Production `topics` currently has zero rows, and all 1,750 questions have `topic_id = null`; one question has class/term metadata and the rest are global pools.

**VERIFIED FACT:** The application and database are production-subject-centric. `questions.subject_id`, `topics.subject_id`, and `exam_attempts.subject_id` reference `subjects.id` with restrictive foreign keys. The newly implemented student exam flow is subject-only; class/term remain internal/admin and historical metadata.

**RECOMMENDATION:** Preserve every existing production UUID. Treat the 22-subject catalogue as a future catalogue/configuration layer above production subjects. Do not rename, delete, merge, or re-key production subjects in this stage.

**REQUIRES DECISION:** Several target labels are broader, narrower, or differently scoped than existing subjects. The repository does not prove that Basic Science equals Intermediate Science, Basic Technology equals Digital Technologies, History equals Nigerian History, or Civic Education plus Social Studies equals Social & Citizenship Studies. Those require explicit product/curriculum decisions before any rename, alias, consolidation, or question migration.

## 2. Current Production Subject Catalogue

The production schema is defined in `supabase/migrations/20260823000000_initial_schema.sql`: `subjects.id` is a UUID primary key; `name` and `slug` are unique; `category` is required; `is_active` defaults to true. The seed catalogue is defined in `supabase/seed.sql`. The following is the current read-only production inventory.

| Production subject | UUID | Slug | Category | Active | Questions | Capacity |
| --- | --- | --- | --- | --- | ---: | --- |
| Accounting | `1696fc62-d7e6-4547-a01f-f140644ef1b8` | `accounting` | Commercial | true | 0 | 0 |
| Agricultural Science | `ab79e100-9e4c-4a9e-b952-19df15b2443c` | `agricultural-science` | Science | true | 0 | 0 |
| Basic Science | `7c901feb-d013-4c90-9585-6c0fe317b472` | `basic-science` | Junior Secondary | true | 0 | 0 |
| Basic Technology | `46aa307a-5002-48dd-b4ba-7798a2f5e258` | `basic-technology` | Junior Secondary | true | 0 | 0 |
| Biology | `bb3d3ab5-ba77-47f5-967d-0b850e406480` | `biology` | Science | true | 160 | 50-199 |
| Business Studies | `5b894bfe-6f29-41a6-907c-26a4c2f11fff` | `business-studies` | Junior Secondary | true | 0 | 0 |
| Chemistry | `46a1093b-2ac5-4e2b-835b-f009a72cb359` | `chemistry` | Science | true | 190 | 50-199 |
| Civic Education | `f0d8904d-842b-478c-b3ba-e2e3054429a1` | `civic-education` | Core Subjects | true | 0 | 0 |
| Commerce | `d319d302-334b-4eb4-b403-b46f7a794a09` | `commerce` | Commercial | true | 200 | 200+ |
| CRS | `5e4ff239-fd12-4765-b035-70ea77ecee6c` | `crs` | Arts and Humanities | true | 200 | 200+ |
| Economics | `a55ad82b-4630-491b-ae8d-76613c147d27` | `economics` | Commercial | true | 200 | 200+ |
| English | `a0e64f96-d382-4cee-9f84-b1e6b5e075c6` | `english` | Core Subjects | true | 99 | 50-199 |
| Government | `d9dabed8-efa8-46fb-9637-ca4c30caa97d` | `government` | Arts and Humanities | true | 200 | 200+ |
| History | `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412` | `history` | Arts and Humanities | true | 0 | 0 |
| Literature | `91f5f142-acbf-42bb-b85e-c58ef9d15d54` | `literature` | Arts and Humanities | true | 200 | 200+ |
| Mathematics | `91f37d59-3401-47c5-ae18-46ead707c570` | `mathematics` | Core Subjects | true | 151 | 50-199 |
| Physics | `1812a3d8-cfb8-4564-ae3b-5611c8c2357c` | `physics` | Science | true | 150 | 50-199 |
| Social Studies | `a84c1eac-8827-433b-9e89-535b96540f53` | `social-studies` | Junior Secondary | true | 0 | 0 |

**VERIFIED FACT:** The capacity target for future question-bank planning is 200+ per target subject. Current production totals are not evidence that a subject is curriculum-complete.

## 3. Target 22-Subject Catalogue

The target contains 22 conceptual subjects:

| Category | Target subjects | Rule |
| --- | --- | --- |
| Core Academic | English Studies; Mathematics; Intermediate Science; Physical & Health Education; Digital Technologies; Nigerian History; Social & Citizenship Studies; Cultural & Creative Arts; Business Studies | Core catalogue group |
| Nigerian Languages | Hausa; Igbo; Yoruba | Learner selects one option, not all three |
| Religion | Christian Religious Studies; Islamic Studies | Applicable religious option; do not assume both |
| Optional Languages | French; Arabic Language | Optional |
| Trade/Vocational | Solar Photovoltaic Installation & Maintenance; Fashion Design & Garment Making; Livestock Farming; Beauty & Cosmetology; Computer Hardware & GSM Repairs; Horticulture & Crop Production | Trade options |

**VERIFIED FACT:** The current repository contains source documents for English Studies, Mathematics, Basic Science and Technology, History, Business Studies, CRS, CCA, Hausa, Igbo, French, Arabic, Islamic Religious Studies, and other NERDC subjects. The source manifest remains `proposed-incomplete` and is not an authorization to populate production subjects.

## 4. Subject-by-Subject Alignment Matrix

Classifications use the requested meanings:

- **EXISTING — direct match:** current production identity is the same subject concept/name, allowing documented normalization only.
- **EXISTING — likely rename/normalization candidate:** an existing row may be the product identity, but the target label is not identical and requires an approved naming decision.
- **EXISTING — possible consolidation candidate:** existing rows could contribute to a broader target, but this would require explicit content and dependency review.
- **NEW — no safe existing production subject:** no current production row supports the target identity.
- **NEEDS DECISION:** evidence is insufficient to safely equate, rename, consolidate, or create the target.

| Target | Current production candidate(s) | Classification | Current questions | Evidence / decision |
| --- | --- | --- | ---: | --- |
| English Studies | English (`a0e64f96-d382-4cee-9f84-b1e6b5e075c6`) | EXISTING — likely rename/normalization candidate | 99 | B6.6D.1 documents English Studies -> English normalization; product naming still requires approval. |
| Mathematics | Mathematics (`91f37d59-3401-47c5-ae18-46ead707c570`) | EXISTING — direct match | 151 | Exact source and production identity; stable UUID. |
| Intermediate Science | Basic Science (`7c901feb-d013-4c90-9585-6c0fe317b472`) | NEEDS DECISION | 0 | The source evidence identifies Basic Science and Technology, not a verified equivalence to Intermediate Science. |
| Physical & Health Education | None | NEW — no safe existing production subject | 0 | No P.E./Health production row or verified production mapping was found. |
| Digital Technologies | Basic Technology (`46aa307a-5002-48dd-b4ba-7798a2f5e258`) | NEEDS DECISION | 0 | Name and scope may differ; no approved equivalence to Digital Technologies exists. |
| Nigerian History | History (`41fcf4c5-0a9b-4486-8de6-b98fe1c2c412`) | EXISTING — likely rename/normalization candidate | 0 | NERDC History exists and current UUID is safe to preserve; “Nigerian” is a scope/product naming decision. |
| Social & Citizenship Studies | Civic Education + Social Studies | EXISTING — possible consolidation candidate | 0 | B6.6D.1 documents NVC distributed across Civic Education, Social Studies, and Government; target scope needs approved consolidation rules. |
| Cultural & Creative Arts | None | NEW — no safe existing production subject | 0 | Source CCA exists, but no production target is documented. |
| Business Studies | Business Studies (`5b894bfe-6f29-41a6-907c-26a4c2f11fff`) | EXISTING — direct match | 0 | Exact production name; no questions currently exist. Commerce is separate and must not be silently merged. |
| Hausa | None | NEW — no safe existing production subject | 0 | Source hierarchy has limited verified Hausa rows; no production subject exists. |
| Igbo | None | NEW — no safe existing production subject | 0 | Source hierarchy has limited verified Igbo rows; no production subject exists. |
| Yoruba | None | NEEDS DECISION | 0 | No production row and no verified source hierarchy; specialized language review remains open. |
| Christian Religious Studies | CRS (`5e4ff239-fd12-4765-b035-70ea77ecee6c`) | EXISTING — likely rename/normalization candidate | 200 | B6.6D.1 documents CRS normalization; preserve CRS UUID. |
| Islamic Studies | Islamic Religious Studies: none | NEEDS DECISION | 0 | Source identity exists, but no production Islamic Studies row; exact product label and creation decision are open. |
| French | None | NEW — no safe existing production subject | 0 | Source French hierarchy exists, but no production target is documented. |
| Arabic Language | None | NEEDS DECISION | 0 | Source document exists but Arabic has no verified source hierarchy and no production row. |
| Solar Photovoltaic Installation & Maintenance | None | NEW — no safe existing production subject | 0 | No current production row or source mapping supports this trade target. |
| Fashion Design & Garment Making | None | NEW — no safe existing production subject | 0 | No current production row or source mapping supports this trade target. |
| Livestock Farming | Agricultural Science (`ab79e100-9e4c-4a9e-b952-19df15b2443c`) | NEEDS DECISION | 0 | Agricultural Science is broader; livestock is not proven equivalent. |
| Beauty & Cosmetology | None | NEW — no safe existing production subject | 0 | No current production row or source mapping supports this trade target. |
| Computer Hardware & GSM Repairs | None | NEW — no safe existing production subject | 0 | No current production row or source mapping supports this trade target. |
| Horticulture & Crop Production | Agricultural Science (`ab79e100-9e4c-4a9e-b952-19df15b2443c`) | NEEDS DECISION | 0 | Agricultural Science may be related, but target scope is narrower and no approved equivalence exists. |

## 5. Existing UUID Preservation Recommendations

**RECOMMENDATION:** Preserve all 18 existing subject UUIDs exactly. No catalogue alignment requires deleting or re-keying a subject.

At minimum, the following known target candidates must retain their IDs if later renamed or aliased:

- English: `a0e64f96-d382-4cee-9f84-b1e6b5e075c6`
- Mathematics: `91f37d59-3401-47c5-ae18-46ead707c570`
- Basic Science: `7c901feb-d013-4c90-9585-6c0fe317b472`
- Basic Technology: `46aa307a-5002-48dd-b4ba-7798a2f5e258`
- History: `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412`
- Civic Education: `f0d8904d-842b-478c-b3ba-e2e3054429a1`
- Social Studies: `a84c1eac-8827-433b-9e89-535b96540f53`
- Business Studies: `5b894bfe-6f29-41a6-907c-26a4c2f11fff`
- CRS: `5e4ff239-fd12-4765-b035-70ea77ecee6c`
- Agricultural Science: `ab79e100-9e4c-4a9e-b952-19df15b2443c`

**VERIFIED FACT:** `questions.subject_id`, `topics.subject_id`, and `exam_attempts.subject_id` all depend on these UUIDs. Question options, attempt questions, answers, result snapshots, and grading depend transitively on the question/attempt identities. Names may be changed only through a separately approved compatibility-aware operation; UUIDs and relationships must remain unchanged.

## 6. Rename / Consolidation / Deprecation Candidates

### Candidate renames or aliases

- English -> English Studies: likely product-label normalization, but existing code and legacy data use `English`; preserve UUID and provide a compatibility alias before changing display text.
- History -> Nigerian History: possible display-label change, but verify whether the target intends only Nigerian history. Do not relabel until scope is approved.
- CRS -> Christian Religious Studies: documented normalization candidate; preserve UUID and support the existing `CRS` alias.

### Consolidation candidates

- Civic Education + Social Studies -> Social & Citizenship Studies: possible target consolidation, but current Government content is also part of the documented NVC source mapping. Decide whether Government is included, excluded, or remains a separate production subject.
- Basic Science + Basic Technology -> Intermediate Science / Digital Technologies: not a safe automatic consolidation. The audit and source mapping architecture specifically treat Basic Science and Technology as a multi-target source, not as proof that the two production subjects should be renamed into the proposed targets.
- Agricultural Science -> Livestock Farming / Horticulture & Crop Production: possible future content partition, not a rename. Preserve Agricultural Science until scope and content coverage are reviewed.

### Deprecation

**RECOMMENDATION:** Do not deprecate any existing subject in B6.7. A zero-question subject is an availability/population issue, not evidence that its production row is obsolete. Deprecation would require a separate dependency and product-catalogue decision.

## 7. Question-Bank Impact

**VERIFIED FACT:** Current questions are attached directly to production subject UUIDs. There are no production topic rows and all current questions have null `topic_id`; subject ownership remains the meaningful current relationship.

Current capacity bands:

- **0 questions:** Accounting, Agricultural Science, Basic Science, Basic Technology, Business Studies, Civic Education, History, Social Studies.
- **1-49:** none.
- **50-199:** Biology (160), Chemistry (190), English (99), Mathematics (151), Physics (150).
- **200+:** Commerce, CRS, Economics, Government, Literature (200 each).

For potential target alignments:

- Existing questions can remain attached to their current UUIDs while catalogue decisions are reviewed.
- A display rename can preserve question ownership if the UUID is unchanged, but references, exports, and legacy subject-name matching need compatibility handling.
- A consolidation must not move existing questions implicitly. Future question-bank partitioning or remapping requires a separately approved, auditable operation.
- The target catalogue’s 200+ quality-question goal is not met by any automatic rename alone; new content work is a later stage.

## 8. Subject Category and Option Model

**RECOMMENDATION:** Add a catalogue configuration layer conceptually above `public.subjects`, without changing production subjects in B6.7.

Minimum future model:

- `catalogue_key`: stable product key for the 22 target entries.
- `display_name`: product label independent of the production subject name.
- `category`: `core_academic`, `nigerian_language`, `religion`, `optional_language`, or `trade_vocational`.
- `production_subject_id`: nullable existing UUID when a safe mapping is approved.
- `availability_status`: `available`, `no_questions`, `mapping_required`, `not_ready`, or `unmapped`.
- `selection_group`: nullable group key such as `nigerian_language` or `religion`.
- `selection_rule`: `independent`, `one_of_group`, or `applicable_option`.
- `source_identity`: nullable source code/edition reference, separate from production UUID.
- `sort_order`, `is_active`, and review/provenance metadata.

This can initially be a reviewed application/data specification, not a database migration. Do not add a new schema table until naming and mappings are approved.

The existing student exam flow remains subject-only. Catalogue categories and option rules affect catalogue display/eligibility, not class/term exam selection.

## 9. Nigerian Language Selection Rule

**RECOMMENDATION:** Represent Hausa, Igbo, and Yoruba as one selection group with `selection_rule = one_of_group`, minimum one selection and maximum one selection per learner/profile/context. Do not present all three as mandatory subjects.

**REQUIRES DECISION:** The current `profiles` table has no Nigerian-language choice field. A later implementation must decide whether the choice belongs to a profile, school/class context, enrollment record, or only the exam/session selection state. Do not add this field in B6.7.

Because Hausa and Igbo have no safe production subject rows and Yoruba has no verified source hierarchy, the option group is currently configuration-only and not exam-available.

## 10. Religious Subject Rule

**RECOMMENDATION:** Represent CRS and Islamic Studies in a religion option group with `selection_rule = applicable_option`; do not assume both are mandatory.

**REQUIRES DECISION:** The repository has no religion-selection field or learner enrollment rule. Decide whether applicability is determined by learner profile, school policy, enrollment, or explicit future catalogue selection. Do not infer it from current exam attempts.

CRS preserves its existing production UUID. Islamic Studies currently has no safe production subject row.

## 11. Optional Language / Trade Handling

French and Arabic Language should be separate optional-language entries, each independently selectable when a future production mapping and question pool exists. They are not Nigerian-language group members.

The six trade entries should be independently selectable trade/vocational options. They should not be represented by renaming Agricultural Science or Basic Technology without content/scope evidence. Existing Agricultural Science and Basic Technology UUIDs must remain available for their current identities.

## 12. Application Dependency Impact

**VERIFIED FACT:** Current application subject metadata is partly hard-coded in `lib/constants.ts` and partly loaded from `public.subjects`:

- `subjectGroups` drives grouping and legacy subject labels.
- `app/exam/page.tsx` loads active production subjects and assigns groups from `subjectGroups`.
- Dashboard, result routes, admin question bank, question editor, curriculum manager, importer, and exam routes resolve production subject IDs/names.
- Admin workflows depend on class/term/topic fields and must remain unchanged.
- The newly implemented student exam flow selects only a production subject and must not be coupled to the future catalogue’s class/term metadata.

**RECOMMENDATION:** Before catalogue implementation, replace name-only grouping with stable catalogue keys/IDs and explicit product metadata. Keep production UUID resolution as the final bridge to questions/exams.

No application code should be changed in B6.7.

## 13. Safe Migration Strategy

This is a design-only stage. The safe future strategy is:

1. Freeze and snapshot all 18 production subject UUIDs, names, slugs, categories, active flags, question counts, topic references, and attempt references.
2. Approve the 22 target labels, scope definitions, and option rules.
3. Decide which targets are aliases/renames, which are new subjects, and which require source-topic mapping or content partitioning.
4. Create a catalogue configuration layer with nullable `production_subject_id`; do not mutate `public.subjects` as part of catalogue creation.
5. Preserve existing production UUIDs and provide aliases for legacy names.
6. Populate new production subjects only in a separately approved operation, after question-bank and source-mapping decisions.
7. Keep question and exam relationships unchanged; any content migration is a separate auditable operation.
8. Add catalogue UI only after the configuration and selection rules are approved.
9. Validate subject-only exam selection by production subject ID and keep class/term internal.

No step above is executed in B6.7.

## 14. Explicit Non-Goals

B6.7 does not:

- modify `public.subjects`, `topics`, `questions`, or exam data;
- rename, delete, deactivate, merge, or re-key production subjects;
- create migrations, seed rows, production subjects, topics, or questions;
- import or generate question content;
- implement Nigerian-language or religion selection storage;
- alter RLS, exam RPCs, grading, snapshots, or the subject-only exam flow;
- reintroduce class/term selection to students;
- implement the B6.6 source-native curriculum architecture.

## 15. Implementation Order

1. Approve target subject definitions and the unresolved equivalence decisions.
2. Approve stable catalogue keys, categories, option groups, and availability states.
3. Produce a read-only dependency fingerprint for all current production subject UUIDs.
4. Implement catalogue metadata/configuration with nullable production mappings and legacy aliases.
5. Add/admin-test catalogue display and option-group rules without changing exam history.
6. Make explicit production-subject additions or display renames only through separately approved operations.
7. Expand question banks to the 200+ quality target per approved subject.
8. Run subject-only exam regression tests using production subject IDs.
9. Review future source-curriculum mappings independently through the approved B6.6D architecture.

## 16. Risks / Decisions Required

### Decisions required

- Is Basic Science truly the intended production identity for Intermediate Science?
- Is Basic Technology the intended identity for Digital Technologies, or should Digital Technologies be a new subject?
- Should History be displayed as Nigerian History, and does the content scope support that label?
- Should Social & Citizenship Studies combine Civic Education and Social Studies only, or include Government content?
- Is Physical & Health Education a new production subject, and what source curriculum supports it?
- Should Islamic Studies and Arabic Language receive new production rows now or remain unresolved?
- Are Livestock Farming and Horticulture & Crop Production separate vocational subjects or future partitions of Agricultural Science?
- Where should Nigerian-language and religion applicability be stored?
- Should existing legacy labels remain visible as aliases after any approved display rename?

### Risks

- A name-only rename could misrepresent curriculum scope while leaving the same questions attached.
- Consolidating subjects could silently mix incompatible question pools and historical analytics.
- Creating subjects before content/mapping decisions would produce selectable but unavailable rows, as the current zero-question subjects demonstrate.
- Catalogue categories hard-coded by display name will become brittle as labels change.
- A future source mapping must not be inferred from the target catalogue name.

## 17. Final Implementation Gate

The alignment design is complete, but several target equivalences and catalogue governance rules remain unresolved. Those decisions affect whether a production row can safely be retained, aliased, added, or later partitioned.

`BLOCKED — REQUIRES DECISION`

Reasons for the gate:

- Intermediate Science, Digital Technologies, Nigerian History, Social & Citizenship Studies, Physical & Health Education, Islamic Studies, Arabic Language, and the trade subjects lack fully approved production identity decisions.
- Nigerian-language and religion applicability storage has not been decided.
- The current question bank has no questions for eight existing subjects and no questions for most target identities.

No production or application changes were made in B6.7.

`B6.7 COMPLETE — JSS1-JSS3 SUBJECT CATALOGUE ALIGNMENT`
