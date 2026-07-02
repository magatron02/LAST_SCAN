# FPS Movement

> **Status**: In Design
> **Author**: magatron02 + agents
> **Last Updated**: 2026-06-26
> **Implements Pillar**: Diegetic Matterport UI · Horror from familiar made wrong

## Overview

FPS Movement is the input and locomotion layer of LAST SCAN. It owns all player-side camera
orientation and positional navigation, and defines the two movement modes the player occupies
throughout the session.

**Navigate mode** (default): The player moves via WASD at a fixed slow gait — the pace of an
autonomous scanning unit, not a person. Full mouse look via PointerLock. Collision is kinematic
AABB against room bounds: the player cannot pass through walls, cannot jump, cannot crouch,
cannot sprint. This is not a prototype constraint. It is a design assertion. The scanner moves
exactly this way because it is a machine.

**Scan mode** (at a scan node): The player's ability to move and look is revoked. Camera locks
to the scanner device position and rotates automatically through the 360° capture sequence. The
player can abort — or wait. They cannot influence where the camera points. Vulnerability is
total. The movement being unavailable is not the player's incapability; it is the machine
following its scan protocol regardless of what approaches.

The movement system communicates the player's identity through its constraints. They cannot run
from the entity. They cannot jump. The slow, level gait of a professional scanner is how they
traverse this property — and how they will continue to traverse it as things go wrong.

## Player Fantasy

The scanner does not run. This is the first thing the player learns, and it may be the last
thing they forget.

**Navigate mode** delivers a quality of professional inevitability. The pace is fixed — no
sprint, no surge, no acceleration on threat. Early in the session this feels correct. The
player is a machine on assignment; it moves at the rate the protocol requires. The familiar
geometry of domestic rooms passes by at a gait that suggests competence. The constraint is
not yet legible as a constraint.

Later — when something is wrong, when the density gap behind them has a shape, when they want
to clear a room quickly — the gait does not change. The machine continues at 1.6 m/s regardless
of what the player wants. The constraint becomes legible. The pace that once felt professional
now feels like the machine failing to understand the situation it is in.

**Scan mode** removes movement entirely. The player becomes an observer inside their own camera.
The capture sequence runs. Whatever is in the room is in the room. The scan completes its arc
with the same mechanical indifference it would in a property where nothing was wrong. The
player's only choice is to wait or abort. Both choices are a form of surrender.

The player fantasy is not power or mastery. It is the slow recognition that the machine's
operating parameters were not designed for this. The scanner was built to scan. That is what
it will do.

## Detailed Design

### Core Rules

1. **Two modes only**: FPS Movement exists in exactly two states — NAVIGATE and SCAN_LOCKED.
   No other movement modes exist (no cutscenes, interpolated walks, or slide mechanics).

2. **NAVIGATE — free locomotion**:
   - WASD translates camera position in the horizontal plane (no vertical movement from input)
   - Mouse look via PointerLock API controls yaw (left/right) and pitch (up/down)
   - Pitch clamped: −80° to +80° (prevents looking directly through ceiling/floor)
   - Speed: fixed `MOVE_SPEED` (default 1.6 m/s) — no acceleration, deceleration, or momentum
   - No jump, no crouch, no sprint, no strafe-run speed bonus
   - Eye height: fixed `EYE_HEIGHT` (default 1.5m above floor) — no head bob, sway, or drift

3. **AABB room collision**:
   - Player position clamped to interior bounds of current room AABB each frame
   - Clamped axes: X and Z (horizontal). Y is fixed at `EYE_HEIGHT`
   - Collision margin: `WALL_MARGIN` (default 0.35m) — player centre stays ≥ 0.35m from wall surfaces
   - Multi-room: collision system evaluates all rooms the player can currently access; clamps
     to the union of their accessible bounds

4. **SCAN_LOCKED — revoked movement**:
   - All WASD input is ignored
   - Mouse look input is ignored (cursor remains captured, produces no rotation)
   - Camera position frozen at the scan node's designated capture position
   - Camera rotation driven exclusively by Scan Mechanic's capture sequence
   - Abort input (`Escape`, default) is the only valid input in this state

5. **PointerLock lifecycle**:
   - Requested on first user gesture after title screen
   - If lost (tab switch, OS focus change): input processing pauses; game world does NOT pause.
     Entity continues to advance during focus loss. This is intentional — the machine does
     not stop for operator interruption.
   - PointerLock is never re-requested during SCAN_LOCKED (already held from NAVIGATE)

