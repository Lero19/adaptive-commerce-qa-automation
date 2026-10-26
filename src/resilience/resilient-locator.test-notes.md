# Locator resilience test cases

Add automated unit/integration tests for these cases before describing the resolver as production-ready:

1. Primary locator uniquely identifies a visible enabled target -> primary returned, no healing event.
2. Primary missing; fallback uniquely identifies the intended target -> fallback returned and `healed` event recorded.
3. Primary and fallback both missing -> explicit error.
4. Fallback matches multiple elements -> candidate rejected as ambiguous.
5. Candidate exists but is hidden or disabled -> candidate rejected.
6. Fallback finds a wrong semantic target -> test must reject it through explicit target identity/expected semantics checks.
7. Business action after fallback still fails its assertion -> scenario remains failed.
