# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` | BR-1..BR-6 in `artifact-hygiene` |
| Proposal | proposal.md | Six acceptance criteria |
| Specs | specs/artifact-hygiene/spec.md | Three ADDED requirements |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Placeholder in a change artifact: warn, then error | BR-1, BR-5 | UT-201, UT-202 | |
| 2. Placeholder in a code span is not residue | BR-2, BR-3, BR-4 | UT-203, UT-204, UT-205 | UT-205 covers the bundle-file half |
| 3. Blank row and bare list item | BR-1, BR-5 | UT-206, NEG-201 | |
| 4. Instruction comment warns then errors | BR-6 | UT-207 | |
| 5. No excused-file list | BR-3 | UT-208 | Structural, over the implementation's source |
| 6. This repository passes | BR-1 | IT-201 | |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | artifact-hygiene | UT-201, UT-206, UT-209, IT-201 | UT-209 is the archived-changes exclusion |
| BR-2 | artifact-hygiene | UT-203, UT-204, UT-210 | UT-210 is the comment finding, the one residue check quoting did not reach |
| BR-3 | artifact-hygiene | UT-208 | |
| BR-4 | artifact-hygiene | UT-203, UT-205 | |
| BR-5 | artifact-hygiene | UT-202, UT-207 | |
| BR-6 | artifact-hygiene | UT-207, UT-210 | |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs |
| --- | --- | --- |
| Hygiene applies to change artifacts | A placeholder before archive | UT-201 |
| Hygiene applies to change artifacts | The same placeholder at archive | UT-202 |
| Hygiene applies to change artifacts | A blank table row | UT-206 |
| Hygiene applies to change artifacts | An archived change is left alone | UT-209 |
| Quoted template text is not residue | Named inside an inline code span | UT-203 |
| Quoted template text is not residue | Shown inside a fenced block | UT-204 |
| Quoted template text is not residue | The same exemption for bundle files | UT-205 |
| Quoted template text is not residue | No file excused by name | UT-208 |
| A shipped instruction comment is residue at archive | During the change | UT-207 |
| A shipped instruction comment is residue at archive | At archive | UT-207 |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-200 | must | The clean fixture stays clean | The fixture's change artifacts carry no residue | `okf check --archive` runs | No hygiene finding on any change artifact | BR-1 |
| UT-201 | must | Placeholder warns in flight | `proposal.md` carries an unfilled placeholder | `okf check` runs | A warning names it, and the run has no error | BR-1, BR-5 |
| UT-202 | must | Placeholder errors at archive | The same fixture | `okf check --archive` runs | An error names it | BR-5 |
| UT-203 | must | Code span exempts | `design.md` names a placeholder inside backticks | `okf check --archive` runs | Nothing is reported | BR-2, BR-4 |
| UT-204 | must | Fence exempts | `design.md` shows an unfilled template inside a fenced block | `okf check --archive` runs | Nothing is reported | BR-2 |
| UT-205 | must | The exemption is not location-specific | A `.okf/features/` entry names a placeholder inside backticks | `okf check` runs | Nothing is reported | BR-4 |
| UT-206 | must | Blank table row in a change artifact | `test-cases.md` carries a row whose every cell is empty | `okf check --archive` runs | An error names it | BR-1 |
| UT-207 | must | Instruction comment escalates | An artifact still carries the comment its template shipped | `okf check`, then `okf check --archive` | Warning, then error | BR-6 |
| UT-208 | must | No excused-file list | The implementation's source | It is read | It contains no file name or path exempt from the scan | BR-3 |
| UT-209 | must | Archived changes are skipped | A directory under `openspec/changes/archive/` carries residue | `okf check --archive` runs | Nothing is reported for it | BR-1 |
| UT-210 | must | Quoting reaches the comment finding too | A change artifact and a bundle entry each name the template marker inside backticks | `okf check --archive` runs | Nothing is reported, and a real leftover comment is still reported | BR-2, BR-6 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-201 | must | This repository stays clean | The real repo after implementation | `okf check` runs | Every finding produced is a real one, and the active changes carry none | BR-1 |
| IT-202 | must | Nothing pre-existing regressed | The full suite | `npm test` runs | Every prior assertion still passes | BR-1..BR-6 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-201 | must | A bare `-` list item in a change artifact | Reported on the placeholder escalation | BR-1 |
| NEG-202 | must | An autolink `<https://example.com>` in a change artifact | Not reported - inherited from the existing heuristic's autolink skip | BR-1 |
| NEG-203 | must | A stray HTML tag such as `<br>` in a change artifact | Not reported - inherited from the existing stray-tag skip | BR-1 |
| NEG-204 | should | A fenced block containing a backtick, followed by a real placeholder | The placeholder is still reported - fences are stripped before spans, so the ordering cannot swallow the rest of the file | BR-4 |
| NEG-205 | should | An unbalanced backtick before a real placeholder | The placeholder is still reported | BR-4 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Browser E2E | The kit is a command-line validator with no UI surface | change author |
| API E2E | The kit exposes no network interface; `bin/okf.mjs` is its only entry point | change author |

# Open Questions

None. Whether the scan reaches `openspec/specs/` is deferred on the entry and
does not block these tests.
