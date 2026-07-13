# Win/Lose & Ending

> **Status**: In Design (all 8 required sections + Open Questions written; not yet independently
> reviewed — run `/design-review` in a fresh session)
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-02
> **Implements Pillar**: Inverted Reward (§9)
> **Creative Director Review (CD-GDD-ALIGN)**: skipped — Lean mode (not a PHASE-GATE in lean).
> Given this section's own note that it "carries the game's central thesis," a manual pass before
> production is strongly recommended even though the gate itself was skipped.

## Overview

Win/Lose & Ending is the arbiter that watches everything the rest of the game already tracks —
coverage, entity captures, integrity failures, player movement — and decides two things: *when*
the session ends, and *which* of a small set of outcomes just happened. It owns no gameplay verb
of its own; it produces no scan, moves nothing, renders nothing. Its entire job is evaluation:
reading `coverage`, `entityEverCaptured`, `scan:integrity_failure`, and `entity:proximity` from
systems that already emit them, and calling `session:request_end {reason}` the instant a
terminal condition is met.

This is also the system that makes the Inverted Reward mechanically real, not just narratively
implied. Every other system treats "scan everything" as the stated goal — the UI will frame
rising coverage as progress, the node ledger will look more complete with every valid scan.
Win/Lose is the one place in the codebase that knows the truth the interface is built to hide:
that scanning the last node is a loss condition, not a completion. It doesn't editorialize and
it doesn't warn — it just watches, and when the anomaly node resolves `VALID`, it ends the
session exactly as neutrally as it would for any other outcome.

## Player Fantasy

This is the payoff for every other system's fantasy, and it has none of its own moment-to-moment
— it exists entirely in the *reveal*, not the play. Point Cloud taught the player to trust data
over sight. Floor Plan taught them the map lies. Scan Node gave them one honest gauge and then
made that gauge the trap. Scan Mechanic made finishing feel like relief. Entity System made every
anomaly a coin flip. Win/Lose is where all of that resolves into a single, silent verdict — and
the player only finds out what it decided after it's already too late to matter.

**There is no warning, because a warning would be a bug.** Every other locked/vulnerable moment
in this game (a scan, a dollhouse check) at least announces itself as a choice. Win/Lose
announces nothing. It doesn't lock the camera, doesn't play a sting, doesn't pause. The instant
the anomaly node resolves `VALID`, the outcome is already decided — the player just hasn't been
told yet. This asymmetry (the game knows immediately; the player learns only at the terminal
screen) is the entire mechanism of the Inverted Reward's horror: the fear isn't of a monster,
it's of having already lost without a moment to register it.

**The verdict is delivered with the same voice regardless of what it is.** Escape and Completion
Trap read from the identical terminal screen, in the identical tone, with only the numbers
changed. There is no "you win" or "you lose" — there's `SCAN COVERAGE: 100%` or
`SCAN COVERAGE: 92%`, and the player has to already understand what those numbers mean to know
which one is the good ending. This is not withheld information as difficulty — it's the thesis
stated as plainly as the game ever states anything: the interface was never going to tell you.

**Anchor moment:** not something that happens during play, but after — the player staring at
their own terminal screen, doing the math on the coverage percentage themselves, and feeling the
floor drop out as they realize which ending they got.

> *Note: `creative-director` not consulted — Lean mode. Review this framing manually before
> production — this section carries the game's central thesis and deserves a second pass before
> anything downstream builds on it.*

## Detailed Design

### Core Rules

1. **Primary ending taxonomy.** Exactly one of 4 mutually-exclusive primary outcomes occurs per
   session: `ESCAPE`, `COMPLETION_TRAP`, `MOVEMENT_VIOLATION`, `SCAN_CORRUPTION`.
   `entityEverCaptured` (from Scan Node) is an independent boolean flag that changes the
   ending's flavor text but never changes *which* primary outcome occurred — matches master GDD
   §10's single terminal screen whose text varies by several simultaneous inputs.

2. **Completion Trap trigger.** The instant the `ANOMALY_FINAL` node resolves `VALID`
   (`scan:complete {nodeId}` matching the known anomaly-node id), Win/Lose immediately calls
   `session:request_end {reason: "completion_trap"}` — regardless of remaining standard-node
   coverage. The mechanical trigger is "anomaly node VALID," not literally "coverage=100%"; the
   two normally coincide because scanning the anomaly last is the natural play pattern, but this
   rule fires the instant the anomaly resolves even if earlier.

3. **Escape trigger.** The instant the last standard node resolves `VALID`
   (`nodesCompleted.X === nodesCompleted.Y`) AND the anomaly node's status is anything other than
   `VALID`, Win/Lose immediately calls `session:request_end {reason: "escape"}`. Checked on every
   `scan:complete`.

