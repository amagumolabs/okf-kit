# Test Plan

# Test Strategy

- Unit: all 14 cases, driving `lib/audit.mjs` against real temporary git
  repositories created per test. No git mocking - the whole risk of this feature
  lives in git's actual pathspec and date behavior, which a mock would fake away.
- Integration: not applicable, git is the only boundary and the unit tests already
  exercise it for real (see test-cases.md Not Applicable).
- API E2E: not applicable, the kit exposes no API.
- Browser E2E: not applicable, the kit has no UI.

# Contract Stubs

| Contract | File | Signature Or Shape | Notes |
| --- | --- | --- | --- |
| `audit(root)` | `lib/audit.mjs` | `(root: string) => { ok: boolean, reason?: string, results: AuditResult[], stale: number }` | Returns the shape with empty results until group 3. A throwing stub was tried first and rejected: it makes every test fail on the throw, which proves only that the function exists, not that each expectation is meaningful |
| `AuditResult` | `lib/audit.mjs` | `{ capability, verdict, verifiedAt, newestCommit, triggeredBy, missingPaths }` | Shape only, no behavior |

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-001 | BR-1 | test/run.mjs | audit reports a newer commit as stale | failing: the entry must appear in the results | Also asserts the triggering path and date |
| UT-002 | BR-1 | test/run.mjs | audit reports an older commit as current | failing: the entry must appear in the results |  |
| UT-003 | BR-2 | test/run.mjs | audit treats a same-date commit as current | failing: the entry must appear in the results |  |
| UT-004 | BR-3 | test/run.mjs | audit reports an entry with no code_paths as unauditable | failing: the entry must appear in the results |  |
| UT-005 | BR-4 | test/run.mjs | audit skips unverified and needs-revision entries | failing: both entries must appear in the results |  |
| UT-006 | BR-5 | test/run.mjs | audit skips a deprecated entry even when stale | failing: the entry must appear in the results |  |
| UT-007 | BR-6 | test/run.mjs | audit does not modify any entry | passing (vacuous) | Negative guarantee - cannot be red before code exists; real proof comes from the byte-comparison once group 3 lands |
| UT-008 | BR-7 | test/run.mjs | audit ignores uncommitted changes | failing: the entry must appear in the results |  |
| UT-009 | BR-1 | test/run.mjs | audit counts stale entries for the exit status | failing: expected 2, got 0 |  |
| UT-010 | BR-1 | test/run.mjs | audit exits clean when only unauditable and skipped remain | passing (vacuous) | Asserts an absence, so it holds trivially against the stub |
| UT-011 | BR-3 | test/run.mjs | audit refuses to run outside a git repository | failing: it must say it could not run |  |
| UT-012 | BR-3 | test/run.mjs | audit flags a declared path that matches nothing | failing: the entry must appear in the results |  |
| UT-013 | BR-8 | test/run.mjs | audit reports a verified entry with no verified_at as unauditable | failing: expected 'current' to equal 'unauditable' | Added during the verification pass, see Test Changes below |
| UT-014 | BR-8 | test/run.mjs | audit reports declared paths with no history as unauditable | failing: expected 'current' to equal 'unauditable' | Added during the verification pass, see Test Changes below |

# Test Data And Fixtures

| Fixture Or Data | Used By | Setup Method | Cleanup Method |
| --- | --- | --- | --- |
| Temporary git repository with controlled commit dates | UT-001 to UT-010, UT-012 | `git init` in a temp dir, commits made with `GIT_AUTHOR_DATE` and `GIT_COMMITTER_DATE` set to fixed dates | `fs.rm` recursive in the test harness `finally` |
| Non-git temporary directory | UT-011 | `fs.mkdtemp` with no `git init` | same |

# Commands

## Unit

    node test/run.mjs

## Integration

    not applicable

## E2E

    not applicable

## OpenSpec Validation

    openspec validate add-okf-audit --strict

## OKF Validation

    node bin/okf.mjs check
    node bin/okf.mjs check --archive add-okf-audit

# Test Change Rules

- Pre-written tests are not changed to match the implementation.
- A pre-written test may change only when the OKF entry or spec changed first, or
  the test has a mechanical bug.
- If implementation shows a business rule must differ, amend
  `.okf/features/okf-audit.md` and the spec first, record it below, then change
  the test and the code.

# Test Changes After Implementation Started

| Date | Test | Reason | Rule (BR-n) Or Spec Change |
| --- | --- | --- | --- |
| 2026-07-30 | UT-013, UT-014 added | The verification pass found the audit reporting `current` for entries it had not actually compared - a false assurance. The knowledge was also incomplete: BR-3 only covered empty `code_paths`. | BR-8 added to `.okf/features/okf-audit.md`; the "Entries without declared paths" requirement widened to "An impossible comparison is reported as unauditable" and now cites BR-3, BR-8 |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
