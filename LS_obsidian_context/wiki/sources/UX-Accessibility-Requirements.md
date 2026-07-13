---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/ux/accessibility-requirements.md"
tags: [ux, accessibility]
aliases: ["accessibility requirements"]
---

# UX: Accessibility Requirements - Summary

## Source
- Original file: `design/ux/accessibility-requirements.md`
- Ingested: 2026-07-05

## Core Content
Project-wide accessibility scope (Draft, 2026-07-02): desktop web, keyboard+mouse only,
PointerLock required, and critically shaped by [[concepts/Diegetic-UI]] — no conventional DOM
HUD exists to attach standard accessibility affordances to. Organized into Visual (A-V1–A-V4:
non-colour status channels, load-bearing since colour-only cues would leak
[[concepts/Inverted-Reward]] information; legible diegetic text; a flagged **photosensitivity
cap** on point-cloud jitter/distortion at ≤3 flashes/sec with a reduced-distortion toggle — the
single highest-priority open item, required before any external playtest), Motor (full input
remapping, adjustable sensitivity + invert-Y, no twitch/QTE inputs, PointerLock loss must never
trap the player), Cognitive (no jump scares, "instrument not bug" framing so
[[concepts/Perception-Stripping]] reads as fiction, an always-honest node ledger), and a
documented screen-reader limitation (full narration out-of-scope for MVP given diegetic-only UI,
with a fallback rule that critical state must use ≥2 of {shape, position, text, distortion}).

## Key Entities
- [[entities/LAST-SCAN]]

## Key Concepts
- [[concepts/Diegetic-UI]]
- [[concepts/No-Jump-Scares-Philosophy]]

## Main Points
- The photosensitivity requirement (A-V3) is a real seizure-risk surface because
  [[entities/Point-Cloud-Renderer]]'s proximity distortion is exactly the kind of flicker/jitter
  effect the requirement caps — flagged as the top open item.
