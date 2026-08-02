## Why

The test-first gate proves that a test was written before the code it guards, and
proves nothing about whether that test could ever have failed. A row that reads
`Initial Status: passing` satisfies BR-6 in full while reporting that the test was
green before its implementation existed, and `okf check` says nothing. A test whose
expected value is recomputed the way the code computes it satisfies every rule in
the entry and can never disagree with the implementation. Both produce a change
that reads as thoroughly tested and refutes nothing — the same outcome as writing
no test at all, reached by a more expensive route.

Two external TDD skills were audited against this gate (`skill-obra-tdd`,
`skill-mattpocock-tdd`). Almost everything they prescribe the gate already
enforces, and more strictly. These two holes are what they have that it does not.

## What Changes

- Add BR-11: a pre-implementation unit test whose initial status is `passing`
  states why, in the `status: reason` shape the plan already uses for `failing`.
- Add BR-12: every pre-implementation unit test row names the production change
  that would make it fail, in a new `Falsified By` column. `okf check` enforces
  presence, never aptness.
- Apply one enforcement shape to all three of these records, including the
  existing "`failing` with no assertion message" case: a warning during
  implementation, an error under `--archive`. It follows the precedent already set
  for a missing `Initial Status` — a change in flight is not blocked — while
  closing the hole that lets BR-3, stated as a MUST, be archived unmet.
- Template and instruction only, no new rule: name the grounds BR-8 excludes
  ("already tested it manually", "will add the test after", "too much time spent to
  start over", "this case is different"), and state that assertions run on real
  behaviour rather than on mock call counts.
- Fix `lib/check.mjs:1014`, which resolves the Known Gaps Owner column by position
  while every other column lookup in the file resolves by header name.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `test-first-gate`: adds BR-11 and BR-12, and tightens the enforcement of BR-3 at
  the archive boundary from a warning to an error.

## Scope And Non-Goals

**In scope:**

- `.okf/features/test-first-gate.md` — BR-11, BR-12, and the terms they introduce.
- `lib/check.mjs` — the initial-status shape check, the falsifier presence check,
  the warning-to-error change, and the positional-column fix.
- `openspec/schemas/okf-gated-feature/templates/test-plan.md` — the `Falsified By`
  column and the excluded-grounds list.
- `openspec/schemas/okf-gated-feature/schema.yaml` — the `test-plan` and
  `test-cases` instructions.
- `docs/openspec-okf-workflow.md` — the gate's stated boundary.

**Non-goals:**

- A Seams table naming the boundaries under test before writing them. It is advice
  the workflow cannot hold to account, and the `test-cases` instruction already
  prefers public contracts over internals.
- The Iron Law — deleting production code written before its test. The kit
  deliberately cannot verify ordering (see the decision *the kit records test
  ordering; it does not verify it*), and a rule it cannot see broken is a rule that
  weakens the ones it can.
- Vertical-slice looping (one test, one implementation, repeat). It contradicts
  BR-4, which requires every planned test file to exist before implementation
  starts.
- Judging whether a stated reason or falsifier is apt. That stays a review
  question, in line with how the gate already treats `BR-n` evidence.

## Acceptance Criteria

1. A test-plan row whose `Initial Status` is the bare word `passing` warns in a
   normal run and errors under `okf check --archive` (BR-11).
2. The same row written as `passing: <reason>` passes; a reason under ten
   characters does not (BR-11).
3. A Pre-Implementation Unit Tests row with an empty `Falsified By` cell warns in a
   normal run and errors under `okf check --archive` (BR-12).
4. A test-plan with no `Falsified By` column at all is reported once for the table,
   not once per row (BR-12).
5. `failing` with no assertion message keeps its warning in a normal run and
   becomes an error under `okf check --archive` (BR-3).
6. A Known Gaps table whose columns are reordered is still read correctly: the
   Owner column is found by name.
7. The template carries the `Falsified By` column, the excluded grounds, and the
   mock sentence, and the schema instructions say the same thing the template shows
   (BR-7 applies: no artifact asks for something no instruction produces).
8. `okf check` on this repository reports no new errors, and every existing test
   still passes.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| `Falsified By` degenerates into restating the test name | The column is filled everywhere and means nothing, and the gate looks stronger than it is | The entry states plainly that presence is checked and aptness is not (BR-12), the same limit the gate already declares for `BR-n` evidence; the template shows a worked answer naming a production change, not a behaviour |
| Raising the assertion-message warning to an error breaks an in-flight change at its archive step | Someone is blocked at the last gate by a rule that was advisory when they wrote the plan | Only `--archive` becomes an error; normal runs stay a warning, so the message appears throughout implementation and the archive step is never the first time it is seen. This repository has no unarchived changes |
| A new required column invalidates test-plans already written against the old template | Existing archived changes start reporting errors they cannot fix | The check reports a missing `Falsified By` column only for the Pre-Implementation Unit Tests table, and archived changes are not re-checked; `okf check` on this repository must stay clean, which criterion 8 tests |

## Impact

- `lib/check.mjs`: `checkTestPlan` gains two checks and one fix; the archive-mode
  flag reaches the status loop, which currently only reads it at the Known Gaps
  step.
- `openspec/schemas/okf-gated-feature/templates/test-plan.md`: one new column in
  the Pre-Implementation Unit Tests table, two prose additions.
- `openspec/schemas/okf-gated-feature/schema.yaml`: `test-plan` and `test-cases`
  instructions.
- `test/run.mjs`: new unit, integration, and negative cases.
- `docs/openspec-okf-workflow.md`: the description of what the gate guarantees.
- Downstream projects: the next `okf` upgrade adds a required column to new
  test-plans. Existing plans are unaffected until they are rewritten.
