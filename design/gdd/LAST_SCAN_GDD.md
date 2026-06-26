# LAST SCAN — Game Design Document
> Web-based LIDAR horror game inspired by Matterport Pro3 scanning workflow

---

## 1. Concept

**Genre:** Found footage horror / walking simulator  
**Platform:** Web browser (Three.js / WebGL)  
**Perspective:** First-person (FPS) with locked scan mode  
**Experience:** Single ending, single session (~20–30 min)

### Premise
You are an autonomous scanning unit assigned to update spatial data of a residential property that humans cannot access. No explanation is given for why. Your objective: scan every node. Do not let the entity appear in your scan data.

### Tone Reference
- Found footage: the player is not the hero — they are someone who *found* the saved session and is viewing it
- Matterport virtual tour UI as diegetic interface — no external HUD
- Horror comes from familiar domestic space becoming wrong

---

## 2. Core Narrative

```
UNIT_ID: LSC-004
SESSION_ID: [REDACTED]
PROPERTY: Residential — Type unspecified
STATUS: Operator did not return to base
NOTE: Initiating replacement protocol
```

The player never learns what happened to previous units. The ending implies this is a cycle.

---

## 3. Camera & Movement

### Mode 1 — Navigate (FPS)
- Free movement through property
- Full mouse look
- No scanning occurs
- Movement speed: slow (robot gait)

### Mode 2 — Scanning (Locked)
- Triggered manually by player at a scan node
- Camera locks to scanner device position
- Rotates automatically: 0° → 90° → 180° → 270° (Matterport-style 360°)
- Player can only: **ABORT** or wait for completion
- Most vulnerable state — entity can approach during scan

---

## 4. Scan Mechanic

### Scan Sequence (per node)
```
[INITIALIZING DEPTH SENSORS]
        ↓
[CAPTURING — 0°]
        ↓
[CAPTURING — 90°]
        ↓
[CAPTURING — 180°]
        ↓
[CAPTURING — 270°]
        ↓
[PROCESSING POINT CLOUD ████████░░ 80%]
        ↓
[UPLOADING TO SERVER ██████░░░░ 60%]
        ↓
[NODE COMPLETE]
```

### Rules
- Abort mid-scan → node marked invalid → must restart
- Entity in scan frame during capture → **entity data recorded** → bad ending trigger
- All nodes must be scanned valid to reach ending

### Dollhouse Map
- Shown at session start from data on file
- Shows approximate room layout only
- Actual scan may reveal: extra rooms, different proportions, locked areas marked `[?]`

---

## 5. Entity System

### Proximity States

| Distance | UI Feedback | Player Rule |
|----------|-------------|-------------|
| Far | Normal operation | Move freely |
| Medium | `ALIGNMENT WARNING` flicker | Move carefully |
| Near | `SCAN INTERRUPTED — RETRY?` | Slow down |
| Very near | Point cloud distorts, mechanical sound | Stop all movement |
| Adjacent | All UI freezes | Do not move. Do not scan. |

### Entity Behavior Rule
- Entity approaches → **stop all movement**
- Scan while entity is near → **sound triggers** → entity aggression
- Move while entity is adjacent → **unknown outcome**

---

## 6. Entity Types (Point Cloud Appearance)

### Type A — Null Point (`PASSIVE`)
- **What it is:** A void where point cloud data should exist
- **Visual:** Humanoid silhouette of *missing* dots — surrounding space has data, this shape does not
- **Behavior:** Stationary. Silhouette grows the longer player lingers nearby
- **Alert trigger:** `DEPTH SENSOR TIMEOUT`
- **Detection:** Sudden density gap in scan data

### Type B — Density Spike (`AMBIENT`)
- **What it is:** Impossibly high point density in one location
- **Visual:** Bright amber cluster with unnatural geometry — too detailed to be furniture
- **Behavior:** Drifts slowly. Mimics shape of nearby objects
- **Alert trigger:** `POINT CLOUD DENSITY LOW — Rescan recommended`
- **Detection:** Point density anomaly > 4σ from mean

### Type C — Scan Remnant (`AGGRESSIVE`)
- **What it is:** Geometry from a previous scan session that persists
- **Visual:** A second room outline visible beneath the current room — offset, ghost-like
- **Behavior:** Knows player location. Can move through walls. Follows scan path
- **Alert trigger:** `UNEXPECTED GEOMETRY DETECTED`
- **Detection:** Geometry mismatch with current session baseline

