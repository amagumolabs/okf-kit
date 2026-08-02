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
| 1. Skeleton group exists before the implementation group | BR-4 | IT-001 | Asserted against the shipped template, not a copy |
| 2. No promotion instruction without an earlier creating instruction | BR-7 | IT-002 | Scans every group heading and body in the tasks template |
| 3. Group order sentence matches the template headings | BR-7 | IT-003 | Compares `schema.yaml` prose to template headings in order |
| 4. Integration and E2E tables carry `Initial Status` beside `Status` | BR-6 | IT-004 | Asserted against the shipped test-plan template |
| 5. Empty `Initial Status` is a warning, not an error or silence | BR-6 | UT-006, NEG-002 | Level and message both asserted |
| 6. `Initial Status: skeleton` + `Status: passing` needs no Known Gaps row | BR-5 | UT-003 | The false positive the new column would otherwise create |
| 7. `Status: skeleton` still needs a Known Gaps row with an owner | BR-5 | UT-004 | Existing behaviour must survive the change |
| 8. An unknown word in either status column is an error | BR-1 | UT-001, NEG-001 | Both columns exercised |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | test-first-gate | UT-001, UT-002, NEG-001 | Closed vocabulary, in both status columns |
| BR-2 | test-first-gate | - | Not touched by this change: the file-exists distinction is a rule for authors, and no check reads the filesystem for a planned test. Recorded so the gap is visible rather than implied |
| BR-3 | test-first-gate | - | Not touched by this change: the red-state rule and contract stubs are unchanged in both template and instruction |
| BR-4 | test-first-gate | IT-001 | Template structure is the only place this rule can be enforced |
| BR-5 | test-first-gate | UT-003, UT-004, UT-005 | Live-status semantics, both directions plus the fallback |
| BR-6 | test-first-gate | UT-006, UT-007, IT-004 | Column exists, is required, and is waived with the level |
| BR-7 | test-first-gate | IT-002, IT-003 | Template self-consistency and instruction/template agreement |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| The schema creates every test file before the implementation it guards | An agent reads the tasks template | IT-001 | |
| The schema creates every test file before the implementation it guards | A level does not apply to the change | UT-007 | The waiver path, asserted through the check that would otherwise fire |
| No artifact instructs promotion of a skeleton nothing creates | An agent reads the tasks instruction | IT-003 | |
| No artifact instructs promotion of a skeleton nothing creates | The instruction and the template disagree | IT-002, IT-003 | The failing direction of the same assertions |
| A test-plan records the status each test held before implementation | A row records both statuses | IT-005 | Clean fixture stays clean |
| A test-plan records the status each test held before implementation | A row leaves the initial status blank | UT-006 | |
| A test-plan records the status each test held before implementation | A whole test level is declared not applicable | UT-007 | |
| The pending-test list is derived from a table's live status column | A skeleton that was promoted before archive | UT-003 | |
| The pending-test list is derived from a table's live status column | A skeleton that survived to archive | UT-004 | |
| The pending-test list is derived from a table's live status column | A table with only an initial status | UT-005 | |
| The status vocabulary is closed | An unknown word in a status column | UT-001, NEG-001 | |
| The status vocabulary is closed | A red state with its assertion message | UT-002 | |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | must | Unknown word in the initial status column | A test-plan whose Integration table has `Initial Status` of `wip` | `check` runs | An error names the four permitted values | BR-1 |
| UT-002 | must | Red state carrying its assertion message | A unit row reading `failing: expected 403, got 200` | `check` runs | No vocabulary error, and no missing-message warning | BR-1 |
| UT-003 | must | A promoted skeleton at archive time | An Integration row with `Initial Status` `skeleton` and `Status` `passing`, and no Known Gaps row for it | `check --archive` runs for the change | No finding is reported for that row | BR-5 |
| UT-004 | must | A skeleton that survived to archive | An Integration row whose `Status` is `skeleton`, with no Known Gaps row naming an owner | `check --archive` runs for the change | An error names the row as an untested requirement about to be archived | BR-5 |
| UT-005 | must | A table with only an initial status column | The Pre-Implementation Unit Tests table, which has `Initial Status` and no `Status`, holding `planned` | `check --archive` runs for the change | That column is read as the live status, so the Known Gaps requirement still applies | BR-5 |
| UT-006 | must | An unfilled initial status | An Integration row with a non-empty `Status` and an empty `Initial Status` | `check` runs | A warning names the row, and no error is produced | BR-6 |
| UT-007 | must | A level waived under Test Strategy | A test-plan declaring the E2E level not applicable with a specific reason, and no E2E rows | `check` runs | No warning is emitted for the waived level | BR-6 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-001 | must | Skeleton group precedes implementation | The shipped `templates/tasks.md` | Its group headings are read in order | A group creating integration and E2E skeletons appears before the implementation group | BR-4 |
| IT-002 | must | Nothing promotes what nothing creates | The shipped `templates/tasks.md` | Every group asking for promotion of a skeleton is located | Each is preceded by a group that creates one | BR-7 |
| IT-003 | must | Instruction matches template | The `tasks` instruction in `schema.yaml` and `templates/tasks.md` | The group order sentence is compared to the template headings | The two name the same groups in the same order | BR-7 |
| IT-004 | must | Both status columns are shipped | The shipped `templates/test-plan.md` | The Integration Tests and E2E Tests table headers are read | Each carries `Initial Status` and `Status` | BR-6 |
| IT-005 | must | The template a project fills passes the check | A fixture change whose `test-plan.md` follows the new template with every cell filled | `check` and `check --archive` run | Neither reports an error or a warning for that file | BR-5, BR-6 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-001 | must | An unknown word in the current `Status` column, with a valid `Initial Status` | An error naming the four permitted values - a valid neighbour column does not excuse an invalid one | BR-1 |
| NEG-002 | must | A table with no status column at all, such as Contract Stubs, and a table whose rows are blank or separators | No warning about a missing initial status - the rule applies to real rows of status-bearing tables only | BR-6 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| API E2E | The kit ships a CLI and a schema payload; there is no HTTP surface to exercise black-box | propose (author) |
| Browser E2E | No UI exists in this repo, and none is added by this change | propose (author) |
