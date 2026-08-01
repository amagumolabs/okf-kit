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

<!-- okf-kit:start v0.1.2 -->
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

- When the conversation crystallizes around one concrete, nameable capability -
  not an open-ended idea - ask: "Save what we discussed to OKF as unverified?"
- If the user agrees:
  1. Search `.okf/INDEX.md` and `.okf/features/` for an entry covering this
     capability or a close relative. Prefer enriching over creating a
     near-duplicate; ask to disambiguate only when several candidates are
     genuinely plausible.
  2. Create or enrich `.okf/features/<capability-name>.md` from
     `.okf/templates/feature.template.md`, `verified: unverified`, preserving
     provenance (quote the original request when there is no PRD/spec source).
  3. Give each new business rule the next `BR-n` id in that file. Never
     renumber, never reuse.
  4. Delete template sections you have no real content for. Never leave an empty
     table row or a `<placeholder>` behind.
  5. Run `okf index`, then `okf check`.
- If the user declines, keep exploring. Create nothing, and do not ask again
  until a different concrete capability emerges.
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
4. Per entry: set `verified` and `verified_at`, fill `code_paths`, remove this
   change id from `pending_changes`, append a Verification History row.
5. Promote durable decisions from `design.md` into `.okf/decisions/`, and fill the
   Decision Promotion table. Every row answers with a path under `.okf/decisions/`
   that resolves, or a reason the decision is change-local - never with silence.
6. Run `okf index` to regenerate `.okf/INDEX.md`, and fill the Needs Revision
   Ledger note for anything left at `needs-revision`.
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
