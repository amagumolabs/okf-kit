/**
 * Fixture tests for `okf check` and `okf index`. No dependencies: build a tiny
 * repo in a temp dir, break one thing at a time, assert the right finding fires.
 *
 * Run with `npm test` or `node test/run.mjs`.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { audit } from '../lib/audit.mjs';
import { check } from '../lib/check.mjs';
import { buildIndex, writeIndex } from '../lib/index-gen.mjs';
import { install, payloadPaths } from '../lib/install.mjs';
import { migrate } from '../lib/migrate.mjs';
import { next } from '../lib/next.mjs';

const KIT = path.resolve(import.meta.dirname, '..');

let passed = 0;
const failures = [];
const todos = [];

/**
 * A test that is declared but has no body yet - this harness's pending
 * mechanism, and the only way a row in a test-plan can honestly read
 * `skeleton`. It is reported in the summary so it cannot be forgotten, and it
 * never fails the run.
 */
function todo(name) {
  todos.push(name);
}

function test(name, fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-test-'));
  try {
    scaffold(root);
    fn(root);
    passed++;
  } catch (err) {
    failures.push({ name, err });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}

const write = (root, rel, text) => {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  fs.writeFileSync(p, text);
};
const readF = (root, rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const edit = (root, rel, fn) => write(root, rel, fn(readF(root, rel)));

/** Findings whose message matches `re`, at the given level. */
function find(report, re, level = 'error') {
  return report.findings.filter((f) => f.level === level && re.test(f.message));
}
function assertError(report, re, msg) {
  const hits = find(report, re);
  assert.ok(
    hits.length > 0,
    `${msg}\nexpected an error matching ${re}\ngot:\n` +
      report.findings.map((f) => `  [${f.level}] ${f.file}: ${f.message}`).join('\n')
  );
}

// ---------------------------------------------------------------------------
// A clean, self-consistent fixture repo
// ---------------------------------------------------------------------------

const ENTRY = `---
type: Feature Knowledge
title: user-auth
description: How users authenticate and what MFA requires.
status: stable
verification_state: verified
verified_at: 2026-07-30
verified:
  - by: anthropic/claude-opus-5
    at: 2026-07-30T00:00:00Z
  - by: human:danh
    at: 2026-07-30T09:00:00Z
criticality: high
pending_changes: []
code_paths: [src/auth/**]
sources:
  - id: prd
    resource: docs/prd.md
  - id: change
    resource: change:add-mfa
linked_changes:
  - add-mfa
generated:
  by: anthropic/claude-opus-5
  at: 2026-07-30T00:00:00Z
---

# Summary

Users authenticate with a password and, for admin roles, a second factor.

# Business Rules

| ID | Rule | Source |
| --- | --- | --- |
| BR-1 | An admin session MUST require a second factor. | prd |

# Permissions And Access Control

| ID | Action | Allowed Actor | Denied Actor | Rule |
| --- | --- | --- | --- | --- |
| BR-2 | Reset another user's MFA | Admin | Member | Only admins reset MFA. |
`;

const PROPOSAL = `## Why

Admin accounts need a second factor.

## Capabilities

### New Capabilities
- \`user-auth\`: authentication and MFA

### Modified Capabilities
`;

const OKF_LINK = `# OKF Link

| Capability | OKF File | Verified | Pending For This Change | New Or Enriched |
| --- | --- | --- | --- | --- |
| user-auth | \`.okf/features/user-auth.md\` | verified | no | enriched |

**Last synced**: 2026-07-30T00:00:00Z
`;

/**
 * Two decisions in the house style this repository's own designs use: a bold lead
 * sentence per paragraph. `countDecisions` must also handle the numbered form, so
 * UT-014 rewrites this into `1. **Title**` items and asserts the same count.
 */
const DESIGN = `## Context

MFA changes how sessions are established.

## Decisions

**Verify the second factor before creating the session.** A session created first
and downgraded later is a window an attacker can use.

**Keep TOTP as the only factor for now.** SMS delivery is not reliable enough in
the regions this ships to, and adding it later is additive.

## Risks / Trade-offs

- Lost devices lock admins out -> recovery codes, out of scope here.
`;

const DECISION = `---
type: Decision
title: Verify the second factor before creating the session
description: The second factor is checked before a session exists, never after.
date: 2026-07-30
status: stable
decision_status: accepted
affects_features:
  - user-auth
sources:
  - id: change
    resource: change:add-mfa
linked_changes:
  - add-mfa
---

# Decision

The second factor is verified before a session is created.

# Consequences

Sign-in is one step slower and there is no window in which a half-authenticated
session exists.
`;

const SPEC = `## ADDED Requirements

### Requirement: Admin sessions require MFA
The system SHALL require a second factor for admin sessions.

Implements: BR-1

#### Scenario: Admin without MFA
- **WHEN** an admin signs in without a second factor
- **THEN** the session is refused
`;

const TEST_PLAN = `# Test Plan

# Test Strategy

- Unit: MFA rule
- Integration: session creation
- API E2E: sign-in journey
- Browser E2E: not applicable, no UI in this change

# Pre-Implementation Unit Tests

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | BR-1 | src/auth/mfa.test.ts | refuses admin without mfa | failing: expected 403, got 200 | dropping the second-factor check from the session builder | - |

# E2E Tests

| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | skeleton | passing | - |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
`;

/**
 * The fixture's test-case matrix. No fixture carried this artifact before the
 * boundary check needed one, so it ships minimal: one unit case, and one
 * boundary row so the clean fixture is silent rather than warning.
 */
const TEST_CASES = `# Test Cases

# Unit Test Cases

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | must | Admin without MFA | an admin account | it signs in with no second factor | the session is refused | BR-1 |

# Negative And Boundary Cases

| Class | ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- | --- |
| Absence | NEG-001 | must | No second factor is presented | the session is refused | BR-1 |
`;

const VERIFICATION = `# Verification

# Rule Evidence

| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |
| --- | --- | --- | --- | --- |
| BR-1 | user-auth | src/auth/mfa.ts:42 | match | none |
| BR-2 | user-auth | src/auth/admin.ts:17 | match | none |

# Entry Outcome

| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |
| --- | --- | --- | --- | --- | --- |
| user-auth | \`.okf/features/user-auth.md\` | verified | 2026-07-30 | yes | yes |

# Static Analysis

| Check | Command | Result |
| --- | --- | --- |
| Lint | \`npm run lint\` | clean, 0 errors 0 warnings |
| Typecheck | \`npm run typecheck\` | clean, 0 errors |

# Decision Promotion

| Decision | Promoted To | Reason If Not Promoted |
| --- | --- | --- |
| Verify the second factor before creating the session | \`.okf/decisions/2026-07-30-verify-factor-before-session.md\` | - |
| Keep TOTP as the only factor for now | - | change-local: revisited by the next factor added, and the spec already states the current factor |
`;

function scaffold(root) {
  fs.mkdirSync(path.join(root, '.okf', 'features'), { recursive: true });
  fs.mkdirSync(path.join(root, '.okf', 'decisions'), { recursive: true });
  fs.copyFileSync(path.join(KIT, 'openspec', 'config.yaml'), pathEnsure(root, 'openspec/config.yaml'));

  write(root, 'docs/prd.md', '# PRD\n\nAdmin accounts need a second factor.\n');
  write(root, '.okf/features/user-auth.md', ENTRY);
  write(root, '.okf/decisions/2026-07-30-verify-factor-before-session.md', DECISION);
  write(root, 'openspec/changes/add-mfa/okf-link.md', OKF_LINK);
  write(root, 'openspec/changes/add-mfa/proposal.md', PROPOSAL);
  write(root, 'openspec/changes/add-mfa/design.md', DESIGN);
  write(root, 'openspec/changes/add-mfa/specs/user-auth/spec.md', SPEC);
  write(root, 'openspec/changes/add-mfa/test-plan.md', TEST_PLAN);
  write(root, 'openspec/changes/add-mfa/test-cases.md', TEST_CASES);
  write(root, 'openspec/changes/add-mfa/verification.md', VERIFICATION);
  writeIndex(root, { today: '2026-07-30' });
}

function pathEnsure(root, rel) {
  const p = path.join(root, rel);
  fs.mkdirSync(path.dirname(p), { recursive: true });
  return p;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

test('a well-formed repo is clean', (root) => {
  const report = check(root);
  assert.deepEqual(
    report.findings.map((f) => `[${f.level}] ${f.file}: ${f.message}`),
    [],
    'the fixture itself must be clean, otherwise every other test is noise'
  );
});

test('config rule with an unquoted colon is caught', (root) => {
  edit(root, 'openspec/config.yaml', (t) =>
    t + '\n  extra:\n    - Use only these values: a, b, c.\n'
  );
  assertError(check(root), /drops every rule/, 'YAML colon trap must be reported');
});

test('unfilled placeholder in an entry is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t + '\n# Assumptions\n\n<one assumption>\n');
  assertError(check(root), /unfilled placeholder/, 'placeholders must not survive');
});

test('empty table row is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('| BR-1 |', '|  |  |  |\n| BR-1 |'));
  assertError(check(root), /empty table row/, 'blank rows must be reported');
});

test('template instruction block left behind is a warning', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('# Summary', '<!--\nHOW TO USE THIS TEMPLATE\n-->\n\n# Summary')
  );
  const hits = find(check(root), /template instruction comment/, 'warn');
  assert.equal(hits.length, 1, 'expected exactly one warning');
});

test('title that does not match the file name is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('title: user-auth', 'title: add-user-auth'));
  assertError(check(root), /does not match the file name/, 'entries are named after the capability');
});

test('verified without verified_at is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('verified_at: 2026-07-30', 'verified_at:'));
  assertError(check(root), /verified without verified_at/, 'a verified claim needs a date');
});

test('duplicate BR id is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('| BR-2 |', '| BR-1 |'));
  assertError(check(root), /duplicate rule id BR-1/, 'ids are never reused');
});

test('pending_changes pointing at an archived change is caught', (root) => {
  fs.mkdirSync(path.join(root, 'openspec/changes/archive/2026-07-01-old-change'), { recursive: true });
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - old-change')
  );
  assertError(check(root), /already archived.*verification pass was skipped/, 'archive-without-verify must fail');
});

test('pending_changes pointing at a change that does not exist is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - ghost-change')
  );
  assertError(check(root), /not an active change/, 'dangling pending change must fail');
});

test('okf-link pointing at a missing file is caught', (root) => {
  fs.rmSync(path.join(root, '.okf/features/user-auth.md'));
  writeIndex(root, { today: '2026-07-30' });
  assertError(check(root), /does not exist on disk/, 'the pointer must resolve - this is the empty-gate hole');
});

test('okf-link missing a capability the proposal declares is caught', (root) => {
  edit(root, 'openspec/changes/add-mfa/proposal.md', (t) =>
    t.replace('### Modified Capabilities', '### Modified Capabilities\n- `billing`: invoice totals')
  );
  assertError(check(root), /declares capability "billing" with no row/, 'capability coverage must match');
});

test('"no domain knowledge" without a reason is caught', (root) => {
  edit(root, 'openspec/changes/add-mfa/okf-link.md', (t) =>
    t.replace('`.okf/features/user-auth.md`', 'no domain knowledge')
  );
  assertError(check(root), /without a specific reason/, 'the escape hatch needs a reason');
});

test('"no domain knowledge" with a real reason is accepted', (root) => {
  edit(root, 'openspec/changes/add-mfa/okf-link.md', (t) =>
    t.replace('`.okf/features/user-auth.md`', 'no domain knowledge - build tooling only, no product behavior')
  );
  const report = check(root);
  assert.equal(find(report, /no domain knowledge/).length, 0, 'a specific reason must pass');
});

test('unknown test status is caught', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace('failing: expected 403, got 200', 'red')
  );
  assertError(check(root), /unknown test status "red"/, 'status vocabulary is closed');
});

test('failing status without an assertion message is a warning', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace('failing: expected 403, got 200', 'failing')
  );
  const hits = find(check(root), /records no assertion message/, 'warn');
  assert.equal(hits.length, 1, 'bare "failing" should warn, not block');
});

test('"Not Applicable" without a reason is caught', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace('- Unit: MFA rule', '- Not Applicable')
  );
  assertError(check(root), /gives no specific reason/, 'the escape hatch needs a reason');
});

test('a sources path that does not exist is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('resource: docs/prd.md', 'resource: docs/gone.md'));
  assertError(check(root), /references "docs\/gone.md", which does not exist/, 'dangling provenance looks like evidence');
});

test('a sources path under openspec/changes is caught', (root) => {
  // Found by dogfooding: archiving renames that directory, so the reference is
  // guaranteed to break later - it broke within minutes of being written.
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('resource: docs/prd.md', 'resource: openspec/changes/add-mfa/design.md')
  );
  assertError(check(root), /renamed at archive time/, 'a path under changes\/ must be rejected outright');
});

test('change: and quoted-text provenance are accepted', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('resource: docs/prd.md', "resource: 'Original request: admins need a second factor'")
  );
  const report = check(root);
  assert.equal(find(report, /sources references/).length, 0, 'a quote and a change: ref are both valid provenance');
});

// ---------------------------------------------------------------------------
// Durable references: a bundle outlives the changes that wrote it, so a
// reference into openspec/changes/ is broken by construction. The frontmatter
// half of this shipped earlier; these cover the body, which nothing read.
// ---------------------------------------------------------------------------

/** Append a paragraph to the fixture entry, after every table. */
const withProse = (root, prose) => edit(root, '.okf/features/user-auth.md', (t) => `${t}\n${prose}\n`);
/** Reference findings only, so unrelated fixture noise cannot pass a test. */
const refErrors = (report) => find(report, /renamed at archive time|still a location/);

