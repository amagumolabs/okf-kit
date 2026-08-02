## Why

`test-cases.md` ships a Negative And Boundary Cases table with a header, a blank
row, and a comment listing example categories in prose. An author filling it
writes the one or two negative cases the feature made them think of, and the
table looks complete because it has rows in it.

The classes an author reliably misses are the ones their own feature never made
them think of: a stale read, a duplicate submission, a request from the wrong
tenant. Naming the classes is what turns a table from a place to record what you
thought of into a list of things to think about.

The same gap exists one level up. The Browser E2E table has no states named, so a
UI change gets tested on the path its author built - the populated one - and
ships without ever rendering empty, loading, or failed.

## What Changes

- The Negative And Boundary Cases table gains a **Class** column and one seeded
  row per class: absence, numeric edge, duplication, staleness, authorisation,
  scope isolation (BR-13).
- A class a change does not touch is discharged with a stated reason in the Not
  Applicable table, not by deleting its row (BR-14).
- The Browser E2E section names the four render states and the console-error
  question, conditional on the change having an interface at all (BR-15).
- `test-plan.md` and `verification.md` gain an **Artifacts** column on their
  browser rows, so an inspectable artefact has a stated home (BR-16).
- `okf check` warns - never errors - when the boundary table has no rows while
  the change has spec scenarios.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `test-first-gate`: adds BR-13..BR-16, extending it from *when* a test must
  exist to *what a matrix must have considered*.

## Scope And Non-Goals

**In scope:**

- The three templates, and the `test-cases` artifact instruction.
- One warning in `lib/check.mjs` for an empty boundary table.
- Fixtures for the warning and for the shipped template text.

**Non-goals:**

- Erroring on a missing class. Whether six named classes were genuinely
  considered is not mechanically checkable, and a gate that pretends otherwise
  produces six rows written to satisfy it. The pressure belongs on the author
  through the template, with the checker only noticing total silence.
- Prescribing a screenshot tool. BR-16 asks where the artefact lands, not what
  produced it.
- Adding classes beyond the six. A list long enough to be exhaustive is a list
  nobody reads.

## Acceptance Criteria

1. The shipped `test-cases` template carries a Class column and one row per named
   class. Governs: BR-13.
2. The `test-cases` instruction states that an untouched class is discharged with
   a reason rather than deleted. Governs: BR-14.
3. The shipped template names the four render states and the console-error
   question, conditionally on the change having an interface. Governs: BR-15.
4. `test-plan.md` and `verification.md` carry an Artifacts column on their
   browser rows. Governs: BR-16.
5. A change whose boundary table has no rows, while its specs contain scenarios,
   produces a warning and never an error. Governs: BR-13.
6. No shipped template names a specific browser-automation tool. Governs: BR-16.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Six named classes get six rows written to satisfy the template | The matrix looks considered and is not | Kept a warning, never an error, so the pressure stays on the author rather than on the checker. A class discharged with a reason is reviewable; a fabricated row is a judgement about the author that no tool can make |
| The six classes do not fit every domain | An author discharges most of them and stops reading the table | The six were chosen as the ones an unprompted author misses, not as a taxonomy. BR-14 makes discharging cheap and visible |
| The UI states are irrelevant to a kit with no UI | This repository cannot dogfood BR-15 | True, and stated: this change's own test-cases discharges the UI class with a reason. The rule is for downstream projects, which is where the gap was observed |

## Impact

- `templates/test-cases.md`, `templates/test-plan.md`, `templates/verification.md`.
- `schema.yaml` - `test-cases.instruction`; schema `version` bumps.
- `lib/check.mjs` - one warning.
- `test/run.mjs` - fixtures.
- `.okf/features/test-first-gate.md` - BR-13..BR-16 (already enriched).
