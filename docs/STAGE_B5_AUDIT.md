# Stage B.5 Source and Data Audit

## Scope

This audit covers the current linked Supabase data, the repository question bank, and the official NERDC JSS1-3 curriculum source. No curriculum rows or generated questions were written.

## Authority

Primary source: [NERDC JSS 1-3 Basic Education Curriculum](https://www.nerdc.gov.ng/content_manager/jss1-3.html).

The NERDC page provides subject curriculum documents under `content_manager/jss/`. The documents are organized by class, theme, sub-theme, topic, objectives and content. They do not provide a universal First Term/Second Term/Third Term allocation in the retrieved documents. The dataset therefore records term allocation as an implementation layer requiring educator review.

## Current database audit

The fresh read-only audit found:

- JSS1, JSS2 and JSS3 exist.
- First Term, Second Term and Third Term exist.
- 18 active subject rows exist.
- 0 active topic rows exist.
- 0 active questions have both `class_id` and `term_id` populated.
- Existing question data is in global subject pools.
- Existing global pools with at least 40 valid questions: Biology, Chemistry, CRS, English, Literature, Mathematics and Physics.
- Economics and Government have fewer than 40 valid questions.
- The remaining active subjects have no valid question pool.

## Legacy bank dry-run

The existing migration validator was run with `--dry-run`; it performed no database writes:

- Source records: 1,752
- Structurally valid records: 1,749
- Malformed or rejected: 3
- Duplicate legacy IDs: 0
- Duplicate question text: 33
- Options represented: 6,996
- Subjects represented: Mathematics, English, Chemistry, Physics, Biology, CRS, Government, Literature, Economics and Commerce

The validator identified two missing Mathematics records and one English record whose answer did not resolve unambiguously. The legacy records contain subject-level information but no defensible JSS class, term or topic metadata. They remain untouched and are not mapped into JSS scopes.

## Dataset deliverable

`data/curriculum/jss1-3.json` is a source-audit manifest. It contains:

- JSS1-JSS3 and all three terms as explicit dimensions.
- NERDC-backed subject names and document URLs.
- Conservative mappings from existing legacy subject names.
- Verified Mathematics themes extracted from the official document.
- Empty topic arrays where topic extraction and educator-reviewed term allocation are still pending.

It is intentionally not an import-ready curriculum claim and does not mark any scope exam-ready.

## Population decision

No questions were generated, no legacy questions were duplicated, no curriculum data was imported, and no production database changes were made. This is deliberate: term assignments and subject consolidation need review before creating academic records, and generated questions must not be published without a content-quality review path.
