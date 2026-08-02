# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | Primary durable knowledge source - business rules carry BR-n ids |
| Proposal | proposal.md | Scope, non-goals, risks, acceptance criteria |
| Specs | specs/**/*.md | Normative requirements and scenarios |
| Existing harness | test/run.mjs | `test()` builds a temp repo per case; `projectTest()` runs against the kit itself |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Locator in a body is an error | BR-1, BR-2 | UT-004, UT-005 | Paragraph and table cell |
| 2. Locator in `sources` stays an error | BR-1 | UT-001, UT-006 | UT-006 pins the existing wording |
| 3. Bare `openspec/changes/` not reported | BR-3 | UT-007 | |
| 4. Bare `openspec/changes/archive/` not reported | BR-3 | UT-008 | |
| 5. Placeholder segment not reported | BR-3 | UT-009 | |
| 6. Fenced locator not reported | BR-4 | UT-011 | |
| 7. Locator in a reserved file is reported | BR-2 | UT-014, UT-015 | UT-015 pins that the `type` exemption is untouched |
| 8. Error names the `change:<id>` form | BR-1 | UT-003 | |
| 9. This repo's bundle is clean after the rule lands | BR-3, BR-5 | UT-018 | `projectTest` against the kit itself |
| 10. No file excused by name | BR-5 | UT-017, UT-018 | Partially covered - see Not Applicable |
| 11. Path into an archived change is reported | BR-7 | UT-020, UT-021 | |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | okf-durable-references | UT-001, UT-002, UT-003 | Error, accepted form, and message content |
| BR-2 | okf-durable-references | UT-004, UT-005, UT-006, UT-014 | Body, table cell, frontmatter regression, reserved file |
| BR-3 | okf-durable-references | UT-007, UT-008, UT-009, UT-010, UT-018 | Three permitted shapes, one rejected, and the real bundle |
| BR-4 | okf-durable-references | UT-011, UT-012, UT-013 | Fence excludes; fence does not launder frontmatter or later prose |
| BR-5 | okf-durable-references | UT-017, UT-018 | Behavioural half; the absolute claim is a review criterion |
| BR-6 | okf-durable-references | UT-016, UT-019 | Silence on unresolvable ids, and no overstated success output |
| BR-7 | okf-durable-references | UT-020, UT-021 | Archived path reported; existing on disk does not excuse it |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |
| A change is cited by identity | A locator in provenance frontmatter | UT-001 | |
| A change is cited by identity | A durable citation passes | UT-002 | |
| A change is cited by identity | The correction is stated, not just the violation | UT-003 | |
| The prohibition covers body text | A locator in a sentence | UT-004 | |
| The prohibition covers body text | A locator in a table cell | UT-005 | |
| The prohibition covers body text | Frontmatter behaviour is unchanged | UT-006 | |
| Reserved files are scanned | A locator reaches a generated file | UT-014 | `log.md` |
| Reserved files are scanned | The type exemption still holds | UT-015 | |
| Told apart by shape | The bare form is prose | UT-007 | |
| Told apart by shape | The bare archive form is prose | UT-008 | |
| Told apart by shape | A placeholder segment is prose | UT-009 | |
| Told apart by shape | A concrete segment is a locator | UT-010 | |
| A path into an archived change | A path into an archived change directory | UT-020 | |
| A path into an archived change | Resolving today is not sufficient | UT-021 | Archived dir created on disk in the fixture |
| Fenced blocks excluded | A demonstrated violation | UT-011 | |
| Fenced blocks excluded | Fencing does not launder frontmatter | UT-012 | |
| Fenced blocks excluded | Prose after a fence is still scanned | UT-013 | |
| No file excused by name | This repository's own bundle passes on merit | UT-018 | |
| No file excused by name | A new file gets the same protection | UT-017 | |
| Correctness beyond shape not claimed | A misspelled change id | UT-016 | |
| Correctness beyond shape not claimed | No overstated success message | UT-019 | |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | must | Locator in provenance | A fixture entry whose `sources[].resource` is `openspec/changes/add-mfa/design.md` | `check()` runs | An error fires for that entry | BR-1 |
| UT-002 | must | Durable citation accepted | An entry citing `change:add-mfa` | `check()` runs | No reference error fires | BR-1 |
| UT-003 | must | Message names the fix | Any fixture containing a locator | `check()` runs | The message matches `change:<change-id>` | BR-1 |
| UT-004 | must | Locator in prose | An entry whose Summary names `openspec/changes/add-mfa/proposal.md` | `check()` runs | An error fires for that entry | BR-2 |
| UT-005 | must | Locator in a table cell | An entry with a locator inside a Domain Terms row | `check()` runs | An error fires for that entry | BR-2 |
| UT-006 | must | Frontmatter path unregressed | The pre-existing provenance fixture, unmodified | `check()` runs | The same single error fires, with unchanged wording | BR-2 |
| UT-007 | must | Bare prefix is prose | An entry saying a reference must never sit under `openspec/changes/` | `check()` runs | No reference error fires | BR-3 |
| UT-008 | must | Bare archive form is prose | An entry saying archiving moves a change under `openspec/changes/archive/` | `check()` runs | No reference error fires | BR-3 |
| UT-009 | must | Placeholder segment is prose | An entry writing the shape with its change segment in angle brackets | `check()` runs | No reference error fires | BR-3 |
| UT-010 | must | Concrete segment is a locator | An entry naming `openspec/changes/some-change/` with no file suffix | `check()` runs | An error fires - a directory is enough, a file suffix is not required | BR-3 |
| UT-011 | must | Fenced example excluded | An entry with a locator inside a fenced block | `check()` runs | No reference error fires | BR-4 |
| UT-012 | must | Fence does not launder frontmatter | An entry with a fenced block AND a locator in `sources` | `check()` runs | The frontmatter error still fires | BR-4 |
| UT-013 | must | Prose after a fence still scanned | An entry with a closed fence followed by a locator sentence | `check()` runs | An error fires for the sentence | BR-4 |
| UT-014 | must | Reserved file scanned | A fixture `log.md` containing a locator | `check()` runs | An error fires for `log.md` | BR-2 |
| UT-015 | must | Type exemption intact | A fixture `index.md` with no `type` in frontmatter | `check()` runs | No concept-document error fires for it | BR-2 |
| UT-016 | must | Unresolvable id is silent | An entry citing `change:no-such-change-anywhere` | `check()` runs | No error and no warning fires for that reference | BR-6 |
| UT-017 | must | A new file is scanned | A bundle file added under `.okf/` that no fixture knew about, containing a locator | `check()` runs | An error fires for it | BR-5 |
| UT-018 | must | The kit's own bundle is clean | This repository, unmodified (`projectTest`) | `check()` runs over `.okf/` | Zero reference errors, because every occurrence matches a permitted shape | BR-3, BR-5 |
| UT-019 | must | No overstated success | A bundle whose references are all durable | `check()` runs | No finding claims that references resolve or were validated | BR-6 |
| UT-020 | must | Archived path is a locator | An entry naming `openspec/changes/archive/2026-01-01-add-mfa/design.md` | `check()` runs | An error fires | BR-7 |
| UT-021 | must | Existing on disk does not excuse | The same fixture, with that archived directory actually created | `check()` runs | The error still fires | BR-7 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-001 | must | A locator inside an HTML comment in a bundle file | No error - `checkHygiene` already strips comments, and the reference scan matches that reading of "not asserted" | BR-4 |
| NEG-002 | must | The literal string `openspec/changes` with no trailing slash | No error - it names the tree, not a change | BR-3 |
| NEG-003 | should | A locator appearing twice in one file | The file is reported; the count of findings is not asserted, so message-per-occurrence stays an implementation choice | BR-2 |
| NEG-004 | must | An empty bundle with no `.md` files | No error and no crash | BR-2 |
| NEG-005 | must | A `.tmpl` file under `.okf/templates/` containing a locator | No error - the scan is over `.md` files, and templates are not bundle knowledge | BR-2 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Integration tests | The kit is one dependency-free module with no services, database, or network. Each `test()` case builds a real repo on disk and runs `check()` across the whole file walk, which crosses every boundary this change touches; the harness classifies those as unit tests. A separate integration layer would re-run identical code paths under a second name. This follows the same call recorded in `change:enforce-decision-promotion`. | Danh Nguyen |
| API E2E | The kit has no HTTP surface; every command is a local CLI over the filesystem. | Danh Nguyen |
| Browser E2E | `okf` is a CLI with no UI. | Danh Nguyen |
| Acceptance criterion 10, the absolute half ("no file excused by name **anywhere** in the implementation") | A test can prove that specific files are scanned (UT-017, UT-018), but it cannot prove the absence of an exemption list without asserting on the shape of the source, which any refactor would break while the exemption survived. The claim is a code-review criterion, recorded in verification.md against the diff. | Danh Nguyen |

# Open Questions

None. The archived-path boundary that surfaced while writing this matrix is settled as BR-7 and specified.