test('a locator error names the durable change: form', (root) => {
  withProse(root, 'See openspec/changes/add-mfa/design.md for the rationale.');
  const [hit] = refErrors(check(root));
  assert.ok(hit, 'the locator must be reported at all');
  assert.match(hit.message, /use `change:/, 'a message that only forbids leaves the author guessing');
});

test('a locator in an entry body is caught', (root) => {
  withProse(root, 'See openspec/changes/add-mfa/design.md for the rationale.');
  assertError(check(root), /renamed at archive time/, 'prose dangles exactly like frontmatter does');
});

test('a locator inside a table cell is caught', (root) => {
  withProse(root, '| Term | Meaning | Source |\n| --- | --- | --- |\n| Factor | see openspec/changes/add-mfa/spec.md | prd |');
  assertError(check(root), /renamed at archive time/, 'a table cell is prose with pipes around it');
});

test('adding the body scan does not change the frontmatter finding', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('resource: docs/prd.md', 'resource: openspec/changes/add-mfa/design.md')
  );
  const hits = refErrors(check(root));
  assert.equal(hits.length, 1, `one locator must produce one finding, got ${hits.length}`);
  assert.match(hits[0].message, /^sources references /, 'the frontmatter wording is load-bearing for the existing test');
});

test('the bare openspec/changes prefix is prose', (root) => {
  withProse(root, 'Provenance must never be a path under openspec/changes/ - cite the change id.');
  assert.deepEqual(refErrors(check(root)), [], 'the rule has to be stateable in the bundle it governs');
});

test('the bare archive prefix is prose', (root) => {
  withProse(root, 'Archiving moves the directory under openspec/changes/archive/ where nobody reads it.');
  assert.deepEqual(refErrors(check(root)), [], 'describing the mechanism is not pointing at a change');
});

test('a placeholder change segment is prose', (root) => {
  withProse(root, 'A change lives at openspec/changes/<change-id>/ while it is active.');
  assert.deepEqual(refErrors(check(root)), [], 'a placeholder names the shape, not a change');
});

test('a concrete change directory is a locator without a file suffix', (root) => {
  withProse(root, 'The work happened in openspec/changes/add-mfa/ last week.');
  assertError(check(root), /renamed at archive time/, 'the directory is what gets renamed; a file suffix is not required');
});

test('a locator inside a fenced block is not reported', (root) => {
  withProse(root, 'Never write this:\n\n```text\nopenspec/changes/add-mfa/design.md\n```');
  assert.deepEqual(refErrors(check(root)), [], 'a rule that cannot be documented gets disabled instead of obeyed');
});

test('a fenced block does not excuse a locator in sources', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('resource: docs/prd.md', 'resource: openspec/changes/add-mfa/design.md')
  );
  withProse(root, '```text\nopenspec/changes/other/design.md\n```');
  assertError(check(root), /renamed at archive time/, 'fencing marks an example, and frontmatter is never an example');
});

test('prose after a closed fence is still scanned', (root) => {
  withProse(root, '```text\nexample\n```\n\nNow see openspec/changes/add-mfa/design.md for details.');
  assertError(check(root), /renamed at archive time/, 'a fence must not swallow the rest of the file');
});

test('a locator in log.md is caught', (root) => {
  write(root, '.okf/log.md', '# Log\n\nEvidence: openspec/changes/add-mfa/verification.md\n');
  assertError(check(root), /renamed at archive time/, 'log.md is generated from evidence somebody typed by hand');
});

test('index.md without a type is still exempt from the concept-document rule', (root) => {
  const report = check(root);
  assert.equal(
    find(report, /is a concept document and needs/).filter((f) => /index\.md/.test(f.file)).length,
    0,
    'scanning reserved files for references must not drag them into the type requirement'
  );
});

test('an unresolvable change id is not reported', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('resource: change:add-mfa', 'resource: change:no-such-change-anywhere')
  );
  const report = check(root);
  assert.deepEqual(refErrors(report), [], 'shape is the only property this check establishes');
  assert.equal(find(report, /no-such-change/, 'warn').length, 0, 'and it must not hint at one it cannot prove');
});

test('a newly added bundle file is scanned on the same terms', (root) => {
  write(
    root,
    '.okf/notes/scratch.md',
    '---\ntype: Documentation\ntitle: scratch\ndescription: notes\n---\n\nSee openspec/changes/add-mfa/design.md.\n'
  );
  assertError(check(root), /renamed at archive time/, 'a rule that only protects the files it shipped with protects nothing');
});

test('a clean run makes no claim about reference resolution', (root) => {
  const report = check(root);
  assert.equal(
    report.findings.filter((f) => /references (resolve|validated|are valid)/i.test(f.message)).length,
    0,
    'a durable reference is still not a correct one'
  );
});

test('a path into an archived change is caught', (root) => {
  withProse(root, 'Superseded by openspec/changes/archive/2026-01-01-add-mfa/design.md.');
  const [hit] = refErrors(check(root));
  assert.ok(hit, 'an archived path is a location, and the id is right there in the directory name');
  assert.match(hit.message, /change:add-mfa/, 'the derived id makes the fix mechanical');
});

test('an archived path that exists on disk is still caught', (root) => {
  write(root, 'openspec/changes/archive/2026-01-01-add-mfa/design.md', '# Design\n');
  withProse(root, 'Superseded by openspec/changes/archive/2026-01-01-add-mfa/design.md.');
  assertError(check(root), /still a location/, 'resolving today is an accident of the archive step running once');
});

test('a locator inside an HTML comment is not reported', (root) => {
  withProse(root, '<!-- TODO: openspec/changes/add-mfa/design.md -->');
  assert.deepEqual(refErrors(check(root)), [], 'hygiene already reads a comment as not asserted');
});

test('openspec/changes with no trailing slash is prose', (root) => {
  withProse(root, 'Change artifacts live under openspec/changes in this repo.');
  assert.deepEqual(refErrors(check(root)), [], 'that names the tree, not a change');
});

test('a file with two locators is reported', (root) => {
  withProse(root, 'See openspec/changes/add-mfa/design.md and openspec/changes/add-mfa/tasks.md.');
  assert.ok(refErrors(check(root)).length >= 1, 'one finding or two is an implementation choice; silence is not');
});

test('a bundle with no markdown files does not crash', (root) => {
  fs.rmSync(path.join(root, '.okf'), { recursive: true, force: true });
  fs.mkdirSync(path.join(root, '.okf'), { recursive: true });
  assert.deepEqual(refErrors(check(root)), [], 'an empty bundle has nothing to dangle');
});

test('a .tmpl file carrying a locator is not scanned', (root) => {
  write(root, '.okf/templates/feature.md.tmpl', 'resource: openspec/changes/add-mfa/design.md\n');
  assert.deepEqual(refErrors(check(root)), [], 'a template is not bundle knowledge');
});

test('an escaped pipe inside a table cell does not split the row', (root) => {
  // Found by dogfooding: evidence cells legitimately contain regexes and shell
  // pipelines, and shredding them produced findings about columns that never
  // existed.
  edit(root, 'openspec/changes/add-mfa/verification.md', (t) =>
    t.replace(
      '| BR-1 | user-auth | src/auth/mfa.ts:42 | match | none |',
      "| BR-1 | user-auth | proven by `grep -n 'mfa\\|totp'` and src/auth/mfa.ts:42 | match | none |"
    )
  );
  const report = check(root);
  assert.equal(find(report, /has verdict/).length, 0, 'the verdict column must still be found');
  assert.equal(find(report, /has no evidence/).length, 0, 'the evidence column must still be found');
});

test('a wrapped "not applicable" bullet is read as one bullet', (root) => {
  // Found by dogfooding: reading physical lines made the tail of a wrapped
  // sentence look like a reasonless declaration of its own.
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace(
      '- Integration: session creation',
      '- Integration: not applicable, git is the only boundary and the unit tests\n  already exercise it for real (see test-cases.md Not Applicable).'
    )
  );
  const report = check(root);
  assert.equal(find(report, /gives no specific reason/).length, 0, 'a wrapped bullet must not be split');
});

test('a mention of "Not Applicable" is not a declaration', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t
      .replace('- Unit: MFA rule', '- Unit: MFA rule, see test-cases.md Not Applicable for the rest')
      .replace('| passing |', '| red |')
  );
  const report = check(root);
  assert.equal(find(report, /gives no specific reason/).length, 0, 'naming a section is not declaring one');
  assertError(report, /unknown test status "red"/, 'a mention must not exempt the plan from checking');
});

test('a per-level "not applicable" with a reason does not exempt the whole plan', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) => t.replace('| passing |', '| red |'));
  assertError(check(root), /unknown test status "red"/, 'one exempt level must not silence the rest');
});

test('a spec citing a rule with no evidence row is caught', (root) => {
  edit(root, 'openspec/changes/add-mfa/specs/user-auth/spec.md', (t) =>
    t.replace('Implements: BR-1', 'Implements: BR-9')
  );
  assertError(check(root), /specs cite BR-9 but the Rule Evidence table/, 'cited rules need evidence');
});

test('evidence row with an invalid verdict is caught', (root) => {
  edit(root, 'openspec/changes/add-mfa/verification.md', (t) => t.replace('| match | none |', '| ok | none |'));
  assertError(check(root), /verdict "ok"/, 'verdict vocabulary is closed');
});

test('evidence row with no reference is caught', (root) => {
  edit(root, 'openspec/changes/add-mfa/verification.md', (t) =>
    t.replace('src/auth/mfa.ts:42', '')
  );
  assertError(check(root), /has no evidence/, 'a checkbox is not evidence');
});

test('INDEX out of sync with the entries is caught', (root) => {
  edit(root, '.okf/index.md', (t) => t.replace(/\| \[user-auth\].*\n/, ''));
  assertError(check(root), /does not list "user-auth"/, 'a stale index must be reported');
});

test('needs-revision without a ledger row is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('verification_state: verified', 'verification_state: needs-revision'));
  // index intentionally not regenerated
  assertError(check(root), /no Needs Revision Ledger row/, 'debt must be visible');
});

test('needs-revision older than 30 days is an error', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('verification_state: verified', 'verification_state: needs-revision').replace('verified_at: 2026-07-30', 'verified_at: 2020-01-01')
  );
  writeIndex(root, { today: '2020-01-01' });
  assertError(check(root), /has been needs-revision for \d+ days/, 'stale debt must escalate');
});

test('archive mode blocks when pending_changes still holds the change', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - add-mfa')
  );
  const report = check(root, { archiveChange: 'add-mfa' });
  assertError(report, /pending_changes still contains "add-mfa"/, 'the core failure mode must be caught');
});

test('archive mode blocks an unverified entry', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('verification_state: verified', 'verification_state: unverified'));
  writeIndex(root, { today: '2026-07-30' });
  const report = check(root, { archiveChange: 'add-mfa' });
  assertError(report, /still unverified while archiving/, 'unverified must not reach the archive');
});

test('archive mode blocks a skeleton test with no owner', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) => t.replace('| passing |', '| skeleton |'));
  const report = check(root, { archiveChange: 'add-mfa' });
  assertError(report, /still skeleton but has no Known Gaps row/, 'skeletons must not slip through');
});

test('archive mode accepts a skeleton that has an owner', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t
      .replace('| passing |', '| skeleton |')
      .replace(
        '| Test Case ID | Status Left At | Reason | Owner | Follow-Up |\n| --- | --- | --- | --- | --- |',
        '| Test Case ID | Status Left At | Reason | Owner | Follow-Up |\n| --- | --- | --- | --- | --- |\n' +
          '| API-E2E-001 | skeleton | staging browser harness not ready | danh | next sprint |'
      )
  );
  const report = check(root, { archiveChange: 'add-mfa' });
  assert.equal(find(report, /no Known Gaps row/).length, 0, 'an owned gap is an accepted risk, not an error');
});

test('archive mode passes on the clean fixture', (root) => {
  const report = check(root, { archiveChange: 'add-mfa' });
  assert.deepEqual(
    report.errors.map((f) => `${f.file}: ${f.message}`),
    [],
    'the happy path must actually be archivable'
  );
});

// ---------------------------------------------------------------------------
// Where each test level stood before implementation, and which column says so.
// Rules: .okf/features/test-first-gate.md (BR-1, BR-5, BR-6).
// ---------------------------------------------------------------------------

const E2E_ROW = '| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | skeleton | passing | - |';

/** Rewrite the fixture's E2E row with the given initial and current statuses. */
function setE2eStatuses(root, initial, status) {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace(E2E_ROW, `| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | ${initial} | ${status} | - |`)
  );
}

const MISSING_INITIAL = /records no status from before implementation/;

test('UT-001 an unknown word in Initial Status is an error', (root) => {
  setE2eStatuses(root, 'wip', 'passing');
  assertError(check(root), /unknown test status "wip"/, 'the vocabulary must reach the historical column too');
});

test('UT-002 a failing status keeps its assertion message', (root) => {
  const report = check(root);
  assert.equal(
    find(report, /unknown test status/).length,
    0,
    '"failing: expected 403, got 200" is a status plus its message, not an unknown word'
  );
  assert.equal(
    find(report, /records no assertion message/, 'warn').length,
    0,
    'a recorded assertion message must not be asked for twice'
  );
});

test('UT-003 a promoted skeleton needs no Known Gaps row', (root) => {
  setE2eStatuses(root, 'skeleton', 'passing');
  const report = check(root, { archiveChange: 'add-mfa' });
  assert.equal(
    find(report, /no Known Gaps row/).length,
    0,
    'where a test started is history - only where it stands now can be a live gap'
  );
});

test('UT-004 a surviving skeleton still needs an owner', (root) => {
  setE2eStatuses(root, 'skeleton', 'skeleton');
  assertError(
    check(root, { archiveChange: 'add-mfa' }),
    /still skeleton but has no Known Gaps row/,
    'a skeleton that never got promoted must still be owned'
  );
});

test('UT-005 a table with only Initial Status uses it as live', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace('failing: expected 403, got 200', 'planned')
  );
  assertError(
    check(root, { archiveChange: 'add-mfa' }),
    /still planned but has no Known Gaps row/,
    'the unit table has no other status column, so its initial status is its live one'
  );
});

test('UT-006 an empty Initial Status warns and does not error', (root) => {
  setE2eStatuses(root, '', 'passing');
  const report = check(root);
  assert.ok(
    find(report, MISSING_INITIAL, 'warn').some((f) => /API-E2E-001/.test(f.message)),
    'an unrecorded starting point is the whole evidence that the test predates the code'
  );
  assert.equal(find(report, MISSING_INITIAL).length, 0, 'a new invariant starts as a warning, not an error');
});

test('UT-007 a waived level emits no missing-status warning', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t
      .replace('- API E2E: sign-in journey', '- API E2E: not applicable, this change has no HTTP surface')
      .replace(
        '# E2E Tests\n\n| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |\n' +
          '| --- | --- | --- | --- | --- | --- |\n' +
          E2E_ROW +
          '\n',
        ''
      )
  );
  const report = check(root);
  assert.equal(
    find(report, MISSING_INITIAL, 'warn').length,
    0,
    'a level dropped whole with a reason has no rows to record a starting point for'
  );
});

test('NEG-001 an invalid Status is not excused by a valid Initial Status', (root) => {
  setE2eStatuses(root, 'skeleton', 'red');
  assertError(check(root), /unknown test status "red"/, 'each status column is validated on its own');
});

test('NEG-002 status-free and blank rows produce no warning', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t
      .replace(
        '# E2E Tests',
        '# Contract Stubs\n\n| Contract | File | Signature Or Shape | Notes |\n| --- | --- | --- | --- |\n' +
          '| requireMfa | src/auth/mfa.ts | throws not implemented | - |\n\n# E2E Tests'
      )
      .replace(E2E_ROW, `${E2E_ROW}\n|  |  |  |  |  |  |`)
  );
  const report = check(root);
  assert.equal(
    find(report, MISSING_INITIAL, 'warn').length,
    0,
    'the rule is about rows that carry a status, not about every row of every table'
  );
});

// ---------------------------------------------------------------------------
// A test changed after implementation started answers for why.
// Rules: .okf/features/test-first-gate.md (BR-8, BR-9, BR-10).
// ---------------------------------------------------------------------------

const TEST_CHANGES_HEADER =
  '| Date | Test | Ground | Rule (BR-n) Or Spec Change |\n| --- | --- | --- | --- |';

/** Append rows to the fixture plan's Test Changes table. Each row is body cells. */
function setTestChanges(root, rows) {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) => {
    const body = rows.map((r) => `| ${r.join(' | ')} |`).join('\n');
    return `${t}\n# Test Changes After Implementation Started\n\n${TEST_CHANGES_HEADER}\n${body}\n`;
  });
}

const NO_GROUND = /states no ground/;

test('UT-101 a test change that names no test is caught', (root) => {
  setTestChanges(root, [['2026-07-30', '', 'the rule moved', 'BR-1']]);
  assertError(check(root), /names no test/, 'a record that does not say which test records nothing');
});

test('UT-102 a test change citing an unknown rule is caught', (root) => {
  setTestChanges(root, [['2026-07-30', 'refuses admin without mfa', 'the rule moved', 'BR-9']]);
  assertError(check(root), /BR-9/, 'a citation that resolves to nothing is not a ground');
});

test('UT-103 a test change citing a missing spec is caught', (root) => {
  setTestChanges(root, [
    ['2026-07-30', 'refuses admin without mfa', 'the spec moved', '`openspec/specs/ghost/spec.md`'],
  ]);
  assertError(check(root), /openspec\/specs\/ghost\/spec\.md/, 'a dangling spec path is not a ground');
});

test('UT-104 a declared mechanical defect is a complete answer', (root) => {
  setTestChanges(root, [
    ['2026-07-30', 'refuses admin without mfa', 'mechanical defect: fixture seeded the wrong tenant', '-'],
  ]);
  const report = check(root);
  assert.equal(
    find(report, /Test Changes|names no test|states no ground/).length,
    0,
    'a named mechanical defect is the second admissible ground, not a missing citation'
  );
});

test('UT-105 a test change standing on nothing is caught', (root) => {
  setTestChanges(root, [['2026-07-30', 'refuses admin without mfa', 'it did not pass', '-']]);
  assertError(check(root), NO_GROUND, 'a test change with no stated ground reads as a test fitted to the code');
});

test('UT-106 an empty Test Changes table is clean', (root) => {
  setTestChanges(root, []);
  const report = check(root);
  assert.deepEqual(
    report.findings.map((f) => `[${f.level}] ${f.file}: ${f.message}`),
    [],
    'the table is a record, not a quota - checking it must never reward leaving a row out'
  );
});

test('NEG-101 a mechanical defect must name what was wrong', (root) => {
  setTestChanges(root, [['2026-07-30', 'refuses admin without mfa', 'mechanical defect', '-']]);
  assertError(check(root), NO_GROUND, 'a declaration that names nothing is a phrase, not a reason');
});

test('NEG-102 a resolving citation needs no declared ground', (root) => {
  setTestChanges(root, [['2026-07-30', 'refuses admin without mfa', '-', 'BR-1']]);
  const report = check(root);
  assert.equal(
    find(report, /names no test|states no ground|BR-1/).length,
    0,
    'a citation that resolves answers the row on its own'
  );
});

// ---------------------------------------------------------------------------
// A planned test answers for whether it could ever have failed.
// Rules: .okf/features/test-first-gate.md (BR-3, BR-5, BR-11, BR-12).
// ---------------------------------------------------------------------------

const UNIT_COLUMNS = [
  'Test Case ID', 'Rule (BR-n)', 'Test File', 'Test Name', 'Initial Status', 'Falsified By', 'Notes',
];

/** One clean Pre-Implementation Unit Tests row, with the named cells overridden. */
const unitRow = ({ id = 'UT-001', initial = 'failing: expected 403, got 200', falsifier = 'dropping the second-factor check from the session builder' } = {}) =>
  [id, 'BR-1', 'src/auth/mfa.test.ts', `refuses ${id} without mfa`, initial, falsifier, '-'];

/** Replace the fixture plan's unit-test table, header included. */
function setUnitTests(root, rows, { columns = UNIT_COLUMNS } = {}) {
  const table = [
    `| ${columns.join(' | ')} |`,
    `| ${columns.map(() => '---').join(' | ')} |`,
    ...rows.map((r) => `| ${r.slice(0, columns.length).join(' | ')} |`),
  ].join('\n');
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace(
      /# Pre-Implementation Unit Tests\n\n[\s\S]*?(?=\n# )/,
      `# Pre-Implementation Unit Tests\n\n${table}\n`
    )
  );
}

/** The same columns minus one, for the tables that must report its absence. */
const without = (name) => UNIT_COLUMNS.filter((c) => c !== name);

const UNEXPLAINED_GREEN = /green before its implementation|passing/;
const NO_FALSIFIER = /falsif/i;

test('UT-201 a bare green initial status is a warning', (root) => {
  setUnitTests(root, [unitRow({ initial: 'passing' })]);
  assertWarn(
    check(root),
    UNEXPLAINED_GREEN,
    'a test green before its implementation existed must say which of the two things it is'
  );
});

test('UT-202 a green initial status with its reason is clean', (root) => {
  setUnitTests(root, [unitRow({ initial: 'passing: BR-1 already held, this locks it against regression' })]);
  assert.equal(
    find(check(root), UNEXPLAINED_GREEN, 'warn').length,
    0,
    'a stated reason is a complete answer - the check does not judge whether it is apt'
  );
});

test('UT-203 a reason too short is not a reason', (root) => {
  setUnitTests(root, [unitRow({ initial: 'passing: ok' })]);
  assertWarn(check(root), UNEXPLAINED_GREEN, 'two characters distinguish nothing between the two cases');
});

test('UT-204 a green live status is untouched', (root) => {
  const report = check(root);
  assert.equal(
    find(report, UNEXPLAINED_GREEN, 'warn').length,
    0,
    'the E2E row ends `passing` in its live column - a test that ends green is the intended outcome'
  );
});