6. **No positional smoothing**: Movement = `delta × MOVE_SPEED` applied immediately each frame.
   No interpolation, no damping. The gait is mechanical and immediate, not physically simulated.

### States and Transitions

| State | Description | Entry | Exit |
|---|---|---|---|
| `NAVIGATE` | Free WASD + mouse look, collision active | Session start (after PointerLock granted) | `movement:scan_triggered` from Scan Mechanic |
| `SCAN_LOCKED` | All input revoked; camera auto-rotates via Scan Mechanic | `movement:scan_triggered` | `scan:complete` or `scan:abort` from Orchestrator |

Transitions are immediate — no animation or interpolation between modes.
**Forbidden**: SCAN_LOCKED → SCAN_LOCKED (scan cannot be re-triggered while locked).

### Interactions with Other Systems

| System | Interface | Direction |
|---|---|---|
| Scan Mechanic | Emits `movement:scan_triggered {nodePosition}` → FPS Movement enters SCAN_LOCKED, camera snaps to nodePosition | Scan Mechanic → this |
| Orchestrator | Emits `scan:complete` or `scan:abort` → exits SCAN_LOCKED, returns to NAVIGATE | Orchestrator → this |
| Floor Plan System | Provides room AABB bounds → used for collision clamping each frame | Floor Plan → this |
| Orchestrator | FPS Movement publishes `player:position {x, y, z}` each frame | This → Orchestrator |

FPS Movement does not call Entity System directly — it publishes position via Orchestrator;
Entity System subscribes. No direct import between the two.

## Formulas

### Formula 1 — Frame Position Delta (NAVIGATE mode)

The frame_position_delta formula is defined as:

```
forward_dir = ( sin(yaw),  cos(yaw) )   -- world-space forward vector
right_dir   = ( cos(yaw), -sin(yaw) )   -- world-space right vector
raw_dir     = (w − s) × forward_dir + (d − a) × right_dir
dir_norm    = raw_dir / |raw_dir|        -- if |raw_dir| > 0, else (0,0)
delta_pos   = dir_norm × MOVE_SPEED × dt
```

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Camera yaw | yaw | float | [0, 2π) rad | Horizontal facing angle — from `camera.rotation.y` under YXZ order. Pitch is explicitly excluded: movement is always horizontal. |
| W/S/A/D keys | w,s,a,d | int | {0, 1} | 1 = pressed, 0 = not pressed. Opposing keys cancel: W+S=0, A+D=0 |
| Move speed | MOVE_SPEED | float | 0.8–2.4 m/s | Default 1.6 m/s. Tuning knob — robot gait |
| Frame delta | dt | float | (0, 0.1] s | Frame time in seconds. **Hard cap at 0.1s** — prevents tab-restore frames from tunnelling player through a wall before AABB clamp fires |
| Direction | dir_norm | vec2 | magnitude ∈ {0, 1} | Normalised movement direction; magnitude 0 = no keys held |
| Output | delta_pos | vec2 | magnitude ∈ [0, MOVE_SPEED × dt] | World-space XZ displacement this frame |

**Output range:** Magnitude always ≤ MOVE_SPEED × dt. Diagonal input (W+A) produces the same
magnitude as cardinal input (W alone) — guaranteed by the normalisation step.

**Implementation note**: extract yaw as `camera.rotation.y` under `rotation.order = 'YXZ'`.
Do not use `camera.getWorldDirection()` — that vector includes pitch, which would tilt movement
into the floor/ceiling when the player looks up or down.

**Example** (W+A held at 60 FPS, yaw = π/4):
```
forward_dir = (0.7071, 0.7071)
right_dir   = (0.7071, -0.7071)
raw_dir     = (0.7071+0.7071, 0.7071-0.7071) = (1.4142, 0.0)
dir_norm    = (1.0, 0.0)
delta_pos   = (1.0, 0.0) × 1.6 × 0.01667 = (0.02667, 0.0) m
```
Same magnitude as W-only: diagonal does not run faster. ✓

---

### Formula 2 — AABB Position Clamp

The aabb_position_clamp formula is defined as:

```
effective_min_x = room_min_x + WALL_MARGIN
effective_max_x = room_max_x − WALL_MARGIN
effective_min_z = room_min_z + WALL_MARGIN
effective_max_z = room_max_z − WALL_MARGIN

clamped_x = clamp(candidate_x, effective_min_x, effective_max_x)
clamped_z = clamp(candidate_z, effective_min_z, effective_max_z)
```

