# Test Plan

# Test Strategy

- Unit: every branch of the new related-knowledge reads, as fixture repositories
  built in a temp dir by `test/run.mjs`, plus assertions on the shipped schema
  instruction and template text for the rules that live in prose. This is the
  kit's only test level and the one the gate lives at.
- Integration: the real gate run against a fully filled fixture change, and the
  whole pre-existing suite re-run to prove the new checks disturb nothing.
- API E2E: Not Applicable because the kit exposes no network interface;
  `bin/okf.mjs` is its only entry point and the unit fixtures call `check()`
  directly.
- Browser E2E: Not Applicable because the kit is a command-line validator with no
  UI surface of any kind.

# Status Vocabulary

Exactly four values: `planned`, `skeleton`, `failing`, `passing`. Every unit row
below records the state observed when the test was first run, before any
implementation existed. Ten of them came out green: each is a guard against the
gate over-firing on correct input, and only a test that was green from the start
can be that.

# Contract Stubs

Omitted. The change adds no new code surface for a test to import: every unit
test calls the existing `check()` export against a fixture repository, or reads
the shipped schema and template files. A test that fails does so on its
assertion from the first run, with nothing to stub to get there.

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-601 | BR-13, BR-14 | test/run.mjs | UT-601 a missing related knowledge table warns in flight | failing: expected exactly one finding about the missing table, got 0 | Removing the missing-table branch, or reporting it through `report.error` so nothing warns in flight | Asserts the level as well as the message |
| UT-602 | BR-14 | test/run.mjs | UT-602 the same change is blocked at the archive boundary | failing: expected exactly one finding about the missing table, got 0 | Replacing `hardensAtArchive` with `report.warn` for this finding | |
| UT-603 | BR-13 | test/run.mjs | UT-603 a table with one resolving row is clean | passing: the fixture gained a filled table in the same task, so this locks the gate against firing on correct input | Making the table check fire on a filled table - an over-fire only a green-from-the-start test catches | Starts green by design; it guards against over-firing |
| UT-604 | BR-7, BR-13 | test/run.mjs | UT-604 a related table with no rows is reported | failing: expected exactly one finding about the silent table, got 0 | Treating a present heading as sufficient, without counting rows | |
| UT-605 | BR-7, BR-14 | test/run.mjs | UT-605 a stated empty set passes both runs | passing: nothing reported the stated form yet, so this fixes it as the answer before the check exists to reject it | Dropping the stated-reason branch, so an explicitly empty set is reported like a silent one | Asserts both the normal and the archive run |
| UT-605b | BR-7 | test/run.mjs | UT-605b a stated empty set with no reason is not a statement | failing: expected an error matching /no specific reason/, got no findings | Accepting the bare word `none` without a reason, which makes "the scan found nothing" indistinguishable from "nobody wrote why" | Added while writing UT-605: the stated form has two halves and only one of them was covered |
| UT-606 | BR-13 | test/run.mjs | UT-606 a related row naming a missing file is an error | failing: expected an error matching /listed as related but does not exist/, got no findings | Removing the `exists()` call on a related row's path | |
| UT-607 | BR-13 | test/run.mjs | UT-607 a resolving related row leaves the change owing nothing extra | passing: no consumer read the related rows yet, so this locks the obligation boundary before one could leak across it | Pushing related rows into `linked`, which would give them the linked entries' obligations | The obligation boundary, asserted from the resolution side |
| UT-608 | BR-1, BR-2 | test/run.mjs | UT-608 a file in both tables is reported | failing: expected an error matching /both as a capability this change modifies and as related/, got no findings | Removing the intersection check between the two tables | |
| UT-609 | BR-1, BR-10 | test/run.mjs | UT-609 a decision path resolves as a related row | passing: the clean fixture already lists a decision, so this locks decisions as resolvable rows | Restricting related row resolution to `.okf/features/` | |
| UT-610 | BR-3, BR-15 | test/run.mjs | UT-610 an unmentioned overlapping entry warns | failing: expected 1 warning naming session-store, got 0 | Dropping the `code_paths` intersection from the candidate derivation | Asserts a warning and zero errors |
| UT-611 | BR-3, BR-15 | test/run.mjs | UT-611 an unmentioned decision warns | failing: expected 1 warning naming rotate-recovery-codes, got 0 | Dropping the `affects_features` read from the candidate derivation | |
| UT-612 | BR-15 | test/run.mjs | UT-612 the candidate warning does not harden at archive | failing: expected 1 warning naming session-store under --archive, got 0 | Routing the candidate finding through `hardensAtArchive` instead of `report.warn` | The one finding in this change that must not harden |
| UT-613 | BR-5, BR-15 | test/run.mjs | UT-613 a recorded set wider than the derivation is clean | passing: the derivation did not exist to disagree with, so this fixes it as a floor before it can become a ceiling | Comparing the recorded set against the derived set and reporting the difference in either direction | Starts green by design; it fixes the derivation as a floor |
| UT-614 | BR-2 | test/run.mjs | UT-614 a related entry is owed no evidence and no attestation | passing: related rows reached no consumer yet, so this locks what must never start being demanded of them | Including related rows in the Rule Evidence and `pending_changes` checks | |
| UT-615 | BR-13 | test/run.mjs | UT-615 relevance is never judged | passing: no relevance check exists, and this is what records its absence as deliberate | Adding any check that a listed file is connected to a linked capability | Starts green by design; it locks the absent check as deliberate |
| UT-616 | BR-3 | test/run.mjs | UT-616 an unrecognised relation key is ignored | passing: nothing read a relation key, so this locks the derivation to the two frontmatter fields it may read | Reading a `related` frontmatter key as a source of candidates | |
| UT-617 | BR-1, BR-6 | test/run.mjs | UT-617 the okf-link template ships the related knowledge section | failing: expected the shipped template to match /#+\s*Related Knowledge/, got no match | Shipping the section without the columns that carry the signal, the reason, and what to read | Reads the installed template, as UT-112 already does for the test-plan template |
| UT-618 | BR-3, BR-4, BR-5 | test/run.mjs | UT-618 the okf-link instruction states both signals, dismissal, and judgement | failing: expected the okf-link instruction to mention affects_features, got no match | Removing either signal from the instruction, or the sentence that keeps a dismissed candidate's row | |
| UT-619 | BR-6 | test/run.mjs | UT-619 the okf-link instruction rejects a bare path | failing: expected the okf-link instruction to match /why it is related/, got no match | Dropping the requirement that a row name its reason and its reading target | |
| UT-620 | BR-7 | test/run.mjs | UT-620 the okf-link instruction states the empty-set reason form | failing: expected the okf-link instruction to state the `none - <reason>` form, got no match | Dropping the stated-reason form, leaving a blank table admissible | |
| UT-621 | BR-8 | test/run.mjs | UT-621 the proposal reconcile step re-runs the scan | failing: expected the proposal instruction to mention Related Knowledge, got no match | Removing the related scan from the reconcile step, or adding it to a later artifact's instruction | Asserts both halves: named at reconcile, absent everywhere later |
| UT-622 | BR-9 | test/run.mjs | UT-622 the verification instruction checks a rule edit against neighbours | failing: expected the verification instruction to mention Related Knowledge, got no match | Dropping the re-read duty, or dropping `conflict` as the named verdict | |
| UT-623 | BR-10 | test/run.mjs | UT-623 the okf-link instruction names decisions as a source to read | failing: expected the okf-link instruction to name `.okf/decisions/`, got no match | Leaving `.okf/decisions/` mentioned only where a decision is promoted | |
| UT-624 | BR-11 | test/run.mjs | UT-624 a decision this change promoted is not a candidate for it | failing: expected 0 findings naming the promoted decision, got 1 warning | Deriving candidates from `affects_features` alone, without excluding decisions whose `linked_changes` names this change | Written during the verification pass, after BR-11 and the spec were amended - see Test Changes below |
| NEG-601 | BR-13 | test/run.mjs | NEG-601 a change with no okf-link is not also missing a read set | passing: the early return for a missing okf-link already precedes everything, so this locks it there | Moving the related-knowledge check above the early return for a missing `okf-link.md` | |
| NEG-602 | BR-7 | test/run.mjs | NEG-602 the zero-to-one row boundary | failing: expected 1 finding for the zero-row table, got 0 | Counting a blank template row as a row, which makes the silent-table finding unreachable | |
| NEG-603 | BR-13 | test/run.mjs | NEG-603 a repeated related row produces at most one finding | failing: expected 1 finding for the repeated row, got 0 | Reporting per row rather than per distinct path | |
| NEG-604 | BR-3, BR-15 | test/run.mjs | NEG-604 a code path added after the link was written still produces a candidate | failing: expected 1 finding after the code path was added, got 0 | Caching the derived candidate set anywhere, rather than computing it per run | |
| NEG-605 | BR-3 | test/run.mjs | NEG-605 another change's linked capability is not a candidate here | passing: no derivation existed to be scoped wrongly, so this fixes its scope before it is written | Deriving candidates from every capability in the bundle rather than from this change's linked rows | |

