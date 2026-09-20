# B6.7.2.1 Decision Resolution and Implementation Readiness

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Scope: read-only resolution of remaining B6.7 catalogue decisions

## Executive Summary

**VERIFIED FACT:** B6.7.1 identified unresolved equivalence and readiness questions, but the requested 22 catalogue names themselves are already defined by the approved target catalogue.

**APPROVED DESIGN DECISION:** A catalogue identity may exist without a production subject mapping. This is the correct treatment for targets whose product identity is specified but whose source evidence, production equivalence, or question-bank readiness is incomplete.

**APPROVED:** English Studies may use the existing English production UUID as a compatibility-preserving catalogue mapping. Christian Religious Studies may use the existing CRS UUID.

**DEFERRED:** Intermediate Science, Digital Technologies, Nigerian History, Social & Citizenship Studies, Physical & Health Education, the Nigerian languages, Islamic Studies, French, Arabic Language, and all six trades may exist as catalogue identities, but production mapping/readiness remains blocked unless explicitly approved later.

**UNRESOLVED:** The repository does not establish where Nigerian-language and religious applicability selections should be stored. This does not prevent defining the catalogue identities or product rules; it prevents implementing selection storage.

## Evidence Sources Reviewed

- B6.7 target catalogue and alignment matrix.
- B6.7.1 target identity resolution.
- B6.7.2 catalogue decision/implementation specification.
- B6.6D.1 subject mapping audit.
- B6.6D.2-D.4 source/production separation architecture.
- B6.6D.5 subject availability audit.
- Existing production schema, seed identities, and application subject-resolution paths.

No broad curriculum re-audit was performed. No production or application data was changed.

## Decision Records

### 1. English Studies -> English UUID

- **Issue:** Whether catalogue English Studies can reference production English.
- **Existing evidence:** B6.6D.1 explicitly records English Studies normalized to English. Production English UUID is `a0e64f96-d382-4cee-9f84-b1e6b5e075c6`; it has 99 questions.
- **Decision:** `APPROVED`
- **Exact rationale:** Existing approved mapping evidence supports a compatibility-preserving relationship. The catalogue display may say English Studies while the production UUID remains English.
- **Production impact:** None in this stage. Preserve the UUID, production name, question ownership, and name-based compatibility paths.
- **Required future action:** Catalogue implementation may record the explicit relationship and legacy alias. Any display-name change requires separate compatibility review.

### 2. Christian Religious Studies -> CRS UUID

- **Issue:** Whether catalogue Christian Religious Studies can reference CRS.
- **Existing evidence:** B6.6D.1 explicitly documents normalization to CRS. Production CRS UUID is `5e4ff239-fd12-4765-b035-70ea77ecee6c`; it has 200 questions.
- **Decision:** `APPROVED`
- **Exact rationale:** The source/product normalization is already documented and does not require changing the production UUID.
- **Production impact:** None in this stage. Preserve CRS UUID and existing `CRS` compatibility name.
- **Required future action:** Catalogue implementation may expose the full display label with CRS as the production alias.

### 3. Intermediate Science vs Basic Science

- **Issue:** Whether Intermediate Science is equivalent to Basic Science.
- **Existing evidence:** The reviewed source identity is Basic Science and Technology, documented as a consolidated source mapping to Basic Science and Basic Technology. No source identity or approved decision establishes Intermediate Science as Basic Science.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** Intermediate Science is a valid requested catalogue label, but its scope is not evidenced as equivalent to Basic Science or the consolidated source. Name similarity is insufficient.
- **Production impact:** Do not reference Basic Science UUID `7c901feb-d013-4c90-9585-6c0fe317b472`; do not rename Basic Science.
- **Required future action:** Approve the pedagogical scope and then decide whether it maps to Basic Science, a source-topic set, or a distinct future production subject.

### 4. Digital Technologies vs Basic Technology

- **Issue:** Whether Digital Technologies is equivalent to Basic Technology.
- **Existing evidence:** Basic Technology is an existing production target for the consolidated Basic Science and Technology source. No approved source/product evidence establishes Digital Technologies as that same subject.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** Digital Technologies may be narrower or materially different from Basic Technology. The catalogue label can be retained without claiming equivalence.
- **Production impact:** Do not reference Basic Technology UUID `46aa307a-5002-48dd-b4ba-7798a2f5e258` or move its questions.
- **Required future action:** Approve scope and determine whether the relationship is alias, source-topic mapping, or a new production identity.

