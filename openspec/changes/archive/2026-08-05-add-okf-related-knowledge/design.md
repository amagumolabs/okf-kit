## Context

`okf-link.md` is the only route from a change into the bundle. Its OKF Link table
is a gate: `checkChange` requires its rows to mirror the proposal's Capabilities
section exactly, in both directions, and `readChangeState` turns those rows into
the linked entries that the archive gate, the Rule Evidence check, and `okf next`
all read. That invariant is what makes the table trustworthy, and it is also what
makes it narrow - a row means "this change writes here".

The knowledge that constrains a change is not so confined. This repository's own
bundle shows both leaks: `lib/check.mjs` is a declared `code_path` of five
entries, and `.okf/decisions/` holds twenty-six files that no artifact
instruction ever asks anyone to read.

The design question is not whether to widen what a change reads. It is where to
put the wider set so that widening the read set does not also widen the write set.

## Goals / Non-Goals

**Goals:**

- Record, per change, the bundle files it must read and must not modify.
- Derive candidates for that set from frontmatter the bundle already carries.
- Keep the obligation boundary sharp: reading creates no `pending_changes`, no
  verification duty, no attestation.
- Give the verification pass a written list to check a rule edit against, so
  `conflict` stops depending on unaided recall.

**Non-Goals:**

- Judging whether a scan was thorough or a listed file genuinely related.
- A new command. A new frontmatter field. A new dependency.
- Changing what the OKF Link table means or how it is checked.

## Decisions

**The read set gets its own table; the OKF Link table is not widened.** The
obvious move - one table with a "modified?" column - breaks the invariant that
makes the gate work. `checkChange` errors both ways against the proposal's
Capabilities section, so a related row would report as an undeclared capability,
and the proposal would report as missing a row it should never have. Worse,
`readChangeState` feeds `linked` to the archive gate, which would then demand a
Rule Evidence row, a cleared `pending_changes`, and an attestation for an entry
this change never opened for writing. Two tables in one file keeps the single
pointer surface every downstream artifact already reads, while keeping one of
them free of obligations. An entry is never in both: if a related file turns out
to need editing, it moves up, and the move is the thing that creates the duty.

**Relatedness is derived from existing frontmatter, never declared in a
`related:` field.** A `related:` list on an entry is an edge someone maintains by
hand, and nothing fails when it goes stale - it is wrong precisely when the
bundle has changed most, which is when it would be read. `affects_features` on a
decision and `code_paths` on a feature entry are already written for other
reasons and already kept honest by other gates (`okf audit` reads `code_paths`
against git; `okf check` resolves `affects_features` to files). Deriving from
them adds no field to the bundle format and no new thing to keep true.

**The derivation is a floor, not the definition of relatedness.** This change's
own scan is the evidence. Eleven candidates came from the two signals; the four
decisions that actually shaped this design include three the signals never
produced - `no-checker-for-meaning-judgements`, `required-records-harden-at-the-archive-boundary`,
and `advice-and-refusal-stay-in-different-commands`, all filed against
capabilities outside this change's write set. A rule that admitted only derived
rows would have excluded the constraints that decided the design. So judgement is
a first-class signal value, and the gate's finding for an underived candidate is
a warning about something possibly missing, never a claim to know the set.

**The gate reads structure and reports candidates; it never refuses over its own
derivation.** Table presence and row resolution have fixed shape, so they are
errors - warning first, error at `--archive`, since the set is written twice and
is legitimately incomplete in between. Whether a derived candidate belongs is an
inference over a heuristic, so it is a warning. Refusing on the difference
between the kit's derivation and the change's judgement would make the kit the
author of the read set, and the only way to satisfy it would be to paste every
candidate in - a full table that widened nothing.

**The derivation extends the shared change-state read.** `readChangeState`
already resolves the OKF Link rows and reads linked entries' frontmatter, which
is most of the input. Adding the related rows and the candidate computation there
keeps `checkChange` as the only place findings are produced, and leaves the door
open for `okf next` to read the same facts without a second derivation.

## Risks / Trade-offs

[The table becomes long enough that nobody reads it - fourteen rows for this
change] -> Rows point at a rule or a section rather than at a file, so the table
is an index into targeted reads. Dismissed candidates carry a one-line reason and
nothing more.

[The `code_paths` heuristic conflates "touches the same file" with "constrains the
same meaning"] -> Accepted and stated as an assumption on the entry. The cost of
a wrong candidate is one dismissal row; the finding is a warning for exactly this
reason.

[Guidance without a mechanical half decays] -> Partly accepted, as it already is
for the durability filter. The mechanical half here is real but shallow: the kit
can tell that the scan was recorded and that what it names exists, and cannot
tell that it was done well.

[`code_paths` is empty until an entry's first verification pass, so a brand-new
entry produces no overlap candidates] -> Inherent to deriving from evidence
rather than from intent. A new capability has no code to overlap with yet, and
the decision signal and judgement still apply.

## Open Questions

- Whether `okf next` should list an unwritten related scan among the steps a
  change still owes. Deferred: the normal-run warning already prints from the
  moment `okf-link.md` exists, so the archive gate is not the first sighting, and
  adding it later needs no change to what is recorded.
- Whether one hop should be added to the decision signal - decisions affecting a
  capability that is itself related, not only one in the write set. It would have
  derived two of this change's three judgement rows. Left out until a second
  change confirms the pattern, because one hop over a heuristic multiplies
  candidates faster than it multiplies relevance.
