# Magnolia 7 (M7) Frontend Platform — Product Requirements Document

| | |
|---|---|
| **Version** | 2.0 |
| **Status** | Draft for Architecture Review |
| **Owner** | Frontend Framework Guild |
| **Date** | July 2026 |
| **Methodology** | Compiled using the BMAD PM Agent (John) PRD structure |
| **Sources merged** | M7 PRD v1.0 · Frontend Framework Guild charter · Frontend Implementation Conventions decision log (Feb–Jun 2026) |

---

## Change Log

| Date | Version | Change |
|---|---|---|
| 2026-05 (approx.) | 1.0 | Initial PRD draft (vision, scope, architecture overview) |
| 2026-07 | 2.0 | Merged Guild charter + 5 months of implementation decisions; converted open backlog items (FF-55/56, FF-13, FF-86…) into scoped Epics/Stories; added explicit auth, env, i18n, state, and real-time contracts; flagged unresolved risks |

---

## 1. Executive Summary

Magnolia 7 (M7) Frontend Platform is a strategic modernization initiative that replaces the legacy Vaadin-based administrative UI framework with a unified, React-based, headless microfrontend platform.

The platform is the shared foundation for Magnolia-owned products (Admincentral, PaaS Cockpit), partner-developed solutions, and customer-developed applications. It is governed by the **Frontend Framework Guild**, a cross-stream body with binding decision authority over shared frontend standards — while implementation stays decentralized inside each value stream (Content App, DAM, Visual Editor, etc.).

Unlike the v1.0 draft, this version treats the platform's core mechanics — auth, runtime config, real-time sync, i18n, state ownership — as **ratified engineering contracts**, not open questions, because they were already decided and partially implemented (Shell repo, DAM, Visual Editor) between Feb and Jun 2026.

---

## 2. Goals and Background Context

### Goals

- Replace Vaadin with a React + Module Federation platform without a "big bang" rewrite (Strangler Pattern).
- Give every remote app (Content App, DAM, Visual Editor, PaaS Cockpit, partner apps) **one** way to do auth, env config, state ownership, i18n, and real-time sync — so 10 teams don't invent 10 solutions.
- Keep the Guild lightweight: it ratifies standards, it does not own a delivery pipeline or block streams.
- Make the platform's conventions machine-enforceable (linting, Biome, CI checks, and AI-agent-readable guideline docs) rather than tribal knowledge.

### Background Context

Magnolia's frontend engineers are embedded in value streams by design — close to the customer, close to the problem. That strength is also the risk: without a shared foundation, streams silently diverge (already observed: Visual Editor initiating its own Keycloak auth flow in parallel with the Shell; `nanostores` adopted ad-hoc in Warp FE for tab-persistence, then organically expanding into feature toggles before a deliberate move to Zustand). The Guild exists to be the steward of that common ground — deciding shared libraries, code standards, and now, agentic engineering skills/AI-context for the frontend domain — without becoming a second, competing delivery team.

### Out of Guild Scope (explicit, per charter)

- Design System **component implementation** (owned by the dedicated Design System team; Guild consumes it).
- Domain-specific app logic (Visual Editor canvas, Stories, Tours, DAM App business logic) — these live in the streams.

---

## 3. Stakeholders & Personas

**Executive:** CTO, VP Engineering, Product Leadership
**Product:** Magnolia DX Core Team, Magnolia PaaS Team, Future Product Teams
**Technical:** Frontend Framework Guild, Design System Team, Architecture Board, DevOps Team
**External:** Magnolia Partners, Magnolia Customers, Solution Integrators

| Persona | Needs | Success Criteria |
|---|---|---|
| **A — Magnolia Product Team** | Fast feature delivery, consistent architecture, shared platform services | Minimal platform overhead, high developer productivity |
| **B — Partner Developer** | Ability to build integrated apps, clear extension model, stable APIs | Rapid onboarding, predictable integration |
| **C — Enterprise Customer** | Ability to build custom apps, long-term platform stability | Reduced vendor lock-in, sustainable customization |

---

## 4. Product Scope

### In Scope
- React platform, TypeScript standards, Module Federation architecture, shared runtime
- Shared services: Authentication, Session Management, Notifications, Global Navigation, Runtime Configuration, Global Search
- Design System **integration** (consumption, not implementation): shared components, theming, accessibility
- Developer platform: build tooling, testing tooling, CI/CD standards, governance process, AI-agent guideline enforcement

