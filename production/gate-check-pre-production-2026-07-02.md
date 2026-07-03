# Gate Check — Pre-Production

- **Date:** 2026-07-02
- **Gate:** Technical Setup → Pre-Production
- **Verdict:** **FAIL** (blocked on design-phase work, not infrastructure)

---

## Criteria

| # | Criterion | Status | Notes |
|---|-----------|--------|-------|
| 1 | All MVP systems designed (GDDs exist) | ❌ | **5/9** — missing Scan Mechanic (#8), Entity (#9), Win/Lose (#10), UI/HUD (#12) |
| 2 | MVP GDDs reviewed/approved | ⚠️ | 3/5 approved (Floor Plan, Scan Node, Orchestrator); Point Cloud Renderer + FPS Movement still "In Design" |
| 3 | Architecture review verdict | ⚠️ | **CONCERNS** — 6/7 ADRs `Proposed` (ADR-0002 gated on OQ1 prototype) |
| 4 | Cross-ADR conflicts | ✅ | None across 7 ADRs |
| 5 | Engine pinned & consistent | ✅ | Three.js r171 (`docs/engine-reference/three/VERSION.md`); CLAUDE.md repointed |
| 6 | Test infrastructure (tests/ + CI) | ✅ | Vitest suite green; `.github/workflows/tests.yml` runs verify:registry + npm test |
| 7 | UX foundations | ✅ | `design/ux/accessibility-requirements.md`, `design/ux/interaction-patterns.md` |
| 8 | Requirements traceability | ✅ | 42/42 TRs covered (`tr-registry.yaml` v2, `traceability-index.md`) |

## Verdict: FAIL

Infrastructure and architecture foundations (criteria 4–8) are all green. The gate
fails on **design-phase** work, not setup: four MVP systems remain undesigned and the
architecture review is at CONCERNS because most system ADRs are still `Proposed`.

## Blockers to PASS

1. **Design the 4 remaining MVP GDDs** — Scan Mechanic (#8), Entity (#9), Win/Lose (#10),
   UI/HUD (#12), via `/design-system` + `/design-review` each. (Entity is high-risk;
   Win/Lose owns the inverted-reward ending; UI/HUD owns the deferred view-model transport.)
2. **Formally review + approve** Point Cloud Renderer and FPS Movement GDDs (currently "In Design").
3. **Author ADRs** for the 4 new systems + the UI/HUD view-model transport; then move all
   system ADRs `Proposed → Accepted` (including ADR-0002 after the OQ1 depth-occluder
   prototype passes on r171).
4. **Re-run `/architecture-review`** → target PASS.

## Progress this session (architecture phase — 12/12 tasks complete)

| | Start of session | End of session |
|--|------------------|----------------|
| Architecture review | FAIL | CONCERNS |
| ADRs | 1 (Proposed) | 7 (ADR-0001 Accepted; 0002–0007 Proposed) |
| TR coverage | 4 ✅ / 5 ⚠️ / 33 ❌ | 42/42 covered, 0 conflicts |
| Engine ref | Godot (wrong) | Three.js r171 pinned |
| Tests / CI | none | Vitest + CI green |
| UX foundations | none | accessibility + interaction-patterns |

## Recommended next step

`/design-system` for **Scan Mechanic (#8)** first — Point Cloud Renderer, FPS Movement,
and Scan Node all already reference its events (`scan:started`, `scan:captured`,
`scan:capture_frame`, `movement:scan_triggered`) as provisional upstream.
