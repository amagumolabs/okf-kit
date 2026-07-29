# Start Feature Workflow

All feature work must start through the `start-feature` skill or command.

The workflow supports both PRD/spec files and natural-language feature requests.

## Required Flow

1. Explore first.
2. If the request or PRD/spec is too broad, create a slice plan and wait for the user to choose one slice.
3. Create `openspec/changes/<change-id>/input.md` for the selected slice.
4. Create `openspec/changes/<change-id>/okf-feature.md`.
5. Create OpenSpec `proposal.md`.
6. Create OpenSpec `specs/**/*.md`.
7. Create `design.md` only when technically needed.
8. Create `test-cases.md`.
9. Create `test-plan.md`.
10. Write pre-implementation unit tests.
11. Implement the feature.
12. Add and run integration tests.
13. Add and run E2E tests where relevant.
14. Fill `verification.md`.
15. Sync durable knowledge back to `knowledge/okf`.
16. Prepare the OpenSpec change for archive.

## Explore First

The skill must run `/opsx:explore` or emulate OpenSpec exploration before creating proposal/specs or writing code.

Explore must inspect:

- the user request
- PRD/spec file if provided
- existing OpenSpec specs
- existing OKF knowledge
- relevant codebase conventions
- existing test patterns

Do not implement if unresolved questions remain about data model, permissions, destructive behavior, public API contract, security, compliance, billing, or external integrations.

## Slice Gate

After exploration, decide whether the request is one bounded OpenSpec change or a broader PRD/initiative.

Create a slice plan instead of proceeding directly when the request includes any of these:

- multiple user journeys
- multiple APIs, resources, screens, or workflows
- UI and backend work that can be delivered separately
- data model, permissions, migration, and API changes mixed together
- more than one OpenSpec capability
- independent open questions for different areas
- work that is likely larger than one or two focused development sessions

When slicing is needed, create:

`openspec/changes/<initiative-id>/slice-plan.md`

The slice plan must include:

| Slice | Change ID | Why Separate | Dependencies | Recommended Order | Blocking Questions |
| --- | --- | --- | --- | --- | --- |
|  |  |  |  |  |  |

Recommend one smallest safe first slice.

Do not create `proposal.md`, `specs/**/*.md`, `test-cases.md`, `test-plan.md`, or implementation tasks until the user chooses one slice.

After the user chooses a slice, create `openspec/changes/<selected-change-id>/input.md` and continue the required flow for that slice only.

## OKF Locations

Use two OKF locations with different lifecycles:

- `openspec/changes/<change-id>/okf-feature.md` is the working OKF draft for the active change.
- `knowledge/okf/**` is durable team knowledge that has been reviewed or confirmed.

Do not treat every working OKF note as durable knowledge. Sync only confirmed and reusable knowledge.

## Durable OKF Structure

Use this structure for durable OKF files:

```text
knowledge/
  okf/
    README.md
    index.md
    log.md
    templates/
      feature-knowledge.template.md
    features/
      <feature-name>.md
    domains/
      <domain-name>.md
    decisions/
      <decision-name>.md
    api-contracts/
      <api-or-resource-name>.md
    operations/
      <playbook-name>.md
```

Use each folder as follows:

- `features/`: reviewed feature knowledge from PRDs, specs, explore output, or completed OpenSpec changes.
- `domains/`: stable domain concepts, terms, rules, and entity knowledge.
- `decisions/`: durable product, architecture, or process decisions.
- `api-contracts/`: public or internal API contract knowledge.
- `operations/`: runbooks, provider behavior, environment notes, and operational playbooks.
- `templates/`: team-approved OKF body profiles.

## OKF Sync Rules

During final verification, review `openspec/changes/<change-id>/okf-feature.md` and sync durable knowledge into `knowledge/okf`.

Sync knowledge when it is:

- a confirmed business rule
- a stable domain term or entity definition
- a confirmed permission or access-control rule
- a durable API contract
- a product or architecture decision
- a compliance, security, or operational constraint
- a reusable workflow or provider behavior

Do not sync:

- speculative assumptions
- unresolved open questions
- temporary implementation notes
- one-off debugging details
- requirements that were explicitly removed or rejected

If a working OKF item remains uncertain, leave it in the OpenSpec change and record the gap in `verification.md`.

## Implementation Gate

Do not implement until:

- `input.md` exists
- `okf-feature.md` exists
- proposal/specs exist
- `test-cases.md` exists
- `test-plan.md` exists
- pre-implementation unit tests are written or explicitly marked not applicable
- blocking questions are resolved or explicitly accepted

## Test Rules

Tests must be derived from OKF, OpenSpec specs, and acceptance criteria.

Pre-written tests must not be changed to match implementation unless:

- the test contradicts OKF/OpenSpec
- the requirement changed and OpenSpec was updated first
- the test has a mechanical bug
