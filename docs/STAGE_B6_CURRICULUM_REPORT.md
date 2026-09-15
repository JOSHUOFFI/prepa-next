# Stage B.6 Curriculum Report

## Status

**Proposed but incomplete. Not ready for database import.**

This report deliberately separates source-backed curriculum structure from PrePa implementation decisions. The NERDC documents identified below do not provide a universal First Term, Second Term and Third Term allocation. Any term assignment must therefore be educator-reviewed and labelled `implementation`.

## Sources

Primary index: [NERDC JSS 1-3 Basic Education Curriculum](https://www.nerdc.gov.ng/content_manager/jss1-3.html).

Official documents identified:

- [Arabic](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_arabic.pdf)
- [Basic Science and Technology](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_basic_science_technology.pdf)
- [Business Studies](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_business_studies.pdf)
- [Christian Religious Studies](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_crs.pdf)
- [Cultural and Creative Arts](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_cca.pdf)
- [English Studies](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_english_studies.pdf)
- [French](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_french.pdf)
- [Hausa](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_hausa.pdf)
- [History](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_history.pdf)
- [Igbo](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_igbo.pdf)
- [Islamic Religious Studies](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_islamic.pdf)
- [Mathematics](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_maths.pdf)
- [National Values Curriculum](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_nvc.pdf)
- [Pre-Vocational Studies](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_prevoc.pdf)
- [Yoruba](https://www.nerdc.gov.ng/content_manager/jss/jss1-3_yoruba.pdf)

## Dimensions

| Dimension                         |        Count | Status                                         |
| --------------------------------- | -----------: | ---------------------------------------------- |
| Classes                           |            3 | JSS1, JSS2, JSS3 verified in database          |
| Terms                             |            3 | First, Second, Third Term verified in database |
| Proposed NERDC subject identities |           15 | Source documents identified                    |
| Topics                            | 0 importable | Extraction and review incomplete               |
| Source term allocations           |            0 | Not supplied by retrieved NERDC documents      |
| Implementation allocations        |            0 | Pending educator review                        |
| Review-required allocations       |   0 recorded | No ambiguous record is being hidden            |

## Coverage matrix

The following matrix is the current honest state. Every class/term/subject scope exists as a required dimension, but no topic record is currently importable.

| Class | Term        | Subjects represented | Topic count | Source-backed | Implementation allocation | Review required |
| ----- | ----------- | -------------------: | ----------: | ------------: | ------------------------: | --------------: |
| JSS1  | First Term  |                   15 |           0 |             0 |                         0 |              15 |
| JSS1  | Second Term |                   15 |           0 |             0 |                         0 |              15 |
| JSS1  | Third Term  |                   15 |           0 |             0 |                         0 |              15 |
| JSS2  | First Term  |                   15 |           0 |             0 |                         0 |              15 |
| JSS2  | Second Term |                   15 |           0 |             0 |                         0 |              15 |
| JSS2  | Third Term  |                   15 |           0 |             0 |                         0 |              15 |
| JSS3  | First Term  |                   15 |           0 |             0 |                         0 |              15 |
| JSS3  | Second Term |                   15 |           0 |             0 |                         0 |              15 |
| JSS3  | Third Term  |                   15 |           0 |             0 |                         0 |              15 |

`Review required` here means the scope cannot be approved for population, not that an official curriculum topic has been rejected.

## Subject normalization

| Official subject                             | Proposed PrePa subject                      | Existing legacy/database mapping                         |
| -------------------------------------------- | ------------------------------------------- | -------------------------------------------------------- |
| Basic Science and Technology                 | Basic Science and Technology                | Basic Science; Basic Technology                          |
| Business Studies                             | Business Studies                            | Business Studies; Commerce                               |
| Christian Religious Studies                  | Christian Religious Studies                 | CRS                                                      |
| English Studies                              | English Studies                             | English                                                  |
| History                                      | History                                     | History                                                  |
| Mathematics                                  | Mathematics                                 | Mathematics                                              |
| National Values Curriculum                   | National Values Curriculum                  | Civic Education; Social Studies; Government              |
| Pre-Vocational Studies                       | Pre-Vocational Studies                      | Agricultural Science; Basic Technology; Business Studies |
| Other NERDC language/arts/religious subjects | Same official name pending product approval | No automatic legacy mapping                              |

These mappings are planning mappings only. They do not alter existing subject rows or production data.

## Quality checks

- Classes and terms are present.
- Subject names are non-empty and unique in the manifest.
- No topic duplicates can currently exist because no topic records are claimed.
- No topic has been assigned a term without an explicit allocation record.
- No truncated PDF extraction result has been promoted to a topic.
- The manifest is not import-ready until topic records contain source references and allocation types.

## Gate to the next stage

Before question generation, an educator or curriculum reviewer must approve the extracted topic list and the proposed term sequence. After approval, each topic record must include `class`, `subject`, `topic`, `sourceReference`, `term`, `termAllocationType`, `learningObjectives`, `questionPotential`, and `recommendedQuestionTarget`.