Multi-room union extension:
```
union_min_x = min(room_i.min_x  for all accessible rooms i)
union_max_x = max(room_i.max_x  for all accessible rooms i)
union_min_z = min(room_i.min_z  for all accessible rooms i)
union_max_z = max(room_i.max_z  for all accessible rooms i)
-- then apply standard clamp above using union bounds
```

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Candidate X | candidate_x | float | unbounded | Proposed X after applying delta_pos |
| Candidate Z | candidate_z | float | unbounded | Proposed Z after applying delta_pos |
| Room bounds | room_min/max_x/z | float | scene-defined | AABB of current accessible rooms from Floor Plan System |
| Wall margin | WALL_MARGIN | float | 0.2–0.5 m | Default 0.35m. Inset from wall surface to player centre. Also functions as a ~0.35m collision radius |
| Output | clamped_x/z | float | [effective_min, effective_max] | Final player position for this frame |

**Output range:** Always [effective_min, effective_max] per axis. Hard stop — no spring-back.

Multi-room strategy: union approach is used because per-room convex hull testing requires
doorway transition detection which is unnecessary complexity for a ~20-room residential floor
plan. Union is geometrically imprecise in notch cases; invisible blocker AABBs are the
level-designer's responsibility for those specific corners.

**Degenerate case**: room width < 2 × WALL_MARGIN → effective_min > effective_max → player
pinned to centre line. Level-designer constraint: all navigable corridors must be ≥ 0.71m wide
(= 2 × 0.35m + 0.01m clearance).

**Example:**
```
Room: min_x=0, max_x=5, WALL_MARGIN=0.35 → effective range [0.35, 4.65]
candidate_x = 4.9 → clamped_x = 4.65  (player stops at wall margin)
```

---

### Formula 3 — Yaw Update

The yaw_update formula is defined as:

`yaw_new = (yaw + movementX × MOUSE_SENSITIVITY) mod 2π`

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Current yaw | yaw | float | [0, 2π) rad | Camera yaw before this frame |
| Mouse delta X | movementX | float | unbounded px | `PointerLockChangeEvent.movementX` — raw pixels. Positive = mouse moved right |
| Sensitivity | MOUSE_SENSITIVITY | float | 0.0003–0.0030 rad/px | Default 0.0010. See note below |
| Output | yaw_new | float | [0, 2π) rad | Updated yaw, wrapped to [0, 2π) |

**Output range:** [0, 2π). Practical implementation: accumulate directly into `camera.rotation.y`
without wrapping — Three.js handles unbounded rotation. Only apply `mod 2π` if extracting yaw
for Formula 1's sin/cos calls.

**Sensitivity default rationale:** Full 360° rotation at 800 DPI should require 40–60cm of
mouse travel (5000–8000px). → 2π / 6000 ≈ 0.00105 → rounded to **0.0010 rad/px**.
This is ~2× slower than a standard FPS, matching the machine-pace horror feel.
Above 0.0030: twitchy, breaks machine identity. Below 0.0003: physically impractical to turn.

**Example:** movementX=45px, MOUSE_SENSITIVITY=0.0010, yaw=1.5708 rad
→ yaw_new = 1.5708 + 0.0450 = 1.6158 rad (turned ≈ 2.6° right)

---

### Formula 4 — Pitch Update (with clamp)

The pitch_update formula is defined as:

```
pitch_raw = pitch + (−movementY) × MOUSE_SENSITIVITY
pitch_new = clamp(pitch_raw, PITCH_MIN, PITCH_MAX)
```

**Variables:**
| Variable | Symbol | Type | Range | Description |
|---|---|---|---|---|
| Current pitch | pitch | float | [PITCH_MIN, PITCH_MAX] rad | Camera pitch (`camera.rotation.x` under YXZ) |
| Mouse delta Y | movementY | float | unbounded px | `movementY` positive = mouse pushed forward (away from user) |
| Sensitivity | MOUSE_SENSITIVITY | float | 0.0003–0.0030 rad/px | Shared with Formula 3 |
| Pitch min | PITCH_MIN | float | const = −1.3963 rad | −80° ceiling limit. Negative = looking up in Three.js YXZ |
| Pitch max | PITCH_MAX | float | const = +1.3963 rad | +80° floor limit. Positive = looking down |
| Output | pitch_new | float | [PITCH_MIN, PITCH_MAX] | Clamped pitch to write to `camera.rotation.x` |

