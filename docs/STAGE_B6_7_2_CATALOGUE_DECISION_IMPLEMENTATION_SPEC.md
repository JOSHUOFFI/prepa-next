# B6.7.2 Catalogue Decision and Implementation Specification

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Authoritative inputs: [B6.7 Catalogue Alignment](STAGE_B6_7_JSS1_3_SUBJECT_CATALOGUE_ALIGNMENT.md), [B6.7.1 Target Identity Resolution](STAGE_B6_7_1_TARGET_SUBJECT_IDENTITY_RESOLUTION.md), and approved B6.6D architecture artifacts.

This is a read-only design specification. No database, migration, seed, production subject, question, topic, exam, attempt, result, RLS policy, RPC, application code, or catalogue configuration was changed.

## 1. Executive Decision

**VERIFIED FACT:** The approved target catalogue contains exactly 22 subjects across five product categories. Existing production subjects are UUID-keyed and coupled to questions and exam history. The subject-only student exam flow must remain unchanged.

**APPROVED DESIGN DECISION:** The catalogue is a layer above/beside `public.subjects`. Each catalogue row has its own stable key and may optionally reference one existing production subject UUID. A catalogue display name must not be used as a production identity.

**APPROVED DESIGN DECISION:** Existing production UUIDs, question ownership, topic/question relationships, exam attempts/results, foreign keys, RLS, RPCs, and class/term behavior remain immutable in the catalogue implementation.

**REQUIRES DECISION:** B6.7.1 did not establish safe equivalence for Intermediate Science, Digital Technologies, Nigerian History, Social & Citizenship Studies, Physical & Health Education, Arabic Language, Yoruba, or the trade subjects. The catalogue contract records these as `UNRESOLVED`; implementation may represent them as catalogue metadata but must not invent production mappings.

**Final implementation posture:** The exact 22-row catalogue is defined, but production catalogue implementation is blocked until the unresolved curriculum/product decisions are approved.

## 2. Final 22-Subject Catalogue Matrix

`availability_status` is catalogue status, not a claim that questions exist:

- `mapped_no_questions`: approved production relationship is absent for current questions.
- `mapping_required`: catalogue identity exists or is requested, but no production UUID is approved.
- `source_review_required`: source identity needs completion before catalogue availability.
- `scope_decision_required`: a target/equivalence decision is open.
- `not_ready`: target has no approved source/production readiness evidence.

