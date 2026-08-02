## Why

The schema says at length what to write into an OKF entry. It says nothing about
what to keep out of one. The result is predictable: an entry accumulates the DTO
shape one change happened to settle, the wording of a validation message, the
layout of a form. All of it true when written, none of it durable, and every line
of it making the entry longer than the thing it was supposed to save people from
reading.

Truth is what makes the wrong content hard to argue with. The question that
separates it is not "is this correct" but "would a second change to this
capability still need it".

A related gap sits next to it. `propose` is told to read the linked entries
first, and nothing then tells it to stop asking the user what those entries
already answer. An agent that reads a file and then asks the question the file
answers has taught the user that the file is decorative.

## What Changes

- The `okf-link` instruction gains the filter: what belongs in an entry, what
  belongs in the spec or the design instead, and the durability test that
  separates them (BR-14, BR-15).
- `.okf/templates/feature.md.tmpl` states the same in its header comment, since
  that is what an agent reads while creating an entry.
- The `verification` instruction's section review gains one step: remove
  change-local detail that leaked in, on the same pass that corrects staleness.
- The `proposal` instruction, and the explore addendum in `AGENTS.md` /
  `CLAUDE.md`, state that a question an entry already answers is not asked - cite
  the rule id and move on - and that a question the entry leaves open in its
  Assumptions or Open Questions is exactly the one to ask (BR-16, BR-17).

## Capabilities

### New Capabilities

None.

### Modified Capabilities

- `okf-bundle-format`: adds BR-14..BR-17, extending the contract from the shape
  of an entry to its scope, and to who may ask about its contents.

## Scope And Non-Goals

**In scope:**

- Instruction and template text in the schema and `.okf/templates/`.
- The explore addendum block, kept identical in both marker files.

**Non-goals:**

- Any check. Whether a line in an entry is durable is a judgement about meaning,
  and a checker that guessed would either be ignored or obeyed wrongly - both
  worse than the guidance alone. This change deliberately ships no gate, and
  says so rather than leaving the absence to be discovered.
- Trimming the entries this repository already holds. The rules apply going
  forward; a cleanup is its own change with its own review.
- Preventing an agent from asking anything. BR-17 is the other half: where the
  entry is open, asking is right.

## Acceptance Criteria

1. The `okf-link` instruction names what does not belong in an entry, and where
   it belongs instead. Governs: BR-14.
2. The instruction states the durability test in the form "would a second change
   still need it", not "is it true". Governs: BR-15.
3. `.okf/templates/feature.md.tmpl` carries the same filter in its header
   comment. Governs: BR-14.
4. The `verification` instruction directs the section review to remove
   change-local detail. Governs: BR-14.
5. The `proposal` instruction states that a question the entry answers is not
   re-asked. Governs: BR-16.
6. The same instruction states that Assumptions and Open Questions are what
   generate a question. Governs: BR-17.
7. The explore addendum states both, identically in `AGENTS.md` and `CLAUDE.md`.
   Governs: BR-16, BR-17.
8. `okf check` gains no new finding from this change. Governs: the non-goal
   above.

## Risks

| Risk | Impact | Mitigation |
| --- | --- | --- |
| Guidance with no check is guidance that decays | The filter is ignored within a release | Accepted and stated. The alternative is a checker guessing at meaning, which the kit has refused before on the same grounds it refuses to prove a `human:` attestation |
| An agent over-applies the filter and strips real domain knowledge | Entries lose content they needed | The filter names categories that belong elsewhere and gives them a destination, rather than a rule to delete. Nothing is removed without a home |
| BR-16 is read as "never ask the user" | Agents stop clarifying and start assuming | BR-17 exists precisely for this, and is stated in the same breath everywhere BR-16 appears |

## Impact

- `openspec/schemas/okf-gated-feature/schema.yaml` - three instructions; schema
  `version` bumps.
- `.okf/templates/feature.md.tmpl` - header comment.
- `AGENTS.md` and `CLAUDE.md` - the explore addendum inside the markers, kept
  identical.
- `test/run.mjs` - fixtures asserting the shipped text.
- `lib/check.mjs` - untouched.
