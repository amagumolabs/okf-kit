# OKF Link

| Capability | OKF File | Verified | Pending For This Change | New Or Enriched |
| --- | --- | --- | --- | --- |
| okf-related-knowledge | `.okf/features/okf-related-knowledge.md` | unverified | yes | new |
| okf-archive-gate | `.okf/features/okf-archive-gate.md` | verified | yes | enriched |

**Last synced**: 2026-08-05T00:00:00Z

<!--
Two capabilities. The reading surface itself is a new subject - no existing entry
answers "which knowledge does a change read that it does not write". The archive
gate is enriched rather than reinterpreted: it gains one more required record,
on the terms it already applies to decision promotion and static analysis.
-->

# Related Knowledge

Read for this change, not modified by it. This table is the surface the change
itself proposes, filled by its own rules: the signal column names what produced
the candidate, and a candidate judged irrelevant keeps its row rather than
disappearing.

| File | Signal | Why It Bears On This Change | Read |
| --- | --- | --- | --- |
| `.okf/decisions/2026-08-02-no-checker-for-meaning-judgements.md` | judgement | The load-bearing constraint on scope: whether a scan was thorough is a judgement about meaning, so the gate reads structure only and the absence of a deeper check is recorded as deliberate | Whole decision, especially Consequences |
| `.okf/decisions/2026-07-30-finding-severity-follows-signal-strength.md` | affects okf-archive-gate | Decides the severity of each new finding: table presence and row resolution read fixed shape and are errors; an underived candidate rests on inference and is a warning | Decision and Consequences |
| `.okf/decisions/2026-08-02-required-records-harden-at-the-archive-boundary.md` | judgement | Gives the warning-then-error shape for a record that cannot be complete when it is first written, which is exactly the related scan's shape | Decision and Consequences |
| `.okf/decisions/2026-08-02-advice-and-refusal-stay-in-different-commands.md` | judgement | Rules out the obvious alternative of an `okf related` lookup command as a second readiness surface | Decision and Alternatives Considered |
| `.okf/decisions/2026-08-02-shared-change-state-reads-are-extracted.md` | affects okf-archive-gate | The candidate derivation is change-state reading, so it belongs in `readChangeState` rather than being written a second time | Decision and Consequences |
| `.okf/decisions/2026-08-02-the-kit-records-reported-evidence-it-does-not-reproduce-it.md` | affects okf-archive-gate | Bounds what the gate may do with a candidate it derives: report it, never refuse on the difference between its derivation and the change's judgement | Decision |
| `.okf/decisions/2026-07-30-decision-promotion-is-derived-from-design-shape.md` | affects okf-archive-gate | Precedent for a required record whose obligation is derived from a file's shape rather than from a checklist item | Decision |
| `.okf/decisions/2026-08-03-a-rule-the-checker-cannot-see-stays-with-the-author.md` | affects okf-archive-gate | The nearest precedent of all: a rule about having considered something is prompted by the template, and the checker reports only that nothing was written - warning, counting rows rather than the thing the rule is about. BR-13 and BR-15 are the same shape | Decision and Context |
| `.okf/features/okf-bundle-format.md` | code_paths overlap (`lib/check.mjs`, `schema.yaml`) | The derivation reads `affects_features` and `code_paths`, which this entry owns as frontmatter contract - the change adds no field to any entry | BR-1..BR-3, Domain Terms |
| `.okf/features/artifact-hygiene.md` | code_paths overlap (`lib/check.mjs`) | The new template section ships placeholders into every change directory, and hygiene reaches change artifacts | Requirement "Hygiene applies to change artifacts" |
| `.okf/features/okf-durable-references.md` | code_paths overlap (`lib/check.mjs`) | Related rows carry paths, so they must use forms that survive archiving | BR-1, and the fenced-block escape |
| `.okf/features/test-first-gate.md` | code_paths overlap (`lib/check.mjs`, `schema.yaml`, `templates/verification.md`) | Constrains how this change is built - every test file precedes its implementation - and shares the verification template this change edits | Requirement on test files preceding implementation |
| `.okf/features/okf-next.md` | code_paths overlap (`lib/check.mjs`) | Shares `readChangeState`; whether `next` should report an unwritten scan is the entry's Open Question, deferred here | BR-2, BR-5 |
| `.okf/decisions/2026-08-02-status-is-live-and-initial-status-is-history.md` | affects okf-archive-gate | Dismissed - test-plan column semantics, no bearing on the reading surface | Not read further |
| `.okf/decisions/2026-08-02-a-project-declares-its-commands-in-its-own-agents-file.md` | affects okf-archive-gate | Dismissed - static analysis command declaration, unrelated | Not read further |

<!--
Column meaning:

- **Verified**: the entry's `verified` value mirrored at the time of writing.
  This table is a mirror; the `.okf` entry is the source of truth.
- **Pending For This Change**: `yes` while this change id sits in the entry's
  `pending_changes`. The verification pass removes the id and flips this to `no`.
- **New Or Enriched**: whether this change created the entry or added to an
  existing one.

Related Knowledge rows carry no obligation: no `pending_changes`, no
verification, no attestation. An entry that turns out to need editing moves up
into the OKF Link table and stops being related.
-->