**Output range:** Always [−1.3963, +1.3963] rad. Hard clamp — no softening or spring-back.

**Sign convention:** Under Three.js `rotation.order = 'YXZ'`, positive X rotation = nose down.
`movementY` positive = mouse moved toward far desk edge = player looks up = pitch decreases.
Therefore: `delta_pitch = −movementY × MOUSE_SENSITIVITY`. For inverted mouse: expose
`INVERT_Y` boolean knob; when true, remove the negation.

**±80° rationale:** Not ±90° — prevents gimbal singularity at ±90° under YXZ order, and
maintains a sliver of floor/ceiling visible at max pitch to preserve spatial orientation.

**Example:** pitch=1.38 rad, movementY=−120px (mouse pulled toward user = looking further down)
→ pitch_raw = 1.38 + 120 × 0.0010 = 1.50 → clamped to 1.3963 rad (+80°, hard stop)

## Edge Cases

- **If W and S are held simultaneously**: `(w−s) = 0` — forward component cancels. Lateral
  input (A/D) still applies. Player moves sideways only.

- **If all 4 WASD keys held simultaneously**: `raw_dir = (0,0)` → `dir_norm = (0,0)` →
  `delta_pos = (0,0)`. Player stands still. No division-by-zero risk — the `|raw_dir| > 0`
  guard is explicitly checked before the normalise step.

- **If dt exceeds 0.1s** (tab-restore frame or GC pause): cap dt at 0.1s before Formula 1.
  Max displacement per frame = 0.16m — cannot tunnel through wall (WALL_MARGIN 0.35m > 0.16m).
  The cap must be applied before the delta calculation, not after.

- **If room is narrower than 2 × WALL_MARGIN** (corridor < 0.71m): `effective_min > effective_max`.
  JavaScript `Math.max(lo, Math.min(hi, x))` with `lo > hi` returns `lo` — player pins to
  effective_min, not the corridor centre. Explicit handling required: if `effective_min_x >
  effective_max_x`, clamp to `(room_min_x + room_max_x) / 2`. Level-design error — the code
  must degrade gracefully, not crash.

- **If PointerLock is lost mid-session** (tab switch, OS modal): `movementX/Y` deliver 0.
  WASD continues to process. Player can move but cannot look. Entity does NOT pause. See Open
  Questions for the design decision on whether to suppress WASD input during lock loss.

- **If `movement:scan_triggered` arrives while already in SCAN_LOCKED**: ignored. Forbidden
  transition — cannot re-lock an already locked state. Scan Mechanic is responsible for
  preventing re-trigger; this is a safety guard.

- **If `scan:complete` or `scan:abort` arrives while in NAVIGATE**: no-op. NAVIGATE state
  ignores scan termination events.

- **If pitch attempts to exceed ±1.3963 rad**: hard clamp. Camera stops exactly at ±80°.
  No spring-back or resistance. Mouse movement past the clamp has no effect until reversed.

## Dependencies

**Upstream — what this system consumes:**

| System | Dependency type | Interface |
|---|---|---|
| Floor Plan System | Soft (data consumer) | Room AABB bounds → consumed at session load and on `floorplan:update` events for collision recalculation. Also receives `floorplan:loop {targetPosition, targetYaw, toRoom}` → applies the loop-teleport reposition using position/yaw only; `toRoom` flags the destination for other consumers (subtle-difference injection) and is ignored here (this system owns the player transform; Floor Plan only requests). |
| Orchestrator | Event bus (required) | Receives: `movement:scan_triggered {nodePosition}`, `scan:complete`, `scan:abort`. Emits: `player:position {x, y, z}` each frame |

FPS Movement has no hard structural upstream dependencies — Foundation layer.
Floor Plan provides collision bounds; Orchestrator mediates all events. Neither is
called directly by this system.

**Downstream — systems that depend on this:**

| System | What they need | Interface |
|---|---|---|
| Scan Mechanic | Camera lock mechanism | Triggers SCAN_LOCKED via `movement:scan_triggered`; exits via `scan:complete` or `scan:abort` |
| Entity System | Player world position | Subscribes to `player:position {x, y, z}` via Orchestrator for proximity calculation |
| UI/HUD | Player position for diegetic coordinate display | Subscribes to `player:position` via Orchestrator |

## Tuning Knobs

