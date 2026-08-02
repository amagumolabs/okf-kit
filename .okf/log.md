# OKF Log

<!--
GENERATED FILE - derived from the Verification History table of every entry under
`features/`. Regenerate with `okf index`; do not edit by hand.

Newest date first, as the specification's log format requires.
-->


## 2026-08-02

**Update** `okf-durable-references` verified in `guard-durable-references` - BR-1 lib/check.mjs:209 (frontmatter) and 566-569 (body), tests at test/run.mjs:384,412; BR-2 lib/check.mjs:545-574, tests at 419,424,476,499; BR-3 lib/check.mjs:156-163, tests at 438,443,448,453; BR-4 lib/check.mjs:185 via stripFences, tests at 458,463,471; BR-5 no filename list exists in checkDurableReferences - only the `.md` extension filter at lib/check.mjs:556 - tests at 499 and projectTest 1911; BR-6 no resolution attempted anywhere, test at 490; BR-7 lib/check.mjs:566-568 and changeIdFromLocator:169-174, tests at 517,524. Two implementation defects were caught by the pre-written tests and fixed in code: double reporting of frontmatter locators, and trailing punctuation absorbed into the matched path

## 2026-08-01

**Update** `okf-audit` verified in `okf-spec-conformance` - BR-4 and BR-6 re-checked after the field rename: lib/audit.mjs:142-143 now selects on `verification_state`. BR-10 traced to the same lines - the selection never reads `verified[]`, so a migrated entry is still audited. BR-1, BR-2, BR-3, BR-5, BR-7, BR-8, BR-9 untouched by this change and not re-traced.
**Update** `okf-bundle-format` verified in `okf-spec-conformance` - BR-1 lib/check.mjs:16,270,310; BR-2 enforced by the schema instruction, not by code - see Not Applicable in test-cases.md; BR-3 lib/check.mjs:327,343; BR-4 lib/check.mjs:363; BR-5 lib/check.mjs:354 (warn only); BR-6 .okf/profile.md "What this kit does not claim"; BR-7 lib/check.mjs:458; BR-8 lib/index-gen.mjs:8,11 and lib/check.mjs:498; BR-9 lib/check.mjs:25,233,378; BR-10 lib/check.mjs:17,428,435; BR-11 .okf/profile.md. BR-12 and BR-13 are unenforceable by construction and recorded as such.
**Update** `okf-migrate` verified in `okf-spec-conformance` - BR-1 lib/migrate.mjs:28-45 writes no `verified` key; BR-2 lib/install.mjs:26-28 payload excludes features/ and decisions/, asserted by the upgrade integration test; BR-3 lib/check.mjs:327 keeps it a warning; BR-4 lib/check.mjs:40 COUPLING_SEVERITY; BR-5 lib/migrate.mjs:111 alreadyCurrent; BR-6 lib/migrate.mjs:118 rebuilds only the frontmatter region. Run against this repository's own 7 files: 7 rewritten, second run 0.

## 2026-07-30

**Update** `okf-archive-gate` verified in `enforce-decision-promotion` - BR-1..BR-8 all `match` against `lib/check.mjs:641-802`, each row naming a line read after implementation. 88 unit tests pass, up from 68; 19 of the 20 new assertions were red before implementation. The original defect was reproduced on a real downstream change (`m7-okf` at `workspace-foundation`) and is now caught. Data Entities corrected during the pass: a `-` cell reads as absent, which the entry had not stated
**Update** `okf-audit` verified in `fix-audit-untracked-paths` - BR-9 traced to lib/audit.mjs:162-163 and :78; BR-3 and BR-8 re-checked because this change edited the requirement citing them. Data Entities corrected to list the new result fields.
**Update** `okf-audit` verified in `add-okf-audit` - All 8 rules traced to `lib/audit.mjs` with line references, see the change's verification.md. BR-8 was added during this pass after finding the audit reported `current` for comparisons it never made.
