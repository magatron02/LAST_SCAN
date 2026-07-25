# LAST SCAN — Accessibility Requirements

> **Status**: Draft (from `/ux-design`, derived from approved GDD constraints)
> **Last Updated**: 2026-07-02
> **Scope**: Project-wide. Per-screen specs (dollhouse, HUD) inherit these.

## Scope & Platform Constraints

- **Target**: desktop web, **keyboard + mouse only** — no gamepad, no touch (`technical-preferences.md`). PointerLock (click-to-start) required.
- **All UI is diegetic** (Matterport-style overlay); external/standard HUD is a **forbidden pattern**. This shapes every requirement below — there is no conventional DOM HUD to hand to a screen reader.
- **No jump scares** (forbidden pattern); horror is error messages + point-cloud distortion only.

## 1. Visual

| Req | Requirement | Source / Status |
|-----|-------------|-----------------|
| A-V1 | **Non-colour channel** on the coverage ring and per-node status (fill level / icon / text), never colour alone | **Locked** — Floor Plan + Scan Node UI Requirements (load-bearing for the Inverted Reward) |
| A-V2 | Diegetic text (error messages, logs, coverage %) meets a legible min size; scalable ≥ 1.5× without loss of meaning | New — UI/HUD GDD writes the measurable AC |
| A-V3 | **Photosensitivity**: `PROXIMITY_CORRUPTED` colour flicker + per-frame jitter must respect a flash-frequency ceiling (≤ 3 flashes/s) and offer a **reduced-distortion** toggle | New — **flagged**: renderer jitter/flicker is a real seizure-risk surface; ADR-0002 (e) jitter is the mechanism |
| A-V4 | Colour palette (green `#4ade80` on near-black `#0a0c10`) checked for contrast | Revised 2026-07-15 — ENTITY_SPIKE now renders in BASE green (Point Cloud Renderer design-review); its tell is density, not colour, so the former amber/green red-green-deficiency risk no longer exists. Amber `#fbbf24` remains only as the master GDD's UI warning-text colour |

## 2. Motor

| Req | Requirement | Source / Status |
|-----|-------------|-----------------|
| A-M1 | **Full input remapping** — WASD, dollhouse toggle, scan trigger, Escape/abort all rebindable | New — accessibility basic |
| A-M2 | Mouse sensitivity adjustable; **invert-Y** available | **Exists** — `MOUSE_SENSITIVITY`, `INVERT_Y` (FPS Movement Tuning Knobs) |
| A-M3 | No input requiring rapid repeated presses or precise timing to *survive* (abort-or-wait scan is a binary choice, not a QTE) | Satisfied by design (FPS Movement / Scan Mechanic) |
| A-M4 | PointerLock loss must not trap the player; re-lock is one click | FPS Movement Core Rule 5; the suppress-vs-blind flag (ADR-0004 e) is a design choice, not an a11y blocker |

## 3. Cognitive

| Req | Requirement | Source / Status |
|-----|-------------|-----------------|
| A-C1 | No jump scares; threat telegraphed through instrument degradation, not sudden stimulus | **Locked** — forbidden pattern |
| A-C2 | Diegetic "instrument, not bug" framing (e.g. `SPATIAL DATA: CACHED`) so desync/mismatch reads as fiction, not software error | **Locked** — Floor Plan UI Requirements |
| A-C3 | Core objective (scan nodes / coverage) legible without external tutorial; the node ledger is always honest | Satisfied by design (Scan Node) |

## 4. Audio (deferred)

| Req | Requirement | Status |
|-----|-------------|--------|
| A-A1 | Any survival-relevant audio cue (entity proximity) must have a **visual equivalent** (point-cloud tell already exists) | **Deferred** — Audio System (#6) undesigned; the renderer's proximity distortion is the existing visual channel |

## 5. Screen Reader (documented limitation)

Because **all UI is diegetic** (in-world point-cloud + Matterport overlay), traditional screen-reader support is inherently limited — there is no semantic DOM HUD. **Requirement A-S1**: the game must not *rely* on any single-channel cue; critical state (coverage, node status, proximity) is conveyed through at least two of {shape, position, text, distortion}. Full screen-reader narration is **out of scope for MVP** and flagged for the UI/HUD GDD to revisit (Full Vision tier).

## Acceptance & Open Items

- **Testable now**: A-V1 (non-colour channel), A-M2 (sensitivity/invert exist), A-C1/A-C2 (design-locked).
- **Needs the UI/HUD GDD to write measurable ACs**: A-V2 (text scale), A-V3 (flash ceiling + reduced-distortion toggle), A-V4 (contrast/colourblind check).
- **⚠️ Priority flag**: **A-V3 photosensitivity** — the point-cloud flicker/jitter is the one requirement with a safety dimension; the UI/HUD + renderer stories must implement the flash ceiling and a reduced-distortion option before any external playtest.
