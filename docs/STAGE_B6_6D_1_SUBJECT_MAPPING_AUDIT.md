# B6.6D.1 Subject Mapping Audit

Date: 2026-09-16
Project: `yvlgahcyapibgecklfuq`

## Scope and Safety

This was a read-only source and production mapping audit. No subjects, curriculum records, topics, questions, exams, results, users, or profiles were created or modified. No importer was created. No mutation SQL, `db push`, or `db reset` was run.

Source of truth: `data/curriculum/jss1-3.json`.

## Source-Side Inventory

The verified hierarchy contains 13 distinct represented subjects, 41 themes, 55 sub-themes, 134 topics, and 134 objective-set IDs. Objective-set counts below count the stable `objectiveSetId` attached to each source topic, including sets whose status is `review_required`.

| Source Subject | Source Code | Classes | Themes | Subthemes | Topics | Objective Sets | Source / Provenance Identity | Existing Production Target(s) | Production ID(s) | Mapping Status | Evidence |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | --- | --- | --- |
| Mathematics | `MATHEMATICS` | JSS1, JSS2, JSS3 | 14 | 16 | 50 | 50 | `jss1-3_maths.pdf`; official NERDC URL in manifest | Mathematics | `91f37d59-3401-47c5-ae18-46ead707c570` | `SAFE_1_TO_1` | Exact production name; B6.1 documents exact mapping. |
| Basic Science and Technology | `BASIC_SCIENCE_TECHNOLOGY` | JSS1 | 1 | 1 | 3 | 3 | `jss1-3_basic_science_technology.pdf`; official NERDC URL in manifest | Basic Science; Basic Technology | `7c901feb-d013-4c90-9585-6c0fe317b472`; `46aa307a-5002-48dd-b4ba-7798a2f5e258` | `DOCUMENTED_REVIEW_REQUIRED` | B6.1 calls this consolidated and says production mapping is required. |
| Business Studies | `BUSINESS_STUDIES` | JSS1 | 2 | 2 | 3 | 3 | `jss1-3_business_studies.pdf`; official NERDC URL in manifest | Business Studies | `5b894bfe-6f29-41a6-907c-26a4c2f11fff` | `SAFE_1_TO_1` | Exact production name; B6.1 records exact name exists. |
| Christian Religious Studies | `CRS` | JSS1 | 1 | 1 | 2 | 2 | `jss1-3_crs.pdf`; official NERDC URL in manifest | CRS | `5e4ff239-fd12-4765-b035-70ea77ecee6c` | `SAFE_1_TO_1` | B6.1 explicitly documents normalization to CRS. |
| Cultural and Creative Arts | `CCA` | JSS1 | 1 | 2 | 3 | 3 | `jss1-3_cca.pdf`; official NERDC URL in manifest | None | None | `NO_PRODUCTION_TARGET` | B6.1 says no automatic production mapping. |
| English Studies | `ENGLISH_STUDIES` | JSS1 | 1 | 1 | 3 | 3 | `jss1-3_english_studies.pdf`; official NERDC URL in manifest | English | `a0e64f96-d382-4cee-9f84-b1e6b5e075c6` | `DOCUMENTED_REVIEW_REQUIRED` | B6.1 calls this normalized and says product naming review is required. |
| French | `FRENCH` | JSS1, JSS2, JSS3 | 9 | 18 | 32 | 32 | `jss1-3_french.pdf`; official NERDC URL in manifest | None | None | `NO_PRODUCTION_TARGET` | B6.1 says no automatic production mapping. |
| Hausa | `HAUSA` | JSS1 | 1 | 1 | 3 | 3 | `jss1-3_hausa.pdf`; official NERDC URL in manifest | None | None | `NO_PRODUCTION_TARGET` | B6.1 says no automatic production mapping. |
| History | `HISTORY` | JSS1 | 1 | 1 | 3 | 3 | `jss1-3_history.pdf`; official NERDC URL in manifest | History | `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412` | `SAFE_1_TO_1` | Exact production name; B6.1 documents exact mapping. |
| Igbo | `IGBO` | JSS1 | 2 | 2 | 4 | 4 | `jss1-3_igbo.pdf`; official NERDC URL in manifest | None | None | `NO_PRODUCTION_TARGET` | B6.1 says no automatic production mapping. |
| Islamic Religious Studies | `ISLAMIC_RELIGIOUS_STUDIES` | JSS1 | 1 | 1 | 1 | 1 | `jss1-3_islamic.pdf`; official NERDC URL in manifest | None | None | `NO_PRODUCTION_TARGET` | B6.1 says no automatic production mapping. |
| National Values Curriculum | `NVC` | JSS1 | 4 | 6 | 14 | 14 | `jss1-3_nvc.pdf`; official NERDC URL in manifest | Civic Education; Social Studies; Government | `f0d8904d-842b-478c-b3ba-e2e3054429a1`; `a84c1eac-8827-433b-9e89-535b96540f53`; `d9dabed8-efa8-46fb-9637-ca4c30caa97d` | `DOCUMENTED_REVIEW_REQUIRED` | B6.1 calls this consolidated and says production mapping is required. |
| Pre-Vocational Studies | `PREVOC` | JSS1, JSS2 | 3 | 3 | 13 | 13 | `jss1-3_prevoc.pdf`; official NERDC URL in manifest | Agricultural Science; Basic Technology; Business Studies | `ab79e100-9e4c-4a9e-b952-19df15b2443c`; `46aa307a-5002-48dd-b4ba-7798a2f5e258`; `5b894bfe-6f29-41a6-907c-26a4c2f11fff` | `DOCUMENTED_REVIEW_REQUIRED` | B6.1 calls this consolidated and says production mapping is required. |
| Arabic | No represented verified hierarchy | None | 0 | 0 | 0 | 0 | `jss1-3_arabic.pdf`; official NERDC URL in manifest | None | None | `NO_VERIFIED_SOURCE_HIERARCHY` | Manifest subject entry has no verified hierarchy records; B6.3.4 requires specialized RTL review. |
| Yoruba | No represented verified hierarchy | None | 0 | 0 | 0 | 0 | `jss1-3_yoruba.pdf`; official NERDC URL in manifest | None | None | `NO_VERIFIED_SOURCE_HIERARCHY` | Manifest subject entry has no verified hierarchy records; B6.3.4 requires specialized Yoruba review. |

