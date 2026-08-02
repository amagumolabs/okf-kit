# Test Strategy

- Unit: every branch of the owed-step derivation, as fixture repositories.
- Integration: the real command against this repository, plus the prior suite.
- API E2E: Not Applicable because the kit exposes no network interface.
- Browser E2E: Not Applicable because the kit has no UI.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `readChangeState` | `lib/check.mjs` | `(root, changeId) => { artifacts, linked, pendingIn, evidenceRows }` | Extracted from `checkChange`, which keeps calling it. Landing this before the new command means the existing suite is its regression test |
| `next` | `lib/next.mjs` | `(root, changeId) => { answered: boolean, owed: {step, command}[] }` | Empty body returning `{ answered: true, owed: [] }`. Returning data rather than printing is what lets the fixtures assert on structure instead of parsing output |
| Command | `bin/okf.mjs` | `case 'next'` printing what `next` returned | Printing lives at the boundary, so the derivation stays testable without capturing stdout |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-301 | BR-3, BR-4 | test/run.mjs | UT-301 an entry still listing the change reports the verification pass | failing: pending_changes must produce an owed verification step | Deriving from the Archive Readiness checklist instead of `pending_changes` | |
| UT-302 | BR-3 | test/run.mjs | UT-302 a missing verification.md is reported as owed | failing: an absent verification.md is an owed step, not silence | Treating an absent artifact as nothing owed | |
| UT-303 | BR-3 | test/run.mjs | UT-303 an empty Rule Evidence table is reported as owed | failing: an empty Rule Evidence table must be reported - existence of the file is not enough | Checking only that the file exists | |
| UT-304 | BR-6 | test/run.mjs | UT-304 a finished change states that nothing is owed and names the gate | failing: owing nothing must be stated, not implied by an empty list (BR-6) | Returning an empty list with no statement | The difference between "nothing owed" and "could not tell" |
| UT-305 | BR-2 | test/run.mjs | UT-305 a change with no okf-link names openspec status | failing: the artifact half is named, never re-derived (BR-2) | Enumerating missing artifacts here | |
| UT-306 | BR-2 | test/run.mjs | UT-306 the implementation holds no artifact ordering | passing: stub `lib/next.mjs` holds no artifact id list | Adding an artifact id list to `lib/next.mjs` | A guard, which only a green-from-the-start test can be |
| UT-307 | BR-4 | test/run.mjs | UT-307 every owed step carries a command | failing: the fixture must owe at least one step | Returning a description with no command | |
| UT-308 | BR-1 | test/run.mjs | UT-308 the command creates nothing and spawns nothing | passing: stub writes nothing and imports no subprocess API | Writing a cache or calling a subprocess | Snapshots the tree before and after, and asserts over the source that it imports no subprocess API |
| UT-309 | BR-5 | test/run.mjs | UT-309 owed steps still return normally | failing: assert.ok(result.owed.length >= 1) | Throwing or signalling failure when steps remain | |
| UT-310 | BR-3 | test/run.mjs | UT-310 a no-domain-knowledge change still owes its verification pass | failing: no domain knowledge does not waive the verification pass (BR-3) | Keying the derivation on resolved entries | The failure the archive gate already made once, in a new place |
| UT-311 | BR-3 | test/run.mjs | UT-311 a change the archive gate accepts reports nothing owed | passing: stub returns empty owed and the clean fixture is already archive-clean | Letting the two derivations diverge | The assertion that keeps advisor and gate honest with each other |
| NEG-301 | BR-3 | test/run.mjs | NEG-301 a fully ticked checklist does not discharge a pending entry | failing: a checkbox is not derivation (BR-3) | Reading the checklist at all | |
| NEG-302 | BR-1 | test/run.mjs | NEG-302 an unknown change id is an argument error | failing: an unknown id is not an empty owed list | Returning an empty owed list for a nonexistent change | |
| NEG-303 | BR-1 | test/run.mjs | NEG-303 an archived change id is an argument error | failing: next advises on active work, not the archive | Resolving ids against the archive directory | |
| NEG-304 | BR-3 | test/run.mjs | NEG-304 unresolvable okf-link rows are reported, not treated as clean | failing: unresolvable rows are an obligation, not a clean slate (BR-3) | Treating an unresolved row as an absent obligation | |
| NEG-305 | BR-1 | test/run.mjs | NEG-305 no argument prints usage | passing: CLI already rejects a missing change-id with usage (task 1.3) | Defaulting to some arbitrary change | |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-301 | (command) `node bin/okf.mjs next` | the real command against an active change | skeleton | passing | Ran against `add-okf-next-command`; exits 0 and prints owed steps |
| IT-302 | test/run.mjs | the full prior suite | passing | passing | Already green; the assertion is that the `readChangeState` extraction keeps it green |

# E2E Tests

Not Applicable because the kit has neither a network interface nor a UI.

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| The existing `scaffold` fixture | all | Reused unchanged - a change with an entry, an okf-link and a verification is exactly the shape this command reads | none - temp dir per test |
| `treeSnapshot(root)` | UT-308 | Records every path and its mtime, compared before and after | none |
| An archived change directory | NEG-303 | Written under `openspec/changes/archive/` | none |

# Commands

## Unit

    npm test

## Integration

    node bin/okf.mjs next add-okf-next-command

## Lint

    npm run lint

## Typecheck

    Not Applicable because this kit is plain ESM with JSDoc and has adopted no type checker - see the declaration in AGENTS.md

## OpenSpec Validation

    openspec validate add-okf-next-command --strict

## OKF Validation

    okf check
    okf check --archive add-okf-next-command    # before archiving

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/okf-next.md` and the spec first, record it below, then
  change the test and the code. Never the other way round.
- These are not grounds, and naming them here is the point:
  - having run the behaviour manually and seen it work
  - intending to fix the test afterwards
  - the time already spent on the implementation
  - this case being different from the ones the rule was written for
  - the test being "too strict" about something the code does differently

# Test Changes After Implementation Started

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