# Integration Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| IT-601 | test/run.mjs | IT-601 a fully filled change archives clean | skeleton | passing | The whole gate against one fixture: both tables filled, every row resolving, every candidate mentioned |
| IT-602 | test/run.mjs | IT-602 the existing archive gate findings are unchanged | skeleton | passing | The pre-existing suite is the assertion; this row records that it is re-run as part of the change |

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temp repository skeleton | every unit and integration test | `scaffold(root)` in `test/run.mjs`, already used by the whole suite | The harness removes the temp dir after each test |
| A second feature entry sharing a `code_paths` value | UT-610, UT-613, NEG-604 | `write(root, '.okf/features/<name>.md', ...)` with an overlapping path | Same |
| A decision file with `affects_features` | UT-609, UT-611, NEG-605 | `write(root, '.okf/decisions/<date>-<slug>.md', ...)` | Same |
| The installed schema and template text | UT-617..UT-623 | `readF(KIT, ...)` against this repository, as UT-112 already does | None - read only |

# Commands

## Unit

    npm test

## Integration

    npm test

## E2E

    -

## Lint

    npm run lint

## Typecheck

    -

## OpenSpec Validation

    openspec validate add-okf-related-knowledge --strict

## OKF Validation

    okf check
    okf check --archive add-okf-related-knowledge

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug (wrong fixture, typo, bad assertion syntax).
- When implementation reveals that a business rule must be different, stop:
  amend `.okf/features/<capability>.md` and the spec first, record it below, then
  change the test and the code. Never the other way round.

# Test Changes After Implementation Started

| Date | Test | Ground | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |
| 2026-08-05 | UT-624 (added) | The rule changed first: promoting this change's own four decisions made all four candidates of the change that authored them, which is the derivation asking a change to cite itself | BR-11 in `.okf/features/okf-related-knowledge.md`, then the requirement "A change does not read the decisions it wrote" in `openspec/specs/okf-related-knowledge/spec.md` |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |

# Notes On Typecheck

The Typecheck command is `-` because this project has no type checker, as
declared in `AGENTS.md` outside the okf-kit markers. The kit is plain ESM
annotated with JSDoc, and adopting a checker would add its first dependency -
a decision about the kit's shape rather than a step in this change. The
verification pass records this in the Static Analysis table as
`Not Applicable because <reason>` rather than by deleting the row.
