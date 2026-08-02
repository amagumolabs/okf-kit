## Context

`lib/check.mjs` already holds both halves of the machinery this change needs.
`checkProvenance` (lines 152-174) classifies `sources[].resource` values and
rejects paths under `openspec/changes/` with a message that names the durable
form. `checkHygiene` (lines 176-209) walks a bundle file's body after
`stripFences(stripComments(text))`, looking for placeholders, blank table rows,
bare bullets, and leftover template comments. Neither reaches the other's
territory: provenance never sees prose, hygiene never looks for references.

`checkBundleFiles` (line 458) already walks every `.md` under `.okf/` and skips
`RESERVED_BUNDLE_FILES` (line 470), but only to enforce the `type` frontmatter
requirement. The walker is reusable; the skip is not, because reserved files hold
prose that can dangle just as easily.

Constraints: no dependencies (the kit is dependency-free), no change to the
report's shape, and the rule has to be true for bundles this kit has never seen —
`okf check` runs in downstream repositories whose prose nobody here has read.

Stakeholders: every downstream repo running `okf check` in CI, and the CI job in
this repo, which will run the new rule against its own bundle first.

## Goals / Non-Goals

**Goals:**

- One shape classifier used by both the frontmatter path and the new body path,
  so the two halves cannot drift apart into different definitions of "locator".
- A rule whose correctness does not depend on the contents of any particular
  bundle.
- An escape hatch that is visible in the document rather than in the checker.

**Non-Goals:**

- Resolving change ids (BR-6). Deliberately out of scope; see the proposal.
- Auto-fixing. The rewrite is a judgement about what the sentence meant.
- Scanning outside `.okf/`.

## Decisions

### D1 — Discriminate by path shape, not by an excused-file list

**Choice:** Classify each `openspec/changes/` occurrence by what follows the
prefix. Nothing at all, a bare `archive/`, and a segment in angle brackets are
prose; a literal segment is a locator. `archive/` followed by a literal segment
is also a locator, so the classifier recurses one level rather than treating
`archive/` as a blanket exemption (BR-7).

**Why not an allowlist:** The four occurrences in this bundle today are all
mechanism prose, so an allowlist naming those four files would pass CI
immediately. It would also be wrong: it records that today's bundle is clean, not
that the rule is right, and it stops protecting the moment a fifth file is added.
A shape rule is a statement about references; a file list is a statement about
one snapshot of one repository (BR-3, BR-5).

**Survives this change:** Yes → promote at verification. This is the general
principle for every future bundle-content check, not a detail of this one.

### D2 — Fenced code blocks are the sanctioned escape hatch

**Choice:** Strip fences before the body scan, reusing the `stripFences` helper
`checkHygiene` already applies.

**Why:** The rule has to be documentable. The OKF entry for this capability
cannot explain what a locator is without writing one down, and a rule that
cannot be stated without violating itself gets disabled rather than obeyed. A
fence is already the bundle's established marker for "quoted, not asserted", so
this adds no new concept. Crucially it is an exemption the author declares in the
text, where a reviewer sees it — unlike an allowlist, which hides the same
decision in the checker (BR-4, BR-5).

**Alternative rejected:** An inline-code exemption (single backticks). Too broad
— most real locators would be written in backticks anyway, so it would exempt
the common case rather than the rare one.

**Survives this change:** Yes → promote at verification. It sets how every
future content rule in the bundle handles its own documentation.

### D3 — Reserved files are scanned, and the existing exemption is narrowed in meaning

**Choice:** The new scan walks every `.md` under `.okf/` including `index.md` and
`log.md`. `RESERVED_BUNDLE_FILES` keeps its role in `checkBundleFiles` only.

**Why:** `log.md` is generated from Verification History evidence, which is
free text an author writes. A locator can reach it without anyone editing it
directly. The reserved-file exemption exists because those files carry structural
rather than concept content — that says nothing about whether their references
resolve.

**Survives this change:** Yes → promote at verification. It draws a line between
"exempt from frontmatter requirements" and "exempt from content rules" that
future checks will need.

### D4 — The scan lives in its own function, called from the bundle walk

**Choice:** A new `checkDurableReferences(root, report)` alongside
`checkBundleFiles`, rather than an extra branch inside `checkHygiene`.

**Why:** `checkHygiene` receives already-extracted text and is called per entry
type; this rule needs its own file set (reserved files included, per D3). Keeping
it separate also keeps the shared classifier callable from `checkProvenance`
without a circular arrangement.

**Survives this change:** No — internal code organisation, change-local.

## Risks / Trade-offs

- [The shape rule rejects a form somebody legitimately needs and nobody
  anticipated] → The error names both the durable form and, indirectly, the
  fence; D2 guarantees a way to write the sentence without silencing the check.
- [A downstream bundle starts failing on prose that was legal when written] →
  The failure is an error, not a warning, and that is deliberate: the reference
  is already broken-by-construction, so a warning would let it be archived. The
  fix is mechanical and the message states it.
- [Two definitions of "locator" drift] → Mitigated by construction: one exported
  classifier, called from both paths (D1).
- [`stripFences` behaves differently from what a reader expects for nested or
  malformed fences] → Accepted. Matching `checkHygiene` exactly is worth more
  than being independently correct, because two fence rules in one file would be
  the more confusing failure.

## Migration Plan

1. Land the classifier and the frontmatter refactor with no behaviour change;
   the existing provenance tests must stay green untouched.
2. Add the body scan.
3. Run `okf check` against this repository's bundle — expected clean, since all
   four occurrences are mechanism prose. A failure here means D1's shape rule is
   wrong, not that the bundle is.
4. Rollback: the scan is one call site; removing it restores prior behaviour
   with no data migration, since nothing is written.

No downstream migration step. Unlike the v0.3.0 frontmatter change, this rule
writes nothing and requires no `okf migrate` run.

## Open Questions

- Whether the same rule should eventually cover `CLAUDE.md`, `AGENTS.md`, and
  `docs/openspec-okf-workflow.md`. They contain the same path shapes and are
  kit-owned, but they are not distributed as bundle knowledge, and the v0.3.1
  uppercase-path guard already walks kit-owned files for a different pattern —
  the two could merge later. Out of scope here.
