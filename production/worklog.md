# LAST SCAN — Work Log

Cross-machine running log. Newest entry on top. Updated on every `quicksave`
(see CLAUDE.md → Quicksave Protocol). Read the top entry first when resuming on
any machine.

---

## 2026-07-02 (architecture phase) — 6 ADRs written, review FAIL→CONCERNS, pre-prod gate FAIL

**What got done (this session, Desktop):** ran the full 12-task architecture backlog the
first `/architecture-review` (FAIL) surfaced. Owner drove it in "approve per ADR/artifact"
cadence (collaboration protocol relaxed for this run). **All 12 tasks complete.**

**Delivered:**
1. **Engine pinned** — `docs/engine-reference/three/VERSION.md` (r171); CLAUDE.md Engine
   Version Reference repointed from Godot → Three.js (fixes the governance gap).
2. **6 new ADRs** (all `Proposed` unless noted):
   - ADR-0002 Point Cloud Renderer — layer stack, BASE_SEALED accretion, Type A depth-only
     occluder **prototype-gated on OQ1 (r171, HIGH)** → stays Proposed until prototype passes.
   - ADR-0003 Per-Frame Budget — 16.6ms split, ~8ms CPU soft budget + GPU point-draw ceiling,
     dev frame monitor + queue tripwire.
   - ADR-0004 Movement + Input — FpsMovement(bus,camera,config), injected-dt update(),
     **native PointerLock API (not PointerLockControls)** so GDD formulas/ACs stay testable.
   - ADR-0005 Session Data Pipeline — one JSON per property (`data/properties/<id>.json`),
     single source w/ both estimated+authoritative node positions; Matterport tooling deferred.
     **Resolves Scan Node Q#4 / Floor Plan Q#3; unblocks Production.**
   - ADR-0006 Floor Plan — two-contract init, pure dollhouse mask, 2 desync structures
     (ring buffer + scan-state queue), per-door loop FSM + crossing detector; view-model
     transport deferred to UI/HUD ADR (preserves Core Rule 5).
   - ADR-0007 Scan Node — Map registry, coverage=V/S pure derivation (no cached counter),
     synchronous state-before-emit (AC-SN29), nodesCompleted vs coverage divergence.
3. **ADR-0001 → Accepted** (owner chose: only the round-4-reviewed one; 0002–0007 stay
   Proposed pending independent review).
4. **Re-run `/architecture-review`: FAIL → CONCERNS.** Coverage 4/5/33 → **42/42**, 0
   cross-ADR conflicts, engine consistent. Reports: `architecture-review-2026-07-02-rerun.md`,
   updated `traceability-index.md`.
