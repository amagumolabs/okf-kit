# Workflow at a Glance

How an OpenSpec change and an OKF knowledge entry move together, end to end.

This page is the map, not the manual. It shows *where* each file is written and
*what* the next step reads. For the mechanics — what `okf check` enforces, the
test vocabulary, the known limitations — read
[`openspec-okf-workflow.md`](./openspec-okf-workflow.md).

---

## The one idea

Two files, two lifetimes:

| | Lives in | Lifetime |
| --- | --- | --- |
| **A change** — proposal, specs, tasks | `openspec/changes/<change-id>/` | Ends at archive |
| **The knowledge** — terms, actors, `BR-n` rules | `.okf/features/<capability>.md` | Permanent, edited in place |

Everything below is one sentence repeated: **the change points at the knowledge,
it never copies it.** A rule is written once, gets a stable id (`BR-1`), and
specs, tests and evidence all quote that id.

---

## First, the problem: OpenSpec + OKF used free-form

Both tools work without the kit. Nothing stops a team from running OpenSpec and
keeping `.okf/` files by hand. What is missing is that **every arrow between
them is a habit, not a rule** — so the knowledge leaks out at each hand-off.

```mermaid
flowchart TD
    CHAT["Discussion in chat / a ticket"]
    W{"Does someone remember<br/>to write the entry?"}
    OKF[(".okf/features/*.md<br/><i>if it exists at all</i>")]
    SPEC["OpenSpec specs<br/><i>rule text pasted in</i>"]
    IMPL["<b>Implementation</b>"]
    TEST["Tests written after the code"]
    ARC["Archive = move the folder"]

    L1(["Knowledge dies with the session"])
    L2(["Two copies of one rule<br/>→ silent drift"])
    L3(["A test shaped by the code<br/>→ it can no longer refute it"])
    L4(["Entry left unverified,<br/>nobody knows what is still true"])
    L5(["Decisions buried in an<br/>archived design.md"])

    CHAT --> W
    W -- "usually: no" --> L1
    W -- "sometimes: yes" --> OKF
    CHAT --> SPEC
    SPEC -- "copied, then edited<br/>on one side only" --> L2
    CHAT ==>|"the real source of truth"| IMPL
    SPEC --> IMPL
    OKF -. "optional — nothing<br/>requires reading it" .-> IMPL
    IMPL --> TEST --> L3
    IMPL --> ARC
    ARC --> L4
    ARC --> L5
    OKF -. "nobody updates it<br/>on the way out" .-> ARC

    classDef leak fill:#f6e2e2,stroke:#a33,color:#3a1414
    classDef okf fill:#f7ecd9,stroke:#9c6b1f,color:#3a2b0f
    class L1,L2,L3,L4,L5 leak
    class OKF okf
```

The failure is not that people are careless. It is that the free-form version
has **no step that fails** when a hand-off is skipped: the change still
proposes, the code still ships, the folder still archives. Missing knowledge is
invisible until months later, when nobody can say whether a rule in `.okf/` is
still true.

### What the kit turns each leak into

| Free-form leak | With okf-kit |
| --- | --- |
| Nobody creates the entry | `okf-link` is a prerequisite of propose; apply is **blocked** until it exists |
| Rule text copied into specs | One `BR-n` id space — specs cite the id, never the text |
| Implementation reads the chat | The schema tells apply to read the linked entries **ahead of chat history** |
| Tests written after the code | `test-plan` gate + a status vocabulary + a recorded falsifier per test |
| Archive with unverified knowledge | `okf check --archive` refuses to archive it |
| Decisions buried in `design.md` | Promoted into `.okf/decisions/`, and the promotion is checked |
| Knowledge silently going stale | `okf audit` compares `git log` on `code_paths` against `verified_at` |
| Custom instructions in skill files | Behavior lives in the schema + marker block, which survive `openspec update` |
| Each repo hand-copies the conventions | `okf init` / `okf upgrade` — one workflow, upgradable |

The rest of this page is the same six steps as above, with the dotted arrows
turned into required ones.

---

## The main flow

```mermaid
flowchart TD
    E["<b>1. Explore</b><br/>freeform thinking"]
    Q{"A concrete capability?<br/>Ask: save to OKF?"}
    OKF[("<b>.okf/features/&lt;capability&gt;.md</b><br/>unverified")]

    P["<b>2. Propose</b><br/>okf-link · proposal · specs<br/>design · test-cases · test-plan · tasks"]
    G{"<b>3. Gate</b><br/>okf-link + test-plan + tasks<br/>all exist?"}
    A["<b>4. Apply</b><br/>stubs → tests fail red → implement"]
    V["<b>5. Verify</b><br/>BR-n → file:line evidence"]
    R["<b>6. Archive</b><br/>okf check --archive"]

    E --> Q
    Q -- "yes" --> OKF
    Q -- "not yet" --> E
    Q -. "no domain knowledge<br/>(tooling, build)" .-> P

    OKF --> P
    P -. "no entry yet?<br/>propose creates one" .-> OKF
    P --> G
    G -- "missing" --> P
    G -- "open" --> A
    OKF ==>|"read as source of truth,<br/><b>ahead of chat history</b>"| A
    A -. "a rule turned out wrong?<br/>amend OKF + spec FIRST" .-> OKF
    A --> V
    V ==>|"verified · verified_at · code_paths<br/>pending_changes cleared"| OKF
    V --> R

    classDef okf fill:#f7ecd9,stroke:#9c6b1f,color:#3a2b0f,stroke-width:2px
    classDef gate fill:#e8eef5,stroke:#2c5f8a,color:#173349,stroke-width:2px
    class OKF okf
    class G gate
```

