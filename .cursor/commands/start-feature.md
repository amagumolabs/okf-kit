---
name: start-feature
id: start-feature
category: Workflow
description: Use when starting or implementing any feature from a PRD, spec file, issue, ticket, or natural-language request. Enforces explore-first, OKF Feature Knowledge, OpenSpec proposal/specs, test cases, test plan, pre-implementation unit tests, implementation, integration/E2E verification, OKF sync, and OpenSpec archive readiness.
---

# Start Feature

This skill is the required entrypoint for feature work.

Never implement immediately from a feature request.

## Inputs

The user may provide:

- a PRD/spec file path
- a ticket/issue description
- a natural-language request
- a mix of the above

If no change id is provided, generate a kebab-case change id from the request.

Example:

`I would like to implement CRUD company api` -> `add-company-crud-api`

## Required Workflow

1. Explore first.
2. If the request or PRD/spec is too broad, create a slice plan and wait for the user to choose one slice.
3. Create `openspec/changes/<change-id>/input.md` for the selected slice.
4. Create `okf-feature.md`.
5. Create OpenSpec `proposal.md`.
6. Create OpenSpec `specs/**/*.md`.
7. Create `design.md` only if technically needed.
8. Create `test-cases.md`.
9. Create `test-plan.md`.
10. Create pre-implementation unit tests.
11. Implement the feature.
12. Add/run integration tests.
13. Add/run E2E tests where relevant.
14. Fill `verification.md`.
15. Sync durable knowledge back to OKF.
16. Prepare OpenSpec archive readiness.

## Step 1: Explore First

Before creating proposal/specs or writing code, run OpenSpec exploration.

If `/opsx:explore` is available, use it.

If `/opsx:explore` is not available, emulate the same behavior manually.

Explore must inspect:

- the user request
- PRD/spec file if provided
- existing OpenSpec specs
- existing OKF knowledge
- relevant codebase conventions
- existing test patterns

Explore output must identify:

- proposed change id
- smallest safe feature slice
- explicit requirements
- assumptions
- blocking open questions
- non-blocking open questions
- likely affected capabilities
- test strategy outline

Do not proceed to implementation if blocking questions remain about:

- data model
- permissions
- destructive behavior
- public API contract
- security
- compliance
- billing
- external integrations

## Step 2: Create input.md

Create:

`openspec/changes/<change-id>/input.md`

It must include:

- original request quoted exactly
- input mode: PRD/spec file or natural-language prompt
- source files if any
- exploration summary
- proposed change id
- explicit requirements
- confirmed decisions
- assumptions
- blocking open questions
- non-blocking open questions
- handoff notes for OKF/OpenSpec

## Step 3: Create OKF Feature Knowledge

Create:

`openspec/changes/<change-id>/okf-feature.md`

Use the repository template if present:

`openspec/schemas/quality-gated-feature/templates/okf-feature.md`

Rules:

- use `input.md` as source
- preserve PRD/spec provenance if present
- do not invent requirements
- put inferred details under Assumptions
- put unresolved blockers under Open Questions
- separate durable knowledge from implementation details

## Step 4: Create OpenSpec Artifacts

Use the repo's `quality-gated-feature` schema if present.

Create or update:

- `proposal.md`
- `specs/**/*.md`
- `design.md` if needed
- `test-cases.md`
- `test-plan.md`
- `tasks.md`

Do not create implementation tasks before test planning exists.

## Step 5: Tests Before Implementation

Before implementation:

- write unit tests from `test-cases.md` and `test-plan.md`
- tests must express feature behavior, not implementation details
- tests may fail before implementation

Do not rewrite pre-written tests to match implementation unless:

- the test contradicts OKF/OpenSpec
- the requirement changed and OpenSpec was updated first
- the test has a mechanical bug

## Step 6: Implementation

Implement only after:

- `input.md` exists
- `okf-feature.md` exists
- proposal/specs exist
- `test-cases.md` exists
- `test-plan.md` exists
- pre-implementation unit tests are written or explicitly marked not applicable
- blocking questions are resolved or explicitly accepted

Work through `tasks.md` and mark tasks complete as they are verified.

## Step 7: Verification And Archive Readiness

Before finishing:

- run OpenSpec validation
- run unit tests
- run integration tests
- run E2E tests where relevant
- fill `verification.md`
- update durable OKF if business rules, domain terms, decisions, or constraints changed
- state any proof gaps honestly
- prepare the OpenSpec change for archive