### Out of Scope
- Backend service modernization
- Content repository redesign
- Design System **implementation** ownership (separate team)
- Domain-specific application functionality (Visual Editor canvas logic, Stories, Tours, DAM business rules)

---

## 5. Governance Model — Frontend Framework Guild

**What it is:** A cross-stream governance body with **binding** authority over shared frontend technology decisions, standards, and AI/agentic engineering guidelines for the frontend domain. Members remain embedded in their streams; work agreed in the Guild flows back into stream backlogs — the Guild has no separate sprint or delivery pipeline.

**What it decides:**
- Common-requirement libraries (state management, i18n, real-time, etc.)
- Code style guides, implementation guidelines, QA/deployment standards
- Agentic engineering skills / AI context artifacts specific to frontend (so AI coding assistants enforce the same conventions humans do)

**What it explicitly does not own:** Design System component implementation; domain-specific app logic.

**Leadership model (proposed, not yet ratified):**
- Guild Lead elected by vote for a fixed term (proposal: 3–6 months), rotating — avoids the "falls into one person's folders" failure mode.
- Guild Lead is a **facilitation role, not an executing role**; OSS-style governance — contributors vote, Lead breaks ties only.
- Open decision: final election-term length (3 vs 6 months) — **unresolved, needs Guild vote.**

**Decision record location:** Written, approved standards (graduating from the working wiki into `STRUCTURE.md` / `README.md` per repo, plus a canonical Guild decision log).

---

## 6. Functional Requirements

| ID | Requirement |
|---|---|
| **FR-1** | The platform shall provide a shared **Shell** application owning: authentication, session lifecycle, global navigation, global search, notifications, shared runtime services. |
| **FR-2** | The platform shall support independently developed and independently deployed **Remote Applications** integrated via Module Federation. |
| **FR-3** | Authentication (login, logout, token refresh, session expiry) shall be centrally orchestrated by the Shell and consumed by Remotes through a generic `useAuth` hook (`getToken()`), hiding Keycloak implementation details. Remotes must **never** initiate their own independent IdP auth flow against the Shell's session — this is a P0 architectural rule (see Risk R-05). |
| **FR-4** | The platform shall support **Build Once, Deploy Anywhere**: a single immutable build artifact promoted across environments, with environment values injected at runtime via the Hybrid Git-Sourced Runtime Pattern (§8.4). |
| **FR-5** | The platform shall support multilingual UI: static labels via Lingui (compile-time, no hardcoded strings), dynamic/database-driven content pre-translated server-side based on `Accept-Language`. |
| **FR-6** | The platform shall support near real-time state synchronization across Shell and Remotes using a **Signal + Pull** pattern over a Shared Web Worker Socket.IO connection — polling is prohibited. |
| **FR-7** | The platform shall provide shared, mandatory virtualization (TanStack Virtual) for any list/grid/table rendering >1,000 items. |
| **FR-8** | The platform shall provide a shared Notification system, orchestrated by the Shell, callable by Remotes without each Remote managing its own notification UI. |
| **FR-9** | The platform shall provide a `useApiBaseUrl` hook and `authFetch` utility (auto-refreshing) so Remote apps never hand-roll API base URL resolution or auth-header management inside domain API functions. |
| **FR-10** | The Design System shall expose Table, Table Grid, and Table Tree Grid organisms consumable by the framework without requiring Remotes to re-implement virtualization/selection logic from scratch. |

---

## 7. Non-Functional Requirements