| # | Catalogue key | Display name | Category | Production relationship | Existing UUID | Relationship type | Availability | Selection group | Source identity/reference | Implementation note |
| ---: | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | `english_studies` | English Studies | `core_academic` | Existing English candidate | `a0e64f96-d382-4cee-9f84-b1e6b5e075c6` | `UNRESOLVED` | `scope_decision_required` | None | `ENGLISH_STUDIES`; B6.6D.1 normalization | Use a catalogue alias only after product approval; preserve English UUID. |
| 2 | `mathematics` | Mathematics | `core_academic` | Existing Mathematics | `91f37d59-3401-47c5-ae18-46ead707c570` | `MAP_EXISTING` | `mapped_no_questions` | None | `MATHEMATICS`; exact source/production identity | Direct UUID-preserving mapping. Current pool has 151 questions. |
| 3 | `intermediate_science` | Intermediate Science | `core_academic` | Basic Science is only a candidate | `7c901feb-d013-4c90-9585-6c0fe317b472` | `UNRESOLVED` | `scope_decision_required` | None | No verified Intermediate Science source identity; source is Basic Science and Technology | Do not rename Basic Science or map by label. |
| 4 | `physical_health_education` | Physical & Health Education | `core_academic` | None | None | `UNRESOLVED` | `not_ready` | None | No verified source/production identity in reviewed artifacts | Requires authoritative JSS1-JSS3 curriculum/product definition. |
| 5 | `digital_technologies` | Digital Technologies | `core_academic` | Basic Technology is only a candidate | `46aa307a-5002-48dd-b4ba-7798a2f5e258` | `UNRESOLVED` | `scope_decision_required` | None | No verified Digital Technologies identity; source/production Basic Technology exists | Do not equate with Basic Technology by name. |
| 6 | `nigerian_history` | Nigerian History | `core_academic` | Existing History candidate | `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412` | `UNRESOLVED` | `scope_decision_required` | None | `HISTORY`; `jss1-3_history.pdf` | Decide whether “Nigerian” is a display label or narrower scope; preserve History UUID. |
| 7 | `social_citizenship_studies` | Social & Citizenship Studies | `core_academic` | Civic Education, Social Studies, Government are candidates | `f0d8904d-842b-478c-b3ba-e2e3054429a1`; `a84c1eac-8827-433b-9e89-535b96540f53`; `d9dabed8-efa8-46fb-9637-ca4c30caa97d` | `UNRESOLVED` | `scope_decision_required` | None | `NVC`; B6.6D.1 topic-level multi-target mapping | Must not merge production subjects; Government inclusion requires decision. |
| 8 | `cultural_creative_arts` | Cultural & Creative Arts | `core_academic` | No production target | None | `NEW_CATALOGUE_IDENTITY` | `mapping_required` | None | `CCA`; `jss1-3_cca.pdf`; partial source hierarchy | Distinct catalogue identity; production mapping remains future work. |
| 9 | `business_studies` | Business Studies | `core_academic` | Existing Business Studies | `5b894bfe-6f29-41a6-907c-26a4c2f11fff` | `MAP_EXISTING` | `mapped_no_questions` | None | `BUSINESS_STUDIES`; official source identity | Preserve Business Studies UUID; do not merge Commerce. |
| 10 | `hausa` | Hausa | `nigerian_language` | No production target | None | `UNRESOLVED` | `source_review_required` | `nigerian_language` / `exactly_one` | `HAUSA`; `jss1-3_hausa.pdf`; limited verified JSS1 rows | Distinct language identity is evidenced, but JSS1-JSS3 review is incomplete. |
| 11 | `igbo` | Igbo | `nigerian_language` | No production target | None | `UNRESOLVED` | `source_review_required` | `nigerian_language` / `exactly_one` | `IGBO`; `jss1-3_igbo.pdf`; limited verified JSS1 rows | Distinct language identity is evidenced, but JSS1-JSS3 review is incomplete. |
| 12 | `yoruba` | Yoruba | `nigerian_language` | No production target | None | `UNRESOLVED` | `source_review_required` | `nigerian_language` / `exactly_one` | `YORUBA`; `jss1-3_yoruba.pdf`; no verified hierarchy; specialized review | Do not invent hierarchy or production mapping. |
| 13 | `christian_religious_studies` | Christian Religious Studies | `religion` | Existing CRS candidate | `5e4ff239-fd12-4765-b035-70ea77ecee6c` | `UNRESOLVED` | `scope_decision_required` | `religion` / `applicable_option` | `CRS`; `jss1-3_crs.pdf`; documented CRS normalization | Product label requires approval; preserve CRS UUID and alias. |
| 14 | `islamic_studies` | Islamic Studies | `religion` | No production target | None | `NEW_CATALOGUE_IDENTITY` | `source_review_required` | `religion` / `applicable_option` | `ISLAMIC_RELIGIOUS_STUDIES`; `jss1-3_islamic.pdf`; partial source hierarchy | Separate from CRS; no production subject creation in this stage. |
| 15 | `french` | French | `optional_language` | No production target | None | `NEW_CATALOGUE_IDENTITY` | `source_review_required` | None | `FRENCH`; `jss1-3_french.pdf`; JSS1-JSS3 hierarchy with review gaps | Distinct optional-language identity; no automatic production mapping. |
| 16 | `arabic_language` | Arabic Language | `optional_language` | No production target | None | `UNRESOLVED` | `source_review_required` | None | `ARABIC`; `jss1-3_arabic.pdf`; no verified hierarchy; RTL review | Keep separate from French; no production mapping. |
| 17 | `solar_photovoltaic_installation_maintenance` | Solar Photovoltaic Installation & Maintenance | `trade_vocational` | None | None | `UNRESOLVED` | `not_ready` | None | No corresponding verified source identity in reviewed artifacts | Requires authoritative trade curriculum evidence. |
| 18 | `fashion_design_garment_making` | Fashion Design & Garment Making | `trade_vocational` | None | None | `UNRESOLVED` | `not_ready` | None | No corresponding verified source identity in reviewed artifacts | Requires authoritative trade curriculum evidence. |
| 19 | `livestock_farming` | Livestock Farming | `trade_vocational` | Agricultural Science is broader candidate | `ab79e100-9e4c-4a9e-b952-19df15b2443c` | `UNRESOLVED` | `scope_decision_required` | None | `PREVOC`; Agriculture component; no specific Livestock Farming identity | Do not treat Agricultural Science as equivalent without reviewed scope/content mapping. |
| 20 | `beauty_cosmetology` | Beauty & Cosmetology | `trade_vocational` | None | None | `UNRESOLVED` | `not_ready` | None | No corresponding verified source identity in reviewed artifacts | Requires authoritative trade curriculum evidence. |
| 21 | `computer_hardware_gsm_repairs` | Computer Hardware & GSM Repairs | `trade_vocational` | Basic Technology is related candidate | `46aa307a-5002-48dd-b4ba-7798a2f5e258` | `UNRESOLVED` | `scope_decision_required` | None | No verified target identity; Basic Technology is not equivalent by name | Do not map or split Basic Technology content implicitly. |
| 22 | `horticulture_crop_production` | Horticulture & Crop Production | `trade_vocational` | Agricultural Science is broader candidate | `ab79e100-9e4c-4a9e-b952-19df15b2443c` | `UNRESOLVED` | `scope_decision_required` | None | `PREVOC`; Agriculture component; no specific Horticulture identity | Do not map by name; requires reviewed curriculum scope. |

