## Context

`checkVerification` in `lib/check.mjs` runs two families of gate: entry-scoped
ones that describe a linked OKF entry (Rule Evidence, Entry Outcome), and
change-scoped ones that describe the change itself (`checkDecisionPromotion`).
The static analysis gate is change-scoped - a change with no domain knowledge
still compiles or fails to.

Three conventions in the file are load-bearing here, and this design reuses all
three rather than reproducing them:

- `hardensAtArchive(report, archiveMode)` returns the reporter every required
  record uses: warn while the change is in flight, error at `--archive`.
- `notApplicableDeclaration(bullet)` parses the kit's one escape-hatch grammar,
  and `REASON_MIN` is the single constant deciding whether a stated reason
  distinguishes anything.
- `checkHygiene` already reports unfilled `<placeholder>` text across every
  bundle and change file.

The gate is the mechanical half of BR-9 through BR-12 in
`.okf/features/okf-archive-gate.md`.

## Goals / Non-Goals

**Goals:**

- A change cannot be archived without stating what its linter and type checker
  said, or why there is nothing to state.
- The new gate is indistinguishable in shape from the gate next to it, so an
  agent that has learned one has learned the other.
- Every branch of the gate is covered by a fixture that fails before the
  implementation exists.

**Non-Goals:**

- Executing project commands from the validator.
- Judging the truth of a reported result.
- Extending the required set beyond lint and type checking.

## Decisions

**The record is a table, not a Command/Result prose block.** The existing test
sections in `verification.md` use prose - a `Command:` line, a `Result:` line,
per level. That shape reads well and checks badly: there is no cell to test for
emptiness and no row to test for absence. The Static Analysis record is a
three-column table (Check, Command, Result) for the same reason the Decision
Promotion record is a table - the gate that reads it needs columns. The existing
prose sections stay as they are; converting them is a separate change with its
own migration cost.

**The required rows are named by category, not by tool.** The Check column holds
`Lint` and `Typecheck`; the Command column holds `ruff check`,
`golangci-lint run`, `./gradlew spotlessCheck`, whatever the project actually
runs. Keying the requirement on the tool would make the gate wrong in every
ecosystem but one, and would make a project's switch from `eslint` to `biome`
look like a missing row. The category survives the tool.

The gate never reads the Command column beyond checking it is not a placeholder,
and never executes it, so nothing in the kit has to know what a lint command
looks like in any language. The templates carry `<lint-command>` and
`<typecheck-command>` placeholders for the same reason the test sections already
carry `<unit-test-command>`: a shipped default would be a shipped assumption
about the ecosystem.

**A project declares its commands once, in its own `AGENTS.md`, outside the
okf-kit markers.** The alternative was a kit-owned config file. It was rejected
because the space already exists and costs nothing: `install.mjs` writes
"Add your project's own conventions above or below the okf-kit block" when it
creates the marker file, that region survives `okf upgrade` by construction, and
every agent already reads `AGENTS.md` at the start of a session. A config file
would mean a parser, an `okf init` step, a monorepo story, and a second place
where a project's conventions live.

So the kit gains no code for this at all. The `test-plan` instruction gains one
step: read the project's declared commands from `AGENTS.md`; if none are
declared, derive them from the repository's own manifest - `package.json`
scripts, `Makefile` targets, `pyproject.toml`, `Cargo.toml`, `build.gradle` -
confirm them with the user, and write them into `AGENTS.md` outside the markers
so the next change inherits them.

Deriving them fresh every change was the cheaper option and was rejected for one
reason: an agent that cannot find a linter in thirty seconds writes
`Not Applicable`, and nothing distinguishes that from a project that genuinely
has none. A declaration written once is visible to review; a decision re-made
silently per change is not.

**The gate reads the reported result and runs nothing.** This is BR-12, and it
extends a boundary the kit already drew once: the decision
`the-kit-records-test-ordering-it-does-not-verify-it` settled that the kit
records what a change claims about its own process rather than reproducing it.
Running project commands from a validator would mean `okf check` executes
arbitrary code from whatever repository it is pointed at - a different trust
boundary, and one CI already occupies. What the kit adds is that the claim is
written down in a fixed place where a reviewer can compare it against CI. This
generalisation of an existing boundary to a second case is the decision most
likely to outlive the change.

**Severity follows `hardensAtArchive`, not the version-gated promotion.** The
precedent `a-new-invariant-starts-as-a-warning` exists for invariants a project
cannot satisfy without work it did not choose - after `okf migrate`, satisfying
the attestation coupling means re-verifying every entry. This invariant is not
of that kind: a change in flight under the old template satisfies it by adding
one section and pasting two command outputs. Applying a release-long grace
period to a remedy that costs minutes would teach downstream projects that new
gates are optional for a release, which is the more expensive lesson. The
in-flight warning that `hardensAtArchive` already provides is the proportionate
grace period.

**Placeholder detection is not reimplemented.** A row whose Command is still
`<lint-command>` is caught by `checkHygiene`, which runs over `verification.md`
already. The static analysis gate tests for an empty or non-result Result cell
and for a missing required row, and says nothing about placeholders. Two
implementations of one rule drift, and the second one is always the one nobody
updates.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| A `Not Applicable because ...` reason long enough to pass `REASON_MIN` but empty of content | Unfixable mechanically, and the kit does not pretend otherwise. The reason is written where review can see it, which is the same standing every other stated reason in the kit has |
| The Check column's matching is loose enough to accept `Type check`, `Typecheck`, `types` | Deliberate. A required row that fails on spelling teaches agents to fight the matcher rather than run the checker. Matching is case-insensitive and ignores separators |
| The table sits in `verification.md`, which is written last, so the commands are improvised | `test-plan.md` gains the two commands under Commands, so they are chosen at plan time and copied at verification time - and the plan itself takes them from the project's `AGENTS.md` rather than inventing them |
| The declaration in `AGENTS.md` is prose the kit never parses, so it can rot | Accepted. It is read by agents, not by code, and it sits in the file they read most. A parsed declaration would be a config file, which was the alternative rejected above - the rot it prevents is not worth the machinery it costs |

## Migration Plan

The schema `version` bumps. Downstream projects receive the new templates and
the new gate together through `okf upgrade`; `lib/migrate.mjs` needs no entry
because nothing in an existing bundle changes shape - the requirement is on a
change artifact, not on `.okf/` content.

A change already in flight sees warnings from the moment the kit is upgraded and
errors only when it is archived. The remedy is to add the section.

## Open Questions

None blocking. Two deferred:

- Whether `Format` and a security scan should become required rows once a
  project has adopted the first two. Deferred because a required row a project
  cannot satisfy is discharged by a reason, and a table where most rows carry
  reasons has stopped being read.
- Whether the `AGENTS.md` declaration should eventually become machine-readable,
  so the gate can compare the command a change reported against the command the
  project declared. Deferred until there is evidence that reported and declared
  commands actually diverge; the prose declaration is what would produce that
  evidence.