| ID | Requirement |
|---|---|
| **NFR-1 (Performance)** | Initial bundle < 300 KB gzip; route-level bundle < 150 KB gzip; Core Web Vitals green; route-level lazy loading mandatory. |
| **NFR-2 (Scalability)** | Platform must support multiple concurrent product teams, multiple independently versioned Remotes, and partner-developed extensions without a shared release train. |
| **NFR-3 (Reliability)** | Error boundaries at Shell and per-Remote-mount level (a failing Remote must not crash the Shell); retry strategy for TanStack Query mutations/queries; centralized error monitoring. |
| **NFR-4 (Maintainability)** | Package-by-feature, start flat, colocate code that changes together, suffix-based naming (`*View`, `*.store.ts`, `*.api.ts`, `*.queries.ts`) enforced by lint/AI-agent guidelines. |
| **NFR-5 (Accessibility)** | WCAG 2.1 AA, keyboard navigation, screen-reader compatibility; ARIA labels sourced consistently (open question — see Risk R-07). |
| **NFR-6 (Security)** | Tokens stored in memory only (no LocalStorage persistence); no secrets in source, env files, or bundles; CSP; dependency scanning; secure cookies. |
| **NFR-7 (Quality)** | Unit test coverage ≥ 80%; production defects target -30% vs. legacy; automated E2E via a dedicated `m7-e2e` repo running against real framework demos (`pnpm dev` demo scenarios). |

---

## 8. Technical Assumptions & Ratified Architecture Decisions

> These are decisions already made and (partially) implemented in the Shell/DAM/Visual Editor repos as of the last Guild sync — treat them as constraints for any new code generation, not as open design space.

### 8.1 Stack

| Area | Technology | Status |
|---|---|---|
| Framework | React + TypeScript | Ratified |
| Build | Vite (monitoring Vite 8 / Rolldown) | Ratified; **Module Federation + Rolldown support is an open TODO** |
| Package manager | pnpm | Ratified |
| State (client) | Zustand (replacing ad-hoc `nanostores`) | Ratified, migration in progress |
| Server state | TanStack Query | Ratified |
| Large lists | TanStack Virtual (`useVirtualizer` / `useWindowVirtualizer`) | Ratified, mandatory >1,000 rows |
| Lint/format | Biome (space indent, module-ordered imports) | Ratified, replacing ESLint/Prettier |
| Git hooks | Husky (shift-left enforcement) | Ratified |
| i18n | Lingui (static) + backend-translated dynamic content | Ratified |
| Real-time | Socket.IO via Shared Web Worker | Ratified (PoC validated) |
| Testing | Vitest, Playwright, dedicated `m7-e2e` repo | In progress (FF-13) |
| Release | Semantic-release via shared bot account | Proposed, **blocked** — see Risk R-06 |

### 8.2 Architecture Style: Shell + Remotes (Module Federation)

- **Shell owns:** Auth/session, global navigation, App Bar (unless a Remote explicitly opts into a "navigation delegated" mode — still under design, see Risk R-08), global search, shared runtime services, notifications.
- **Remotes own:** Business features, local state, domain APIs, view rendering.
- Remotes expose an `App` component via Module Federation exposure convention (ratified, FF-117).
- Open question, not yet resolved: whether shared UI-only packages (e.g., `AssetChooser`) should be distributed as an npm package or also exposed via Module Federation — current default assumption is npm package; Module Federation for it is flagged as a possible anti-pattern, pending decision.

### 8.3 State Management Contract

