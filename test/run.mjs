/**
 * Fixture tests for `okf check` and `okf index`. No dependencies: build a tiny
 * repo in a temp dir, break one thing at a time, assert the right finding fires.
 *
 * Run with `npm test` or `node test/run.mjs`.
 */
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

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
    resource: docs/M7-PRD.md
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

if (failures.length) {
  for (const { name, err } of failures) {
    console.error(`\nFAIL  ${name}\n${err.message}`);
  }
  console.error(`\n${passed} passed, ${failures.length} failed`);
  process.exit(1);
}
console.log(`${passed} passed`);
