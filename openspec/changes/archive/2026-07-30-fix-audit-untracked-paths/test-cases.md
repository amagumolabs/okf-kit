# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entry | `.okf/features/okf-audit.md` | BR-9 is new; BR-3 and BR-8 already verified |
| Proposal | proposal.md | 5 acceptance criteria |
| Specs | specs/okf-audit/spec.md | one MODIFIED requirement, 6 scenarios |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Tracked path with history behaves as before | BR-1 | UT-001, UT-002 | Covered by the existing suite; no regression expected |
| 2. Present but untracked is reported as not-yet-committed | BR-9 | UT-015 | The case observed on this repository |
| 3. Matching nothing is still reported as matching nothing | BR-3 | UT-012 | Existing test must keep passing |
| 4. A path matching only ignored files counts as matching nothing | BR-9 | UT-016 | Otherwise build output would mask a bad glob forever |
| 5. Verdicts unchanged in every case | BR-8 | UT-015, UT-016, UT-017 | This change alters wording, not judgement |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-9 | okf-audit | UT-015, UT-016, UT-017 | Present-but-uncommitted, ignored-only, and verdict stability |

<!-- BR-1..BR-8 keep their coverage from add-okf-audit; this change does not alter them. -->

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| An impossible comparison is unauditable | A declared path exists but is not committed yet | UT-015, UT-017 | |
| An impossible comparison is unauditable | A declared path matches only ignored files | UT-016 | |
| An impossible comparison is unauditable | A declared path matches nothing in the repository | UT-012 | Unchanged, guards against regression |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-015 | must | Untracked file is not a vanished path | entry declares a path whose file exists in the working tree but was never committed | audit runs | the path appears as not-yet-committed and NOT as matching nothing | BR-9 |
| UT-016 | must | Ignored files do not count as present | entry declares a path matching only files listed in `.gitignore` | audit runs | the path appears as matching nothing | BR-9 |
| UT-017 | must | Verdicts are unaffected | entry with one committed path newer than `verified_at` and one uncommitted path | audit runs | verdict is still `stale` from the committed path, and the uncommitted one is reported separately | BR-8, BR-9 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Integration tests | Same reason as `add-okf-audit`: git is the only boundary and these unit tests drive it against real temporary repositories, including a real `.gitignore`. | danh |
| API E2E | The kit exposes no HTTP or client API. | danh |
| Browser E2E | The kit has no UI. | danh |

# Open Questions

None.