| Knob | Default | Safe Range | Too High | Too Low |
|---|---|---|---|---|
| `MOVE_SPEED` | 1.6 m/s | 0.8–2.4 | Rushed; removes horror pacing | Stalled; frustrating to navigate |
| `EYE_HEIGHT` | 1.5m | 1.2–1.8 | Unnaturally tall; ceiling in view on max pitch-up | Claustrophobic floor-level view |
| `WALL_MARGIN` | 0.35m | 0.2–0.5 | Rooms feel smaller; camera may detach from walls | Player clips wall geometry; point cloud intersects camera |
| `MOUSE_SENSITIVITY` | 0.0010 rad/px | 0.0003–0.0030 | Twitchy rotation breaks machine identity | Near-impossible to turn; physically exhausting |
| `PITCH_MIN / MAX` | ±1.3963 rad (±80°) | ±1.047–±1.484 rad (±60°–±85°) | Near-90° → gimbal singularity risk | Feels blinkered; can't look at floor/ceiling details |
| `dt` cap | 0.1s | 0.05–0.15s | Larger cap allows bigger single-frame teleports on tab-restore | Too small may clip normal frames on slow machines |
| `INVERT_Y` | false | bool | n/a | n/a |

**Interaction note:** `MOVE_SPEED` and Entity System chase speed should be tuned together.
If entity moves faster than MOVE_SPEED, the player can never escape once entity enters NEAR
tier — intended for late-game escalation, not default behaviour. See Entity System GDD.

## Visual/Audio Requirements

[To be designed]

## UI Requirements

[To be designed]

## Acceptance Criteria

18 criteria: 17 BLOCKING (Logic/Integration) · 1 ADVISORY (Performance).

### Core Rules (Section C)

**AC-MOV01 — Two states only**
GIVEN the game session is running, WHEN the tester instruments the movement state machine and plays through a full session including at least one scan, THEN the state machine occupies exactly one of {NAVIGATE, SCAN_LOCKED} at all times and never a third value. **BLOCKING**

**AC-MOV02 — Movement speed at 1.6 m/s**
GIVEN the player is in NAVIGATE with PointerLock active and no wall ahead, WHEN W is held for exactly 1.000 second, THEN world-space XZ position has advanced 1.600 m ± 0.010 m in camera forward direction (yaw component only, no pitch). **BLOCKING**

**AC-MOV03 — Yaw responds to mouse input**
GIVEN NAVIGATE state with PointerLock active, WHEN movementX = +100 px, THEN `camera.rotation.y` increases by 0.1000 rad ± 0.0005 rad within one frame. **BLOCKING**

**AC-MOV04 — Pitch hard-clamps at ±80°**
GIVEN NAVIGATE with pitch at 0 rad, WHEN mouse is dragged continuously downward past what would produce +90°, THEN `camera.rotation.x` does not exceed +1.3963 rad and stays at that exact value; no spring-back when mouse stops. **BLOCKING**

**AC-MOV05 — No jump, crouch, or sprint**
GIVEN NAVIGATE state, WHEN the tester presses Space, Ctrl, Shift, and combinations over 10 seconds, THEN `camera.position.y` stays within 1.500 m ± 0.001 m and player XZ speed never exceeds 1.610 m/s. **BLOCKING**

**AC-MOV06 — Eye height fixed, no head bob**
GIVEN NAVIGATE state, WHEN the player walks at least 3 m in any direction, THEN `camera.position.y` stays at 1.500 m ± 0.001 m throughout; no Y oscillation is recorded in a per-frame log. **BLOCKING**

**AC-MOV07 — SCAN_LOCKED revokes all movement input**
GIVEN SCAN_LOCKED state, WHEN all WASD are held and mouse is moved 500 px in any direction, THEN `camera.position.x/z` does not change from lock-entry values (± 0.001 m) and `camera.rotation.y` does not change (± 0.0001 rad) for the full locked duration. **BLOCKING**

**AC-MOV08 — Escape is the only valid input in SCAN_LOCKED**
GIVEN SCAN_LOCKED state, WHEN every key except Escape is pressed, THEN no state change occurs and no console error is thrown; WHEN Escape is then pressed, THEN `scan:abort` is dispatched within one frame and state transitions to NAVIGATE. **BLOCKING**

---

### Formulas (Section D)

