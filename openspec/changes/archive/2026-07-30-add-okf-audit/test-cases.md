# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entry | `.okf/features/okf-audit.md` | BR-1 through BR-8 |
| Proposal | proposal.md | 10 acceptance criteria |
| Specs | specs/okf-audit/spec.md | 5 requirements, 14 scenarios |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Newer commit reported stale, naming path and date | BR-1 | UT-001 | The report must identify the trigger, not just the verdict |
| 2. Older commit reported current | BR-1 | UT-002 |  |
| 3. Same-date commit reported current | BR-2 | UT-003 | The tie-break that keeps verification from making itself stale |
| 4. Empty code_paths reported unauditable | BR-3, BR-8 | UT-004, UT-013, UT-014 | Widened during verification: any comparison that cannot be made |
| 5. Unverified and needs-revision skipped | BR-4 | UT-005 |  |
| 6. Deprecated skipped | BR-5 | UT-006 |  |
| 7. Entry files byte-identical after a run | BR-6 | UT-007 |  |
| 8. Uncommitted change is not staleness | BR-7 | UT-008 |  |
| 9. Exit non-zero only when something is stale | BR-1 | UT-009, UT-010 |  |
| 10. Outside a git repo, report failure and exit non-zero | BR-3 | UT-011 | Reporting entries as current here would be the worst possible lie |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | okf-audit | UT-001, UT-002, UT-009, UT-010 | Stale detection and its exit status |
| BR-2 | okf-audit | UT-003 | Same-day tie-break |
| BR-3 | okf-audit | UT-004, UT-011, UT-012 | "Cannot tell" must never read as "fine" |
| BR-4 | okf-audit | UT-005 |  |
| BR-5 | okf-audit | UT-006 |  |
| BR-6 | okf-audit | UT-007 | Read-only guarantee |
| BR-7 | okf-audit | UT-008 | Committed history only |
| BR-8 | okf-audit | UT-004, UT-013, UT-014 | Every impossible comparison, not just the empty-paths case |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| Staleness from committed history | A declared path has a newer commit | UT-001 |  |
| Staleness from committed history | All declared paths predate verification | UT-002 |  |
| Staleness from committed history | A commit lands on the verification date | UT-003 |  |
| Staleness from committed history | A declared path has uncommitted edits | UT-008 |  |
| Impossible comparison is unauditable | A verified entry declares no paths | UT-004 |  |
| Impossible comparison is unauditable | A verified entry has no verification date | UT-013 |  |
| Impossible comparison is unauditable | Declared paths have no commit history | UT-014 |  |
| Impossible comparison is unauditable | A declared path matches nothing | UT-012 |  |
| Only verified active entries | An unverified entry | UT-005 |  |
| Only verified active entries | A deprecated but verified entry | UT-006 |  |
| Never modifies knowledge | Auditing with stale entries present | UT-007 |  |
| Exit status | At least one stale entry | UT-009 |  |
| Exit status | No stale entries | UT-010 |  |
| Exit status | Not a git repository | UT-011 |  |

# Unit Test Cases

<!-- These exercise the audit through its module boundary (lib/audit.mjs), against a real temporary git repository. -->

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | must | Newer commit is stale | entry verified 2026-07-01, declared path committed 2026-07-20 | audit runs | verdict `stale`, and the result names that path and 2026-07-20 | BR-1 |
| UT-002 | must | Older commit is current | entry verified 2026-07-20, declared path last committed 2026-07-01 | audit runs | verdict `current` | BR-1 |
| UT-003 | must | Same-date commit is current | entry verified 2026-07-20, declared path committed 2026-07-20 | audit runs | verdict `current` | BR-2 |
| UT-004 | must | No declared paths is unauditable | verified entry with `code_paths: []` | audit runs | verdict `unauditable`, never `current` or `stale` | BR-3 |
| UT-005 | must | Unverified entries are skipped | entries with `unverified` and `needs-revision` | audit runs | both verdicts `skipped` | BR-4 |
| UT-006 | must | Deprecated entries are skipped | verified entry with `status: deprecated` and a newer commit | audit runs | verdict `skipped`, not `stale` | BR-5 |
| UT-007 | must | The audit is read-only | repository containing a stale entry | audit runs | every `.okf/features/*.md` byte-identical before and after | BR-6 |
| UT-008 | must | Uncommitted work is not drift | entry verified after the last commit, declared path edited but not committed | audit runs | verdict `current` | BR-7 |
| UT-009 | must | Stale means non-zero exit | at least one stale entry | audit runs | `stale` count above zero, signalling non-zero exit | BR-1 |
| UT-010 | must | Unauditable alone is a zero exit | entries only `unauditable` and `skipped` | audit runs | `stale` count zero | BR-1, BR-3 |
| UT-011 | must | No git means failure, not success | directory that is not a git repository | audit runs | result reports it could not run; no entry reported `current` | BR-3 |
| UT-012 | should | A vanished path is reported | entry declares a path matching no file | audit runs | the result flags that path as matching nothing | BR-3 |
| UT-013 | must | No verification date is unauditable | verified entry with empty `verified_at` and a declared path | audit runs | verdict `unauditable`, never `current` | BR-8 |
| UT-014 | must | No commit history is unauditable | verified entry whose declared paths have no commits | audit runs | verdict `unauditable`, never `current` | BR-8 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Integration tests | The audit has exactly one external boundary, the git binary, and the unit tests already drive it against real temporary repositories rather than a mock. A separate integration layer would re-run the same assertions through a second harness. | danh |
| API E2E | The kit exposes no HTTP or client API. | danh |
| Browser E2E | The kit has no UI. | danh |

# Open Questions

None. Behavior was settled as business rules before these cases were written.