---

## 7. Error Messages (Matterport-style Horror Tells)

Used instead of jump scares. Frequency and specificity increase as entity approaches.

```
⚠ ALIGNMENT ERROR — Please hold device steady
⚠ DEPTH SENSOR TIMEOUT
⚠ POINT CLOUD DENSITY LOW — Rescan recommended
⚠ UNEXPECTED GEOMETRY DETECTED
⚠ SCAN NODE CORRUPTED — Data may be incomplete
⚠ CONNECTION TO SERVER LOST
⚠ UNKNOWN OBJECT IN SCAN RADIUS
⚠ SESSION DATA INTEGRITY: WARNING
⚠ OPERATOR SIGNAL LOST
```

### Escalation Logic
- Entity far → generic errors (alignment, depth)
- Entity medium → geometry errors
- Entity near → operator/signal errors
- Entity adjacent → UI freezes, all text stops updating

---

## 8. Procedural Floor Plan System

### Core Principle — Perception Stripping
The floor plan is a **rough early guide, not ground truth.** It orients the player
for the first minutes, then is deliberately made unreliable — dollhouse desync
(§15-C1), looping geometry (§15-C2), and anomaly rooms that never appear on it.
As the session escalates the player can trust **only live scan data**, never the map.

This is the game's central horror lever: progressively removing the player's means
of perceiving the space ahead. The unknown does the work — the less the player can
predict what is around the corner, the greater the dread. The map gives false
confidence early so its failure later lands harder.

**System consequence:** Floor Plan (static guide that degrades) and the Scan Node
system (live, authoritative node state) are **separate systems**. The floor plan
supplies initial geometry and estimated node positions; the scan system owns the
only truth the player can act on.

### Data Source
- Floor plans sourced from real Matterport scan sessions
- Randomized selection per playthrough from a curated pool
- Properties: condos, townhouses, detached houses (all residential)

### Dollhouse View (Session Start)
- Simplified top-down 2D layout
- Shows: room labels, estimated node positions, wall structure
- Does NOT show: anomaly spaces, entity start position

### Scan Reveals
The actual scanned environment may differ from dollhouse data:

| Dollhouse Shows | Scan May Reveal |
|-----------------|-----------------|
| 3 bedrooms | 4th room behind wall |
| Hallway ends at wall | Door to unregistered space |
| Bathroom, standard | Room dimensions don't match |
| Storage marked `[?]` | Cannot be scanned — node returns null |

### Anomaly Room Rules
- Extra rooms appear only after scanning adjacent nodes
- Never shown in dollhouse
- Contain: final scan node, highest entity proximity

---

## 9. Win / Lose Conditions

> **Inverted reward (see §15-H).** The operator objective shown to the player is
> "scan every node." Obeying it fully is the trap — the final node lives in the
> anomaly room (§8) and scanning it captures the entity. Survival requires
> *disobeying* the displayed objective.

### Win — Escape (true good outcome)
- All **standard** scan nodes complete and valid
- The **anomaly-room node is deliberately left unscanned** → coverage < 100%
- No entity captured in point cloud
- Upload completes with incomplete coverage → session ends, unit survives the cycle
- The UI never tells the player this is the win — it flags incomplete coverage as a failure

### Lose — Type 0: Completion Trap (100% coverage)
- Player scans every node **including the anomaly-room node** → coverage = 100%
- Entity is captured in the final scan (anomaly room has highest proximity, §8)
- "Mission accomplished" framing, but it is the bad ending
- This is the outcome the in-game objective steers the player toward

### Lose — Type 1: Entity Captured (incidental)
- Entity appears in scan data
- Point cloud shows humanoid form in completed scan
- Upload proceeds anyway
- Ending text changes

### Lose — Type 2: Movement Violation
- Player moves while entity is adjacent
- Scanner mechanical failure
- Session terminates mid-upload

### Lose — Type 3: Scan Corruption
- Too many aborted or corrupted nodes (threshold: 4)
- System forces session end
- `CRITICAL DATA LOSS — SESSION TERMINATED`

---

## 10. Single Ending

All paths converge to the same terminal screen.