test('UT-205 a unit row with no falsifier is a warning', (root) => {
  setUnitTests(root, [unitRow({ falsifier: '' })]);
  assertWarn(check(root), NO_FALSIFIER, 'a test nobody can say would fail has no claim to make');
});

test('UT-206 a filled falsifier is clean whether or not it is apt', (root) => {
  setUnitTests(root, [unitRow({ falsifier: 'renaming a variable somewhere unrelated' })]);
  assert.equal(
    find(check(root), NO_FALSIFIER, 'warn').length,
    0,
    'presence is mechanical, aptness is a review question - the check must not pretend to answer it'
  );
});

test('UT-207 a missing falsifier column is one finding for the table', (root) => {
  setUnitTests(
    root,
    [unitRow({ id: 'UT-001' }), unitRow({ id: 'UT-002' }), unitRow({ id: 'UT-003' })],
    { columns: without('Falsified By') }
  );
  assert.equal(
    find(check(root), NO_FALSIFIER, 'warn').length,
    1,
    'a template that predates the column is one problem, not one per row'
  );
});

test('UT-208 integration and e2e tables need no falsifier', (root) => {
  const report = check(root);
  assert.equal(
    find(report, NO_FALSIFIER, 'warn').length,
    0,
    'the E2E table has no falsifier column and must not be asked for one - its rows start as skeletons'
  );
});

test('UT-209 a bare red state stays a warning in flight', (root) => {
  setUnitTests(root, [unitRow({ initial: 'failing' })]);
  assertWarn(
    check(root),
    /assertion message/,
    'a plan under construction is told, not blocked'
  );
});

test('UT-210 the known gaps owner is found by header name', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace('| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | skeleton | passing | - |',
      '| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | skeleton | skeleton | - |')
      .replace(
        '| Test Case ID | Status Left At | Reason | Owner | Follow-Up |\n| --- | --- | --- | --- | --- |',
        '| Owner | Test Case ID | Status Left At | Reason | Follow-Up |\n| --- | --- | --- | --- | --- |\n' +
          '| danh | API-E2E-001 | skeleton | the browser harness lands next sprint | tracked next change |'
      )
  );
  assert.equal(
    find(check(root, { archiveChange: 'add-mfa' }), /no Known Gaps row with an owner/).length,
    0,
    'the owner is named; a positional read looks for the id in the owner cell and misses it'
  );
});

test('UT-211 a surviving skeleton with no owner is still an error', (root) => {
  edit(root, 'openspec/changes/add-mfa/test-plan.md', (t) =>
    t.replace('| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | skeleton | passing | - |',
      '| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | skeleton | skeleton | - |')
      .replace(
        '| Test Case ID | Status Left At | Reason | Owner | Follow-Up |\n| --- | --- | --- | --- | --- |',
        '| Test Case ID | Status Left At | Reason | Owner | Follow-Up |\n| --- | --- | --- | --- | --- |\n' +
          '| API-E2E-001 | skeleton | the browser harness lands next sprint |  | - |'
      )
  );
  assertError(
    check(root, { archiveChange: 'add-mfa' }),
    /no Known Gaps row with an owner/,
    'a row listed without an owner is the case the rule exists for'
  );
});

test('NEG-201 a bare green initial status is an error at archive', (root) => {
  setUnitTests(root, [unitRow({ initial: 'passing' })]);
  assertError(
    check(root, { archiveChange: 'add-mfa' }),
    UNEXPLAINED_GREEN,
    'archive is the last moment the kit gets to insist'
  );
});

test('NEG-202 an empty falsifier is an error at archive', (root) => {
  setUnitTests(root, [unitRow({ falsifier: '' })]);
  assertError(check(root, { archiveChange: 'add-mfa' }), NO_FALSIFIER, 'same escalation, same boundary');
});

test('NEG-203 a bare red state is an error at archive', (root) => {
  setUnitTests(root, [unitRow({ initial: 'failing' })]);
  assertError(
    check(root, { archiveChange: 'add-mfa' }),
    /assertion message/,
    'BR-3 states the red state as a MUST, and a MUST that only ever warns can be archived unmet'
  );
});

test('NEG-204 a blank row triggers neither new check', (root) => {
  setUnitTests(root, [unitRow(), ['', '', '', '', '', '', '']]);
  const report = check(root);
  assert.equal(
    find(report, UNEXPLAINED_GREEN, 'warn').length + find(report, NO_FALSIFIER, 'warn').length,
    0,
    'an untouched template row is not a claim about anything'
  );
});

// ---------------------------------------------------------------------------
// The shipped schema payload, asserted against itself. These are declared
// before the implementation they cover, and promoted once it lands.
// Rules: .okf/features/test-first-gate.md (BR-4, BR-6, BR-7).
// ---------------------------------------------------------------------------

const SCHEMA_DIR = path.join(KIT, 'openspec/schemas/okf-gated-feature');
const shipped = (rel) => fs.readFileSync(path.join(SCHEMA_DIR, rel), 'utf8');

/** The `## N. Title` groups of a tasks file, with their checkbox lines. */
function taskGroups(text) {
  const groups = [];
  for (const line of text.split('\n')) {
    const heading = /^##\s+\d+\.\s*(.+?)\s*$/.exec(line);
    if (heading) {
      groups.push({ title: heading[1], tasks: [], text: '' });
      continue;
    }
    if (!groups.length) continue;
    groups.at(-1).text += `${line}\n`;
    if (/^-\s*\[.\]/.test(line.trim())) groups.at(-1).tasks.push(line);
  }
  return groups;
}

/** Index of the first group whose checkbox lines match `re`, or -1. */
const firstGroupWhere = (groups, re) => groups.findIndex((g) => g.tasks.some((t) => re.test(t)));

/** Header cells of the table under a `# Heading` in a test-plan-shaped file. */
function tableHeader(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === `# ${heading}`);
  assert.ok(start !== -1, `the template must still have a "${heading}" section`);
  const row = lines.slice(start + 1).find((l) => l.trim().startsWith('|'));
  return row.split('|').slice(1, -1).map((c) => c.trim());
}

test('IT-001 the skeleton group precedes implementation', () => {
  const groups = taskGroups(shipped('templates/tasks.md'));
  const skeletons = groups.findIndex((g) => /skeleton/i.test(g.title));
  const implementation = groups.findIndex((g) => /^implementation$/i.test(g.title));

  assert.ok(skeletons !== -1, 'the template must have a group that creates integration and E2E skeletons');
  assert.ok(
    skeletons < implementation,
    `the skeleton group is at ${skeletons} and implementation at ${implementation} - ` +
      'a test file first created after the code it covers can only describe it'
  );
});

test('IT-002 nothing promotes a skeleton nothing creates', () => {
  const groups = taskGroups(shipped('templates/tasks.md'));
  const creates = firstGroupWhere(groups, /skeleton/i);
  const promotes = firstGroupWhere(groups, /promote/i);

  assert.ok(promotes !== -1, 'the template still asks for promotion somewhere');
  assert.ok(creates !== -1, 'something must create the skeletons the template promotes');
  assert.ok(
    creates < promotes,
    `promotion is asked for in group ${promotes} and creation in ${creates} - ` +
      'an agent told to promote what nothing created improvises, and improvises late'
  );
});

test('IT-003 the group order sentence matches the template', () => {
  const titles = taskGroups(shipped('templates/tasks.md')).map((g) => g.title.toLowerCase());
  const sentence = /these\s+are\s+its\s+groups\s+by\s+name:([\s\S]*?)\./i.exec(shipped('schema.yaml'));

  assert.ok(sentence, 'the tasks instruction must still name the groups it expects');
  const named = sentence[1]
    .split(/,?\s*\bthen\b\s*/)
    .map((s) => s.replace(/\s+/g, ' ').replace(/^,\s*/, '').trim().toLowerCase())
    .filter(Boolean);

  assert.deepEqual(named, titles, 'the sentence a reviewer reads must name the groups an agent executes');
});

test('IT-004 both status columns ship in the test-plan template', () => {
  const template = shipped('templates/test-plan.md');
  for (const heading of ['Integration Tests', 'E2E Tests']) {
    const header = tableHeader(template, heading);
    assert.ok(header.includes('Initial Status'), `${heading} must record where each row started`);
    assert.ok(header.includes('Status'), `${heading} must record where each row stands now`);
  }
  assert.deepEqual(
    tableHeader(template, 'Pre-Implementation Unit Tests').filter((c) => /status/i.test(c)),
    ['Initial Status'],
    'the unit table records only a starting point, and that stays its live status'
  );
});

test('IT-005 a plan filled from the new template checks clean', (root) => {
  const filled = shipped('templates/test-plan.md')
    .replace('- Unit:', '- Unit: the MFA rule, against a stubbed session store')
    .replace('- Integration:', '- Integration: session creation through the real repository')
    .replace('- API E2E:', '- API E2E: the sign-in journey over HTTP')
    .replace('- Browser E2E:', '- Browser E2E: not applicable, this change adds no UI')
    .replace(
      '| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |\n| --- | --- | --- | --- | --- | --- | --- |',
      '| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Falsified By | Notes |\n| --- | --- | --- | --- | --- | --- | --- |\n' +
        '| UT-001 | BR-1 | src/auth/mfa.test.ts | refuses admin without mfa | failing: expected 403, got 200 | ' +
        'dropping the second-factor check from the session builder | - |'
    )
    .replace(
      '| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |\n| --- | --- | --- | --- | --- | --- |',
      '| Test Case ID | Test File | Test Name | Initial Status | Status | Notes |\n| --- | --- | --- | --- | --- | --- |\n' +
        '| IT-001 | src/auth/session.int.test.ts | creates a session | skeleton | passing | - |'
    )
    // The Commands section too, since hygiene reaches change artifacts: a plan
    // whose unit command still reads as a slot has not answered the question the
    // section asks, and "filled honestly" has to mean the whole document.
    .replace('<unit-test-command>', 'npm test')
    .replace('<integration-test-command>', 'npm run test:integration')
    .replace('<e2e-test-command>', 'npm run test:e2e')
    .replace('<lint-command>', 'npm run lint')
    .replace('<typecheck-command>', 'npm run typecheck')
    .replaceAll('<change-id>', 'add-mfa');

  write(root, 'openspec/changes/add-mfa/test-plan.md', filled);
  const report = check(root, { archiveChange: 'add-mfa' });
  assert.deepEqual(
    report.findings
      .filter((f) => f.file === 'openspec/changes/add-mfa/test-plan.md')
      .map((f) => `[${f.level}] ${f.message}`),
    [],
    'a plan filled honestly from the shipped template must not be argued with'
  );
});

test('IT-101 the implementation group states the direction', () => {
  const groups = taskGroups(shipped('templates/tasks.md'));
  const implementation = groups.find((g) => /^implementation$/i.test(g.title));

  assert.ok(implementation, 'the template must still have an implementation group');
  assert.ok(
    /code adapts to the tests|tests are fixed and the code moves/i.test(implementation.text),
    'the group an agent executes must say which side gives way when code and test disagree'
  );
});

test('IT-102 the tasks instruction states the order of repair', () => {
  const sentence = /the order of repair is fixed[\s\S]{0,400}/i.exec(shipped('schema.yaml'));
  assert.ok(sentence, 'the tasks instruction must state an order of repair');

  const order = ['OKF entry', 'spec', 'test-plan', 'test', 'code'];
  const at = order.map((step) => sentence[0].toLowerCase().indexOf(step.toLowerCase()));

  for (const [i, step] of order.entries()) {
    assert.ok(at[i] !== -1, `the order of repair must name "${step}"`);
  }
  assert.deepEqual(
    at,
    [...at].sort((a, b) => a - b),
    'entry, spec, record, test, code - stated in the order they must happen'
  );
});

test('IT-103 the Test Changes table shows both grounds', () => {
  const header = tableHeader(shipped('templates/test-plan.md'), 'Test Changes After Implementation Started');
  assert.ok(header.includes('Ground'), 'the ground a row stands on must be a column, not an inference');
  assert.ok(
    header.some((c) => /rule.*spec/i.test(c)),
    'the citation column must stay - a resolving citation is the other admissible answer'
  );
});

test('IT-201 the template names the inadmissible grounds', () => {
  const rules = /# Test Change Rules([\s\S]*?)\n# /.exec(shipped('templates/test-plan.md'));
  assert.ok(rules, 'the template must still have a Test Change Rules section');

  for (const [what, re] of [
    ['manual testing', /manually/i],
    ['adding the test afterwards', /afterwards/i],
    ['time already spent', /time already spent/i],
    ['this case being different', /different from the ones/i],
  ]) {
    assert.match(rules[1], re, `an agent looking for a way out must find "${what}" already named`);
  }
});

test('IT-202 the template carries the falsifier column', () => {
  const header = tableHeader(shipped('templates/test-plan.md'), 'Pre-Implementation Unit Tests');
  assert.ok(
    header.includes('Falsified By'),
    'what would make the test fail must be a column, not something a reviewer infers'
  );
});

test('IT-203 the test-plan instruction asks for what the template shows', () => {
  const schema = shipped('schema.yaml');
  const instruction = /- id: test-plan([\s\S]*?)\n  - id: /.exec(schema);
  assert.ok(instruction, 'the schema must still carry a test-plan artifact instruction');

  assert.match(instruction[1], /Falsified By/, 'the instruction must name the column the template ships');
  assert.match(
    instruction[1],
    /passing: /,
    'the instruction must show the shape a green initial status answers in'
  );
  assert.match(
    instruction[1],
    /errors under `okf check --archive`|error at archive/i,
    'an agent must learn the escalation from the instruction, not from being blocked by it'
  );
});

test('IT-204 mock call counts are named as a non-answer', () => {
  const instruction = /- id: test-cases([\s\S]*?)\n  - id: /.exec(shipped('schema.yaml'));
  assert.ok(instruction, 'the schema must still carry a test-cases artifact instruction');
  assert.match(
    instruction[1],
    /mock call counts/i,
    'the one assertion that no production change can falsify has to be named'
  );
});

// ---------------------------------------------------------------------------
// Decision promotion, and the scope of the archive gates.
// Rules: .okf/features/okf-archive-gate.md (BR-1..BR-8).
// ---------------------------------------------------------------------------

const ARCHIVE = { archiveChange: 'add-mfa' };
const CHANGE = 'openspec/changes/add-mfa';
const WAIVER = 'Not required because the change only renames an internal config key.\n';