4. **Movement Violation trigger.** On each `player:position` update, if the cached
   `entity:proximity` tier is `ADJACENT` AND this position differs from the immediately-preceding
   sample by more than `movement_violation_threshold` (new knob) AND this tick is not one where
   `floorplan:loop` also resolved, Win/Lose immediately calls
   `session:request_end {reason: "movement_violation"}`.

5. **Scan Corruption trigger.** On `scan:integrity_failure` (Scan Node, fires once at
   `corruption_threshold`), Win/Lose immediately calls
   `session:request_end {reason: "scan_corruption"}`.

6. **Precedence when multiple conditions coincide in the same tick.**
   `MOVEMENT_VIOLATION > SCAN_CORRUPTION > COMPLETION_TRAP > ESCAPE`. The four are naturally
   evaluated at different trigger points (position updates vs. scan completions vs. integrity
   events), so genuine same-tick collision is rare — this closes the ambiguity deterministically
   rather than leaving it to arrival order.

7. **Single-fire guarantee.** Once any primary outcome has triggered `session:request_end`,
   Win/Lose's own evaluation stops — mirrors Orchestrator's SEALED/single-`session:end`
   guarantee. No second outcome can be recorded even if a second condition becomes true in a
   later tick before `SEALED` fully propagates.

8. **Ending record construction.** At the moment `session:request_end` is called, Win/Lose
   snapshots `{ primaryOutcome, coverage, nodesCompleted: {X,Y}, entityEverCaptured }`. For
   `MOVEMENT_VIOLATION`/`SCAN_CORRUPTION`, `coverage` is whatever it happened to be at that
   moment (frozen mid-session, not necessarily complete). This record is exposed for UI/HUD's
   terminal screen (§10).

### States and Transitions

