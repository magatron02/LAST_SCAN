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

### Win
- All valid scan nodes complete
- No entity captured in point cloud
- Upload completes → session ends

### Lose — Type 1: Entity Captured
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

*Document version: 0.1 — Initial design*  
*Next: Three.js prototype — point cloud room renderer + FPS controller*
