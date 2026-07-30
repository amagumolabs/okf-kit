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
status: active
verified: verified
verified_at: 2026-07-30
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
  by: test
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
`;

function scaffold(root) {
  fs.mkdirSync(path.join(root, '.okf', 'features'), { recursive: true });
  fs.mkdirSync(path.join(root, '.okf', 'decisions'), { recursive: true });
  fs.copyFileSync(path.join(KIT, 'openspec', 'config.yaml'), pathEnsure(root, 'openspec/config.yaml'));

  write(root, 'docs/prd.md', '# PRD\n\nAdmin accounts need a second factor.\n');
  write(root, '.okf/features/user-auth.md', ENTRY);
  write(root, 'openspec/changes/add-mfa/okf-link.md', OKF_LINK);
  write(root, 'openspec/changes/add-mfa/proposal.md', PROPOSAL);
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
  edit(root, '.okf/INDEX.md', (t) => t.replace(/\| \[user-auth\].*\n/, ''));
  assertError(check(root), /does not list "user-auth"/, 'a stale index must be reported');
});

test('needs-revision without a ledger row is caught', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('verified: verified', 'verified: needs-revision'));
  // index intentionally not regenerated
  assertError(check(root), /no Needs Revision Ledger row/, 'debt must be visible');
});

test('needs-revision older than 30 days is an error', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) =>
    t.replace('verified: verified', 'verified: needs-revision').replace('verified_at: 2026-07-30', 'verified_at: 2020-01-01')
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
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('verified: verified', 'verified: unverified'));
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

test('okf index is idempotent and detects staleness', (root) => {
  const first = buildIndex(root, { today: '2026-07-30' });
  const second = buildIndex(root, { today: '2026-07-30' });
  assert.equal(first, second, 'generation must be deterministic');
  assert.equal(first, readF(root, '.okf/INDEX.md'), 'scaffold wrote the generated form');
  assert.match(first, /\| \[user-auth\]\(features\/user-auth\.md\) \| verified \| 2026-07-30 \| - \| high \| active \|/);
});

test('okf index keeps hand-written ledger notes across regeneration', (root) => {
  edit(root, '.okf/features/user-auth.md', (t) => t.replace('verified: verified', 'verified: needs-revision'));
  writeIndex(root, { today: '2026-07-30' });
  edit(root, '.okf/INDEX.md', (t) =>
    t.replace(/\| user-auth \| 2026-07-30 \| add-mfa \| - \|/, '| user-auth | 2026-07-30 | add-mfa | decide if MFA applies to service accounts |')
  );
  writeIndex(root, { today: '2026-08-15' });
  const text = readF(root, '.okf/INDEX.md');
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
    '.okf/templates/feature.template.md',
    '.okf/templates/decision.template.md',
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
  write(root, '.okf/templates/feature.template.md', 'old kit content\n');
  const manifest = JSON.parse(readF(root, '.okf/.okf-kit.json'));
  manifest.files['.okf/templates/feature.template.md'] = crypto
    .createHash('sha256')
    .update('old kit content\n')
    .digest('hex');
  write(root, '.okf/.okf-kit.json', JSON.stringify(manifest, null, 2));

  const res = install(KIT, root, KIT_VERSION, { mode: 'upgrade' });
  const acted = res.actions.find((a) => a.rel === '.okf/templates/feature.template.md');
  assert.equal(acted.action, 'update');
  assert.match(readF(root, '.okf/templates/feature.template.md'), /HOW TO USE THIS TEMPLATE/);
});

projectTest('upgrade leaves a locally edited kit file alone', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  const target = '.okf/templates/feature.template.md';
  write(root, target, 'our team rewrote this template\n');

  const res = install(KIT, root, KIT_VERSION, { mode: 'upgrade' });
  const acted = res.actions.find((a) => a.rel === target);
  assert.equal(acted.action, 'skip-modified', 'a team edit must not be silently clobbered');
  assert.equal(readF(root, target), 'our team rewrote this template\n');
});

projectTest('upgrade --force overwrites a locally edited kit file', (root) => {
  install(KIT, root, KIT_VERSION, { mode: 'init' });
  const target = '.okf/templates/feature.template.md';
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
  assert.equal(readF(root, '.okf/INDEX.md'), 'our index\n', 'INDEX.md is generated, not installed');
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

function entry(name, { verified = 'verified', verifiedAt = '2026-07-20', status = 'active', codePaths = [] } = {}) {
  return `---
type: Feature Knowledge
title: ${name}
description: Test entry for the audit.
status: ${status}
verified: ${verified}
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

if (failures.length) {
  for (const { name, err } of failures) {
    console.error(`\nFAIL  ${name}\n${err.message}`);
  }
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
