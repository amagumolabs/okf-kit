# Verification

<!-- Record what actually ran and its real result. If a check was not run, say so and why. -->

# Results

| Check | Command | Result |
| --- | --- | --- |
| OpenSpec validation | `openspec validate <change-id>` |  |
| Unit tests | `<test-command>` |  |
| Integration / E2E tests | `<test-command>` |  |
| Lint | `<lint-command>` |  |
| Knowledge check | `node .okf/check.mjs` |  |

# OKF Verification

## Rule Evidence

<!--
One row per rule this change touches, cited as `<capability>/BR-<slug>`. Verdicts:
- `match`    - code does what the rule says
- `okf-gap`  - entry was stale, code is right -> entry updated (say what changed)
- `code-gap` - entry is right, code is wrong -> code fixed; never edit the entry to match a bug
- `conflict` - a human decides; only this may end in `needs-revision`
-->

| Rule (capability/BR-<slug>) | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |

## Decision Promotion

<!-- Each decision in design.md: a path under `.okf/decisions/`, or why it is change-local. Delete this section if design.md is "Not required because ...". -->

| Decision | Promoted To Or Reason Not Promoted |
| --- | --- |

# Known Gaps And Accepted Risks

| Gap Or Risk | Owner | Follow-Up |
| --- | --- | --- |

# Archive Readiness

- [ ] Tests and OpenSpec validation pass, or failures are explained above
- [ ] Every `skeleton` / `planned` test is in test-plan Known Gaps with an owner
- [ ] Every rule touched has evidence and a verdict
- [ ] Every linked entry: `verification_state` and `verified_at` set, `code_paths` filled, this change removed from `pending_changes`, Verified By recorded
- [ ] Durable decisions promoted, new files in `.okf/index.md`, `node .okf/check.mjs` warnings handled