**Matrix count: exactly 22 catalogue subjects.**

## 3. Existing Production Subject Protection

The catalogue must sit above/beside the production subject model. The following are immutable in catalogue implementation:

- Existing `subjects.id` UUIDs.
- Existing subject names and slugs unless a separate compatibility-approved operation is authorized later.
- Existing `questions.subject_id` ownership.
- Existing `topics.subject_id`, `questions.topic_id`, and all topic/question relationships.
- Existing exam attempts, attempt-question rows, answers, result snapshots, grading state, and historical results.
- Existing foreign keys, delete behavior, uniqueness constraints, indexes, and row identity.
- Existing RLS policies and security-sensitive exam RPC behavior.
- Existing subject-only exam flow; class/term must not be reintroduced to students.

**APPROVED DESIGN DECISION:** A catalogue display name may differ from a production subject name. This is handled as metadata/aliasing, not by renaming production rows.

## 4. Catalogue-to-Production Mapping Contract

A catalogue subject is not automatically a production subject.

### Approved relationship forms

1. **One catalogue subject -> one existing production subject:** permitted only when an explicit `MAP_EXISTING` decision is approved. The existing UUID is retained.
2. **Catalogue subject with no production subject:** permitted. It remains visible as `mapping_required`, `source_review_required`, or `not_ready`; it must not become an exam target.
3. **Future explicit mapping:** may attach a catalogue key to an existing production UUID after curriculum/product approval and dependency review. This must be auditable and reversible at the catalogue layer.
4. **Alias/display label:** may expose “English Studies,” “Christian Religious Studies,” or a later approved label while retaining the production name/UUID compatibility path.
5. **Source mapping:** a source-native topic may map to one or more production subjects only through the approved B6.6D mapping resolver. The catalogue name cannot decide topic ownership.

### Prohibited behavior

- No name-only equivalence.
- No implicit mapping from a broader subject to a narrower target.
- No implicit mapping from a narrower subject to a broader target.
- No production subject creation solely because a catalogue row exists.
- No question reassignment to make a catalogue row appear available.
- No subject merge represented by multiple production UUIDs silently collapsed into one.

## 5. Selection Rules

These are product-level rules only. Storage ownership is not decided here.

### Nigerian languages

`Hausa | Igbo | Yoruba`

