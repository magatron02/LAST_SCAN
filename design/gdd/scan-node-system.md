# Scan Node System

> **Status**: Approved (round 4 independent re-review, 2026-07-01 — unanimous 4-specialist APPROVED)
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-01
> **Implements Pillar**: Perception Stripping (§8) — scan node is the sole ground truth · Inverted Reward (§9)

## Overview

The Scan Node System is the authoritative live record of every scan node in a session —
where each node is, what state it is in (unscanned, valid, invalid, or null), and what
fraction of the property has been validly scanned (**coverage**). The Floor Plan System hands
it a set of *estimated* node anchors at load; from that point on, Scan Node owns the **real**
positions and the real status. Nothing else in the game may claim a node is scanned — this
system is the single source of node truth.

That authority is the point. LAST SCAN strips the player of every reliable instrument except
this one: the dollhouse map drifts and lies (Perception Stripping, §8), the geometry loops,
anomaly rooms hide — but the node list and the coverage count are always honest about what has
actually been captured. The player learns to trust the node ledger precisely because everything
around it has stopped being trustworthy. And that trust is the trap: the system also tracks the
one node that must never be scanned — the anomaly-room final node — and reports completing it
with the same neutral "coverage up" tone as any other (**Inverted Reward**, §9). The system
feels, to the player, like the one honest gauge in a failing machine; mechanically it is a node
registry, a per-node state machine, and the coverage math that the win/lose condition reads.

## Player Fantasy

**The emotional target: the one gauge you trust — and the moment you realize trusting it was
the trap.**

Scan Node is felt directly through the **node ledger**: the list of nodes, the coverage count
ticking up, each node flipping from un-scanned to a clean green capture. Early in the session
this is pure professional competence. The map may be vague, the rooms unfamiliar, but the
ledger is concrete and honest — *this* node is done, coverage is at 40%, here is what remains.
In a game built to make the player doubt everything they see (§8), the node ledger is the one
instrument that never lies about what it has recorded. The player comes to lean on it
completely: when the dollhouse disagrees with the space, they stop believing the dollhouse and
believe the ledger.

That earned trust is exactly what the system turns against them. The ledger's prime directive —
*scan every node* — is reinforced every time coverage rises and the log praises thoroughness.
But the final node lives in the anomaly room, and scanning it captures the entity (§9). The
system reports that capture in the same flat, affirming tone as every other node: coverage up,
one more green tick, well done. **There is no warning gauge for the one action that loses the
game.** The honest instrument stays honest right up to and through the mistake — it tells the
player the truth about coverage while the truth about coverage is the thing killing them.

The fantasy is not mastery of a tool. It is the slow, retrospective horror of realizing the
gauge you trusted was only ever counting — never judging — and that "100%" was a number you
should have been afraid of.

**Reference feeling:** the completion-compulsion of a checklist or achievement bar, weaponized
— the same itch that drives 100% completion runs, pointed at a number that means death. Closest
cousins: the deliberately misleading "good job" framing of *Inscryption*'s and *Pony Island*'s
diegetic UIs.

**Anchor moment:** the coverage ring hitting 100% and the screen reporting success in the same
neutral voice it used at 12% — the player feeling accomplished for half a second before the
ending tells them what 100% meant.

> *Note: `creative-director` not consulted — Lean mode. Review this framing manually before
> production.*

The trust this section describes is not manufactured by Scan Node itself — it is
delivered by contrast with Floor Plan's desync (now Approved): the dollhouse visibly
drifts and lies (Formula 2, §8) while the ledger never does. Scan Node's job is to
**stay honest while the dollhouse doesn't** — not to prove its own honesty through any
rule of its own. Worth holding in mind reading Core Rules below: "authoritative,"
"single source of node truth," and "the one honest gauge" describe what the system
*is*, not a guarantee that it is *safe to act on* — the Player Fantasy's own sharper
point is that honesty about coverage and truth about survival are orthogonal axes.

## Detailed Design

### Core Rules

1. **Node roster from Floor Plan init; positions owned here.** On the one-time
   `floorplan:init {propertyId, roomMeta, nodeRoster}`, Scan Node builds its roster
   from every STANDARD, ANOMALY_FINAL, and NULL metadata entry, including hidden
   room membership + `estimatedPosition`. The event contains no hidden-room AABBs
   or surfaces. For each node Scan Node adopts the **authoritative real position**
   from per-property session data (`data/sessions/`, §16); where no authored
   position exists it falls back to the floor-plan estimate. Later geometry-only
   `floorplan:update` events never rebuild or resize the roster. The dollhouse keeps
   showing estimates — Scan Node holds truth. *(This is the truth/estimate
   divergence floor-plan AC-C07 depends on.)*

2. **Node types.** Each node is one of:
   - `STANDARD` — a normal scannable node.
   - `ANOMALY_FINAL` — the Completion-Trap node in the anomaly room (§9). Instantiated at init
     from authored data but **not scannable** until its room is revealed.
   - `NULL` — a locked `[?]` storage node (§8). Permanently unscannable; returns null; excluded
     from coverage.

3. **Manual trigger only — Scan Mechanic owns the verb.** Scan Node never starts a scan. A node
   enters `SCANNING` only when Scan Mechanic reports a scan began there (`scan:started {nodeId}`).
   Triggering a `NULL` node, an already-`VALID` node, or a non-scannable `ANOMALY_FINAL` is
   rejected (no state change).

4. **Status lifecycle.** `UNSCANNED → SCANNING → (VALID | INVALID)`. On Scan Mechanic reporting
   capture done, Scan Node validates and:
   - success → `VALID`, record `entityCaptured` (from reported `entityInFrame`), recompute
     coverage, emit authoritative `scan:complete {nodeId, valid:true, entityCaptured, coverage}`.
   - abort/corrupt → `INVALID`, emit `scan:abort {nodeId, coverage}`. `INVALID` is re-scannable
     (a fresh trigger returns it to `SCANNING`). Matches §3 "abort → invalid → must restart."

