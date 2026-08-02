# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` | BR-13..BR-16 in `test-first-gate` |
| Proposal | proposal.md | Six acceptance criteria |
| Specs | specs/test-first-gate/spec.md | Three ADDED requirements |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Class column and one row per class | BR-13 | UT-401 | |
| 2. Instruction states discharge-not-delete | BR-14 | UT-402 | |
| 3. Four render states and the console question | BR-15 | UT-403 | |
| 4. Artifacts column in two templates | BR-16 | UT-404 | |
| 5. Empty boundary table warns, never errors | BR-13 | UT-405, UT-406 | |
| 6. No tool named | BR-16 | UT-407 | |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-13 | test-first-gate | UT-401, UT-405, UT-406, NEG-401 | |
| BR-14 | test-first-gate | UT-402 | Instruction text; whether an agent obeys is not checkable |
| BR-15 | test-first-gate | UT-403 | |
| BR-16 | test-first-gate | UT-404, UT-407 | |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs |
| --- | --- | --- |
| A matrix answers for named boundary classes | An agent reads the template | UT-401 |
| A matrix answers for named boundary classes | An agent reads the instruction | UT-402 |
| A matrix answers for named boundary classes | An empty boundary table | UT-405 |
| A matrix answers for named boundary classes | A filled boundary table | UT-406 |
| A change with an interface answers for its render states | An agent reads the browser section | UT-403 |
| A change with an interface answers for its render states | A change with no interface | UT-408 |
| An inspectable artefact has a stated home | An agent reads the test-plan template | UT-404 |
| An inspectable artefact has a stated home | An agent reads the verification template | UT-404 |
| An inspectable artefact has a stated home | No tool is prescribed | UT-407 |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-401 | must | Classes are seeded rows | The shipped test-cases template | It is read | The boundary table has a Class column and one row per named class | BR-13 |
| UT-402 | must | Discharge, not delete | The shipped schema | The `test-cases` instruction is read | It states an untouched class is discharged with a stated reason | BR-14 |
| UT-403 | must | Render states named | The template's Browser E2E section | It is read | All four states and the console-error question appear | BR-15 |
| UT-404 | must | Artifacts column | The test-plan and verification templates | They are read | Each carries an Artifacts column on its browser rows | BR-16 |
| UT-405 | must | Empty table warns | A change with spec scenarios and no boundary rows | `okf check --archive` runs | A warning is reported, and no error | BR-13 |
| UT-406 | must | Filled table is silent | The same change with rows | `okf check --archive` runs | Nothing is reported about the table | BR-13 |
| UT-407 | must | No tool prescribed | Every shipped template | They are read | None names a specific browser-automation tool | BR-16 |
| UT-408 | should | No interface discharges cleanly | A change with no UI, discharging the class in Not Applicable with a reason | `okf check --archive` runs | Nothing is reported | BR-15 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-401 | must | This change dogfoods its own rule | This change's own test-cases.md | `okf check --archive` runs | Clean, with the UI class discharged by a stated reason rather than deleted | BR-14, BR-15 |
| IT-402 | must | Nothing pre-existing regressed | The full suite | `npm test` | Every prior assertion still passes | BR-13..BR-16 |

# Negative And Boundary Cases

| Class | ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- | --- |
| Absence | NEG-401 | must | A boundary table holding only the template's blank row | Treated as empty, matching how every other table here reads a blank row | BR-13 |
| Numeric edge | - | - | - | Not Applicable - see the Not Applicable table | BR-14 |
| Duplication | NEG-402 | should | A template shipping two rows for the same class | Both survive; the check counts rows, never classes, because counting classes would be the error this change refuses to make | BR-13 |
| Staleness | - | - | - | Not Applicable - see the Not Applicable table | BR-14 |
| Authorisation | - | - | - | Not Applicable - see the Not Applicable table | BR-14 |
| Scope isolation | - | - | - | Not Applicable - see the Not Applicable table | BR-14 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Browser E2E, and the four render states | The kit is a command-line validator with no user interface of any kind. This row is the mechanism of BR-14 working on this very change rather than an exception to it | change author |
| API E2E | The kit exposes no network interface | change author |
| Numeric edge | This change adds table columns and instruction text. It reads no number, computes none, and has no limit to sit at | change author |
| Staleness | Nothing this change touches is cached or read twice; each template is read once per check run | change author |
| Authorisation | The kit has no actors and no permissions; it reads a working tree with the caller's own rights | change author |
| Scope isolation | The kit holds no cross-boundary data. Every path it reads is under the root it was given, and that containment is already asserted by the durable reference rules | change author |

# Open Questions

None.
