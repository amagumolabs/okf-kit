# OpenSpec + OKF

This project combines OpenSpec (change proposals, specs, tasks) with OKF
(`.okf/`, durable team knowledge) using the `okf-gated-feature` schema.

Almost all of the behavior is schema-driven and lives in
`openspec/config.yaml` and `openspec/schemas/okf-gated-feature/schema.yaml`,
because that survives `openspec update` - which regenerates the `openspec-*`
skill files under `.claude/`, `.codex/`, and `.cursor/` from the CLI's own
bundled templates. Never hand-edit those skill files.

The block below covers only the gaps the schema cannot reach:
`openspec-explore` never reads the schema, and `openspec-verify-change` /
`openspec-archive-change` run generic logic that does not consult per-artifact
instructions.

Background reading, not needed in every session: `.okf/README.md` (what belongs
in OKF, what the frontmatter states mean) and `docs/openspec-okf-workflow.md`
(the full lifecycle and who enforces what).

<!-- okf-kit:start v0.4.0 -->
## OKF Addendum

Managed by okf-kit. Do not edit inside these markers - changes are overwritten on
upgrade. Keep this block identical in `CLAUDE.md` and `AGENTS.md`.

### Naming (applies everywhere)

An OKF entry is named after the **capability**, never the change:
`.okf/features/<capability-name>.md`, matching `openspec/specs/<capability>/`.
`add-user-auth`, `fix-auth-mfa`, and `improve-login` all belong to `user-auth`.

### Explore

Explore has no fixed ending, so there is no automatic capture trigger. Its own
guardrail still holds: offer, never auto-capture.

The question to answer first is "does this capability have domain knowledge?",
not "does it have a business rule". Domain knowledge is any of: domain terms,
actors and roles, data entities, permissions, workflows, or business rules. One
of them is enough. A `BR-n` is the most visible kind, not the only kind - a
capability can carry permissions and terms long before any rule is settled, and
reading the test as "no rule, so nothing to save" loses exactly those.

- When the conversation crystallizes around one concrete, nameable capability -
  not an open-ended idea - and that capability has domain knowledge, ask:
  "Save what we discussed to OKF as unverified?"
- If the user agrees:
  1. Search `.okf/index.md` and `.okf/features/` for an entry covering this
     capability or a close relative. Prefer enriching over creating a
     near-duplicate; ask to disambiguate only when several candidates are
     genuinely plausible.
  2. Create or enrich `.okf/features/<capability-name>.md` from
     `.okf/templates/feature.md.tmpl`, `verification_state: unverified` and no
     `verified` key, preserving provenance (quote the original request when there is no PRD/spec source).
  3. Give each new business rule the next `BR-n` id in that file. Never
     renumber, never reuse.
  4. Delete template sections you have no real content for. Never leave an empty
     table row or a `<placeholder>` behind.
  5. Run `okf index`, then `okf check`.
- If the user declines, keep exploring. Create nothing, and do not ask again
  until a different concrete capability emerges.
- If the capability has no domain knowledge at all - repository scaffolding,
  build tooling, a log format - create nothing, and say so naming what makes it
  domain-free. That is an answer, not a shrug: propose will record it as
  `no domain knowledge - <reason>` in okf-link.md.

Creating nothing is not the end of the thought. If the conversation settled an
architectural decision that outlives the change - a layout, a boundary, a
constraint later capabilities inherit - say so, and make sure it reaches
`design.md` when the change is proposed. The verification pass promotes it into
`.okf/decisions/`, and `okf check --archive` refuses to archive a change until
every decision in `design.md` is accounted for. Never write `.okf/decisions/`
from explore: the decision is not settled yet, and there is no change id to cite
as its provenance.

Everything else explore already does - offering to capture design decisions,
scope changes, or new requirements into proposal/design/specs - is unchanged.

### Propose

No addendum needed. The schema's `okf-link` artifact makes an OKF entry a hard
prerequisite: it enriches an existing entry or creates one as `unverified`, and
invoking propose is itself the confirmation, so it does not re-ask.

### Verify and archive

`verify-change` produces a read-only report and `archive-change` only moves the
directory, so the OKF pass is an explicit extra step. Run it whenever
`verify-change` is invoked, and always before `archive-change` completes for a
change that has an `okf-link.md`.

Follow the `verification` artifact instruction in the schema - that is the full
procedure. In short:

1. Read every `.okf` entry in the `okf-link.md` table.
2. Fill the Rule Evidence table in `verification.md` with a real `file:line` or
   test name for each `BR-n` this change touches. A checkbox is not evidence, and
   the agent that wrote the code is not a neutral judge of it.
3. Act on each verdict: `okf-gap` updates the entry; `code-gap` is a defect to
   fix in code - never sync the entry down to match a bug; `conflict` goes to the
   user, and only becomes `needs-revision` when nobody can decide.
4. Per entry: set `verification_state` and `verified_at`, fill `code_paths`,
   remove this change id from `pending_changes`, append a Verification History
   row, and write the spec-shaped `verified[]` attestation for the entry's
   current content - replace it rather than appending across changes, and delete
   it on a `conflict` verdict. Never write a `human:` actor on someone's behalf:
   only the person named can make that attestation true.
5. Promote durable decisions from `design.md` into `.okf/decisions/`, and fill the
   Decision Promotion table. Every row answers with a path under `.okf/decisions/`
   that resolves, or a reason the decision is change-local - never with silence.
6. Run `okf index` to regenerate `.okf/index.md` and `.okf/log.md`, and fill the
   Needs Revision Ledger note for anything left at `needs-revision`.
7. Run `okf check --archive <change-id>`. It enforces the mechanical half of the
   above - pointers resolve, no placeholders survive, every cited `BR-n` has
   evidence, `pending_changes` is cleared, every decision in `design.md` is
   accounted for, no `skeleton` test archived without an owner. Fix what it
   reports; do not explain it away.

If this pass has not happened, treat it like any other incomplete artifact:
warn, and get explicit confirmation before archiving anyway. Do not skip it
silently, and do not make it an unconditional block - archive stays an informed
human decision.
<!-- okf-kit:end -->
