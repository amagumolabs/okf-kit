## Why

`checkProvenance` already refuses a `sources[].resource` that points under
`openspec/changes/`, because the archive step renames that directory and the
reference dangles. The same sentence written in a bundle file's body passes
untouched — the body scan (`checkHygiene`) looks only for placeholders, empty
table rows, empty bullets, and leftover template comments. The guarantee is
therefore half-enforced: BR-1 holds in frontmatter and is unprotected everywhere
a human actually writes prose, which is precisely where cross-references are
easiest to reach for and hardest to notice once broken (BR-2).

Now, because the gap was found while archiving a change in a downstream project,
and because every reference written before the rule exists becomes a reference
somebody has to hunt down later.

## What Changes

- Add a locator scan over every `.md` file under `.okf/`, reporting an error for
  any path that names a concrete change directory (BR-1, BR-2).
- Discriminate by path shape, not by an excused-file list: the bare
  `openspec/changes/` form, the bare `openspec/changes/archive/` form, and a path
  whose change segment is a placeholder stay legal as mechanism prose (BR-3,
  BR-5).
- Report a concrete path into an already-archived change as well. It resolves
  today, but only because the archive step runs once, and the change id needed
  for the durable form is sitting in the directory name (BR-7).
- Exclude fenced code blocks from the scan, so documentation can show the wrong
  form without tripping the rule that forbids it (BR-4).
- Scan reserved bundle files (`index.md`, `log.md`) too — they are generated,
  but a locator reaching them via a Verification History note dangles the same.
- Specify the whole contract, including the existing frontmatter half, which
  ships today with no capability spec covering it.

Not breaking: the scan is additive, and every occurrence in this bundle today is
mechanism prose that stays legal.

## Capabilities

### New Capabilities

- `okf-durable-references`: the contract that every reference pointing out of
  the bundle survives the archive rename — which forms are durable, how a
  locator is told apart from prose that merely names a path, and what the kit
  refuses to claim about a reference it cannot resolve.

### Modified Capabilities

None. `okf-bundle-format` owns conformance to the OKF specification's frontmatter
shape; reference durability is a kit-local concern about the boundary between the
bundle and the OpenSpec change tree, and folding it in would blur that entry's
purpose. `okf-archive-gate` owns the pre-archive completeness gate, while this
rule runs on every `okf check` invocation — a reference that will break is
already wrong while the change is still active.

## Scope And Non-Goals

**In scope:**

- Detection of locators in both frontmatter and body across every `.md` in `.okf/`.
- An error message that names the durable form to use, matching the wording
  `checkProvenance` already emits.
- A spec for the existing frontmatter rule, which currently has none.

**Non-goals:**

- Resolving `change:<id>` against the set of real change ids. A misspelled id
  stays undetected and the kit does not claim otherwise (BR-6); doing so would
  couple bundle validation to the presence of a change tree that a distributed
  bundle may not carry.
- Rewriting or auto-fixing existing references.
- Extending the scan outside `.okf/` — `CLAUDE.md`, `AGENTS.md`, and
  `docs/openspec-okf-workflow.md` are not bundle files and are not distributed
  as knowledge.

## Acceptance Criteria

1. A path naming a concrete change directory in a bundle file's **body** is
   reported as an error (BR-1, BR-2).
2. A path naming a concrete change directory in `sources[].resource` remains an
   error, with unchanged wording (BR-1).
3. The bare `openspec/changes/` form is not reported (BR-3).
4. The bare `openspec/changes/archive/` form is not reported (BR-3).
5. A path whose change segment is a `<placeholder>` is not reported (BR-3).
6. A locator inside a fenced code block is not reported (BR-4).
7. A locator in `index.md` or `log.md` is reported, despite those files being
   exempt from the concept-document rule.
8. The error names the `change:<id>` form as the fix (BR-1).
9. `okf check` exits clean on this repository's own bundle after the rule lands —
   all four existing occurrences are mechanism prose (BR-3).
10. No file is excused by name anywhere in the implementation (BR-5).
11. A concrete path into a directory under `openspec/changes/archive/` is
    reported, even when that directory exists on disk (BR-7).

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The shape heuristic misclassifies a form nobody anticipated | A legitimate sentence becomes unwriteable and the author reaches for a way to silence the check | The permitted forms are derived from every occurrence in this bundle; fencing (BR-4) gives an honest escape that is visible in the text rather than hidden in the checker |
| Widening the scan to bodies reaches content written before the rule existed | A downstream bundle starts failing on prose that was legal when written | The message states the fix, and the rewrite is mechanical; verified clean against this repository's bundle before shipping |
| Scanning reserved files contradicts their exemption elsewhere | An author reasonably expects `index.md` to be out of scope | The exemption in `checkBundleFiles` is about the `type` frontmatter requirement, not about content; the spec states the difference explicitly |

## Impact

- `lib/check.mjs`: new scan function; `checkProvenance` (lines 152-174) keeps its
  frontmatter role and shares the shape classifier.
- `test/run.mjs`: fixture cases for each acceptance criterion.
- `openspec/specs/okf-durable-references/`: new capability spec.
- `.okf/features/okf-durable-references.md`: new entry, BR-1 to BR-6.
- No CLI surface, dependency, or output-format change. `okf check`'s exit code
  changes only for bundles that already contain a dangling-by-construction
  reference.
