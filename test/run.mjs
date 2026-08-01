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

const KIT = path.resolve(import.meta.dirname, '..');

let passed = 0;
const failures = [];

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

| Test Case ID | Rule (BR-n) | Test File | Test Name | Initial Status | Notes |
| --- | --- | --- | --- | --- | --- |
| UT-001 | BR-1 | src/auth/mfa.test.ts | refuses admin without mfa | failing: expected 403, got 200 | - |

# E2E Tests

| Test Case ID | Test File | Test Name | Status | Notes |
| --- | --- | --- | --- | --- |
| API-E2E-001 | e2e/signin.spec.ts | admin sign-in | passing | - |

# Known Gaps

| Test Case ID | Status Left At | Reason | Owner | Follow-Up |
| --- | --- | --- | --- | --- |
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

test('E2E-001 a promotion warning alone exits 0 and reports ready to archive', (root) => {
  setPromotion(root, ['| Verify the second factor first | - | change-local: sequencing only |']);
  const out = execFileSync('node', [path.join(KIT, 'bin/okf.mjs'), 'check', '--archive', 'add-mfa', '--root', root], {
    encoding: 'utf8',
  });
  // execFileSync throws on a non-zero exit, so reaching here is the exit-0 assertion.
  assert.match(out, /okf check: 0 error\(s\), 1 warning\(s\)/, 'the only finding must be the warning');
  assert.match(out, /ready to archive/, 'a warning must not block the archive');
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
  write(root, '.okf/INDEX.md', 'our index\n');

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
  const install = /openspec#v([\d.]+)/.exec(readme);
  assert.ok(install, 'README has no versioned install command');
  assert.equal(install[1], pkg, `README installs v${install?.[1]}, package.json says ${pkg}`);
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
  fs.rmSync(path.join(root, '.okf', 'INDEX.md'), { force: true });
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

if (failures.length) {
  for (const { name, err } of failures) {
    console.error(`\nFAIL  ${name}\n${err.message}`);
  }
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