**AC-F01 — Diagonal input equals cardinal speed**
GIVEN NAVIGATE with yaw = 0 and open space in all directions, WHEN W+D are held for 1.000 second, THEN displacement magnitude equals 1.600 m ± 0.010 m — same as W alone for the same duration. **BLOCKING**

**AC-F02 — AABB wall margin enforced**
GIVEN a room with room_max_x = 5.0m and WALL_MARGIN = 0.35m, WHEN the player walks directly into the X+ wall at full speed, THEN `camera.position.x` does not exceed 4.650 m and no visual wall penetration occurs. **BLOCKING**

**AC-F03 — Yaw formula accuracy**
GIVEN NAVIGATE with `camera.rotation.y = 0` and `MOUSE_SENSITIVITY = 0.0010`, WHEN a synthetic mousemove event is injected with `movementX = +1000`, THEN `camera.rotation.y` equals 1.000 rad ± 0.001 rad on the next frame. **BLOCKING**

**AC-F04 — Pitch sign convention: mouse forward = look up**
GIVEN NAVIGATE with pitch = 0, WHEN a synthetic mousemove event with `movementY = +100` is injected (mouse pushed away from user), THEN `camera.rotation.x` decreases by 0.1000 rad ± 0.0005 (player now looking upward). *Most likely first-pass inversion bug — test immediately when input is wired.* **BLOCKING**

---

### Edge Cases (Section E)

**AC-EC01 — W+S cancel, lateral still applies**
GIVEN NAVIGATE with no wall to either side, WHEN W, S, and D are all held for 2.000 seconds, THEN `camera.position.z` (forward) does not change (± 0.005 m) and `camera.position.x` advances 3.200 m ± 0.020 m. **BLOCKING**

**AC-EC02 — All WASD held: stationary, no crash**
GIVEN NAVIGATE, WHEN all four WASD keys are held for 3.000 seconds, THEN `camera.position` does not change (± 0.005 m on any axis) and no JavaScript exception is thrown. **BLOCKING**

**AC-EC03 — dt cap prevents tunnelling**
GIVEN NAVIGATE with player 0.20 m from a wall, WHEN a single oversized tick is injected (dt = 0.500 s) while W is held, THEN the player does not pass through the wall; `camera.position` on the wall axis ≤ effective_max; delta_pos magnitude ≤ 0.160 m (confirming dt was capped at 0.100 s). *Requires dt to be a parameter to the update function, not an internal clock read.* **BLOCKING**

---

### State Transitions

**AC-TR01 — NAVIGATE → SCAN_LOCKED transition**
GIVEN NAVIGATE state, WHEN Orchestrator dispatches `movement:scan_triggered {nodePosition}`, THEN within one frame: (a) state = SCAN_LOCKED, (b) `camera.position` snaps to nodePosition ± 0.001 m, (c) subsequent WASD and mouse produce no change to camera transform. *Integration test — requires Orchestrator + movement module together.* **BLOCKING (Integration)**

**AC-TR02 — Re-trigger during SCAN_LOCKED is a no-op**
GIVEN SCAN_LOCKED state, WHEN a second `movement:scan_triggered` with a different nodePosition is dispatched, THEN `camera.position` does not change from the first nodePosition (± 0.001 m) and no error is logged. **BLOCKING**

---

### Performance

**AC-PERF01 — WASD processing overhead**
GIVEN the game running at up to 1M point budget, WHEN the player holds W and sweeps mouse continuously for 30 seconds, THEN the frame-time contribution of the movement update step does not exceed 0.20 ms (measured by disabling vs. enabling input processing via browser performance API). **ADVISORY**

## Open Questions

1. **PointerLock loss during NAVIGATE**: If focus is lost (alt-tab, OS modal), `movementX/Y`
   deliver 0 but WASD may still register. Design decision: suppress WASD when PointerLock not
   held (player can only move when they can look), OR allow WASD so they can retreat blind.
   Entity does not pause either way. *Owner: game-designer. Decide before Scan Mechanic GDD.*

2. **Movement speed during entity proximity**: Current spec: `MOVE_SPEED` is constant at all
   times. Alternative: reduce speed in PROXIMITY_ADJACENT to reinforce machine distress — or
   increase it (survival instinct vs. machine identity tension). *Owner: game-designer. Evaluate
   during vertical slice playtesting.*

3. **Gamepad / touch scope**: Current spec is keyboard + PointerLock mouse only. Gamepad or
   mobile touch would require separate analogue stick sensitivity curves. *Owner: producer.
   Scope decision before Alpha milestone.*