- Selection cardinality: `exactly_one`.
- The three entries share selection group `nigerian_language`.
- A learner must not be required or allowed to select all three as mandatory subjects.

### Religion

`Christian Religious Studies | Islamic Studies`

- Selection behavior: `applicable_option`.
- CRS and Islamic Studies are alternatives/applicable options; both are not assumed mandatory.
- Storage ownership for applicability remains **REQUIRES DECISION**. B6.7/B6.7.1 do not establish whether it belongs to profile, school policy, enrollment, or exam/session context.

### Optional languages

French and Arabic Language remain independent optional-language entries. They are not members of the Nigerian-language group.

### Trade/vocational

Each of the six trade entries remains independently identifiable and selectable only when its identity, mapping, and question availability are approved.

## 6. Identity Decisions

### English Studies vs English

**VERIFIED FACT:** B6.6D.1 documents English Studies normalized to production English, with product naming review required.  
**APPROVED DESIGN DECISION:** Catalogue key `english_studies` may preserve the target display name while retaining production UUID `a0e64f96-d382-4cee-9f84-b1e6b5e075c6` as the compatibility bridge.  
**REQUIRES DECISION:** Final display/alias approval before catalogue availability is marked mapped.

### Christian Religious Studies vs CRS

**VERIFIED FACT:** B6.6D.1 documents CRS normalization from Christian Religious Studies.  
**APPROVED DESIGN DECISION:** Preserve CRS UUID `5e4ff239-fd12-4765-b035-70ea77ecee6c`; catalogue display may use Christian Religious Studies after label approval.  
**REQUIRES DECISION:** Applicability storage and final display approval.

### Intermediate Science vs Basic Science

**VERIFIED FACT:** The reviewed source identity is Basic Science and Technology, not Intermediate Science.  
**APPROVED DESIGN DECISION:** Keep `intermediate_science` as `UNRESOLVED`; do not rename or map Basic Science.  
**REQUIRES DECISION:** Scope and product identity.

### Digital Technologies vs Basic Technology

**VERIFIED FACT:** Basic Technology exists, but no evidence establishes Digital Technologies as its equivalent.  
**APPROVED DESIGN DECISION:** Keep `digital_technologies` separate and unresolved.  
**REQUIRES DECISION:** Product/curriculum equivalence.

### Nigerian History vs History

**VERIFIED FACT:** History is an exact source/production identity in B6.6D.1.  
**APPROVED DESIGN DECISION:** Preserve History UUID and keep `nigerian_history` unresolved until scope is confirmed.  
**REQUIRES DECISION:** Display-only label versus narrower Nigerian-history scope.

### Social & Citizenship Studies vs Civic/Social/Government

**VERIFIED FACT:** NVC is a consolidated source identity mapped at topic level to Civic Education, Social Studies, and Government candidates.  
**APPROVED DESIGN DECISION:** Keep one catalogue identity with no automatic production mapping.  
**REQUIRES DECISION:** Target scope and Government inclusion; no production merge is authorized.

### Livestock Farming / Horticulture vs Agricultural Science

**VERIFIED FACT:** Pre-Vocational Studies includes Agriculture, while Agricultural Science is a broader existing production subject.  
**APPROVED DESIGN DECISION:** Keep both trade keys unresolved and do not map them to Agricultural Science by name.  
**REQUIRES DECISION:** Whether these are independent trade subjects or reviewed partitions.

### Computer Hardware & GSM Repairs vs Basic Technology

**VERIFIED FACT:** Basic Technology is related but the target is narrower/different and has no reviewed source mapping.  
**APPROVED DESIGN DECISION:** Keep the trade key unresolved and do not map it to Basic Technology.  
**REQUIRES DECISION:** Authoritative trade scope.

### Languages, religion, and other trades

**VERIFIED FACT:** Hausa, Igbo, Yoruba, Islamic Religious Studies, French, and CCA have source identities at different levels of review; Arabic and Yoruba require specialized review; the six trades lack sufficient verified identities.  
**APPROVED DESIGN DECISION:** Preserve exactly the matrix relationships and availability statuses; do not invent production mappings.  
**REQUIRES DECISION:** Completion/approval of source evidence and product applicability rules.

