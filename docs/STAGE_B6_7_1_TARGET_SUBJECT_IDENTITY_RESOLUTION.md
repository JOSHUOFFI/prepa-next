# B6.7.1 Target Subject Identity Resolution

Date: 2026-09-18  
Project: `yvlgahcyapibgecklfuq`  
Scope: read-only curriculum/evidence audit

## 1. Executive Summary

**VERIFIED FACT:** B6.6D.1 and B6.6D.2 establish that source curriculum identity must remain separate from production subject identity. Existing production UUIDs, questions, topics, attempts, results, RLS, and exam behavior must not be changed to make target names fit.

**VERIFIED FACT:** The current production catalogue has 18 active subjects. The live question bank has 1,750 active questions, zero topics, and zero questions for Accounting, Agricultural Science, Basic Science, Basic Technology, Business Studies, Civic Education, History, and Social Studies. No target identity decision may be inferred from question count.

**EVIDENCE-BASED RECOMMENDATION:** Keep the unresolved target identities in a future catalogue layer with nullable production mappings. Do not rename or create production subjects in B6.7.1.

**REQUIRES DECISION:** The evidence does not safely establish equivalence for Intermediate Science, Digital Technologies, Nigerian History, Social & Citizenship Studies, Physical & Health Education, Arabic Language, Yoruba, or the six trade subjects. The final gate is therefore blocked.

## 2. Evidence Sources Reviewed

- [B6.6D.1 Subject Mapping Audit](STAGE_B6_6D_1_SUBJECT_MAPPING_AUDIT.md): production UUIDs, source identities, mappings, and dependency safety.
- [B6.6D.2 Mapping Architecture](STAGE_B6_6D_2_MAPPING_ARCHITECTURE.md): source identity versus production identity and consolidated-subject rules.
- [B6.6D.3 Final Schema Design](STAGE_B6_6D_3_FINAL_SCHEMA_DESIGN.md): source-native hierarchy recommendation.
- [B6.6D.4 Implementation Specification](STAGE_B6_6D_4_IMPLEMENTATION_MIGRATION_SPEC.md): additive implementation boundary.
- [B6.6D.5 Availability Audit](STAGE_B6_6D_5_SUBJECT_AVAILABILITY_CLASS_TERM_AUDIT.md): current production question counts and subject-only exam behavior.
- `data/curriculum/jss1-3.json`: source manifest and verified hierarchy, still `proposed-incomplete` and `readyForImport: false`.
- `supabase/seed.sql` and `supabase/migrations/20260823000000_initial_schema.sql`: production subject fields and seed identities.
- `lib/constants.ts`, exam routes, admin routes, and question repository: supporting application assumptions only.

## 3. Subject Identity Resolution Matrix

Recommendations use exactly one of: `MAP_EXISTING`, `NEW_CATALOGUE_IDENTITY`, `SEPARATE_FROM_EXISTING`, or `UNRESOLVED`.

