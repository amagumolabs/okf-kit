---
type: Decision
title: Required records harden at the archive boundary
description: A record the test-plan requires is a warning while the change is in flight and an error under `okf check --archive`, and every check the kit adds follows that shape.
date: 2026-08-02
status: stable
decision_status: accepted
affects_features:
  - test-first-gate
sources:
  - id: change-require-tests-that-can-fail
    resource: change:require-tests-that-can-fail
linked_changes:
  - require-tests-that-can-fail
---

# Decision

When `okf check` requires a record that can only be written as work proceeds — an
assertion message, the reason a test started green, the falsifier a test names —
the finding is a **warning** in a normal run and an **error** under
`okf check --archive`. Checks added later follow the same shape rather than
choosing a severity case by case.

# Context

Three findings landed at once in `require-tests-that-can-fail`, and each could
plausibly have been an error or a warning. A test-plan is written before
implementation, when an assertion message and an initial status are not knowable
yet, so an unconditional error fires at a plan doing exactly what the gate asks.
But `--archive` is the last moment the kit gets to insist, and BR-3 states the red
state as a MUST.

The precedent already existed and was already stated: a row with a live status and
an empty `Initial Status` warns, because "a change already in flight is not
blocked". This decision generalises that sentence instead of leaving each author
to rediscover it.

# Alternatives Considered

| Option | Why Not Chosen |
| --- | --- |
| Always an error | Reports errors against a plan that is being filled in correctly, which trains people to run the check less often |
| Always a warning | Lets a MUST be archived unmet - the hole this change was opened to close |
| Per-check severity, decided case by case | Three checks, three answers, and the fourth author guesses. The severity level stops carrying information about how load-bearing a rule is |

# Consequences

Severity now means something specific: `error` in a normal run marks something
wrong today, `warning` marks something that must be true by archive. Anyone adding
a check has one question to answer — can this be known before implementation
finishes — rather than a judgement call about strictness.

It also means the archive step is never the first time a message is seen. The
warning has been printing since the plan was written, so `--archive` blocks on
something already familiar rather than springing a new rule at the last gate.

# Revisit When

A record appears that is neither knowable up front nor required at archive - one
that only matters while a change is in flight. That would be a third category this
shape has no answer for.
