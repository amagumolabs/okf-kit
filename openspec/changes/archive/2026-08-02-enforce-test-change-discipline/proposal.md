## Why

The direction of adaptation is what makes test-first worth doing: when code and
a pre-written test disagree, the code moves (BR-8). The schema says so — in the
`test-plan` instruction, the test-plan template's Test Change Rules, and the
apply instruction — but says it in exactly the places an agent reads *before* and
*after* implementation, never in the artifact it executes *during* it. The
`tasks` template's Implementation group reads "Replace stubs with real behavior
until the tests from group 2 go green" and stops there.

And nothing checks it. `test-plan.md` ships a "Test Changes After Implementation
Started" table that `okf check` has never read: it can be left empty while every
test was rewritten, or filled with rows that name no ground at all, and the
change still archives clean. That makes it the weakest link in a gate whose other
halves are now enforced — a change can satisfy BR-4 and BR-6 completely, with
skeletons written early and honest statuses, and still have had every assertion
bent to fit the implementation.

## What Changes

- Add BR-8, BR-9 and BR-10 to `.okf/features/test-first-gate.md`: the direction
  of adaptation, the requirement that every test change carry its ground, and the
  fixed order of repair when a rule turns out to be wrong.
- State BR-8 in the `tasks` template's Implementation group and in the `tasks`
  artifact instruction, so it appears where the work is done rather than only in
  the plan and the retrospective.
- Check the "Test Changes After Implementation Started" table in `lib/check.mjs`:
  every row must identify a test, and must answer with a citation that resolves
  (a `BR-n` present in a linked OKF entry, or a spec path that exists) or a
  declared mechanical defect. A row with neither is an error.
- Extend the table with a `Ground` column so the two admissible answers are
  visible in the template rather than inferred from prose.
- Document it in `docs/openspec-okf-workflow.md` §7.

These findings are **errors, not warnings**. The standing decision that a new
invariant starts as a warning is scoped to invariants introduced with a
migration, where a project is held to a rule it had no opportunity to satisfy.
Nothing here has that shape: the check fires only on rows a project chose to
write, and an empty table stays clean.

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `test-first-gate`: gains requirements for the direction of adaptation between
  code and pre-written tests, and for the record every test change must carry.

## Scope And Non-Goals

**In scope:**

- `.okf/features/test-first-gate.md` (BR-8, BR-9, BR-10)
- `openspec/schemas/okf-gated-feature/templates/tasks.md` and
  `templates/test-plan.md`
- The `tasks` artifact instruction in `openspec/schemas/okf-gated-feature/schema.yaml`
- `lib/check.mjs` test-plan checking
- `docs/openspec-okf-workflow.md` §7

**Non-goals:**

- Detecting an unrecorded test change. `okf check` reads finished files; it
  cannot see that an assertion moved, and reconstructing that from git would fail
  for the reasons already settled in
  `.okf/decisions/2026-08-02-the-kit-records-test-ordering-it-does-not-verify-it.md`.
  What this change closes is the recorded case: a row that names no ground, and a
  ground that points at nothing.
- Judging whether a stated ground is true. A row citing `BR-3` is checked for
  `BR-3` existing in a linked entry, not for the citation being honest.
- Changing the two admissible grounds themselves. They are restated with ids,
  not redefined.

## Acceptance Criteria

1. A test-plan row recording a test change with an empty Test cell is an error
   (BR-9).
2. A row whose citation column holds a `BR-n` absent from every linked OKF entry
   is an error naming the id (BR-9).
3. A row whose citation column holds a path under `openspec/specs/` that does not
   resolve is an error (BR-9).
4. A row with no citation is accepted when, and only when, its Ground declares a
   mechanical defect with a specific reason (BR-8, BR-9).
5. A row with no citation and no declared mechanical defect is an error (BR-9).
6. An empty Test Changes table produces no finding at all (BR-9).
7. The `tasks` template's Implementation group states that the code adapts to the
   tests, and the `tasks` artifact instruction states the order of repair when a
   rule turns out to be wrong (BR-8, BR-10).
8. The test-plan template's Test Changes table carries a `Ground` column
   alongside the citation column (BR-9).

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| The check rewards leaving the table empty: recording an honest test change costs a citation, hiding it costs nothing | The rule bites the honest and misses the dishonest | Stated plainly rather than papered over; the mechanical layer can only reach the recorded case, and the OKF entry says so |
| "Mechanical defect" becomes the universal excuse | Any test change gets waved through with one phrase | The declaration must name the specific defect, the same shape the kit already requires of "not applicable"; and a mechanical fix that moves an assertion is not one, which a reviewer can see in the diff |
| An existing project has rows in this table with blank cells | Its next `okf check` fails | Rows in that table are rare, and a row that names no ground is exactly what this change exists to reject. Not softened to a warning |

## Impact

- `.okf/features/test-first-gate.md`
- `openspec/schemas/okf-gated-feature/schema.yaml` — `tasks` instruction
- `openspec/schemas/okf-gated-feature/templates/tasks.md`,
  `templates/test-plan.md`
- `lib/check.mjs` — `checkTestPlan`
- `test/run.mjs` — new cases
- `docs/openspec-okf-workflow.md`
- No CLI surface change, no dependency change.