| Target | Source/document identity | Production candidate / UUID | Questions | Compatibility and scope | Primary recommendation | Confidence |
| --- | --- | --- | ---: | --- | --- | --- |
| Intermediate Science | NERDC source has **Basic Science and Technology**, code `BASIC_SCIENCE_TECHNOLOGY`; B6.6D.1 records it as consolidated | Basic Science, `7c901feb-d013-4c90-9585-6c0fe317b472` | 0 | Target name/scope is not established as equivalent to Basic Science or the consolidated source | `UNRESOLVED` | Low |
| Digital Technologies | NERDC source has **Basic Science and Technology** and source/production Basic Technology; no Digital Technologies identity | Basic Technology, `46aa307a-5002-48dd-b4ba-7798a2f5e258` | 0 | Basic Technology may be materially broader/different from Digital Technologies; no approved equivalence | `UNRESOLVED` | Low |
| Nigerian History | Official source document `jss1-3_history.pdf`, source code `HISTORY`; production History `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412` | History, `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412` | 0 | Existing source identity supports History, but repository evidence does not prove that “Nigerian” is only a display label or a narrower scope | `UNRESOLVED` | Medium |
| Social & Citizenship Studies | NVC source identity, code `NVC`, maps in B6.6D.1 to Civic Education, Social Studies, and Government | Civic Education, `f0d8904d-842b-478c-b3ba-e2e3054429a1`; Social Studies, `a84c1eac-8827-433b-9e89-535b96540f53`; Government, `d9dabed8-efa8-46fb-9637-ca4c30caa97d` | 0 | Target may consolidate two or three production domains; source-to-topic mapping is required and Government inclusion is undecided | `UNRESOLVED` | Low |
| Physical & Health Education | No verified source document or hierarchy identity in the current NERDC manifest/reports | None | 0 | No evidence supports a safe existing candidate or exact target scope | `UNRESOLVED` | Low |
| Cultural & Creative Arts | Official `jss1-3_cca.pdf`, source code `CCA`; 3 partially verified JSS1 topics | None | 0 | Source identity is valid, but B6.6D.1 documents no production target and extraction remains partial | `NEW_CATALOGUE_IDENTITY` | Medium |
| Hausa | Official `jss1-3_hausa.pdf`, source code `HAUSA`; 3 verified JSS1 rows, continuation review open | None | 0 | Valid language identity is evidenced, but not complete JSS1-JSS3 hierarchy; one-language rule remains catalogue policy | `UNRESOLVED` | Medium-low |
| Igbo | Official `jss1-3_igbo.pdf`, source code `IGBO`; 4 verified JSS1 rows, continuation review open | None | 0 | Valid language identity is evidenced, but not complete JSS1-JSS3 hierarchy; no production target exists | `UNRESOLVED` | Medium-low |
| Yoruba | Official `jss1-3_yoruba.pdf`, source code is listed in the manifest, but no verified hierarchy; specialized language review required | None | 0 | Insufficient source hierarchy and no production candidate | `UNRESOLVED` | Low |
| Islamic Studies | Official `jss1-3_islamic.pdf`, source identity `ISLAMIC_RELIGIOUS_STUDIES`; 1 partial JSS1 topic | None | 0 | Source identity exists, but partial evidence and no production row; target label normalization remains open | `NEW_CATALOGUE_IDENTITY` | Medium-low |
| Arabic Language | Official `jss1-3_arabic.pdf`, source listed; no verified hierarchy; RTL review required | None | 0 | Optional-language identity is plausible but not established sufficiently for implementation | `UNRESOLVED` | Low |
| French | Official `jss1-3_french.pdf`, source code `FRENCH`; verified hierarchy spans JSS1-JSS3 in the manifest, objectives/review gaps remain | None | 0 | Source language identity is distinct and no existing production candidate exists; import readiness is still false | `NEW_CATALOGUE_IDENTITY` | Medium |
| Solar Photovoltaic Installation & Maintenance | No corresponding source document, verified hierarchy, or production subject in the repository | None | 0 | Distinct trade identity is not evidenced by the current source set | `UNRESOLVED` | Low |
| Fashion Design & Garment Making | No corresponding source document, verified hierarchy, or production subject in the repository | None | 0 | Distinct trade identity is not evidenced by the current source set | `UNRESOLVED` | Low |
| Livestock Farming | Pre-Vocational Studies source includes Agriculture, but no source identity specifically named Livestock Farming; production Agricultural Science exists | Agricultural Science, `ab79e100-9e4c-4a9e-b952-19df15b2443c` | 0 | Livestock is narrower than Agricultural Science; B6.6D.1 requires topic-level mapping, not subject-name inference | `UNRESOLVED` | Low |
| Beauty & Cosmetology | No corresponding source document, verified hierarchy, or production subject in the repository | None | 0 | Distinct trade identity is not evidenced by the current source set | `UNRESOLVED` | Low |
| Computer Hardware & GSM Repairs | No corresponding source document, verified hierarchy, or production subject in the repository | Basic Technology is related but not equivalent, `46aa307a-5002-48dd-b4ba-7798a2f5e258` | 0 | Hardware/GSM repair is narrower and materially different from generic Basic Technology without a reviewed curriculum mapping | `UNRESOLVED` | Low |
| Horticulture & Crop Production | Pre-Vocational Studies source includes Agriculture; no specific target identity is established | Agricultural Science, `ab79e100-9e4c-4a9e-b952-19df15b2443c` | 0 | Target is narrower than Agricultural Science; no safe rename or mapping follows from the name | `UNRESOLVED` | Low |

## 4. Existing Production Identity Compatibility

**VERIFIED FACT:** `subjects.id` is a UUID primary key with unique name/slug. `questions.subject_id`, `topics.subject_id`, and `exam_attempts.subject_id` reference it with restrictive deletion. Existing questions, attempts, answer records, and result snapshots therefore make arbitrary production subject remapping unsafe.

**VERIFIED FACT:** The current live bank has no `topics` rows and all questions have null `topic_id`, but `subject_id` remains the direct question ownership key. Zero questions for a candidate do not make its UUID disposable.

**EVIDENCE-BASED RECOMMENDATION:** Preserve all current production UUIDs. The only defensible current mappings among this target set are identity-preserving catalogue links for source identities that have an approved product decision; none of the ambiguous target labels currently has enough evidence for an automatic production rename.

