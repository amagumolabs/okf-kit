# Test Cases

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | BR-9..BR-12 govern this change; BR-1 and BR-7 are pre-existing and constrain where the gate is wired in |
| Proposal | proposal.md | Eight acceptance criteria |
| Specs | specs/okf-archive-gate/spec.md | Six ADDED requirements |

# Acceptance Criteria Mapping

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |
| 1. Missing table errors at archive, warns before it | BR-9 | UT-101, UT-102 | The two halves of the escalation are separate cases because they exercise different reporters |
| 2. A missing required row errors, naming it | BR-10 | UT-103, UT-104 | One case per required row, so a matcher that only ever finds Lint is caught |
| 3. An empty or non-result Result errors | BR-11 | UT-105, NEG-101 | |
| 4. A placeholder command is caught by existing hygiene | BR-11 | UT-106 | Asserts the finding comes from the hygiene check, not from a second implementation |
| 5. `Not Applicable because <reason>` passes, bare fails | BR-11 | UT-107, NEG-102 | |
| 6. The gate spawns no child process | BR-12 | UT-108 | |
| 7. A change with no linked entries still has the table evaluated | BR-1 | UT-109 | |
| 8. This repo's own change archives clean | BR-9..BR-12 | IT-101 | Runs the real gate against this change directory |
| 9. Templates carry placeholders, instruction names AGENTS.md | BR-7 | UT-112, UT-113, UT-114 | UT-113 is the one that would catch a shipped `npm run lint` |

# Business Rule Coverage

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |
| BR-1 | okf-archive-gate | UT-109 | Change-scoped, not entry-scoped - the failure the existing gate already made once |
| BR-7 | okf-archive-gate | UT-110, UT-112, UT-113, UT-114 | The template and instruction must say the table is enforced, ship no ecosystem default, and name where a project declares its commands |
| BR-9 | okf-archive-gate | UT-101, UT-102, IT-101 | |
| BR-10 | okf-archive-gate | UT-103, UT-104, UT-111 | UT-111 covers the extra-row half of the rule |
| BR-11 | okf-archive-gate | UT-105, UT-106, UT-107, NEG-101, NEG-102 | |
| BR-12 | okf-archive-gate | UT-108 | |
| BR-2..BR-6, BR-8 | okf-archive-gate | - | Untouched by this change; their existing fixtures must keep passing, which IT-102 asserts |

# Spec Scenario Mapping