Read the thick arrows first — they are the whole point:

- **Into apply.** The implementer reads the OKF entry, not the chat transcript.
  Chat is lost on the next session; the entry is not.
- **Out of verify.** `verified` only ever moves in one place: the verification
  pass, and only with a `file:line` behind each rule.

---

## Step by step

| # | Step | Writes | Reads |
| --- | --- | --- | --- |
| 1 | **Explore** *(optional)* | Offers to create the entry as `unverified` — never silently | The conversation |
| 2 | **Propose** | `okf-link.md` (pointer table) + all change artifacts; enriches or creates the entry | **The OKF entry**, the request |
| 3 | **Gate** | — | Existence of `okf-link` + `test-plan` + `tasks` |
| 4 | **Apply** | Code and tests, test-first | **The OKF entry** and the specs |
| 5 | **Verify** | `verification.md` evidence; updates entry frontmatter; promotes decisions to `.okf/decisions/` | Code, entry, `design.md` |
| 6 | **Archive** | Moves the change to `archive/` | `okf check --archive` |

```bash
npx okf check                        # during and after propose / apply
npx okf index                        # after verify updates frontmatter
npx okf check --archive <change-id>  # before archive
npx okf audit                        # periodically: drift since verified_at
```

---

## Where the two sides are wired together

Only two threads connect a change to the knowledge base. Nothing else is copied.

```mermaid
flowchart LR
    subgraph CH["openspec/changes/&lt;change-id&gt;/"]
        L["okf-link.md<br/><i>one row per capability</i>"]
        S["specs/**<br/><i>Implements: BR-3</i>"]
        V["verification.md<br/><i>BR-3 → auth.ts:42</i>"]
    end

    subgraph KB[".okf/"]
        F[("features/user-auth.md<br/><b>BR-1 … BR-n</b>")]
        D["decisions/"]
        I["index.md · log.md<br/><i>generated</i>"]
    end

    L -- "points at the file" --> F
    S -- "quotes the rule id" --> F
    V -- "proves the rule id" --> F
    F --> I
    D --> I

    classDef okf fill:#f7ecd9,stroke:#9c6b1f,color:#3a2b0f,stroke-width:2px
    class F okf
```

- `okf-link.md` — the pointer table. Which capabilities does this change touch?
- `Implements: BR-n` — the specs quote rule ids, never the rule text.
- Rule Evidence — verification answers each cited `BR-n` with a real
  `file:line` or test name.

Naming keeps this from fragmenting: an entry is named after the **capability**,
never the change. `add-user-auth`, `fix-auth-mfa` and `improve-login` all edit
`user-auth.md`.

---

## The entry's life

```mermaid
stateDiagram-v2
    [*] --> unverified: explore or propose
    unverified --> verified: verification pass, with evidence
    unverified --> needs_revision: conflict nobody can settle
    needs_revision --> verified: a human settles it
    verified --> verified: a new change adds content

    note right of verified
        verified_at + code_paths filled.
        pending_changes non-empty means
        "trust this file, except the new part".
    end note
```

An entry may stay `verified` while carrying a pending change — that is honest,
not a loophole. `needs-revision` is tracked as debt in `.okf/index.md`.

---

## When the entry and the code disagree

This is the table worth memorising.

```mermaid
flowchart LR
    D{"Entry vs code"}
    D -- "match" --> M["Nothing to do"]
    D -- "okf-gap<br/>code right, entry stale" --> O["Update the entry"]
    D -- "code-gap<br/>entry right, code wrong" --> C["<b>Fix the code.</b><br/>Never sync the entry to a bug"]
    D -- "conflict" --> H["Ask a human<br/>needs-revision only if undecidable"]

    classDef warn fill:#f6e2e2,stroke:#a33,color:#3a1414,stroke-width:2px
    class C warn
```

If every disagreement were resolved by editing the entry, the knowledge base
would always agree with the code — including with every bug in it — and could
never catch anything.

**Order of repair when a rule turns out to be wrong:**

```text
OKF entry  →  spec  →  test-plan row  →  test  →  code
```

Reversing it lets the implementation define the domain.

---

## What is a hard gate, and what is not

| Enforced mechanically | Left to review |
| --- | --- |
| The three files exist before implementation (OpenSpec CLI) | Whether a rule is written *well* |
| Pointers resolve, no placeholders, ids unique, evidence present (`okf check`) | Whether the evidence actually proves the rule |
| Nothing archives `unverified` or with placeholders (`okf check --archive`) | Whether the record is honest |

The kit makes the record exist and be internally consistent. Reading `.okf/`
diffs in code review is what makes it true.

---

## Next

| You want | Read |
| --- | --- |
| Gates, artifact graph, test vocabulary, limitations | [`openspec-okf-workflow.md`](./openspec-okf-workflow.md) |
| What goes in an entry, frontmatter states | [`.okf/README.md`](../.okf/README.md) |
| Install / upgrade the kit | [`README.md`](../README.md) |
| Exact per-artifact instructions | `openspec/schemas/okf-gated-feature/schema.yaml` |
