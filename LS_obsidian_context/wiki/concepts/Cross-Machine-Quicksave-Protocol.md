---
type: concept
created: 2026-07-07
updated: 2026-07-07
sources: ["[[sources/Project-Worklog]]", "[[sources/Session-State-Active]]"]
tags: [process, workflow]
aliases: ["quicksave", "worklog protocol"]
---

# Cross-Machine Quicksave Protocol

## Definition
This project is worked on from multiple machines (a desktop and a "Legion" laptop). Local Claude
Code memory doesn't travel between them, so the project defines two committed, git-tracked files
as the actual continuity mechanism: `production/worklog.md` (a narrative running log, newest entry
on top) and `production/session-state/active.md` (structured working state — current task,
progress checklist, key decisions, open questions).

## Key Characteristics
- Saying "quicksave" triggers: append a dated worklog entry summarizing what changed since the
  last entry, update the session-state file, consolidate any durable local memory, then commit and
  push so the other machine can `git pull` and continue with full context.
- At session start on *any* machine, the protocol is: read the worklog's top entry first, then the
  session-state file, before doing anything else — this is how a fresh Claude Code session recovers
  the full arc of decisions without replaying the whole conversation history.
- **Failure mode observed directly in this project**: three GDDs ([[entities/Scan-Mechanic]],
  [[entities/Entity-System]], [[entities/Win-Lose-Ending]]) were fully authored on one machine but
  never quicksaved before the session ended — leaving them as uncommitted local files invisible to
  git and to the other machine, discovered only when a later session ran `git status` and found
  them untracked. The protocol's discipline (quicksave before ending a session) is what prevents
  this; skipping it is exactly what caused it.
- A second, smaller cross-machine incident is logged in [[entities/Win-Lose-Ending]]'s own
  process note: an earlier `narrative-director` consult was "lost mid-relay" when a *fresh* agent
  spawn was used to follow up instead of resuming the original agent by its ID — recovered by
  resuming the correct instance. Named lesson: always resume a specific prior agent by its ID,
  never respawn fresh to "continue" a consult.

## Applications
The session-state file for this project has grown into a long, sometimes messily-appended
narrative (duplicate section headers from repeated saves) rather than a clean structured
snapshot — a real, visible cost of the append-and-continue pattern that the protocol doesn't
fully solve by itself.

## Related Concepts
- [[concepts/Design-Review-Lean-Mode]] — the authoring process whose state this protocol persists between sessions

## Related Entities
- [[entities/Scan-Mechanic]] · [[entities/Entity-System]] · [[entities/Win-Lose-Ending]] — the concrete uncommitted-work incident

## Mentions in Source
- "Local Claude memory (~/.claude/.../memory/) is machine-local and does NOT travel. The synced running log is production/worklog.md." — project CLAUDE.md, Quicksave Protocol section
- "Lesson: always use SendMessage with the agentId to continue a specific prior agent, never a fresh Agent call." — [[sources/Session-State-Active]]