### 5. Nigerian History vs History

- **Issue:** Whether Nigerian History is only a product label for History or a narrower subject.
- **Existing evidence:** History is an exact source/production identity in B6.6D.1, using UUID `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412`. The evidence does not prove that all History content is specifically Nigerian History.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** The target identity is defined, but the adjective “Nigerian” changes or may change scope. It cannot be treated as a display-only alias without product approval.
- **Production impact:** Preserve History UUID and its ownership; do not relabel or reclassify existing content.
- **Required future action:** Decide display alias versus narrower content scope.

### 6. Social & Citizenship Studies vs Civic Education / Social Studies / Government

- **Issue:** Whether the target replaces or consolidates existing Civic Education, Social Studies, and Government.
- **Existing evidence:** B6.6D.1 records NVC as a consolidated source mapped at topic level to all three production candidates. Existing UUIDs are Civic Education `f0d8904d-842b-478c-b3ba-e2e3054429a1`, Social Studies `a84c1eac-8827-433b-9e89-535b96540f53`, and Government `d9dabed8-efa8-46fb-9637-ca4c30caa97d`.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** Social & Citizenship Studies is a defined target label, but its intended scope and Government inclusion are not approved. The B6.6D topic-level mapping architecture forbids collapsing these production rows by name.
- **Production impact:** No merge, rename, UUID change, or question reassignment.
- **Required future action:** Approve target scope and create explicit source-topic-to-production mapping decisions.

### 7. Physical & Health Education

- **Issue:** Whether a current source or production identity supports this target.
- **Existing evidence:** No verified source hierarchy, production subject, or approved mapping was found in the reviewed artifacts.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** The target is explicitly part of the approved 22-subject catalogue, so it can be represented as a catalogue identity. There is no evidence to authorize production mapping or question population.
- **Production impact:** No existing production UUID is referenced or changed.
- **Required future action:** Supply and approve an authoritative JSS1-JSS3 curriculum/product definition.

### 8. Hausa / Igbo / Yoruba Readiness

- **Issue:** Whether the three Nigerian languages can be defined and prepared as catalogue identities.
- **Existing evidence:** Hausa and Igbo have official documents, stable source codes, and limited verified JSS1 rows; their full JSS1-JSS3 hierarchy remains incomplete. Yoruba has an official document but no verified hierarchy and requires specialized language review.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** Each is an explicitly named Nigerian-language catalogue identity. The incomplete source evidence blocks production mapping/readiness, not the definition of the catalogue labels.
- **Production impact:** No production subject UUID exists or is created. No questions are moved or generated.
- **Required future action:** Complete language-aware source review. Preserve product selection rule `Hausa | Igbo | Yoruba -> exactly_one`; storage ownership remains a separate unresolved decision.

### 9. Islamic Studies

- **Issue:** Whether Islamic Studies is a valid catalogue identity distinct from CRS.
- **Existing evidence:** Official Islamic Religious Studies source identity exists with limited verified JSS1 hierarchy; no production Islamic Studies row exists. B6.7 defines CRS and Islamic Studies as applicable alternatives.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** The source identity is distinct from CRS and is sufficient to define a separate catalogue entry. Partial source review and absent production identity block implementation readiness.
- **Production impact:** Do not create a production subject or map to CRS UUID.
- **Required future action:** Complete source/objective review and approve production availability separately.

### 10. French / Arabic Readiness

- **Issue:** Whether optional French and Arabic identities can exist independently.
- **Existing evidence:** French has a distinct official source identity and JSS1-JSS3 hierarchy records with review gaps. Arabic has an official document but no verified hierarchy and requires RTL review. Neither has a production row.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** French and Arabic are explicitly separate optional-language catalogue identities. Source completeness and production readiness are not established, especially for Arabic.
- **Production impact:** No production mapping or subject creation. French is not mapped to an existing subject; Arabic is not inferred from any other language.
- **Required future action:** Complete French objective/source review and Arabic RTL hierarchy review; then approve production mappings separately.

### 11. Six Trade/Vocational Identities

