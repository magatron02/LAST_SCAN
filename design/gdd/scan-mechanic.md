# Scan Mechanic

> **Status**: In Design (all 8 required sections + Open Questions written; not yet independently
> reviewed — run `/design-review` in a fresh session)
> **Author**: magatron02 + agents
> **Last Updated**: 2026-07-02
> **Implements Pillar**: Inverted Reward (§9) — this is the verb that captures the entity
> **Creative Director Review (CD-GDD-ALIGN)**: skipped — Lean mode (not a PHASE-GATE in lean).

## Overview

The Scan Mechanic is the scan **verb** — the state machine and timing authority that turns a
player's decision to scan into the locked 360° capture sequence the rest of the game reacts to.
It owns nothing about node truth (that's Scan Node's job) and nothing about camera transform
ownership outside the lock (that's FPS Movement's), but for the duration of a scan it is the
sole driver of the camera's rotation and the sole clock the capture sequence runs on. Triggering
a scan hands control to this system; it returns control only on completion or abort.

Mechanically, Scan Mechanic sits at the convergence point of three systems already built to
expect it: it triggers FPS Movement's `SCAN_LOCKED` state, drives Point Cloud Renderer's
progressive materialization angle-by-angle, and reports capture results to Scan Node for
validation. To the player, it is the moment the game asks them to stop being an agent and
become an instrument — camera locked, rotation automatic, the only choice left is to wait or
abort. This is also the system that, mechanically, makes the Inverted Reward possible: it is
the verb that can capture the entity in a scan, and the only point in the game where "finishing
what you started" and "surviving" can directly conflict.

## Player Fantasy

FPS Movement already describes what losing control feels like (surrender); Scan Node already
describes what a completed scan retrospectively means (the trap). Scan Mechanic's fantasy is
the **four beats in between** — the part the player actually watches.

**The readout is the fantasy.** `[CAPTURING — 0°]` becomes `[CAPTURING — 90°]` becomes
`[CAPTURING — 180°]`. Each transition is a small relief — *one closer* — and a small
escalation, because the entity, if it's coming, is one step closer too. The player isn't
watching a progress bar abstract itself into a percentage; they're reading the same clinical,
procedural text a real scanner would produce, which is exactly why it's worse. Nothing about
the text changes whether the room is empty or not. The machine reports its own progress with
total indifference to what's approaching.

**Every angle is a re-roll of the abort decision.** This is the mechanical heart of the
fantasy: at 0°, aborting costs almost nothing. At 270°, the player has already paid nearly the
full price of vulnerability — sunk cost pulls hard toward finishing, exactly when finishing is
riskiest if something is now close. The game never states this trade-off; the player discovers
it by feeling the pull to "just let it finish" get stronger as the numbers climb, and by
feeling the current entity threat (proximity, sounds) get worse at the same time. Four discrete
beats, not one held breath — this is what separates Scan Mechanic's fantasy from a simple "you
are frozen" state.

**Finishing is not automatically safe — the game just never tells you that.**
`[NODE COMPLETE]` reads the same whether the room was clear or the entity walked through frame
six seconds ago, and — on the one node that matters most — whether it was the right decision at
all. The player who "successfully" completes a scan has no signal, in the moment, whether they
should be relieved. That ambiguity is the whole point: Scan Mechanic doesn't warn, doesn't
celebrate, and doesn't editorialize. It reports, exactly like the machine it is.

**Anchor moment:** the player, mid-abort-vs-wait hesitation at `[CAPTURING — 180°]`, realizing
they've been staring at scan text for three full seconds instead of the room — and that not
looking was never actually a choice they had.

> *Note: `creative-director` not consulted — Lean mode. Review this framing manually before
> production.*

## Detailed Design

### Core Rules

1. **Node data source.** Scan Mechanic reads the session's property data file directly at load
   (the same ADR-0005 schema Floor Plan validates and Scan Node adopts) to obtain each node's
   `authoritativePosition`. This is independent of `floorplan:init`/`floorplan:update` — those
   carry the renderer/UI-facing projections of the same file; Scan Mechanic needs true world
   positions for physical trigger/lock purposes, not the dollhouse's deliberately-diverging
   estimate.

2. **Trigger.** A node's scan interaction becomes available when the player's `player:position`
   is within `capture_trigger_radius` of the node's `authoritativePosition`. Availability is
   suppressed for: (a) any node Scan Mechanic has itself already reported `valid:true` for
   (Rule 9 — tracked locally, no subscription needed), and (b) any node while any scan is
   already in progress (Rule 3). While available, a dedicated rebindable interact key (exact
   binding is UI/HUD or a future input-config GDD's concern; this GDD only requires the key
   exist and be distinct from Escape/WASD) starts the scan. Never automatic — matches the
   interaction-pattern rule that friction must buy dread, not ambush the player.

   NULL and hidden-`ANOMALY_FINAL` nodes need no special-case rejection here: Floor Plan
   withholds their rooms from navigable geometry entirely, so the player physically cannot
   approach them. Scan Node's own rejection gates (AC-SN08/10) remain a defensive backstop
   only, never relied on for this GDD's UX.

3. **Single scan in flight.** Scan Mechanic is one top-level state machine — only one node may
   be mid-sequence at a time (`IDLE` otherwise). A trigger attempt while another scan is in
   progress is ignored.

4. **Sequence phases.** A triggered scan runs `INITIALIZING` → `CAPTURING` (4 beats:
   0°/90°/180°/270°) → `PROCESSING` → `UPLOADING` → back to `IDLE`. Durations are tuning knobs
   (Section G); default total ≈ 4.4s (locked 2.4s / unlocked 2.0s — see Formula 1).

5. **Lock boundary.** `movement:scan_triggered {nodePosition}` fires the instant `INITIALIZING`
   begins (FPS Movement enters `SCAN_LOCKED`). The lock covers `INITIALIZING` + all 4
   `CAPTURING` beats only. The instant the 4th beat's hold completes, Scan Mechanic emits
   `movement:scan_released {}` and FPS Movement returns to `NAVIGATE`; `PROCESSING`/`UPLOADING`
   run fully unlocked.

