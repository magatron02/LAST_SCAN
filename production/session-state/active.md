# Active Session State

**Task:** Scan Node System GDD (#4) — COMPLETE
**Status:** All 8 sections + Visual/Audio + UI + Open Questions written & approved
**File:** design/gdd/scan-node-system.md
**Review mode:** lean

**Previous:** Floor Plan, FPS Movement, Point Cloud Renderer GDDs complete

**Note:** #4 restarted fresh on desktop (old Legion session abandoned — never pushed)

## Scan Node — key decisions
- Scan Node = sole node-state authority; emits canonical scan:complete / scan:abort
- coverage = V / S; S = count(STANDARD) + 1 anomaly node (NULL excluded), fixed at init
  → escape tops at N/(N+1) <100%; 1.0 only by scanning anomaly node (Completion Trap)
- nodesCompleted UI counter = STANDARD-only denominator (diverges from coverage — by design)
- Answers floor-plan Open Q#2 (coverage definition)
- corruption_threshold = 4 → scan:integrity_failure (single fire)
- 22 acceptance criteria (qa-lead): 18 Logic + 4 Integration
- Section D (systems-designer) + Section H (qa-lead) spawned per lean high-risk

## Registry updates
- NEW formula: coverage (source scan-node; referenced_by floor-plan session_escalation)
- NEW constant: corruption_threshold = 4

## GDD progress (4/9 MVP designed)
- ✓ Point Cloud Renderer · ✓ FPS Movement · ✓ Floor Plan · ✓ Scan Node

## Next
- `/design-review` (fresh session) on floor-plan + scan-node (both unreviewed)
- `/consistency-check` to verify values across 4 GDDs
- Then `/design-system` Orchestrator (#5) — event bus convergence for floorplan:* / scan:* / entity:proximity
- Then Scan Mechanic (#6)

## Key decisions this session (Floor Plan)
- Layout source: **curated pool of authored layouts** + runtime perception-stripping mutations (not procedural geo)
- Divergence model: **one true layout + per-room view-state mask** (dollhouse is a derived view)
- Looping geometry: **threshold teleport** (FPS Movement applies floorplan:loop reposition)
- Anomaly reveal: **designated adjacent node completing** (scan:complete{revealTriggerNodeId})
- 2 formulas: session_escalation (e), desync_delay (= D0+(D_max−D0)·e²)
- 23 acceptance criteria (qa-lead validated — added AC-D04, AC-E05, AC-L05, AC-E06, AC-E07, AC-E08; rewrote AC-C02/C03/C06/C07/D02/D03)
- Bidirectional fix: FPS Movement GDD patched to receive floorplan:loop

## Registry updates
- NEW formulas: session_escalation, desync_delay
- NEW constants: T_session (1500s), loop_trigger_tier (NEAR)
- referenced_by += floor-plan-system.md on: WALL_MARGIN, EYE_HEIGHT, proximity_tier_near

## GDD progress (3/9 MVP designed)
- ✓ Point Cloud Renderer — design/gdd/point-cloud-renderer.md
- ✓ FPS Movement — design/gdd/fps-movement.md
- ✓ Floor Plan System — design/gdd/floor-plan-system.md (23 AC, 2 formulas)

## Flags raised
- 📌 UX Flag: dollhouse map → run /ux-design for design/ux/dollhouse.md before UI/HUD epics (noted in systems-index)
- creative-director (Player Fantasy) and CD-GDD-ALIGN not consulted — Lean mode; review manually before production

## Next
- `/design-review design/gdd/floor-plan-system.md` in a FRESH session (independent critique)
- `/consistency-check` to verify values across GDDs
- Then design-system: Scan Node (#4, depends on Floor Plan), Orchestrator (#5)
- High-risk to prototype early: Point Cloud + Entity rendering; loop teleport comfort

<!-- CONSISTENCY-CHECK: 2026-06-27 | GDDs checked: 3 | Conflicts found: 0 | Verdict: PASS -->
