# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | Primary durable knowledge source - business rules carry BR-n ids |
| Proposal | proposal.md | Scope, non-goals, risks, acceptance criteria |
| Specs | specs/**/*.md | Normative requirements and scenarios |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. A row with an empty Test cell is an error | BR-9 | UT-101 | |
| 2. A row citing a `BR-n` no linked entry carries is an error | BR-9 | UT-102 | The id must be named in the message |
| 3. A row citing an unresolvable spec path is an error | BR-9 | UT-103 | |
| 4. A row with no citation is accepted when its Ground declares a mechanical defect | BR-8, BR-9 | UT-104 | The only clean no-citation path |
| 5. A row with neither citation nor declared defect is an error | BR-9 | UT-105, NEG-101 | NEG-101 covers the vague-declaration boundary |
| 6. An empty table produces no finding | BR-9 | UT-106 | The check must not push anyone toward omitting rows |
| 7. Implementation group and instruction state the direction and the order of repair | BR-8, BR-10 | IT-101, IT-102 | Asserted against the shipped payload |
| 8. The template's table carries a `Ground` column | BR-9 | IT-103 | |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-8 | test-first-gate | IT-101, UT-104 | Stated where the work happens, and the mechanical-defect ground it admits |
| BR-9 | test-first-gate | UT-101 - UT-106, NEG-101, IT-103 | The recorded case, in every direction it can fail |
| BR-10 | test-first-gate | IT-102 | The order of repair, asserted in the instruction an agent reads |
| BR-1 - BR-7 | test-first-gate | - | Not touched by this change; verified by `skeleton-tests-before-implementation` and unchanged here |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| The implementation adapts to the tests, not the reverse | An agent reads the implementation group | IT-101 | |
| The implementation adapts to the tests, not the reverse | An agent finds the code contradicting a test | IT-102 | The instruction is the artifact that answers this |
| Every recorded test change carries a ground that resolves | A row naming no test | UT-101 | |
| Every recorded test change carries a ground that resolves | A row citing a rule that does not exist | UT-102 | |
| Every recorded test change carries a ground that resolves | A row citing a spec that does not resolve | UT-103 | |
| Every recorded test change carries a ground that resolves | A row standing on a mechanical defect | UT-104 | |
| Every recorded test change carries a ground that resolves | A row standing on nothing | UT-105, NEG-101 | |
| Every recorded test change carries a ground that resolves | No test was changed | UT-106 | |
| The test-plan template shows both admissible grounds | An agent fills the test-plan template | IT-103 | |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-101 | must | A record that names no test | A Test Changes row with a citation but an empty Test cell | `check` runs | An error says the row names no test | BR-9 |
| UT-102 | must | A dangling rule citation | A row citing `BR-9`, which no linked entry carries | `check` runs | An error names `BR-9` | BR-9 |
| UT-103 | must | A dangling spec citation | A row citing `openspec/specs/ghost/spec.md` | `check` runs | An error names the path | BR-9 |
| UT-104 | must | A mechanical defect, declared | A row with no citation whose Ground reads `mechanical defect: fixture seeded the wrong tenant` | `check` runs | Nothing is reported for that row | BR-8, BR-9 |
| UT-105 | must | A test change standing on nothing | A row with no citation and a Ground that declares no defect | `check` runs | An error says the row states no ground | BR-9 |
| UT-106 | must | Nothing was changed | A Test Changes table with only its header | `check` runs | Nothing is reported | BR-9 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-101 | must | The direction is stated where the work happens | The shipped `templates/tasks.md` | Its implementation group is read | The group states that the code adapts to the tests | BR-8 |
| IT-102 | must | The order of repair is stated | The `tasks` instruction in `schema.yaml` | It is read | It names entry, spec, record, test, code in that order | BR-10 |
| IT-103 | must | Both grounds are visible in the template | The shipped `templates/test-plan.md` | The Test Changes table header is read | It carries a `Ground` column and a citation column | BR-9 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-101 | must | A Ground that mentions a mechanical defect without naming one, e.g. the bare words `mechanical defect` | An error - a declaration must name what was wrong, the same bar the kit sets for "not applicable" | BR-9 |
| NEG-102 | must | A row citing a `BR-n` that a linked entry does carry, alongside a Ground that declares nothing | Nothing reported - a resolving citation is a complete answer on its own | BR-9 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| API E2E | The kit ships a CLI and a schema payload; there is no HTTP surface to exercise black-box | propose (author) |
| Browser E2E | No UI exists in this repo, and none is added by this change | propose (author) |