```
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
UPLOAD COMPLETE
SESSION ID: LSC-004-[TIMESTAMP]
SCAN COVERAGE: [X]%
NODES COMPLETED: [X] / [X]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
SCAN OPERATOR: UNIT LSC-004
STATUS: Did not return to base
ANOMALIES LOGGED: [X]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NEXT SCHEDULED SCAN: [DATE + 6 MONTHS]
REPLACEMENT UNIT: LSC-005
INITIALIZING...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Text varies slightly based on outcome (coverage %, anomalies logged, entity captured or not) but screen is always the same. The horror is in the implication: this is a routine process.

### Coverage % as False Comfort (§15-H)
- Throughout play the UI frames higher `SCAN COVERAGE` as better — progress ring fills green, log praises thoroughness
- The terminal screen reports coverage with the same neutral tone whether the player escaped or triggered the trap
- A player who scored 100% reads `SCAN COVERAGE: 100%` as success; it is the death screen
- A player who escaped reads `SCAN COVERAGE: 92%` flagged as incomplete; it is survival
- The reveal is environmental/implied — the game never states which ending the player got

---

## 11. UI / Interface Design

### Aesthetic Reference
- Matterport app UI
- Cold, clinical, monospace
- Dark background (`#0a0c10`)
- Primary accent: `#4ade80` (operational green)
- Warning: `#fbbf24` (amber)
- Critical: `#f87171` (red)
- Font: monospace throughout (no serif, no UI chrome)

### UI Elements
| Element | Description |
|---------|-------------|
| Top bar | `LAST SCAN` wordmark · Session status · Active/terminated |
| Tabs | Scan · Dollhouse · Log |
| Scan overlay | FPS view with minimal crosshair, corner HUD data |
| HUD corners | Node ID, Room label, coordinates, scan % |
| Sidebar | Scan progress ring, node list, proximity sensor bar |
| Error bar | Bottom of screen, monospace, red-tinted |
| Scan ring | Animated 360° ring during active scan |

### Proximity Sensor Bar
```
CLEAR ←————————————————→ CRITICAL
       [██████████░░░░░░░░░░] 52% ELEVATED
```
Color transitions: green → amber → red
Does not show direction — only intensity

---

## 12. Tech Stack (Recommended)

```
Frontend:     Three.js (point cloud rendering, FPS camera)
Point Cloud:  Three.js Points / BufferGeometry
Map/UI:       HTML/CSS overlay (Matterport-style panels)
Audio:        Web Audio API (spatial, procedural)
State:        Vanilla JS state machine (scan phases)
Hosting:      Static — Vercel / Cloudflare Pages
Assets:       GLTF for room geometry, JSON for floor plan data
```

### Key Three.js Components
- `THREE.Points` — render point cloud environment
- `THREE.BufferGeometry` — dynamic point manipulation for entity effects
- `PointerLockControls` — FPS movement
- Custom scan rotation controller — locks camera, rotates 4 steps

---

## 13. Audio Design

| Trigger | Sound |
|---------|-------|
| Idle navigation | Low mechanical hum, servo sounds |
| Scan initializing | Camera shutter sequence, mechanical whir |
| Scan rotating | Smooth servo, subtle processing beep each 90° |
| Error message | Single low tone, subtle distortion |
| Entity nearby | Interference pattern, bass drone |
| Entity adjacent | All sound drops except low subsonic rumble |
| Scan complete | Upload progress chime, then silence |

---

## 14. File Structure (Suggested)

```
last-scan/
├── index.html
├── src/
│   ├── main.js              # Entry point
│   ├── scanner.js           # Scan state machine
│   ├── entity.js            # Entity proximity + behavior
│   ├── pointcloud.js        # Three.js point cloud renderer
│   ├── floorplan.js         # Dollhouse map + procedural rooms
│   ├── ui.js                # HUD, error bars, sidebar
│   └── audio.js             # Web Audio API
├── data/
│   ├── floorplans/          # JSON floor plan data
│   └── sessions/            # Scan node positions per property
├── assets/
│   ├── rooms/               # GLTF room geometry
│   └── sounds/              # Audio files
└── styles/
    └── ui.css               # Matterport-style interface
```

---

## 15. Expansion Mechanics (v0.2)

Additions from the v0.2 ideation pass. All build on existing systems and respect
the core pillars (diegetic Matterport UI, no jump scares, horror from the familiar
made wrong, found-footage cycle). Each tags the system it extends.

