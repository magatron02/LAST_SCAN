---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "production/qa/bug-audit-handoff-2026-06-27.md, production/qa/bugs/BUG-0001.md, production/qa/bugs/BUG-0002.md, production/qa/bugs/BUG-0003.md"
tags: [qa, bugs]
aliases: ["bug reports", "BUG-0001", "BUG-0002", "BUG-0003"]
---

# QA Bug Reports - Summary

## Source
- Original files: `production/qa/bug-audit-handoff-2026-06-27.md`,
  `production/qa/bugs/BUG-0001.md`, `BUG-0002.md`, `BUG-0003.md`
- Ingested: 2026-07-05

## Core Content
A read-only Codex static audit of the two-file implemented prototype (`src/main.js`,
`src/pointcloud.js`) found and documented 3 bugs on 2026-06-27, handed off to Claude Code for
triage — no fixes attempted in the audit itself. All 3 were fixed in `src/main.js` on 2026-06-30,
but remain **"Fix Applied — Pending Manual Verification"**: none can be closed without a real
browser (the sandbox environment cannot acquire PointerLock, which every reproduction needs).

- **BUG-0001** (S2-Major): uncapped `clock.getDelta()` let a stalled frame produce a one-frame
  movement teleport, violating [[entities/FPS-Movement]]'s own AC-EC03 (0.1s dt cap). Fixed with
  `Math.min(clock.getDelta(), 0.1)`.
- **BUG-0002** (S2-Major): WASD key state could stick after Alt-Tab (browser doesn't reliably
  deliver `keyup` on focus loss). Fixed with `blur`/`visibilitychange` listeners clearing the key
  set; the PointerLock `unlock` handler was deliberately left untouched, pending
  [[entities/FPS-Movement]]'s own Open Question #1.
- **BUG-0003** (S3-Minor): HUD showed `0.0, 0.0, 0.0` instead of the true `1.5` eye height until
  first movement. Fixed by moving the HUD update out of the movement-only branch.

## Key Entities
- [[entities/FPS-Movement]]

## Key Concepts
- [[concepts/Capped-Delta-Time-Game-Clock]]

## Main Points
- This is the only QA work so far against actually-implemented code — everything else in the
  project is still design/architecture, not runtime bugs.
