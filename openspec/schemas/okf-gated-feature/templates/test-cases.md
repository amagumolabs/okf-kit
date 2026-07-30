# Test Cases

<!--
Create this before implementation.

Test cases come from the OKF entries linked in okf-link.md, from proposal.md, and
from specs/**/*.md. They describe expected behavior, never current implementation
structure.

Cite the OKF rule id (BR-n) in the Source column wherever a case exists because
of a business rule. That citation is what makes the trail
BR-n -> spec -> test -> code checkable instead of a matter of opinion.

Delete any section with no real content. Do not leave empty table rows.
-->

# Source References

| Source | Path | Notes |
| --- | --- | --- |
| OKF entries | see `okf-link.md` for the path of each capability | Primary durable knowledge source - business rules carry BR-n ids |
| Proposal | proposal.md | Scope, non-goals, risks, acceptance criteria |
| Specs | specs/**/*.md | Normative requirements and scenarios |

# Acceptance Criteria Mapping

<!-- Every acceptance criterion maps to at least one test case, or gets a Not Applicable reason. -->

| Acceptance Criterion | Rule (BR-n) | Test Case IDs | Notes |
| --- | --- | --- | --- |

# Business Rule Coverage

<!--
Every BR-n in every linked OKF entry that this change touches must appear here.
A rule with no test case is a rule nothing protects.
-->

| Rule (BR-n) | Capability | Test Case IDs | Notes |
| --- | --- | --- | --- |

# Spec Scenario Mapping

<!-- Every OpenSpec scenario maps to at least one test case, or gets a Not Applicable reason. -->

| Spec Requirement | Spec Scenario | Test Case IDs | Notes |
| --- | --- | --- | --- |

# Unit Test Cases

<!-- Prefer public contracts and service boundaries over private implementation details. -->

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UT-001 | must |  |  |  |  |  |

# Integration Test Cases

<!-- Multiple modules together: API handler + service + repository + database. -->

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| IT-001 | must |  |  |  |  |  |

# API E2E Scenarios

<!-- Black-box HTTP/client journeys through the running API. Omit if the feature has no API contract. -->

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| API-E2E-001 | must |  |  |  |  |  |

# Browser E2E Scenarios

<!-- User journeys through the browser. Omit if the feature has no UI. -->

| ID | Priority | Scenario | Given | When | Then | Source |
| --- | --- | --- | --- | --- | --- | --- |
| UI-E2E-001 | must |  |  |  |  |  |

# Negative And Boundary Cases

<!-- Denied actions, invalid transitions, duplicates, empty input, limits, stale data, concurrency, permission failures. -->

| ID | Priority | Scenario | Expected Result | Source |
| --- | --- | --- | --- | --- |
| NEG-001 | must |  |  |  |

# Not Applicable

<!-- If a test type is not relevant, say why specifically. "Not applicable" with no reason is not an answer. -->

| Area | Reason | Approved By |
| --- | --- | --- |

# Open Questions

<!-- Questions that must be resolved before tests or implementation can be trusted. -->