/** Rewrite the fixture's Decision Promotion section. `rows` are body rows only. */
function setPromotion(root, rows) {
  const table = [
    '# Decision Promotion',
    '',
    '| Decision | Promoted To | Reason If Not Promoted |',
    '| --- | --- | --- |',
    ...rows,
    '',
  ].join('\n');
  edit(root, `${CHANGE}/verification.md`, (t) => t.replace(/# Decision Promotion[\s\S]*$/, table));
}

/** Findings whose message mentions the promotion gate, at any level. */
const promotionFindings = (report) =>
  report.findings.filter((f) => /[Dd]ecision/.test(f.message)).map((f) => `[${f.level}] ${f.message}`);

/**
 * Rewrite the fixture's Static Analysis section. `rows` are body rows only;
 * passing `null` removes the section entirely, which is how a change written
 * under the previous template looks.
 */
function setStaticAnalysis(root, rows) {
  const table =
    rows === null
      ? ''
      : ['# Static Analysis', '', '| Check | Command | Result |', '| --- | --- | --- |', ...rows, '', ''].join('\n');
  edit(root, `${CHANGE}/verification.md`, (t) => {
    const next = t.replace(/# Static Analysis\n[\s\S]*?(?=^# )/m, table);
    assert.notEqual(next, t, 'setStaticAnalysis matched nothing - the fixture no longer has the section it edits');
    return next;
  });
}

/** Findings whose message mentions the static analysis gate, at any level. */
const staticFindings = (report) =>
  report.findings
    .filter((f) => /[Ss]tatic [Aa]nalysis|\bLint\b|\bTypecheck\b/.test(f.message))
    .map((f) => `[${f.level}] ${f.message}`);

const LINT_OK = '| Lint | `npm run lint` | clean, 0 errors 0 warnings |';
const TYPE_OK = '| Typecheck | `npm run typecheck` | clean, 0 errors |';

/** Make every okf-link row declare no domain knowledge, so nothing resolves. */
function declareNoDomainKnowledge(root) {
  edit(root, `${CHANGE}/okf-link.md`, (t) =>
    t.replace('`.okf/features/user-auth.md`', 'no domain knowledge - this change only renames an internal helper')
  );
}

test('UT-013 the clean fixture stays archivable with a satisfied promotion table', (root) => {
  assert.deepEqual(promotionFindings(check(root, ARCHIVE)), [], 'a fully accounted-for change must stay clean');
});

test('UT-012 entry-scoped gates stay silent when no okf-link row resolves', (root) => {
  declareNoDomainKnowledge(root);
  // Both entry-scoped tables genuinely emptied, so a gate still keyed on the wrong
  // thing would fire here. Written out rather than patched, because a replace that
  // silently matches nothing would make this guard pass without guarding.
  write(
    root,
    `${CHANGE}/verification.md`,
    [
      '# Verification',
      '',
      '# Rule Evidence',
      '',
      '| Rule (BR-n) | Capability | Evidence (file:line or test name) | Verdict | Action Taken |',
      '| --- | --- | --- | --- | --- |',
      '',
      '# Entry Outcome',
      '',
      '| Capability | OKF File | Resulting Verified | verified_at | code_paths Filled | This Change Removed From pending_changes |',
      '| --- | --- | --- | --- | --- | --- |',
      '',
      '# Static Analysis',
      '',
      '| Check | Command | Result |',
      '| --- | --- | --- |',
      '| Lint | `npm run lint` | clean |',
      '| Typecheck | `npm run typecheck` | clean |',
      '',
      '# Decision Promotion',
      '',
      '| Decision | Promoted To | Reason If Not Promoted |',
      '| --- | --- | --- |',
      '| Verify the second factor first | - | change-local: sequencing only |',
      '| Keep TOTP as the only factor | - | change-local: the spec already states the current factor |',
      '',
    ].join('\n')
  );
  const text = readF(root, `${CHANGE}/verification.md`);
  assert.ok(!/\| BR-1 \|/.test(text) && !/\| user-auth \|/.test(text), 'the fixture must really be empty');

  const report = check(root, ARCHIVE);
  assert.equal(find(report, /Rule Evidence table is empty/).length, 0, 'there is no entry to have evidence about');
  assert.equal(find(report, /no Entry Outcome row/).length, 0, 'there is no entry to have an outcome');
  assert.deepEqual(promotionFindings(report), [], 'the change-scoped gate is satisfied by the two rows');
});

test('UT-001 archive mode blocks a design with decisions and an empty promotion table', (root) => {
  setPromotion(root, []);
  assertError(check(root, ARCHIVE), /Decision Promotion table is empty/, 'decisions must not be buried silently');
});

test('NEG-002 a promotion table holding only the template blank row counts as empty', (root) => {
  setPromotion(root, ['|  |  |  |']);
  assertError(check(root, ARCHIVE), /Decision Promotion table is empty/, 'a blank row is not an accounted-for row');
});

test('UT-002 a design waived with a reason needs no promotion row', (root) => {
  write(root, `${CHANGE}/design.md`, WAIVER);
  setPromotion(root, []);
  assert.deepEqual(promotionFindings(check(root, ARCHIVE)), [], 'the waiver must stay usable');
});

test('UT-007 an unrecognised design shape requires a promotion row', (root) => {
  write(root, `${CHANGE}/design.md`, '## Context\n\nSome half-written notes that stop mid-sen\n');
  setPromotion(root, []);
  assertError(check(root, ARCHIVE), /cannot be waived/, 'an unknown shape must not waive the gate');
});

test('NEG-003 an empty design.md requires a promotion row', (root) => {
  write(root, `${CHANGE}/design.md`, '');
  setPromotion(root, []);
  assertError(check(root, ARCHIVE), /cannot be waived/, 'an empty design is the shape the old behaviour waived');
});

test('UT-003 a promotion row pointing at a real decision file is accepted', (root) => {
  setPromotion(root, [
    '| Verify the second factor first | `.okf/decisions/2026-07-30-verify-factor-before-session.md` | - |',
    '| Keep TOTP as the only factor | - | change-local: the spec already states the current factor |',
  ]);
  assert.deepEqual(promotionFindings(check(root, ARCHIVE)), [], 'a resolving path is a promotion');
});

test('UT-004 a promotion row pointing at a missing decision file is caught', (root) => {
  setPromotion(root, [
    '| Verify the second factor first | `.okf/decisions/2026-07-30-not-written-yet.md` | - |',
    '| Keep TOTP as the only factor | - | change-local: the spec already states the current factor |',
  ]);
  assertError(check(root, ARCHIVE), /does not exist on disk/, 'a mistyped path must not pass as a promotion');
});

test('NEG-001 a promotion target outside .okf/decisions/ is caught', (root) => {
  setPromotion(root, [
    '| Verify the second factor first | `docs/decisions/mfa.md` | - |',
    '| Keep TOTP as the only factor | - | change-local: the spec already states the current factor |',
  ]);
  assertError(check(root, ARCHIVE), /not under `?\.okf\/decisions/, 'promoted elsewhere is not promoted');
});

test('UT-005 a promotion row with a reason and no target is accepted', (root) => {
  setPromotion(root, [
    '| Verify the second factor first | - | change-local: only governs the order of this change own commits |',
    '| Keep TOTP as the only factor | - | change-local: the spec already states the current factor |',
  ]);
  assert.deepEqual(promotionFindings(check(root, ARCHIVE)), [], 'a stated reason discharges a row');
});

test('UT-006 a promotion row with neither a target nor a reason is caught', (root) => {
  setPromotion(root, [
    '| Verify the second factor first | - | - |',
    '| Keep TOTP as the only factor | - | change-local: the spec already states the current factor |',
  ]);
  assertError(check(root, ARCHIVE), /neither a promoted path nor a reason/, 'silence is not one of the two answers');
});

test('UT-009 a row per decision reports nothing', (root) => {
  assert.deepEqual(promotionFindings(check(root, ARCHIVE)), [], 'two decisions, two rows, nothing to say');
});

test('UT-008 fewer promotion rows than decisions is a warning, not an error', (root) => {
  setPromotion(root, ['| Verify the second factor first | - | change-local: sequencing only |']);
  const report = check(root, ARCHIVE);
  assert.equal(find(report, /1 row\(s\) for 2 decision\(s\)/, 'warn').length, 1, 'under-accounting must warn');
  assert.deepEqual(
    report.errors.map((f) => f.message),
    [],
    'a heuristic count must never produce an error'
  );
});

test('UT-014 bold-paragraph and numbered decision syntaxes count alike', (root) => {
  const numbered = `## Decisions

1. **Verify the second factor before creating the session**
   - A downgraded session is a window an attacker can use.
2. **Keep TOTP as the only factor for now**
   - SMS delivery is not reliable enough yet.
3. **Store recovery codes hashed**
   - They are credentials, not metadata.
`;
  const paragraphs = `## Decisions

**Verify the second factor before creating the session.** A downgraded session is
a window an attacker can use.

**Keep TOTP as the only factor for now.** SMS delivery is not reliable enough yet.

**Store recovery codes hashed.** They are credentials, not metadata.
`;
  setPromotion(root, ['| Verify the second factor first | - | change-local: sequencing only |']);

  for (const [style, text] of [['numbered', numbered], ['paragraphs', paragraphs]]) {
    write(root, `${CHANGE}/design.md`, text);
    assert.equal(
      find(check(root, ARCHIVE), /1 row\(s\) for 3 decision\(s\)/, 'warn').length,
      1,
      `${style} style must count three decisions`
    );
  }
});

test('NEG-004 a Decisions section with no recognisable decision counts zero', (root) => {
  write(root, `${CHANGE}/design.md`, '## Decisions\n\nWe talked it over and kept the existing approach.\n');
  setPromotion(root, ['| Kept the existing approach | - | change-local: nothing new was decided |']);
  const report = check(root, ARCHIVE);
  assert.equal(find(report, /row\(s\) for/, 'warn').length, 0, 'zero counted decisions cannot be under-accounted');
  assert.deepEqual(report.errors.map((f) => f.message), [], 'a satisfied row is still a satisfied row');
});

test('UT-010 a change declaring only "no domain knowledge" is still gated on decisions', (root) => {
  declareNoDomainKnowledge(root);
  setPromotion(root, []);
  assertError(
    check(root, ARCHIVE),
    /Decision Promotion table is empty/,
    'the escape hatch waives one entry, not every gate'
  );
});

test('UT-011 a change with no okf-link.md reports the missing artifact, not a promotion gap', (root) => {
  fs.rmSync(path.join(root, CHANGE, 'okf-link.md'));
  const report = check(root, ARCHIVE);
  assertError(report, /no okf-link\.md/, 'the mandatory gate artifact is its own finding');
  assert.deepEqual(promotionFindings(report), [], 'a missing gate artifact must not be re-reported as a promotion gap');
});

test('UT-015 the waiver phrase the gate matches occurs in the schema own design rule', (root) => {
  const schema = readF(KIT, 'openspec/schemas/okf-gated-feature/schema.yaml');
  const designRule = schema.slice(schema.indexOf('- id: design'), schema.indexOf('- id: test-cases'));
  assert.match(
    designRule,
    /Not required because/,
    'the gate recognises a waiver by this phrase; if the schema stops mandating it, the gate silently waives every change'
  );
  void root;
});

// --- the static analysis gate (BR-9..BR-12) ---------------------------------

test('UT-100 the clean fixture stays archivable with a satisfied static analysis table', (root) => {
  assert.deepEqual(staticFindings(check(root, ARCHIVE)), [], 'a satisfied table must produce nothing');
});

test('UT-101 archive mode blocks a verification with no static analysis table', (root) => {
  setStaticAnalysis(root, null);
  assertError(check(root, ARCHIVE), /Static Analysis table/, 'a green suite is not evidence that the code compiles');
});

test('UT-102 the same verification only warns before the archive boundary', (root) => {
  setStaticAnalysis(root, null);
  const report = check(root);
  assertWarn(report, /Static Analysis table/, 'a result is not knowable before the code that produces it is written');
  assert.deepEqual(
    report.findings.filter((f) => f.level === 'error'),
    [],
    'an in-flight change must not be blocked by a record it cannot yet fill'
  );
});

test('UT-103 a table with no Typecheck row is blocked', (root) => {
  setStaticAnalysis(root, [LINT_OK]);
  assertError(check(root, ARCHIVE), /Typecheck/, 'a deleted row must not read the same as a project without one');
});

test('UT-104 a table with no Lint row is blocked', (root) => {
  setStaticAnalysis(root, [TYPE_OK]);
  assertError(check(root, ARCHIVE), /Lint/, 'both required rows are checked, not just the first');
});

test('UT-105 a row with an empty result is blocked', (root) => {
  setStaticAnalysis(root, [LINT_OK, '| Typecheck | `npm run typecheck` |  |']);
  assertError(check(root, ARCHIVE), /Typecheck/, 'a command with no result records that nobody looked');
});

test('UT-106b a row left as a template placeholder is reported through its empty result', (root) => {
  // The command column is not gated. A row nobody filled in has no result either,
  // and the result is what BR-11 reads - so the untouched template row is still
  // caught, without a second placeholder implementation to drift out of date.
  setStaticAnalysis(root, [LINT_OK, '| Typecheck | `<typecheck-command>` |  |']);
  const report = check(root, ARCHIVE);
  assertError(report, /Typecheck/, 'an untouched template row must not archive');
  assert.deepEqual(
    staticFindings(report).filter((s) => /placeholder/.test(s)),
    [],
    'the gate says nothing about the command column'
  );
});

test('UT-107 a row discharged with a stated reason is accepted', (root) => {
  setStaticAnalysis(root, [
    LINT_OK,
    '| Typecheck | - | Not Applicable because the project is plain ESM with no type checker |',
  ]);
  assert.deepEqual(staticFindings(check(root, ARCHIVE)), [], 'a stated reason discharges a required row');
});

test('UT-108 the gate reads reported results and runs nothing', (root) => {
  // Asserted over the source rather than by stubbing `node:child_process`: an ESM
  // import binds at import time, so patching the namespace afterwards would leave
  // a captured binding live and the test would pass while the gate shelled out.
  // Reading the import graph cannot be fooled that way.
  // Scoped to check.mjs, where the gate lives. `lib/audit.mjs` shells out to git
  // by design; BR-12 constrains the gate, not the kit.
  assert.equal(
    /child_process|execSync|execFileSync|spawnSync|\bspawn\(/.test(readF(KIT, 'lib/check.mjs')),
    false,
    'lib/check.mjs reaches for a subprocess - the gate records what a change reported, it does not re-run it (BR-12)'
  );

  setStaticAnalysis(root, ['| Lint | `rm -rf /nonexistent-and-fatal` | clean |', TYPE_OK]);
  assert.deepEqual(staticFindings(check(root, ARCHIVE)), [], 'the command column is read, never executed');
});

test('UT-109 the static analysis gate reaches a change with no linked entries', (root) => {
  declareNoDomainKnowledge(root);
  setStaticAnalysis(root, null);
  assertError(check(root, ARCHIVE), /Static Analysis table/, 'the escape hatch waives one entry, not every gate');
});

test('UT-111 an extra row is accepted and unconstrained', (root) => {
  setStaticAnalysis(root, [LINT_OK, TYPE_OK, '| Build | `npm run build` | clean |']);
  assert.deepEqual(staticFindings(check(root, ARCHIVE)), [], 'the required set is two rows, not a closed vocabulary');
});

test('NEG-101 a result cell holding a dash is blocked', (root) => {
  setStaticAnalysis(root, [LINT_OK, '| Typecheck | `npm run typecheck` | - |']);
  assertError(check(root, ARCHIVE), /Typecheck/, 'a dash and an empty cell both read as absent everywhere else here');
});

test('NEG-102 a bare Not Applicable with no reason is blocked', (root) => {
  setStaticAnalysis(root, [LINT_OK, '| Typecheck | - | Not Applicable |']);
  assertError(check(root, ARCHIVE), /Typecheck/, 'a reason that names nothing is not a reason');
});

test('NEG-103 a result reading not run is blocked', (root) => {
  setStaticAnalysis(root, [LINT_OK, '| Typecheck | `npm run typecheck` | not run |']);
  assertError(check(root, ARCHIVE), /Typecheck/, 'a non-result is not a result');
});

test('NEG-104 a table holding only the template blank row counts as empty', (root) => {
  setStaticAnalysis(root, ['|  |  |  |']);
  assertError(check(root, ARCHIVE), /Static Analysis table/, 'a blank row is not a filled row');
});

test('NEG-105 a Check cell spelled "Type check" is accepted', (root) => {
  setStaticAnalysis(root, [LINT_OK, '| Type check | `npm run typecheck` | clean |']);
  assert.deepEqual(
    staticFindings(check(root, ARCHIVE)),
    [],
    'a required row that fails on spelling teaches agents to fight the matcher, not to run the checker'
  );
});

const VERIFY_TPL = 'openspec/schemas/okf-gated-feature/templates/verification.md';
const TESTPLAN_TPL = 'openspec/schemas/okf-gated-feature/templates/test-plan.md';
const SCHEMA = 'openspec/schemas/okf-gated-feature/schema.yaml';

test('UT-110 the schema and verification template state the static analysis table is enforced', (root) => {
  const schema = readF(KIT, SCHEMA);
  // `\napply:` at column zero. A bare 'apply:' also matches the design
  // instruction's "Write a real design if any apply:", which slices backwards.
  const verifyRule = schema.slice(schema.indexOf('- id: verification'), schema.search(/^apply:/m));
  assert.match(verifyRule, /Static Analysis/, 'the instruction must name the artifact it demands');
  assert.match(
    verifyRule,
    /enforced|checked by `?okf check|`okf check --archive`/,
    'an agent reading the instruction must not be told a checkbox suffices'
  );
  assert.match(readF(KIT, VERIFY_TPL), /# Static Analysis/, 'the template must carry the section');
  void root;
});

test('UT-112 the test-plan template carries lint and typecheck commands', (root) => {
  const tpl = readF(KIT, TESTPLAN_TPL);
  const commands = tpl.slice(tpl.indexOf('# Commands'));
  assert.match(commands, /##\s*Lint/i, 'the plan is where the command is chosen');
  assert.match(commands, /##\s*Typecheck/i, 'both required categories, not just the first');
  void root;
});

test('UT-113 no shipped template names an ecosystem', (root) => {
  // The gate never reads the command column, so a shipped default would be a
  // shipped assumption about the ecosystem and nothing else.
  const ecosystem = /\b(npm run|npx|yarn|pnpm|cargo|go test|mvn|gradle|poetry|pip|bundle exec|ruff|eslint|tsc|mypy)\b/;
  for (const rel of [VERIFY_TPL, TESTPLAN_TPL]) {
    const hits = readF(KIT, rel)
      .split('\n')
      .filter((l) => ecosystem.test(l));
    assert.deepEqual(hits, [], `${rel} ships a command specific to one ecosystem`);
  }
  void root;
});

test('UT-114 the test-plan instruction names where a project declares its commands', (root) => {
  const schema = readF(KIT, SCHEMA);
  const planRule = schema.slice(schema.indexOf('- id: test-plan'), schema.indexOf('- id: tasks'));
  assert.match(planRule, /AGENTS\.md/, 'the declaration site must be named, or every change re-derives it');
  assert.match(planRule, /outside the (okf-kit )?markers?/i, 'inside the markers is overwritten on upgrade');
  void root;
});

test('E2E-001 a promotion warning alone exits 0 and reports ready to archive', (root) => {
  setPromotion(root, ['| Verify the second factor first | - | change-local: sequencing only |']);
  const out = execFileSync('node', [path.join(KIT, 'bin/okf.mjs'), 'check', '--archive', 'add-mfa', '--root', root], {
    encoding: 'utf8',
  });
  // execFileSync throws on a non-zero exit, so reaching here is the exit-0 assertion.
  assert.match(out, /okf check: 0 error\(s\), 1 warning\(s\)/, 'the only finding must be the warning');
  assert.match(out, /ready to archive/, 'a warning must not block the archive');
});

// ---------------------------------------------------------------------------
// Hygiene on change artifacts, and quoting as the way out of it.
// Rules: .okf/features/artifact-hygiene.md (BR-1..BR-6).
// ---------------------------------------------------------------------------

/**
 * One artifact of the fixture change, written verbatim. A `replace` that
 * silently matched nothing would leave a test asserting against residue it
 * never actually wrote.
 */
const setArtifact = (root, name, text) => write(root, `${CHANGE}/${name}`, text);

const HYGIENE = /unfilled placeholder|empty table row|empty list item|template instruction comment/;

/** Hygiene findings at any level, narrowed to a path fragment. */
const hygieneFindings = (report, file = '') =>
  report.findings
    .filter((f) => HYGIENE.test(f.message) && f.file.includes(file))
    .map((f) => `[${f.level}] ${f.file}: ${f.message}`);

/** An unfilled slot of the shape a template leaves behind. */
const SLOT = '<the capability this change touches>';
const FENCE = '```';
const SHIPPED_COMMENT = ['<!--', 'HOW TO USE THIS TEMPLATE', 'Delete this once the artifact has content.', '-->'].join(
  '\n'
);

test('UT-200 the clean fixture carries no hygiene finding on a change artifact', (root) => {
  assert.deepEqual(
    hygieneFindings(check(root, ARCHIVE), CHANGE),
    [],
    'every other test here reads as noise if the fixture itself carries residue'
  );
});

test('UT-201 a placeholder in a change artifact warns in flight', (root) => {
  setArtifact(root, 'proposal.md', `${PROPOSAL}\n## Impact\n\n${SLOT}\n`);
  const report = check(root);
  assert.equal(
    find(report, /unfilled placeholder/, 'warn').length,
    1,
    'the scan must reach openspec/changes/, not only .okf/ (BR-1)'
  );
  assert.deepEqual(
    hygieneFindings(report, CHANGE).filter((f) => f.startsWith('[error]')),
    [],
    'a change in flight legitimately holds a half-written artifact (BR-5)'
  );
});

test('UT-202 the same placeholder errors at archive', (root) => {
  setArtifact(root, 'proposal.md', `${PROPOSAL}\n## Impact\n\n${SLOT}\n`);
  assertError(
    check(root, ARCHIVE),
    /unfilled placeholder/,
    'nothing archives carrying a slot that reads as an answer (BR-5)'
  );
});

test('UT-203 a placeholder inside an inline code span is not residue', (root) => {
  setArtifact(
    root,
    'design.md',
    `${DESIGN}\n## Notes\n\nThe okf-link template ships \`${SLOT}\` in its first cell.\n`
  );
  assert.deepEqual(
    hygieneFindings(check(root, ARCHIVE), CHANGE),
    [],
    'naming a slot is an assertion about the template, not an unanswered slot (BR-2, BR-4)'
  );
});

test('UT-204 a placeholder inside a fenced block is not residue', (root) => {
  setArtifact(
    root,
    'design.md',
    [DESIGN, '## Notes', '', FENCE, '| Capability | OKF File |', `| ${SLOT} | ${SLOT} |`, FENCE, ''].join('\n')
  );
  assert.deepEqual(
    hygieneFindings(check(root, ARCHIVE), CHANGE),
    [],
    'fencing already exempted quoted text; adding spans must not break it (BR-2)'
  );
});

test('UT-205 the code-span exemption applies to bundle files too', (root) => {
  withProse(root, `The feature template ships \`${SLOT}\` as a slot.`);
  assert.deepEqual(
    hygieneFindings(check(root), '.okf/features/user-auth.md'),
    [],
    'one rule with one implementation, not one per directory (BR-4)'
  );
});

test('UT-206 a blank table row in a change artifact is reported', (root) => {
  setArtifact(
    root,
    'test-cases.md',
    ['# Unit Test Cases', '', '| ID | Scenario |', '| --- | --- |', '| UT-001 | admin without mfa |', '|  |  |', ''].join(
      '\n'
    )
  );
  assertError(check(root, ARCHIVE), /empty table row/, 'a blank row is residue wherever it survives (BR-1)');
});

test('UT-207 a leftover instruction comment warns then errors', (root) => {
  setArtifact(root, 'design.md', `${SHIPPED_COMMENT}\n\n${DESIGN}`);
  assert.equal(
    find(check(root), /template instruction comment/, 'warn').length,
    1,
    'the comment is guidance the author may still be using (BR-6)'
  );
  assertError(
    check(root, ARCHIVE),
    /template instruction comment/,
    'at archive it stops being guidance and starts being residue (BR-6)'
  );
});

test('UT-210 the marker named inside a code span is not the comment finding', (root) => {
  // Found by the rule biting its own paperwork: verification.md has to name the
  // marker to explain what BR-6 recognises, and naming it made the file report
  // itself. The comment finding reads raw text - it has to, or stripComments
  // would delete the very comment it looks for - so it was the one residue check
  // the quoting exemption never reached.
  setArtifact(root, 'design.md', `${DESIGN}\n## Notes\n\nA comment is a template's own when it says \`HOW TO USE THIS TEMPLATE\`.\n`);
  withProse(root, "The marker is `HOW TO USE THIS TEMPLATE`, which only the bundle templates ship.");
  assert.deepEqual(
    hygieneFindings(check(root, ARCHIVE)),
    [],
    'quoting is skipped in every file the scan reads, the comment finding included (BR-2)'
  );

  setArtifact(root, 'design.md', `${SHIPPED_COMMENT}\n\n${DESIGN}`);
  assertError(
    check(root, ARCHIVE),
    /template instruction comment/,
    'and stripping the quotes must not blind the check to a real leftover comment (BR-6)'
  );
});

test('UT-208 no file is excused by name', (root) => {
  const src = readF(KIT, 'lib/check.mjs');
  const scan = src.indexOf('function stripCodeSpans');
  const walk = src.indexOf('function checkChangeHygiene');
  const region =
    src.slice(scan, src.indexOf('\n// ---', scan)) + src.slice(walk, src.indexOf('function checkChange(', walk));
  // Prose is not the property under test - an implementation may say the word
  // "exempt" while holding no list. Strip comments and read the code.
  const code = region.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');

  const offenders = code
    .split('\n')
    .filter((l) => /['"][^'"\n]*\w\.md['"]/.test(l) || /\b(allow_?list|exempt\w*|excused|skip_?files)\b/i.test(l));
  assert.deepEqual(
    offenders,
    [],
    'quoting is recognised from the text itself, never from a list of excused files (BR-3)'
  );
  void root;
});

test('UT-209 an archived change is not scanned', (root) => {
  write(
    root,
    'openspec/changes/archive/2026-01-01-old-change/proposal.md',
    `## Why\n\n${SLOT}\n\n-\n`
  );
  assert.deepEqual(
    hygieneFindings(check(root, ARCHIVE), 'openspec/changes/archive'),
    [],
    'an archived change was archived under the rules of its time (BR-1)'
  );
});

test('NEG-201 a bare list item in a change artifact is reported', (root) => {
  setArtifact(root, 'test-cases.md', '# Open Questions\n\n-\n');
  assertError(check(root, ARCHIVE), /empty list item/, 'same escalation as a placeholder (BR-1)');
});

test('NEG-202 an autolink is not reported', (root) => {
  setArtifact(root, 'proposal.md', `${PROPOSAL}\n## Links\n\n<https://example.com/prd>\n`);
  assert.deepEqual(
    hygieneFindings(check(root, ARCHIVE), CHANGE),
    [],
    'inherited from the existing heuristic, and widening the scan must not lose it'
  );
});

test('NEG-203 a stray HTML tag is not reported', (root) => {
  setArtifact(root, 'proposal.md', `${PROPOSAL}\n## Impact\n\nOne line,<br>then another.\n`);
  assert.deepEqual(
    hygieneFindings(check(root, ARCHIVE), CHANGE),
    [],
    'inherited from the existing stray-tag skip, same reason'
  );
});

test('NEG-204 a fence containing a backtick does not swallow the rest of the file', (root) => {
  setArtifact(
    root,
    'design.md',
    [DESIGN, '## Notes', '', FENCE, 'a line holding one ` inside the fence', FENCE, '', SLOT, ''].join('\n')
  );
  assertError(
    check(root, ARCHIVE),
    /unfilled placeholder/,
    'fences are stripped first, so a fence backtick cannot pair with prose after it'
  );
});

test('NEG-205 an unbalanced backtick does not swallow the rest of the file', (root) => {
  setArtifact(root, 'design.md', `${DESIGN}\n## Notes\n\nA sentence with one \` and nothing closing it.\n\n${SLOT}\n`);
  assertError(check(root, ARCHIVE), /unfilled placeholder/, 'a span with no close is not a span');
});

test('okf index is idempotent and detects staleness', (root) => {
  const first = buildIndex(root, { today: '2026-07-30' });
  const second = buildIndex(root, { today: '2026-07-30' });
  assert.equal(first, second, 'generation must be deterministic');
  assert.equal(first, readF(root, '.okf/index.md'), 'scaffold wrote the generated form');
  assert.match(first, /\| \[user-auth\]\(features\/user-auth\.md\) \| verified \| 2026-07-30 \| - \| high \| stable \|/);
});

test('okf index keeps hand-written ledger notes across regeneration', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('verification_state: verified', 'verification_state: needs-revision'));
  writeIndex(root, { today: '2026-07-30' });
  edit(root, '.okf/index.md', (t) =>
    t.replace(/\| user-auth \| 2026-07-30 \| add-mfa \| - \|/, '| user-auth | 2026-07-30 | add-mfa | decide if MFA applies to service accounts |')
  );
  writeIndex(root, { today: '2026-08-15' });
  const text = readF(root, '.okf/index.md');
  assert.match(text, /decide if MFA applies to service accounts/, 'the note must survive');
  assert.match(text, /\| user-auth \| 2026-07-30 \|/, 'the original Since date must survive');
});

// ---------------------------------------------------------------------------
// init / upgrade
// ---------------------------------------------------------------------------

const KIT_VERSION = JSON.parse(fs.readFileSync(path.join(KIT, 'package.json'), 'utf8')).version;

/** A bare project dir, as if someone just cloned their app repo. */
function bare(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-proj-'));
  try {
    fn(root);
    passed++;
  } catch (err) {
    failures.push({ name: fn.testName ?? 'bare test', err });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
}
function projectTest(name, fn) {
  fn.testName = name;
  bare(fn);
}

projectTest('init installs the payload, dirs, manifest, and addendum', (root) => {
  const res = install(KIT, root, KIT_VERSION, { mode: 'init' });
  assert.equal(res.ok, true);

  for (const rel of [
    'openspec/config.yaml',
    'openspec/schemas/okf-gated-feature/schema.yaml',
    'openspec/schemas/okf-gated-feature/templates/okf-link.md',
    '.okf/README.md',
    '.okf/templates/feature.md.tmpl',
    '.okf/templates/decision.md.tmpl',
    '.okf/.okf-kit.json',
    'CLAUDE.md',
    'AGENTS.md',
  ]) {
    assert.ok(fs.existsSync(path.join(root, rel)), `${rel} should exist after init`);
  }
  assert.ok(fs.existsSync(path.join(root, '.okf/features')), 'features/ must be created');
  assert.ok(fs.existsSync(path.join(root, '.okf/decisions')), 'decisions/ must be created');

  const manifest = JSON.parse(readF(root, '.okf/.okf-kit.json'));
  assert.equal(manifest.version, KIT_VERSION);
  assert.ok(manifest.files['openspec/config.yaml'], 'payload files are hashed');
  assert.ok(manifest.files['CLAUDE.md#block'], 'the addendum block is hashed');

  const claude = readF(root, 'CLAUDE.md');
  assert.match(claude, new RegExp(`okf-kit:start v${KIT_VERSION.replace(/\./g, '\\.')}`));
  assert.match(claude, /okf-kit:end/);
  assert.match(claude, /named after the \*\*capability\*\*/, 'the real addendum body is installed');
});

projectTest('init refuses to run twice', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  const again = install(KIT, root, KIT_VERSION, { mode: 'init' });
  assert.equal(again.ok, false);
  assert.match(again.reason, /already initialised/);
});

projectTest('upgrade refuses without a manifest', (root) => {
  const res = install(KIT, root, KIT_VERSION, { mode: 'upgrade' });
  assert.equal(res.ok, false);
  assert.match(res.reason, /run `okf init` first/);
});

projectTest('upgrade replaces an untouched kit file', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  // simulate an older kit version shipping different content
  write(root, '.okf/templates/feature.md.tmpl', 'old kit content\n');
  const manifest = JSON.parse(readF(root, '.okf/.okf-kit.json'));
  manifest.files['.okf/templates/feature.md.tmpl'] = crypto
    .createHash('sha256')
    .update('old kit content\n')
    .digest('hex');
  write(root, '.okf/.okf-kit.json', JSON.stringify(manifest, null, 2));

  const res = install(KIT, root, KIT_VERSION, { mode: 'upgrade' });
  const acted = res.actions.find((a) => a.rel === '.okf/templates/feature.md.tmpl');
  assert.equal(acted.action, 'update');
  assert.match(readF(root, '.okf/templates/feature.md.tmpl'), /HOW TO USE THIS TEMPLATE/);
});

projectTest('upgrade leaves a locally edited kit file alone', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  const target = '.okf/templates/feature.md.tmpl';
  write(root, target, 'our team rewrote this template\n');

  const res = install(KIT, root, KIT_VERSION, { mode: 'upgrade' });
  const acted = res.actions.find((a) => a.rel === target);
  assert.equal(acted.action, 'skip-modified', 'a team edit must not be silently clobbered');
  assert.equal(readF(root, target), 'our team rewrote this template\n');
});

projectTest('upgrade --force overwrites a locally edited kit file', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  const target = '.okf/templates/feature.md.tmpl';
  write(root, target, 'our team rewrote this template\n');

  install(KIT, root, KIT_VERSION, { mode: 'upgrade', force: true });
  assert.match(readF(root, target), /HOW TO USE THIS TEMPLATE/, '--force must actually overwrite');
});

projectTest('upgrade never touches project-owned OKF content', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  write(root, '.okf/features/billing.md', '---\ntitle: billing\n---\n\n# Summary\n\nOurs.\n');
  write(root, '.okf/index.md', 'our index\n');

  install(KIT, root, KIT_VERSION, { mode: 'upgrade', force: true });
  assert.match(readF(root, '.okf/features/billing.md'), /Ours\./, 'entries are project-owned');
  assert.equal(readF(root, '.okf/index.md'), 'our index\n', 'INDEX.md is generated, not installed');
});