## Production Subject Inventory

The live `public.subjects` table contains 18 records. Its available fields are `id`, `name`, `slug`, `category`, `is_active`, `created_at`, and `updated_at`. There is no subject-code/key field and no class/level relationship on `subjects` itself.

| Name | ID | Slug | Category | Active |
| --- | --- | --- | --- | --- |
| Accounting | `1696fc62-d7e6-4547-a01f-f140644ef1b8` | `accounting` | Commercial | true |
| Agricultural Science | `ab79e100-9e4c-4a9e-b952-19df15b2443c` | `agricultural-science` | Science | true |
| Basic Science | `7c901feb-d013-4c90-9585-6c0fe317b472` | `basic-science` | Junior Secondary | true |
| Basic Technology | `46aa307a-5002-48dd-b4ba-7798a2f5e258` | `basic-technology` | Junior Secondary | true |
| Biology | `bb3d3ab5-ba77-47f5-967d-0b850e406480` | `biology` | Science | true |
| Business Studies | `5b894bfe-6f29-41a6-907c-26a4c2f11fff` | `business-studies` | Junior Secondary | true |
| Chemistry | `46a1093b-2ac5-4e2b-835b-f009a72cb359` | `chemistry` | Science | true |
| Civic Education | `f0d8904d-842b-478c-b3ba-e2e3054429a1` | `civic-education` | Core Subjects | true |
| Commerce | `d319d302-334b-4eb4-b403-b46f7a794a09` | `commerce` | Commercial | true |
| CRS | `5e4ff239-fd12-4765-b035-70ea77ecee6c` | `crs` | Arts and Humanities | true |
| Economics | `a55ad82b-4630-491b-ae8d-76613c147d27` | `economics` | Commercial | true |
| English | `a0e64f96-d382-4cee-9f84-b1e6b5e075c6` | `english` | Core Subjects | true |
| Government | `d9dabed8-efa8-46fb-9637-ca4c30caa97d` | `government` | Arts and Humanities | true |
| History | `41fcf4c5-0a9b-4486-8de6-b98fe1c2c412` | `history` | Arts and Humanities | true |
| Literature | `91f5f142-acbf-42bb-b85e-c58ef9d15d54` | `literature` | Arts and Humanities | true |
| Mathematics | `91f37d59-3401-47c5-ae18-46ead707c570` | `mathematics` | Core Subjects | true |
| Physics | `1812a3d8-cfb8-4564-ae3b-5611c8c2357c` | `physics` | Science | true |
| Social Studies | `a84c1eac-8827-433b-9e89-535b96540f53` | `social-studies` | Junior Secondary | true |

## Existing Application and Data Relationships

Repository references consistently use the relational `subject_id` and load subject metadata from `public.subjects`, including:

- Admin curriculum, question, import, and reference routes.
- Exam attempt creation and result lookup routes.
- Dashboard and exam subject selectors.
- Question editor, question bank, curriculum manager, and result components.
- Question import and question repository services, which resolve subject IDs by production subject name.

Live foreign keys confirm:

- `topics.subject_id -> subjects.id`.
- `questions.subject_id -> subjects.id`.
- `questions.topic_id -> topics.id`.
- `exam_attempts.subject_id -> subjects.id`.

The existing question bank currently has 1,750 questions across 10 distinct production subject IDs. Existing exam attempts reference 2 distinct subject IDs. Because the import must not alter existing topics or question relationships, these dependencies make arbitrary subject remapping unsafe.

## Documented Mapping Decisions

The audit searched existing repository documentation only. The documented decisions are:

- Mathematics: exact production mapping.
- History: exact production mapping.
- Christian Religious Studies: normalized to `CRS`.
- English Studies: normalized to `English`; product naming review is required.
- Basic Science and Technology: consolidated; production mapping required; legacy mappings listed as `Basic Science` and `Basic Technology`.
- National Values Curriculum: consolidated; production mapping required; legacy mappings listed as `Civic Education`, `Social Studies`, and `Government`.
- Pre-Vocational Studies: consolidated; production mapping required; legacy mappings listed as `Agricultural Science`, `Basic Technology`, and `Business Studies`.
- Arabic, Cultural and Creative Arts, French, Hausa, Igbo, Islamic Religious Studies, and Yoruba: no automatic production mapping documented.
- Arabic and Yoruba additionally remain specialized language-review items with no verified hierarchy records in the current source manifest.

These statements are recorded as documentation evidence only. Unresolved or review-required mappings were not converted into automatic mappings.

## Decision

The next step cannot safely be a curriculum import yet. Explicit mapping decisions are still required for consolidated subjects, normalized naming where product review remains open, and subjects with no production target. No production writes occurred during this audit.

`B6.6D.1 COMPLETE — SUBJECT MAPPING AUDIT`