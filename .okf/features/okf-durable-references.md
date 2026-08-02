---
type: Feature Knowledge
title: okf-durable-references
description: The contract that every reference pointing out of the bundle survives archive, and how the kit tells a real reference apart from prose that merely names a path.
status: stable
verification_state: verified
verified_at: 2026-08-02
verified:
  - by: anthropic/claude-opus-5
    at: 2026-08-02T00:00:00Z
criticality: normal
pending_changes: []
code_paths: [lib/check.mjs]
sources:
  - id: review-2026-08-02
    resource: 'Review conversation 2026-08-02, after archiving moved a change under openspec/changes/archive/: "sau khi archive 1 change, toàn bộ file được di chuyển sang changes/archive. Chúng ta có cần phải thêm prompt để cập nhật reference source/decision cho okf hay không?"'
  - id: change-guard-durable-references
    resource: change:guard-durable-references
linked_changes:
  - guard-durable-references
generated:
  by: anthropic/claude-opus-5
  at: 2026-08-02T00:00:00Z
---

# Summary

The bundle outlives the changes that wrote it. A change directory lives at
`openspec/changes/<id>/` while it is active and is renamed to
`openspec/changes/archive/<date>-<id>/` when it is archived, so any
reference into that directory breaks at exactly the moment the knowledge it
supports becomes historical. This capability is the contract that keeps the
bundle's outbound references durable: a change is cited by identity
(`change:<id>`), never by location, and the kit refuses references it can
prove will dangle. It answers the question "will this pointer still resolve in a
year" mechanically, instead of trusting an author to remember the rename.

# Domain Terms

| Term | Meaning | Source |
| --- | --- | --- |
| Outbound reference | Any pointer from a bundle file to something outside `.okf/` - a source file, a document, a URL, or a change | review-2026-08-02 |
| Durable reference | An outbound reference whose target cannot be moved by a workflow step; a `change:<id>` identity or a path outside `openspec/changes/` | review-2026-08-02 |
| Dangling reference | An outbound reference whose target no longer resolves. Worse than no reference, because it still reads as evidence | review-2026-08-02 |
| Archive rename | The archive step's move of `openspec/changes/<id>/` to `openspec/changes/archive/<date>-<id>/`, which preserves the change id as a suffix but invalidates every path into the directory | review-2026-08-02 |
| Change citation | The durable form `change:<id>`, resolvable against both active and archived changes because the id survives the rename | review-2026-08-02 |
| Locator | A path naming a concrete change directory rather than the shape of one. Always breaks at archive | review-2026-08-02 |
| Mechanism prose | A sentence that names the `openspec/changes/` path shape to explain the workflow rather than to point at a change. Not a reference | review-2026-08-02 |
| Quoted example | A locator inside a fenced code block, written to demonstrate the wrong form. Not a reference either, and the only way to show a violation in writing | review-2026-08-02 |

# Actors And Roles

| Actor | Role In Feature | Notes |
| --- | --- | --- |
| `okf check` | Rejects references it can prove will dangle, in both frontmatter and body | Runs on every invocation, not only at the archive gate - a reference that will break is already wrong while the change is active |
| propose | Writes `sources` provenance when creating or enriching an entry | The step most likely to reach for a path, because the change directory is open in front of it |
| Verification pass | Promotes decisions and writes their provenance | Cites `change:<id>`; the change is about to be archived, so a path written here dangles almost immediately |
| Archive step | Performs the rename that invalidates locators | Never rewrites references; durability is guaranteed at write time, not repaired afterwards |

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | A bundle file MUST cite a change by identity (`change:<id>`), never by a path under `openspec/changes/`. The archive rename preserves the id as a directory suffix but invalidates every path into that directory, so a citation resolves for the life of the repository while a path is guaranteed to break. | review-2026-08-02 |
| BR-2 | The prohibition on locators MUST apply to a bundle file's body, not only to its `sources` frontmatter. Provenance is the most common place to reach for a path, but a sentence in the body dangles identically and is read by exactly the same people. | review-2026-08-02 |
| BR-3 | A locator is distinguished from mechanism prose by the shape of the path itself: a path naming a concrete change directory is a locator and MUST be an error, while the bare `openspec/changes/` form, the bare `openspec/changes/archive/` form, and a path whose change segment is a `<placeholder>` are mechanism prose and MUST be allowed. Discriminating by shape rather than by a list of excused files keeps the rule true for bundles this kit has never seen. | review-2026-08-02 |
| BR-7 | A path naming a concrete directory under `openspec/changes/archive/` MUST be an error too, even though it resolves today. Its stability is an accident of the archive step running only once; the change id is already present in the directory name, so the durable citation is available at no cost, and permitting the path would make the rule mean "cite by identity until archive, then by location". | review-2026-08-02 |
| BR-4 | Fenced code blocks MUST be excluded from the scan. Documentation that teaches this rule has to be able to show the wrong form, and a rule that cannot be written down without violating itself will be worked around instead of obeyed. The bundle's existing hygiene checks already strip fences, so the exclusion is the established reading of "this is quoted, not asserted". | review-2026-08-02 |
| BR-5 | A rule that excuses a specific file by name MUST NOT be used to resolve a false positive. An allowlist records that today's bundle is clean, not that the rule is right, and it silently stops protecting any file added later. Fencing (BR-4) is an exemption the author states in the text; an allowlist is one the author hides in the checker. | review-2026-08-02 |
| BR-6 | The kit MUST NOT claim a reference is correct merely because it is durable. `change:<id>` is checked for shape, not for the existence of that change - an id can be misspelled and still resolve as a well-formed citation. The check reports the failure mode it can prove and stays silent about the one it cannot. | review-2026-08-02 |

