# Active Session State

**Task:** Orchestrator (#5) GDD — **7 of 8 required sections written**, paused for quicksave
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

<!-- CONSISTENCY-CHECK: 2026-07-01 | GDDs checked: 5 | Conflicts found: 0 | Verdict: PASS -->
