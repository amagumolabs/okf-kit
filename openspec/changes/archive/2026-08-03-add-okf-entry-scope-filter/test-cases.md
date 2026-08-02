# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` | BR-14..BR-17 in `okf-bundle-format` |
| Proposal | proposal.md | Eight acceptance criteria |
| Specs | specs/okf-bundle-format/spec.md | Four ADDED requirements |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Instruction names what does not belong, and where it goes | BR-14 | UT-501 | |
| 2. Durability test, not truth test | BR-15 | UT-502 | |
| 3. Feature template carries the filter | BR-14 | UT-503 | |
| 4. Verification section review removes leaked detail | BR-14 | UT-504 | |
| 5. No re-asking what the entry answers | BR-16 | UT-505 | |
| 6. Assumptions and Open Questions generate questions | BR-17 | UT-506 | |
| 7. Addendum states both, identically in both files | BR-16, BR-17 | UT-507 | |
| 8. No new check | - | UT-508 | The requirement that this change adds no finding |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-14 | okf-bundle-format | UT-501, UT-503, UT-504 | |
| BR-15 | okf-bundle-format | UT-502 | |
| BR-16 | okf-bundle-format | UT-505, UT-507 | |
| BR-17 | okf-bundle-format | UT-506, UT-507 | Always asserted alongside BR-16, because the rule read alone produces assuming instead of asking |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs |
| --- | --- | --- |
| The workflow states what does not belong | An agent reads the okf-link instruction | UT-501 |
| The workflow states what does not belong | The durability test is stated as durability | UT-502 |
| The workflow states what does not belong | An agent reads the feature template | UT-503 |
| The verification pass removes leaked detail | An agent reads the verification instruction | UT-504 |
| A step does not re-ask what the entry answers | An agent reads the proposal instruction | UT-505 |
| A step does not re-ask what the entry answers | The other half is stated with it | UT-506 |
| A step does not re-ask what the entry answers | The addendum agrees with itself | UT-507 |
| This change adds no check | The checker is untouched | UT-508 |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-501 | must | The filter is stated | The shipped schema | The `okf-link` instruction is read | It names content that does not belong and names its destination | BR-14 |
| UT-502 | must | Durability, not truth | The same instruction | It is read | Its test asks whether a second change would need the content, not whether it is correct | BR-15 |
| UT-503 | must | The template agrees | `.okf/templates/feature.md.tmpl` | It is read | Its header comment carries the same filter | BR-14 |
| UT-504 | must | Section review removes leakage | The `verification` instruction | It is read | Its section-review step directs removal of change-local detail | BR-14 |
| UT-505 | must | No re-asking | The `proposal` instruction | It is read | It states that a question the entry answers is not put to the user | BR-16 |
| UT-506 | must | The other half | The same instruction | It is read | It names Assumptions and Open Questions as what generates a question | BR-17 |
| UT-507 | must | The addendum agrees with itself | Both marker files | Their okf-kit blocks are compared | They are byte-identical and both carry the rule | BR-16, BR-17 |
| UT-508 | must | No new finding | The clean fixture | `okf check --archive` runs | The finding count is unchanged from before this change | - |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-501 | must | This repository is unaffected | The real repo | `okf check` runs | The finding count is unchanged | - |
| IT-502 | must | Nothing pre-existing regressed | The full suite | `npm test` | Every prior assertion still passes | BR-14..BR-17 |

# Negative And Boundary Cases

| Class | ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- | --- |
| Absence | NEG-501 | must | The addendum present in one marker file and absent from the other | The existing marker-agreement assertion fails, which is what makes UT-507 more than a spot check | BR-16 |
| Duplication | NEG-502 | should | The filter stated in both `okf-link` and `proposal` instructions | Accepted but not required; the assertion targets `okf-link`, because that is where an entry is created | BR-14 |
| Numeric edge | - | - | - | Not Applicable - this change ships prose | BR-14 |
| Staleness | - | - | - | Not Applicable - the assertions read shipped files at test time | BR-14 |
| Authorisation | - | - | - | Not Applicable - the kit has no actors or permissions | BR-14 |
| Scope isolation | - | - | - | Not Applicable - no cross-boundary data | BR-14 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Browser E2E | The kit is a command-line validator with no user interface | change author |
| API E2E | The kit exposes no network interface | change author |
| Numeric edge, Staleness, Authorisation, Scope isolation | This change ships instruction and template prose. It reads no number, caches nothing, has no actors, and holds no cross-boundary data | change author |

# Open Questions

None. Whether `okf audit` could flag fast-growing entries is deferred on the
entry and does not block these tests.
