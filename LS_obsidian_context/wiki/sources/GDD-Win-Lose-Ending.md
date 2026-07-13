---
type: source
created: 2026-07-05
updated: 2026-07-05
source_file: "design/gdd/win-lose-ending.md"
tags: [gdd, feature, designed]
aliases: ["Win/Lose GDD"]
---

# GDD: Win/Lose & Ending - Summary

## Source
- Original file: `design/gdd/win-lose-ending.md`
- Ingested: 2026-07-05

## Core Content
Full design spec for [[entities/Win-Lose-Ending]], authored this session: 8 core rules, a
2-state machine (`ACTIVE`/`ENDED`), 1 formula (the Movement Violation position-delta check), 30
acceptance criteria, 4 open questions. `systems-designer` (one tuning constant) and
`narrative-director` (the ending text-variation matrix) were both consulted.

## Key Entities
- [[entities/Win-Lose-Ending]]

## Key Concepts
- [[concepts/Inverted-Reward]] — this GDD makes the thesis mechanically real
- [[concepts/Found-Footage-Framing]] — governs the ending screen's tone
- [[concepts/Design-Review-Lean-Mode]] — a process failure and recovery happened during this GDD's authoring

## Main Points
- Reinterpreted the master concept doc's 4 numbered "Lose Types" as 3 primary outcomes plus one
  independent text-modifier flag (`entityEverCaptured`), rather than 4 fully separate categories —
  a structural re-reading the user confirmed rather than the GDD assuming silently.
- Surfaced, rather than quietly patched, a real gap: the ending record has no `anomaliesLogged`
  field despite the terminal-screen template needing one.
- A `narrative-director` consult's findings were briefly lost mid-session when a fresh agent was
  spawned instead of resuming the original one by ID — recovered by properly resuming the correct
  agent instance; logged as a process lesson in the project's own session-state file.