### A — Depth-Only Preview (extends §3, §4 — Scan)
- Before committing to a full 360° scan, the player can fire a short **depth ping** at a node
- Returns a low-resolution silhouette of the node's surroundings only — no point cloud capture, no upload
- Lets the player gauge risk (is something there?) before entering the vulnerable locked scan
- Risk/reward: the ping itself makes a faint sound (§13) and may draw a near entity
- **Tuning:** ping range, silhouette fidelity, sound radius, cooldown

### C-1 — Dollhouse Desync (extends §8 — Floor Plan)
- The dollhouse map updates **slower than the real world**
- A room the player just walked through / scanned may still show as un-scanned for a delay
- Late-game the desync widens — the map and reality disagree about what exists
- Player can no longer trust the dollhouse as ground truth
- **Tuning:** desync delay (seconds), desync growth rate over session

### C-2 — Looping Geometry (extends §6 Type C — Scan Remnant)
- Spatial escalation of the Type C "scan remnant": walking straight down a corridor returns the player to a room they already left
- Triggered when entity proximity is high or after the anomaly room is revealed
- The point cloud of the looped room carries subtle differences from the original visit
- **Tuning:** which rooms can loop, loop trigger condition, # of differences injected

### C-3 — Timestamp Drift (extends §11 — HUD)
- The HUD clock runs **backwards** when an entity is near
- Subtle at medium proximity (drops a few seconds), overt when adjacent (visibly counting down)
- Diegetic proximity tell that doesn't use the explicit proximity bar
- **Tuning:** drift rate per proximity tier

### D-1 — Auto-Typed Log (extends §7, §11 — UI)
- The Log tab types messages **on its own** while the player is idle / not interacting
- Content escalates: routine operator notes → warnings → direct address (`operator note: don't scan the last room`)
- Reinforces the §15-H inverted reward by hinting the player should NOT complete coverage
- **Tuning:** idle threshold before typing, message pool per escalation tier

### D-2 — Signal Decay as Hidden Timer (extends §7, §11 — UI)
- No visible countdown — instead `CONNECTION` / signal strength **degrades continuously** over the session
- Creates soft urgency: linger too long and uploads start failing (links to §9 Type 3 corruption)
- Decay accelerates near entities, giving a second proximity tell
- **Tuning:** base decay rate, proximity decay multiplier, failure threshold

### D-3 — Redacted Scan Results (extends §4, §7 — Scan/UI)
- Some completed nodes display `[REDACTED]` over the result instead of a clean point cloud
- Player cannot tell whether that node captured an entity or not → sustained uncertainty
- Feeds the §9 ambiguity: did I trigger the trap? The game won't confirm
- **Tuning:** redaction probability, which nodes are eligible, whether proximity raises the odds

### H — Coverage % as False Comfort / Inverted Reward (extends §8, §9, §10)
- See §9 (win/lose rework) and §10 (coverage false comfort) — this is the unifying meta-mechanic
- Core rule: **100% coverage = bad ending (Completion Trap); deliberately incomplete = escape**
- The displayed objective and all UI affordances steer the player toward the trap
- D-1 (auto-typed log) is the only in-world counter-signal, and it's easy to dismiss as another horror tell
- **Tuning:** which node is the trap (anomaly-room final node), coverage threshold that counts as "escape"

---

## 16. Expansion Mechanics (v0.3)

Second ideation pass. Adds the found-footage framing layer, the scanner-unit
identity, property variety / replay, a cross-session cycle meta-layer, and audio
depth. Same pillars. Tags the system each extends.

> **New cross-cutting dependency:** the Cycle / meta items (§16-I) introduce
> **persistent state across playthroughs** via `localStorage`. This is a new system
> not present in v0.1 — see Dependencies note at the end of this section.

### Found-Footage Layer (frames the whole game — player is *viewing* a saved session)

**F-1 — "You are viewer 1" (extends §1 tone, §11 UI)**
- Occasionally the UI slips and reveals the session is being *watched*: a viewer count, a `PLAYBACK` badge, a watching indicator
- Diegetic fourth-wall break — the player is recast as someone reviewing recovered footage, not the unit itself
- Used sparingly, at high-tension beats, never explained

**F-2 — Excised Footage (extends §1 tone, §11 UI)**
- Playback occasionally **jumps a gap**: `[FOOTAGE MISSING 00:03:22–00:04:01]`
- The player loses control across the gap and is repositioned — they don't know what happened in the missing time
- May coincide with entity movement, a changed room, or lost scan progress
- **Tuning:** gap frequency, gap length, what state silently changes across a gap

