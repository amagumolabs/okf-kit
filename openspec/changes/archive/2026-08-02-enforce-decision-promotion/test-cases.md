# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | Primary durable knowledge source - business rules carry BR-n ids |
| Proposal | proposal.md | Scope, non-goals, risks, acceptance criteria |
| Specs | specs/**/*.md | Normative requirements and scenarios |
| Existing harness | test/run.mjs | Dependency-free fixture tests: build a temp repo, break one thing, assert the finding |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Decisions section plus empty promotion table fails | BR-4 | UT-001 | The core new gate |
| 2. `Not required because ...` waiver passes with no row | BR-3 | UT-002 | The waiver must stay usable, or the gate becomes ceremony |
| 3. Resolving target passes, non-existent path fails | BR-5 | UT-003, UT-004 | A mistyped filename must not masquerade as a promotion |
| 4. Reason-only row passes, row with neither fails | BR-5 | UT-005, UT-006 | The reason-or-path escape |
| 5. All-`no domain knowledge` change still enforced | BR-1 | UT-010 | The defect that made this change necessary |
| 6. Missing `okf-link.md` stays a distinct finding | BR-2 | UT-011 | Must not be re-reported as a promotion problem |
| 7. Unrecognised design shape requires a row | BR-8 | UT-007 | Fail safe |
| 8. Under-accounting warns rather than errors | BR-6 | UT-008, UT-009, E2E-001 | Severity tier, observable through exit status |
| 9. Instruction and template say the table is enforced | BR-7 | See Not Applicable | Prose; the mechanical half is UT-015 |
| 10. This change's own archive run passes its own gate | BR-1, BR-4, BR-5 | UT-013 | Plus the real run recorded in verification.md |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | okf-archive-gate | UT-010, UT-012 | Gate reaches an all-`no domain knowledge` change, while entry-scoped gates stay scoped |
| BR-2 | okf-archive-gate | UT-011 | Missing artifact and no-linked-entries stay distinct |
| BR-3 | okf-archive-gate | UT-002 | Waiver form recognised |
| BR-4 | okf-archive-gate | UT-001, UT-009, NEG-002 | Empty table with decisions is an error; accounted-for table is clean |
| BR-5 | okf-archive-gate | UT-003, UT-004, UT-005, UT-006, NEG-001 | All four row shapes, plus a target outside `.okf/decisions/` |
| BR-6 | okf-archive-gate | UT-008, UT-009, UT-014, NEG-004, E2E-001 | Warning tier, and the counting it rests on |
| BR-7 | okf-archive-gate | UT-013, UT-015 | The gate exists in code rather than as a checkbox, and stays coupled to the wording it matches |
| BR-8 | okf-archive-gate | UT-007, NEG-003 | Unrecognised shape fails safe |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| Decision promotion is required whenever the design holds decisions | A design with decisions and an empty promotion table | UT-001 | - |
| Decision promotion is required whenever the design holds decisions | A design waived with a reason | UT-002 | - |
| Decision promotion is required whenever the design holds decisions | A design of unrecognised shape | UT-007 | - |
| Decision promotion is required whenever the design holds decisions | A design with decisions and an accounted-for table | UT-009 | - |
| A promotion row is satisfied by a resolving path or a stated reason | A row promoted to a real decision file | UT-003 | - |
| A promotion row is satisfied by a resolving path or a stated reason | A row promoted to a path that does not exist | UT-004 | - |
| A promotion row is satisfied by a resolving path or a stated reason | A row not promoted, with a reason | UT-005 | - |
| A promotion row is satisfied by a resolving path or a stated reason | A row with neither a target nor a reason | UT-006 | - |
| Under-accounting for decisions is a warning | Fewer rows than decisions | UT-008, E2E-001 | Severity asserted at both the report and the exit status |
| Under-accounting for decisions is a warning | A row per decision | UT-009 | - |
| Archive gates apply to a change with no linked feature entries | Every okf-link row declares no domain knowledge | UT-010 | - |
| Archive gates apply to a change with no linked feature entries | No okf-link.md at all | UT-011 | - |
| Archive gates apply to a change with no linked feature entries | Gates that concern linked entries stay scoped to them | UT-012 | - |
| The workflow states that the promotion table is enforced | An agent reads the verification instruction | See Not Applicable | Mechanical half covered by UT-015 |
| The workflow states that the promotion table is enforced | An agent reads the verification template | See Not Applicable | Mechanical half covered by UT-015 |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | must | Decisions section, empty promotion table | A fixture change whose `design.md` has a Decisions section and whose Decision Promotion table has only the template's blank row | `check` runs in archive mode | An error fires naming the empty Decision Promotion table | BR-4 |
| UT-002 | must | Waived design needs no row | A fixture change whose `design.md` is the single line `Not required because the change only renames a config key.` and which has no Decision Promotion rows | `check` runs in archive mode | No decision promotion finding is reported | BR-3 |
| UT-003 | must | Row promoted to a real file | A promotion row whose target is a path under `.okf/decisions/` that exists on disk | `check` runs in archive mode | The row produces no finding | BR-5 |
| UT-004 | must | Row promoted to a missing file | A promotion row whose target names a file under `.okf/decisions/` that is not on disk | `check` runs in archive mode | An error fires naming that path | BR-5 |
| UT-005 | must | Row not promoted, with a reason | A promotion row with an empty target and the reason `change-local: only governs how this change sequenced its own commits` | `check` runs in archive mode | The row produces no finding | BR-5 |
| UT-006 | must | Row with neither target nor reason | A promotion row whose target and reason cells are both empty | `check` runs in archive mode | An error fires, because silence is not one of the two permitted answers | BR-5 |
| UT-007 | must | Unrecognised design shape | A `design.md` with neither a Decisions section nor the waiver line, and an empty promotion table | `check` runs in archive mode | An error fires, so an unknown does not become an assurance | BR-8 |
| UT-008 | must | Fewer rows than decisions | A `design.md` with four decisions and a promotion table with two satisfied rows | `check` runs in archive mode | A warning names both counts, and no error is reported for that finding | BR-6 |
| UT-009 | must | A row per decision | A `design.md` with two decisions and two satisfied promotion rows | `check` runs in archive mode | Neither an under-accounting warning nor a promotion error is reported | BR-4, BR-6 |
| UT-010 | must | All-`no domain knowledge` change is still gated | A fixture change whose only okf-link row reads `no domain knowledge - <reason>`, whose `design.md` holds decisions, and whose promotion table is empty | `check` runs in archive mode | The decision promotion error fires rather than the change passing | BR-1 |
| UT-011 | must | Missing okf-link.md stays distinct | A fixture change being archived with no `okf-link.md` at all | `check` runs in archive mode | The missing-artifact error fires and no decision promotion finding is reported | BR-2 |
| UT-012 | must | Entry-scoped gates stay scoped | A fixture change whose only okf-link row declares no domain knowledge, with a satisfied promotion table | `check` runs in archive mode | No missing-rule-evidence and no missing-entry-outcome error is reported | BR-1 |
| UT-013 | must | The clean fixture stays archivable | The harness fixture, extended with a `design.md` and a satisfied promotion table | `check` runs in archive mode | No errors at all, so the happy path remains reachable | BR-7 |
| UT-014 | should | Both decision syntaxes count alike | Two `design.md` variants holding the same three decisions, one as `**Bold lead.**` paragraphs and one as `1. **Bold title**` numbered items | The decision count is taken from each | Both yield three, so the warning does not depend on which house style a project uses | BR-6 |
| UT-015 | must | The matched waiver phrase stays coupled to the schema | The schema's `design` artifact rule text and the phrase the gate matches to recognise a waiver | Both are read | The phrase the gate matches occurs in the schema's own `design` rule, so a reword cannot silently waive the gate for every change | BR-7, BR-8 |

