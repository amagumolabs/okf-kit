## Why

A change owes two things at once: artifacts to OpenSpec, and knowledge to the
bundle. `openspec status` answers for the first - it names the next artifact and
tracks task completion. Nothing answers for the second, so "have I finished the
OKF pass?" gets answered from memory, by the actor with the least reason to say
no.

`okf check --archive` does answer it, but only as a refusal, and only once the
work is claimed to be finished. There is no way to ask the question halfway
through without being told you failed.

## What Changes

- New command `okf next <change-id>`. It reads the change directory and the
  entries `okf-link.md` resolves to, and reports the first step still owed under
  `.okf/`, naming the command that discharges it (BR-4).
- It reports and never acts (BR-1), and its exit status is never a verdict
  (BR-5) - `okf check --archive` remains the only thing that refuses.
- When a change owes nothing, it says so and names the real gate (BR-6).
- When `okf-link.md` does not exist yet, it names `openspec status` and stops
  (BR-2).

**Deliberately narrower than first sketched.** The original idea was an autopilot
routing between workflow phases by inspecting the change directory. That is
already `openspec status`, whose `nextSteps` names the next artifact - so the
artifact half is dropped from this change entirely rather than reimplemented.
What remains is the half OpenSpec cannot see, because it does not read `.okf/`.

## Capabilities

### New Capabilities

- `okf-next`: what a change still owes the knowledge base, how that is derived,
  and why the command advises rather than refuses.

### Modified Capabilities

None.

## Scope And Non-Goals

**In scope:**

- `lib/next.mjs` deriving owed steps from file state.
- `bin/okf.mjs` command and help text.
- Extracting the artifact-presence and `pending_changes` reads that `checkChange`
  already performs, so both callers share one implementation.

**Non-goals:**

- Naming which artifact comes next. `openspec status` owns that (BR-2).
- Acting on any step (BR-1). No file is created, no command is run.
- Being a gate (BR-5). Exit status reports whether the question could be
  answered, never whether the answer was good.
- Printing the same line from `okf check`. Recorded as an open question on the
  entry: it would change `check`'s output contract, which CI parses.

## Acceptance Criteria

1. A change whose entries still list it in `pending_changes` is reported as owing
   the verification pass, with the command that discharges it. Governs: BR-3,
   BR-4.
2. A change with no `verification.md` is reported as owing it. Governs: BR-3.
3. A change with a `verification.md` whose Rule Evidence table is empty, while
   `okf-link.md` resolves to an entry, is reported as owing evidence. Governs:
   BR-3.
4. A change owing nothing prints a statement saying so, and names
   `okf check --archive <id>`. Governs: BR-6.
5. A change with no `okf-link.md` prints a line naming `openspec status`, and no
   list of missing artifacts. Governs: BR-2.
6. Every reported step includes a runnable command. Governs: BR-4.
7. The command creates no file, modifies none, and spawns no process. Governs:
   BR-1.
8. Exit status is zero whenever the question could be answered, including when
   steps are owed. Governs: BR-5.
9. A change whose okf-link rows all declare no domain knowledge is still reported
   as owing its verification pass. Governs: BR-3.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| A second readiness command gets treated as the gate | A team archives on `next` saying nothing is owed | BR-5 makes exit status meaningless as a verdict, and every clean output names `okf check --archive` |
| Overlap with `openspec status` grows over time | Two answers to one question | BR-2 makes the boundary a rule, and criterion 5 tests it |
| Duplicating `checkChange`'s reads | Two implementations of one derivation, drifting | Extract the shared reads rather than copying them; that extraction is a task in its own right |

## Impact

- `lib/next.mjs` - new.
- `lib/check.mjs` - the artifact-presence and `pending_changes` reads become
  shared rather than private.
- `bin/okf.mjs` - `case 'next'` and help text.
- `test/run.mjs` - fixtures.
- `.okf/features/okf-next.md` - new entry (already created).
- No template or schema change. No new dependency.