**F-3 — Playback Artifacts (extends §11 UI, §6 entity tells)**
- The "footage" degrades when an entity appears: frame stutter, dropped frames, brief involuntary rewind
- Reads as a corrupt video file, not a real-time game — reinforces found-footage framing
- Doubles as an entity proximity tell that bypasses the explicit proximity bar
- **Tuning:** artifact intensity per proximity tier, rewind duration

### Scanner Identity (you ARE the machine)

**G-1 — Self-Diagnostic Creep (extends §11 HUD, §13 audio)**
- The unit reports its own health (`SERVO TEMP: 84°C ▲`, motor load, lens integrity)
- Values drift abnormal as the session progresses — the machine is failing, or becoming something else
- Slow-burn body-horror analogue for a body the player doesn't have
- **Tuning:** which diagnostics drift, drift rate, threshold where readings turn alarming

**G-2 — Mechanical Memory (extends §8 floor plan, §11 log)**
- The unit remembers its own path. Re-crossing a previously walked route triggers `revisiting node` in the log
- Fires even when the *player* doesn't remember being there — the machine knows more than the operator
- Ties into C-2 Looping Geometry (§15) and Dollhouse Desync (§15)
- **Tuning:** path-memory granularity, revisit message pool

### Property Variety / Replay (extends §8 — Floor Plan)

**H-1 — Property Personality**
- Each property type drives different entity behavior: condo (small, dense — entity always close, fast escalation) vs detached house (open — entity stalks at range, slow dread)
- Layout shapes pacing, not just scenery
- **Tuning:** per-property-type entity proximity curves, node density, escalation rate

**H-2 — Seed Code**
- Player can enter a session ID to replay a specific property (same layout, node positions, anomaly room)
- Enables speedrunning and sharing "haunted houses" with others
- **Tuning:** seed → floorplan mapping, what the seed does/doesn't fix (entity start? redaction rolls?)

### Cycle / Meta (persists across playthroughs — localStorage)

**I-1 — Incrementing Unit ID**
- Finish as LSC-004 → next run you are LSC-005, stored in `localStorage`
- Makes the §2 "replacement protocol" literal and personal — the cycle is real and you're in it
- **Tuning:** whether ID resets ever, what carries between units

**I-2 — Accreting Log**
- Notes left by previous units persist into later runs; the player reads what LSC-003, -004… wrote
- Slowly assembles the backstory across multiple playthroughs — no single run explains everything
- Feeds D-1 Auto-Typed Log (§15) — some "operator notes" are from prior units
- **Tuning:** how many prior-unit notes surface per run, unlock pacing

**I-3 — The House Remembers You**
- Replaying the same property (via H-2 seed or chance): the entity starts nearer and behaves as if it knows the route
- Punishes familiarity — the safe path stops being safe
- **Tuning:** memory strength per replay, how much entity foreknowledge increases

### Audio Depth (extends §13)

**J-1 — Scanner Whir as Heartbeat**
- The servo loop replaces music: it speeds up with entity proximity, like a pulse
- Diegetic tension curve — no non-diegetic score
- **Tuning:** base loop rate, rate scaling per proximity tier

**J-2 — EVP**
- Faint voices buried in the audio of *completed* scans — only audible when replaying that node's data in the Log tab
- Rewards the player who reviews their own footage; pairs with D-3 Redacted Results (§15)
- **Tuning:** which nodes carry EVP, volume/clarity, trigger (proximity at capture time?)

**J-3 — Silence as Tell**
- When an entity is adjacent, the background hum simply **stops** — absence of sound is the warning
- Quieter and more dread-inducing than a sting; matches §5 "Adjacent → all UI freezes"
- **Tuning:** which layers cut, how abruptly, recovery timing

### Dependencies note (bidirectional, per design rules)
- **New: Persistence System (localStorage)** — required by I-1, I-2, I-3, and H-2 seed replay. Stores: current unit ID, accreted prior-unit logs, per-property replay memory. Must be added to the systems list in `/map-systems`.
- Found-footage layer (F-1/2/3) depends on the UI system (§11) and the playback/session orchestrator.
- Audio depth (J-1/2/3) depends on the Audio system (§13) and entity proximity state (§5).

---

*Document version: 0.3 — Found-footage layer, scanner identity, property variety/replay, cross-session cycle meta (localStorage persistence), audio depth*  
*Next: Three.js prototype — point cloud room renderer + FPS controller*
