# Stage B.6 Question Generation Plan

## Status

No questions are generated in Stage B.6. This document is a planning baseline only.

Question generation is blocked per scope until the curriculum topic and term allocation record is approved. The existing SAFE requirement remains 40 valid questions per exam scope.

## Legacy mapping audit

The existing dry-run validator reported:

- Total legacy records: 1,752
- Structurally valid: 1,749
- Rejected: 3
- Duplicate legacy IDs: 0
- Duplicate question text: 33
- Subjects represented: 10

Legacy records contain subject information but no defensible class, term or topic metadata.

| Mapping category                            | Count | Decision                                              |
| ------------------------------------------- | ----: | ----------------------------------------------------- |
| Definitely mappable to JSS class/term/topic |     0 | Do not auto-map                                       |
| Probably mappable                           |     0 | Requires human evidence and review                    |
| Ambiguous                                   | 1,749 | Keep untouched; subject-only evidence is insufficient |
| Not mappable                                |     3 | Validator rejected the records                        |

The 33 duplicate-text findings are quality-review signals, not automatic deletion instructions.

## Scope planning baseline

All 135 JSS1-JSS3 subject-term scopes currently have no verified topic records. Therefore no honest per-topic generation target can yet be calculated.

| Class | Term        | Subjects | Existing scoped | Mapped legacy | Additional required for 40 | Recommended target |
| ----- | ----------- | -------: | --------------: | ------------: | -------------------------: | -----------------: |
| JSS1  | First Term  |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS1  | Second Term |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS1  | Third Term  |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS2  | First Term  |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS2  | Second Term |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS2  | Third Term  |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS3  | First Term  |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS3  | Second Term |       15 |               0 |             0 |             Pending topics |     Pending topics |
| JSS3  | Third Term  |       15 |               0 |             0 |             Pending topics |     Pending topics |

`Pending topics` is intentional. A numeric target would imply curriculum coverage that has not been established.

## Planning model after approval

For each approved topic:

- High question potential: recommend 20-30 original questions.
- Medium question potential: recommend 10-20 original questions.
- Low question potential: recommend 5-10 original questions.
- Subject scope target: minimum 40 valid questions, healthy 80, strong 120+ where the curriculum supports that volume.

Generation must be batched as:

```text
subject -> class -> term -> topic -> batch -> structural validation -> academic review -> import preview -> controlled import
```

Every generated question must be original, BECE-level appropriate, unambiguous, have exactly one defensible correct option, plausible distractors, and an educational explanation. No generated item may be represented as a genuine WAEC past question.

## Import gate

No question batch should be imported until:

1. its topic exists in the approved curriculum manifest;
2. class, term, subject and topic IDs resolve together;
3. structural validation passes;
4. duplicate checks pass;
5. answer and explanation review passes;
6. preview is reviewed by an administrator.
