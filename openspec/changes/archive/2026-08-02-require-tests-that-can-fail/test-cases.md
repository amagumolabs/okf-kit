# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | `test-first-gate` — BR-3, BR-5, BR-8, BR-11, BR-12 are the rules this change touches |
| Proposal | proposal.md | Eight acceptance criteria |
| Specs | specs/test-first-gate/spec.md | Three ADDED requirements, two MODIFIED |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Bare `passing` initial status warns, and errors under `--archive` | BR-11 | UT-201, NEG-201 | |
| 2. `passing: <reason>` passes; a reason under ten characters does not | BR-11 | UT-202, UT-203 | The threshold matches `testChangeGround` |
| 3. Empty `Falsified By` warns, and errors under `--archive` | BR-12 | UT-205, NEG-202 | |
| 4. A missing `Falsified By` column reports once per table | BR-12 | UT-207 | Once for the table, not once per row |
| 5. `failing` with no message keeps its warning, errors under `--archive` | BR-3 | UT-209, NEG-203 | |
| 6. The Known Gaps owner is found by header name | BR-5 | UT-210, UT-211 | UT-211 guards the behaviour the fix must not lose |
| 7. Template and instruction ask for the same thing | BR-7, BR-8, BR-12 | IT-201, IT-202, IT-203, IT-204 | |
| 8. `okf check` on this repository reports no new errors | — | Not Applicable | See the Not Applicable table |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-3 | test-first-gate | UT-209, NEG-203 | Enforcement tightened, rule text unchanged |
| BR-5 | test-first-gate | UT-210, UT-211 | Owner lookup by name |
| BR-8 | test-first-gate | IT-201 | Template exposition only, rule text unchanged |
| BR-11 | test-first-gate | UT-201, UT-202, UT-203, UT-204, NEG-201, IT-203 | New |
| BR-12 | test-first-gate | UT-205, UT-206, UT-207, UT-208, NEG-202, NEG-204, IT-202, IT-203, IT-204 | New |

BR-1, BR-2, BR-4, BR-6, BR-7, BR-9 and BR-10 are untouched by this change and
carry the evidence recorded at their last verification pass. BR-7 appears in the
criteria mapping because IT-202 and IT-203 exist to satisfy it for the new column.

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs |
| --- | --- | --- |
| A green initial status explains itself | A bare green initial status | UT-201, NEG-201 |
| A green initial status explains itself | A green initial status with its reason | UT-202 |
| A green initial status explains itself | A reason too short to be one | UT-203 |
| A green initial status explains itself | A green status in the live column | UT-204 |
| Every pre-implementation unit test names what would falsify it | A row with no falsifier | UT-205, NEG-202 |
| Every pre-implementation unit test names what would falsify it | A table with no falsifier column | UT-207 |
| Every pre-implementation unit test names what would falsify it | A falsifier that names a production change | UT-206 |
| Every pre-implementation unit test names what would falsify it | A falsifier that is wrong but present | UT-206 |
| Every pre-implementation unit test names what would falsify it | Only the unit test table is affected | UT-208 |
| The test-plan template names the grounds that are not admissible | An agent looks for a reason to edit a pre-written test | IT-201 |
| The status vocabulary is closed | An unknown word in a status column | covered by the existing suite |
| The status vocabulary is closed | A red state with its assertion message | covered by the existing suite |
| The status vocabulary is closed | A red state with no assertion message | UT-209, NEG-203 |
| The pending-test list is derived from a table's live status column | A Known Gaps table whose columns were reordered | UT-210 |
| The pending-test list is derived from a table's live status column | A skeleton that survived to archive | UT-211 |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-201 | must | A bare green initial status is reported | a Pre-Implementation Unit Tests row with `Initial Status: passing` | `okf check` runs | a warning names the row and says a green status before implementation must say why | BR-11 |
| UT-202 | must | A green status with a reason is clean | the same row reading `passing: BR-4 already held, this test locks it` | `okf check` runs | nothing is reported for that row | BR-11 |
| UT-203 | must | A reason too short is not a reason | the same row reading `passing: ok` | `okf check` runs | the row is reported | BR-11 |
| UT-204 | must | The live column is not affected | a row whose `Status` is `passing` and whose `Initial Status` is `failing: expected 403, got 200` | `okf check` runs | nothing is reported | BR-11 |
| UT-205 | must | A unit row with no falsifier is reported | a Pre-Implementation Unit Tests table with a `Falsified By` column and one empty cell | `okf check` runs | a warning names the row | BR-12 |
| UT-206 | must | A filled falsifier is clean | the same row reading `Falsified By: reading the Owner column by position again` | `okf check` runs | nothing is reported, whether or not the answer is apt | BR-12 |
| UT-207 | must | A missing column is one finding, not many | a Pre-Implementation Unit Tests table with three rows and no `Falsified By` column | `okf check` runs | exactly one finding is reported for the table | BR-12 |
| UT-208 | must | Other levels are unaffected | Integration Tests and E2E Tests tables with no `Falsified By` column | `okf check` runs | nothing is reported for those tables | BR-12 |
| UT-209 | must | A bare red state keeps its warning | a row reading `Initial Status: failing` with no message | `okf check` runs without `--archive` | a warning is emitted and no error | BR-3 |
| UT-210 | must | The owner is found by header name | a Known Gaps table whose `Owner` column sits in a different position, naming a surviving skeleton | `okf check --archive` runs | no error is reported for that row | BR-5 |
| UT-211 | must | A surviving skeleton with no owner is still caught | a Known Gaps row for the skeleton whose `Owner` cell is empty | `okf check --archive` runs | an error is reported, as before the fix | BR-5 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-201 | must | The template names the inadmissible grounds | the shipped `templates/test-plan.md` | its Test Change Rules section is read | it names manual testing, adding the test afterwards, time already spent, and "this case is different" as grounds that do not count | BR-8 |
| IT-202 | must | The template carries the falsifier column | the shipped `templates/test-plan.md` | its Pre-Implementation Unit Tests header is read | it contains a `Falsified By` column | BR-12 |
| IT-203 | must | The instruction asks for what the template shows | the `test-plan` artifact instruction in `schema.yaml` | it is read | it requires the falsifier and the reason behind a green initial status | BR-7, BR-11, BR-12 |
| IT-204 | must | Mock call counts are named as a non-answer | the `test-cases` artifact instruction in `schema.yaml` | it is read | it states that assertions run on real behaviour, because a mock call count has no production falsifier | BR-12 |

# API E2E Scenarios

Not applicable — this capability has no API surface. See the Not Applicable table.

# Browser E2E Scenarios

Not applicable — this capability has no UI. See the Not Applicable table.

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-201 | must | A bare green initial status at the archive boundary | `okf check --archive` reports an error where the normal run warned | BR-11 |
| NEG-202 | must | An empty falsifier at the archive boundary | `okf check --archive` reports an error where the normal run warned | BR-12 |
| NEG-203 | must | A bare `failing` at the archive boundary | `okf check --archive` reports an error where the normal run warned | BR-3 |
| NEG-204 | must | A blank template row | neither new check fires on a row whose cells are all empty, so an untouched template reports nothing | BR-12 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| API E2E | The capability is a static checker and a set of markdown templates. There is no HTTP surface to drive. | change author |
| Browser E2E | No UI exists in this kit. | change author |
| Acceptance criterion 8 (`okf check` clean on this repository) | It is a command run against live repository state, not a fixture. A test asserting it would fail whenever any unrelated change is legitimately mid-flight. It is recorded as a command in test-plan.md and its result in verification.md. | change author |

# Open Questions

None.