5. **`/test-setup`** — tests/unit + tests/integration, smoke test green (vitest 1 passed),
   `.github/workflows/tests.yml` (npm ci → verify:registry → npm test). ESLint zone rule
   deferred until src/systems/** exists (ADR-0001c).
6. **`/ux-design`** — `design/ux/accessibility-requirements.md` (flags **A-V3 photosensitivity**:
   point-cloud flicker/jitter needs flash ceiling ≤3/s + reduced-distortion toggle) +
   `design/ux/interaction-patterns.md` (meta-pattern: the Vulnerable State).
7. **`/gate-check pre-production`: FAIL** — `production/gate-check-pre-production-2026-07-02.md`.
   Infra/architecture criteria (4–8) all green; blocked on **design-phase** work.

**Pre-production gate blockers (next phase):**
1. Design the **4 remaining MVP GDDs** — Scan Mechanic (#8), Entity (#9, high-risk),
   Win/Lose (#10, inverted-reward ending), UI/HUD (#12, owns deferred view-model transport).
2. Design-review + approve Point Cloud + FPS Movement (still "In Design").
3. ADRs for the 4 new systems + UI/HUD view-model transport; flip all system ADRs → Accepted
   (incl. ADR-0002 after OQ1 prototype).
4. Re-run `/architecture-review` → PASS.

**NEXT:** `/design-system` **Scan Mechanic (#8)** first — Point Cloud/FPS/Scan Node all
already reference its events (`scan:started`/`scan:captured`/`scan:capture_frame`/
`movement:scan_triggered`) as provisional upstream. Then Entity, Win/Lose, UI/HUD.

---

## 2026-07-02 (later session) — First `/architecture-review` (full): FAIL, ADR backlog established

**What got done (this session, Desktop):** ran the first full `/architecture-review`. It's the
gate between Technical Setup and Pre-Production. Loaded all 5 designed GDDs (Point Cloud, FPS
Movement, Floor Plan, Scan Node, Orchestrator) + the lone ADR-0001. TR registry was empty → this
run **establishes the requirements baseline: 42 TR-IDs** now in `tr-registry.yaml` (v2).

**Verdict: FAIL** — not a knock on the GDDs (they're rigorous), but the skill's definition:
Foundation + Core layer requirements are uncovered and the one ADR isn't Accepted.
- Coverage: 42 TRs → **4 ✅ / 5 ⚠️ / 33 ❌**. Only ADR-0001 exists, covering the Orchestrator's
  4 wiring decisions (TR-or-006/007/008/009) + partial touches on 5 more.
- **3 blocking issues:** (1) ADR-0001 is `Proposed`, not `Accepted` → all bus-dependent stories
  auto-blocked; (2) Foundation layer (Point Cloud Renderer incl. the HIGH-risk r171 depth-occluder
  OQ1, + FPS Movement) has zero ADR coverage; (3) **no Three.js engine reference exists** —
  `CLAUDE.md` + `engine-reference/` still describe Godot 4.6; r171 is pinned nowhere.
- **No cross-ADR conflicts** (only 1 ADR). **No GDD revision flags.**
- **Engine-specialist consultation skipped** (justified): ADR-0001 has "no engine API surface"
  (its own Knowledge Risk = LOW) — nothing for a specialist to challenge. Re-enable once a
  rendering ADR with real Three.js surface exists.

**Required ADRs (prioritised, in the report):** 1. Point Cloud Renderer arch (HIGH, resolve OQ1);
2. Per-frame budget allocation (MEDIUM); 3. Kinematic movement + PointerLock (LOW); 4. Session data
+ authoritative node-position pipeline (LOW, blocks Production — Scan Node Q#4 / Floor Plan Q#3);
5. Floor Plan + Scan Node system ADRs. Plus: pin the engine (add `engine-reference/three/VERSION.md`
r171, fix CLAUDE.md pointer) and flip ADR-0001 → Accepted.

**Files written (user approved all three):**
- `docs/architecture/architecture-review-2026-07-02.md` — full report.
- `docs/architecture/traceability-index.md` — coverage index + full 42-row matrix.
- `docs/architecture/tr-registry.yaml` — populated v2, 42 stable TR-IDs (pc/mov/fp/sn/or slugs).

**Pre-gate checklist — all ❌:** no `tests/unit`+`tests/integration`, no `.github/workflows/tests.yml`
(→ `/test-setup`); no `design/ux/accessibility-requirements.md`, no `design/ux/interaction-patterns.md`
(→ `/ux-design`). `/gate-check pre-production` not yet available.

**NEXT:** write the missing ADRs in fresh sessions (`/architecture-decision`), starting with Point
Cloud Renderer (Foundation, HIGH). Re-run `/architecture-review` after each to watch coverage climb.
Independently: flip ADR-0001 → Accepted; run `/test-setup` + `/ux-design` to clear the pre-gate ❌s.

---

## 2026-07-02 — Orchestrator round-4 `/design-review`: APPROVED + ADR-0001 (bus wiring) written

**What got done (this session, Desktop):** ran the round-4 independent `/design-review` on
Orchestrator (#5) — same 5 agents (systems-designer, qa-lead, lead-programmer, engine-programmer +
creative-director synthesis). Round-4 entry condition re-confirmed (`npm run verify:registry` → 14/0/5).
Verdict **APPROVED**. Then wrote **ADR-0001** resolving the OQ7/OQ9 implementation-architecture
deferrals. **Orchestrator is now Approved (MVP designed 5/9, approved 3/3 reviewed).**

**Round-4 review outcome (APPROVED, 0 blockers)**
- No new Core-Rule contradiction; all sibling-AC citations (AC-L09, AC-C06, AC-SN29, AC-E02) verified.
- 2 one-sentence **addenda applied same session**: (1) AC-OR01 evidence note gained a scope caveat —
  `verify-registry` checks **top-level** field names only (collapses `roomMeta:[{id,type}]` →
  `roomMeta`), so 14/0/5 proves top-level parity + self-contradiction absence, NOT nested parity
  (sufficient today; qa-lead find); (2) Rule 4 `groupAnchorIndex` pinned as a **single-pass** min
  (one Map populated during the queue snapshot) — the doc's O(1)/"no graph work in frame budget"
  claim was O(group-size) under a naive read (lead-programmer find).
- **OQ9 scope expanded** (engine-programmer): the ADR must also bound per-tick queue size + pin
  delivery-vs-`renderer.render()` ordering. **New OQ10**: pure-atomic override chains n≥3 (no directed
  edge) are undefined — CANNOT fire today (live bridge `scan:complete` is mixed) → design-gate on
  whichever future GDD (Entity/Win-Lose) first registers a 3-way atomic requirement.
- Specialist disagreement surfaced (OQ9 severity: lead-programmer non-blocking vs engine-programmer
  more-serious) → CD: lead-programmer for approval, engine-programmer for the ADR.

**ADR-0001 — Orchestrator Bus Wiring & Override-Table Storage (Proposed)**
Four decisions (all user-confirmed via widget):
- (a) **Manual composition root** — `src/main.js` constructs the one Orchestrator, injects `bus` via
  constructor (class modules) / `init(bus)` (flat modules). Rejected singleton + service-locator.
- (b) **Dedicated data module** `src/core/event-overrides.js` — hand-authored JS literal compiled once
  at construction ("compiled once" = module-load). Rejected entities.yaml codegen (no Vite codegen step).
- (c) **ESLint `import/no-restricted-paths`** zone rule (CI) enforces Core Rule 5 — no sibling
  `src/systems/**` imports. Rejected review-checklist-only (not a forcing function).
- (d) **Delivery pass BEFORE `renderer.render()`** every rAF frame (no one-frame lag for tick-driven
  visuals) + dev **perf-tripwire** warn at queue > 64/tick. Closes OQ8's render-ordering question.
- Registry: 5 stances written to `docs/registry/architecture.yaml` (event_bus interface; 2 forbidden
  patterns: direct_cross_system_import + module_singleton_bus; 3 api_decisions; orchestrator ≤0.3ms/frame
  + 60fps/16.6ms budget).

**Files touched:** orchestrator.md, systems-index.md, orchestrator-review-log.md (new round-4 entry),
docs/architecture/adr-0001-orchestrator-bus-wiring.md (NEW), docs/registry/architecture.yaml.

**Immediate next step:** ADR-0001 is `Proposed` — run **`/architecture-review` in a FRESH session**
(never same-session as authoring) to validate coverage and move it toward `Accepted`. OR proceed to
`/design-system` **Scan Mechanic (#6)**, next in design order. Stories referencing ADR-0001 stay
auto-blocked until it is `Accepted`.

---

## 2026-07-02 — Orchestrator round-3 `/design-review`: NEEDS REVISION → 6 blockers fixed + verify-registry tooling built

**What got done (this session, Desktop):** ran a full independent round-3 `/design-review` on
Orchestrator (#5) — 4 adversarial specialists (systems-designer, qa-lead, lead-programmer,
engine-programmer) + creative-director synthesis. Verdict **NEEDS REVISION (6 blockers)**; all
6 revised in-session, then built the round-4 entry-gate tooling the CD mandated. Orchestrator is
now **In Review — round-4 entry condition MET**, pending a round-4 re-review (now a machine-verify,
not a 4th human sweep).

**The 6 blockers (all fixed)**
1. `floorplan:loop` payload drift — Floor Plan's own GDD split 4-vs-3 on `toRoom`. Kept `toRoom`
   (CD ruling: producer's Core Rule prose is normative); patched Floor Plan ×4 incl. BLOCKING
   AC-C02, FPS Movement inbound; added Core Rule 1 self-contradicting-producer precedence clause.
2. `scan:integrity_*` registered as un-comparable `"{...}"` placeholders → declared `{count}` / `{}`;
   Scan Node now declares the empty payload explicitly.
3. AC-OR01 evidence note's "zero deltas" claim was false → corrected + OQ6 elevated.
4. Rule 4 mixed atomic+directed override group (`scan:complete` bridges the atomic pair AND the
   directed pair — LIVE, not hypothetical) had undefined `intraGroupRank` → defined (atomic-only
   members inherit partner rank; 2 new compile-time rejections); new **AC-OR33** co-queues all 3.
5. "Arrival index" never defined + AC-OR29 contradicted Core Rule 7 → defined arrival index =
   publish-call-time with **next-tick deferral** for mid-delivery publishes (user decision), added
   `subscribe()` reentrancy contract, re-targeted AC-OR29 to a latest-value event.
6. `session:tick elapsedSeconds` undefined → pinned as **capped-dt game time** (`dt_cap` 0.1s, same
   as FPS Movement; prevents tab-restore snapping Floor Plan's escalation to 1.0); new **AC-OR34**;
   `dt_cap` registered as a cross-system constant. New **OQ9** (DI wiring + override-storage ADR).
   AC count 32 → 34.

**verify-registry tooling (OQ6 RESOLVED — round-4 entry gate)**
- New `tools/verify-registry.mjs` (`npm run verify:registry`). Parses free-text `payload:` with a
  balanced-brace reader (no `payload_fields:` schema needed), diffs each event's field set vs. its
  producing GDD, and flags **producer self-contradiction** (the floorplan:loop failure mode).
  `--selftest` = 9 parser assertions.
- On first run caught **2 further drifts all 3 manual rounds missed**: `scan:complete` restated as a
  `{nodeId}` subset in 2 Scan Node rows; `renderer:anomaly_density` written 3 ways in Point Cloud.
  Both normalized. Final: **14 pass, 0 fail, 5 skip (provisional)**.
- Follow-up: fold into CI when `/test-setup` lands a workflow (no CI yet).

**Files touched:** orchestrator.md, floor-plan-system.md, fps-movement.md, scan-node-system.md,
point-cloud-renderer.md, entities.yaml, systems-index.md, orchestrator-review-log.md (new round-3
entry), package.json, tools/verify-registry.mjs (new).

**Immediate next step:** round-4 re-review of Orchestrator (`/clear` first — 5 agents need clean
context), OR proceed to `/design-system` Scan Mechanic (#6 in design order, MVP). Round 4 should be
short: run `npm run verify:registry` (passes) + confirm the 6 blocker fixes read cleanly.

---

## 2026-07-01 — Orchestrator GDD COMPLETE (MVP 5/9); 19-event family registered

**What got done (this session, Legion):** finished the Orchestrator (#5) GDD — the last
4 sections that were `[To be designed]` — and ran Phase 5. Orchestrator is now **Designed,
pending independent `/design-review`**.

**Sections completed**
- Visual/Audio + UI Requirements — both **N/A** (pure infrastructure; no pixels/audio/UI
  surface of its own).
- **Acceptance Criteria — 30, qa-lead validated.** qa-lead review returned NEEDS REVISION
  and caught the project's recurring patterns: 2 placeholders that named a guarantee without
  testing it (AC-OR02 cut, AC-OR05 rewritten as a real terminal-state test), and 4
  "rules-don't-compose" gaps (added AC-OR23 post-SEAL-drop × late-SEALED-subscriber same
  frame; AC-OR14 override-chain × unrelated FIFO; AC-OR29 late subscriber mid-override;
  AC-OR11 adversarial interleave). Added Logic/Integration labels per sibling-GDD convention.
- Open Questions — 5 (provisional-flag cleanup, Win/Lose trigger source, entity tier vocab,
  Rule-5 lint tooling, referenced_by maintenance).

**Key design decisions locked**
- Orchestrator = registration-not-invention; sole owner of `LOADING/ACTIVE/SEALED` lifecycle;
  `session:request_end{reason}` intake decouples "who decides game-over" from enforcement.
- Global FIFO + registered per-pair ordering overrides (Floor Plan AC-L09, Scan Node AC-SN29,
  Point Cloud AC-E02); stable-sort so 3-chains + unrelated events resolve correctly.
- latest-value cache vs discrete fire-and-forget (Core Rule 7); `session:end` sole cached
  discrete exception.
- **`floorplan:init` 2nd fire → REJECTED** (AC-OR21) — protects Scan Node's roster/coverage-
  denominator invariant at the bus level, not just by convention.

**Phase 5 — registry**
- entities.yaml: NEW **`events:` section, 19 cross-system events** registered with producer /
  consumers / payload shape / kind (latest-value vs discrete). 3 Orchestrator-owned
  (session:tick, session:end, session:request_end); 5 provisional (producers Scan Mechanic #8
  / Entity #9 undesigned). YAML parses clean (19 events, 3 formulas, 15 constants).
- systems-index: Orchestrator #7 → Designed; **MVP 5/9**; docs started 5.
- GDD status header → "Designed (pending independent /design-review)".

**Next step**
- `/design-review design/gdd/orchestrator.md` in a **fresh session** (sibling GDDs each took
  4 review rounds — budget for revision). Then `/consistency-check` (new `events:` section).
- After Orchestrator approval: Scan Mechanic (#6), Entity (#9). Provisional-flag cleanup pass
  on the 4 sibling GDDs once Orchestrator is Approved.

---

## 2026-07-01 — Floor Plan + Scan Node APPROVED; Orchestrator GDD 7/8 (in progress)

**Big picture:** both previously-designed core GDDs are now **Approved** via multi-round
adversarial `/design-review` (4 specialists + creative-director synthesis per round).
Consistency-check PASS across all 5 GDDs. Now mid-way through authoring Orchestrator (#5),
the event-bus hub. Also fixed 3 codex-reported prototype bugs earlier this session.

**Floor Plan System (#3) — APPROVED**
- 4 review rounds total: round 1 MAJOR REVISION (Player-Fantasy/mechanics gap), rounds 2-3
  NEEDS REVISION (cross-system contracts, interaction-matrix gaps), round 4 APPROVED-WITH-
  CONDITIONS → conditions closed same session. AC count 23→46.
- Key fixes across rounds: desync lags position marker (e²→e³ cubic), per-door loop cooldown,
  `loop_arm_floor` escalation floor, `w_t≤0.8` cap (closes "D_max only via trap" loophole),
  `D0<D_max` guard, dollhouse access = toggle key, **Interaction Matrix** subsection (structural
  fix for recurring "blocker lives at rule interaction" pattern), AC-E16 (dollhouse-open ×
  world-sim), AC-E17 (exactly one ANOMALY_FINAL — added during Scan Node review, cross-GDD fix).
- Full history: `design/gdd/reviews/floor-plan-system-review-log.md`.

**Scan Node System (#4) — APPROVED (unanimous, round 4)**
- 4 rounds: round 1 MAJOR REVISION → rounds 2-3 NEEDS REVISION → round 4 unanimous APPROVED.
  AC count 22→26.
- CD named the arc pattern: **"blockers live at the inheritance boundary"** — every round-1
  blocker was Scan Node failing to inherit/cross-ref a sibling-doc precedent (Floor Plan, or
  master GDD), not internal logic. And **"assert the what, don't prove the how"** — a fix would
  state a guarantee while the proof lagged a round (co-location → trust-valence; canonical
  source; AC-SN29 cited as proof it didn't test). Both closed by round 4.
- Structural fixes that should generalize to future hub docs: **Cross-System Invariants table**
  (Floor Plan's Interaction Matrix pointed outward at sibling docs); **DEFERRED-tracking table**
  with design-vs-implementation split + Owner/Resolve-when. `scan:coverage` named canonical over
  `scan:complete.coverage`; `coverage` = visually-dominant trust-bearing number (AC-SN31 DEFERRED);
  D-1 Auto-Typed Log hierarchy restored in Open Q#5.
- 1 tracked non-blocking fast-follow: Edge Case 11 (same-frame scan:captured race) AC.
- Full history: `design/gdd/reviews/scan-node-system-review-log.md`.

**Cross-GDD amendment:** Floor Plan amended twice during Scan Node review (AC-E17 exactly-one-
ANOMALY_FINAL guard; chained-reveal Edge Case wording corrected to bar duplication not placement).
Additive only, no Floor Plan re-review needed.

**Consistency check:** `/consistency-check` PASS — 0 conflicts, 5 GDDs, 3 formulas + 11 constants
all agree across source + referencing docs.

**Prototype bug fixes (earlier this session):** BUG-0001 (dt cap → AC-EC03), BUG-0002 (WASD stuck
after focus loss → blur/visibilitychange clear), BUG-0003 (HUD initial 0,0,0 → clamp+HUD out of
movement branch) — all fixed in `src/main.js`, `node --check` PASS, Vite loads clean. Status
"Fix Applied — Pending Manual Verification" (PointerLock needs real-browser user gesture; sandbox
preview can't verify). Reports updated under `production/qa/bugs/`.

**Orchestrator (#5) — IN PROGRESS, 7 of 8 required sections written**
- File: `design/gdd/orchestrator.md`. Done: Overview, Player Fantasy (pure infra, no fantasy),
  Detailed Design (7 Core Rules + session lifecycle LOADING/ACTIVE/SEALED + per-frame ordering +
  full Interactions table), Formulas (N/A — relay only), Edge Cases (9, incl. post-SEAL drop,
  late-subscriber cache, ordering override, unknown-event), Dependencies, Tuning Knobs (no
  gameplay knobs, 2 dev toggles).
- **Key design decisions:** Orchestrator = registration-not-invention (event names/shapes taken
  verbatim from the 4 sibling GDDs); sole owner of session lifecycle; `session:request_end{reason}`
  intake decouples "who decides game over" from "who enforces it" (Win/Lose undesigned);
  Global FIFO ordering + registered per-pair overrides (Floor Plan AC-L09, Scan Node AC-SN29,
  etc.); **latest-value cache vs discrete fire-and-forget** classification (Core Rule 7) for
  late subscribers; `session:tick`/`session:end` are the 2 events nothing produced before — now
  Orchestrator-owned.
- **STILL TO DO (4 sections):** Visual/Audio (likely N/A — no pixels), UI Requirements (likely
  N/A — no UI surface), **Acceptance Criteria** (the real remaining work — needs qa-lead per lean
  high-risk rule, testable GIVEN/WHEN/THEN for the 7 core rules + ordering + cache + lifecycle),
  Open Questions (incl. provisional-flag-cleanup follow-up on the 4 sibling GDDs).

**Next step**
- Resume `/design-system Orchestrator` — finish Visual/Audio + UI Requirements (both likely brief
  N/A), then Acceptance Criteria (spawn qa-lead, lean mode Section H high-risk), then Open Questions.
- Then Phase 5: register `session:*`/event-family in `entities.yaml`, self-check, `/design-review`
  in a fresh session.
- After Orchestrator: Scan Mechanic (#6), Entity (#7/#9).

---

## 2026-06-27 — Floor Plan GDD design-review (full) → MAJOR REVISION → revised

**What got done**
- Ran `/design-review design/gdd/floor-plan-system.md` in **full mode** — 4 adversarial
  specialists (game-designer, systems-designer, qa-lead, ux-designer) + creative-director
  synthesis. (Agents first died on a session-limit reset → resumed via SendMessage with
  context intact, not respawned.)
- **Verdict: MAJOR REVISION NEEDED.** Convergence across all 4 domains: Section B (Player
  Fantasy) promised horror the mechanics didn't deliver. Highest-confidence blocker (3/4
  reviewers): anomaly-reveal loop arm was permanent with no defined ARMED→DORMANT path.
- **Revised same session** (4 user decisions), then logged + index updated.

**Floor Plan revision — key decisions**
- Desync now lags the **player-position marker** (+ scan-state), not just the scan-state
  icon — this is what makes the anchor moment ("a room you already left") actually fire.
- Loop arming gated by **`loop_arm_floor`** (escalation floor, default 0.4); anomaly-reveal
  arm **re-arms above floor** after a **per-door** cooldown (was global → exploit closed).
- Desync curve **e² → e³** (truthful early, sharp late). Registry `desync_delay` expr updated.
- Weights made absolute (`w_t+w_c=1`, both-zero fallback). Coverage def pinned → closes
  floor-plan Open Q#2 (Scan Node owns `coverage = V/S`).
- **AC 23 → 34**: reworked untestable ACs (byte-identical / within-a-frame → unit-scope),
  added arm-by-reveal, clamp, normalization, per-door, position-marker, S=0/D0=0 guards.
- Deferred to dollhouse UX spec: access paradigm, KNOWN_STALE/CURRENT visual diff, marker
  visuals, colourblind coverage-ring. Open Q#6 added (§15-C2 loop-payload owner).

**State**
- Floor Plan status = **In Review (revised, re-review pending)**. Review log created:
  `design/gdd/reviews/floor-plan-system-review-log.md`.
- Scan Node (#4) still unreviewed.

**Next step**
- `/clear` → `/design-review design/gdd/floor-plan-system.md` (independent re-review, fresh
  session — expected to clear). Then review Scan Node (#4), `/consistency-check`, then
  `/design-system` Orchestrator (#5).

---

## 2026-06-27 — Scan Node System GDD complete (MVP 4/9)

**Cross-machine note**
- #4 was started in a separate session (Legion) but **never pushed**; that session was
  abandoned. #4 re-done fresh on **desktop** from scratch. If the old Legion session is
  still open, do NOT push from it — close it. No repo artifact from it exists to delete.

**What got done**
- `/design-system` (lean mode) authored **Scan Node System GDD** end-to-end:
  `design/gdd/scan-node-system.md`. All 8 sections + Visual/Audio + UI + Open Questions.
  **22 acceptance criteria** (18 Logic + 4 Integration), 1 formula + 2 derived metrics.
- Section D (systems-designer) + Section H (qa-lead) spawned per lean high-risk rule.

**Key design decisions (Scan Node)**
- Scan Node = **sole node-state authority**. It (not Scan Mechanic) emits the canonical
  `scan:complete` / `scan:abort` everyone listens for. Scan Mechanic only reports
  `scan:started` / `scan:captured`. (Provisional — confirm at Orchestrator #5 / Scan Mechanic #6.)
- **coverage = V / S**, S = count(STANDARD) + 1 anomaly node (NULL excluded), **fixed at init**.
  Escape (all standard, anomaly unscanned) tops at N/(N+1) < 100% (UI flags "incomplete");
  100% only by scanning the anomaly node = Completion Trap (§9). **This answers floor-plan Open Q#2.**
- **nodesCompleted UI counter uses a STANDARD-ONLY denominator** — deliberately diverges from
  coverage (escape player sees `12/12` AND `92%`). Flagged for creative-director at HUD GDD.
- Node types: STANDARD / ANOMALY_FINAL (scannable only after room reveal) / NULL (locked `[?]`).
- entityInFrame is RECORDED not detected — a valid scan that captures the entity STILL counts
  (the trap working as designed); sets entityEverCaptured for Win/Lose.
- `corruption_threshold` = 4 invalids → `scan:integrity_failure` (single fire).

**Registry** (`design/registry/entities.yaml`)
- NEW formula: `coverage` (source scan-node; referenced_by floor-plan `session_escalation`).
- NEW constant: `corruption_threshold` = 4.

**Systems index**
- #4 Scan Node → **Designed**. MVP designed = **4/9**. Added 3 Open Cross-System Items
  (nodesCompleted divergence for HUD, `scan:*` family for Orchestrator, plus existing entity-tier).
- Also committing untracked `.claude/agent-memory/ux-designer/` (dollhouse UX review from the
  floor-plan session — follows the already-tracked lead-programmer memory convention).

**rtk note (desktop):** `rtk` hook still broken (`rtk: command not found`) — all git run via
`/mingw64/bin/git` to bypass the hook rewrite.

**Next step**
- `/design-review` (fresh session) on floor-plan + scan-node (both unreviewed).
- `/consistency-check` across the 4 GDDs.
- Then `/design-system` **Orchestrator (#5)** — formalises `floorplan:*` / `scan:*` /
  `entity:proximity` event contracts (convergence point for 4 systems). Then Scan Mechanic (#6).

---

## 2026-06-27 — Floor Plan System GDD complete (MVP 3/9) + consistency PASS

**What got done**
- `/design-system` (lean mode) authored the **Floor Plan System GDD** end-to-end:
  `design/gdd/floor-plan-system.md`. All 8 required sections + Visual/Audio + UI +
  Open Questions. **23 acceptance criteria**, 2 formulas, 7 tuning knobs.
- `/consistency-check` full scan → **PASS, 0 conflicts** across all 3 GDDs.

**Key design decisions (Floor Plan)**
- Layout source: **curated pool of authored layouts** + runtime perception-stripping
  mutations (NOT procedural geometry). Seed code (§16-H2) selects a specific one.
- Divergence model: **one true layout + per-room view-state mask** — the dollhouse
  is a derived, lagging view (UNKNOWN → KNOWN_STALE → KNOWN_CURRENT).
- Looping geometry (§15-C2): **threshold teleport** — Floor Plan emits
  `floorplan:loop {targetPosition, targetYaw}`, FPS Movement applies the reposition.
- Anomaly reveal (§8): a **designated adjacent node completing**
  (`scan:complete {revealTriggerNodeId}`) unseals the room; dollhouse never shows it.
- Formulas: `session_escalation` e = clamp(w_t·t/T_session + w_c·coverage, 0,1);
  `desync_delay` = D0+(D_max−D0)·e² (quadratic — truthful early, degrades late).

**QA pass (qa-lead spawned for Acceptance Criteria)**
- Caught 3 coverage gaps + 5 untestable criteria. Added AC-D04 (desync growth),
  AC-E05 (SEALED freeze), AC-L05 (retroactive-loop suppression), AC-E06 (loopSpawn
  clamp), AC-E07 (chained reveals), AC-E08 (overlap AABBs). Rewrote AC-C02/C03/C06/
  C07/D02/D03 for testable observables. 17 → 23 criteria.

**Cross-system side-effects written**
- **FPS Movement GDD patched** — added `floorplan:loop` to its inbound interface
  (bidirectional consistency fix).
- **Registry** (`design/registry/entities.yaml`): +2 formulas (session_escalation,
  desync_delay), +2 constants (T_session 1500s, loop_trigger_tier NEAR);
  referenced_by += floor-plan on WALL_MARGIN, EYE_HEIGHT, proximity_tier_near.
- **Systems index**: Floor Plan → Designed; MVP 3/9; dollhouse UX note added.

**Flags**
- 📌 UX: dollhouse map needs `/ux-design` (`design/ux/dollhouse.md`) before UI/HUD epics.
- creative-director + CD-GDD-ALIGN pillar review skipped (lean) — review Player
  Fantasy manually before production.
- Entity tier vocabulary: concept §5 lists 5 proximity states; the event contract
  uses 4 (FAR/MEDIUM/NEAR/ADJACENT). Declare the canonical set when Entity (#9) is
  designed. (Not a conflict — informational.)

**Provisional contracts** (deps undesigned): Orchestrator `floorplan:*` events,
Scan Node `scan:complete`/node positions, Entity placement.

**Pipeline position:** 3/9 MVP systems designed.

**Next step:** `/design-review design/gdd/floor-plan-system.md` in a **fresh session**
(independent critique). Then `/design-system` for **Scan Node System** (#4, depends
on Floor Plan), then Orchestrator (#5).

---

## 2026-06-26 — Two MVP GDDs designed (Point Cloud Renderer + FPS Movement)

**What got done**
- `/design-system` (lean review mode) ran end-to-end for two systems back-to-back.
- **Point Cloud Renderer GDD** — COMPLETE: `design/gdd/point-cloud-renderer.md`. All 8
  required sections + Visual/Audio + UI + Open Questions. 19 acceptance criteria.
  4 formulas (scan materialize opacity ramp, anomaly sigma, proximity jitter, density).
- **FPS Movement GDD** — COMPLETE: `design/gdd/fps-movement.md`. All 8 sections +
  Open Questions. 18 acceptance criteria (qa-lead spawned). 4 formulas (frame delta
  with dt cap 0.1s, AABB clamp union-bounds, yaw, pitch with YXZ sign convention).
  Two modes: NAVIGATE (WASD 1.6 m/s + PointerLock) and SCAN_LOCKED (input revoked).

**Registry** (`design/registry/entities.yaml`)
- Point Cloud: 7 constants (base_density 900, density_budget_ceiling 1.5M,
  anomaly_sigma 2.5, scan_frame_duration 0.5, entity_influence_radius 5.0,
  proximity_tier_near, proximity_tier_adjacent).
- FPS Movement: 5 constants (MOVE_SPEED 1.6, EYE_HEIGHT 1.5, WALL_MARGIN 0.35,
  MOUSE_SENSITIVITY 0.0010, PITCH_LIMITS ±1.3963 rad).

**Key design decisions**
- Type A entity = invisible depth-only occluder mesh (not removed points) — Open
  Question, needs Three.js r171 prototype.
- Multi-room AABB = union of accessible room bounds (single rect); notched rooms =
  level-designer invisible blockers.
- Pitch ±80° not ±90° (gimbal). movementY negated (Three.js YXZ convention).
- dt hard-capped 0.1s (tab-restore anti-tunnelling; max 0.16m < WALL_MARGIN 0.35m).
- qa-lead flagged: dt must be a PARAMETER to update fn (testability for AC-EC03);
  AC-F04 pitch-sign is the likely first-pass inversion bug — test first.

**Pipeline position:** 2/9 MVP systems designed. systems-index.md updated.

**Next step:** `/design-system` for **Floor Plan System** (#3, Core layer, depends on
Point Cloud Renderer). Then Scan Node (#4), Orchestrator (#5). Eventually
`/design-review` on both completed GDDs in a fresh session.

---

## 2026-06-26 — Quicksave checkpoint (protocol live)

- Quicksave protocol confirmed operational and pushed (`ls_main`). No code/design
  changes since the previous entry — this is a continuity checkpoint.
- **Pipeline position:** `/map-systems` complete. Nothing in progress.
- **Next step:** `/design-system` for the first MVP system — start with **Point
  Cloud Renderer** (high-risk, prototype underway) or **Scan Mechanic** (core verb).
  Optional `/gate-check systems-design` first.

---

## 2026-06-26 — Project setup, stack pivot, GDD expansion, systems decomposition

**Repo / infra**
- Cloned `Donchitos/Claude-Code-Game-Studios` template into `last_scan project`.
- Main repo set to **github.com/magatron02/LAST_SCAN**, working branch **`ls_main`**
  (repo default; deleted the leftover `main` branch). `origin` points here.
- Multi-machine workflow: desktop + Legion laptop on the same repo.

**Stack pivot (Godot template → Three.js web game)**
- The template ships configured for Godot 4.6; the game (per GDD) is a **Three.js /
  WebGL web game**. Reconfigured `.claude/docs/technical-preferences.md` to the web
  stack and noted Godot/Unity/Unreal specialist agents are NOT used (route to
  engine-agnostic programmer agents). Updated CLAUDE.md Technology Stack too.

**Prototype — slice 1 (DONE, builds + runs)**
- Vite + Three.js scaffold. Files: `index.html`, `styles/ui.css`, `src/main.js`
  (PointerLock FPS + WASD, robot-gait speed, AABB room clamp), `src/pointcloud.js`
  (samples points on 6 inner box surfaces = LIDAR look). `vite.config.js` aliases
  `three/addons`. `npm run build` passes; dev server at localhost:5173. Title
  screen verified in preview (PointerLock can't engage in sandbox iframe — test in
  a real browser by clicking).

**GDD — expanded v0.1 → v0.3** (`design/gdd/LAST_SCAN_GDD.md`)
- v0.2 §15: depth-only preview, dollhouse desync, looping geometry, timestamp
  drift, auto-typed log, signal decay, redacted scan results, **inverted reward**.
- Inverted reward reworked §9/§10: **100% coverage = bad ending (Completion Trap)**
  via the §8 anomaly-room final node; **deliberately leaving the anomaly room
  unscanned = Escape**. UI never tells the player which ending they got.
- v0.3 §16: found-footage framing (viewer reveal, excised footage `[FOOTAGE
  MISSING]`, playback artifacts), scanner identity (self-diagnostic creep,
  mechanical memory), property variety/replay (personality, seed code),
  cross-session cycle meta via **localStorage** (incrementing unit ID, accreting
  log, house memory), audio depth (servo-whir heartbeat, EVP, silence-as-tell).
- §8 added the **Perception Stripping** principle: the floor plan is a rough early
  guide that degrades into unreliability; live scan data is the only ground truth.
  The unknown is the core horror lever.

**Systems decomposition (DONE)** — `design/gdd/systems-index.md`
- 13 systems, dependency-layered. Priorities: **MVP (9)** Point Cloud, FPS
  Movement, Floor Plan, Scan Node, Orchestrator, Scan Mechanic, Entity, Win/Lose,
  UI/HUD · **Vertical Slice (2)** Audio, Found-Footage Layer · **Alpha (2)**
  Persistence (localStorage), Cycle/Meta.
- Floor Plan (static degrading guide) and Scan Node (live authoritative state) kept
  as **separate** systems — per the perception-stripping principle.
- Circular dep **Entity ↔ Scan Mechanic** resolved via the Orchestrator event bus
  (publish/subscribe, no direct import).
- High-risk to prototype early: **Point Cloud + Entity rendering** (Type A = void of
  points, Type C = ghost second-room geometry), perception-stripping feel,
  found-footage artifacts.

**State**
- Done: repo set up, stack pivoted, prototype slice 1, GDD v0.3, systems index.
- Pending commit at time of writing: GDD §8 update, systems-index.md, CLAUDE.md
  edits, this worklog (being committed now on quicksave).

**Next step**
- Pipeline position: finished `/map-systems`. Next is `/design-system` for MVP
  systems in design order — start with **Point Cloud Renderer** (high-risk,
  prototype already underway) or **Scan Mechanic** (the core verb).
- Optional: `/gate-check systems-design` for a director sign-off before authoring GDDs.
