# Stage B6.4 Curriculum Normalization Report

## Baseline

B6.3.4 supplied 41 verified themes, 55 verified sub-themes, 134 verified topics, and 42 verified objective sets. It also retained 92 review-required objective sets.

## Normalized result

The hierarchy remains source-text preserving and now has stable deterministic IDs for every class, subject, theme, sub-theme, topic, and objective set. IDs are SHA-256-derived from canonical hierarchy identifiers/source text; they are additive and do not alter existing consumers or curriculum wording.

- Themes: 41
- Sub-themes: 55
- Topics: 134
- Verified objective sets: 42
- Review-required objective sets: 92
- Term state: all records explicitly `unassigned`

## Data quality

- Duplicate check: PASS (385 unique hierarchy IDs; no duplicate curriculum records).
- Orphan check: PASS (all topics/objective sets are nested under a canonical subject/class/theme/sub-theme path).
- Provenance check: PASS (every verified topic retains document, URL, and source pages).
- Hierarchy/status check: PASS (`verified` and `review_required` objective states are retained).
- Mathematics preservation: PASS (exactly 50 topics, with hierarchy and provenance intact).

## Safety

- Supabase writes: 0
- Questions generated: 0
- Legacy bank modifications: 0
- Production curriculum modifications: 0
- Term assignments: 0

## Remaining known limitations

Arabic still requires specialized RTL source-language review. Yoruba still requires diacritic-preserving source-language transcription. The 92 review-required objective sets remain intentionally unverified; no extraction work was reopened in this stage.

## Validation

- Curriculum validator: PASS
- Data normalization/idempotence check: PASS
- Lint: PASS with the existing `<img>` warning
- Build: PASS
- Git diff: PASS (whitespace check clean)