## 5. Subject-by-Subject Findings

### Academic / Core

**Intermediate Science**

**VERIFIED FACT:** The source evidence is for Basic Science and Technology, not Intermediate Science. B6.6D.1 explicitly treats the source as consolidated across Basic Science and Basic Technology.  
**EVIDENCE-BASED RECOMMENDATION:** Keep Intermediate Science as an unresolved catalogue label; do not rename Basic Science.  
**REQUIRES DECISION:** Confirm whether this is a new pedagogical identity, an alias for Basic Science, or a broader replacement for the consolidated source.

**Digital Technologies**

**VERIFIED FACT:** The repository has Basic Technology as a production subject and as one target of the consolidated source mapping.  
**EVIDENCE-BASED RECOMMENDATION:** Keep Digital Technologies separate in the catalogue until its scope is approved.  
**REQUIRES DECISION:** Decide whether it is a product relabeling of Basic Technology or a distinct digital-computing curriculum.

**Nigerian History**

**VERIFIED FACT:** History is an official source identity and existing production subject; B6.6D.1 documents exact History mapping.  
**EVIDENCE-BASED RECOMMENDATION:** Preserve History UUID and do not relabel it automatically.  
**REQUIRES DECISION:** Establish whether “Nigerian” is a display label or a narrower curriculum scope.

**Social & Citizenship Studies**

**VERIFIED FACT:** NVC source material maps to Civic Education, Social Studies, and Government in the prior audit.  
**EVIDENCE-BASED RECOMMENDATION:** Keep the target as a separate unresolved catalogue identity backed by topic-level source mapping, not by merging production rows.  
**REQUIRES DECISION:** Determine whether Government is included and how existing Civic/Social/Government content would be treated.

**Physical & Health Education**

**VERIFIED FACT:** No corresponding verified source identity or production row appears in the reviewed repository artifacts.  
**EVIDENCE-BASED RECOMMENDATION:** Treat as unresolved, not as an automatic new production subject.  
**REQUIRES DECISION:** Provide an authoritative JSS1-JSS3 curriculum/source definition and approve the product identity.

**Cultural & Creative Arts**

**VERIFIED FACT:** CCA has an official source document and source code `CCA`; B6.6D.1 records 3 themes/subthemes/topics in the verified representation and no production target.  
**EVIDENCE-BASED RECOMMENDATION:** Establish a distinct future catalogue identity, separate from all existing production subjects.  
**REQUIRES DECISION:** Complete source review and later approve a production/question-bank strategy.

### Languages / Religion

**Hausa and Igbo**

**VERIFIED FACT:** Both have official source documents, stable source codes, and limited verified JSS1 hierarchy rows; both remain incomplete for JSS1-JSS3.  
**EVIDENCE-BASED RECOMMENDATION:** Treat each as a distinct future catalogue identity, but keep production mapping unresolved until hierarchy review is complete.  
**REQUIRES DECISION:** Complete source-language review and preserve the rule that a learner selects one Nigerian language, not all three.

**Yoruba**

**VERIFIED FACT:** Yoruba has an official source document but no verified hierarchy; specialized diacritic/language review is required.  
**EVIDENCE-BASED RECOMMENDATION:** Keep Yoruba as a distinct unresolved catalogue identity, with no production mapping.  
**REQUIRES DECISION:** Complete Yoruba-literate source review before implementation.

**Islamic Studies**

**VERIFIED FACT:** Islamic Religious Studies is an official source identity with limited verified JSS1 hierarchy and no production subject.  
**EVIDENCE-BASED RECOMMENDATION:** Treat Islamic Studies as a distinct future catalogue identity, separate from CRS, with no production mapping yet. Preserve the rule that CRS and Islamic Studies are applicable alternatives.  
**REQUIRES DECISION:** Approve product naming and religious-option applicability storage.

**Arabic Language**

**VERIFIED FACT:** Arabic has an official source document but no verified hierarchy and requires specialized RTL review.  
**EVIDENCE-BASED RECOMMENDATION:** Keep Arabic Language separate from French and unresolved; do not create a production subject.  
**REQUIRES DECISION:** Complete RTL source review and approve optional-language treatment.

**French**

**VERIFIED FACT:** French has a distinct official source identity and verified hierarchy records spanning JSS1-JSS3, while objectives and extraction review remain incomplete. No production French row exists.  
**EVIDENCE-BASED RECOMMENDATION:** Establish French as a distinct future optional-language catalogue identity, not a mapping to an existing production subject.  
**REQUIRES DECISION:** Complete source/objective review and later approve production availability.