projectTest('upgrade preserves project text outside the markers', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  edit(root, 'CLAUDE.md', (t) => `# Our House Rules\n\nUse tabs. Ship on Fridays.\n\n${t}\n\n## Appendix\n\nOurs too.\n`);
  // make the kit block look like it came from an older version
  edit(root, 'CLAUDE.md', (t) => t.replace(/okf-kit:start v[^\s]+/, 'okf-kit:start v1.0.0'));
  const manifest = JSON.parse(readF(root, '.okf/.okf-kit.json'));
  write(root, '.okf/.okf-kit.json', JSON.stringify(manifest, null, 2));

  install(KIT, root, KIT_VERSION, { mode: 'upgrade' });
  const text = readF(root, 'CLAUDE.md');
  assert.match(text, /Use tabs\. Ship on Fridays\./, 'text above the block survives');
  assert.match(text, /## Appendix\n\nOurs too\./, 'text below the block survives');
  assert.match(text, new RegExp(`okf-kit:start v${KIT_VERSION.replace(/\./g, '\\.')}`), 'block version is bumped');
  assert.equal((text.match(/okf-kit:start/g) || []).length, 1, 'the block must not be duplicated');
});

projectTest('init appends the block to an existing CLAUDE.md without markers', (root) => {
  write(root, 'CLAUDE.md', '# Existing\n\nProject rules.\n');
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  const text = readF(root, 'CLAUDE.md');
  assert.match(text, /# Existing\n\nProject rules\./, 'existing content is kept');
  assert.match(text, /okf-kit:start/, 'the block is appended');
});

projectTest('dry run writes nothing', (root) => {
  const res = install(KIT, root, KIT_VERSION, { mode: 'init', dryRun: true });
  assert.equal(res.ok, true);
  assert.ok(res.actions.length > 5, 'it should still report the plan');
  assert.equal(fs.existsSync(path.join(root, '.okf/.okf-kit.json')), false, 'nothing may be written');
  assert.equal(fs.existsSync(path.join(root, 'CLAUDE.md')), false, 'nothing may be written');
});

projectTest('an installed project passes check, and version skew warns', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  writeIndex(root, { today: '2026-07-30' });

  const clean = check(root, { kitVersion: KIT_VERSION });
  assert.deepEqual(
    clean.findings.map((f) => `[${f.level}] ${f.file}: ${f.message}`),
    [],
    'a freshly initialised project must be clean'
  );

  const skewed = check(root, { kitVersion: '9.9.9' });
  assert.ok(
    find(skewed, /run `okf upgrade`/, 'warn').length > 0,
    'a project on an older kit must be told'
  );
});

/**
 * A payload file missing from package.json `files` breaks `okf init` only for
 * people who installed the kit as a package - never in this repo. Guard it
 * statically so the failure cannot escape into other teams' projects.
 */
projectTest('package.json files[] covers every installed payload path', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(KIT, 'package.json'), 'utf8'));
  const shipped = pkg.files ?? [];
  const needed = [...payloadPaths(KIT), 'AGENTS.md', 'bin/okf.mjs', 'lib/install.mjs'];

  const missing = needed.filter(
    (rel) => !shipped.some((entry) => rel === entry || rel.startsWith(entry.replace(/\/$/, '') + '/'))
  );
  assert.deepEqual(missing, [], 'these paths are installed by okf init but would not ship in the package');
});

/**
 * The version appears in four places and okf check compares three of them at
 * install time. A tag pointing at a commit whose package.json disagrees makes the
 * version meaningless - which is the one thing the kit asks teams to rely on.
 */
projectTest('the version agrees in package.json, both markers, and the README', () => {
  const pkg = JSON.parse(fs.readFileSync(path.join(KIT, 'package.json'), 'utf8')).version;

  for (const name of ['CLAUDE.md', 'AGENTS.md']) {
    const text = fs.readFileSync(path.join(KIT, name), 'utf8');
    const m = /okf-kit:start v([\d.]+)/.exec(text);
    assert.ok(m, `${name} has no versioned okf-kit marker`);
    assert.equal(m[1], pkg, `${name} marker says v${m?.[1]}, package.json says ${pkg}`);
  }

  const readme = fs.readFileSync(path.join(KIT, 'README.md'), 'utf8');
  const install = /okf-kit#v([\d.]+)/.exec(readme);
  assert.ok(install, 'README has no versioned install command');
  assert.equal(install[1], pkg, `README installs v${install?.[1]}, package.json says ${pkg}`);
});