## 7. Implementation Boundary

### Next implementation stage may change

Only the following are in scope for a separately approved catalogue implementation:

- Additive catalogue-layer schema/configuration.
- Exactly 22 catalogue configuration records.
- Catalogue display metadata and stable keys.
- Explicit nullable references to existing production subject UUIDs.
- Legacy display aliases where separately approved.
- Catalogue category and selection-rule metadata.
- Catalogue availability/status metadata.
- Read-only/admin catalogue presentation, if separately approved.

### Next implementation stage must not change

- Existing production subject UUIDs, names, slugs, categories, or active state without separate approval.
- Existing questions, question ownership, topics, topic/question relationships, or question options.
- Existing exam attempts, attempt-question rows, answers, result snapshots, results, grading, and history.
- Existing class/term columns or values.
- Existing RLS policies, security boundaries, exam RPCs, or subject-only exam flow.
- Source curriculum tables/imports or B6.6D mapping data.
- Question generation or import.

## 8. Migration and Rollback Contract

This is design-level only; no migration SQL is authorized here.

### Additive principle

Any later catalogue implementation must add catalogue metadata without altering production subject/question/exam ownership. The catalogue layer may reference existing production UUIDs but must not become the production subject table.

### Legacy preservation

Existing names, slugs, UUIDs, aliases, foreign keys, and application lookup compatibility remain available. A display label change must be additive/compatible at the catalogue layer.

### Mapping safety

A catalogue-to-production link may be created only from an explicit approved decision. `UNRESOLVED`, `source_review_required`, `scope_decision_required`, and `not_ready` entries remain non-importable/non-examable. B6.6D source-topic mapping remains the authority for topic-level consolidated mappings.

### Rollback

Rollback may remove or archive only newly created catalogue metadata/configuration after checking its references. It must never delete or alter production subjects, questions, topics, attempts, results, or source curriculum records. Removing a catalogue link must not remove the referenced production subject or questions.

### Question-bank preservation

No question migration is part of catalogue implementation. Existing question counts and subject ownership must be fingerprinted before and after implementation and remain identical.

## 9. Acceptance Criteria for B6.7.3

The implementation agent must satisfy all of the following:

- Exactly 22 catalogue subjects exist, with no additions, omissions, renames, or merges.
- Every catalogue key and display name matches the matrix.
- Existing production UUIDs are unchanged.
- Existing production subject rows and names/slugs remain unchanged unless separately approved.
- No existing question, topic, attempt, result, or snapshot is reassigned or modified.
- `MAP_EXISTING` relationships point to the exact approved UUID.
- `UNRESOLVED` rows have no implicit production mapping and cannot be treated as exam-ready.
- Hausa, Igbo, and Yoruba have selection group `nigerian_language` with cardinality `exactly_one`.
- CRS and Islamic Studies have religion group behavior `applicable_option`; both are not mandatory by default.
- French and Arabic are independent optional-language entries.
- Each trade is independently identifiable and does not inherit an unrelated production UUID.
- No implicit subject merges occur.
- The subject-only exam flow remains unchanged and class/term are not reintroduced to students.
- Existing RLS/RPC/grading behavior remains unchanged.
- Curriculum validator, typecheck/lint, build where applicable, and `git diff --check` pass.
- Only intended catalogue files/schema are changed; no production/data/application drift occurs.

## 10. Final Gate

**BLOCKED — REQUIRES CURRICULUM/PRODUCT DECISION**

The 22-row contract is complete, but B6.7.1 contains genuine unresolved decisions required before catalogue implementation: Intermediate Science, Digital Technologies, Nigerian History, Social & Citizenship Studies, Physical & Health Education, Arabic/Yoruba readiness, trade identity/scope, and applicability storage. The next implementation stage must not guess through these states.

No implementation was performed in B6.7.2. No database, production data, seed file, migration, question, exam, result, RLS policy, RPC, or application code was modified.

`B6.7.2 COMPLETE — CATALOGUE DECISION AND IMPLEMENTATION SPECIFICATION`