### Trade / Vocational

**All six trade subjects**

**VERIFIED FACT:** The reviewed NERDC source set and manifest do not contain verified source identities for Solar Photovoltaic Installation & Maintenance, Fashion Design & Garment Making, Beauty & Cosmetology, or Computer Hardware & GSM Repairs. Pre-Vocational Studies is the relevant source identity for agriculture-related content, but it is broader than Livestock Farming or Horticulture & Crop Production.

**EVIDENCE-BASED RECOMMENDATION:** Keep all six as unresolved future catalogue identities. Do not map Livestock Farming or Horticulture & Crop Production to Agricultural Science, and do not map Computer Hardware & GSM Repairs to Basic Technology by name alone.

**REQUIRES DECISION:** Supply authoritative trade curriculum documents and decide whether these are independent subjects, components of a vocational umbrella, or future partitions.

## 6. Recommended Catalogue Identity Treatment

The following treatment is recommended for a future catalogue layer, not production rows:

- **Distinct future catalogue identities, source identity established but production mapping pending:** Cultural & Creative Arts, Hausa, Igbo, Yoruba, Islamic Studies, French, Arabic Language.
- **Distinct target labels retained but unresolved because scope/equivalence is open:** Intermediate Science, Digital Technologies, Nigerian History, Social & Citizenship Studies, Physical & Health Education, all six trade subjects.
- **No automatic production mapping:** all 18 targets reviewed here unless a later explicit product decision approves a UUID-preserving alias.

This is intentionally stricter than name normalization. The target catalogue may describe a desired product identity before a production subject exists, but that does not authorize question or subject creation.

## 7. UUID Preservation Implications

**VERIFIED FACT:** Existing production UUIDs must remain unchanged. In particular, preserve Basic Science, Basic Technology, History, Civic Education, Social Studies, Government, Agricultural Science, CRS, and all other current subject UUIDs even when a future catalogue label is approved.

**EVIDENCE-BASED RECOMMENDATION:** If a later decision approves an alias such as History -> Nigerian History or CRS -> Christian Religious Studies, implement it as a catalogue/display alias first. Keep the production name/UUID compatibility path until all name-based imports, admin tools, exports, and reports are updated safely.

## 8. Question-Bank Implications

**VERIFIED FACT:** Current question counts for the reviewed targets are zero. Existing production questions outside these targets remain attached to their UUIDs; no question should be moved to satisfy a target label.

**EVIDENCE-BASED RECOMMENDATION:** Build future question banks against approved catalogue identities and explicit production mappings. Do not count a broader subject’s questions as capacity for a narrower target without a reviewed content classification.

The eventual one-language and religious-option rules do not authorize question or production-row changes in this stage.

## 9. Remaining Product/Curriculum Decisions

- Approve or reject Basic Science -> Intermediate Science.
- Approve or reject Basic Technology -> Digital Technologies.
- Decide whether History is displayed as Nigerian History or remains generic History.
- Define Social & Citizenship Studies scope and Government inclusion.
- Provide a verified Physical & Health Education curriculum identity.
- Complete CCA, Hausa, Igbo, Yoruba, Islamic, Arabic, and French source/objective review as required.
- Provide authoritative source documents for the six trades.
- Decide whether trade targets are independent subjects or components of a vocational programme.
- Decide where Nigerian-language and religious applicability belongs; do not implement storage here.

## 10. Recommended Next Implementation Stage

The next stage should be a decision-record stage, not a production migration:

1. Approve the unresolved equivalence/scope decisions above.
2. Create a read-only signed identity register mapping catalogue keys to source identities and, only where approved, existing production UUIDs.
3. Validate legacy-name aliases and application lookup compatibility.
4. Re-audit question capacity after identity decisions.
5. Only then design a separately approved catalogue configuration implementation.

No production subject, question, topic, exam, attempt, result, seed, migration, RLS policy, or application code should change before those decisions are recorded.

## 11. Final Gate

**BLOCKED — REQUIRES CURRICULUM/PRODUCT DECISION**

Genuine blockers remain: the renamed academic identities, Social & Citizenship Studies scope, Physical & Health Education, Arabic/Yoruba completeness, and all six trade identities lack sufficient approved evidence for safe production mapping or creation. The evidence is sufficient to preserve existing UUIDs and to define distinct future catalogue identities where source identity is established, but not sufficient to authorize catalogue implementation.

No database, production data, seed, migration, or application code was modified.

`B6.7.1 COMPLETE — TARGET SUBJECT IDENTITY RESOLUTION`