- **Issue:** Whether Solar Photovoltaic Installation & Maintenance, Fashion Design & Garment Making, Livestock Farming, Beauty & Cosmetology, Computer Hardware & GSM Repairs, and Horticulture & Crop Production are ready for production identity treatment.
- **Existing evidence:** The reviewed NERDC source set has no verified identities for most of these trades. Pre-Vocational Studies includes broader Agriculture content, but does not establish Livestock Farming or Horticulture & Crop Production as equivalent production subjects. Basic Technology is not evidence for Computer Hardware & GSM Repairs.
- **Decision:** `DEFERRED — CATALOGUE IDENTITY EXISTS, PRODUCTION MAPPING BLOCKED`
- **Exact rationale:** The six names are fixed members of the approved target catalogue, so they can exist as distinct catalogue records. The repository does not support safe production mapping or source equivalence.
- **Production impact:** Do not map to Agricultural Science or Basic Technology, split existing content, create production subjects, or generate questions.
- **Required future action:** Supply authoritative trade curriculum definitions and decide independent-subject versus vocational-programme scope.

### 12. Religion Applicability Storage Ownership

- **Issue:** Where the rule “CRS and Islamic Studies are applicable alternatives” should be stored.
- **Existing evidence:** B6.7/B6.7.1 define the product rule but explicitly leave storage ownership open. The current profile schema has no religion-selection field, and current exam attempts do not establish a learner applicability policy.
- **Decision:** `UNRESOLVED`
- **Exact rationale:** This is a genuine implementation/product decision: profile, school policy, enrollment, or exam/session context each has different semantics. Existing evidence does not select one safely.
- **Production impact:** None in this stage. Do not add a field or alter attempts/results.
- **Required future action:** Approve ownership semantics before implementing selection storage. The catalogue rule itself remains `applicable_option`.

## Implementation Readiness

### Catalogue-layer ready

The following identities may safely exist as catalogue records, independent of production mapping:

- All 22 explicitly approved target labels, using the exact keys and categories in B6.7.2.
- English Studies, Mathematics, Christian Religious Studies, Business Studies.
- Intermediate Science, Digital Technologies, Nigerian History, Social & Citizenship Studies, Physical & Health Education, Cultural & Creative Arts.
- Hausa, Igbo, Yoruba, Islamic Studies, French, Arabic Language.
- Solar Photovoltaic Installation & Maintenance, Fashion Design & Garment Making, Livestock Farming, Beauty & Cosmetology, Computer Hardware & GSM Repairs, Horticulture & Crop Production.

Catalogue records for deferred identities must carry non-ready/unmapped status and must not become production exam targets.

### Production-mapping ready

Only these relationships are approved for an existing production UUID:

- Mathematics -> `91f37d59-3401-47c5-ae18-46ead707c570`.
- Business Studies -> `5b894bfe-6f29-41a6-907c-26a4c2f11fff`.
- English Studies -> English `a0e64f96-d382-4cee-9f84-b1e6b5e075c6`, subject to the approved display alias.
- Christian Religious Studies -> CRS `5e4ff239-fd12-4765-b035-70ea77ecee6c`, subject to the approved display alias.

The last two are compatibility-preserving aliases; they do not authorize renaming production rows.

### Production-mapping blocked

Production mapping is blocked for:

- Intermediate Science.
- Physical & Health Education.
- Digital Technologies.
- Nigerian History.
- Social & Citizenship Studies.
- Cultural & Creative Arts.
- Hausa, Igbo, Yoruba.
- Islamic Studies.
- French and Arabic Language.
- All six trade/vocational identities.

No existing production subject is created or repurposed for these entries.

### Still genuinely unresolved

- Religion applicability storage ownership.

This unresolved item concerns future selection storage, not the definition of the catalogue identity. It does not block defining the 22 catalogue records, but it must block implementation of religion selection persistence until decided.

## Final Gate

`PASS — CATALOGUE LAYER READY FOR B6.7.3`

The catalogue identities can be defined without guessing, while unresolved production mappings remain explicitly deferred and non-examable. Only the religion applicability storage ownership remains genuinely unresolved, and that is not required to define the catalogue layer. B6.7.3 may implement the catalogue layer only under the protections and statuses specified above; it must not implement selection storage or production mappings that remain blocked.

No database, schema, production data, seed, migration, question, topic, exam, result, RLS/RPC, or application code was modified.

`B6.7.2.1 COMPLETE — DECISION RESOLUTION AND IMPLEMENTATION READINESS`
