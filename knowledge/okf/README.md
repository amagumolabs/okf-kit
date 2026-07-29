# OKF Knowledge

This folder contains durable team knowledge in Open Knowledge Format style: Markdown files with YAML frontmatter and source provenance.

Active feature changes may draft OKF in:

```text
openspec/changes/<change-id>/okf-feature.md
```

Only confirmed, reusable knowledge should be synced here.

## Structure

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

## Folder Usage

- `features/`: reviewed feature knowledge from PRDs, specs, explore output, or completed OpenSpec changes.
- `domains/`: stable domain concepts, terms, rules, and entity knowledge.
- `decisions/`: durable product, architecture, or process decisions.
- `api-contracts/`: public or internal API contract knowledge.
- `operations/`: runbooks, provider behavior, environment notes, and operational playbooks.
- `templates/`: team-approved OKF body profiles.

## Sync Rules

Sync durable knowledge from an OpenSpec change when it is confirmed and reusable.

Good candidates:

- confirmed business rules
- stable domain terms or entity definitions
- confirmed permission or access-control rules
- durable API contracts
- product or architecture decisions
- compliance, security, or operational constraints
- reusable workflows or provider behavior

Do not sync:

- speculative assumptions
- unresolved open questions
- temporary implementation notes
- one-off debugging details
- requirements that were explicitly removed or rejected
