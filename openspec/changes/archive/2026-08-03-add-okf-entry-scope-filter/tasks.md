## 1. Contract Stubs

<!--
Dropped: this change adds no code surface. Every test reads a shipped file, so
there is nothing that must exist before a test can fail on its assertion. Stated
in test-plan.md under Contract Stubs rather than left as an empty group.
-->

## 2. Pre-Implementation Unit Tests

- [x] 2.1 Add the `instructionFor(schema, artifactId)` helper to `test/run.mjs`, anchored at line start
- [x] 2.2 Write UT-501, UT-502, UT-503 - the filter and its durability test, in the schema and the template
- [x] 2.3 Write UT-504 - the verification section review
- [x] 2.4 Write UT-505 and UT-506 as separate tests - shipping one half without the other is the failure mode
- [x] 2.5 Write UT-507 - the addendum carries the rule and both marker files agree
- [x] 2.6 Write UT-508 - the clean fixture's finding count is unchanged
- [x] 2.7 Run `npm test` and record each actual assertion failure in the test-plan's Initial Status

## 3. Integration And E2E Skeletons

<!-- Dropped: both integration rows are `passing` from the start, because they assert that existing behaviour is unchanged. Stated in test-plan.md. -->

## 4. Implementation

- [x] 4.1 Add the filter to `okf-link.instruction` in `schema.yaml`: what belongs, what belongs in the spec or design instead, and the destination for each excluded category
- [x] 4.2 State the durability test there as a question about a second change to the same capability
- [x] 4.3 Add the same filter to the header comment of `.okf/templates/feature.md.tmpl`
- [x] 4.4 Extend the section-review step of `verification.instruction` to direct removal of change-local detail
- [x] 4.5 Add BR-16 and BR-17 to `proposal.instruction`, always in the same breath
- [x] 4.6 Add both to the explore addendum in `AGENTS.md` and `CLAUDE.md`, keeping the blocks byte-identical
- [x] 4.7 Bump `version` in `schema.yaml`
- [x] 4.8 Run `npm test` until every test from group 2 is green, with no test edited to get there
- [x] 4.9 Confirm `lib/check.mjs` is untouched by this change - `git diff --stat` names no line in it

## 5. Integration Tests

- [x] 5.1 Run `npm test` in full and confirm IT-502
- [x] 5.2 Run `okf check` on this repository and confirm the finding count is unchanged (IT-501)

## 6. E2E Tests

<!-- Dropped: the kit has neither a network interface nor a UI. Stated in test-plan.md. -->

## 7. Verification And OKF Pass

- [x] 7.1 Run the full suite, `npm run lint`, and `openspec validate`; record real results in verification.md
- [x] 7.2 Fill the Static Analysis table in verification.md
- [x] 7.3 For BR-14..BR-17, find the evidence in the shipped schema, template and addendum and fill the Rule Evidence table with real `file:line` references
- [x] 7.4 Apply the filter to this entry itself while reviewing its sections - if BR-14 does not survive contact with the file that states it, it is wrong
- [x] 7.5 Set `verified` and `verified_at` on `okf-bundle-format`, fill `code_paths`, and clear `pending_changes`
- [x] 7.6 Promote any durable decision from design.md to `.okf/decisions/` - the refusal to ship a checker for a judgement about meaning is the candidate
- [x] 7.7 Run `okf index`, then `openspec validate okf-bundle-format --strict` against the synced baseline spec

## 8. Archive Readiness

- [x] 8.1 Run `okf check --archive add-okf-entry-scope-filter` and fix everything it reports
- [x] 8.2 Complete the Archive Readiness checklist in verification.md
