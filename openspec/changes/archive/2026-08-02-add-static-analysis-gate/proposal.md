## Why

The archive gate asks a change to record its test results and its OKF pass, and
nothing else about whether the code holds together. A change can therefore be
archived with a green test suite and a broken type check, because tests and
static analysis fail on disjoint defect classes: a test fails on behavior it
observed, a type checker on a branch no test ever reached. That gap was found by
comparing this kit against a hand-written agent rulebook which required the agent
to paste real linter and type-checker output into its review artifact - a
requirement `verification.md` has no equivalent of.

It matters now because the gap widens with agent-written code. An agent that has
just made a suite green has every reason to stop, and the one artifact that could
have asked it for the compiler's opinion does not.

## What Changes

- `verification.md` gains a **Static Analysis** table: one row per check, each
  carrying the project's real command and the reported result.
- `okf check --archive <change-id>` enforces that table, on the same terms it
  already enforces Decision Promotion: required rows present (BR-10), each row
  answering with a command and a result or a stated reason (BR-11).
- The gate warns while the change is in flight and errors at the archive
  boundary, following `hardensAtArchive` - results are not knowable before the
  code is written.
- `test-plan.md` gains `## Lint` and `## Typecheck` under Commands, as
  placeholders in the same shape as the existing `<unit-test-command>` - the kit
  ships no default command, because a default is an assumption about the
  ecosystem.
- The `test-plan` instruction gains one step: take those commands from the
  project's own `AGENTS.md` outside the okf-kit markers, and when the project has
  not declared them yet, derive them from its manifest, confirm with the user,
  and write them there so the next change inherits them. No kit code is involved -
  that region of `AGENTS.md` already exists for project conventions and already
  survives `okf upgrade`.
- The `verification` artifact instruction in `schema.yaml` gains the step that
  produces the table, and the Archive Readiness checklist gains its line.
- The kit reads the reported result and never runs the project's commands
  itself (BR-12).

Not breaking for archived changes - the gate only runs against a change being
archived now. A change already in flight under the previous templates sees
warnings until its `verification.md` gains the section, and one section is the
whole remedy.

## Capabilities

### New Capabilities

None. This extends an existing gate rather than introducing a capability.

### Modified Capabilities

- `okf-archive-gate`: adds BR-9 through BR-12, extending what the pre-archive
  completeness gate covers from the OKF pass alone to the static analysis
  evidence a change carries.

## Scope And Non-Goals

**In scope:**

- The Static Analysis table in the `verification` template, and its instruction.
- The `checkStaticAnalysis` gate in `lib/check.mjs`, wired into
  `checkVerification` as change-scoped (BR-1) rather than entry-scoped.
- Lint and Typecheck as the two required rows.
- Fixtures in `test/run.mjs` covering every branch of the gate.
- The command placeholders in the `test-plan` template, and the instruction step
  that sources them from the project's `AGENTS.md`.
- Adding a dependency-free `lint` script to this repo's own `package.json`, so
  this change's own Static Analysis table reports a real result rather than
  discharging both rows with reasons.

**Non-goals:**

- Running the project's lint or typecheck from `okf check` (BR-12). That crosses
  a trust boundary the kit has never crossed, and CI already runs them.
- Judging whether a reported result is truthful. The kit records; review and CI
  verify. This is the same boundary the kit already accepted for test ordering.
- Requiring Build, Format, or security scanning rows. They are permitted and
  unconstrained; only Lint and Typecheck are required (BR-10).
- A kit-owned config file holding the project's commands. The declaration lives
  in `AGENTS.md` as prose the kit never parses. Making it machine-readable is
  recorded as a deferred question in design.md.
- The other gaps found in the same review - boundary-value classes, UI evidence,
  OKF scope filter, `okf next`. Each is its own change.

## Acceptance Criteria

1. A change whose `verification.md` has no Static Analysis section fails
   `okf check --archive`, and only warns without `--archive`. Governs: BR-9,
   and the escalation stated in Workflows.
2. A Static Analysis table missing the Lint row, or missing the Typecheck row,
   fails at archive with a message naming the missing row. Governs: BR-10.
3. A row whose Result is empty, `-`, or `not run` fails at archive. Governs:
   BR-11.
4. A row whose Command is still the template placeholder fails, via the existing
   placeholder hygiene check rather than a second implementation of it. Governs:
   BR-11.
5. A row whose Result is `Not Applicable because <reason>` with a reason at least
   `REASON_MIN` characters long passes; the same row with a bare
   `Not Applicable` fails. Governs: BR-11.
6. `okf check` does not spawn a child process while evaluating the table.
   Governs: BR-12.
7. A change whose okf-link rows are all `no domain knowledge` still has its
   Static Analysis table evaluated. Governs: BR-1.
8. This repo's own `verification.md` for this change carries a filled Static
   Analysis table, and `okf check --archive add-static-analysis-gate` exits
   clean.
9. The shipped `test-plan` template carries `<lint-command>` and
   `<typecheck-command>` placeholders and no ecosystem-specific default, and its
   instruction names `AGENTS.md` outside the okf-kit markers as where a project
   declares them once. Governs: BR-7.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Reported results can be invented by the agent that writes them | The gate passes on an unchecked claim | Accepted deliberately per BR-12 and recorded in the entry's risk table. The value is that the claim is written where a reviewer can compare it against CI, not that the kit proved it |
| Generic row names do not fit every ecosystem | A project discharges a required row with a reason that is really an evasion | The Check column holds the category, the Command column the real tool, so the row survives swapping `eslint` for `ruff`. A stated reason stays reviewable; silence would not |
| A change already in flight under old templates starts failing | Retroactive noise | `hardensAtArchive` means it warns until archive, and the remedy is one section. The precedent for a heavier grace period exists (`a-new-invariant-starts-as-a-warning`) but is disproportionate here - see design.md |
| Two required rows today invite three tomorrow | The table decays into ceremony filled in mechanically | BR-10 fixes the required set at two and leaves everything else optional; extra rows are permitted precisely so the required set does not have to grow |

## Impact

- `openspec/schemas/okf-gated-feature/templates/verification.md` - new section,
  Summary rows, Archive Readiness line.
- `openspec/schemas/okf-gated-feature/templates/test-plan.md` - Lint and
  Typecheck placeholders under Commands.
- `openspec/schemas/okf-gated-feature/schema.yaml` - `verification.instruction`
  gains the step, `test-plan.instruction` gains the `AGENTS.md` sourcing step;
  schema `version` bumps.
- `lib/check.mjs` - `checkStaticAnalysis`, called from `checkVerification`.
- `test/run.mjs` - fixtures for each branch, and the shared `VERIFICATION`
  fixture gains a satisfied table so the existing archive tests keep passing.
- `package.json` - a dependency-free `lint` script for this repo's own use.
- `AGENTS.md` and `CLAUDE.md` - a static analysis declaration outside the
  okf-kit markers, which is this change dogfooding its own instruction.
- `.okf/features/okf-archive-gate.md` - BR-9..BR-12 (already enriched).
- No new dependencies. `package.json` stays dependency-free.
- Downstream projects receive the templates and the gate through `okf upgrade`.
