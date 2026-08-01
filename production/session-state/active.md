# Active Session State

<!-- STATUS -->
Epic: Point Cloud Renderer
Feature: Formula 2 rebuild (CD track 2)
Task: DONE — next is track 3 (7 remaining blockers), fresh session
<!-- /STATUS -->

**Task:** Point Cloud Renderer (#1) — **CD track 2 COMPLETE (2026-08-01): Formula 2 rebuilt once,
from its data sources up.** Not a review; a fixing session, unreviewed by design.

**The rebuild in one line:** both densities now come from data the renderer already holds —
`ρ_base = N_base / A_tile` (**measured** sealed-point count per tile, no longer `D × W_s`) and
`ρ_obs = (N_res × k/n) / A_tile` (**subsampled**, 128 points/tile on a systematic stride), with the
active set **swept at 16 tiles/frame** instead of one pass. `f_cov`, `ρ_base_eff` and
`min_coverage_fraction` are deleted; one derived constant `N_min = ceil(1/k_noise²)` replaces all
three plus the four-round-open joint noise guard, and doubles as the runtime div-zero guard.

**User decisions (both offered as options):** (1) measured baseline over the CD's literal
`D × W_s` + completion-gate model — it subsumes the gate and additionally fixes partially-sealed
tiles, room-edge tiles, and auto-scaled-`D` staleness; (2) subsample **and** sweep, not subsample
alone — the sweep is one knob + one AC and kills the "no amortization Plan B" blocker outright.

**Closed: 3 of 10 blockers** (#1 `f_cov` data source, #3 cost-bound arithmetic — *deleted*, not
corrected, the ADR owns it — and the perf-prototype blocker) **+ 3 long-open recommended items**.
**Still open: 7**, untouched in the document, all for track 3.

**Two defects the rebuild found itself:** the activity gate said "**intersects** the frustum" when it
must say "**fully inside**" (edge-straddling tiles read as false deficits at every screen edge, since
round 3 — new AC-D12); and `k_noise`'s Poisson rationale was false under a measured baseline
(restated as a sensitivity coefficient — **every number unchanged**, only the justification moved).
Incidental: the 87 ms tile-index build vs AC-E04 is dissolved by making the index explicitly
incremental and never same-frame-required.

**Files changed:** `design/gdd/point-cloud-renderer.md` (Formula 2 replaced in full; Formula 1b
decoupled; Tuning Knobs; AC-D02/D02b/D06 rewritten; **AC-D09–D12 added, 33 → 37**; AC-E05/E06 as
fallout; Open Q#7 scope; header) and `design/gdd/reviews/point-cloud-renderer-review-log.md`.

**⚠ Read before trusting this work:**
- The perf blocker is **closed by design, not by measurement** — Open Q#7 must be re-run against the
  rebuilt formula (`prototypes/q7-perf/` needs updating to subsample+sweep first). The 2026-07-26 run
  does not carry over.
- **AC-E06's contract is reversed, not clarified** — a duplicate `scan:capture_frame` no longer fires
  a positive-σ event (the baseline rises with the resident count). Confirm at round 8, don't assume.
- `k_noise` at its 0.05 floor now needs 400 sealed points per tile to sample at all — at low
  `base_density` that excludes most of the map. Range left as-is, coupling documented.
- Round-6's `A_tile`/`anomaly_sample_radius` narrowings were **left in place** though the arithmetic
  justifying them is deleted; un-narrowing is a tuning call not taken here.

**NEXT:** (1) **track 3** in a fresh session — blockers #2, #4, #5, #6, #7, #8 + the Formula 5
`output_fragment`→`opaque_fragment` addendum + 6 recommended; (2) re-run Open Q#7; (3) **round 8**
`/design-review`, fresh context. CD exit criteria: <5 blockers, none self-inflicted by tracks 2–3,
**none in Formula 2** — (c) is what this rebuild is being tested against. Then the other MVP GDDs
(Entity System round 4, FPS Movement, Scan Mechanic, Win/Lose, UI/HUD) and
`/gate-check pre-production`.

---

## Superseded — Point Cloud Renderer round 7 + prototypes (2026-07-26)

**Task:** Point Cloud Renderer (#1) — **round-7 fresh-context re-review done (2026-07-26):
MAJOR REVISION NEEDED. NO fixes applied — deliberate.** 5 specialists + creative-director.
8 blockers + 8 recommended, **+1 found post-review** = 9.

**Why MAJOR (by process, not vision):** **5 of the 8 blockers were introduced by round-6's own
same-session fixes** (`f_cov`, Formula 1b's guard, the narrowed cost bound, AC-P01 window (c),
`toneMapped=false`) — 62% self-inflicted; 6 of 9 counting the addendum. Rounds 4–5 deferred to fresh
sessions; round 6 patched in-session and produced this crop. **CD ruling: no further same-session
fixing on this document, no exceptions for "cheap" items.**

**Root cause CD named:** **Formula 2 has been the primary blocker in 6 of 7 rounds.** Every round
patches its baseline; every patch adds a term whose data source doesn't exist yet (visible-set → layer
set → tile activity → scan coverage). `f_cov` is the 4th iteration of one failure. Prescription:
rebuild Formula 2 **once** from real data sources (gate on binary owning-node completion; delete the
continuous-coverage fiction), don't patch a 5th time.

**Blockers:** (1) `f_cov` has no data source — `scan:complete` is a node-level one-shot carrying a
node-*count* fraction, nothing computes a per-tile *spatial* fraction; AC-D02b's `f_cov=0.5` isn't
constructible [3-way convergence]. (2) Formula 1b guard overshoots above ~89% of ceiling (needs stride
≥14, knob caps at 8). (3) Formula 2's cost bound states no tuning assumption — two recomputations
disagreed (~2.12M vs ~764k); CD ruled *the disagreement is the finding*. (4) `toneMapped=false` on BASE
only → splits the uniform green under any tonemapping. (5) AC-P01 window (c) backwards + unbarred —
GHOST is excluded from ρ_obs, so **Type B is the only entity state adding CPU sampling work**, and it's
the one window exempt from the 33 ms guard. (6) `ghost_decimation_stride` spawn-time-only; ENTITY_GHOST
rebuild-on-`floorplan:update` undefined. (7) `flicker_rate` max 6.37 Hz **violates accessibility A-V3's
≤3 flashes/s ceiling** (verified, `design/ux/accessibility-requirements.md:19`). (8) Level Design
dependency undeclared — absent from Dependencies *and* systems-index.

**+1 ADDENDUM (found after the verdict, while building the prototype — verify this yourself):**
Formula 5 pins `#include <output_fragment>`, **which does not exist in r171** (renamed
`opaque_fragment` in r152). Confirmed against installed `three@0.171.0`. A literal `.replace()` never
matches → **flicker silently never renders while AC-D08 still passes** (it checks only the CPU-side
`uFlickerAmp` uniform). Ordering reasoning is correct; only the name is wrong. **First finding in 7
rounds produced by checking the pinned engine instead of arguing** — the case for prototyping.

**CD overturned 2 specialist findings** (don't re-raise blindly): game-designer's confirmation-dwell
blocker → recommended (the scenario is unreachable — tiles are only sampled if they intersect the
frustum, so the void must be on-screen 2 consecutive passes; verified against Formula 2's own clause).
engine-programmer's Q#6 spatial-index blocker → recommended-mandatory (correct that option (a) silently
needs a tile→point index, but Q#6 is already a deferred ADR question). **Occluder recipe CLEARED**
under fresh adversarial testing — the most-patched technical claim held. **AC count verified at 33.**

**PROTOTYPES BUILT AND RUN (2026-07-26).** **Q#1 GATE PASS** — 100% cull, no colour written, 120/120
viewpoints; numeric readback doubles as **AC-C08 evidence**; no longer blocks the ADR (pending ADVISORY
screenshot sign-off). **Q#7 FAILS AC-P01's max-frame bar in all 3 windows and INVERTS THE RISK MODEL:**
rendering is a non-issue (136 avg FPS, 3M pts + jitter/flicker over the whole merged buffer) but
**Formula 2's CPU sampling pass costs 31–37 ms/pass** — ~2× the frame budget, un-amortized, every 0.5 s,
on hardware *faster* than min-spec ⇒ **unmeetable on any hardware. +1 blocker, total 10.** Also: tile
index build **87 ms** breaks AC-E04's same-frame rebuild; memory concern **RETIRED** (40 MB vs 8 GB);
Q#1 T4 found the near-plane Edge Case unachievable (`material.side` unspecified, r171 `FrontSide` ⇒
player sees *through* the void; `DoubleSide` fixes it). **Blocker 5 (Type B vs C) STILL OPEN** — run
variance swamped it (baseline, with no entity, had the highest max). **Lead for the F2 rebuild:**
subsample ~5% of points per tile instead of testing every one — statistically adequate, ~20× cheaper.
*Harness lesson: Q#1's first run reported a false T3 FAIL caused by my own flat-wall test geometry;
verify the rig before trusting its verdict.*

**Prototype details:**
- `prototypes/q7-perf/` — merged 1.5M-pt BASE (`frustumCulled=false` = Q#6 option (a) worst case),
  jitter+flicker in one `onBeforeCompile`, occluder, GHOST duplicate, SPIKE at 3,240 pts, **Formula 2
  sampling live at worst-case tuning** (`A_tile` 0.5, radius 15m). 4 scenarios × 300 frames incl. a
  **4th the GDD lacks: Type B + CORRUPTED** (tests blocker 5). Reports tile-index cost + buffer bytes.
- `prototypes/q1-occluder/` — numeric offscreen `readRenderTargetPixels` verification, doubles as
  **AC-C08 evidence**. T1 cull / T2 invisibility / T3 360°+elevation sweep / T4 near-plane.
- Run: `npx vite --port 5178 --strictPort` → `/prototypes/q7-perf/`, `/prototypes/q1-occluder/`.
- **This machine is NOT min-spec** (Iris Xe / Vega 8, 8 GB, 1080p) — a pass here does not clear AC-P01.

**`design/gdd/point-cloud-renderer.md` is deliberately UNTOUCHED.**

**Next (CD's 3 tracks, in order):** (1) run both prototypes, ideally on min-spec; (2) **one dedicated
Formula 2 session**, fresh context, nothing else in it; (3) **one consolidated mechanical pass**, fresh
context, for blockers 2/4/5/6/7/8 + addendum + the 8 recommended — per the ruling, *not* in the session
that reviews them. Then round 8 once, with numbers. **CD exit criteria:** blockers (a) <5, (b) none
self-inflicted by tracks 2–3, (c) none in Formula 2. If Formula 2 blocks again, the honest conclusion
is that CPU-side density anomaly detection is the wrong mechanism for this tell.

**Other MVP GDDs awaiting independent re-review:** Entity System (round-4 NEEDS REVISION, 2026-07-25),
FPS Movement, Scan Mechanic, Win/Lose, UI/HUD. Then `/gate-check pre-production`.

---

## Superseded — Entity System review (2026-07-25)

**Task:** Entity System (#9) review — **round 3 independent re-review done (2026-07-25), NEEDS
REVISION → all 4 blockers + 6 recommended revised same session.** 7-agent panel (game-designer,
systems-designer, ai-programmer, qa-lead, audio-director, **ux-designer — first-ever UX pass on this
GDD**) → creative-director synthesis. **Round 3 found ZERO structural issues** — CD argued convergence
explicitly: r1 structural, r2 structural, r3 none; every blocker was a config guard, a wording fix, or
one missing formula.

**The 4 blockers:** (1) `0 < I_min < I_max` and `SPEED_MAX > SPEED_BASE` were declared invariants with
no load guard — they fail by **silent inversion**, not NaN → guards + AC-ES55/ES56 + a guard-policy
note separating guarded invariants from advisory ranges; (2) room-selection weighting was prose only
and the old ACs were passable by a step function → **Formula 4** authored (`(d_i+ε)^−k` + anomaly lerp),
2 new knobs, AC-ES10/ES11 rewritten (≥5 rooms, ≥5 `e` samples) + AC-ES10b — **overruled Open Q#3's own
"not blocking" claim**; (3) two variable-table wording contradictions (`dwell` "uninterrupted" vs decay;
Rule 7 "up to" vs AC-ES19 exact) fixed at the table, not downstream; (4) `session:end` + retarget on the
same tick was unordered → `session:end` wins, zero RNG draws consumed, AC-ES58.

**Recommended applied (6):** AC-ES45/45b before/after rewrite (same vacuous-pass defect r2 fixed in
ES18/19); config-guard **acceptance** ACs (ES57b); reveal-mid-manifestation weighting (ES60); 3.52 m/s
ceiling restated as tuning-dependent (**safe-range maxima → 7.5 m/s**); audio asymmetry declared
deliberate + **Type B has no functional audio tell**; Open Q#1 delivery floor + Open Q#5 playtest checks.

**CD ruling — Rule 9 Type-C asymmetry = ACCEPTED ASYMMETRY, documented, NOT redesigned.** game-designer
and ux-designer converged from opposite sides (under-delivers the "sharpest edge" for A/B sessions /
leaks Type C identity). CD: the tell fires only at NEAR/ADJACENT inside a locked scan — inside the
window the fantasy already concedes — and symmetry is unaffordable. Real finding = delivery floor
(~20% of short sessions never roll Type C) → folded into Open Q#1 with a playtest design test.

**AC count 58 → 65** (56 Logic + 9 Integration). Verified no duplicate ids, counts match header.

**⚠ NEW cross-system item (found by the main session's structural pass, not a specialist):**
`entity:position` is in `entities.yaml` + Entity's Downstream table but **Point Cloud Renderer's GDD has
zero occurrences of it** (grep-confirmed). Round-2's sibling `entity:transform` got a systems-index
entry; this one was missed. Until Renderer records it, round-2's "structural gap closed" is still open
on the receiving end. Logged in systems-index Open Cross-System Items, owner Point Cloud Renderer.

**⚠ PROCESS — read before round 4.** Third consecutive round where the finding session also fixed. Two
defect classes have each slipped a manual pass repeatedly: (a) Coverage Validation completeness claim
(overclaimed r2 AND r3); (b) "declared invariant with no load guard" (r1 `dwell_half`, r2
`proximity_tier_medium_max`, r3 `I_min`/`I_max` + `SPEED_MAX`/`SPEED_BASE`). Standing caution now in the
GDD header. **Verify both classes directly — do not trust the document's own claims about them.**

**Next:** `/clear`, then `/design-review design/gdd/entity-system.md` fresh (**round 4**). Do NOT
self-approve. Remaining MVP GDDs awaiting independent re-review: Point Cloud Renderer (MAJOR REVISION
NEEDED, round 5), FPS Movement, Scan Mechanic, Win/Lose. Then `/gate-check pre-production`.

---

## Superseded — Point Cloud Renderer review (2026-07-17)

**Task:** Point Cloud Renderer (#?) review — **round 3 independent re-review done (2026-07-17), NEEDS
REVISION → all 11 blockers revised same session.** 5-agent panel (systems-designer, game-designer,
engine-programmer, performance-analyst, qa-lead) → creative-director synthesis. Headline: systems- AND
game-designer INDEPENDENTLY found the Type B detectability gap (round-2 sampler scoped to BASE-only →
ENTITY_SPIKE is a separate layer → Type B never fires). Fixes: (1) ρ_obs samples BASE+ENTITY_SPIKE,
Type C excluded [user decision]; (2) transparent:true for ghost/materializing; (3) σ payload emits
magnitude |σ| only (signed = type oracle); (4) "colour flickering" → Formula 5 same-green brightness
flicker [user decision]; (5) k_noise/A_tile + h/T div-zero guards (AC-D06 expanded, new AC-D07); (6)
AC-D03/E03 assert deterministic uJitter uniform; (7) customProgramCacheKey() for onBeforeCompile; (8)
AC-ST04/ST05 (Type A lifecycle + scale-1.0 fallback); (9) "active tiles" = frustum ∩
anomaly_sample_radius (12m knob); (10) Open Q6 merge-vs-jitter tension → ADR; (11) new Open Q7 min-spec
perf prototype (blocks ADR like Q1). Prose: fantasy → "no colour/label taxonomy"; Q5 relabelled
"growing-void escalation"; stale "Amber" Type B → green. **Doctrine amended** [user decision]:
WebGL-integration test tier in technical-preferences.md + coding-standards.md carve-out; AC-C08 keeps
BLOCKING. AC count 24→28. Full detail in `design/gdd/reviews/point-cloud-renderer-review-log.md`
(round-3 entry, top) + `production/worklog.md` (top).

**CD process condition:** the same-session fix-and-approve loop is what bred rounds 2 & 3's blockers.
**Fresh-context round-4 re-review REQUIRED — do NOT self-approve.** `systems-index.md` unchanged (Point
Cloud Renderer already Designed).

**Next:** `/clear`, then re-run `/design-review design/gdd/point-cloud-renderer.md` fresh (round 4).
Point Cloud ADR now gated on TWO prototypes: Q1 (occluder depth-cull) + Q7 (min-spec perf) + the
WebGL-integration harness (for AC-C08). Remaining MVP GDDs awaiting independent re-review: FPS
Movement, Scan Mechanic, Entity System, Win/Lose. Then `/gate-check pre-production`. All 9/9 MVP
systems remain Designed.

---

## Superseded — UI/HUD (#12) review (2026-07-15)

**Task:** UI/HUD (#12) review — **round 7 independent re-review done (2026-07-15), NEEDS REVISION →
revised same session.** 4 blockers found and fixed: (1) line-195 citation defect (AC-UH16–19 →
AC-UH16–18 for pool membership; UH19 tests tier-independence); (2) Rule 2 first-tick cold-start was
an undisclosed 2nd exhaustiveness exception — summary now names both; (3) AC-UH59's "no grid break at
any A-V2" was false (proved ratio invariance, not absolute size; A-V2 is floor-only, no ceiling) —
added an absolute font-size/container clamp + routed an A-V2 ceiling to accessibility-requirements.md
+ AC-UH59 extended to 2 parts; (4) Rule 10 "readable frame / reaction-fairness floor" overclaimed a
perceptual guarantee 16.6ms can't deliver — reworded throughout to "input-lockout / race-condition
guarantee" (mechanical claim kept, perceptibility reopened for /ux-design). AC count **60→60** (no
new AC). Secondary: Coverage Validation Rule 9 row now credits AC-UH54. `systems-index.md` status:
UI/HUD remains **In Review**, Approved gated on producer citation-hook. Full detail in
`design/gdd/reviews/ui-hud-review-log.md` (round-7 entry, top) and `production/worklog.md` (top).

**Decisive finding (creative-director):** 5 consecutive rounds with the citation-integrity class live
— including 2 instances through round 6's *dedicated* citation pass — proves manual review cannot
close this class. **No round-8 manual citation pass; do not mark Approved** until the **producer**
builds a mechanical citation-check enforcement hook (routed since round 3).

**Next:** The doc-side is complete on the authorable side — the real gate is the producer citation-hook.
Outside owners still pending: producer (citation-hook + Open Q#5 jsdom/harness), FPS Movement (Open Q#9
suspension + delayed-resume + interaction-patterns.md meta-pattern reconciliation), Audio GDD #6
(escalating-drone commitment). The other 5 MVP GDDs (Point Cloud Renderer, FPS Movement, Scan
Mechanic, Entity System, Win/Lose) still await their own independent re-reviews. Then re-run
`/gate-check pre-production`.

**All 9/9 MVP systems remain Designed** (since 2026-07-07/07-10) — this session's work was review,
not new design content.

(Older status lines below are historical — left in place rather than rewritten; see the "UI/HUD
(#12) — GDD COMPLETE" entry further down for the 2026-07-10 design-complete state, and the entry
above this note for the current, accurate state.)

## Scan Mechanic — GDD complete (2026-07-02, Desktop)
**Written & approved (all 8 + Open Questions):** Overview · Player Fantasy · Detailed Design ·
Formulas (systems-designer consulted) · Edge Cases · Dependencies · Tuning Knobs · Visual/Audio
Requirements · UI Requirements · Acceptance Criteria (41 ACs, qa-lead consulted) · Open Questions
(6 items).

**Key mechanics locked:** 5-phase sequence IDLE→INITIALIZING→CAPTURING(4 beats)→PROCESSING→
UPLOADING→IDLE; camera-lock covers only INITIALIZING+CAPTURING (2.4s), PROCESSING/UPLOADING
(2.0s) run unlocked — total 4.4s/scan; camera rotation reuses Point Cloud's `T`/`h` constants
(no new knobs); entityInFrame = proximity-tier proxy (NEAR/ADJACENT at any of 4 beat samples);
single-scan-in-flight; local already-valid tracking (no new subscription needed).

**Side effects / cross-file changes this session:**
- Amended `design/gdd/fps-movement.md` (States table + Interactions): new
  `movement:scan_released {}` exit from `SCAN_LOCKED` (successful-capture path); `scan:abort`
  still handles the abort path.
- `entities.yaml`: registered `movement:scan_released`, `scan:processing`, `scan:uploading`
  (provisional); registered `h` (hold fraction, Point Cloud-owned, previously unregistered) and
  added scan-mechanic.md to `scan_frame_duration`'s referenced_by.
- `systems-index.md`: Scan Mechanic → Designed, doc linked; MVP designed 5/9 → 6/9; docs started
  5 → 6.

**Open Questions logged (6):** two-nodes-in-range target selection (level-designer); entityInFrame
precision proxy-vs-frustum (Entity System #9 author); interact-keybind (ux-designer); abort/
processing SFX (sound-designer, `/asset-spec`); Depth-Only Preview §15-A explicitly out of scope
(producer); Movement Violation now reachable during unlocked phases (Win/Lose #10 author).

**NEXT:** `/design-review design/gdd/scan-mechanic.md` in a **fresh session** (never same-session
as authoring). Then continue the remaining MVP GDDs — Entity System (#9, high-risk) next per the
design order, then Win/Lose (#10), then UI/HUD (#12).

## Entity System (#9) — GDD complete (2026-07-02, Desktop)
**Written & approved (all 8 + Open Questions):** Overview · Player Fantasy · Detailed Design ·
Formulas (3 formulas + tuning constants, systems-designer consulted) · Edge Cases · Dependencies
· Tuning Knobs · Visual/Audio Requirements (art-director consulted, 2-round) · UI Requirements ·
Acceptance Criteria (46 ACs, qa-lead consulted) · Open Questions (7 items).

**Key resolution — RESOLVED the open cross-system item since 2026-06-27**: ratified the 4-tier
proximity vocabulary (FAR/MEDIUM/NEAR/ADJACENT), already hard-baked into Point Cloud Renderer +
Floor Plan, over the master GDD's 5-tier description. `proximity_tier_medium_max` (12.0m, new)
completes the FAR/MEDIUM boundary. systems-index Open Cross-System Items updated to reflect
resolution.

**Other key decisions:** one entity instance with mutable type (not 3 simultaneous pools); Type
C trails player's position history (4s lag) via its own ring buffer (mirrors Floor Plan's
desync pattern); Entity computes Floor Plan's registered `session_escalation` (e) locally from
shared inputs (no new event). Type C speed uses a cubic curve (matches `desync_delay` precedent:
safe until e≈0.815, then exceeds MOVE_SPEED); Type A growth uses a diminishing-returns curve
(asymptotic, decays not resets on leaving range); retarget cadence deliberately LINEAR (not
cubic) to avoid stacking all three e-driven changes into one late-session cliff.

**Side effects / cross-file changes:** `entities.yaml` — new `proximity_tier_medium_max`
constant; `entity-system.md` added to referenced_by of `MOVE_SPEED`, `entity_influence_radius`,
`proximity_tier_near`, `proximity_tier_adjacent`, `session_escalation`. `systems-index.md` —
Entity System → Designed (7/9 MVP), tier-vocab item marked RESOLVED.

**Open Questions logged (7):** type-selection probability at retarget unspecified (game-designer,
before Vertical Slice — flagged as materially affecting difficulty); entityInFrame proxy
implicitly ratified as the only option (informs Scan Mechanic Open Q#2); room-selection
weighting qualitative not formula (systems-designer); Type B "mimics objects" is art-direction's
(asset-spec time); all numeric defaults unplaytested (Vertical Slice); second simultaneous
manifestation out of scope for MVP (Alpha+); loop-teleport-into-Type-A coincidence (Floor Plan's
tuning, not this GDD's).

**NEXT:** `/design-review design/gdd/entity-system.md` in a fresh session. Then continue —
Win/Lose (#10) next, then UI/HUD (#12).

## Win/Lose & Ending (#10) — GDD complete (2026-07-02, Desktop)
**Written & approved (all 8 + Open Questions):** Overview · Player Fantasy · Detailed Design ·
Formulas (1 tuning constant, systems-designer consulted) · Edge Cases · Dependencies · Tuning
Knobs · Visual/Audio Requirements (brief, no pixels/audio of its own) · UI Requirements
(text-variation matrix, narrative-director consulted — 2-register STATUS split;
entityEverCaptured touches exactly one existing field, never a new line) · Acceptance Criteria
(30 ACs, qa-lead consulted) · Open Questions (4 items).

**Key decisions locked:**
- **Ending taxonomy**: 4 mutually-exclusive PRIMARY outcomes (`ESCAPE`, `COMPLETION_TRAP`,
  `MOVEMENT_VIOLATION`, `SCAN_CORRUPTION`) + `entityEverCaptured` as an independent text-modifier
  flag (NOT a 5th category) — reinterprets master GDD §10.
- **Completion Trap fires the instant `ANOMALY_FINAL` resolves VALID** (not literally
  "coverage=100%"); **Escape fires the instant the last standard node resolves VALID with
  anomaly still unscanned**; both fully automatic, no player-confirmed "end session" action.
- **Movement Violation** via `player:position` delta (0.045m threshold, range 0.035-0.070m),
  excludes frames where `floorplan:loop` also resolved.
- **Precedence**: `MOVEMENT_VIOLATION > SCAN_CORRUPTION > COMPLETION_TRAP > ESCAPE`.
  Single-fire guarantee mirrors Orchestrator's SEALED pattern.
- **Ending-screen text structure** (narrative-director consult): only 2 fields branch on
  outcome (coverage/nodesCompleted numeric pair + STATUS); STATUS is a 2-register split (not
  4-way) — Escape/Completion Trap must read identically to each other (the whole Inverted Reward
  mechanism); Movement Violation/Corruption share a different "interrupted" register, internally
  differentiated from each other only.

**Side effects:** `entities.yaml` — `coverage` and `corruption_threshold` referenced_by updated
to `win-lose-ending.md` (closing out comments that already anticipated this GDD). No new
constants/events needed — `movement_violation_threshold` is GDD-internal.

**Real gap surfaced, not silently patched**: the ending record `{primaryOutcome, coverage,
nodesCompleted, entityEverCaptured}` has **no `anomaliesLogged` field**, even though the UI
Requirements matrix references `ANOMALIES LOGGED: [X]` from the master GDD's template — logged
as Open Question #1, source system undecided (Point Cloud's `renderer:anomaly_density`? Entity
manifestation count? a new Win/Lose-owned tally?).

**Process note this session**: an early narrative-director consult on the text-variation matrix
was lost mid-relay (a fresh Agent spawn was used to "follow up" instead of resuming the original
via SendMessage+agentId — this created a genuinely new instance with no memory of the first
consult). Recovered by properly resuming the original agent by its agentId. Lesson: always use
SendMessage with the agentId to continue a specific prior agent, never a fresh Agent call.

**NEXT:** `/design-review design/gdd/win-lose-ending.md` in a fresh session. Then the last
remaining MVP GDD — **UI/HUD (#12)** — which will need to resolve the `anomaliesLogged` gap
above as part of its own design, plus finalize the terminal-screen copy this GDD deferred.

## UI/HUD (#12) — design session started (2026-07-07, resumed after an Obsidian-vault detour)
Skeleton created at `design/gdd/ui-hud.md`. Review mode: lean. This is the **last MVP system**.
Five sibling GDDs already lock most of this content (dollhouse view model, node ledger, scan
readout, proximity bar, ending screen text-variation matrix). One reconciliation flagged for
Section C: master GDD's "Tabs: Scan/Dollhouse/Log" phrasing vs. Floor Plan's later lock on the
dollhouse as a toggle-key, fullscreen-blocking panel (not a peer tab). Also must resolve
Win/Lose's `anomaliesLogged` gap and the deferred view-model transport mechanism (new bus event
vs. composition-root wiring) both Floor Plan's and Scan Node's ADRs left open.
**Written & approved:** none yet — skeleton just created.

Note: a separate/concurrent process extended `LS_obsidian_context/` significantly beyond what
this session built (71 pages, production history, QA, schema layer) — see that vault's own
`wiki/log.md` for its history. Not this session's doing past the initial 2026-07-05 pass.

**Key decisions locked so far:**
- **Ending taxonomy**: 4 mutually-exclusive PRIMARY outcomes (`ESCAPE`, `COMPLETION_TRAP`,
  `MOVEMENT_VIOLATION`, `SCAN_CORRUPTION`) + `entityEverCaptured` as an independent text-modifier
  flag (NOT a 5th category) — reinterprets master GDD §10's "text varies... entity captured or
  not" as one input among several to a single terminal screen, not a separate ending screen.
- **Completion Trap fires the instant `ANOMALY_FINAL` resolves VALID** — mechanically triggered
  by anomaly-node status, not literally "coverage=100%" (the two normally coincide but aren't
  the same check).
- **Escape fires the instant the last standard node resolves VALID with anomaly still unscanned.**
- **Session end is fully automatic** — no player-confirmed "end session" UI action; matches the
  "no warning, the game already knows" Player Fantasy thesis.
- **Movement Violation** detected via `player:position` delta (not a new raw-input event from
  FPS Movement) — `movement_violation_threshold=0.045m` (range 0.035-0.070m) — excludes frames
  where `floorplan:loop` also resolved (avoids false-positive on system-driven teleports).
- **Precedence order** if conditions coincide same-tick: `MOVEMENT_VIOLATION > SCAN_CORRUPTION >
  COMPLETION_TRAP > ESCAPE`.
- **Single-fire guarantee**: mirrors Orchestrator's SEALED pattern, no second outcome recorded.

**REMAINING (resume here):** Edge Cases → Dependencies → Tuning Knobs → Visual/Audio
Requirements → UI Requirements → Acceptance Criteria (qa-lead spawn, lean-mode Section H rule)
→ Open Questions → Phase 5 (self-check, registry update if needed, systems-index update to
Designed 8/9, offer `/design-review`).

**Not yet touched, worth remembering when resuming:**
- No registry updates made yet this GDD (movement_violation_threshold is GDD-internal per the
  systems-designer's own note — only register later if another GDD ends up referencing it).
- UI Requirements will need to define the actual terminal-screen text per outcome (§10's
  `UPLOAD COMPLETE` / `SCAN COVERAGE` / etc. template) — this is where the ending record
  (Core Rule 8) actually gets consumed.
- No cross-GDD amendments needed so far (unlike Scan Mechanic's FPS Movement amendment) — Scan
  Node, Entity System, Floor Plan, FPS Movement all already emit exactly what this GDD consumes.
**Key facts loaded before starting:** must confirm (not redefine) `movement:scan_triggered`,
`scan:started`, `scan:captured`, `scan:capture_frame` shapes (already provisional in
entities.yaml); must resolve Scan Node's Open Q#2 (`entityInFrame` source — Scan Mechanic vs
Entity System); owns `camera.rotation` writes during SCAN_LOCKED per ADR-0004 (FpsMovement's
update() no-ops on rotation while locked); Point Cloud's `scan_frame_duration`=0.5s/angle is
the pacing scaffold (4-angle capture ≈2.0s minimum) already registered.
**Resume**: continue the section cycle from wherever `[To be designed]` remains in the file.

## Architecture phase complete — 12/12 tasks (2026-07-02, Desktop)
- **ADR-0002 Point Cloud** (Proposed, OQ1 prototype-gated) · **0003 Per-Frame Budget** ·
  **0004 Movement+Input** (native PointerLock, not the addon) · **0005 Session Data** (one

## Architecture phase complete — 12/12 tasks (2026-07-02, Desktop)
- **ADR-0002 Point Cloud** (Proposed, OQ1 prototype-gated) · **0003 Per-Frame Budget** ·
  **0004 Movement+Input** (native PointerLock, not the addon) · **0005 Session Data** (one
  JSON/property, resolves Q#4/Q#3, unblocks Production) · **0006 Floor Plan** · **0007 Scan Node**.
  All Proposed except **ADR-0001 Accepted** (owner: only the round-4-reviewed one; rest await
  independent review).
- **Engine pinned**: `docs/engine-reference/three/VERSION.md` r171; CLAUDE.md repointed.
- **Re-review FAIL→CONCERNS**: `architecture-review-2026-07-02-rerun.md`, `traceability-index.md`
  (42/42 covered, 0 cross-ADR conflicts).
- **test-setup**: tests/unit+integration, vitest green, `.github/workflows/tests.yml`
  (verify:registry + npm test). ESLint zone rule deferred to first src/systems/**.
- **ux-design**: `design/ux/accessibility-requirements.md` (⚠️ A-V3 photosensitivity flag) +
  `interaction-patterns.md`.
- **gate-check pre-production: FAIL** — `production/gate-check-pre-production-2026-07-02.md`.
  Infra/architecture green; blocked on design-phase work.
- **NEXT:** `/design-system` **Scan Mechanic (#8)** first (Point Cloud/FPS/Scan Node reference
  its events provisionally), then Entity (#9), Win/Lose (#10), UI/HUD (#12); approve Point
  Cloud + FPS Movement GDDs; ADRs for the 4 + flip all → Accepted; re-run architecture-review.

## `/architecture-review` (full) — completed (2026-07-02, Desktop)
- **42 TRs baselined** in `tr-registry.yaml` (v2; slugs pc/mov/fp/sn/or). Coverage **4 ✅ / 5 ⚠️ / 33 ❌**.
  Only ADR-0001 exists (covers TR-or-006/007/008/009 + partials).
- **3 blockers:** (1) ADR-0001 `Proposed` not `Accepted` → bus stories auto-blocked; (2) Foundation
  layer (Point Cloud incl. HIGH r171 depth-occluder OQ1, + FPS Movement) has **no ADR**; (3) **no
  Three.js engine reference** — CLAUDE.md + engine-reference/ still say Godot 4.6, r171 unpinned.
- No cross-ADR conflicts (1 ADR). No GDD revision flags. Engine-specialist consult skipped (ADR-0001
  has no engine API surface).
- **Files written:** `docs/architecture/architecture-review-2026-07-02.md`, `.../traceability-index.md`,
  `.../tr-registry.yaml` (v2).
- **Required ADRs (priority):** 1. Point Cloud Renderer arch (HIGH, resolve OQ1); 2. per-frame budget
  (MED); 3. kinematic movement + PointerLock (LOW); 4. session data + node-position pipeline (LOW,
  blocks Production); 5. Floor Plan + Scan Node ADRs.
- **Pre-gate all ❌:** no tests/, no CI workflow (→ `/test-setup`); no accessibility-requirements.md,
  no interaction-patterns.md (→ `/ux-design`). `/gate-check pre-production` unavailable.
- **NEXT:** `/architecture-decision` for Point Cloud Renderer (fresh session), then re-run
  `/architecture-review`. Independently: flip ADR-0001 → Accepted; run `/test-setup` + `/ux-design`.

## Orchestrator round-4 review + ADR-0001 — completed (2026-07-02, Desktop)

## Orchestrator round-4 review + ADR-0001 — completed (2026-07-02, Desktop)
- **Round 4 APPROVED, 0 blockers.** Entry condition re-confirmed (`npm run verify:registry` 14/0/5).
  2 addenda applied: (1) AC-OR01 evidence note — verify-registry checks TOP-LEVEL fields only
  (nested rename passes silently; sufficient today); (2) Rule 4 `groupAnchorIndex` pinned single-pass
  (O(1) claim was O(group-size) naively). OQ9 scope expanded (queue bound + render ordering).
  **New OQ10**: pure-atomic chains n≥3 undefined — cannot fire today, design-gate on Entity/Win-Lose.
- **ADR-0001 written** (`docs/architecture/adr-0001-orchestrator-bus-wiring.md`, Proposed):
  (a) manual composition root (main.js injects bus); (b) `src/core/event-overrides.js` data module
  compiled once at construction; (c) ESLint `import/no-restricted-paths` enforces Core Rule 5;
  (d) delivery pass BEFORE `renderer.render()` + dev perf-tripwire (queue > 64). 5 stances written to
  `docs/registry/architecture.yaml`.
- **NEXT:** `/architecture-review` in a **FRESH session** (never same-session as ADR authoring) to
  validate + move ADR-0001 to Accepted. OR `/design-system` Scan Mechanic (#6, MVP). Stories that
  reference ADR-0001 stay auto-blocked until it is Accepted.

## Orchestrator round-3 review — completed (2026-07-02, Desktop)
- **6 blockers fixed** (see worklog top entry for full detail): floorplan:loop toRoom drift +
  Core Rule 1 precedence clause; scan:integrity_* payloads declared; false "zero deltas" note
  corrected; Rule 4 mixed-group intraGroupRank defined + AC-OR33; arrival-index defined
  (publish-time, next-tick deferral) + subscribe() reentrancy + AC-OR29 re-targeted;
  elapsedSeconds = capped-dt (dt_cap 0.1s) + AC-OR34 + OQ9. AC 32 → 34.
- **verify-registry tooling built** — `tools/verify-registry.mjs` (`npm run verify:registry`),
  OQ6 RESOLVED. Passes **14/0/5**. Caught + fixed 2 more drifts (scan:complete subset,
  renderer:anomaly_density 3-way) that 3 manual rounds missed. `--selftest` = 9 assertions.
- **KEY decisions locked:** toRoom kept (CD ruling); mid-delivery publish → next-tick deferral;
  atomic-only override members inherit partner rank.
- **NEXT:** either round-4 re-review (`/clear` first, run `npm run verify:registry` as evidence)
  OR `/design-system` Scan Mechanic (#6, MVP). Round 4 should be short.

## Orchestrator Phase 5 completed (2026-07-01)
- entities.yaml: NEW `events:` section, 19 events w/ producer/consumers/payload/kind
  (latest-value vs discrete). 3 are Orchestrator-owned (session:tick/end/request_end);
  5 provisional (Scan Mechanic #8, Entity #9 undesigned). YAML validated (parses clean).
- systems-index: Orchestrator #7 row → Designed, tracker 5/9 MVP.
- floorplan:init 2nd-fire decision: REJECT (AC-OR21) — protects Scan Node roster invariant.
- Open Q logged: provisional-flag cleanup on 4 sibling GDDs (post-approval), Win/Lose
  trigger source, entity tier vocab, Rule-5 lint tooling.
- NEXT: `/design-review design/gdd/orchestrator.md` in a FRESH session. Then Scan
  Mechanic (#6), Entity (#9). Consider `/consistency-check` (new events section).

## [prior] Orchestrator authoring — DONE
**Status:** Floor Plan + Scan Node both Approved. Consistency-check PASS (0 conflicts, 5 GDDs).
Orchestrator authoring in progress via `/design-system` — resume from Acceptance Criteria.
**File:** `design/gdd/orchestrator.md`
**Review date:** 2026-07-01

## Orchestrator authoring — RESUME HERE
**Written & approved (7):** Overview · Player Fantasy (pure infra) · Detailed Design (7 Core
Rules, LOADING/ACTIVE/SEALED lifecycle, per-frame ordering, full Interactions table) ·
Formulas (N/A, relay only) · Edge Cases (9) · Dependencies · Tuning Knobs (no gameplay knobs,
2 dev toggles).
**STILL `[To be designed]` (resume in this order):**
1. **Visual/Audio Requirements** — likely brief N/A (no pixels/audio; pure infra). Confirm + write.
2. **UI Requirements** — likely brief N/A (no UI surface). Confirm + write.
3. **Acceptance Criteria** — THE real remaining work. Spawn `qa-lead` (lean mode Section H
   high-risk rule). Need testable GIVEN/WHEN/THEN for: 7 Core Rules, session lifecycle
   transitions, per-frame ordering + registered overrides, latest-value cache vs discrete
   (Core Rule 7), post-SEAL drop, `session:request_end` single-fire, unknown-event drop.
4. **Open Questions** — incl. the provisional-flag-cleanup follow-up (remove "⚠️ Provisional —
   Orchestrator undesigned" from the 4 sibling GDDs once this is Approved) + session-end
   trigger source (Win/Lose undesigned) + entity:proximity tier set (Entity #9 owns).
**Then Phase 5:** register event-family in `entities.yaml`, self-check, update systems-index
(#5 → Designed/In Review), then `/design-review` in a FRESH session.

**Key Orchestrator design decisions locked in:** registration-not-invention (names/shapes from
the 4 sibling GDDs verbatim); sole owner of session lifecycle; `session:request_end{reason}`
decouples "who decides game-over" from enforcement; Global FIFO + registered per-pair ordering
overrides; latest-value-cache vs discrete-fire-and-forget (Core Rule 7) for late subscribers;
`session:tick`/`session:end` newly Orchestrator-owned (nothing produced them before).

## Orchestrator context gathered (Phase 2)
- No existing Orchestrator GDD, no ADRs, no game-pillars.md (LAST_SCAN_GDD.md serves
  as the concept doc for this project).
- Full event-family table compiled from 4 sibling GDDs' Interactions sections —
  see conversation for the complete producer/consumer map (`player:position`,
  `session:tick`/`session:end` — consumed by Floor Plan, nothing produces them yet,
  `entity:proximity`, `scan:*` family incl. canonical `scan:coverage`,
  `floorplan:*` family, `movement:scan_triggered`, `renderer:anomaly_density`).
- Open item to respect: `entity:proximity` tier set (4 vs 5) is Entity System (#9)'s
  decision, not Orchestrator's — accommodate, don't decide.
- Open item to respect: Scan Node's Cross-System Invariants table already names
  `scan:coverage` canonical over `scan:complete.coverage` — Orchestrator must not
  re-litigate this.

## Prior work this session (2026-07-01)
- Floor Plan System (#3): round 4 independent re-review — **Approved**, unanimous.
- Scan Node System (#4): rounds 1-4 (MAJOR REVISION → NEEDS REVISION ×2 → **Approved**,
  unanimous). Cross-GDD fix landed in Floor Plan (AC-E17). Full history in both
  review logs under `design/gdd/reviews/`.
- `/consistency-check` — PASS, 0 conflicts, 5 GDDs scanned.

## Scan Node round 4 (2026-07-01) — APPROVED, unanimous
- All 4 specialists independently returned APPROVED — first unanimous verdict in 4 rounds.
  Genuine convergence: each re-derived/spot-checked round 3's fixes against source rather than
  re-reading prose (systems-designer re-ran full formula sweep; game-designer independently
  opened gate-check's SKILL.md to confirm DEFERRED table has zero tooling enforcement).
- AC-SN29's extension confirmed to genuinely close the canonical-equality gap. DEFERRED
  design/implementation split confirmed correctly applied to all 3 deferred ACs.
- Recurring arc-long defect ("assert the what, don't prove the how") confirmed closed.
- 1 tracked fast-follow (non-blocking): Edge Case 11 (same-frame scan:captured race) — behavior
  fully specified, only the AC test is missing. Not a re-review trigger.
- Status headers + systems-index updated to Approved.
- Legacy note recorded in review log: Cross-System Invariants table + DEFERRED
  design/implementation split should generalize to Orchestrator (#5), the next hub doc.

## Scan Node round 3 (2026-07-01) — NEEDS REVISION, revised same session
- All round-2 fixes independently re-verified genuinely closed (AC-SN22 event-name checked
  against Floor Plan's actual AC-D01 text; trust-ordering + Invariants-table contradiction
  confirmed closed, not relocated).
- **Blocking**: AC-SN29 cited as proof `scan:coverage`=`scan:complete.coverage` but never
  actually tested that (only tested `scan:complete` freshness) — 4th recurrence of "assert the
  what, don't prove the how." CD resolved game-designer's APPROVED vs systems-designer's
  BLOCKING tension: design-review verdicts grade the document, not just the design underneath.
  Fixed: AC-SN29 extended to assert both events' payloads identical same-cycle.
- Process fix (3 specialists converged): DEFERRED had no Owner/Resolve-when, no design-vs-
  implementation distinction. New DEFERRED-tracking table added (AC-SN22/31 = design-blocked,
  AC-SN30 = implementation-blocked — can be written first, not gated behind other GDDs).
- D-1 "Auto-Typed Log" reworded — inherits master GDD's "only in-world counter-signal" framing
  instead of reading as one of three equal candidates.
- systems-index.md: new entry carrying AC-SN31 + Trust-ordering forward to UI/HUD (#12),
  explicit "no measurable proxy yet" warning.
- Out of scope: Win/Lose ending-delivery gap for Anchor Moment — 4 systems downstream.

## Scan Node round 2 (2026-06-30, same day) — NEEDS REVISION, revised same session
- Round-1 headline fix (Floor Plan AC-E17) independently re-verified genuinely closed
  (systems-designer recomputed from scratch).
- **Blocking #1**: `scan:coverage` vs `scan:complete.coverage` — two BLOCKING ACs (Floor Plan
  AC-D01, Scan Node AC-SN22) asserted different canonical coverage sources. Fixed: `scan:coverage`
  named canonical, AC-SN22 corrected, new Invariants rows for canonical-source + level-not-delta.
- **Blocking #2** (found independently by 3/4 specialists): co-location fix solved
  discoverability, not trust-valence — "12/12" reads as more "done" than "92.3%" (integer-
  completeness bias). Fixed: `coverage` specified as visually dominant/trust-bearing,
  `nodesCompleted` secondary — new AC-SN31 (DEFERRED) tracks it.
- User decision: D-1 "Auto-Typed Log" kept, re-added to Open Q#5 (silently dropped 2 rounds).
- New AC-SN30 (DEFERRED): composition test for Floor Plan AC-E17 × Scan Node's S-formula seam
  through real payload-construction code (qa-lead's "individually-correct-rules-don't-compose"
  pattern, now confirmed at 3 scales: within-GDD, cross-GDD rules, cross-GDD tests).
- Floor Plan amended again: chained-reveal Edge Case wording fixed (accidentally barred trap
  node from ever living behind a chain — corrected to bar only duplication). Wording-only,
  no re-review needed.
- AC: 23→26. Named pattern for future rounds: "requirement's location fixed before content."

## Scan Node first review (2026-06-30) — MAJOR REVISION, revised same session
- Pattern named by CD: "blockers live at the inheritance boundary" — every blocking finding
  was Scan Node failing to inherit/cross-reference a precedent already established in a
  sibling doc (Floor Plan, or the master GDD), not an internal logic flaw.
- **Cross-GDD fix**: Floor Plan amended with AC-E17 (exactly one ANOMALY_FINAL node enforced
  at load) — Scan Node's `S=count(STANDARD)+1` formula assumed this but Floor Plan never
  guaranteed it (AC-E07 chained reveals technically allowed ≥2). Propagated into Floor Plan's
  own `w_t≤0.8` safety guarantee. No Floor Plan re-review needed (additive guard only).
- New **Cross-System Invariants** block (mirrors Floor Plan's Interaction Matrix, pointed
  outward at sibling docs).
- UI Requirements: co-location constraint (nodesCompleted/coverage), inherited non-colour
  accessibility requirement, GDD-level early-game framing requirement.
- Open Q#5: entityCaptured cross-referenced to master GDD §15-D3/§16-J2 (was orphaned).
- AC: 22→23 (AC-SN29 ordering guarantee added; AC-SN21 rewritten to test only Scan Node's own
  emission contract; AC-SN04/15/16 tightened).

## Round 3 revisions (2026-06-30) — user decisions
- `w_t` capped 0.8 (`w_c≥0.2`) — closes "D_max only via trap" loophole
- COOLDOWN×anomaly-reveal race → **queues** (doesn't override timer)
- Dollhouse access paradigm → **toggle key**, locked at GDD level
- New **Interaction Matrix** subsection — structural fix for the 3-round recurring pattern
  (every blocker so far = interaction between two individually-correct rules)
- AC: 34→43 (added C08, D08, L10–L12, E12–E15; reworked C03/D06/L01/E09)
- Bug fixes also landed this session: BUG-0001/0002/0003 (dt cap, focus-loss key clear,
  HUD initial value) — `src/main.js`, status "Fix Applied — Pending Manual Verification"

## Round 4 (2026-06-30, same day) — APPROVED-WITH-CONDITIONS → closed
- 4 specialists independently re-derived all 3 round-3 blockers as genuinely closed
  (systems-designer recomputed each from scratch)
- 1 condition: `dollhouse-open` state added in round 3 never ran through the Interaction
  Matrix built that same pass — process gap (ux-designer). Fixed: new Matrix row + UI
  Requirements bullet (panel fullscreen-blocking, world sim does NOT pause while open —
  intentional vulnerability) + AC-E16
- 4 cheap riders bundled: AC-L13 (proximity COOLDOWN re-arm), Matrix row 7 reworded to
  match AC-L03 scope, concrete `desync_delay≈3.47s` number for pacing note, Player
  Fantasy reconciliation paragraph moved inline
- AC: 43→45. **Floor Plan System status: Approved.** systems-index + review-log updated.

## Immediate Next

1. `/clear` → `/design-review design/gdd/scan-node-system.md` — independent re-review
   (revisions applied this session, log exists at scan-node-system-review-log.md)
2. `/consistency-check` across all 4 designed GDDs (re-check AC-E17, Cross-System Invariants)
3. `/design-system` Orchestrator (#5)
4. Manually verify BUG-0001/0002/0003 in a real browser — still pending
4. Manually verify BUG-0001/0002/0003 in a real browser (PointerLock needs user gesture, sandbox preview can't do it) — close or reopen accordingly

## Floor Plan Contract Revisions Applied

- Added one-time `floorplan:init` containing the complete internal node roster and
  room mapping, including hidden ANOMALY_FINAL/NULL metadata but no hidden geometry.
- `floorplan:update` now carries renderable geometry only and fires on init/reveal/
  actual geometry mutation; loop teleports do not rebuild BASE.
- Scan Node now initialises from `floorplan:init`; later geometry updates cannot
  change roster size or the fixed coverage denominator.
- Declared provisional inbound contracts: `player:position`, `session:tick`,
  `scan:coverage`, `scan:started`, `scan:complete`, `scan:abort`,
  `entity:proximity`, and `session:end`.
- Split desync implementation into:
  - timestamped position ring buffer sampled at `now − desync_delay(now)`;
  - discrete scan-state queue using delay snapshotted at event time.
- Dollhouse freshness now repeats `CURRENT → STALE → CURRENT` per completed node;
  room freshness is stale while any child update is pending.
- Weight semantics are absolute (`w_t + w_c = 1`); out-of-sum non-zero configs fail
  validation, both-zero falls back to 0.5/0.5 with warning.
- Formula remains cubic: `desync_delay = D0 + (D_max − D0) × e³`.
- Registry `desync_delay` configurable output envelope corrected to 0–120s.

## Review Position

- Prior full review (2026-06-27): `MAJOR REVISION NEEDED` — emotional/design blockers addressed.
- Solo re-review (2026-06-28): `NEEDS REVISION` — 6 cross-system/implementability blockers addressed.
- Floor Plan remains `In Review`; it is **not Approved** until a fresh independent re-review passes.

## GDD Progress

- MVP designed: **4 / 9**
  - Point Cloud Renderer
  - FPS Movement
  - Floor Plan System (in review)
  - Scan Node System
- MVP not started: Orchestrator, Scan Mechanic, Entity, Win/Lose, UI/HUD
- Design docs approved: **0**

## Open QA / Repository State

- Open reports: `BUG-0001`, `BUG-0002`, `BUG-0003` under `production/qa/bugs/`.
- `production/qa/`, `.agents/`, `.codex/`, and `AGENTS.md` remain untracked until explicitly committed.
- No `tests/` directory exists yet.

---

## UI/HUD (#12) — GDD COMPLETE (2026-07-07, Desktop)

**All 9/9 MVP systems are now Designed.** This closes out the MVP design pass this session (and
the several before it) was working toward.

**Written & approved (all 8 + Open Questions):** Overview · Player Fantasy · Detailed Design (9
Core Rules, 3 States: `HUD_ACTIVE`/`DOLLHOUSE_OPEN`/`TERMINAL`) · Formulas (`coverage_dominance_ratio`,
systems-designer consulted) · Edge Cases (7) · Dependencies · Tuning Knobs · Visual/Audio
Requirements (art-director consulted) · UI Requirements · Acceptance Criteria (48 ACs — 24
BLOCKING Logic + 15 BLOCKING Integration + 9 ADVISORY, qa-lead consulted) · Open Questions (4
items).

**Key decisions locked:**
- No literal "tab" metaphor: always-visible HUD instrument view + one toggle-modal (Dollhouse,
  fullscreen-blocking, occludes the HUD entirely — DOM removal, not z-index hiding). Log panel
  explicitly out of scope (no designed content exists for it yet).
- View-model transport: composition-root DI + per-render-tick polling of existing
  `get*ViewModel()` methods — resolves the transport question both Floor Plan's ADR-0006(g) and
  Scan Node's ADR-0007(h) deferred. Recorded as a recommendation for this system's own future ADR,
  not yet formalized.
- `coverage_dominance_ratio` (default 1.5×, range 1.3×–1.75×, new tuning knob) gives Scan Node's
  previously-`DEFERRED` `AC-SN31` a measurable proxy (font-size ratio + DOM/reading-order
  precedence) — first concrete resolution after 2 sibling GDDs carried it forward as prose only.
- `anomaliesLogged` (Win/Lose's flagged gap) = session-cumulative count of
  `renderer:anomaly_density` events, tallied by UI/HUD itself, frozen at the `SEALED` snapshot.
- Audio-alert dedup: `renderer:anomaly_density` and escalation-relevant `entity:proximity` tier
  changes landing in the same tick fire the audio sting once, not once per event; visual display
  stays independent per event. Either event type landing the same tick as `SEALED` fires no tone
  at all — Rule 7's freeze wins.

**Mid-session numbering bug (self-caught and fixed):** a Core Rule insertion was initially placed
out of order (labeled "7b" before the existing Rule 7). Fixed by removing the misplaced insertion
and re-appending it as a properly-numbered Rule 9 after the existing Rule 8, preserving Rules 1–8
exactly as originally written.

**Side effects / cross-file changes this session:**
- `systems-index.md`: UI/HUD row → Designed, doc linked (`design/gdd/ui-hud.md`); MVP designed
  8/9 → **9/9**; docs started 8 → 9; both UI/HUD Open Cross-System Items marked RESOLVED
  (denominator divergence confirmed as intentional, AC-SN31 given its measurable proxy).
- No `entities.yaml` registry update — `coverage_dominance_ratio` is single-GDD, no cross-system
  reuse, per the systems-designer's own note during the Formulas consult.

**NEXT:** Offer `/design-review design/gdd/ui-hud.md` in a **fresh session**. Beyond that, the
project's next milestone is independent review of the 6 still-unreviewed MVP GDDs (Point Cloud
Renderer, FPS Movement, Scan Mechanic, Entity System, Win/Lose, UI/HUD), then a
`/gate-check pre-production` re-attempt — all 9 MVP systems being Designed was the blocking
criterion the prior gate-check FAILed on.

<!-- CONSISTENCY-CHECK: 2026-07-01 | GDDs checked: 5 | Conflicts found: 0 | Verdict: PASS -->