/**
 * `index.md` is a reserved OKF filename and the reserved form is lowercase. On a
 * case-insensitive filesystem - which is most developer machines - a reference to
 * `.okf/INDEX.md` resolves anyway, so a stale one survives every local run and
 * only fails on Linux CI, or worse, silently sends an agent to a path that does
 * not exist for the team that reads the instruction.
 *
 * `test/` is excluded on purpose: it holds a deliberate negative assertion about
 * the uppercase path, and running the suite on a case-sensitive filesystem is
 * what checks the tests themselves.
 */
projectTest('no kit-owned file points at the pre-v0.3 uppercase index path', () => {
  const skip = new Set(['.git', 'node_modules', 'test']);
  const offenders = [];

  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      if (skip.has(e.name)) continue;
      const abs = path.join(dir, e.name);
      const rel = path.relative(KIT, abs);
      if (rel.startsWith('openspec/changes')) continue; // history and other people's changes
      if (e.isDirectory()) {
        walk(abs);
        continue;
      }
      if (!/\.(md|mjs|yaml|yml|json)$/.test(e.name)) continue;
      if (fs.readFileSync(abs, 'utf8').includes('.okf/INDEX.md')) offenders.push(rel);
    }
  };
  walk(KIT);

  assert.deepEqual(offenders, [], 'these still name the uppercase index path, which does not exist on Linux');
});

projectTest('divergent CLAUDE.md and AGENTS.md blocks are an error', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  writeIndex(root, { today: '2026-07-30' });
  edit(root, 'AGENTS.md', (t) => t.replace('named after the **capability**', 'named after the change'));

  assertError(
    check(root, { kitVersion: KIT_VERSION }),
    /would follow different rules/,
    'the two files must stay identical or tools diverge'
  );
});

// ---------------------------------------------------------------------------
// okf audit (UT-001 .. UT-012, see openspec/changes/add-okf-audit/test-cases.md)
// ---------------------------------------------------------------------------

/**
 * A real git repository with controlled commit dates. The whole risk of the audit
 * lives in git's actual pathspec and date behavior, so mocking git would fake
 * away the only thing worth testing.
 */
function gitRepo(fn) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-git-'));
  const git = (args, date) =>
    execFileSync('git', args, {
      cwd: root,
      encoding: 'utf8',
      env: {
        ...process.env,
        GIT_AUTHOR_NAME: 'test',
        GIT_AUTHOR_EMAIL: 'test@example.com',
        GIT_COMMITTER_NAME: 'test',
        GIT_COMMITTER_EMAIL: 'test@example.com',
        ...(date ? { GIT_AUTHOR_DATE: `${date}T12:00:00`, GIT_COMMITTER_DATE: `${date}T12:00:00` } : {}),
      },
    });

  git(['init', '-q', '--initial-branch=main']);
  fs.mkdirSync(path.join(root, '.okf', 'features'), { recursive: true });

  const commit = (rel, body, date) => {
    write(root, rel, body);
    git(['add', '-A']);
    git(['commit', '-q', '-m', `touch ${rel}`], date);
  };

  const ignore = (patterns, date) => commit('.gitignore', patterns.join('\n') + '\n', date);

  return { root, git, commit, ignore, cleanup: () => fs.rmSync(root, { recursive: true, force: true }) };
}

function entry(name, { verified = 'verified', verifiedAt = '2026-07-20', status = 'stable', codePaths = [] } = {}) {
  return `---
type: Feature Knowledge
title: ${name}
description: Test entry for the audit.
status: ${status}
verification_state: ${verified}
verified_at: ${verifiedAt}
criticality: normal
pending_changes: []
code_paths: [${codePaths.join(', ')}]
---

# Summary

An entry used by the audit tests.
`;
}

function auditTest(name, fn) {
  const repo = gitRepo();
  try {
    fn(repo);
    passed++;
  } catch (err) {
    failures.push({ name, err });
  } finally {
    repo.cleanup();
  }
}

const byName = (res, name) => res.results.find((r) => r.capability === name);

auditTest('UT-001 audit reports a newer commit as stale', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-20');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-01', codePaths: ['src/**'] }));

  const res = audit(root);
  const r = byName(res, 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.equal(r.verdict, 'stale');
  assert.equal(r.newestCommit, '2026-07-20', 'the report must name the commit date');
  assert.equal(r.triggeredBy, 'src/**', 'the report must name the triggering path');
  assert.equal(res.stale, 1);
});

auditTest('UT-002 audit reports an older commit as current', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-01');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-20', codePaths: ['src/**'] }));

  assert.ok(byName(audit(root), 'user-auth'), 'the entry must appear in the results');
  assert.equal(byName(audit(root), 'user-auth').verdict, 'current');
});

auditTest('UT-003 audit treats a same-date commit as current', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-20');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-20', codePaths: ['src/**'] }));

  assert.equal(
    byName(audit(root), 'user-auth').verdict,
    'current',
    'verification follows the code it verifies, so the same day is not drift'
  );
});

auditTest('UT-004 audit reports an entry with no code_paths as unauditable', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-25');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-01', codePaths: [] }));

  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.equal(r.verdict, 'unauditable', 'silence about an unknown would be false assurance');
  assert.equal(audit(root).stale, 0, 'unauditable is not stale');
});

auditTest('UT-005 audit skips unverified and needs-revision entries', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-25');
  write(root, '.okf/features/a.md', entry('a', { verified: 'unverified', codePaths: ['src/**'] }));
  write(root, '.okf/features/b.md', entry('b', { verified: 'needs-revision', codePaths: ['src/**'] }));

  const res = audit(root);
  assert.ok(byName(res, 'a') && byName(res, 'b'), 'both entries must appear in the results');
  assert.equal(byName(res, 'a').verdict, 'skipped');
  assert.equal(byName(res, 'b').verdict, 'skipped');
  assert.equal(res.stale, 0);
});

auditTest('UT-006 audit skips a deprecated entry even when stale', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-25');
  write(
    root,
    '.okf/features/legacy.md',
    entry('legacy', { status: 'deprecated', verifiedAt: '2026-07-01', codePaths: ['src/**'] })
  );

  assert.ok(byName(audit(root), 'legacy'), 'the entry must appear in the results');
  assert.equal(byName(audit(root), 'legacy').verdict, 'skipped', 'deprecated code is expected to diverge');
});

auditTest('UT-007 audit does not modify any entry', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-25');
  const file = '.okf/features/user-auth.md';
  write(root, file, entry('user-auth', { verifiedAt: '2026-07-01', codePaths: ['src/**'] }));
  const before = readF(root, file);

  audit(root);
  assert.equal(readF(root, file), before, 'the audit must never rewrite knowledge from commit history alone');
});

auditTest('UT-008 audit ignores uncommitted changes', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-01');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-20', codePaths: ['src/**'] }));
  write(root, 'src/auth.js', 'edited but not committed\n');

  assert.ok(byName(audit(root), 'user-auth'), 'the entry must appear in the results');
  assert.equal(byName(audit(root), 'user-auth').verdict, 'current', 'work in progress is not drift');
});

auditTest('UT-009 audit counts stale entries for the exit status', ({ root, commit }) => {
  commit('src/a.js', 'a\n', '2026-07-25');
  commit('src/b.js', 'b\n', '2026-07-25');
  write(root, '.okf/features/a.md', entry('a', { verifiedAt: '2026-07-01', codePaths: ['src/a.js'] }));
  write(root, '.okf/features/b.md', entry('b', { verifiedAt: '2026-07-01', codePaths: ['src/b.js'] }));

  assert.equal(audit(root).stale, 2);
});

auditTest('UT-010 audit exits clean when only unauditable and skipped remain', ({ root, commit }) => {
  commit('src/a.js', 'a\n', '2026-07-25');
  write(root, '.okf/features/a.md', entry('a', { codePaths: [] }));
  write(root, '.okf/features/b.md', entry('b', { verified: 'unverified', codePaths: ['src/**'] }));

  const res = audit(root);
  assert.equal(res.ok, true);
  assert.equal(res.stale, 0);
});

auditTest('UT-011 audit refuses to run outside a git repository', () => {
  const plain = fs.mkdtempSync(path.join(os.tmpdir(), 'okf-nogit-'));
  try {
    fs.mkdirSync(path.join(plain, '.okf', 'features'), { recursive: true });
    write(plain, '.okf/features/a.md', entry('a', { codePaths: ['src/**'] }));

    const res = audit(plain);
    assert.equal(res.ok, false, 'it must say it could not run');
    assert.match(res.reason, /git/i);
    assert.equal(
      res.results.filter((r) => r.verdict === 'current').length,
      0,
      'reporting entries as current here would be the worst possible lie'
    );
  } finally {
    fs.rmSync(plain, { recursive: true, force: true });
  }
});

auditTest('UT-013 audit reports a verified entry with no verified_at as unauditable', ({ root, commit }) => {
  // Found by the verification pass: reporting `current` here would be a false
  // assurance built on a comparison that never happened.
  commit('src/auth.js', 'v1\n', '2026-07-25');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '', codePaths: ['src/**'] }));

  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.equal(r.verdict, 'unauditable');
  assert.equal(audit(root).stale, 0);
});

auditTest('UT-014 audit reports declared paths with no history as unauditable', ({ root, commit }) => {
  commit('README.md', 'hi\n', '2026-07-01');
  fs.mkdirSync(path.join(root, 'src'), { recursive: true });
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-20', codePaths: ['src/**'] }));

  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.equal(r.verdict, 'unauditable', 'no history means no comparison, not a clean bill of health');
});

auditTest('UT-015 audit reports an uncommitted path as not committed yet', ({ root, commit }) => {
  // Exactly what this repository showed right after add-okf-audit was verified:
  // verification precedes the commit that introduces the file.
  commit('src/old.js', 'old\n', '2026-07-01');
  write(root, 'src/brand-new.js', 'not committed yet\n');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-20', codePaths: ['src/brand-new.js'] }));

  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.deepEqual(r.untrackedPaths, ['src/brand-new.js'], 'a file waiting to be committed is not a vanished path');
  assert.deepEqual(r.missingPaths, [], 'and it must not be reported as matching nothing');
});

auditTest('UT-016 audit treats ignored files as matching nothing', ({ root, commit, ignore }) => {
  commit('src/app.js', 'app\n', '2026-07-01');
  ignore(['build/'], '2026-07-01');
  write(root, 'build/bundle.js', 'generated\n');
  write(root, '.okf/features/user-auth.md', entry('user-auth', { verifiedAt: '2026-07-20', codePaths: ['build/**'] }));

  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.deepEqual(r.missingPaths, ['build/**'], 'git will never track these, so the glob is wrong');
  assert.deepEqual(r.untrackedPaths, [], 'ignored is not the same as pending a commit');
});

auditTest('UT-017 audit verdicts are unaffected by an uncommitted path', ({ root, commit }) => {
  commit('src/committed.js', 'v1\n', '2026-07-25');
  write(root, 'src/pending.js', 'not committed\n');
  write(root, '.okf/features/user-auth.md',
    entry('user-auth', { verifiedAt: '2026-07-01', codePaths: ['src/committed.js', 'src/pending.js'] }));

  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.equal(r.verdict, 'stale', 'the committed path still decides the verdict');
  assert.equal(r.triggeredBy, 'src/committed.js');
  assert.deepEqual(r.untrackedPaths, ['src/pending.js']);
  assert.deepEqual(r.missingPaths, [], 'this change alters wording, not judgement');
});

auditTest('UT-012 audit flags a declared path that matches nothing', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-01');
  write(
    root,
    '.okf/features/user-auth.md',
    entry('user-auth', { verifiedAt: '2026-07-20', codePaths: ['src/**', 'gone/**'] })
  );

  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.deepEqual(r.missingPaths, ['gone/**'], 'a vanished path usually means the code moved');
});

// ---------------------------------------------------------------------------
// okf-spec-conformance
//
// The bundle format contract (OKF v0.2), the migration command, and the audit's
// selection field. `entry()` above stays on the pre-migration shape on purpose -
// `legacyEntry()` is its stable twin for the migration tests, so those tests do
// not start failing the day `entry()` moves.
// ---------------------------------------------------------------------------

const ATTESTATION = [{ by: 'anthropic/claude-opus-5', at: '2026-07-30T00:00:00Z' }];

/** A feature entry in the post-conformance shape. */
function okfEntry(name, {
  verificationState = 'verified',
  verifiedAt = '2026-07-30',
  attestations = ATTESTATION,
  status = 'stable',
  criticality = 'normal',
  codePaths = ['src/**'],
  generatedBy = 'anthropic/claude-opus-5',
} = {}) {
  const lines = [
    '---',
    'type: Feature Knowledge',
    `title: ${name}`,
    'description: Test entry for the bundle format.',
    `status: ${status}`,
    `verification_state: ${verificationState}`,
  ];
  if (verifiedAt !== null) lines.push(`verified_at: ${verifiedAt}`);
  if (attestations !== null) {
    lines.push('verified:');
    for (const a of attestations) {
      lines.push(`  - by: ${a.by}`);
      if (a.at !== undefined) lines.push(`    at: ${a.at}`);
    }
  }
  lines.push(`criticality: ${criticality}`);
  lines.push('pending_changes: []');
  lines.push(`code_paths: [${codePaths.join(', ')}]`);
  lines.push('generated:');
  lines.push(`  by: ${generatedBy}`);
  lines.push('  at: 2026-07-30T00:00:00Z');
  lines.push('---', '', '# Summary', '', 'An entry used by the bundle format tests.', '');
  return lines.join('\n');
}

/** A feature entry exactly as it looked before this change. Frozen on purpose. */
function legacyEntry(name, { verified = 'verified', verifiedAt = '2026-07-30' } = {}) {
  return `---
type: Feature Knowledge
title: ${name}
description: Test entry written before the conformance change.
status: active
verified: ${verified}
verified_at: ${verifiedAt}
criticality: normal
pending_changes: []
code_paths: [src/**]
---

# Summary

Body content that migration must leave byte-identical.

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-07-30 | add-mfa | verified | BR-1 traced to src/auth.js:12 |
`;
}

const AUTH = '.okf/features/user-auth.md';
/** Findings attached to one file, so unrelated fixture noise cannot mask a result. */
const forFile = (report, rel) => report.findings.map((f) => `[${f.level}] ${f.file}: ${f.message}`).filter((s) => s.includes(rel));

function assertWarn(report, re, msg) {
  const hits = find(report, re, 'warn');
  assert.ok(
    hits.length > 0,
    `${msg}\nexpected a WARNING matching ${re}\ngot:\n` +
      report.findings.map((f) => `  [${f.level}] ${f.file}: ${f.message}`).join('\n')
  );
  assert.equal(find(report, re, 'error').length, 0, `${msg}\nthis must never be an error`);
}

// --- verification_state vocabulary and the freed `verified` key --------------

test('a well-formed entry in the new shape is clean', (root) => {
  write(root, AUTH, okfEntry('user-auth', { criticality: 'high', attestations: [...ATTESTATION, { by: 'human:danh', at: '2026-07-30T09:00:00Z' }] }));
  assert.deepEqual(forFile(check(root), AUTH), [], 'the new shape must produce no findings');
});

test('unknown verification_state is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { verificationState: 'reviewed' }));
  assertError(check(root), /verification_state: "reviewed"/, 'the vocabulary must be closed');
});

test("a scalar in the specification's verified key is caught", (root) => {
  write(root, AUTH, legacyEntry('user-auth'));
  assertError(check(root), /holds a scalar/, 'a scalar in `verified` must point at the right field');
});

// --- the coupling between state and attestation ------------------------------

test('verified without an attestation is a warning, not an error', (root) => {
  write(root, AUTH, okfEntry('user-auth', { attestations: null }));
  assertWarn(check(root), /attestation/, 'a migrated entry must not be blocked');
});

test('verified_at disagreeing with the newest attestation is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { verifiedAt: '2026-07-30', attestations: [{ by: 'anthropic/claude-opus-5', at: '2026-08-01T00:00:00Z' }] }));
  const report = check(root);
  assertError(report, /2026-07-30/, 'the error must name the declared date');
  assertError(report, /2026-08-01/, 'the error must name the attested date');
});

test('needs-revision still carrying an attestation is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { verificationState: 'needs-revision' }));
  assertError(check(root), /key is present/, 'nobody vouches for content under revision');
});

test('unverified still carrying an attestation is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { verificationState: 'unverified', verifiedAt: null }));
  assertError(check(root), /key is present/, 'an unverified entry must read as unverified to a consumer');
});

test('an empty attestation list counts as no attestation', (root) => {
  write(root, AUTH, okfEntry('user-auth', { attestations: [] }));
  assertWarn(check(root), /attestation/, 'an empty list is not an attestation');
});

test('verified_at matching the older of two attestations is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', {
    verifiedAt: '2026-07-30',
    attestations: [
      { by: 'anthropic/claude-opus-5', at: '2026-07-30T00:00:00Z' },
      { by: 'human:danh', at: '2026-08-02T00:00:00Z' },
    ],
  }));
  assertError(check(root), /verified_at/, 'the comparison is against the newest attestation');
});

test('a bare attestation mapping is read as a one-element list', (root) => {
  const text = okfEntry('user-auth').replace(
    'verified:\n  - by: anthropic/claude-opus-5\n    at: 2026-07-30T00:00:00Z',
    'verified:\n  by: anthropic/claude-opus-5\n  at: 2026-07-30T00:00:00Z'
  );
  write(root, AUTH, text);
  assert.deepEqual(forFile(check(root), AUTH), [], 'the specification requires consumers to accept this form');
});

// --- human review is reported, never proven ----------------------------------

test('high criticality verified without a human actor is a warning', (root) => {
  write(root, AUTH, okfEntry('user-auth', { criticality: 'high' }));
  assertWarn(check(root), /human:/, 'absence is reportable; forcing it would manufacture forged sign-offs');
});

test('high criticality with a human actor is clean', (root) => {
  write(root, AUTH, okfEntry('user-auth', {
    criticality: 'high',
    attestations: [...ATTESTATION, { by: 'human:danh', at: '2026-07-30T09:00:00Z' }],
  }));
  assert.deepEqual(forFile(check(root), AUTH), [], 'the kit makes no claim about who wrote the line');
});

