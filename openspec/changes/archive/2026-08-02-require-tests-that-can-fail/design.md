## Context

`checkTestPlan` (`lib/check.mjs:926`) walks every table in a test-plan, resolves
its status columns by header name, and validates the vocabulary. It already knows
about `archiveMode`, but only reads it at the very end, for the Known Gaps
comparison. Everything the status loop finds is unconditional: an unknown word is
always an error, a `failing` with no assertion message is always a warning.

This change adds two more things the loop must judge, and both share a property
with the `failing` message that the current code does not express: they are
records that must exist by the time the change is archived, and that a change
still in flight should be free to leave incomplete. The requirement to settle here
is what "must exist eventually" means mechanically, because three checks are about
to depend on the answer and every later one will copy whatever this change does.

## Goals / Non-Goals

**Goals:**

- One enforcement shape for every record the plan requires, rather than three
  checks that each picked a severity.
- The falsifier lands where the checker can already see it and where a `BR-n` is
  already cited, so no new parsing surface appears.
- The positional column read at `lib/check.mjs:1014` stops being the one exception
  to how this file resolves columns.

**Non-Goals:**

- Judging whether a stated reason or falsifier is apt.
- Re-checking already archived changes. Archived plans predate the `Falsified By`
  column and are not rewritten.

## Decisions

### Records harden at the archive boundary, uniformly

A record the plan requires is a **warning** while the change is in flight, and it
becomes an **error** under `okf check --archive`. Applied to all three: a bare
`passing` initial status, an empty `Falsified By`, and a `failing` with no
assertion message.

The precedent already exists and is stated in the spec — a row with a live status
and an empty `Initial Status` warns, and the requirement says why in as many words:
"does not emit an error, so a change already in flight is not blocked". The
alternatives both break something real:

| Option | Why not |
| --- | --- |
| Always an error | A test-plan is written before implementation, when the assertion message and the initial status are not knowable yet. The gate would report errors for a plan doing exactly what the gate asks. |
| Always a warning | What BR-3 states as a MUST can be archived unmet, which is the hole this change is closing. `--archive` is the only moment the kit gets to insist. |
| Per-check severity, chosen case by case | Three checks, three answers, and the fourth author guesses. The severity stops carrying information. |

This decision outlives the change: every check added to this kit inherits it, so
it is promoted to `.okf/decisions/` during verification.

### The falsifier lives in the test-plan, not in test-cases

`test-cases.md` describes behaviour — Given/When/Then, seven columns, derived from
the specs. `test-plan.md` records the mechanics of a specific test: its file, its
name, its status, its `BR-n`. The falsifier is a claim about the implementation,
so it belongs with the mechanics.

Two practical reasons reinforce it: the Pre-Implementation Unit Tests table is
already parsed by `checkTestPlan`, so nothing new has to learn to read a table;
and an eighth column on a seven-column behaviour table would be filled from the
scenario text rather than thought about.

Promoted to `.okf/decisions/` during verification — it fixes which artifact owns
an implementation-facing record, and the next artifact to grow a column will face
the same question.

### Only the unit test table carries a falsifier

Integration and E2E rows legitimately start as `skeleton`, before the harness
exists and often before the assertion is decided. Asking for the production change
that would break a test nobody has written yet produces a sentence copied from the
test name. The unit tests are the ones BR-3 requires to reach the red state, so
they are the ones for which the question has a real answer at the time it is asked.

### Presence is checked, aptness is not

Unchanged from how the gate already treats `BR-n` evidence and the `Ground` column,
and restated here so that a later change does not read the new checks as an
unfinished attempt at judging content. The kit's stated limit applies: a check
confirms the record exists and is shaped correctly; a reviewer decides whether it
is true.

### Column resolution moves to one helper

`lib/check.mjs:1014` reads the Known Gaps owner as `cells[3]`. Every other lookup
in the file goes through `columnIndex(header, /re/)`. The positional read is
correct only for the current template, fails silently if the columns are reordered,
and reports nothing when it fails — the worst combination available. It becomes a
header-name lookup like the rest.

## Risks / Trade-offs

- **A warning nobody reads is the same as no check** → The three warnings appear on
  every `okf check` run from the moment the plan exists, and `--archive` is a hard
  stop, so the message is old news by the time it blocks anything.
- **`Falsified By` is filled with the test's own description** → The template shows
  a worked answer that names a production change, and the entry states the failure
  mode by name (a tautological test). Aptness stays a review question, which the
  change says openly rather than implying a guarantee.
- **The ten-character minimum for a reason is arbitrary** → It is, and it is
  deliberately the same arbitrary threshold `testChangeGround` already uses for a
  declared mechanical defect. One arbitrary constant used twice is a convention;
  two different ones are a bug waiting to be reported.

## Migration Plan

No migration. The new column is required only in test-plans written after this
change; archived plans are not re-checked, and `okf check` on this repository must
stay clean, which acceptance criterion 8 tests.

## Open Questions

None.