# Data Entities

| Entity | Description | Important Fields Or States |
| --- | --- | --- |
| Outbound reference | One pointer out of the bundle, in frontmatter or body | Form (`change:` \| URL \| path \| quote); durable or dangling |
| Bundle file | Any `.md` under `.okf/`, reserved or not | Scanned for locators regardless of whether it is a concept document |

# Workflows

## Primary Workflow

1. An author writes provenance or a cross-reference in a bundle file, in
   `sources` frontmatter or in the body.
2. `okf check` reads every `.md` under `.okf/` and classifies each
   `openspec/changes/` occurrence by shape (BR-3).
3. A concrete change directory is reported as an error naming the durable form
   to use instead (BR-1, BR-2).
4. Mechanism prose passes untouched, so documentation is free to describe the
   very rename the rule exists for (BR-3).

## Alternative Or Failure Workflows

- A reference survives the check but names a change that never existed. The kit
  does not detect this and does not claim to (BR-6); the citation is
  well-formed, which is the only property a shape check can establish.
- A bundle file legitimately needs to show a concrete locator, because it is
  teaching this very rule. The author puts it in a fenced block, where it reads
  as a quoted example rather than an assertion (BR-4):

  ```text
  openspec/changes/add-auth/design.md      <- locator, breaks at archive
  change:add-auth                          <- durable citation
  ```

  No file-level exemption exists for the unfenced case, deliberately (BR-5).

# Risks And Compliance Constraints

| Risk Or Constraint | Impact | Mitigation Or Handling |
| --- | --- | --- |
| A shape-based rule misclassifies a form nobody anticipated | A legitimate sentence becomes unwriteable, and the author is pushed toward disabling the check | The three permitted forms are derived from every occurrence in this bundle, and the error names the fix rather than only the violation |
| Widening the scan from frontmatter to body reaches files that were never checked before | An existing bundle starts failing on content that predates the rule | Verified against this bundle before shipping; all four current occurrences are mechanism prose and stay legal |

# Assumptions

- The archive step's naming (`<date>-<id>`) stays stable. The change id
  surviving as a suffix is what makes `change:<id>` resolvable at all, and
  `okf audit` already depends on the same property.

# Open Questions

- Frontmatter keys other than `sources` are covered by nothing. The body scan
  skips the frontmatter block so one locator is not reported twice, and
  `checkProvenance` reads only `sources[].resource`, so a locator written into
  `code_paths` (or any other key) passes silently. Verified by probe during
  `change:guard-durable-references`, not by a test. The exposure is small - those
  keys hold globs and ids, not documentation - and it predates this change, but
  BR-2's guarantee stops at the body and `sources`, and the gap should close
  rather than be discovered again.
- Whether the check should eventually resolve `change:<id>` against the set of
  active and archived change ids, turning BR-6's acknowledged blind spot into a
  detected error. Deferred: it would couple bundle validation to the presence of
  a change tree, which a distributed bundle may not carry.

# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-08-02 | guard-durable-references | verified | BR-1 lib/check.mjs:209 (frontmatter) and 566-569 (body), tests at test/run.mjs:384,412; BR-2 lib/check.mjs:545-574, tests at 419,424,476,499; BR-3 lib/check.mjs:156-163, tests at 438,443,448,453; BR-4 lib/check.mjs:185 via stripFences, tests at 458,463,471; BR-5 no filename list exists in checkDurableReferences - only the `.md` extension filter at lib/check.mjs:556 - tests at 499 and projectTest 1911; BR-6 no resolution attempted anywhere, test at 490; BR-7 lib/check.mjs:566-568 and changeIdFromLocator:169-174, tests at 517,524. Two implementation defects were caught by the pre-written tests and fixed in code: double reporting of frontmatter locators, and trailing punctuation absorbed into the matched path |
