# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` | BR-1..BR-6 in `okf-next` |
| Proposal | proposal.md | Nine acceptance criteria |
| Specs | specs/okf-next/spec.md | Four ADDED requirements |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Pending entry owes the verification pass | BR-3, BR-4 | UT-301 | |
| 2. Missing verification.md is owed | BR-3 | UT-302 | |
| 3. Empty Rule Evidence is owed | BR-3 | UT-303 | |
| 4. Owing nothing is stated and names the gate | BR-6 | UT-304 | |
| 5. No okf-link names openspec status | BR-2 | UT-305, UT-306 | UT-306 is the structural half |
| 6. Every step carries a command | BR-4 | UT-307 | |
| 7. Nothing is created, modified, or spawned | BR-1 | UT-308 | |
| 8. Exit zero even when steps are owed | BR-5 | UT-309 | |
| 9. A no-domain-knowledge change still owes its pass | BR-3 | UT-310 | |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | okf-next | UT-308 | |
| BR-2 | okf-next | UT-305, UT-306 | |
| BR-3 | okf-next | UT-301, UT-302, UT-303, UT-310, NEG-301 | NEG-301 is the checkbox case |
| BR-4 | okf-next | UT-307 | |
| BR-5 | okf-next | UT-309 | |
| BR-6 | okf-next | UT-304 | |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs |
| --- | --- | --- |
| The command reports what a change owes | An entry still lists the change as pending | UT-301 |
| The command reports what a change owes | No verification artifact yet | UT-302 |
| The command reports what a change owes | A verification with no rule evidence | UT-303 |
| The command reports what a change owes | A checkbox is not an answer | NEG-301 |
| The command reports and never acts | Running the command changes nothing | UT-308 |
| The command reports and never acts | Owed steps still exit zero | UT-309 |
| The command reports and never acts | An unknown change id | NEG-302 |
| The artifact half is named, never re-derived | A change with no okf-link | UT-305 |
| The artifact half is named, never re-derived | The implementation holds no artifact ordering | UT-306 |
| Owing nothing is stated, not implied | A finished change | UT-304 |
| Owing nothing is stated, not implied | A change declaring no domain knowledge | UT-310 |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-301 | must | Pending entry | An entry still lists this change in `pending_changes` | `next` runs | The verification pass is reported as owed | BR-3, BR-4 |
| UT-302 | must | No verification | The change has no `verification.md` | `next` runs | It is reported as owed | BR-3 |
| UT-303 | must | Empty rule evidence | `verification.md` exists, okf-link resolves, Rule Evidence has no rows | `next` runs | The missing evidence is reported | BR-3 |
| UT-304 | must | Nothing owed | Every entry verified and cleared | `next` runs | Output states nothing is owed and names `okf check --archive` | BR-6 |
| UT-305 | must | No okf-link | The change has no `okf-link.md` | `next` runs | Output names `openspec status` and lists no missing artifacts | BR-2 |
| UT-306 | must | No artifact ordering in the source | The implementation | It is read | It holds no ordered list of OpenSpec artifact ids | BR-2 |
| UT-307 | must | Every step is runnable | A change owing several steps | `next` runs | Each reported line carries a command | BR-4 |
| UT-308 | must | Purely read-only | A change owing several steps | `next` runs | No file is created or modified, and the source spawns no process | BR-1 |
| UT-309 | must | Exit zero when owed | A change owing steps | `next` runs | The call returns normally rather than signalling failure | BR-5 |
| UT-310 | must | No domain knowledge still owes | Every okf-link row declares no domain knowledge, no verification done | `next` runs | The verification pass is still reported | BR-3 |
| UT-311 | should | Advisor and gate agree | A change `okf check --archive` accepts | `next` runs | It reports nothing owed | BR-3 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-301 | must | The real command runs | This repository | `node bin/okf.mjs next <an active change>` | It prints owed steps and exits zero | BR-4, BR-5 |
| IT-302 | must | Nothing pre-existing regressed | The full suite | `npm test` | Every prior assertion still passes | BR-1..BR-6 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-301 | must | Archive Readiness fully ticked while entries stay pending | The verification pass is still reported - a checkbox is not derivation | BR-3 |
| NEG-302 | must | An unknown change id | An error about the argument, not an empty owed list | BR-1 |
| NEG-303 | must | A change id naming an archived change | An error about the argument - `next` advises on active work | BR-1 |
| NEG-304 | should | `okf-link.md` present but every row unresolvable | Reported as owing the entries, not treated as nothing owed | BR-3 |
| NEG-305 | should | No argument at all | Usage output, not a report about an arbitrary change | BR-1 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Browser E2E | The kit is a command-line validator with no UI surface | change author |
| API E2E | The kit exposes no network interface | change author |

# Open Questions

None. Whether `okf check` should print the same line is deferred on the entry.