- **Global state (Shell only):** session/auth, unified connection state to DX Core backend.
- **Local state (Remote only):** current selection (e.g., AI Chat context, field being edited, VE component selection), filtering/search/sort state, form data, app-level schema caching, optimistic UI updates (e.g., instantly reflecting a created item in a table before server confirmation).
- **Cross-Remote communication** (e.g., "which DAM providers are available," reflected into another Remote's URL) is **event-based**, not shared global state — this avoids monolithic context coupling.
- URL is the source of truth for **sharing content**, not for sharing view/UI state.

### 8.4 Runtime Configuration — Hybrid Git-Sourced Runtime Pattern

**Problem:** Baking env vars at build time means a different image per environment, violating Twelve-Factor / Build-Once-Deploy-Anywhere.

**Ratified pattern:**
1. `.env.<environment>` files (e.g. `.env.staging`, `.env.production`) are committed to Git — safe because values here (e.g. backend API URL) are non-sensitive/public-by-design once deployed.
2. **Code bridge** in `src/config.ts`:
   ```ts
   const runtimeConfig = (window as any)._env_ || {};
   export const API_URL = runtimeConfig.VITE_API_URL || import.meta.env.VITE_API_URL;
   ```
3. **CI deploy-stage script** reads `.env.${CI_ENVIRONMENT_SLUG}`, extracts `VITE_`-prefixed vars, and generates `dist/env.js` (`window._env_ = {...}`) — zero manual GitLab UI variable management, one build artifact promoted through all stages.
4. Local dev (`npm run dev --mode staging`) keeps native Vite mode behavior; `window._env_` is empty locally, so the code bridge falls back to `import.meta.env`.

**Explicitly out of scope for this pattern:** secrets. This pattern is only for non-sensitive, publicly-observable config (API URLs). Secrets remain excluded per NFR-6.

### 8.5 Authentication Contract

- Shell owns the canonical Keycloak auth flow.
- Remotes consume auth exclusively via `useAuth`/`getToken()` — implementation details hidden.
- `authFetch` utility provides transparent token auto-refresh; domain `.api.ts` files must **not** implement their own connection/auth management.
- Convention: every Remote/API surface should carry a `consumer.api.test.ts` verifying the contract.
- **Known live violation (must be resolved, not just documented):** the Visual Editor was observed independently initiating its own Keycloak flow as a temporary stopgap "to protect the instance" before Shell integration was complete. This is documented as **temporary only** and must be retired once VE is fully Shell-integrated — tracked as Risk R-05.

### 8.6 Internationalization Contract

- **Static UI labels:** Lingui, compile-time extraction, DoD = no hardcoded English strings.
- **Dynamic/DB-driven content** (e.g., form field labels from Content Type definitions): resolved **server-side**, keyed off `Accept-Language`, returned pre-translated. Rationale: bypassing Lingui's build-time pipeline for dynamic strings (`i18n.load()` at runtime) loses compile-time safety/type checking and is only a fallback, not the default.
- ARIA labels: still an open item — whether they can be derived automatically from visible field labels, or need separate translation handling (Risk R-07).
- Translation Management System: an earlier SaaS tool (Tolgee) had **low adoption** and is not the default going forward; Guild proposal is to invest in a SaaS-based TMS integrated with MR acceptance — **not yet decided**, see Risk R-09.

### 8.7 Real-Time Sync Contract ("Signal + Pull")

- One Socket.IO connection **shared across browser tabs** via a Shared Web Worker (not one socket per tab).
- Connections join a room keyed by `username`, enabling targeting a user across all their devices/tabs.
- On any CRUD mutation (2xx from POST/PATCH/DELETE), backend emits a minimal signal, e.g. `{ "action": "REFRESH", "target": "tours" }` — never the full payload.
- Frontend reacts by invalidating/re-pulling the relevant TanStack Query cache key — never polls.
- Transport choice (WebSocket vs. SSE) — WebSocket via Socket.IO is the validated PoC choice; SSE was used in a separate AI-Accelerator project but is **not** the M7 default (one-way nature and connection-limit tradeoffs noted but not fully quantified — minor open item).

### 8.8 Performance / Virtualization Contract

- Virtualization becomes necessary above ~1,000 rows (validated: acceptable to ~100 rows unvirtualized; sluggish/unresponsive selection and column-dragging beyond ~1,000).
- Tradeoff accepted: virtualized tables **cannot** use the Design System's stock TanStack table as-is; framework must re-assemble from smaller DS primitives (rows, cells).
- `useVirtualizer` (explicit scroll container) and `useWindowVirtualizer` (body as scroll container) both required depending on context (in-app scroll region vs. full-page scroll).

### 8.9 CI/CD, Repo, and Release Conventions

- Default branch `main`, not `master`.
- MR approval rules: pipeline green + ≥1 reviewer approval + all threads resolved.
- Biome enforced via Husky pre-commit (shift-left).
- Visual Editor repo is the **reference implementation** until a dedicated, simpler boilerplate/template repo is extracted.
- `CODEOWNERS` convention: e.g. config-file ownership tied to whoever owns the reference implementation; pipeline/`.gitlab-ci.yml` ownership assigned explicitly.
- Semantic, automated releases via a shared bot account — **not yet operational for all repos** (e.g., the `fields` repo has no semver set up and the intended releaser lacks merge rights) — Risk R-06.

---

## 9. Success Metrics

**Adoption:** 100% of new Magnolia apps on M7 · >70% of new partner apps on M7 standards · 100% shared Design System adoption
**Engineering:** <1 day new-app bootstrap · >80% shared component reuse · <10% manual API client code · 100% build standardization
**Quality:** -30% production defects · WCAG 2.1 AA · ≥80% unit test coverage
**Performance:** <300 KB gzip initial bundle · <150 KB gzip route bundle · Core Web Vitals green

---

## 10. Epic List

| # | Epic | Priority | Status basis |
|---|---|---|---|
| 1 | Shell Foundation & Runtime Configuration | P0 | Largely implemented |
| 2 | Authentication & Session Contract | P0 | Implemented, 1 known violation to retire |
| 3 | State Management & Module Federation Conventions | P0 | Ratified, migration ongoing |
| 4 | Real-Time Sync (Signal + Pull) | P1 | PoC validated, rollout pending |
| 5 | Internationalization Platform | P1 | Partially implemented, TMS undecided |
| 6 | Design System Integration (Tables/Virtualization) | P1 | In progress |
| 7 | Testing & Quality Gates | P1 | In progress (FF-13 open) |
| 8 | Governance & AI-Agent Enforcement | P1 | Charter ratified, leadership model pending |
| 9 | Early Adopter Migration (Content App, DAM, PaaS Cockpit) | P0 | Phase 2 of Migration Strategy |
| 10 | Partner Enablement | P2 | Phase 4, not started |

---

## 11. Epic Details

### Epic 1 — Shell Foundation & Runtime Configuration

**Goal:** A Shell that any Remote can mount into, with environment config resolved identically everywhere.

- **Story 1.1** — As a platform engineer, I want a single `dist/env.js` generated per environment from committed `.env.<slug>` files, so that one build artifact is promotable across dev/staging/production.
  - AC: CI deploy stage generates `window._env_` from `.env.${CI_ENVIRONMENT_SLUG}`; local `--mode staging` falls back to `import.meta.env`; no manual GitLab CI variable editing required for new environments.
- **Story 1.2** — As a Remote app developer, I want a `useApiBaseUrl` hook instead of reading `framework/src/shell/index.ts` directly, so that Shell internals can change without breaking Remotes.
  - AC: `useApiBaseUrl` ships from the framework package; direct imports of Shell internals are lint-flagged.
- **Story 1.3** — As a user, I want the Shell to render a global App Bar and navigation by default, with an explicit opt-out ("navigation delegated" mode) for Remotes with custom nav (e.g. Visual Editor breadcrumbs).
  - AC: Default mode has no double App Bars; delegated mode is an explicit, documented Remote configuration flag (design still open — see Risk R-08).

### Epic 2 — Authentication & Session Contract

- **Story 2.1** — As a Remote developer, I want `useAuth().getToken()` instead of touching Keycloak directly, so my code doesn't break if the IdP integration changes.
  - AC: No Remote repo imports a Keycloak client library directly; `authFetch` used for all authenticated calls; `consumer.api.test.ts` present per API surface.
- **Story 2.2** — As a platform architect, I want the Visual Editor's temporary standalone auth flow retired, so there is exactly one auth orchestration point.
  - AC: VE auth flow removed once Shell integration ships; documented temporary status closed out; regression test confirms VE and Shell never authenticate against different IDPs.

### Epic 3 — State Management & Module Federation Conventions

- **Story 3.1** — As a developer, I want Zustand as the only sanctioned client state library, so state debugging doesn't require knowing 3 different tools.
  - AC: `nanostores` usage fully migrated (Warp FE tab-persistence + feature toggles); Zustand pattern documented with local-storage persistence example.
- **Story 3.2** — As a Remote app, I want a documented Module Federation exposure convention (`App` export) and route convention, so integration into the Shell is predictable.
  - AC: FF-117 conventions applied to all active Remotes (framework, content-app, dam); routing (FF-55 host/remote routing, FF-56 programmatic navigation) resolved — **currently open, needs closure**.

### Epic 4 — Real-Time Sync (Signal + Pull)

- **Story 4.1** — As a user with multiple tabs open, I want a single shared WebSocket connection, so opening more tabs doesn't multiply backend load.
  - AC: Shared Web Worker Socket.IO client validated (PoC exists); connections join a room by `username`.
- **Story 4.2** — As a developer, I want mutation endpoints to emit a lightweight `{action, target}` signal on 2xx, so the frontend never has to poll.
  - AC: Signal triggers TanStack Query invalidation for the relevant key; no polling interval exists anywhere in Remote code (lint/code-review gate).

### Epic 5 — Internationalization Platform

- **Story 5.1** — As a developer, I want Lingui to fail the build on hardcoded English strings, so untranslated UI never ships.
  - AC: DoD enforced via lint/CI; example reference implementation available.
- **Story 5.2** — As a user, I want dynamic Content-Type-driven labels already translated when they reach the frontend, so translation logic doesn't leak into every form renderer.
  - AC: Backend resolves `Accept-Language` server-side for dynamic strings; Lingui `i18n.load()` runtime bypass is documented as fallback-only, not default.
- **Story 5.3 (open, needs decision)** — Translation Management System selection and integration with MR-acceptance workflow.
  - AC: **Not yet defined** — blocked on Guild decision (Risk R-09).

### Epic 6 — Design System Integration (Tables/Virtualization)

- **Story 6.1** — As a framework consumer, I want Table / Table Grid / Table Tree Grid DS organisms usable above 1,000 rows without hand-rolled virtualization.
  - AC: `useVirtualizer`/`useWindowVirtualizer` integrated per DS-33; scroll-to-selected-item works even when nested.
- **Story 6.2** — As a Design System consumer, I want CSS layers (reset → tokens → base → typography → components → utilities → overrides) so override conflicts are predictable.
  - AC: Explicit layer order documented and adopted by `mgnl-ds-css`; licensing model for DS decided (currently pending, see Risk R-10).

### Epic 7 — Testing & Quality Gates

- **Story 7.1** — As a Guild, I want a dedicated `m7-e2e` repo exercising the 3 framework demo scenarios end-to-end, so regressions are caught before they reach streams.
  - AC: FF-13 closed; e2e scenarios runnable via `pnpm dev`.
- **Story 7.2** — As a developer, I want a shared Vitest/Playwright config versioned once, not copy-pasted per repo.
  - AC: Shared config package published and consumed by ≥2 repos.

### Epic 8 — Governance & AI-Agent Enforcement

- **Story 8.1** — As the Guild, I want a ratified election model for Guild Lead, so leadership doesn't default to one person indefinitely.
  - AC: Term length (3 vs. 6 months) voted and documented; OSS-style tie-break rule recorded.
- **Story 8.2** — As an AI coding assistant, I want machine-readable convention artifacts (naming suffixes, package-by-feature, auth/env/i18n contracts), so generated code follows Guild standards without a human re-explaining them each time.
  - AC: Guidelines published in a format consumable by AI agents (e.g. `STRUCTURE.md` + skill-style docs); at least the Shell repo assessed against it.

### Epic 9 — Early Adopter Migration

- **Story 9.1** — As the Content App team, I want to migrate onto M7 Shell + conventions, validating the platform under real production load.
  - AC: Content App running on M7, DataTableGrid selection-callback bug fixed (root-items-only issue), actions (`actionDefs.ts`) pattern adopted from DAM.
- **Story 9.2** — As the DAM team, I want provider abstractions (Datasource) kept DAM-specific and out of the shared Browser component, preserving a clean interface boundary.
  - AC: `FF-86-remove-providers` fully landed across framework/content-app/dam; naming cleanup finished.
- **Story 9.3** — As the PaaS Cockpit team, I want a unified BE staging environment for M7, so cross-repo integration testing doesn't require N separate backend deployments.
  - AC: Shared staging BE endpoint operational for content-api/dam7 backends; CORS and versioning issues resolved.

### Epic 10 — Partner Enablement

- **Story 10.1** — As a partner developer, I want SDK-generated clients and a reference app, so I can integrate without reverse-engineering the Shell.
  - AC: Not yet started (Phase 4) — placeholder epic, scope to be defined once Epic 9 is stable.

---

## 12. Risks and Open Questions

| ID | Risk / Open Question | Impact | Mitigation / Next Step |
|---|---|---|---|
| **R-01** | Module Federation + Vite/Rolldown compatibility unresolved | Could block the build migration entirely | Evaluate `module-federation/vite` support before committing to Vite 8/Rolldown |
| **R-02** | Migration delays (Strangler Pattern coexistence overhead) | Slower time-to-value | Incremental rollout, prioritize highest-friction streams first |
| **R-03** | Technology fragmentation across streams | Erodes the platform's value | Guild governance, automated compliance checks (lint/CI) |
| **R-04** | Partner adoption challenges | Low external usage | Documentation, SDK generation, reference apps |
| **R-05** | Visual Editor's temporary standalone Keycloak flow not yet retired | Two auth orchestration points risk session/IDP divergence | Track as blocking item for VE's Shell integration milestone, not just a footnote |
| **R-06** | Semantic-release blocked on repo permissions (e.g. `fields` repo has no merge rights for the release owner) | Manual releases, inconsistent versioning | Decide: extend merge rights vs. dedicated release-bot account with proper access control |
| **R-07** | ARIA label translation sourcing undecided | Accessibility gaps | Guild to evaluate deriving ARIA labels from visible field labels vs. separate translation entries |
| **R-08** | "Navigation delegated" mode (Remote-owned App Bar) not fully designed | Double App Bars / inconsistent nav UX | Needs a concrete design spec before more Remotes (beyond VE) need it |
| **R-09** | Translation Management System choice undecided; prior tool (Tolgee) had low adoption | Continued ad-hoc translation workflow | Guild proposal: evaluate SaaS TMS integrated at MR-acceptance time |
| **R-10** | Design System licensing model undecided | Blocks DS release/external distribution | Scheduled decision meeting with DS Licensing stakeholders |
| **R-11** | Shared `AssetChooser`-style component distribution model (npm vs. Module Federation) unresolved | Inconsistent integration pattern across Remotes | Guild to rule explicitly; current default assumption is npm package |
| **R-12** | Error boundary / reliability strategy for a failing Remote (NFR-3) not detailed in source material | A broken Remote could still degrade the Shell | Needs a dedicated architecture spec — not found in existing decision log, treat as a gap |
| **R-13** | Observability (structured logging, correlation IDs, centralized error/exception tracking) mentioned as a requirement but no concrete tool/pattern chosen in the decision log | Harder production debugging at scale | Needs explicit tool selection (e.g., Sentry/OpenTelemetry) — currently unresolved |

---

## 13. Migration Strategy

Incremental **Strangler Pattern** — legacy Vaadin and M7 coexist during migration.

| Phase | Scope |
|---|---|
| **Phase 1 — Foundation** | Shell, Design System integration, Authentication, Runtime configuration |
| **Phase 2 — Early Adopters** | Content App, DAM, PaaS Cockpit |
| **Phase 3 — Platform Expansion** | Additional Magnolia products |
| **Phase 4 — Partner Enablement** | Partner/customer onboarding, SDKs |
| **Phase 5 — Legacy Retirement** | Gradual Vaadin decommissioning |

---

## 14. Roadmap

- **2026 H2:** Shell MVP, Authentication, Runtime configuration, Design System alignment
- **2027 H1:** Content App migration, DAM migration, shared notification framework
- **2027 H2:** Additional product migrations, partner SDKs, extension marketplace foundations
- **2028+:** Full platform adoption, legacy retirement, ecosystem expansion

---

## 15. Acceptance Criteria (Initiative-Level Definition of Done)

- All new Magnolia frontend projects use M7
- Shared Design System adoption reaches 100%
- Platform governance (Guild leadership model) is operational and ratified, not just proposed
- Authentication is centralized — including retirement of the VE standalone flow (R-05)
- Runtime configuration is standardized via the Hybrid Git-Sourced Runtime Pattern across all repos
- Performance targets (§9) are achieved
- Accessibility requirements (WCAG 2.1 AA) are satisfied, including resolved ARIA-label sourcing
- Partner extension model is available and documented

---

## 16. Appendix — Key Principles

- Package by Feature, start flat, colocate what changes together
- Name intentionally: `*View`, `.api.ts`, `.queries.ts`, `.store.ts`
- Build Once, Deploy Anywhere
- Shell-Owned Global State / Remote-Owned Local State
- No Polling — Signal + Pull only
- OpenAPI First
- Security by Default (no LocalStorage tokens, no secrets in bundles)
- Observability by Default *(tooling still unresolved — R-13)*
- Performance by Design (virtualize >1,000 rows)
- Governance over Fragmentation, enforced machine-readably for both humans and AI coding agents

**Document Ownership:** Frontend Framework Guild
**Reviewers:** Architecture Board, Product Leadership, Engineering Leadership
**Approval:** CTO, VP Engineering