test('normal criticality without a human actor is clean', (root) => {
  write(root, AUTH, okfEntry('user-auth', { criticality: 'normal' }));
  assert.deepEqual(forFile(check(root), AUTH), [], 'only high criticality is worth reporting');
});

// --- every non-reserved bundle file is a concept document --------------------

test('a bundle markdown file without frontmatter is caught', (root) => {
  write(root, '.okf/notes.md', '# Notes\n\nSomething someone dropped here.\n');
  assertError(check(root), /type/, 'a file with no frontmatter is not a concept document');
});

test('reserved index.md and log.md are not concept documents', (root) => {
  write(root, '.okf/log.md', '# Log\n\n## 2026-07-30\n\n**Update** something happened.\n');
  assert.equal(
    find(check(root), /type/).filter((f) => /log\.md|index\.md/.test(f.file)).length,
    0,
    'reserved filenames carry structure, not concepts'
  );
});

// --- actor convention ---------------------------------------------------------

test('a bare actor name is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { generatedBy: 'claude-opus-5' }));
  assertError(check(root), /producer/, 'an actor outside the convention silently loses its tier');
});

test('a producer-qualified actor is clean', (root) => {
  write(root, AUTH, okfEntry('user-auth', { generatedBy: 'anthropic/claude-opus-5' }));
  assert.equal(find(check(root), /producer/).length, 0, 'the conventional form must be accepted');
});

test('a human actor is accepted and counts as human review', (root) => {
  write(root, AUTH, okfEntry('user-auth', {
    criticality: 'high',
    attestations: [{ by: 'human:danh', at: '2026-07-30T00:00:00Z' }],
  }));
  assert.deepEqual(forFile(check(root), AUTH), [], 'a human attestation reaches the human-reviewed tier');
});

test('an attestation missing by is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { attestations: [{ by: '', at: '2026-07-30T00:00:00Z' }] }));
  assertError(check(root), /\bby\b/, 'the specification makes by required when the family is present');
});

test('an attestation with a malformed at is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { attestations: [{ by: 'anthropic/claude-opus-5', at: 'yesterday' }] }));
  assertError(check(root), /\bat\b/, 'at is an ISO 8601 datetime');
});

// --- status vocabulary --------------------------------------------------------

test('the previous status vocabulary is caught', (root) => {
  write(root, AUTH, okfEntry('user-auth', { status: 'active' }));
  assertError(check(root), /draft \| stable \| deprecated/, 'status uses the specification vocabulary');
});

test('a decision separating status from decision_status is clean', (root) => {
  const file = '.okf/decisions/2026-07-30-verify-factor-before-session.md';
  edit(root, file, (t) => t.replace('status: accepted', 'status: stable\ndecision_status: accepted'));
  assert.deepEqual(forFile(check(root), file), [], 'the two lifecycles are separate keys');
});

test('unknown decision_status is caught', (root) => {
  const file = '.okf/decisions/2026-07-30-verify-factor-before-session.md';
  edit(root, file, (t) => t.replace('status: accepted', 'status: stable\ndecision_status: retired'));
  assertError(check(root), /decision_status: "retired"/, 'the decision vocabulary is closed');
});

// --- the bundle root index and okf_version ------------------------------------

test('a missing bundle root index is caught', (root) => {
  fs.rmSync(path.join(root, '.okf', 'index.md'), { force: true });
  assert.ok(
    check(root).findings.some((f) => f.file === '.okf/index.md' && /okf index/.test(f.message)),
    'the reserved lowercase name is where okf_version lives'
  );
});

test('the regenerated index carries okf_version', (root) => {
  writeIndex(root, { today: '2026-07-30' });
  assert.match(readF(root, '.okf/index.md'), /okf_version/, 'the bundle declares the version it targets');
});

test('an index without okf_version is caught', (root) => {
  edit(root, '.okf/index.md', (t) => t.replace(/^---[\s\S]*?---\n/, ''));
  assertError(check(root), /okf_version/, 'a bundle that declares no version cannot be read safely');
});

test('the index Features table reads verification_state', (root) => {
  write(root, AUTH, okfEntry('user-auth'));
  writeIndex(root, { today: '2026-07-30' });
  assert.match(readF(root, '.okf/index.md'), /\| verified \|/, 'the table mirrors the renamed field');
});

// --- the generated log --------------------------------------------------------

test('the generated log lists the newest date first', (root) => {
  edit(root, AUTH, (t) => t + `
# Verification History

| Date | Change | Verified Status | Evidence / Notes |
| --- | --- | --- | --- |
| 2026-07-30 | add-mfa | verified | BR-1 traced to src/auth.js:12 |
| 2026-08-01 | add-sso | verified | BR-2 traced to src/sso.js:40 |
`);
  writeIndex(root, { today: '2026-08-01' });
  const log = readF(root, '.okf/log.md');
  assert.ok(log.indexOf('2026-08-01') < log.indexOf('2026-07-30'), 'newest first');
});

test('a log with no verification history is still written', (root) => {
  write(root, AUTH, okfEntry('user-auth'));
  writeIndex(root, { today: '2026-07-30' });
  assert.ok(fs.existsSync(path.join(root, '.okf', 'log.md')), 'an empty log is still a log');
});

// --- the audit selects by verification_state ----------------------------------

auditTest('a verified entry with no attestation is still audited', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-01');
  write(root, AUTH, okfEntry('user-auth', { verifiedAt: '2026-07-20', attestations: null, codePaths: ['src/**'] }));
  const r = byName(audit(root), 'user-auth');
  assert.ok(r, 'the entry must appear in the results');
  assert.equal(r.verdict, 'current', 'a migrated entry is verified by the workflow');
});

auditTest('needs-revision is skipped by the audit', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-25');
  write(root, AUTH, okfEntry('user-auth', { verificationState: 'needs-revision', attestations: null, verifiedAt: '2026-07-01', codePaths: ['src/**'] }));
  const r = byName(audit(root), 'user-auth');
  assert.equal(r.verdict, 'skipped', 'okf check already surfaces it');
  assert.match(r.note, /needs-revision/, 'and it is skipped for that reason, not for a missing field');
});

auditTest('a deprecated entry stays skipped under the new status vocabulary', ({ root, commit }) => {
  commit('src/auth.js', 'v1\n', '2026-07-25');
  write(root, AUTH, okfEntry('user-auth', { status: 'deprecated', verifiedAt: '2026-07-01', codePaths: ['src/**'] }));
  const r = byName(audit(root), 'user-auth');
  assert.equal(r.verdict, 'skipped', 'deprecated code is expected to diverge');
  assert.match(r.note, /deprecated/, 'and it is skipped for that reason');
});

// --- migration ----------------------------------------------------------------

test('migrate moves a verified entry without writing an attestation', (root) => {
  write(root, AUTH, legacyEntry('user-auth'));
  migrate(root);
  const text = readF(root, AUTH);
  assert.match(text, /^verification_state: verified$/m, 'the workflow state is preserved');
  assert.match(text, /^verified_at: 2026-07-30$/m, 'the date is preserved');
  assert.equal(/^verified:/m.test(text), false, 'migration must not invent who vouched for it');
});

test('migrate moves an unverified entry', (root) => {
  write(root, AUTH, legacyEntry('user-auth', { verified: 'unverified' }));
  migrate(root);
  const text = readF(root, AUTH);
  assert.match(text, /^verification_state: unverified$/m);
  assert.equal(/^verified:/m.test(text), false);
});

test('migrate run twice writes nothing the second time', (root) => {
  write(root, AUTH, legacyEntry('user-auth'));
  migrate(root);
  const after = readF(root, AUTH);
  const res = migrate(root);
  assert.equal(readF(root, AUTH), after, 'a second run must be a no-op');
  assert.deepEqual(res.rewritten, [], 'and must report nothing rewritten');
});

test('migrate rewrites only the entries still on the old shape', (root) => {
  write(root, AUTH, legacyEntry('user-auth'));
  write(root, '.okf/features/billing.md', okfEntry('billing'));
  const before = readF(root, '.okf/features/billing.md');
  const res = migrate(root);
  assert.equal(readF(root, '.okf/features/billing.md'), before, 'a current entry is left alone');
  assert.equal(res.rewritten.length, 1, 'only the old-shape entry is rewritten');
});

test('migrate leaves the body and unrelated keys byte-identical', (root) => {
  write(root, AUTH, legacyEntry('user-auth'));
  const bodyBefore = readF(root, AUTH).split('---\n')[2];
  migrate(root);
  const text = readF(root, AUTH);
  assert.equal(text.split('---\n')[2], bodyBefore, 'the body is not the migration target');
  assert.match(text, /^criticality: normal$/m, 'unrelated keys survive');
  assert.match(text, /^code_paths: \[src\/\*\*\]$/m, 'unrelated keys survive');
});

test('migrate leaves an unparseable entry untouched and reports it', (root) => {
  write(root, AUTH, 'no frontmatter here at all\n');
  const res = migrate(root);
  assert.equal(readF(root, AUTH), 'no frontmatter here at all\n', 'a file we cannot read is not rewritten');
  assert.deepEqual(res.unparseable, [AUTH], 'and it is reported rather than skipped silently');
});

test('migrate on a bundle with no features directory reports nothing to do', (root) => {
  fs.rmSync(path.join(root, '.okf', 'features'), { recursive: true, force: true });
  const res = migrate(root);
  assert.deepEqual(res.rewritten, [], 'nothing to migrate is not an error');
});

// --- integration: the CLI, the payload boundary, and the committed layout ----

const okf = (root, ...args) => {
  try {
    return {
      code: 0,
      out: execFileSync('node', [path.join(KIT, 'bin/okf.mjs'), ...args, '--root', root], { encoding: 'utf8' }),
    };
  } catch (err) {
    return { code: err.status, out: `${err.stdout ?? ''}${err.stderr ?? ''}` };
  }
};

const hashTree = (root, rel) => {
  const dir = path.join(root, rel);
  if (!fs.existsSync(dir)) return {};
  return Object.fromEntries(
    fs
      .readdirSync(dir)
      .sort()
      .map((f) => [f, crypto.createHash('sha256').update(fs.readFileSync(path.join(dir, f))).digest('hex')])
  );
};

projectTest('upgrade writes nothing under features or decisions', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  write(root, '.okf/features/user-auth.md', legacyEntry('user-auth'));
  write(root, '.okf/decisions/2026-07-30-a-decision.md', '---\ntype: Decision\ntitle: a\nstatus: accepted\n---\n\nOurs.\n');

  const before = { f: hashTree(root, '.okf/features'), d: hashTree(root, '.okf/decisions') };
  install(KIT, root, KIT_VERSION, { mode: 'upgrade', force: true });

  assert.deepEqual(hashTree(root, '.okf/features'), before.f, 'entries are project-owned, even under --force');
  assert.deepEqual(hashTree(root, '.okf/decisions'), before.d, 'so are decisions');
});

projectTest('migrate then check exits clean', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  write(root, '.okf/features/user-auth.md', legacyEntry('user-auth'));

  assert.equal(okf(root, 'migrate').code, 0, 'migration itself must succeed');
  okf(root, 'index');

  const res = okf(root, 'check');
  assert.equal(res.code, 0, `a migrated bundle must not be blocked:\n${res.out}`);
  assert.match(res.out, /carries no attestation/, 'the missing attestation is reported as a warning');
  assert.match(res.out, /0 error/, 'and never as an error');
});

projectTest('migrate reports every file it touched', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  for (const name of ['user-auth', 'billing', 'search']) {
    write(root, `.okf/features/${name}.md`, legacyEntry(name));
  }

  const res = okf(root, 'migrate');
  for (const name of ['user-auth', 'billing', 'search']) {
    assert.match(res.out, new RegExp(`\\.okf/features/${name}\\.md`), `${name} must be named in the report`);
  }
  assert.match(res.out, /3 rewritten/);
});

projectTest('templates named .md.tmpl are not concept documents', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  writeIndex(root, { today: '2026-07-30' });

  const findings = check(root, { kitVersion: KIT_VERSION }).findings.filter((f) => /templates/.test(f.file));
  assert.deepEqual(findings, [], 'a template is not knowledge, and must not be read as a concept');
  assert.ok(fs.existsSync(path.join(root, '.okf/templates/feature.md.tmpl')), 'the template still ships');
});

projectTest("the profile document names the kit's divergences", (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  const text = readF(root, '.okf/profile.md');

  for (const key of ['verification_state', 'verified_at', 'criticality', 'pending_changes', 'code_paths', 'decision_status']) {
    assert.match(text, new RegExp(`\`${key}\``), `the profile must name the kit key ${key}`);
  }
  assert.match(text, /v0\.2/, 'the targeted specification version must be stated');
  assert.match(text, /not proven genuine|does not claim/i, 'the limit of the human-review check must be stated');
});

/**
 * The same dogfooding the uppercase-path guard above does, for the same reason:
 * the rule is only worth shipping if the bundle that defines it obeys it. A
 * failure here means the shape classifier is wrong, not that the bundle is.
 */
projectTest('no bundle file in this repo carries a locator', () => {
  const report = check(KIT);
  const hits = report.findings.filter((f) => /renamed at archive time|still a location/.test(f.message));

  assert.deepEqual(
    hits.map((f) => `${f.file}: ${f.message}`),
    [],
    'every openspec/changes mention in this bundle must be mechanism prose'
  );
});

auditTest('the bundle index is committed at a lowercase path', ({ root, git, commit }) => {
  commit('.okf/index.md', '---\nokf_version: "0.2"\n---\n\n# OKF Index\n', '2026-07-30');
  const tracked = git(['ls-files', '.okf']).split('\n').filter(Boolean);

  assert.ok(tracked.includes('.okf/index.md'), `the reserved name is lowercase, got: ${tracked.join(', ')}`);
  assert.equal(
    tracked.some((f) => f === '.okf/INDEX.md'),
    false,
    'the uppercase path must not survive - on a case-insensitive filesystem a one-step rename records nothing'
  );
});

// ---------------------------------------------------------------------------
// okf next - what a change still owes under .okf/
// Rules: .okf/features/okf-next.md (BR-1..BR-6).
// ---------------------------------------------------------------------------

/**
 * Every path under `root` with its mtime. Compared before and after a call to
 * prove the command wrote nothing (UT-308 / BR-1).
 */
function treeSnapshot(root) {
  const out = new Map();
  const walk = (dir) => {
    for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else out.set(path.relative(root, abs), fs.statSync(abs).mtimeMs);
    }
  };
  walk(root);
  return out;
}

const owesVerification = (result) =>
  result.owed.some((s) => /verification/i.test(s.step) || /pending/i.test(s.step) || /evidence/i.test(s.step));

test('UT-301 an entry still listing the change reports the verification pass', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - add-mfa')
  );
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true, 'the question is answerable');
  assert.ok(owesVerification(result), 'pending_changes must produce an owed verification step');
  assert.ok(
    result.owed.every((s) => typeof s.command === 'string' && s.command.trim()),
    'every owed step must name a command (BR-4)'
  );
});

test('UT-302 a missing verification.md is reported as owed', (root) => {
  fs.rmSync(path.join(root, CHANGE, 'verification.md'));
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true);
  assert.ok(
    result.owed.some((s) => /verification\.md/i.test(s.step) || /verification/i.test(s.step)),
    'an absent verification.md is an owed step, not silence'
  );
});

test('UT-303 an empty Rule Evidence table is reported as owed', (root) => {
  edit(root, `${CHANGE}/verification.md`, (t) =>
    t.replace('| BR-1 | user-auth | src/auth/mfa.ts:42 | match | none |\n| BR-2 | user-auth | src/auth/admin.ts:17 | match | none |\n', '')
  );
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true);
  assert.ok(
    result.owed.some((s) => /evidence/i.test(s.step) || /Rule Evidence/i.test(s.step)),
    'an empty Rule Evidence table must be reported - existence of the file is not enough'
  );
});

test('UT-304 a finished change states that nothing is owed and names the gate', (root) => {
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true);
  assert.equal(result.owed.length, 0, 'the clean fixture owes nothing');
  assert.match(
    String(result.statement ?? ''),
    /nothing.*owed/i,
    'owing nothing must be stated, not implied by an empty list (BR-6)'
  );
  assert.match(String(result.statement ?? ''), /okf check --archive/, 'the real gate must be named (BR-6)');
});

test('UT-305 a change with no okf-link names openspec status', (root) => {
  fs.rmSync(path.join(root, CHANGE, 'okf-link.md'));
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true);
  const text = JSON.stringify(result);
  assert.match(text, /openspec status/, 'the artifact half is named, never re-derived (BR-2)');
  assert.equal(
    /proposal|design\.md|test-cases|test-plan|tasks\.md/i.test(text) &&
      /missing|owed|enumerate/i.test(text),
    false,
    'must not list missing OpenSpec artifacts'
  );
});

test('UT-306 the implementation holds no artifact ordering', (root) => {
  const p = path.join(KIT, 'lib/next.mjs');
  if (!fs.existsSync(p)) {
    void root;
    return;
  }
  const src = fs.readFileSync(p, 'utf8');
  // An ordered list of OpenSpec artifact ids would reimplement what openspec status owns.
  const ordering =
    /\[\s*['"]okf-link['"]\s*,\s*['"]proposal['"]|ARTIFACTS\s*=\s*\[|artifactOrder|nextArtifact/i;
  assert.equal(ordering.test(src), false, 'lib/next.mjs must not hold an OpenSpec artifact order (BR-2)');
  void root;
});

test('UT-307 every owed step carries a command', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - add-mfa')
  );
  fs.rmSync(path.join(root, CHANGE, 'verification.md'));
  const result = next(root, 'add-mfa');
  assert.ok(result.owed.length >= 1, 'the fixture must owe at least one step');
  for (const step of result.owed) {
    assert.equal(typeof step.step, 'string');
    assert.ok(step.command && String(step.command).trim(), `step "${step.step}" has no command (BR-4)`);
  }
});