# API E2E Scenarios

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| E2E-001 | must | A warning alone does not block archive | A fixture repo whose only finding is the under-accounting warning | `node bin/okf.mjs check --archive` runs against it as a subprocess | It exits 0 and reports the change as ready to archive, proving the warning tier is real rather than an error in disguise | BR-6 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-001 | must | Promotion target points somewhere outside `.okf/decisions/` | Reported as an error, on the same footing as a path that does not resolve - a decision promoted somewhere else is not promoted | BR-5 |
| NEG-002 | must | A promotion table holding only the template's blank row | Treated as an empty table, not as one satisfied row | BR-4 |
| NEG-003 | must | A `design.md` that is empty, or truncated mid-sentence | A row is required, because this is the shape the old behaviour waived silently | BR-8 |
| NEG-004 | should | A Decisions section present but holding no recognisable decision | Zero decisions counted, so no under-accounting warning; the table's own row checks still apply | BR-6 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Integration tests | The kit is one dependency-free module with no services, database, or network. `check()` over a real temp repo built on disk already crosses every boundary this change touches, and the harness classifies those as unit tests; a separate integration layer would re-run identical code paths under a second name | Danh Nguyen |
| Browser E2E | `okf` is a CLI with no UI | Danh Nguyen |
| Spec requirement "The workflow states that the promotion table is enforced", both scenarios | The requirement is about prose an agent reads. A test asserting that a sentence exists would be rewritten by any reword, and it would still pass while the sentence said the wrong thing - it cannot detect the failure it claims to guard. The mechanically checkable half, that the waiver phrase the gate matches is the one the schema mandates, is UT-015; the prose itself is verified by review and recorded in verification.md | Danh Nguyen |

# Open Questions

None. The one deferred question about the decision entry contract is recorded in
`.okf/features/okf-archive-gate.md` and is out of scope here.
