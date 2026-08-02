## Context

Two templates carry tables with no vocabulary in them: Negative And Boundary
Cases, and Browser E2E. Both were written as places to record what an author
thought of. Neither prompts.

The kit already has one mechanism for this shape of problem - the test-plan's
status vocabulary, which is exactly four words and refuses others. That works
because the four are checkable. Boundary classes are not: nothing can tell a
considered row from a fabricated one.

## Goals / Non-Goals

**Goals:**

- Turn two tables from records into prompts.
- Keep the pressure on the author, not on a checker that cannot see what it
  needs to see.

**Non-Goals:**

- Erroring on a missing class.
- A taxonomy. Six classes, chosen for what authors miss.

## Decisions

**The classes are seeded rows, not a comment.** A comment listing categories is
read once and scrolled past; a row is a thing with an empty cell in it. This is
the same reason the schema seeds `UT-001` rather than describing what a test case
id looks like.

**The check warns on an empty table and says nothing else.** Whether six classes
were genuinely considered is not observable from the file, and a rule the checker
cannot see is a rule the checker must not pretend to enforce - the kit already
settled this for test ordering, which it records and does not verify. Total
silence is the one state that is observable, and it is the one worth a warning.

**Six classes, and the sixth is scope isolation rather than "multi-tenancy".**
The rulebook that prompted this named tenant leaks, because that project is
multi-tenant. The general form is: data reachable across a boundary it should not
cross - tenant, workspace, user, project. Naming the general form keeps the row
meaningful in a single-tenant system, where the boundary is the user.

**The UI states ship in the template even though this kit has no UI.** The gap
was observed downstream, and a rule that only ships where it can be dogfooded
never ships. This change's own test-cases discharges the class with a reason,
which is the mechanism working rather than an exception to it.

## Risks / Trade-offs

| Risk | Mitigation |
| --- | --- |
| Seeded rows get filled mechanically | Unfixable by tooling; kept a warning so the cost of a fabricated row falls on review, where a human can see it |
| The Artifacts column is left empty on every row | It is a column, not a gate. BR-16 asks that the question be asked; a change with no artefact writes `-` as it does everywhere else |
| Adding a column breaks a project's existing filled table | Tables are read by header name throughout the kit, and a missing column reads as an absent value rather than an error |

## Migration Plan

Schema `version` bumps. Templates change; nothing in `.okf/` changes shape, so
`okf migrate` has nothing to do. A change already in flight keeps its existing
tables and sees at most the empty-table warning.

## Open Questions

None blocking.