test('UT-308 the command creates nothing and spawns nothing', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - add-mfa')
  );
  const before = treeSnapshot(root);
  next(root, 'add-mfa');
  const after = treeSnapshot(root);
  assert.deepEqual([...after.entries()], [...before.entries()], 'next must not create or modify any file (BR-1)');

  const src = readF(KIT, 'lib/next.mjs');
  assert.equal(
    /child_process|execSync|execFileSync|spawnSync|\bspawn\(|\bexec\(/.test(src),
    false,
    'lib/next.mjs must not reach for a subprocess (BR-1)'
  );
});

test('UT-309 owed steps still return normally', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - add-mfa')
  );
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true, 'owed steps are advice, not failure (BR-5)');
  assert.ok(result.owed.length >= 1);
});

test('UT-310 a no-domain-knowledge change still owes its verification pass', (root) => {
  declareNoDomainKnowledge(root);
  fs.rmSync(path.join(root, CHANGE, 'verification.md'));
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true);
  assert.ok(
    owesVerification(result),
    'no domain knowledge does not waive the verification pass (BR-3)'
  );
});

test('UT-311 a change the archive gate accepts reports nothing owed', (root) => {
  const report = check(root, ARCHIVE);
  assert.equal(report.errors.length, 0, 'precondition: the archive gate must accept the fixture');
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true);
  assert.equal(result.owed.length, 0, 'advisor and gate must agree (BR-3)');
});

test('NEG-301 a fully ticked checklist does not discharge a pending entry', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('pending_changes: []', 'pending_changes:\n  - add-mfa')
  );
  // A verification whose Archive Readiness is fully ticked is still not derivation.
  edit(root, `${CHANGE}/verification.md`, (t) =>
    t +
      '\n# Archive Readiness\n\n- [x] Rule Evidence filled\n- [x] pending_changes cleared\n- [x] decisions promoted\n'
  );
  const result = next(root, 'add-mfa');
  assert.ok(owesVerification(result), 'a checkbox is not derivation (BR-3)');
});

test('NEG-302 an unknown change id is an argument error', (root) => {
  const result = next(root, 'does-not-exist');
  assert.equal(result.answered, false, 'an unknown id is not an empty owed list');
  assert.match(String(result.error ?? ''), /does-not-exist|no such|unknown|not found/i);
  assert.equal(result.owed.length, 0);
});

test('NEG-303 an archived change id is an argument error', (root) => {
  write(root, 'openspec/changes/archive/2026-01-01-old-change/proposal.md', '## Why\n\nArchived.\n');
  const result = next(root, 'old-change');
  assert.equal(result.answered, false, 'next advises on active work, not the archive');
  assert.match(String(result.error ?? ''), /archiv|active|old-change/i);
});

test('NEG-304 unresolvable okf-link rows are reported, not treated as clean', (root) => {
  edit(root, `${CHANGE}/okf-link.md`, (t) =>
    t.replace('`.okf/features/user-auth.md`', '`.okf/features/missing-capability.md`')
  );
  const result = next(root, 'add-mfa');
  assert.equal(result.answered, true);
  assert.ok(result.owed.length >= 1, 'unresolvable rows are an obligation, not a clean slate (BR-3)');
});

test('NEG-305 no argument prints usage', (root) => {
  const res = okf(root, 'next');
  assert.equal(res.code, 2, 'missing argument is bad usage');
  assert.match(res.out, /Usage:|okf next/i);
});

// ---------------------------------------------------------------------------
// Entry scope filter and the ask/cite rule.
// Rules: .okf/features/okf-bundle-format.md (BR-14..BR-17).
// ---------------------------------------------------------------------------

/**
 * One artifact's instruction slice from the schema. Anchored at line start so a
 * bare indexOf on the next id cannot match the same words inside earlier prose -
 * that already sliced backwards once (see UT-110's note on `apply:`).
 */
function instructionFor(schema, artifactId) {
  const start = schema.search(new RegExp(`^  - id: ${artifactId}\\b`, 'm'));
  assert.ok(start !== -1, `schema has no artifact "${artifactId}"`);
  const after = schema.slice(start + 1);
  const next = after.search(/^  - id: |^apply:/m);
  return next === -1 ? schema.slice(start) : schema.slice(start, start + 1 + next);
}

/** The okf-kit addendum body between the versioned markers. */
function okfKitBlock(text) {
  const m = /<!-- okf-kit:start[^\n]*-->\n([\s\S]*?)<!-- okf-kit:end -->/.exec(text);
  assert.ok(m, 'file is missing an okf-kit block');
  return m[1];
}

test('UT-501 the okf-link instruction names what does not belong in an entry', () => {
  const text = instructionFor(readF(KIT, SCHEMA), 'okf-link');
  assert.match(
    text,
    /validation message|form(?:'s)? layout|payload|endpoint/i,
    'the filter must name content that does not belong'
  );
  assert.match(
    text,
    /belong(?:s)? (?:in|to) (?:the )?(?:spec|design)|to the spec|to the design/i,
    'every excluded category must name its destination'
  );
});

test('UT-502 the durability test asks about a second change, not about truth', () => {
  const text = instructionFor(readF(KIT, SCHEMA), 'okf-link');
  assert.match(
    text,
    /second change/i,
    'the durability test is a question about a second change'
  );
  assert.match(
    text,
    /(?:still )?need|would .{0,40}need/i,
    'the question is whether the next change would still need the content'
  );
  assert.match(
    text,
    /not whether it is (?:true|correct)|rather than .{0,40}(?:true|correct|truth)/i,
    'truth is what makes the wrong content hard to argue with - the test must reject it'
  );
});

test('UT-503 the feature template carries the same filter', () => {
  const tmpl = readF(KIT, '.okf/templates/feature.md.tmpl');
  const header = tmpl.slice(0, tmpl.indexOf('# Summary'));
  assert.match(
    header,
    /validation message|form(?:'s)? layout|payload|endpoint|change-local|does not belong/i,
    'an agent creating an entry reads the template, not the schema'
  );
  assert.match(
    header,
    /second change|still need|outlives the change/i,
    'the durability test must travel with the filter'
  );
});

test('UT-504 the verification section review directs removal of change-local detail', () => {
  const text = instructionFor(readF(KIT, SCHEMA), 'verification');
  // Scope to the section-review step: "change-local" already appears later in
  // Decision Promotion, and "remove" appears for pending_changes - neither is
  // the filter.
  const review = /Review the entry's[\s\S]*?(?=\n\s*\d+\.\s)/.exec(text);
  assert.ok(review, 'the section-review step must still be present');
  assert.match(
    review[0],
    /change-local|leaked|not durable|does not belong|outlives/i,
    'the section review must name the content to remove'
  );
  assert.match(
    review[0],
    /remov(?:e|al)|strip|delete|drop/i,
    'correcting staleness alone leaves the leak in place'
  );
});

test('UT-505 the proposal instruction says a question the entry answers is not asked', () => {
  const text = instructionFor(readF(KIT, SCHEMA), 'proposal');
  assert.match(
    text,
    /(?:do )?not ask|MUST NOT ask|never ask|without asking|cite .{0,40}(?:rather|instead)/i,
    'reading the entry must have a consequence - the question is not re-asked'
  );
  assert.match(
    text,
    /already (?:answers|answered)|entry (?:already )?answers|what the entry/i,
    'the rule is about what the entry already answers, not a blanket ban on questions'
  );
});

test('UT-506 the same instruction names Assumptions and Open Questions as what generates a question', () => {
  const text = instructionFor(readF(KIT, SCHEMA), 'proposal');
  // The instruction already mentions those headings as places to write into.
  // BR-17 is the other direction: they are what a question comes FROM.
  assert.match(
    text,
    /Assumptions.{0,120}Open Questions|Open Questions.{0,120}Assumptions/is,
    'both halves must be named together'
  );
  assert.match(
    text,
    /generat(?:e|es|ing) a question|what (?:a |the )?question|ask .{0,80}(?:Assumption|Open Question)|(?:Assumption|Open Question).{0,80}ask/i,
    'shipping BR-16 alone produces assuming instead of asking'
  );
});

test('UT-507 the addendum carries the rule and is identical in both marker files', () => {
  const agents = okfKitBlock(readF(KIT, 'AGENTS.md'));
  const claude = okfKitBlock(readF(KIT, 'CLAUDE.md'));
  assert.equal(agents, claude, 'the two marker files must stay byte-identical');
  // "do not ask again until a different capability" is already present and is
  // not BR-16 - require the cite/answered half so a rewording of the decline
  // branch cannot satisfy this.
  assert.match(
    agents,
    /(?:already answers|entry answers|what the entry)|cite .{0,60}(?:BR-|rule id|rather|instead)/i,
    'the addendum must carry BR-16'
  );
  assert.match(
    agents,
    /Assumptions/i,
    'the addendum must carry BR-17 alongside it'
  );
  assert.match(
    agents,
    /Open Questions/i,
    'Assumptions without Open Questions is only half the rule'
  );
});

test('UT-508 the clean fixture produces the same findings as before', (root) => {
  // Captured before this change: the clean fixture archives with zero findings.
  // This change ships no check, so that count must stay at zero - the claim that
  // makes "adds no check" a test rather than an intention.
  const report = check(root, ARCHIVE);
  assert.equal(
    report.findings.length,
    0,
    'the clean fixture finding count must stay at zero - a new finding here means a check was added'
  );
});

// ---------------------------------------------------------------------------
// What a test-case matrix was asked to consider: the named boundary classes,
// the four render states, and where an inspectable artefact lands.
// Rules: .okf/features/test-first-gate.md (BR-13..BR-16).
// ---------------------------------------------------------------------------

const CASES_TPL = 'openspec/schemas/okf-gated-feature/templates/test-cases.md';
const CASES = `${CHANGE}/test-cases.md`;

/** The six classes BR-13 names, in the order the proposal lists them. */
const CLASSES = ['Absence', 'Numeric edge', 'Duplication', 'Staleness', 'Authorisation', 'Scope isolation'];

/** Text from a `# Heading` up to the next one. */
function sectionOf(text, heading) {
  const lines = text.split('\n');
  const start = lines.findIndex((l) => l.trim() === `# ${heading}`);
  assert.ok(start !== -1, `the template must still have a "${heading}" section`);
  const rest = lines.slice(start + 1);
  const end = rest.findIndex((l) => /^#\s/.test(l.trim()));
  return (end === -1 ? rest : rest.slice(0, end)).join('\n');
}

/** Body rows of the table under a `# Heading`; header and separator dropped. */
function tableRowsOf(text, heading) {
  const rows = [];
  let seenHeader = false;
  for (const raw of sectionOf(text, heading).split('\n')) {
    const line = raw.trim();
    if (!line.startsWith('|')) continue;
    if (/^\|[\s|:-]+\|?$/.test(line) && line.includes('-')) continue;
    if (!seenHeader) {
      seenHeader = true;
      continue;
    }
    rows.push(line.split('|').slice(1, -1).map((c) => c.trim()));
  }
  return rows;
}

const BOUNDARY_COLUMNS = [
  '| Class | ID | Priority | Scenario | Expected Result | Source |',
  '| --- | --- | --- | --- | --- | --- |',
];

/**
 * Rewrite the fixture's Negative And Boundary Cases section. `rows` are body
 * rows only; the empty list is the state BR-13 is about. The replace asserts it
 * matched, or a test would assert against residue it never wrote.
 */
function setBoundaryTable(root, rows) {
  edit(root, CASES, (t) => {
    const next = t.replace(
      /# Negative And Boundary Cases\n[\s\S]*$/,
      ['# Negative And Boundary Cases', '', ...BOUNDARY_COLUMNS, ...rows, ''].join('\n')
    );
    assert.notEqual(next, t, 'setBoundaryTable matched nothing - the fixture no longer has the section it edits');
    return next;
  });
}

const BOUNDARY = /Negative And Boundary Cases table has no rows/;

/** Findings about the boundary table, at any level. */
const boundaryFindings = (report) =>
  report.findings.filter((f) => BOUNDARY.test(f.message)).map((f) => `[${f.level}] ${f.message}`);

test('UT-401 the test-cases template seeds one row per boundary class', () => {
  const tpl = readF(KIT, CASES_TPL);
  const header = tableHeader(tpl, 'Negative And Boundary Cases');
  assert.ok(
    header.some((c) => /^class$/i.test(c)),
    'without a column of its own a class is a comment again, and a comment is read once and scrolled past'
  );
  const seeded = tableRowsOf(tpl, 'Negative And Boundary Cases').map((cells) => cells[0].toLowerCase());
  for (const cls of CLASSES) {
    assert.ok(
      seeded.includes(cls.toLowerCase()),
      `the template seeds no row for "${cls}" - an author is only prompted by the classes named here`
    );
  }
});

test('UT-402 the test-cases instruction says discharge rather than delete', () => {
  const rule = instructionFor(readF(KIT, SCHEMA), 'test-cases');
  for (const cls of CLASSES) {
    assert.match(rule, new RegExp(cls.replace(' ', '\\s+'), 'i'), `the instruction never names the "${cls}" class`);
  }
  assert.match(
    rule,
    /discharg\w*\s+with\s+a\s+stated\s+reason/i,
    'the instruction must say how an untouched class is answered for'
  );
  assert.match(
    rule,
    /(rather than|not by|never by|instead of)\s+delet/i,
    '"this feature has no tenant boundary" must read differently from "nobody considered tenants"'
  );
});

test('UT-403 the browser section names four render states and the console question', () => {
  const section = sectionOf(readF(KIT, CASES_TPL), 'Browser E2E Scenarios');
  for (const state of ['loading', 'error', 'empty', 'populated']) {
    assert.match(
      section,
      new RegExp(`\\b${state}\\b`, 'i'),
      `the browser section never names the ${state} state - three of the four are what an author never sees`
    );
  }
  assert.match(
    section,
    /console/i,
    'an interface that reports failure only to the console has failed silently to the user'
  );
});

test('UT-404 the test-plan and verification templates carry an Artifacts column', () => {
  const artifacts = (cells) => cells.some((c) => /^artifacts$/i.test(c));
  assert.ok(
    artifacts(tableHeader(readF(KIT, TESTPLAN_TPL), 'E2E Tests')),
    'the plan is where a test says what it will produce'
  );
  assert.ok(
    artifacts(tableHeader(readF(KIT, VERIFY_TPL), 'Browser E2E Tests')),
    'adding it to one template only leaves the artefact planned and never located'
  );
});

test('UT-405 an empty boundary table warns while specs hold scenarios', (root) => {
  setBoundaryTable(root, []);
  const hits = check(root, ARCHIVE).findings.filter((f) => BOUNDARY.test(f.message));
  assert.equal(
    hits.length,
    1,
    'an empty table records that nobody was asked to think of any boundary class (BR-13)'
  );
  assert.equal(
    hits[0].level,
    'warn',
    'whether six classes were genuinely considered is not observable, so the checker must never error on it'
  );
});

test('UT-406 a filled boundary table is silent', (root) => {
  setBoundaryTable(root, ['| Duplication | NEG-002 | should | The same factor is submitted twice | the second submission is ignored | BR-1 |']);
  assert.deepEqual(
    boundaryFindings(check(root, ARCHIVE)),
    [],
    'the check notices total silence and nothing else'
  );
});

test('UT-407 no shipped template names a browser-automation tool', () => {
  const tool = /\b(playwright|cypress|puppeteer|selenium|webdriver|chromedriver|testcafe|nightwatch)\b/i;
  const dir = path.join(SCHEMA_DIR, 'templates');
  const offenders = [];
  for (const name of fs.readdirSync(dir).filter((n) => n.endsWith('.md'))) {
    for (const line of fs.readFileSync(path.join(dir, name), 'utf8').split('\n')) {
      if (tool.test(line)) offenders.push(`${name}: ${line.trim()}`);
    }
  }
  assert.deepEqual(offenders, [], 'BR-16 asks where the artefact lands, not what produced it');
});

test('UT-408 a change with no interface discharges the class cleanly', (root) => {
  edit(root, CASES, (t) =>
    `${t}\n# Not Applicable\n\n| Area | Reason | Approved By |\n| --- | --- | --- |\n` +
      '| Browser E2E, and the four render states | this change ships no user interface of any kind | change author |\n'
  );
  assert.deepEqual(
    boundaryFindings(check(root, ARCHIVE)),
    [],
    'a class discharged with a stated reason is the mechanism working, not a gap (BR-14, BR-15)'
  );
});

test('NEG-401 a boundary table holding only a blank row counts as empty', (root) => {
  setBoundaryTable(root, ['|  |  |  |  |  |  |']);
  assert.equal(
    boundaryFindings(check(root, ARCHIVE)).length,
    1,
    'the template ships a blank row, so counting it as a row makes the warning unreachable'
  );
});

test('NEG-402 two rows for one class are both accepted', (root) => {
  setBoundaryTable(root, [
    '| Absence | NEG-003 | must | No factor at all | the session is refused | BR-1 |',
    '| Absence | NEG-004 | should | An empty factor string | the session is refused | BR-1 |',
  ]);
  assert.deepEqual(
    boundaryFindings(check(root, ARCHIVE)),
    [],
    'the check counts rows and never classes - counting classes would require judging what a class is'
  );
});

// ---------------------------------------------------------------------------

for (const name of todos) console.log(`TODO  ${name}`);

if (failures.length) {
  for (const { name, err } of failures) {
    console.error(`\nFAIL  ${name}\n${err.message}`);
  }
  console.error(`\n${passed} passed, ${failures.length} failed${todos.length ? `, ${todos.length} todo` : ''}`);
  process.exit(1);
}
console.log(`${passed} passed${todos.length ? `, ${todos.length} todo` : ''}`);
