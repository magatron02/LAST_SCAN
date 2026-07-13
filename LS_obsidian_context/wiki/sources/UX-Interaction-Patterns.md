---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/ux/interaction-patterns.md"
tags: [ux, patterns]
aliases: ["interaction patterns"]
---

# UX: Interaction Patterns - Summary

## Source
- Original file: `design/ux/interaction-patterns.md`
- Ingested: 2026-07-05

## Core Content
A project-wide interaction vocabulary (Draft, 2026-07-02) anchored by one meta-pattern, **"the
Vulnerable State"** — the game's signature move of trading situational awareness for an action
(control or sight) while the world keeps running. Six named patterns: P-START (click-to-start
PointerLock acquisition), P-NAV (free navigation, no smoothing), P-SCAN (the locked, auto-rotating
scan — the core dread beat, see [[concepts/Locked-Scan-State-Machine]]), P-DOLLHOUSE (a
fullscreen map toggle that trades sight for orientation while the simulation keeps running
underneath), P-ABORT (Escape-only exit from lock), P-DIEGETIC (no external HUD, ever — see
[[concepts/Diegetic-UI]]), and P-DEGRADE (the instrument itself becomes the horror feedback —
desync, jitter, cached-data labels — framed as instrument failure, never a bug; see
[[concepts/Perception-Stripping]]).

Closes with 5 project-wide consistency rules: no external HUD; the world never pauses for menus;
every survival cue is multi-channel and non-colour-dependent; all keys rebindable; friction must
buy dread or it's a bug.

## Key Entities
- [[entities/LAST-SCAN]]
- [[entities/Scan-Mechanic]]

## Key Concepts
- [[concepts/Diegetic-UI]]
- [[concepts/Perception-Stripping]]
- [[concepts/Locked-Scan-State-Machine]]

## Main Points
- P-SCAN's and P-DOLLHOUSE's exact trigger/keybind specifics are explicitly reserved for later
  per-screen UX specs (`dollhouse.md`, `hud.md`) — [[entities/Scan-Mechanic]] is responsible for
  confirming, not redefining, P-SCAN's lock/abort contract.
