# Active Session State

**Task:** Floor Plan GDD (#3) — design-review DONE (full, 5 agents) → MAJOR REVISION → revised same session
**Status:** Revisions applied; **independent re-review pending in a FRESH session**
**File:** design/gdd/floor-plan-system.md · review log: design/gdd/reviews/floor-plan-system-review-log.md
**Review mode:** full (design-review)

**Previous:** Scan Node (#4), Floor Plan, FPS Movement, Point Cloud Renderer GDDs complete

## Floor Plan re-review — IMMEDIATE NEXT
- `/clear` then `/design-review design/gdd/floor-plan-system.md` (fresh = independent; this is a re-review, log exists)
- CD verdict was MAJOR REVISION NEEDED; all 6 blocking + recommended addressed — expected to clear

## Floor Plan revisions applied (2026-06-27) — user decisions
- desync lags **player-position marker** (+ scan-state) — fixes anchor-moment gap (was icon-only)
- anomaly-reveal loop arm: **re-arm above escalation floor** (`loop_arm_floor`=0.4); ARMED→DORMANT defined
- desync curve **e² → e³** (truthful early / sharp late); registry desync_delay expr updated
- `loop_cooldown` **per-door** (was global — closed exploit)
- weights absolute (w_t+w_c=1, both-zero fallback); coverage def pinned (closes floor-plan Open Q#2)
- AC 23 → 34; guards: S=0 reject, D0=0 instant, ARMED-at-SEALED, unmapped-room marker hidden
- Deferred to dollhouse UX spec: access paradigm, STALE/CURRENT visual, marker visuals, colourblind ring
- Open Q#6 added (§15-C2 owner). Coverage contract = AC-SN22 (owned by Scan Node)

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
- **1. `/clear` → `/design-review design/gdd/floor-plan-system.md` (re-review, fresh session)**
- 2. `/design-review design/gdd/scan-node-system.md` (#4 still unreviewed)
- 3. `/consistency-check` across 4 GDDs (re-check after floor-plan revision: e³ curve, coverage)
- 4. Then `/design-system` Orchestrator (#5) — event bus convergence floorplan:* / scan:* / entity:proximity
- 5. Then Scan Mechanic (#6)

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
