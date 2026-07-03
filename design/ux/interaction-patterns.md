# LAST SCAN — Interaction Pattern Library

> **Status**: Draft (from `/ux-design`, derived from approved GDDs)
> **Last Updated**: 2026-07-02
> **Scope**: Project-wide interaction vocabulary. Per-screen specs cite these patterns by id.

## Meta-pattern: the Vulnerable State

The game's signature interaction is **trading situational awareness for an action**. Two patterns instantiate it (`P-SCAN`, `P-DOLLHOUSE`): the player must give something up — control or sight — while the world keeps running. Every interaction is measured against this: friction is acceptable when it *creates dread*, never when it's mere input clumsiness.

## Patterns

### P-START — Click-to-Start (PointerLock acquisition)
- **Trigger**: first click after the title screen.
- **Response**: `requestPointerLock()`; NAVIGATE begins.
- **Consistency**: PointerLock is acquired once; on loss, re-lock is a single click (A-M4). Never auto-requested mid-scan.
- **Source**: FPS Movement Core Rule 5.

### P-NAV — Free Navigation
- **Trigger**: WASD (move) + mouse (look) in NAVIGATE.
- **Response**: fixed slow gait (`MOVE_SPEED`), full yaw + clamped pitch (±80°). No sprint/jump/crouch.
- **Cost/tension**: the pace *cannot* change — legible as machine identity, then as helplessness.
- **Consistency**: movement is always immediate (no smoothing/momentum). Rebindable (A-M1).
- **Source**: FPS Movement.

### P-SCAN — Locked Scan (vulnerable state) ★
- **Trigger**: scan action at a node (Scan Mechanic, undesigned — pattern reserved).
- **Response**: camera locks to node, auto-rotates 360°; **all movement/look input revoked**; only Abort (`P-ABORT`) is valid. World/entity does **not** pause.
- **Cost/tension**: total loss of control while exposed — the core dread beat.
- **Consistency**: no QTE, no timing input (A-M3); the only choice is wait-or-abort.
- **Source**: FPS Movement SCAN_LOCKED; Scan Mechanic (#8).

### P-DOLLHOUSE — Dollhouse Toggle (divided attention) ★
- **Trigger**: dedicated toggle keypress.
- **Response**: fullscreen-blocking dollhouse map opens; the player **cannot see the room** while open; world simulation (entity, loop-arming, desync) **continues**.
- **Cost/tension**: sight-for-orientation trade; lingering can walk you into a loop door or the entity.
- **Consistency**: a **toggle**, not a hold and not a multi-step menu (the cost is divided attention, not input friction). Not a translucent overlay. Rebindable (A-M1).
- **Source**: Floor Plan UI Requirements (GDD-level constraint).

### P-ABORT — Escape / Abort
- **Trigger**: Escape (rebindable) during SCAN_LOCKED.
- **Response**: emits `scan:abort`; returns to NAVIGATE; node → INVALID (re-scannable), integrity cost.
- **Consistency**: Escape/abort is the *only* input honoured in SCAN_LOCKED (AC-MOV08).
- **Source**: FPS Movement / Scan Node.

### P-DIEGETIC — Diegetic Feedback (no external HUD)
- **Trigger**: any state change (scan complete, coverage tick, anomaly density, proximity).
- **Response**: expressed as in-world instrument output — coverage ring, node ledger, Matterport-style error messages, point-cloud distortion. **No external/DOM HUD** (forbidden pattern).
- **Consistency**: critical state carries ≥2 channels of {shape, position, text, distortion} (A-S1); coverage/status carry a non-colour channel (A-V1).
- **Source**: technical-preferences (diegetic UI); Floor Plan + Scan Node UI Requirements.

### P-DEGRADE — Instrument Degradation as Signal
- **Trigger**: escalation (`e`), entity proximity, anomaly reveal.
- **Response**: the *instrument itself* becomes the feedback — dollhouse desync/lag, looping geometry, point jitter/flicker, cached-data labels. Framed diegetically as instrument failure, never a software bug (A-C2).
- **Consistency**: degradation is quiet and cumulative — **no jump scares** (A-C1). Distortion respects the photosensitivity ceiling (A-V3).
- **Source**: Floor Plan (perception stripping); Point Cloud Renderer.

## Consistency Rules (apply to every pattern)

1. **No external HUD** — all feedback diegetic.
2. **World never pauses for a menu** — dollhouse-open and scan-lock both keep the sim live (the vulnerable state only bites if time keeps moving).
3. **Every survival-relevant cue is multi-channel** (A-S1) and non-colour-dependent (A-V1).
4. **All keys rebindable** (A-M1); mouse sensitivity + invert available (A-M2).
5. **Friction must buy dread** — if an interaction is merely awkward without creating tension, it's a bug, not a pattern.

## Open Items

- `P-SCAN` trigger + `P-DOLLHOUSE` exact keybind/transition are **UX-spec scope** (`design/ux/dollhouse.md`, `design/ux/hud.md`) — this library reserves the patterns; the per-screen specs finalise them.
- Scan Mechanic (#8) must confirm (not redefine) `P-SCAN`'s lock/abort contract when authored.