5. **Scan Node is the authority that declares a node scanned.** Scan Mechanic performs the 360°
   capture; Scan Node decides validity and **emits the canonical `scan:complete` / `scan:abort`**
   that the renderer (SCAN_MATERIALIZING), FPS Movement (unlock), and Floor Plan (anomaly reveal)
   all listen for. A node is not "complete" until the authority says so. *(Provisional — confirm
   against Orchestrator + Scan Mechanic when authored.)*

6. **Coverage definition** *(answers floor-plan Open Q#2):*
   `coverage = validNodes / totalScannableNodes`, where **totalScannableNodes = all STANDARD +
   the ANOMALY_FINAL node** (NULL excluded). The anomaly node is in the denominator **from
   init**, even while hidden. Therefore a player who scans every standard node but never the
   anomaly node tops out at `N/(N+1) < 100%` — the §9/§10 escape that the UI flags as
   "incomplete." Scanning the anomaly node → `100%` → Completion Trap. This same `coverage` is
   what floor-plan `session_escalation` reads.

7. **Entity-in-frame is recorded, not detected.** Scan Mechanic/Entity decide whether the entity
   was in the capture frame; Scan Node only records the reported `entityInFrame` per node and a
   session-level `entityEverCaptured`. This flag is what Win/Lose reads for the bad ending (§9).

8. **Integrity threshold.** Scan Node tracks cumulative invalid/corrupted captures. On reaching
   `corruption_threshold` (default 4, §11) it emits `scan:integrity_failure`; Win/Lose owns the
   resulting ending. Below threshold each invalid emits `scan:integrity_warning {count}`.

9. **Idempotency.** Re-completing an already-`VALID` node is a no-op — coverage and counters
   unchanged.

### States and Transitions

**Per-node:**

| State | Description | Entry | Exit |
|---|---|---|---|
| `UNSCANNED` | Known, not yet captured | Init (STANDARD/ANOMALY_FINAL) | `scan:started` → SCANNING |
| `SCANNING` | Capture in progress (driven by Scan Mechanic) | `scan:started {nodeId}` | capture done → VALID / INVALID |
| `VALID` | Captured & counted toward coverage | successful capture | — (terminal; re-trigger is no-op) |
| `INVALID` | Aborted/corrupted; not counted | abort or corruption | fresh `scan:started` → SCANNING |
| `NULL` | Locked `[?]`, never scannable | Init (LOCKED room) | — (permanent) |

**Scannable gate:** `ANOMALY_FINAL` starts `scannable=false`; `floorplan:reveal {roomId}` of its
room flips it `true`. Triggering it before that = rejected (rule 3).

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| **Floor Plan** | in | `floorplan:init` once (complete node roster + room mapping + estimates, including hidden metadata); `floorplan:reveal {roomId}` (flip anomaly node scannable). Geometry-only `floorplan:update` does not change the roster. |
| **Floor Plan** | out | `scan:complete` consumed by Floor Plan (reads `nodeId`) to fire anomaly reveals *(floor-plan GDD records this ✅ bidirectional)*. |
| **Scan Mechanic** | in | `scan:started {nodeId}` → SCANNING; `scan:captured {nodeId, valid, entityInFrame}` → VALID/INVALID. ⚠️ *Provisional — Scan Mechanic undesigned.* |
| **Orchestrator** | out | Emits authoritative `scan:complete {nodeId, valid, entityCaptured, coverage}`, `scan:abort {nodeId, coverage}`, `scan:coverage {coverage}` (on change), `scan:integrity_warning {count}`, `scan:integrity_failure {}` (payload-less by design — declared explicitly so the registry can verbatim-compare, Orchestrator AC-OR01). |
| **Win/Lose** | out | Reads `coverage`, `anomalyNodeScanned`, `entityEverCaptured`, integrity state for ending evaluation (§9). ⚠️ *Provisional — Win/Lose undesigned.* |
| **UI / HUD** | out | Node list + per-node status + coverage for the sidebar node list, coverage ring, `NODES COMPLETED X/Y` (§10). ⚠️ *Provisional.* |
| **Point Cloud Renderer** | out | `scan:complete` drives SCAN_MATERIALIZING *(renderer GDD records this ✅)*. |

Scan Node imports nothing directly — all cross-system flow is via Orchestrator events.

### Cross-System Invariants

Scan Node is the project's most densely-connected hub (5 downstream consumers). Its
first review (2026-06-30) found every blocking issue at the **inheritance boundary**
with a sibling doc — an assumption, a UI precedent, or a master-GDD mechanic shared
with another document but only half-restated here. This table names every such
assumption explicitly, the doc that owns enforcement, and what breaks if it's wrong.
Extend it whenever a new shared assumption is identified, the way Floor Plan's
Interaction Matrix tracks internal rule interactions — this is the same fix, pointed
outward. **This table names a shared assumption; it does not by itself prove the
seam is tested.** Each row should eventually have a composition AC that exercises
the real connective code on both sides, not two ACs that each mock the other side
with a fixture that already assumes the invariant holds (see the last row below).

| Shared assumption | Owning doc / enforcement | Breaks if wrong |
|---|---|---|
| Exactly one `ANOMALY_FINAL` node per `PropertyLayout` | Floor Plan — `AC-E17`, load-time guard | `S = count(STANDARD)+1` undercounts; AC-SN13/SN14 fail; Floor Plan's own `w_t≤0.8` "D_max only via trap" guarantee inherits the break |
| `scan:coverage` is the **canonical** coverage broadcast; `scan:complete.coverage` is a same-tick snapshot guaranteed equal to it | This doc — Core Rule 6, `scan:coverage` on every change; Floor Plan `session_escalation` (AC-D01) reads `scan:coverage` | If a consumer reads `scan:complete.coverage` and Floor Plan reads `scan:coverage` from a different tick, the two could observe different values — this doc guarantees they never do (both are computed and emitted synchronously within the same handler, AC-SN29) |
| A consumer must read `coverage` as a **level at emission time**, never diff two successive emissions to infer a delta | This doc — Core Rule 6, Edge Cases, AC-SN29 | Diffing two *legitimate* successive `scan:complete.coverage` values (e.g. after two different nodes resolve) to compute a delta, instead of reading each payload as the current level, misreads the contract — idempotent re-completes never reach here at all (rejected at AC-SN09) |
| `entityCaptured`/`entityEverCaptured` is recorded but not yet surfaced to the player by any system | Deferred — master GDD §15-D3 (Redacted Scan Results) / §16-J2 (EVP) own the eventual signal; this doc only records the flag, and its view model does not expose it until one of them does | Until D-3/EVP are designed, the data has nowhere to go — see Open Q#5. If `entityCaptured` ever leaks into any visible UI channel before then, D-3's central ambiguity ("player cannot tell whether that node captured an entity") is preemptively destroyed |
| `coverage` is the trust-bearing number; `nodesCompleted` is secondary, co-located but not equal-weighted | Deferred to the future HUD GDD; this doc specifies the priority as a constraint the HUD GDD inherits (see UI Requirements) — **placeholder AC-SN31, DEFERRED** | If the future HUD GDD lets `nodesCompleted`'s integer-completeness read (12/12 "done") outrank `coverage`'s percentage, the player trusts the wrong gauge before the Inverted Reward (§9) anchor moment ever lands |
| The coverage ring (and per-node status) must carry a non-colour signal | Floor Plan precedent (`floor-plan-system.md` UI Requirements — coverage ring) — same UI element, same requirement, inherited here | Colourblind players lose the false-comfort framing the Inverted Reward depends on |
| `scan:complete` fires only after this system's internal state (`status`, `coverage`) is already updated | This doc — Core Rule 5, AC-SN29 | A listener (renderer, FPS Movement, Floor Plan) reading state synchronously inside its own `scan:complete` handler could observe stale data |
| Floor Plan's AC-E17 (exactly one `ANOMALY_FINAL`) and this doc's `S = count(STANDARD)+1` are each tested in isolation, on hand-rolled fixtures | **Untested seam — placeholder AC-SN30, DEFERRED** (write once the real `floorplan:init` payload-construction path exists) | Each side's guard can be individually correct while the connective code between them (turning a validated `PropertyLayout` into the wire-shaped `floorplan:init` event) silently drops the invariant — an Invariants row names the assumption but does not by itself prove the seam is tested |

## Formulas

### Formula 1 — Coverage

The `coverage` formula is defined as:

`coverage = V / S`

The single fraction the win/lose condition and floor-plan escalation both read. Honest about
what has been captured — the system's defining trait.

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Valid nodes | V | int | 0 – S | Count of nodes currently in `VALID` state (excludes NULL; excludes ANOMALY_FINAL unless it is itself VALID) |
| Total scannable | S | int | ≥ 1 | `count(STANDARD) + 1` (the single ANOMALY_FINAL node). NULL excluded. **Fixed at session init — `floorplan:reveal` never changes S.** |
| Coverage | coverage | float | 0.0 – 1.0 | Fraction of scannable property captured |

**Output Range:** [0.0, 1.0] by construction (V is a non-negative int ≤ S; the state machine
enforces both bounds — no clamp needed). Exactly `1.0` is reachable only when ANOMALY_FINAL is
`VALID` (the Completion Trap).
**Examples** (property: 12 STANDARD + 1 ANOMALY_FINAL + 3 NULL → S = 13):
| Scenario | V | coverage | Meaning |
|---|---|---|---|
| Session start | 0 | **0.000** | Baseline |
| Partial (6 standard valid) | 6 | **0.462** | escalation reads this; dollhouse drifts |
| Escape (all 12 standard, anomaly never scanned) | 12 | **0.923** | UI flags "incomplete" (§9/§10) → survive |
| Completion Trap (all 13 incl. anomaly) | 13 | **1.000** | bad ending |

This `coverage` is consumed unchanged by floor-plan `session_escalation`
(`e = clamp(w_t·(t/T_session) + w_c·coverage, 0, 1)`) — already bounded, no separate clamp.

### Derived Metrics

- **`nodesCompleted` (UI counter, §10 "NODES COMPLETED: X / Y")** — **standard-only denominator**:
  `X = validStandardNodes`, `Y = count(STANDARD)`. The ANOMALY_FINAL node is **absent** from this
  counter until its room is revealed (matches §8 hiding and the "no warning gauge" fantasy). A
  player on the escape path therefore sees `12 / 12` *and* `coverage 92.3%` simultaneously — full
  node list, sub-100% coverage — an intentional dissonance, not a bug.
  > ⚠️ **Divergence flag for implementers:** the `nodesCompleted` denominator (`N`) is **not** the
  > `coverage` denominator (`N+1`). They are deliberately different. A programmer reading one
  > without the other must not "fix" the mismatch. Flagged for creative-director review at HUD
  > GDD time (lean mode — not consulted here).

- **`integrityCount`** — a monotonic accumulator of captures that resolved `INVALID` this session.
  Not a ratio. The only math is the threshold compare: `integrityCount ≥ corruption_threshold
  (default 4, §11) → emit scan:integrity_failure`.

### Formula-Domain Boundary Cases

- **S = 0** (property with no STANDARD and no ANOMALY_FINAL node): division by zero. Guard
  `coverage = 0.0` and raise a console error — this is an authoring bug caught by layout
  validation before the session starts, never a runtime gameplay state.
- **All-NULL property:** identical to S = 0 (NULL excluded). Same guard.
- **Anomaly room revealed mid-session:** S is unchanged (reveal flips the node's `scannable`
  gate only). `S` before and after `floorplan:reveal` is a testable invariant.
- **Precision:** `coverage` is `int/int` in IEEE-754 doubles — exact for realistic node counts.
  Vitest assertions use `toBeCloseTo(expected, 10)`, not strict `toBe`.

> *Note: `systems-designer` consulted (Lean mode, Section D high-risk spawn).*

## Edge Cases

- **If `scan:started` arrives for a `NULL` node**: rejected, no state change. NULL nodes are
  never scannable (rule 3). Scan Mechanic should not target them; this is a safety guard.

- **If `scan:started` arrives for an already-`VALID` node**: rejected, no-op. Re-scanning a
  completed node does nothing (idempotency, rule 9). Coverage unchanged.

- **If `scan:started` arrives for an `ANOMALY_FINAL` node whose room is not yet revealed**
  (`scannable=false`): rejected. The node exists in the roster and counts toward S, but cannot be
  captured until `floorplan:reveal` flips its gate.

- **If `scan:captured` reports `valid:true` with `entityInFrame:true`** (entity captured in a
  successful scan): the node still becomes `VALID` and counts toward coverage — the capture
  *succeeded*. `entityCaptured` is recorded and `entityEverCaptured` set. The scan is not
  invalidated; the consequence is the bad-ending flag (§9), owned by Win/Lose. A successful scan
  that captures the entity is the trap working as designed, not an error.

- **If `scan:captured` arrives for a node not in `SCANNING` state** (spurious/duplicate capture
  report): rejected, no-op. Only a node currently `SCANNING` can transition to VALID/INVALID.
  Guards against double-processing.

- **If the player aborts and immediately re-scans the same node**: allowed. `INVALID → SCANNING →
  VALID` is a valid path; the node was never counted while INVALID, so coverage only rises on the
  eventual VALID. Repeated aborts increment `integrityCount` each time.

- **If `integrityCount` reaches `corruption_threshold` (4)**: emit `scan:integrity_failure`
  **once**. Further invalids still increment the counter but do not re-emit failure (single fire).
  Win/Lose owns whether/when the session actually ends.

- **If `floorplan:reveal` arrives for a room with no `ANOMALY_FINAL` node** (a standard reveal, or
  a room Scan Node has no anomaly node for): no-op on the scannable gate. Reveal only affects
  nodes Scan Node holds for that room.

- **If `floorplan:reveal` arrives twice for the same anomaly room** (duplicate): idempotent. The
  gate is already `scannable=true`; the second reveal changes nothing.

- **If `scan:complete` would fire but `coverage` is unchanged**: the event still carries the
  current `coverage`; downstream consumers must treat `coverage` as a level, not a delta.
  (Idempotent re-completes don't reach here — they're rejected at rule 9.)

- **If two `scan:captured` events resolve in the same frame** (defensive — scanning is normally
  single-node-locked): process in arrival order; each recomputes coverage; the final emitted
  `coverage` reflects both. No node is dropped.

- **If session reaches end (`session:end`) with a node still `SCANNING`**: that node is treated as
  not-VALID (never counted). Coverage is frozen at its current value for the ending evaluation. An
  in-flight scan at session end does not retroactively complete.

## Dependencies

**Upstream — what Scan Node consumes:**

| System | Type | Interface |
|---|---|---|
| **Orchestrator** | Event bus (**hard**) | All cross-system flow rides here. ⚠️ *Provisional — Orchestrator undesigned; event names are this GDD's proposed contract.* |
| **Floor Plan System** | Hard (data provider) | `floorplan:init` → complete node roster (ids/types, room mapping, estimated positions) once at load; `floorplan:reveal {roomId}` → flips ANOMALY_FINAL `scannable`. Geometry-only `floorplan:update` is irrelevant to roster size. *(Floor-plan GDD records Scan Node as a downstream consumer ✅.)* |
| **Scan Mechanic** | Hard (verb driver) | `scan:started {nodeId}` → SCANNING; `scan:captured {nodeId, valid, entityInFrame}` → VALID/INVALID. ⚠️ *Provisional — Scan Mechanic undesigned.* |

Scan Node owns its authoritative node positions (per-property session data) outright — Floor Plan
supplies only estimates and the roster. No direct imports; everything via Orchestrator.

**Downstream — systems that depend on Scan Node:**

| System | What they need | Interface |
|---|---|---|
| **Floor Plan System** | Anomaly reveal trigger | `scan:complete` — Floor Plan matches its `nodeId` field against each room's `revealTriggerNodeId`. *(Bidirectionally consistent — floor-plan GDD already lists this ✅.)* |
| **Point Cloud Renderer** | Scan completion signal | `scan:complete` drives SCAN_MATERIALIZING. *(Renderer GDD records this ✅.)* |
| **FPS Movement** | Scan exit signal | `scan:complete` / `scan:abort` exits SCAN_LOCKED. *(FPS GDD records this ✅.)* |
| **Win/Lose & Ending** | Ending inputs | `coverage`, `anomalyNodeScanned`, `entityEverCaptured`, `scan:integrity_failure` (§9). ⚠️ *Provisional — Win/Lose undesigned.* |
| **UI / HUD** | Display data | Node list + per-node status + `coverage` + `nodesCompleted X/Y` for sidebar node list and coverage ring (§10). ⚠️ *Provisional.* |

**Hard vs. soft:** the only hard structural dependencies are the **Orchestrator bus**, the
**Floor Plan roster** (no nodes without it), and the **Scan Mechanic** driver (no captures without
it). Win/Lose and UI are soft consumers of emitted state.

**Bidirectional actions:**
1. **Floor Plan GDD** — already records the Scan Node relationship both directions ✅; amended
   2026-06-30 with **AC-E17** (exactly one `ANOMALY_FINAL` node enforced at load) to close the
   `S`-invariant gap this GDD's first review surfaced — see Cross-System Invariants above.
2. **Orchestrator GDD (when authored)** — must register the `scan:*` event family (`scan:started`,
   `scan:captured`, `scan:complete`, `scan:abort`, `scan:coverage`, `scan:integrity_warning`,
   `scan:integrity_failure`).
3. **Scan Mechanic GDD (when authored)** — must emit `scan:started` / `scan:captured` and treat
   Scan Node as the authority that emits the canonical `scan:complete` / `scan:abort`.

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `corruption_threshold` | 4 | 2–10 | Integrity failure (§11) almost never triggers; aborting carries no risk, removing a lose condition | Session ends after a couple of unlucky aborts; punishing, kills willingness to abort a dangerous scan |

**Per-property authoring values** (content, set per `PropertyLayout` / session data — not global
sliders):
- **Which node is `ANOMALY_FINAL`** — the single Completion-Trap node (§9). Exactly one per
  property.
- **Which nodes are `NULL`** — locked `[?]` storage nodes (§8), excluded from coverage.
- **Authoritative node positions** — the real per-node positions Scan Node holds (may diverge from
  the floor-plan dollhouse estimates — the divergence floor-plan AC-C07 depends on).
- **`nodesCompleted` display rule** — standard-only denominator (Section D); a single project-wide
  convention, not per-property. Flagged for creative-director review at HUD GDD time.

**Interaction notes:**
- `corruption_threshold` interacts with Entity/Scan Mechanic tuning: if the entity forces frequent
  aborts late-game, a low threshold compounds with proximity pressure into a near-unavoidable
  integrity loss. Tune as a pair with entity aggression once Entity is designed.
- Coverage has **no weighting knobs of its own** — it is a pure count ratio (Formula 1). The
  weighting that turns coverage into dread lives in floor-plan `session_escalation` (`w_t` / `w_c`),
  not here.

## Visual/Audio Requirements

This system produces **no pixels or audio directly**. Scan completion is rendered by the Point
Cloud Renderer (SCAN_MATERIALIZING on `scan:complete`); the node ledger and coverage ring are
drawn by UI/HUD. Scan Node supplies state; other systems render it. No own assets — `/asset-spec`
is **not** required.

## UI Requirements

Scan Node supplies the **node-ledger view model** to UI/HUD, which renders it. Scan Node owns the
data; UI owns the pixels.

- **View model:** for each non-NULL node — `{ nodeId, roomId, status (UNSCANNED/SCANNING/VALID/
  INVALID), displayPosition }`; plus `coverage` (0–1), `nodesCompleted {X, Y}` (standard-only,
  Section D), and `integrityCount`. NULL nodes render as `[?]` with no scannable affordance.
- **Must reflect, not reframe:** Scan Node provides raw status and counts; the §10/§15-H "coverage
  is good" framing (green ring, praise log) is UI's, not this system's. Scan Node never
  editorialises — it reports `coverage=1.0` in the same neutral form as `0.5`.
- **`nodesCompleted` vs `coverage` divergence** (Section D): UI must display the standard-only
  `nodesCompleted` counter and the `N+1`-denominator `coverage` as the two distinct numbers they
  are — not reconcile them. **Co-location constraint (GDD-level, not deferred):** the two numbers
  must be visible **together** (same widget or immediately adjacent), separated only by a diegetic
  buffer (e.g. the `SPATIAL INDEX MISMATCH` log Floor Plan's UI Requirements already names for
  this exact dissonance) — never far enough apart that the divergence goes unnoticed, never bare
  enough that it reads as an obvious bug instead of scanner corruption. This is load-bearing for
  §9 Inverted Reward, not a cosmetic layout choice; the future HUD GDD must build to this
  constraint, not invent its own. **Trust ordering (GDD-level, not deferred):** co-location alone
  does not neutralize the strong UI convention that an X/Y-complete integer reads as more
  authoritative/final than a percentage — `nodesCompleted` hitting "12/12" risks reading as "done"
  while `coverage` at 92.3% reads as "still catching up," which is backwards: `coverage` is the
  number telling the truth. `coverage` must be the visually **dominant** element of the pair;
  `nodesCompleted` is secondary/supporting. The exact typographic mechanism (size, position,
  ordering) is HUD-GDD scope — the priority itself is not.
- **Accessibility — non-colour channel required:** the coverage ring and per-node status list
  must carry a non-colour signal (fill level, icon, or text label), identical in spirit to the
  requirement Floor Plan's UI Requirements already locks for the same coverage ring
  (`floor-plan-system.md`, UI Requirements). This is the same ring and the same data — the
  requirement does not reset per-GDD.
- **Early-game framing requirement (GDD-level, not fully deferred):** the future HUD GDD's
  coverage-ring framing must read as unambiguously positive in the early/mid session — this is
  the setup the Inverted Reward (§9) anchor moment inverts. Scan Node requires this framing exist;
  the visual execution remains HUD-GDD scope.
- **Update triggers:** `scan:complete`, `scan:abort`, `scan:coverage`, `scan:integrity_warning`,
  and node `SCANNING` entry.

> **📌 UX Flag — Scan Node System**: the node list, coverage ring, and `NODES COMPLETED X/Y`
> readout are UI surfaces. In Pre-Production, run `/ux-design` for the HUD scan panel before
> writing epics; UI stories should cite `design/ux/hud.md`, not this GDD directly. (Note in
> systems index.)

## Acceptance Criteria

26 criteria: 19 BLOCKING (Logic) + 7 BLOCKING (Integration). No ADVISORY — this system emits
data/events and renders nothing. **AC-SN22, AC-SN30, AC-SN31 are currently DEFERRED** — do not
pull any of the three into a sprint as ready. `DEFERRED` splits into two distinct kinds here,
mirroring this doc's own Open Questions Owner/Resolve-when pattern:

| AC | Kind | Owner | Resolve when |
|---|---|---|---|
| AC-SN22 | `DEFERRED (design)` — blocked on unauthored design docs | lead-programmer | Orchestrator (#5) + Win/Lose (#10) + Scan Mechanic (#8) are all authored |
| AC-SN30 | `DEFERRED (implementation)` — design is stable (Floor Plan AC-E17 + this doc's `S` formula); blocked only on unwritten connective code | tools-programmer | The real `floorplan:init` payload-construction path is implemented — can be the *first* integration test written for Floor Plan × Scan Node, not gated behind other GDDs |
| AC-SN31 | `DEFERRED (design)` — blocked on the unauthored HUD GDD, AND under-specified as a test (no measurable proxy yet — font-size ratio, DOM order, contrast) even once unblocked | ux-designer | The HUD GDD (#12) is authored; that GDD must write its own AC with a measurable proxy — this AC only carries the *priority* forward, not a runnable test |

**Testability requirements for the implementer:**
- `coverage` must be a pure function of node states (derivable from the registry, no side effects).
- `scan:started`, `scan:captured`, `floorplan:init`, `floorplan:reveal` must be injectable via
  the event bus in Vitest (no real Scan Mechanic / Floor Plan required).
- `integrityCount` and `entityEverCaptured` must be readable as observable state.
- Coverage assertions use `toBeCloseTo(expected, 10)`, not strict `toBe`.

### Node Roster & Types

**AC-SN01 — Node roster built from floorplan:init**
GIVEN a session has not started, WHEN one `floorplan:init` delivers metadata for
12 STANDARD, 1 ANOMALY_FINAL, and 3 NULL nodes (without hidden geometry), THEN the
system holds exactly 16 nodes: 12 STANDARD/UNSCANNED, 1
ANOMALY_FINAL/UNSCANNED/`scannable=false`, and 3 NULL. A later
`floorplan:update` does not change that count. **BLOCKING (Logic)**

**AC-SN02 — NULL is permanently non-scannable, excluded from coverage**
GIVEN a NULL node, WHEN `floorplan:init` is processed, THEN its status is NULL, it never appears
in coverage numerator or denominator, and no inbound event changes its status. **BLOCKING (Logic)**

**AC-SN03 — ANOMALY_FINAL is in the coverage denominator from init**
GIVEN 12 STANDARD + 1 ANOMALY_FINAL initialised, WHEN no scans have run, THEN `S=13`, `V=0`,
`coverage=0.000` — S is 13 at init, before any `floorplan:reveal`. **BLOCKING (Logic)**

### Status Transitions

**AC-SN04 — scan:started → SCANNING**
GIVEN a STANDARD node UNSCANNED, WHEN `scan:started {nodeId}` arrives, THEN status becomes
SCANNING and Scan Node emits none of `scan:complete`, `scan:abort`, or `scan:coverage`
(Scan Mechanic, not Scan Node, owns the SCANNING-entry signal). **BLOCKING (Logic)**

**AC-SN05 — scan:captured valid → VALID + scan:complete**
GIVEN a node SCANNING, WHEN `scan:captured {nodeId, valid:true, entityInFrame:false}` arrives,
THEN status becomes VALID, coverage recomputes, and `scan:complete {nodeId, valid:true,
entityCaptured:false, coverage}` is emitted with the updated coverage. **BLOCKING (Logic)**

**AC-SN06 — scan:captured invalid → INVALID + scan:abort**
GIVEN a node SCANNING, WHEN `scan:captured {nodeId, valid:false}` arrives, THEN status becomes
INVALID, it does NOT count toward coverage, and `scan:abort {nodeId, coverage}` is emitted with
coverage unchanged. **BLOCKING (Logic)**

**AC-SN07 — INVALID is re-scannable (INVALID → SCANNING → VALID)**
GIVEN a node driven to INVALID, WHEN `scan:started` then `scan:captured {valid:true}` arrive, THEN
it transitions INVALID → SCANNING → VALID, coverage increments by 1/S, and `scan:complete` fires.
**BLOCKING (Logic)**

### Rejection Gates

**AC-SN08 — scan:started on NULL is rejected**
GIVEN a NULL node, WHEN `scan:started {nodeId}` arrives, THEN status remains NULL, no event, no
coverage change. **BLOCKING (Logic)**

**AC-SN09 — scan:started on already-VALID is rejected (idempotency)**
GIVEN a VALID node, WHEN `scan:started {nodeId}` arrives, THEN status remains VALID, coverage and
`integrityCount` unchanged, no event. **BLOCKING (Logic)**

**AC-SN10 — scan:started on hidden ANOMALY_FINAL is rejected**
GIVEN an ANOMALY_FINAL with `scannable=false`, WHEN `scan:started {nodeId}` arrives, THEN status
remains UNSCANNED, no event, no coverage change. **BLOCKING (Logic)**

**AC-SN11 — scan:captured for a non-SCANNING node is rejected**
GIVEN a node in UNSCANNED, VALID, INVALID, or NULL (not SCANNING), WHEN `scan:captured {nodeId,
valid:true}` arrives, THEN no state change, no event, no coverage change. *(Test against all four
non-SCANNING states.)* **BLOCKING (Logic)**

### Coverage Formula

**AC-SN12 — Escape boundary: all STANDARD valid, anomaly unscanned = 0.923**
GIVEN S=13 with all 12 STANDARD VALID and ANOMALY_FINAL UNSCANNED, WHEN coverage is evaluated,
THEN `coverage = 12/13` (toBeCloseTo 0.923076923076923, 10) and it has NOT reached 1.0.
**BLOCKING (Logic)**

**AC-SN13 — Trap boundary: ANOMALY_FINAL valid = 1.000**
GIVEN S=13 with all 12 STANDARD VALID, WHEN `scan:started` + `scan:captured {valid:true}` process
for the revealed ANOMALY_FINAL, THEN it becomes VALID, `coverage = 1.000`, and `scan:complete`
carries `coverage:1.0`. **BLOCKING (Logic)**

**AC-SN14 — S is invariant under floorplan:reveal**
GIVEN S=13 at init, WHEN `floorplan:reveal {roomId}` for the anomaly room arrives, THEN S remains
13 (reveal flips `scannable` only); coverage before and after with the same V is identical.
**BLOCKING (Logic)**

**AC-SN15 — S=0 guard**
GIVEN `floorplan:init` delivers only NULL nodes (or an empty roster — a malformed wire
payload, distinct from Floor Plan's AC-E11 authored-layout guard), WHEN coverage is
computed, THEN `coverage = 0.0`, `console.error` is called exactly once with a message
identifying the zero-scannable-nodes condition (assert via `vi.spyOn(console, 'error')`),
and no exception is thrown. **BLOCKING (Logic)**

**AC-SN16 — nodesCompleted uses STANDARD-only denominator, differs from coverage**
GIVEN 12 STANDARD + 1 ANOMALY_FINAL with all 12 STANDARD VALID and ANOMALY_FINAL UNSCANNED, WHEN
both are read, THEN `nodesCompleted = {X:12, Y:12}` and `coverage` is `toBeCloseTo(0.923076923076923, 10)`
(confirms `nodesCompleted.Y` (12) and `S` (13) are independently sourced, per Formula-Domain
Section D). **BLOCKING (Logic)**

### Capture Semantics & Integrity

**AC-SN17 — Entity captured in a valid scan: node still VALID, entityEverCaptured set**
GIVEN a node SCANNING, WHEN `scan:captured {valid:true, entityInFrame:true}` arrives, THEN it
becomes VALID (not INVALID), counts toward coverage, records `entityCaptured=true`, and sets
session-level `entityEverCaptured=true`. The entity in frame does NOT invalidate the scan.
**BLOCKING (Logic)**

**AC-SN18 — Integrity failure fires exactly once**
GIVEN `corruption_threshold=4` and `integrityCount=3`, WHEN a fourth `scan:captured {valid:false}`
processes, THEN `integrityCount=4` and `scan:integrity_failure` is emitted once; a fifth invalid
makes `integrityCount=5` and does NOT re-emit. **BLOCKING (Logic)**

**AC-SN29 — scan:complete fires only after internal state is already updated**
GIVEN a node SCANNING, WHEN `scan:captured {valid:true}` arrives and a listener registered on
`scan:complete` reads the node's status and `coverage` **synchronously from inside its own
handler** (no await), THEN the listener observes status already `VALID` and `coverage` already
reflecting the increment — Scan Node's internal state mutation completes before `scan:complete`
is emitted, not after. (Mirrors Floor Plan AC-C05's synchronous-handler guarantee.) Consumers
must therefore treat every `scan:complete.coverage` payload as the current level at emission
time, not a delta to apply — re-completing an already-VALID node never re-emits (AC-SN09), so a
level read is always safe. AND, in the same handling cycle, listeners registered on `scan:coverage`
and on `scan:complete` both observe the identical `coverage` value — proving the two events'
payloads are equal at emission time, not just that `scan:complete` alone is fresh. **BLOCKING (Logic)**

### Integration

**AC-SN19 — session:end with a node SCANNING: not counted, coverage frozen**
GIVEN a node SCANNING when `session:end` arrives, THEN it does NOT become VALID, does NOT count,
and the coverage used for ending evaluation is the pre-scan value. **BLOCKING (Integration)**

**AC-SN20 — floorplan:reveal flips scannable; duplicate is idempotent**
GIVEN an ANOMALY_FINAL with `scannable=false`, WHEN `floorplan:reveal {roomId}` arrives, THEN
`scannable` becomes true and a subsequent `scan:started` is accepted; a second reveal leaves
`scannable=true` with no error. **BLOCKING (Integration)**

**AC-SN21 — scan:complete carries everything Floor Plan needs to derive a reveal**
GIVEN a node whose id matches some anomaly room's `revealTriggerNodeId`, WHEN that node
resolves VALID, THEN Scan Node emits `scan:complete {nodeId, valid:true, entityCaptured,
coverage}` with the correct `nodeId` and `valid:true` — this AC asserts only Scan Node's
**emission contract** (no real or stubbed Floor Plan module required). The end-to-end
reveal (Floor Plan matching `revealTriggerNodeId` and emitting `floorplan:reveal`) is
Floor Plan's own responsibility, already covered by Floor Plan AC-C05. **BLOCKING (Integration)**

**AC-SN22 — emitted coverage is what session_escalation reads**
GIVEN Scan Node emitted `scan:coverage {coverage:0.462}` (6 valid / S=13, the canonical
broadcast — see Cross-System Invariants), WHEN floor-plan `session_escalation` next evaluates,
THEN the `coverage` term it uses is exactly that payload value (0.462), not a separately
computed one, and is identical to the `coverage` field Scan Node's same-tick `scan:complete`
carried (AC-SN29). *(Contract test — write once #5/#6 exist.)* **BLOCKING (Integration) — DEFERRED**

**AC-SN30 — Cross-GDD seam: a layout passing Floor Plan AC-E17 produces an accurate S**
GIVEN a `PropertyLayout` validated through Floor Plan's real load-time validator (not a
hand-rolled fixture) and the real `floorplan:init` payload-construction path (not yet
written), WHEN Scan Node builds its roster from that real payload, THEN `S = count(STANDARD)+1`
holds exactly — proving Floor Plan's "exactly one `ANOMALY_FINAL`" guarantee and Scan Node's
`S` formula compose through real connective code, not two isolated fixtures that each assume
the invariant. *(Composition test — write once the real init-payload-construction path exists.)*
**BLOCKING (Integration) — DEFERRED**

**AC-SN31 — Early-game framing reads coverage as the dominant, trust-bearing number**
GIVEN the HUD displays `coverage` and `nodesCompleted` together (per UI Requirements),
WHEN a player reads the widget in the early/mid session, THEN `coverage`'s visual treatment
is dominant over `nodesCompleted`'s — the specific mechanism is HUD-GDD scope, but this AC
exists so the priority itself is a tracked, testable commitment rather than unenforced prose.
*(HUD-integration test — write once the HUD GDD and its implementation exist.)*
**BLOCKING (Integration) — DEFERRED**

> *Note: `qa-lead` consulted (Lean mode, Section H high-risk spawn).*

## Open Questions

1. **`nodesCompleted` display rule** — standard-only denominator chosen (Section D), deliberately
   diverging from the `coverage` denominator (`N+1`). Confirm the player-experience call with
   `creative-director` at HUD GDD time. *Owner: creative-director. Resolve before the UI/HUD GDD.*
2. **`entityInFrame` source** — who computes whether the entity was in the capture frame (Scan
   Mechanic vs Entity System)? Scan Node only *records* the reported flag. *Owner: lead-programmer.
   Resolve when Scan Mechanic + Entity are authored.*
3. **`integrityCount` semantics** — currently a global accumulator, never decremented, with
   unlimited re-scans of INVALID nodes. Open: should a successful re-scan reduce it, or a per-node
   retry cap apply? *Owner: game-designer. Resolve in vertical-slice playtest.*
4. **Authoritative node-position pipeline** — how a real Matterport scan becomes per-node
   authoritative positions (distinct from floor-plan estimates) is unspecified — manual authoring
   vs tooling. *(Same pipeline question as floor-plan Open Q#3.) Owner: tools-programmer / producer.
   Resolve before Production.*
5. **`entityCaptured` has no specified player-facing surface yet.** This GDD records
   `entityCaptured`/`entityEverCaptured` (Core Rule 7, AC-SN17) but no system currently
   reads it for player feedback. The master GDD already designs two candidate surfaces —
   §15-D3 "Redacted Scan Results" and §16-J2 "EVP" (delayed audio in completed-scan
   playback) — neither yet cross-referenced or owned by an authored GDD. Distinct from
   "no instrumented gauge at capture time" (intentional, Player Fantasy §B) is "no signal
   whatsoever, ever" (unconfirmed) — confirm at least one of D-3/EVP eventually consumes
   this flag before treating the silence as fair rather than missing. *Owner: technical-artist
   / Entity System. Resolve when Entity (#9) or the Found-Footage Layer (#13) is designed.*
   Master GDD's D-1 "Auto-Typed Log" is **not** a third equal candidate alongside D-3/EVP —
   the master GDD (§15-H) explicitly names it "the only in-world counter-signal," categorically
   different in kind, not just timing: D-3/EVP are strictly post-hoc (can only deepen
   retrospective dread after the ending), while D-1 is the sole mechanism that could
   theoretically change player behaviour *before* the trap springs. Whichever system
   eventually owns D-1 (Entity #9 or Found-Footage Layer #13) must treat it as load-bearing,
   not optional-if-cheaper-than-D-3/EVP. Whether D-1 ever touches `entityCaptured` specifically,
   or is a session-wide log independent of any single node, remains unresolved — confirm
   alongside D-3/EVP, but do not deprioritize it relative to them.

> **Review 2026-06-30 resolved (design-review, 4 specialists + creative-director synthesis):**
> verdict MAJOR REVISION NEEDED — every blocking finding sat at the **inheritance boundary**
> with a sibling doc, not inside Scan Node's own internal logic. Fixed: new **Cross-System
> Invariants** block naming every shared assumption and its owning doc (structural fix,
> mirrors Floor Plan's Interaction Matrix pointed outward); Floor Plan amended with **AC-E17**
> (exactly one `ANOMALY_FINAL` enforced at load — closes the `S`-invariant gap); UI Requirements
> gained a co-location constraint for `nodesCompleted`/`coverage`, an inherited non-colour-channel
> requirement (same ring Floor Plan already required this for), and a GDD-level early-game
> framing requirement; Open Q#5 added cross-referencing master-GDD §15-D3/§16-J2 as the
> deferred-but-intended surface for `entityCaptured`; Player Fantasy reframed — trust is
> delivered by contrast with Floor Plan's desync, not manufactured by any rule here; AC-SN21
> rewritten to test only Scan Node's emission contract (reveal itself is Floor Plan AC-C05's
> job); AC-SN29 added for Core Rule 5's synchronous-ordering guarantee (parity with Floor Plan
> AC-C05); AC-SN04/SN15/SN16 tightened for testability. AC count 22→23.

> **Re-review 2026-06-30 (round 2) — Verdict: NEEDS REVISION, addressed same session.**
> Independent re-verification confirmed the round-1 headline fix (Floor Plan AC-E17) is
> genuinely closed — recomputed from scratch, holds for every layout that can reach a
> session. Two real gaps remained: (1) `scan:coverage` and `scan:complete.coverage` were two
> independently-emitted streams with no stated canonical source — Floor Plan's AC-D01 reads
> `scan:coverage`, this doc's AC-SN22 read `scan:complete.coverage` — two BLOCKING ACs
> asserting different contracts. Fixed: `scan:coverage` named canonical, `scan:complete.coverage`
> guaranteed equal via same-tick emission (AC-SN29); AC-SN22 corrected to cite `scan:coverage`.
> (2) The `nodesCompleted`/`coverage` co-location fix (round 1) solved discoverability but not
> trust-valence — 3 of 4 specialists independently found integer-completeness bias (`12/12`
> reads as more "done" than `92.3%`) unaddressed. Fixed: `coverage` now specified as the
> visually dominant, trust-bearing number — a semantic priority this doc can own without
> authoring the HUD GDD's visual execution. Also fixed: Floor Plan's chained-reveal Edge Case
> wording (accidentally barred the trap node from ever living behind a chain — corrected to
> bar only *duplication*); D-1 "Auto-Typed Log" re-added to Open Q#5 (silently dropped twice);
> new placeholder ACs AC-SN30 (cross-GDD seam composition, DEFERRED) and AC-SN31 (early-game
> framing priority, DEFERRED) so both remaining gaps are tracked commitments, not just prose.
> AC count 23→26.

> **Re-review 2026-07-01 (round 3) — Verdict: NEEDS REVISION, addressed same session.**
> All 3 round-2 fixes independently re-verified: AC-SN22's `scan:coverage` citation confirmed
> accurate against Floor Plan's actual AC-D01 text; trust-ordering and the Invariants-table
> "only" self-contradiction both confirmed genuinely closed, not relocated. One real gap found:
> AC-SN29 was cited in the Cross-System Invariants table as proof `scan:coverage` and
> `scan:complete.coverage` are "guaranteed equal," but its THEN clause never actually asserted
> that — only that `scan:complete` alone is fresh. Same defect class as round 2's own
> composition-gap finding, this time an unproven claim presented as already-closed rather than
> honestly DEFERRED. Fixed: AC-SN29 extended to assert both events' payloads are identical in
> the same handling cycle. Also fixed (process-level, converged across 3 specialists): DEFERRED
> ACs had no Owner/Resolve-when fields and no design-vs-implementation distinction (AC-SN30 is
> blocked on unwritten code for already-Approved GDDs; AC-SN22/31 are blocked on unauthored
> design docs — same tag, different meaning) — added a DEFERRED-tracking table mirroring this
> doc's own Open Questions pattern. D-1 "Auto-Typed Log" reworded in Open Q#5 to inherit the
> master GDD's stated "only in-world counter-signal" hierarchy rather than reading as one of
> three equal candidates. Win/Lose's ending-delivery gap for the Anchor Moment (game-designer's
> fresh finding) ruled out of scope — 4 systems downstream, not this GDD's job to track yet.