| State | Description | Entry | Exit |
|---|---|---|---|
| `ACTIVE` | Evaluating all 4 trigger conditions on every relevant event | Session start | Any primary condition met (Rules 2–5) → `ENDED` |
| `ENDED` | Terminal; outcome recorded; no further evaluation | A primary condition triggered `session:request_end` | — (terminal) |

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| Scan Node | in | `scan:complete` (checks anomaly-VALID and all-standard-VALID conditions), `scan:integrity_failure` |
| Entity System | in | `entity:proximity {tier}` (cached, for Movement Violation gate) |
| FPS Movement | in | `player:position {x,y,z}` (via Orchestrator) for Movement Violation delta check |
| Floor Plan | in | `floorplan:loop` (suppresses Movement Violation check for that tick) |
| Orchestrator | out | `session:request_end {reason}` |
| UI/HUD (#12, undesigned) | out | Ending record `{primaryOutcome, coverage, nodesCompleted, entityEverCaptured}` for the terminal screen (§10) |

## Formulas

This system contains no curve-shaped formulas of its own — its four trigger conditions (Core
Rules 2–5) are boolean/threshold checks against values other systems already compute, not
gameplay curves. The one piece of math worth formalizing is the Movement Violation
distance-delta check (Rule 4).

### Movement Violation Distance Check

The `violation` check is defined as:

`violation = (delta > movement_violation_threshold) AND (tier == ADJACENT) AND (NOT same_frame_as(floorplan:loop))`

where `delta = distance(player:position[t], player:position[t-1])` (Euclidean, matching FPS
Movement's own position convention — not redefined here).

**Variables:**
| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|--------------|
| Position delta | `delta` | float | 0 to unbounded | Euclidean distance between consecutive `player:position` samples |
| Violation threshold | `movement_violation_threshold` | float | 0.035–0.070m, default 0.045m | Tuning knob — minimum delta that counts as "moved," not floating-point/frame jitter |
| Current tier | `tier` | enum | FAR/MEDIUM/NEAR/ADJACENT | Entity System's cached `entity:proximity` tier |
| Output | `violation` | bool | true/false | Whether this frame constitutes a Movement Violation |

**Output Range:** boolean.

**Tuning Constant — `movement_violation_threshold`**

**Default: 0.045m** (safe range: 0.035–0.070m). Rationale: ~1.7× a single normal-walk frame
delta at `MOVE_SPEED` (1.6 m/s ÷ 60fps ≈ 0.0267m), so it never fires on clean walking frames or
positional jitter, but sits comfortably below the ~0.053m delta a single dropped/merged frame
would produce at nominal speed — catching genuine ADJACENT-tier movement within one frame while
surviving one frame of stutter. If real-world frame pacing proves worse than a single dropped
frame, raise toward 0.070m: `MOVE_SPEED × dt_cap` (the engine's own capped-dt ceiling, 0.1s) =
0.16m is the true worst-case single-sample delta, so even 0.070m stays well inside that bound
while remaining above a 2-frame-merged normal walk (~0.053m).

> *Note: `systems-designer` consulted (Section D high-risk spawn, per lean-mode rule — scoped
> narrowly to this one constant, as no curve-shaped formula exists in this system).*

## Edge Cases

- **If the entity approaches the player rapidly (e.g. Type C's late-game pursuit speed) while
  the player's own position stays still**: this is **not** a Movement Violation. The check is on
  the player's own `player:position` delta only — a tier transition to `ADJACENT` caused by the
  entity closing distance, with the player frozen, produces `delta ≈ 0` regardless of how fast
  the relative distance changed.

- **If `entity:proximity` has never fired this session** (no manifestation yet): tier is
  implicitly `FAR` (Entity System's own despawn/dormant convention). The Movement Violation gate
  never opens, since it requires tier `ADJACENT`.

- **If this is the very first `player:position` sample of the session**: no prior sample exists
  to diff against, so no delta is computable — no violation check is performed on that sample.

- **If Win/Lose has already reached `ENDED`**: any further qualifying event (another
  `scan:complete`, continued player movement) is ignored. No second `session:request_end` is
  ever called, regardless of what conditions become true afterward.

- **`entityEverCaptured` is read fresh at the exact moment a primary outcome triggers**,
  reflecting Scan Node's cumulative session-level flag — it includes a capture from *any*
  earlier scan in the session, not only the specific node whose completion triggered the ending.

- **Escape is gated on the exact integer comparison `nodesCompleted.X === nodesCompleted.Y`**,
  never on a `coverage` float threshold (e.g. `coverage >= 0.92`) — avoids floating-point
  equality ambiguity entirely, since node counts are integers and `coverage` is a derived
  fraction.

- **Two `scan:complete` events for different nodes in the same tick** (e.g. the last standard
  node and the anomaly node resolving simultaneously): structurally prevented by Scan Mechanic's
  single-scan-in-flight rule — only one node can be mid-capture at a time, so this case cannot
  occur under the current architecture. Documented as *cannot occur*, not defensively handled.

- **A `player:position` delta exceeds `movement_violation_threshold` on the same tick a
  `floorplan:loop` also resolves**: excluded by Core Rule 4's explicit clause — a loop
  teleport's own repositioning distance must never be mistaken for player-driven movement,
  regardless of how large that distance is.

- **If `session:end` fires from a source other than this system's own triggers** (e.g. a future
  debug command, per Orchestrator's `session:request_end` being an open intake): Win/Lose stops
  evaluating immediately and does **not** fabricate a primary outcome. If no condition had yet
  triggered, the session simply has no recorded ending — a development-only path, never
  reachable through normal play.

## Dependencies

**Upstream — what Win/Lose consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Orchestrator | Event bus (hard) | Receives: all inputs below. Emits: `session:request_end {reason}` |
| Scan Node | Hard (data consumer) | `scan:complete {nodeId, ...}` (Completion Trap + Escape checks), `scan:integrity_failure` (Scan Corruption check) |
| Entity System | Soft (event consumer) | `entity:proximity {tier}` for the Movement Violation gate. Without it, tier defaults to `FAR` (Entity System's own dormant convention) — Movement Violation simply never triggers; the other 3 outcomes still function fully. |
| FPS Movement | Soft (data consumer) | `player:position {x,y,z}` (via Orchestrator) for the Movement Violation distance check. Same graceful-degradation note as Entity System. |
| Floor Plan | Soft (event consumer) | `floorplan:loop` to exclude teleport-driven position deltas from Movement Violation. Without it, a coincidental loop-into-ADJACENT could false-positive — low-probability, not a hard block. |

Win/Lose calls no system directly — all flow is via the Orchestrator bus.

**Downstream — systems that depend on Win/Lose:**

| System | What they need | Interface |
|---|---|---|
| Orchestrator | Session termination request | `session:request_end {reason}` *(Orchestrator GDD already records Win/Lose as its primary expected caller ✅)* |
| UI/HUD (#12, undesigned) | Terminal screen data | Ending record `{primaryOutcome, coverage, nodesCompleted, entityEverCaptured}` (§10). ⚠️ *Provisional — UI/HUD undesigned.* |
| Cycle/Meta Layer (#11, undesigned, Alpha) | Final outcome for cross-session persistence | Ending record — feeds unit-ID incrementing, accreting log (§16-I). ⚠️ *Provisional — undesigned, Alpha tier.* |
| Found-Footage Layer (#13, undesigned, Vertical Slice) | Outcome for reveal framing | Ending record. ⚠️ *Provisional — undesigned, Vertical Slice tier.* |

**Bidirectional actions:** none required this session — Scan Node, Entity System, FPS Movement,
and Floor Plan all already emit exactly what this GDD consumes; Orchestrator already names
Win/Lose as `session:request_end`'s primary expected caller.

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `movement_violation_threshold` | 0.045m | 0.035–0.070m | Genuine ADJACENT-tier movement fails to trigger a violation — the cardinal rule ("do not move") becomes unenforceable | False-positives on floating-point jitter or normal frame-pacing variance, punishing the player for standing still |

This is the only tuning knob this system owns. Every other threshold Win/Lose reads
(`corruption_threshold`, node counts, coverage) is Scan Node's to tune — Win/Lose only
*evaluates* those values, it doesn't own their calibration.

**Interaction note:** `movement_violation_threshold` interacts with FPS Movement's own `dt_cap`
(0.1s) — see Formulas. If `dt_cap` is ever changed, the worst-case single-sample delta
(`MOVE_SPEED × dt_cap`) shifts, and this threshold's safe range should be re-checked against the
new ceiling rather than assumed stable.

## Visual/Audio Requirements

This system produces **no pixels or audio directly**. The terminal screen (§10) is rendered
entirely by UI/HUD; Win/Lose supplies only the ending record
`{primaryOutcome, coverage, nodesCompleted, entityEverCaptured}`. No own assets —
`/asset-spec` is not required.

*No art-director/audio-director consultation needed — this system has no visual or audio
surface of its own to direct.*

## UI Requirements

Win/Lose supplies the **ending record** and the **structural text-variation logic** for the §10
terminal screen; UI/HUD owns the actual rendering, typesetting, and final copy. This section
specifies *what varies and why* — not the final in-game strings, which are a future writer's
task.

**Text-variation matrix** (field × outcome):

| Field | ESCAPE | COMPLETION_TRAP | MOVEMENT_VIOLATION | SCAN_CORRUPTION | Driven by |
|---|---|---|---|---|---|
| `SESSION ID` | Static | Same | Same | Same | N/A |
| `SCAN COVERAGE: [X]%` | ~92% (partial by design) | 100% | Frozen/partial at trigger | Frozen/partial at trigger | `coverage` (Core Rule 8 snapshot) |
| `NODES COMPLETED: [X]/[X]` | Standard-only total, minus anomaly | Full total incl. anomaly | Frozen partial count | Frozen partial count | `nodesCompleted` |
| `STATUS: [line]` | **Register A** — identical framing to Completion Trap | **Register A** — identical framing to Escape | **Register B** — "interrupted transmission" wording, distinct from Scan Corruption | **Register B** — "internal/systemic fault" wording, distinct from Movement Violation | `primaryOutcome`, 2-register split (not 4 unique strings) |
| `ANOMALIES LOGGED: [X]` | Raw count, outcome-agnostic | Same | Same | Same | Session-cumulative anomaly-detection tally — same formula every outcome, never reinterpreted |
| `NEXT SCHEDULED SCAN` / `REPLACEMENT UNIT` | Static increment | Same | Same | Same | Always increments identically — the cycle continues regardless of outcome, itself part of the horror |
| *(no new field)* | Subtle word-choice shift within **exactly one** existing field (`STATUS` or `ANOMALIES LOGGED`, chosen at copy-drafting time) — never a standalone line, never confirmatory language | Same mechanism | Same mechanism | Same mechanism | `entityEverCaptured` — orthogonal modifier |

**Structural constraints (load-bearing, not stylistic preference):**
- **The `STATUS` register split is 2-way, not 4-way.** `ESCAPE` and `COMPLETION_TRAP` must read
  as *identical* in register — this is the entire mechanism of the Inverted Reward; the good and
  bad endings must look equally "successful." `MOVEMENT_VIOLATION` and `SCAN_CORRUPTION` share a
  second register ("something stopped the transmission/system," not "you lost") but are
  internally differentiated from each other only within that one field.
- **Only 2 fields branch on `primaryOutcome` at all**: the numeric pair
  (`coverage`/`nodesCompleted`) and `STATUS`. `ANOMALIES LOGGED` and the static fields
  (`SESSION ID`, `NEXT SCHEDULED SCAN`, `REPLACEMENT UNIT`) are outcome-agnostic by design — a
  future writer must not invent per-outcome anomaly-count logic that doesn't exist.
- **`entityEverCaptured` never adds a line and never uses confirmatory language.** A dedicated
  line (e.g. a dedicated "entity detected" readout) would be a legible on-screen confirmation
  that the entity was real, directly contradicting both "the reveal is environmental/implied"
  (master GDD §10) and the deliberate ambiguity the deferred D-3/EVP mechanics depend on
  (Scan Node Open Q#5). It touches exactly one existing field, chosen once at copy-drafting
  time — never both, never a new one.
- **There is no "YOU WIN"/"YOU LOSE" text anywhere, under any outcome.** Restates master GDD
  §10's own mandate as a hard constraint on this system's output, since Win/Lose is the system
  most likely to accidentally leak `primaryOutcome`'s literal name into player-facing text.

> **📌 UX Flag — Win/Lose & Ending**: the terminal screen is a UI surface. In Pre-Production, run
> `/ux-design` for the ending screen before writing epics — UI stories should cite a future
> `design/ux/ending-screen.md`, not this GDD directly.

## Acceptance Criteria

30 criteria: 22 BLOCKING (Logic) + 8 BLOCKING (Integration). No ADVISORY — this system has no
dedicated performance budget of its own (pure event-driven evaluation logic, no rendering, no
per-frame cost beyond a single distance check) and produces no pixels directly. One Edge Case
(two `scan:complete` events for different nodes in the same tick) is explicitly out of scope —
structurally prevented upstream by Scan Mechanic's single-scan-in-flight rule — flagged N/A
below rather than silently dropped.

**Testability requirements for the implementer:**
- `movement_violation_threshold` must be an injectable/mockable config parameter — tests inject
  fixed values (default 0.045m and boundary values within 0.035–0.070m), never depend on a real
  config file.
- The state machine (`ACTIVE`/`ENDED`) and all 4 trigger conditions must be exercisable by
  feeding events through a fake event bus in Vitest — no real Scan Node, Scan Mechanic, Entity
  System, or FPS Movement required. `scan:complete`, `scan:integrity_failure`,
  `entity:proximity`, `player:position`, and `floorplan:loop` are injected directly.
- `entityEverCaptured` is read via an injected/mocked accessor (or fixture flag), not a real
  Scan Node registry.
- All distance/delta assertions use `toBeCloseTo(expected, 5)` (or documented equivalent
  tolerance), never strict `toBe`, given floating-point Euclidean distance math.
- Each test isolates one session's evaluation lifecycle (ACTIVE-to-ENDED) and tears down its own
  state; no test depends on another's execution order.

### Primary Ending Taxonomy (Rule 1)

**AC-WL01 — Exactly one of 4 mutually-exclusive outcomes per session**
GIVEN a completed session evaluation, WHEN the recorded `primaryOutcome` is inspected, THEN it
is exactly one of `ESCAPE`, `COMPLETION_TRAP`, `MOVEMENT_VIOLATION`, `SCAN_CORRUPTION` — never
more than one, never none, for any session that reached `ENDED`. **BLOCKING (Logic)**

**AC-WL02 — entityEverCaptured never changes which primary outcome occurred**
GIVEN two otherwise-identical trigger sequences that both resolve the same primary outcome (e.g.
both ESCAPE), WHEN one has `entityEverCaptured = true` and the other `false`, THEN
`primaryOutcome` is identical in both cases — only the ending record's `entityEverCaptured`
field differs. **BLOCKING (Logic)**

### Completion Trap Trigger (Rule 2)

**AC-WL03 — ANOMALY_FINAL resolving VALID immediately triggers COMPLETION_TRAP**
GIVEN Win/Lose is `ACTIVE` and no other primary condition has yet triggered, WHEN
`scan:complete {nodeId}` fires matching the known anomaly-node id, THEN
`session:request_end {reason: "completion_trap"}` is called in that same synchronous step.
**BLOCKING (Logic)**

**AC-WL04 — Completion Trap fires regardless of remaining standard-node coverage**
GIVEN ANOMALY_FINAL resolves VALID while zero, some, or all standard nodes remain incomplete,
WHEN `scan:complete` fires for the anomaly node in each case, THEN
`session:request_end {reason: "completion_trap"}` is called identically in all three cases —
coverage state never gates or suppresses this trigger. **BLOCKING (Logic)**

### Escape Trigger (Rule 3)

**AC-WL05 — Last standard node VALID with anomaly not VALID triggers ESCAPE**
GIVEN `nodesCompleted.X` is one below `nodesCompleted.Y` and the anomaly node's status is
anything other than VALID (e.g. DORMANT or ABORTED), WHEN the final standard node's
`scan:complete` resolves VALID such that `nodesCompleted.X === nodesCompleted.Y`, THEN
`session:request_end {reason: "escape"}` is called immediately. **BLOCKING (Logic)**

**AC-WL06 — Escape check runs on every scan:complete, not just the final one**
GIVEN `nodesCompleted.X < nodesCompleted.Y` after a `scan:complete` resolves VALID for a
non-final standard node, WHEN that check runs, THEN no `session:request_end` is called — the
equality check is evaluated and correctly found false on every intermediate `scan:complete`, not
skipped until some presumed "last" event. **BLOCKING (Logic)**

**AC-WL07 — Escape does not trigger if the anomaly node is VALID, even with full standard coverage**
GIVEN `nodesCompleted.X === nodesCompleted.Y` would otherwise hold, WHEN the anomaly node's
status is VALID at that moment, THEN `session:request_end {reason: "escape"}` is NOT called —
this scenario instead resolves via Rule 2 (already fired earlier, per Rule 7) or is otherwise
not a valid Escape state. **BLOCKING (Logic)**

### Movement Violation Trigger (Rule 4, Formula)

**AC-WL08 — Movement Violation triggers when all three conditions hold simultaneously**
GIVEN cached `entity:proximity` tier is `ADJACENT`, the current `player:position` sample's delta
from the immediately-preceding sample exceeds `movement_violation_threshold` (default 0.045m),
AND this tick is not one where `floorplan:loop` also resolved, WHEN `player:position` updates,
THEN `session:request_end {reason: "movement_violation"}` is called immediately.
**BLOCKING (Logic)**

**AC-WL09 — No violation when tier is not ADJACENT, regardless of delta**
GIVEN cached tier is `FAR`, `MEDIUM`, or `NEAR` and delta exceeds
`movement_violation_threshold`, WHEN `player:position` updates, THEN no `session:request_end` is
called. **BLOCKING (Logic)**

**AC-WL10 — No violation when delta is at or below threshold, regardless of tier**
GIVEN cached tier is `ADJACENT` and delta is exactly `movement_violation_threshold` or less
(boundary-inclusive, `toBeCloseTo`-safe), WHEN `player:position` updates, THEN no
`session:request_end` is called — the comparison is strictly-greater-than, not
greater-than-or-equal. **BLOCKING (Logic)**

**AC-WL11 — Delta computed as Euclidean distance between consecutive samples**
GIVEN two consecutive `player:position` samples at known 3D coordinates, WHEN delta is computed,
THEN it equals the Euclidean distance formula's result (`toBeCloseTo(expected, 5)`), not a
Manhattan or per-axis comparison. **BLOCKING (Logic)**

**AC-WL12 — Threshold is configurable within the documented safe range**
GIVEN `movement_violation_threshold` is injected at each of 0.035m, 0.045m (default), and
0.070m, WHEN a delta just above and just below each configured value is evaluated at ADJACENT
tier, THEN the violation fires only when delta exceeds that specific injected threshold —
proving the threshold is read from config, not hardcoded. **BLOCKING (Logic)**

### Scan Corruption Trigger (Rule 5)

**AC-WL13 — scan:integrity_failure immediately triggers SCAN_CORRUPTION**
GIVEN Win/Lose is `ACTIVE`, WHEN `scan:integrity_failure` fires, THEN
`session:request_end {reason: "scan_corruption"}` is called in that same synchronous step.
**BLOCKING (Logic)**

### Precedence (Rule 6)

**AC-WL14 — Movement Violation takes precedence over Scan Corruption in the same tick**
GIVEN both the Movement Violation conditions (AC-WL08) and a `scan:integrity_failure` event are
simultaneously true/present within the same tick, WHEN Win/Lose evaluates that tick, THEN the
recorded `primaryOutcome` is `MOVEMENT_VIOLATION`, not `SCAN_CORRUPTION`.
**BLOCKING (Integration)**

**AC-WL15 — Scan Corruption takes precedence over Completion Trap in the same tick**
GIVEN both `scan:integrity_failure` and a `scan:complete` resolving ANOMALY_FINAL VALID are
simultaneously present within the same tick, WHEN Win/Lose evaluates that tick, THEN the
recorded `primaryOutcome` is `SCAN_CORRUPTION`, not `COMPLETION_TRAP`. **BLOCKING (Integration)**

**AC-WL16 — Completion Trap takes precedence over Escape in the same tick**
GIVEN a single `scan:complete` tick where the anomaly node resolves VALID AND
`nodesCompleted.X === nodesCompleted.Y` for standard nodes simultaneously, WHEN Win/Lose
evaluates that tick, THEN the recorded `primaryOutcome` is `COMPLETION_TRAP`, not `ESCAPE`.
**BLOCKING (Integration)**

**AC-WL17 — Full precedence chain resolves correctly when all four conditions coincide**
GIVEN a single tick engineered so that Movement Violation, Scan Corruption, Completion Trap, and
Escape conditions are ALL simultaneously true, WHEN Win/Lose evaluates that tick, THEN the
recorded `primaryOutcome` is `MOVEMENT_VIOLATION` — proving the full precedence order resolves
correctly under maximal contention, not just each adjacent pair in isolation (AC-WL14–16 test
pairs; this AC tests all four at once). **BLOCKING (Integration)**

### Single-Fire Guarantee (Rule 7)

**AC-WL18 — Once ENDED, no second session:request_end fires even if a new condition becomes true later**
GIVEN Win/Lose has already transitioned to `ENDED` (any primary outcome recorded), WHEN a
second, independent qualifying condition (e.g. a Movement Violation) becomes true on a later
tick, THEN `session:request_end` is NOT called a second time, and the originally recorded
`primaryOutcome` is unchanged. **BLOCKING (Logic)**

**AC-WL19 — Single-fire holds even when the second condition would have outranked the first by precedence**
GIVEN Win/Lose already transitioned to `ENDED` via `ESCAPE` (lowest precedence), WHEN a
`Movement Violation` condition (highest precedence) becomes true on a subsequent tick, THEN the
recorded `primaryOutcome` remains `ESCAPE` — proving Rule 7's single-fire guarantee is not
silently bypassed by Rule 6's precedence order re-evaluating after the fact.
**BLOCKING (Integration)**

### Ending Record Construction (Rule 8)

**AC-WL20 — Ending record snapshots all required fields at the trigger moment**
GIVEN any primary outcome triggers `session:request_end`, WHEN the ending record is constructed,
THEN it contains exactly `{ primaryOutcome, coverage, nodesCompleted: {X,Y}, entityEverCaptured }`
with values matching their live state at that exact moment. **BLOCKING (Logic)**

**AC-WL21 — coverage is frozen (not necessarily complete) for MOVEMENT_VIOLATION/SCAN_CORRUPTION**
GIVEN a Movement Violation or Scan Corruption triggers with `coverage` at some partial,
non-terminal value, WHEN the ending record is constructed, THEN `coverage` in the record equals
that in-progress value exactly, unchanged by whatever `coverage` value might exist immediately
after (later ticks never retroactively update the frozen record). **BLOCKING (Logic)**

**AC-WL22 — entityEverCaptured reflects any earlier scan in the session, not only the triggering one**
GIVEN `entityEverCaptured` was already `true` from a scan earlier in the session, unrelated to
the node whose `scan:complete` triggers the current primary outcome, WHEN the ending record is
constructed, THEN `entityEverCaptured: true` is recorded — the field is read fresh at trigger
time, not scoped to the triggering event alone. **BLOCKING (Integration)**

**AC-WL23 — Escape gates on exact integer equality, never a float coverage threshold**
GIVEN `coverage` is a float value at or near a threshold (e.g. 0.99) while
`nodesCompleted.X !== nodesCompleted.Y` (integers not yet equal), WHEN the Escape check runs,
THEN `session:request_end {reason: "escape"}` is NOT called — only exact integer equality of
`nodesCompleted.X`/`Y` gates Escape, `coverage`'s float value is never independently checked
against a threshold. **BLOCKING (Logic)**

### States and Transitions

**AC-WL24 — ACTIVE evaluates all 4 conditions; any one triggers transition to ENDED**
GIVEN state is `ACTIVE` at session start, WHEN each of the 4 primary conditions (Rules 2–5) is
tested independently in isolation (4 separate test runs), THEN each one alone drives the state
from `ACTIVE` to `ENDED` and no further evaluation occurs afterward in that run (re-confirms
Rule 7 per-trigger, not just the compositional AC-WL18). **BLOCKING (Logic)**

### Edge Cases

**AC-WL25 — Entity approaching a stationary player is NOT a Movement Violation**
GIVEN cached tier is `ADJACENT` due to the entity closing distance, and the player's own
consecutive `player:position` samples are identical (delta = 0), WHEN `player:position`
updates, THEN no `session:request_end` is called — the check uses only the player's own position
delta, never a relative entity-distance change. **BLOCKING (Logic)**

**AC-WL26 — entity:proximity never fired this session keeps the Movement Violation gate closed**
GIVEN `entity:proximity` has never been received this session (tier implicitly `FAR`), WHEN a
`player:position` update arrives with a delta exceeding `movement_violation_threshold`, THEN no
`session:request_end` is called — the gate never opens without an explicit `ADJACENT` tier
having been cached. **BLOCKING (Logic)**

**AC-WL27 — First-ever player:position sample performs no violation check**
GIVEN no prior `player:position` sample exists this session, WHEN the first `player:position`
event arrives (regardless of cached tier), THEN no delta is computed and no violation check is
performed for that sample. **BLOCKING (Logic)**

**AC-WL28 — Win/Lose already ENDED ignores any further qualifying event with no second request_end**
GIVEN state is `ENDED`, WHEN any of `scan:complete` (anomaly VALID), `scan:integrity_failure`,
or a qualifying `player:position` update subsequently arrives, THEN none of them calls
`session:request_end` again, and state remains `ENDED`. *(Restates AC-WL18 from the Edge Cases
list's own framing — same guarantee, different entry point.)* **BLOCKING (Logic)**

**AC-WL29 — Movement Violation excluded on the exact same tick floorplan:loop resolves**
GIVEN cached tier is `ADJACENT` and delta exceeds `movement_violation_threshold` on the same
tick `floorplan:loop` also resolves, WHEN `player:position` updates that tick, THEN no
`session:request_end` is called — proving Core Rule 4's explicit same-tick exclusion clause,
distinct from AC-WL08's positive case. **BLOCKING (Integration)**

**AC-WL30 — session:end from a non-Win/Lose source stops evaluation without fabricating an outcome**
GIVEN Win/Lose is `ACTIVE` and no primary condition has yet triggered, WHEN `session:end`
arrives from a source other than this system's own `session:request_end` call (e.g. a future
debug command), THEN Win/Lose stops evaluating all 4 conditions, does not call
`session:request_end` itself, and no `primaryOutcome` is recorded for that session.
**BLOCKING (Integration)**

> **Two `scan:complete` events for different nodes in the same tick**: explicitly out of scope —
> structurally prevented by Scan Mechanic's single-scan-in-flight rule (cannot occur under the
> real system contract) — **no AC written; N/A by design, not an oversight.**

> *Note: `qa-lead` consulted (lean-mode Section H high-risk spawn).*

## Coverage Validation

| Source | AC(s) |
|---|---|
| Core Rule 1 (primary ending taxonomy + entityEverCaptured independence) | AC-WL01, WL02 |
| Core Rule 2 (Completion Trap trigger) | AC-WL03, WL04 |
| Core Rule 3 (Escape trigger) | AC-WL05, WL06, WL07 |
| Core Rule 4 (Movement Violation trigger) | AC-WL08, WL09, WL10, WL11, WL12 |
| Core Rule 5 (Scan Corruption trigger) | AC-WL13 |
| Core Rule 6 (precedence order) | AC-WL14, WL15, WL16, WL17 |
| Core Rule 7 (single-fire guarantee) | AC-WL18, WL19, WL24, WL28 |
| Core Rule 8 (ending record construction) | AC-WL20, WL21, WL22, WL23 |
| Formula (movement violation distance check) | AC-WL08, WL09, WL10, WL11, WL12 |
| State table: ACTIVE→ENDED | AC-WL24 |
| Edge Cases (8 of 9; 1 explicitly N/A) | AC-WL25–WL30; two-scans-same-tick N/A |

No Core Rule, the Formula, the state table, or any in-scope Edge Case is left without a
corresponding criterion — the one exception (two `scan:complete` events for different nodes in
the same tick) is explicitly out of scope per this GDD's own text, not a gap.

## Open Questions

1. **The ending record has no `anomaliesLogged` field, but the UI Requirements matrix
   references it.** `ANOMALIES LOGGED: [X]` appears in the master GDD's terminal screen template
   and this GDD's own text-variation matrix describes it as "session-cumulative
   anomaly-detection tally" — but no Core Rule defines what counts as an "anomaly detection" or
   which system's events feed it (candidates: Point Cloud Renderer's `renderer:anomaly_density`,
   Entity System's manifestation count, or a new tally Win/Lose itself would need to maintain).
   *Owner: whoever revisits this GDD's ending-record schema — likely alongside Entity System or
   Point Cloud Renderer. Must be resolved before UI/HUD can fully implement the terminal screen;
   not blocking this GDD's own approval, since it doesn't affect ending *evaluation* logic, only
   the record's field list.*

2. **`movement_violation_threshold` (0.045m default) is a systems-designer estimate,
   unplaytested.** Validate during Vertical Slice — a too-tight threshold could produce
   accidental violations from camera-look-induced positional jitter (if any exists at the
   renderer level) that wasn't accounted for in the calibration. *Owner: game-designer /
   systems-designer.*

3. **Final ending-screen copy is entirely deferred.** The text-variation matrix (UI
   Requirements) fixes the *structure* (which fields vary, the 2-register STATUS split,
   entityEverCaptured touching exactly one field) but no actual wording exists yet — including
   which single field (`STATUS` or `ANOMALIES LOGGED`) `entityEverCaptured` modulates. *Owner:
   writer, in coordination with narrative-director. Resolve when UI/HUD's GDD or the
   ending-screen UX spec is authored.*

4. **Escape's exact coverage percentage varies per property**, since it depends on the specific
   node count (S) of whichever property the curated pool selected (the master GDD's own example
   used 12/13 ≈ 92%, but S varies per property per Floor Plan's data). This is expected
   behavior, not a bug — noted here only so a future reader doesn't mistake the ~92% figure for
   a hardcoded constant.