| Spec Requirement | Spec Scenario | Test Case IDs |
| --- | --- | --- |
| A change records its static analysis results | Archiving with no Static Analysis table | UT-101 |
| A change records its static analysis results | The same change before the archive boundary | UT-102 |
| A change records its static analysis results | A filled table | UT-100 |
| Lint and type checking each hold a required row | A table with no Typecheck row | UT-103 |
| Lint and type checking each hold a required row | A project with no type checker | UT-107 |
| Lint and type checking each hold a required row | An extra row | UT-111 |
| A row is satisfied by a result or a stated reason | A row with a command and a result | UT-100 |
| A row is satisfied by a result or a stated reason | A row whose result was never filled | UT-105, NEG-101 |
| A row is satisfied by a result or a stated reason | A row discharged with a reason | UT-107 |
| A row is satisfied by a result or a stated reason | A row discharged without a reason | NEG-102 |
| A row is satisfied by a result or a stated reason | A row still carrying the template placeholder | UT-106 |
| The gate reads reported results and runs nothing | Evaluating the table | UT-108 |
| The gate applies to a change with no linked entries | A change declaring no domain knowledge | UT-109 |
| The workflow states that the table is enforced | An agent reads the verification instruction | UT-110 |
| The workflow states that the table is enforced | An agent reads the verification template | UT-110 |
| The workflow states that the table is enforced | An agent reads the test-plan template | UT-112 |
| The workflow states that the table is enforced | The shipped templates name no ecosystem | UT-113 |
| A project declares its commands once | A project that has declared its commands | UT-114 |
| A project declares its commands once | A project that has not declared its commands | UT-114 |
| A project declares its commands once | The declaration is never parsed | UT-108 |

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-100 | must | The clean fixture stays archivable | The fixture's verification.md carries a satisfied Static Analysis table | `okf check --archive` runs | No static analysis finding is reported | BR-9 |
| UT-101 | must | Missing table blocks archive | verification.md has no Static Analysis section | `okf check --archive` runs | An error names the missing table | BR-9 |
| UT-102 | must | Missing table only warns in flight | The same verification.md | `okf check` runs without `--archive` | The same finding is reported at warn level and the run has no error | BR-9 |
| UT-103 | must | Missing Typecheck row | The table carries only a Lint row | `okf check --archive` runs | An error names the missing Typecheck row | BR-10 |
| UT-104 | must | Missing Lint row | The table carries only a Typecheck row | `okf check --archive` runs | An error names the missing Lint row | BR-10 |
| UT-105 | must | Empty result cell | The Typecheck row has a command and an empty result | `okf check --archive` runs | An error names that row | BR-11 |
| UT-106 | must | Placeholder command | The Lint row's command is still the angle-bracketed placeholder | `okf check --archive` runs | The unfilled-placeholder hygiene error fires, and the static analysis gate reports no separate placeholder finding | BR-11 |
| UT-107 | must | Not Applicable with a reason | The Typecheck row's result declares Not Applicable with a specific reason | `okf check --archive` runs | The row is accepted | BR-10, BR-11 |
| UT-108 | must | The gate runs nothing | The table names commands that would fail if executed | The gate evaluates the table | No child process is spawned | BR-12 |
| UT-109 | must | Change-scoped, not entry-scoped | Every okf-link row declares no domain knowledge, and the table is absent | `okf check --archive` runs | The static analysis error still fires | BR-1 |
| UT-110 | must | The workflow says the table is enforced | The shipped schema and verification template | Both are read | Each states that the Static Analysis table is checked at archive time | BR-7 |
| UT-111 | should | An extra row is unconstrained | The table carries a Build row alongside the required two | `okf check --archive` runs | No finding is reported about the Build row | BR-10 |
| UT-112 | should | The test-plan template carries the commands | The shipped test-plan template | It is read | Its Commands section holds a lint command and a typecheck command | BR-7 |
| UT-113 | must | No shipped template names an ecosystem | The shipped test-plan and verification templates | Both are read | Their lint and typecheck commands are angle-bracketed placeholders, and neither carries a language- or package-manager-specific command | BR-7 |
| UT-114 | should | The instruction names where commands are declared | The shipped schema | The `test-plan` instruction is read | It directs the agent to `AGENTS.md` outside the okf-kit markers, and to derive-confirm-record when nothing is declared | BR-7 |

# Integration Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-101 | must | This change archives clean | This repo's own `add-static-analysis-gate` directory with its verification filled | `okf check --archive add-static-analysis-gate` runs | Exit is clean | BR-9 |
| IT-102 | must | The existing archive gate is undisturbed | The full fixture suite for BR-1..BR-8 | `npm test` runs | Every pre-existing assertion still passes | BR-2..BR-6, BR-8 |

# Negative And Boundary Cases

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-101 | must | A result cell holding `-` | Error - `-` and empty both read as absent, which is this workflow's convention everywhere else | BR-11 |
| NEG-102 | must | A bare `Not Applicable` with no reason | Error - a reason shorter than `REASON_MIN` names nothing | BR-11 |
| NEG-103 | must | A result reading `not run` | Error - a non-result is not a result | BR-11 |
| NEG-104 | should | A table holding only the template's blank row | Treated as an empty table, matching how the promotion gate reads a blank row | BR-9 |
| NEG-105 | should | A Check cell spelled `Type check` with a space | Accepted - matching is case-insensitive and separator-insensitive by design | BR-10 |

# Not Applicable

| Area | Reason | Approved By |
| --- | --- | --- |
| Browser E2E | The kit is a command-line validator with no UI surface of any kind | change author |
| API E2E | The kit exposes no network interface; `bin/okf.mjs` is its only entry point, covered by the unit fixtures | change author |

# Open Questions

None. The one deferred question - whether Format and security scanning become
required rows later - is recorded in design.md and does not block these tests.