6. **Camera rotation during CAPTURING.** At scan start, the player's current yaw becomes this
   scan's relative 0° — no initial snap. Each capture beat is one `scan_frame_duration` (`T`,
   registered constant, default 0.5s) window split by the same registered hold fraction `h`
   (default 0.25): during `[0, h×T)` the camera rotates from the previous held angle to this
   beat's target; during `[h×T, T]` it holds still while Point Cloud's existing materialization
   ramp animates. Reuses `h`/`T` rather than inventing new knobs.

7. **Abort.** Escape is the only valid input during `INITIALIZING`/`CAPTURING` (inherited from
   FPS Movement's SCAN_LOCKED contract, unchanged). On Escape, Scan Mechanic immediately emits
   `scan:captured {nodeId, valid:false, entityInFrame}` (Rule 8, evaluated against whichever
   beats completed), discards its sequence, returns to `IDLE`. `PROCESSING`/`UPLOADING` cannot
   be interrupted — a scan that reaches `PROCESSING` always resolves `valid:true`.

8. **entityInFrame determination.** At the end of each capture beat, Scan Mechanic samples the
   current cached `entity:proximity` tier. `entityInFrame` = true if that tier was `NEAR` or
   `ADJACENT` at any sampled beat. MVP proxy — distance-only, no facing/frustum check (see Open
   Questions).

9. **Reporting & local tracking.** On successful completion, Scan Mechanic emits
   `scan:captured {nodeId, valid:true, entityInFrame}` and adds `nodeId` to its own local
   "already-valid" set (Rule 2). This set is a UX aid only, never a competing authority — Scan
   Node's registry remains sole source of truth on coverage/validity.

10. **Re-scan of INVALID nodes.** Inherited from Scan Node: an aborted node is not added to the
    local "already-valid" set, so it remains a valid re-trigger target.

### States and Transitions

| State | Description | Entry | Exit |
|---|---|---|---|
| `IDLE` | No scan in progress; trigger available on eligible nodes | Session start; prior scan resolved (valid or invalid) | Player triggers an eligible node |
| `INITIALIZING` | Flavor beat before capture; camera locked at current yaw | Trigger accepted | `initializing_duration` elapses → `CAPTURING`; OR Escape → abort, `IDLE` |
| `CAPTURING` | 4 beats (0/90/180/270°), camera locked, rotates+holds per beat | `INITIALIZING` elapsed | 4th beat's hold completes → `PROCESSING` (`movement:scan_released` fires); OR Escape at any beat → abort, `IDLE` |
| `PROCESSING` | Post-capture flavor phase; unlocked | 4th beat complete | `processing_duration` elapses → `UPLOADING` |
| `UPLOADING` | Final flavor phase; unlocked | `PROCESSING` elapsed | `uploading_duration` elapses → `scan:captured{valid:true}` emitted, `IDLE` |

### Interactions with Other Systems

| System | Direction | Interface |
|---|---|---|
| FPS Movement | out | `movement:scan_triggered {nodePosition}` on trigger; **`movement:scan_released {}` (NEW)** when the 4th beat completes — exits `SCAN_LOCKED` early, before Scan Node validates |
| Point Cloud Renderer | out | `scan:capture_frame {angle, progress}` once per beat, driving Formula 4's existing materialization ramp (unchanged) |
| Scan Node | out | `scan:started {nodeId}` on trigger; `scan:captured {nodeId, valid, entityInFrame}` on abort or successful upload |
| Session data (ADR-0005 file) | in (direct read, not bus) | `authoritativePosition` per node, read once at session load |
| Entity System (#9, undesigned) | in | Reads cached `entity:proximity {tier}` (provisional) at each beat's end for entityInFrame |
| UI/HUD (#12, undesigned) | out | `scan:processing {progress}`, `scan:uploading {progress}` (NEW, latest-value, provisional) for the diegetic progress-bar readouts |

## Formulas

### Formula 1 — Total Scan Duration

The `total_scan_duration` formula is defined as:

`total_scan_duration = initializing_duration + (4 × T) + processing_duration + uploading_duration`

Split into locked and unlocked sub-totals:

`locked_duration = initializing_duration + (4 × T)`
`unlocked_duration = processing_duration + uploading_duration`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|--------------|
| Initializing duration | `initializing_duration` | float | 0.2–0.8s | Tuning knob — flavor beat before capture begins, default 0.4s |
| Scan frame duration | `T` | float | 0.3–1.0s | Registered constant (source: Point Cloud Renderer), default 0.5s; each of the 4 CAPTURING beats is exactly one T |
| Processing duration | `processing_duration` | float | 0.6–2.0s | Tuning knob — unlocked post-capture flavor phase, default 1.0s |
| Uploading duration | `uploading_duration` | float | 0.6–2.0s | Tuning knob — unlocked final flavor phase, default 1.0s |
| Locked duration | `locked_duration` | float | derived | Portion of the sequence where FPS Movement is in `SCAN_LOCKED` |
| Unlocked duration | `unlocked_duration` | float | derived | Portion of the sequence where the player is free to move/look away |
| Output | `total_scan_duration` | float | derived, seconds | Full wall-clock length of one scan sequence, trigger to `IDLE` |

**Output Range:** At safe-range extremes: min = 0.2 + (4×0.3) + 0.6 + 0.6 = 2.6s; max = 0.8 + (4×1.0) + 2.0 + 2.0 = 8.8s. At defaults: 4.4s (locked 2.4s / unlocked 2.0s).

**Example:** With defaults (`initializing_duration`=0.4s, `T`=0.5s, `processing_duration`=1.0s, `uploading_duration`=1.0s):
```
locked_duration = 0.4 + (4 × 0.5) = 2.4s
unlocked_duration = 1.0 + 1.0 = 2.0s
total_scan_duration = 2.4 + 2.0 = 4.4s
```

---

### Formula 2 — Per-Beat Target Yaw

The `beat_target_yaw` formula is defined as:

`beat_target_yaw(n) = (n − 1) × 90°`

And the rotation-progress sub-formula, for elapsed time `t` within the `[0, h×T)` window of beat `n`:

`camera_yaw(t) = yaw_prev + (beat_target_yaw(n) − yaw_prev) × clamp(t / (h × T), 0.0, 1.0)`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|----------|--------|------|-------|--------------|
| Beat index | `n` | int | 1–4 | Which CAPTURING beat this is (1st through 4th) |
| Beat target yaw | `beat_target_yaw(n)` | float | {0°, 90°, 180°, 270°} | This beat's target angle, relative to the scan's 0° reference (player's yaw at trigger) |
| Elapsed time in rotation window | `t` | float | 0–(h×T) s | Time since this beat's `[0, h×T)` rotation window began |
| Frame duration | `T` | float | 0.3–1.0s | Registered constant (Point Cloud Renderer), default 0.5s |
| Hold fraction | `h` | float | 0.10–0.40 | Registered constant (Point Cloud Renderer), default 0.25 — same split reused for rotation, not a new knob |
| Previous held yaw | `yaw_prev` | float | {0°, 90°, 180°, 270°} or scan-trigger yaw | The camera's yaw at the end of the prior beat's hold phase; for beat 1, this equals `beat_target_yaw(1)` = 0° (no rotation needed) |
| Output | `camera_yaw(t)` | float | bounded by `[min(yaw_prev, target), max(yaw_prev, target)]` | Camera's interpolated yaw at time `t`, relative to scan's 0° reference |

**Output Range:** `beat_target_yaw(n)` is one of exactly 4 discrete values (0°/90°/180°/270°), fully bounded. `camera_yaw(t)` is linearly interpolated and clamped via the `clamp(t / (h×T), 0.0, 1.0)` term, so it never overshoots `beat_target_yaw(n)` even if called with `t > h×T` — it holds at the target for the remainder of the beat (the `[h×T, T]` hold phase), consistent with Core Rule 6. Beat 1 is a degenerate case: `yaw_prev = beat_target_yaw(1) = 0°`, so the interpolation term is `(0 − 0) × ... = 0` — the camera never physically rotates during beat 1's `[0, h×T)` window, correctly matching "0° has nothing to rotate from."

**Example:** Beat 3 (`n=3`), defaults `T=0.5s`, `h=0.25` (so `h×T = 0.125s`), `yaw_prev = 90°` (held from beat 2):
```
beat_target_yaw(3) = (3−1) × 90° = 180°
At t = 0.0625s (halfway through the 0.125s rotation window):
camera_yaw(0.0625) = 90 + (180 − 90) × clamp(0.0625/0.125, 0, 1) = 90 + 90 × 0.5 = 135°
At t = 0.125s (end of rotation window) onward through t = 0.5s: camera_yaw = 180° (held),
while the materialization ramp plays per Point Cloud Renderer's Formula 4.
```

---

### Tuning Constant — `capture_trigger_radius`

**Default: 1.2m** (safe range: 0.8m–2.0m). Rationale: ~3.4× `WALL_MARGIN` (0.35m, registered constant) —
comfortably "walked up and stopped" without trigger flicker near wall-adjacent node props.

> *Note: `systems-designer` consulted (Section D high-risk spawn, per lean-mode rule).*

## Edge Cases

- **If a scan trigger is attempted at any node (including a different, otherwise-eligible one)
  while Scan Mechanic is not `IDLE`**: ignored — no prompt appears, the interact key has no
  effect. Single-scan-in-flight (Rule 3) applies globally, not per-node.

- **If the player leaves the node's vicinity — or the room entirely — during
  `PROCESSING`/`UPLOADING`**: no effect. The phase timers run to completion regardless of player
  position; `scan:captured {valid:true}` still fires when `uploading_duration` elapses, wherever
  the player currently is.

- **If entity proximity changes during `PROCESSING`/`UPLOADING` (after unlock)**: does not
  retroactively affect `entityInFrame`. That value is fixed the instant `CAPTURING` ends — only
  the 4 capture-beat samples (Rule 8) ever contribute to it.

- **If Escape is pressed during `INITIALIZING`** (zero capture beats completed): immediate
  abort; `entityInFrame = false` (no samples exist yet); `scan:captured {nodeId, valid:false,
  entityInFrame:false}` emitted; state → `IDLE`.

- **If Escape is pressed during `CAPTURING`, at any point within a beat** (mid-rotation or
  mid-hold): immediate abort; `entityInFrame` reflects only the samples from **fully completed**
  prior beats — the beat in progress at abort time contributes no sample, mirroring Point Cloud
  Renderer's own "abort discards in-progress points" for that beat's materialization.

- **If `session:end` arrives while Scan Mechanic is not `IDLE`**: the in-flight sequence is
  abandoned silently — no `scan:captured`, no `movement:scan_released`. `SEALED` forbids further
  mutation, and Orchestrator would drop any late emission anyway (its own post-SEAL drop rule);
  Scan Mechanic simply returns its own internal state to `IDLE` without reporting anything.

- **If `entity:proximity` has no cached value yet at a capture-beat's sample moment** (before
  Entity System's first broadcast this session): treated as `FAR` — contributes no `true` toward
  `entityInFrame`. Prevents undefined behavior on an early-session scan.

- **If Escape is pressed while already `IDLE`** (no scan in progress, or one just resolved this
  frame): no-op. Nothing to abort.

- **Movement Violation during unlocked `PROCESSING`/`UPLOADING`** *(flagged for Win/Lose,
  undesigned — not resolved here)*: because the player is now free to move during these phases,
  the master GDD's §9 "player moves while entity is adjacent → scanner mechanical failure" lose
  condition becomes reachable in a window that didn't exist before "unlock after 4th capture" —
  previously only possible in `NAVIGATE`. Win/Lose's GDD must account for this window when it
  defines that condition's trigger scope.

- **Node position/reachability degeneracies** (a node authored somewhere the player can never
  get within `capture_trigger_radius` of): out of scope for this GDD — assumed caught by Floor
  Plan's load-time layout validation (ADR-0005/Floor Plan Core Rule), not re-validated here.

## Dependencies

**Upstream — what Scan Mechanic consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Session data (ADR-0005 property file) | Hard (direct read) | `nodes[].authoritativePosition` per node, read once at session load — not a bus subscription |
| Orchestrator | Event bus (hard) | Receives: `player:position {x,y,z}` (trigger-radius check), `session:end` (abandon in-flight scan). Emits: see Downstream |
| Entity System (#9, undesigned) | Soft (event consumer) | Receives cached `entity:proximity {tier}` for `entityInFrame` sampling (Rule 8). Without it, `entityInFrame` always defaults `false` — Scan Mechanic still functions, just never reports a captured entity. ⚠️ *Provisional — Entity System undesigned; tier vocabulary (4 vs 5) is its decision.* |

Scan Mechanic has no hard structural dependency on FPS Movement, Point Cloud Renderer, or Scan
Node — it only *emits* to them (see Downstream). It does not call any system directly; all flow
is via the Orchestrator bus except the one direct file read (ADR-0005 data is a shared static
resource, not owned/mutated by any single system).

**Downstream — systems that depend on Scan Mechanic:**

| System | What they need | Interface |
|---|---|---|
| FPS Movement | Camera lock/unlock trigger | `movement:scan_triggered {nodePosition}` (enter `SCAN_LOCKED`); `movement:scan_released {}` (exit to `NAVIGATE`, successful-capture path). *(FPS Movement GDD amended 2026-07-02 to consume the new event — see its Detailed Design.)* |
| Point Cloud Renderer | Capture-frame timing for materialization | `scan:capture_frame {angle, progress}` once per capture beat *(Renderer GDD already records this ✅)* |
| Scan Node | Scan lifecycle reports | `scan:started {nodeId}` on trigger; `scan:captured {nodeId, valid, entityInFrame}` on abort or successful upload *(Scan Node GDD already records this as its upstream ✅)* |
| UI/HUD (#12, undesigned) | Diegetic phase readout (§4 flavor text) | `scan:processing {progress}`, `scan:uploading {progress}` (new). Phase can otherwise be inferred from events already emitted: `movement:scan_triggered` = `INITIALIZING` begins, `scan:capture_frame` = `CAPTURING` in progress, `scan:processing`/`scan:uploading` = the two post-capture phases, `movement:scan_released`/`scan:captured` = sequence ending. No separate "phase changed" event is needed. ⚠️ *Provisional — UI/HUD undesigned.* |

**Bidirectional actions:**
1. **FPS Movement GDD** — amended this session (see its Detailed Design + Interactions table)
   to add `movement:scan_released` as a new `SCAN_LOCKED` exit, alongside the existing
   `scan:abort` exit for the abort path.
2. **Orchestrator GDD** — must register `movement:scan_released`, `scan:processing`,
   `scan:uploading` in its Interface Registry (`entities.yaml` already updated as provisional
   entries this session; formal registration is Orchestrator's `/design-system` Phase 5 process
   when this GDD is reviewed).

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `initializing_duration` | 0.4s | 0.2–0.8s | Flavor beat overstays, delays real tension, starts to feel like a loading screen | No "spin-up" read; capture feels instantaneous, undercuts the mechanical framing |
| `processing_duration` | 1.0s | 0.6–2.0s | Unlocked wait drags; player disengages or wanders off, undercutting pacing between scans | Progress bar flashes/skips rather than reading as real processing |
| `uploading_duration` | 1.0s | 0.6–2.0s | Same as `processing_duration` — drags | Same as `processing_duration` — flashes |
| `capture_trigger_radius` | 1.2m | 0.8–2.0m | Prompt appears from too far away, feels imprecise; risks overlapping a neighboring node's radius in cramped rooms | Player must stand awkwardly precisely on the node; fiddly |

**Not owned here (reused, not redefined):** `scan_frame_duration` (`T`) and the hold fraction
(`h`) belong to Point Cloud Renderer — see its own Tuning Knobs for their interaction notes
(tedious-if-high, tension-lost-if-low). Changing `T` there directly changes this GDD's
`locked_duration` and `total_scan_duration`.

**Interaction notes:**
- `initializing_duration` + `T`×4 sets `locked_duration` — the actual danger window. Tune this
  pair for tension; it is the only part of the sequence where the player is vulnerable.
- `processing_duration` + `uploading_duration` set `unlocked_duration` — pure downtime/pacing
  between scans, not danger. Tune this pair for session rhythm (there are ~13 nodes per
  playthrough; total accumulated downtime scales directly with these two).
- `capture_trigger_radius` interacts with node placement density: if set larger than typical
  inter-node spacing in a property, two nodes could become simultaneously eligible. Target
  selection in that case is unresolved — see Open Questions.

## Visual/Audio Requirements

This system produces **no pixels of its own** — CAPTURING's visual output (materializing
points, camera pan) belongs to Point Cloud Renderer and FPS Movement respectively; the diegetic
readout text belongs to UI/HUD. Scan Mechanic's own visual footprint is limited to the camera's
rotation-hold motion (Formula 2), already fully specified.

**Physical scan-node marker**: each node needs an in-world visual/interactive marker at its
`authoritativePosition` so the player can identify a target. Exact asset is out of scope here —
flagged for `/asset-spec` once the art bible exists.

**Audio** (adopting the master GDD's §13 table as this system's own requirement — each cue maps
onto a specific phase this GDD owns):

| Phase / Event | Sound | Source |
|---|---|---|
| `INITIALIZING` begins | Camera shutter sequence, mechanical whir | Master GDD §13 (existing) |
| `CAPTURING`, each beat's rotation sub-window | Smooth servo (continuous through rotation) | Master GDD §13 (existing) |
| `CAPTURING`, each beat's hold begins (reaching target angle) | Subtle processing beep | Master GDD §13 (existing) — beep timing = the `h×T` mark, per Formula 2 |
| Successful `UPLOADING` completion (`NODE COMPLETE`) | Upload progress chime, then silence | Master GDD §13 (existing) |
| **Abort** *(new — not in master GDD's table)* | A distinct downward/interrupted motif — deliberately NOT the completion chime and NOT the generic error tone (§7), so abort reads unambiguously as "you stopped this," not "it failed" or "it finished" | New requirement; exact design is sound-designer's via `/asset-spec` |
| `PROCESSING` / `UPLOADING` ambient texture *(new)* | A subtle looping data/transmission texture, distinct between the two phases, cross-fading into the completion chime — reinforces the two separate diegetic progress bars (§4) as genuinely different processes, not one bar renamed | New requirement; exact design is sound-designer's via `/asset-spec` |

**Prohibited**: no non-diegetic score change on abort or completion (matches the project's
no-jump-scare, diegetic-only pillar) — every cue above is an in-fiction machine sound, never a
musical sting.

📌 **Asset Spec** — Visual/Audio requirements are defined. After the art bible is approved, run
`/asset-spec system:scan-mechanic` to produce per-asset visual descriptions, SFX specs, and
generation prompts from this section.

## UI Requirements

Scan Mechanic supplies the **scan-sequence view model** to UI/HUD, which renders it. Scan
Mechanic owns the data; UI owns the pixels.

- **View model**: current phase (`IDLE`/`INITIALIZING`/`CAPTURING`/`PROCESSING`/`UPLOADING`),
  current beat angle + progress during `CAPTURING` (mirrors `scan:capture_frame`),
  `processing`/`uploading` progress (0–1), and whether a trigger prompt is currently eligible
  (node in range, not already valid, no other scan in flight).
- **Diegetic readout** must match the master GDD's §4 flavor sequence verbatim:
  `[INITIALIZING DEPTH SENSORS]` → `[CAPTURING — {angle}°]` → `[PROCESSING POINT CLOUD {bar}]`
  → `[UPLOADING TO SERVER {bar}]` → `[NODE COMPLETE]`.
- **Abort needs its own distinct text** *(new requirement — not in the master GDD)*: something
  like `[SCAN ABORTED — DATA DISCARDED]`. Must never reuse or resemble `[NODE COMPLETE]` — the
  player must be able to tell at a glance whether a sequence ended by their own choice or by
  finishing. Exact copy is UI/HUD's to write.
- **Must NEVER expose `entityInFrame`** at completion or any other time, live or retrospectively.
  This inherits Scan Node's own constraint (its Player Fantasy explicitly requires "no
  instrumented gauge at capture time") — Scan Mechanic is the system that *computes* this value,
  which makes it the most likely place an implementer accidentally leaks it into a debug overlay
  or completion toast. It does not surface until (if ever) a future D-3/EVP-owning system
  chooses to.
- **Trigger prompt** must render as an in-fiction instrument cue (a highlighted node marker,
  minimal corner text), not generic UI chrome (no floating "Press E" button) — matches the
  diegetic-only, no-external-HUD constraint (`interaction-patterns.md` P-DIEGETIC).
- **Update triggers**: `movement:scan_triggered`, `scan:capture_frame`, `scan:processing`,
  `scan:uploading`, `movement:scan_released`, `scan:captured` (for the abort-specific text).

> **📌 UX Flag — Scan Mechanic**: the scan readout, progress bars, and trigger prompt are UI
> surfaces sharing the same HUD real estate as Scan Node's node ledger (master GDD §11 "Scan
> overlay"). In Pre-Production, run `/ux-design` for the HUD scan panel before writing epics —
> UI stories should cite `design/ux/hud.md`, not this GDD directly. (Same flag Scan Node already
> raised for this file; not a new UX doc.)

## Acceptance Criteria

41 criteria: 30 BLOCKING (Logic) + 11 BLOCKING (Integration). No ADVISORY — this system has no
dedicated performance budget of its own (frame-rate/draw-call cost is Point Cloud Renderer's and
the render loop's concern) and produces no pixels/audio directly. One Edge Case (node position/
reachability degeneracies) is explicitly out of scope with no AC, flagged N/A below rather than
silently dropped.

**Testability requirements for the implementer:**
- All durations (`initializing_duration`, `T`, `h`, `processing_duration`, `uploading_duration`)
  must be injectable/mockable constructor or config parameters — tests advance a mockable
  `dt`-style clock, never a real wall-clock `setTimeout`/`await sleep`.
- The state machine (`IDLE`/`INITIALIZING`/`CAPTURING`/`PROCESSING`/`UPLOADING`) and every
  transition must be exercisable by feeding events through a fake event bus in Vitest — no real
  FPS Movement, Point Cloud Renderer, Scan Node, or Entity System required. `player:position`,
  `entity:proximity`, and `session:end` are injected directly.
- `authoritativePosition` reads (Core Rule 1) are tested via an injected/mocked session-data
  provider, not real file I/O.
- All yaw/angle assertions use `toBeCloseTo(expected, 5)` (or documented equivalent tolerance),
  never strict `toBe`, given floating-point interpolation.
- Each test isolates one node/one scan sequence and tears down its own state; no test depends on
  another's execution order.

### Trigger & Targeting

**AC-SM01 — Trigger becomes available within capture_trigger_radius**
GIVEN Scan Mechanic is `IDLE` and a STANDARD node has not been locally marked valid, WHEN
`player:position` places the player within `capture_trigger_radius` of that node's
`authoritativePosition`, THEN the trigger (interact key) becomes available for that node.
**BLOCKING (Logic)**

**AC-SM02 — Trigger key starts a scan only on explicit input**
GIVEN a node's trigger is available, WHEN no interact-key input has occurred, THEN no scan
starts — proximity alone never auto-starts `INITIALIZING`. **BLOCKING (Logic)**

**AC-SM03 — Trigger suppressed for a locally-tracked already-valid node**
GIVEN a node previously reported `scan:captured {nodeId, valid:true}` by this system (Rule 9),
WHEN the player is within `capture_trigger_radius` of it again and presses the interact key,
THEN no scan starts and no `scan:started`/`movement:scan_triggered` is emitted.
**BLOCKING (Logic)**

**AC-SM04 — Trigger suppressed while any scan is in progress, including at a different node**
GIVEN Scan Mechanic is mid-sequence at node A (any of
`INITIALIZING`/`CAPTURING`/`PROCESSING`/`UPLOADING`), WHEN the player is simultaneously within
`capture_trigger_radius` of a different, otherwise-eligible node B and presses the interact key,
THEN node B's scan does not start, no event is emitted for B, and node A's sequence is
unaffected. **BLOCKING (Logic)**

**AC-SM05 — Session data is the position source, independent of floorplan:init/update**
GIVEN the session's property data file has been read at load, WHEN `floorplan:init` or
`floorplan:update` later delivers a differing (dollhouse-estimate) position for the same node,
THEN Scan Mechanic's trigger check continues to use the `authoritativePosition` from the session
data file, unaffected by either floor-plan event. **BLOCKING (Integration)**

### Sequence & Lock Boundary

**AC-SM06 — Trigger accepted moves IDLE to INITIALIZING and emits movement:scan_triggered**
GIVEN Scan Mechanic is `IDLE` and a node's trigger is available, WHEN the interact key is
pressed, THEN state becomes `INITIALIZING`, `movement:scan_triggered {nodePosition}` is emitted
immediately (same tick, no delay), and `scan:started {nodeId}` is emitted. **BLOCKING (Logic)**

**AC-SM07 — INITIALIZING elapses into CAPTURING**
GIVEN state is `INITIALIZING`, WHEN mocked time advances by exactly `initializing_duration`,
THEN state becomes `CAPTURING` and beat 1 begins. **BLOCKING (Logic)**

**AC-SM08 — CAPTURING runs exactly 4 beats in order 0/90/180/270**
GIVEN state is `CAPTURING`, WHEN each of the 4 beats' full `T` duration elapses in turn, THEN
`scan:capture_frame {angle, progress}` fires once per beat with `angle` equal to
`beat_target_yaw(n)` for `n=1..4` in strictly increasing beat order, and state advances to
`PROCESSING` only after the 4th beat's hold completes. **BLOCKING (Logic)**

**AC-SM09 — Lock fires at INITIALIZING start, not before**
GIVEN Scan Mechanic is `IDLE`, WHEN the interact key is pressed, THEN `movement:scan_triggered`
is emitted in the same synchronous step that state transitions to `INITIALIZING` — no earlier
tick, no deferred emission. **BLOCKING (Integration)**

**AC-SM10 — Lock covers INITIALIZING and all 4 CAPTURING beats, released exactly at the 4th beat's hold completion**
GIVEN state is `CAPTURING` on its 4th beat, WHEN that beat's hold phase (`[h×T, T]`) completes,
THEN `movement:scan_released {}` is emitted in that same instant and state transitions to
`PROCESSING` — the release is not deferred to `PROCESSING`'s own elapse. **BLOCKING (Integration)**

**AC-SM11 — PROCESSING and UPLOADING run fully unlocked**
GIVEN `movement:scan_released` has fired (start of `PROCESSING`), WHEN state advances through
`PROCESSING` into `UPLOADING`, THEN no further `movement:scan_triggered`/`movement:scan_released`
pair is emitted for this sequence — FPS Movement remains in `NAVIGATE` for the entire unlocked
portion. **BLOCKING (Integration)**

**AC-SM12 — PROCESSING elapses into UPLOADING**
GIVEN state is `PROCESSING`, WHEN mocked time advances by exactly `processing_duration`, THEN
state becomes `UPLOADING`. **BLOCKING (Logic)**

**AC-SM13 — UPLOADING elapses into successful completion, back to IDLE**
GIVEN state is `UPLOADING`, WHEN mocked time advances by exactly `uploading_duration`, THEN
`scan:captured {nodeId, valid:true, entityInFrame}` is emitted and state returns to `IDLE`.
**BLOCKING (Logic)**

**AC-SM14 — A scan that reaches PROCESSING always resolves valid:true**
GIVEN state has advanced past `CAPTURING` into `PROCESSING` (4th beat's hold completed), WHEN
the sequence continues uninterrupted through `UPLOADING`, THEN the eventual `scan:captured`
payload has `valid:true` unconditionally — there is no code path from `PROCESSING`/`UPLOADING`
to a `valid:false` outcome. **BLOCKING (Logic)**

### Camera Rotation (Formula 2)

**AC-SM15 — Beat's relative 0° is the player's yaw at trigger, no snap**
GIVEN the player's world yaw is some arbitrary value Y at the moment of trigger, WHEN
`INITIALIZING` begins, THEN the camera's yaw does not change (no snap) and Y becomes this scan's
relative 0° reference for all subsequent `beat_target_yaw` calculations. **BLOCKING (Logic)**

**AC-SM16 — beat_target_yaw produces the 4 expected discrete values**
GIVEN beats n=1..4, WHEN `beat_target_yaw(n)` is evaluated for each, THEN the results are
exactly 0°, 90°, 180°, 270° respectively (`toBeCloseTo`, tolerance 1e-5). **BLOCKING (Logic)**

**AC-SM17 — Rotation sub-window interpolates linearly and clamps at h×T**
GIVEN beat n=3 with defaults (`T=0.5s`, `h=0.25`, `yaw_prev=90°`), WHEN `camera_yaw(t)` is
evaluated at `t=0.0625s` (half of the 0.125s rotation window), THEN the result is
`toBeCloseTo(135, 5)`, matching the GDD's own worked example. **BLOCKING (Logic)**

**AC-SM18 — camera_yaw clamps and holds for the remainder of the beat**
GIVEN beat n=3 with the same defaults, WHEN `camera_yaw(t)` is evaluated at `t` values at and
beyond `h×T` (e.g. `t=0.125s`, `t=0.3s`, `t=0.5s`), THEN the result is `toBeCloseTo(180, 5)` at
all three — it does not overshoot past `beat_target_yaw(3)` and does not continue changing
during the hold phase. **BLOCKING (Logic)**

**AC-SM19 — Beat 1 is degenerate: no physical rotation**
GIVEN beat n=1 (`yaw_prev = beat_target_yaw(1) = 0°`), WHEN `camera_yaw(t)` is evaluated at any
`t` within `[0, h×T)`, THEN the result is `toBeCloseTo(0, 5)` throughout — the interpolation
term evaluates to zero because `yaw_prev` and the target are identical. **BLOCKING (Logic)**

**AC-SM20 — Point Cloud's materialization ramp is driven by the same beat, not re-timed**
GIVEN a capture beat is in its hold phase (`[h×T, T]`), WHEN `scan:capture_frame {angle,
progress}` is emitted for that beat, THEN its `angle` matches that beat's `beat_target_yaw(n)`
and its timing window is the same `T`/`h` pair the rotation sub-formula uses — Scan Mechanic
does not invent a second, independently-tuned timing source for materialization.
**BLOCKING (Integration)**

### Timing (Formula 1)

**AC-SM21 — locked_duration and unlocked_duration match the formula at defaults**
GIVEN default tuning values (`initializing_duration=0.4s`, `T=0.5s`, `processing_duration=1.0s`,
`uploading_duration=1.0s`), WHEN `locked_duration` and `unlocked_duration` are computed, THEN
`locked_duration = toBeCloseTo(2.4, 5)` and `unlocked_duration = toBeCloseTo(2.0, 5)`.
**BLOCKING (Logic)**

**AC-SM22 — total_scan_duration is the sum of locked and unlocked at defaults**
GIVEN the same defaults, WHEN `total_scan_duration` is computed, THEN it equals
`toBeCloseTo(4.4, 5)`, and independently equals `locked_duration + unlocked_duration` computed
from the same run (cross-check, not a re-derivation from raw constants a second time).
**BLOCKING (Logic)**

**AC-SM23 — Wall-clock time actually elapsed through a full sequence matches total_scan_duration**
GIVEN a full uninterrupted sequence from trigger to `scan:captured{valid:true}`, WHEN the mocked
clock's cumulative advance across all 5 phases (`INITIALIZING` + 4×`CAPTURING` beats +
`PROCESSING` + `UPLOADING`) is summed, THEN it equals `total_scan_duration` at whatever tuning
values were configured for that test run — proving the phase-elapse chain (AC-SM07/08/12/13),
not just the standalone formula. **BLOCKING (Integration)**

### entityInFrame & Reporting

**AC-SM24 — entityInFrame true if NEAR or ADJACENT was sampled at any completed beat**
GIVEN cached `entity:proximity` reports tier `NEAR` at the end of beat 2 and `FAR` at all other
sampled beats, WHEN the scan completes successfully, THEN `entityInFrame=true` in the emitted
`scan:captured` payload — a single qualifying sample is sufficient. **BLOCKING (Logic)**

**AC-SM25 — entityInFrame false if no beat ever sampled NEAR/ADJACENT**
GIVEN cached `entity:proximity` reports tier `FAR` (or an equivalent non-qualifying tier) at
every sampled beat, WHEN the scan completes successfully, THEN `entityInFrame=false` in the
emitted payload. **BLOCKING (Logic)**

**AC-SM26 — Successful completion adds nodeId to the local already-valid set**
GIVEN a scan resolves `scan:captured {nodeId, valid:true, ...}`, WHEN the same node is checked
afterward, THEN it is present in Scan Mechanic's local already-valid set and its trigger is
suppressed per AC-SM03. **BLOCKING (Logic)**

**AC-SM27 — Local already-valid set is a UX aid, not authoritative — Scan Mechanic never blocks on Scan Node's registry**
GIVEN Scan Mechanic's local already-valid set marks a node valid, WHEN no message from Scan Node
itself is consulted to make that determination, THEN the suppression in AC-SM03 is proven to be
driven purely by Scan Mechanic's own local Rule-9 tracking (no dependency on a `scan:complete`
acknowledgment from Scan Node). **BLOCKING (Integration)**

**AC-SM28 — Aborted (INVALID) node remains a valid re-trigger target**
GIVEN a node was aborted (Rule 7, no `valid:true` ever reported for it), WHEN the player
re-enters `capture_trigger_radius` and presses the interact key, THEN the trigger is available
and a new scan starts — the node was never added to the local already-valid set.
**BLOCKING (Logic)**

### Abort

**AC-SM29 — Escape during INITIALIZING aborts immediately with entityInFrame false**
GIVEN state is `INITIALIZING`, WHEN Escape is pressed, THEN
`scan:captured {nodeId, valid:false, entityInFrame:false}` is emitted immediately, the sequence
is discarded, and state returns to `IDLE` — matches Edge Case "Escape during INITIALIZING."
**BLOCKING (Logic)**

**AC-SM30 — Escape during CAPTURING aborts, entityInFrame reflects only fully-completed prior beats**
GIVEN state is `CAPTURING` with beats 1–2 fully completed (samples taken) and Escape is pressed
mid-beat-3 (mid-rotation or mid-hold, either sub-phase), WHEN the abort processes, THEN
`scan:captured {nodeId, valid:false, entityInFrame}` reflects only beats 1 and 2's samples —
beat 3 contributes no sample regardless of which sub-phase it was interrupted in.
**BLOCKING (Logic)**

**AC-SM31 — Escape during CAPTURING also releases the movement lock on abort path**
GIVEN state is `CAPTURING` and Escape is pressed before the 4th beat's hold completes, WHEN the
abort processes, THEN FPS Movement's lock is released as part of the abort transition to
`IDLE` — the lock does not persist after an aborted sequence returns to `IDLE`. *(Distinguishes
the abort-path unlock from the successful-path `movement:scan_released` emitted mid-sequence at
AC-SM10 — this AC confirms the lock is never left engaged when the state machine returns to
`IDLE` by any route.)* **BLOCKING (Integration)**

**AC-SM32 — PROCESSING/UPLOADING cannot be interrupted by Escape**
GIVEN state is `PROCESSING` or `UPLOADING`, WHEN Escape is pressed, THEN no abort occurs, no
`scan:captured{valid:false}` is emitted, and the sequence continues toward its normal
`valid:true` resolution — matches Rule 7's "cannot be interrupted" and Rule 4's phase ordering.
**BLOCKING (Logic)**

**AC-SM33 — Escape while already IDLE is a no-op**
GIVEN state is `IDLE`, WHEN Escape is pressed, THEN no event is emitted and state remains
`IDLE` — matches the Edge Case explicitly. **BLOCKING (Logic)**

### Edge Cases

**AC-SM34 — Trigger attempt while not IDLE is silently ignored, no prompt/response**
GIVEN Scan Mechanic is in any non-`IDLE` state, WHEN a trigger attempt occurs at any node, THEN
it is ignored with no prompt or response of any kind — not merely "no scan starts" (AC-SM04) but
no UI-facing acknowledgment either. **BLOCKING (Logic)**

**AC-SM35 — Player leaving vicinity during PROCESSING/UPLOADING has no effect on timers**
GIVEN state is `PROCESSING` or `UPLOADING`, WHEN `player:position` moves arbitrarily far from
the node (including outside `capture_trigger_radius` or the room), THEN the phase timers are
unaffected and `scan:captured{valid:true}` still fires at the normal `uploading_duration`
elapse. **BLOCKING (Logic)**

**AC-SM36 — entity:proximity changes during PROCESSING/UPLOADING do not retroactively affect entityInFrame**
GIVEN a scan has exited `CAPTURING` with a fixed `entityInFrame` value already determined, WHEN
`entity:proximity` subsequently changes tier during `PROCESSING`/`UPLOADING`, THEN the eventual
`scan:captured.entityInFrame` is unchanged from its value at the moment `CAPTURING` ended.
**BLOCKING (Logic)**

**AC-SM37 — session:end while not IDLE silently abandons the sequence**
GIVEN state is any of `INITIALIZING`/`CAPTURING`/`PROCESSING`/`UPLOADING`, WHEN `session:end`
arrives, THEN no `scan:captured` is emitted, no `movement:scan_released` is emitted (even if
mid-`CAPTURING`), and internal state resets to `IDLE` with no further side effects.
**BLOCKING (Integration)**

**AC-SM38 — No cached entity:proximity value defaults to FAR**
GIVEN `entity:proximity` has never been received this session at the moment a capture beat
samples it, WHEN that beat's sample is taken, THEN it is treated as `FAR` (contributes no `true`
toward `entityInFrame`) — proven by completing a scan whose only beats are pre-first-broadcast
and confirming `entityInFrame=false`. **BLOCKING (Logic)**

**AC-SM39 — Movement Violation window: Scan Mechanic does not itself block or restrict movement during unlocked phases**
GIVEN state is `PROCESSING` or `UPLOADING`, WHEN the player moves (including into conditions
that might constitute a Win/Lose "Movement Violation"), THEN Scan Mechanic itself takes no
action to prevent, flag, or interrupt that movement — confirming this system does not resolve
or gate the condition (ownership sits entirely with the undesigned Win/Lose system), only that
it does not accidentally interfere. **BLOCKING (Integration)**

> Node position/reachability degeneracies: explicitly out of scope per the GDD text (assumed
> validated by Floor Plan's load-time layout validation) — **no AC written; N/A by design, not
> an oversight.**

### Integration

**AC-SM40 — Full successful sequence emits the exact event sequence in order**
GIVEN a full uninterrupted scan from trigger to completion, WHEN the sequence runs, THEN the
emitted event order is exactly: `scan:started` + `movement:scan_triggered` (same tick, trigger)
→ `scan:capture_frame` ×4 (one per beat, in order) → `movement:scan_released` (at 4th beat hold
completion) → (no capture-frame or lock events during `PROCESSING`/`UPLOADING`) →
`scan:captured{valid:true}` (at `uploading_duration` elapse) — proving the cross-phase
composition, not each phase in isolation. **BLOCKING (Integration)**

**AC-SM41 — Rule 2(a) and Rule 2(b) suppression paths are independently provable in combination**
GIVEN a node is both locally marked already-valid (Rule 9) AND another scan is simultaneously in
progress at a different node, WHEN the player is within range of the already-valid node and
presses the interact key, THEN the trigger is suppressed for both independently-sufficient
reasons — this AC exists specifically to prove the two suppression conditions from Rule 2
compose correctly rather than one masking a latent bug in the other (each was tested in
isolation at AC-SM03/AC-SM04). **BLOCKING (Logic)**

> *Note: `qa-lead` consulted (lean-mode Section H high-risk spawn).*

## Coverage Validation

| Source | AC(s) |
|---|---|
| Core Rule 1 (session-data position source) | AC-SM05 |
| Core Rule 2 (trigger + both suppressions + no auto-start) | AC-SM01, SM02, SM03, SM04 |
| Core Rule 3 (single scan in flight) | AC-SM04 |
| Core Rule 4 (phase sequence) | AC-SM06–SM13 |
| Core Rule 5 (lock boundary timing) | AC-SM09, SM10, SM11 |
| Core Rule 6 (camera rotation) | AC-SM15–SM20 |
| Core Rule 7 (abort contract) | AC-SM29–SM32 |
| Core Rule 8 (entityInFrame determination) | AC-SM24, SM25, SM38 |
| Core Rule 9 (reporting & local tracking) | AC-SM26, SM27 |
| Core Rule 10 (re-scan of INVALID) | AC-SM28 |
| Formula 1 (durations) | AC-SM21, SM22, SM23 |
| Formula 2 (per-beat yaw) | AC-SM16, SM17, SM18, SM19 |
| State table: all 5 transitions | AC-SM06, SM07, SM08+SM10, SM12, SM13+SM14; abort exits SM29–SM31 |
| Edge Cases (all 10) | AC-SM34–SM39; degeneracies explicitly N/A |

No Core Rule, Formula behavior, state-table transition, or Edge Case is left without a
corresponding criterion — the one exception (node position/reachability degeneracies) is
explicitly out of scope in this GDD's own text, not a gap.

## Open Questions

1. **Two nodes simultaneously within `capture_trigger_radius`** — target-selection behavior
   (nearest node? explicit reticle/look-at check?) is undefined. Surfaced by the Tuning Knobs
   interaction note; doesn't block this GDD's approval since it depends on actual per-property
   node spacing, which level design controls. *Owner: level-designer / ux-designer. Resolve when
   the first real property layouts exist (data/properties/*.json authoring, ADR-0005) and can be
   checked for minimum inter-node spacing.*

2. **`entityInFrame` precision trade-off** — Rule 8 uses proximity-tier proxy (distance-only, no
   facing/frustum check) for MVP simplicity and to avoid inventing per-frame geometry math ahead
   of Entity System's design. This means an entity technically behind the player (outside the
   270° sweep) at `NEAR`/`ADJACENT` distance still counts as "in frame." *Owner: Entity System
   (#9) author. Revisit once Entity's own type-specific behavior/positioning model exists — may
   upgrade to a precise position+frustum check if the proxy proves too generous in playtest.*

3. **Exact interact-key binding** — this GDD requires a dedicated, rebindable interact key
   distinct from WASD/Escape but does not name it. *Owner: ux-designer. Resolve when the
   input-remapping requirement (`accessibility-requirements.md` A-M1) is implemented, likely
   alongside UI/HUD's GDD.*

4. **Abort SFX and PROCESSING/UPLOADING ambient textures are unspecified sound design** — Visual/
   Audio Requirements names the need (distinct from completion chime/error tone) but not the
   actual sound. *Owner: sound-designer, via `/asset-spec system:scan-mechanic` once the art/
   audio bible exists.*

5. **Depth-Only Preview (master GDD §15-A) is deliberately out of scope for this GDD.** The v0.2
   expansion mechanic ("fire a short depth ping before committing to a full scan") explicitly
   extends this exact system, but is not MVP-tier per the systems index — this GDD covers only
   the full locked scan. *Owner: producer / game-designer. Decide scope (Vertical Slice vs Alpha)
   before considering it for implementation; if adopted, it becomes an amendment to this GDD, not
   a new system.*

6. **Movement Violation reachable during unlocked `PROCESSING`/`UPLOADING`** *(restated from Edge
   Cases)* — the master GDD's §9 Lose Type 2 condition becomes reachable in a window this GDD
   newly creates. *Owner: Win/Lose (#10) author. Must be accounted for when defining that lose
   condition's trigger scope — not resolved here.*
