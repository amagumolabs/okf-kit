## Context

`checkChange` in `lib/check.mjs` already performs most of the reads this command
needs: which artifacts exist, which okf-link rows resolve to entries, whether
those entries still list the change in `pending_changes`. It performs them to
decide whether to report a finding.

`okf next` needs the same facts to decide what to say. The difference is the
verb, not the derivation.

## Goals / Non-Goals

**Goals:**

- One derivation of change state, read by both the gate and the advisor.
- Output an agent can act on without interpreting it.
- A boundary with `openspec status` that is enforced rather than remembered.

**Non-Goals:**

- Any artifact ordering.
- Any refusal.

## Decisions

**The shared reads are extracted, not copied.** `checkChange` keeps its findings
and `next` keeps its advice, but both call one function that answers "what is the
state of this change". Copying would produce two derivations that agree today and
diverge at the first change to either - and the one that diverges silently is the
advisor, because nothing fails when advice is wrong.

**Advice and refusal stay in different commands.** `okf check --archive` refuses;
`okf next` advises and always exits zero. The alternative - one command with a
`--advisory` flag - was rejected because a flag that turns a gate into advice is
a flag that gets added to the CI invocation on the first red build.

**The artifact half is dropped rather than delegated.** An earlier sketch had
this command route between workflow phases, which `openspec status` already does
through its `nextSteps`. Reimplementing it would put an ordering in two places,
and the copy in this kit would be the one that goes stale, since OpenSpec owns
the schema that defines the order. When `okf-link.md` is missing, naming the
other command is the whole answer.

**Every step carries its command.** A step reported as prose makes the next actor
translate it, and translation is where a workflow loses steps. This is the same
reason the schema's escape hatches demand a stated reason rather than a flag.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| The advisor and the gate disagree | They share one derivation; a fixture asserts that a change the gate accepts is a change the advisor reports as owing nothing |
| `next` becomes the de facto gate | Exit status is always zero when the question could be answered, and every clean output names the archive gate |
| Extracting shared reads destabilises `checkChange` | The extraction is a task of its own, landing before the new command, with the existing suite as its regression test |

## Migration Plan

None. New command, no bundle or template change.

## Open Questions

None blocking. Whether `okf check` should print the same line is recorded on the
entry and deferred: it would change an output contract CI parses.
