---
type: index
created: 2026-07-05
updated: 2026-07-12
---

# LAST SCAN — Knowledge Wiki

Hand-curated (not auto-ingested — see [[log]]) knowledge base covering the full project so far:
design (all 9 GDDs), architecture (all 7 ADRs + both `/architecture-review` runs), and production
history (worklog, gate-check, QA bugs, UX docs, tooling). Built following the
[[../Welcome to Karpathy LLM Wiki|Karpathy LLM Wiki]] plugin's three-page-type convention
(`entities/`, `concepts/`, `sources/`) so it stays queryable and linkable even without the
plugin's own LLM ingest pipeline configured.

## Start here

- [[entities/LAST-SCAN|LAST SCAN]] — the project itself: premise, pillars, tech stack, current state
- [[concepts/Inverted-Reward|Inverted Reward]] — the game's central thesis; almost everything links back here
- [[concepts/Event-Bus-Architecture|Event Bus Architecture]] — the Orchestrator pattern every system rides on
- [[concepts/Perception-Stripping|Perception Stripping]] — the map-you-can't-trust horror lever

## Systems (entities)

| System | Layer | GDD Status | ADR Status |
|---|---|---|---|
| [[entities/Point-Cloud-Renderer\|Point Cloud Renderer]] | Foundation | Designed | Proposed (self-gated on OQ1 prototype) |
| [[entities/FPS-Movement\|FPS Movement]] | Foundation | Designed | Proposed |
| [[entities/Floor-Plan-System\|Floor Plan System]] | Core | **Approved** | Proposed |
| [[entities/Scan-Node-System\|Scan Node System]] | Core | **Approved** | Proposed |
| [[entities/Orchestrator\|Orchestrator]] | Core | **Approved** | **Accepted** (ADR-0001, only one) |
| [[entities/Scan-Mechanic\|Scan Mechanic]] | Core | Designed | — (no dedicated ADR yet) |
| [[entities/Entity-System\|Entity System]] | Core | Designed | — |
| [[entities/Win-Lose-Ending\|Win/Lose & Ending]] | Feature | Designed | — |
| [[entities/UI-HUD\|UI/HUD]] | Presentation | **In Review** (round-4 revised 2026-07-12; designed 2026-07-10, last MVP system) | — (DI pattern recommended, not yet ADR'd) |
| [[entities/Audio-System\|Audio System]] | Cross-cutting | Not Started (Vertical Slice tier) | — |
| [[entities/Found-Footage-Layer\|Found-Footage Layer]] | Presentation | Not Started (Vertical Slice tier) | — |
| [[entities/Persistence\|Persistence]] | Foundation | Not Started (Alpha tier) | — |
| [[entities/Cycle-Meta-Layer\|Cycle/Meta Layer]] | Feature | Not Started (Alpha tier) | — |
| [[entities/The-Antagonist-Entity\|The Antagonist (in-fiction)]] | — | n/a — game-world subject, not a code system | — |

Also: [[entities/Three-js|Three.js]] (the rendering engine, r171 pinned) and
[[entities/Verify-Registry-Tool|Verify-Registry Tool]] (the machine-checked registry auditor).

**9/9 MVP systems designed — all MVP systems are Designed as of 2026-07-10.** 3/9 designed GDDs
independently reviewed and **Approved** (Floor Plan, Scan Node, Orchestrator); UI/HUD entered
review 2026-07-12 and is **In Review** (4 rounds deep, round 5 pending — see
[[sources/UI-HUD-Review-Log]]); the other 5 (Point Cloud Renderer, FPS Movement, Scan Mechanic,
Entity System, Win/Lose & Ending) still need a `/design-review` pass. 7 ADRs written, 1 Accepted.

## Core concepts

**Design pillars & thesis**
- [[concepts/Inverted-Reward|Inverted Reward]] — obeying the displayed objective is the trap
- [[concepts/Perception-Stripping|Perception Stripping]] — the map is deliberately made untrustworthy
- [[concepts/Coverage-as-False-Comfort|Coverage as False Comfort]] — the UI never corrects its own positive framing
- [[concepts/Found-Footage-Framing|Found-Footage Framing]] — the player is viewing a recovered session
- [[concepts/Diegetic-UI|Diegetic UI]] — no external HUD, ever
- [[concepts/No-Jump-Scares-Philosophy|No-Jump-Scares Philosophy]] — horror via wrongness, never a startle
- [[concepts/Proximity-Tier-System|Proximity Tier System]] — the 4-tier FAR/MEDIUM/NEAR/ADJACENT vocabulary
- [[concepts/Session-Escalation|Session Escalation (e)]] — the shared 0–1 dread dial
- [[concepts/Locked-Scan-State-Machine|Locked Scan State Machine]] — the vulnerable-state scan verb

**Architecture patterns**
- [[concepts/Event-Bus-Architecture|Event Bus Architecture]] — pub/sub, no direct cross-system imports
- [[concepts/Session-Lifecycle|Session Lifecycle]] — LOADING → ACTIVE → SEALED, project-wide
- [[concepts/Latest-Value-vs-Discrete-Events|Latest-Value vs. Discrete Events]] — the bus's caching contract
- [[concepts/Dependency-Injection-over-Singleton|DI over Singleton]] — the composition-root wiring pattern
- [[concepts/Capped-Delta-Time-Game-Clock|Capped Delta-Time Game Clock]] — the shared 0.1s dt cap
- [[concepts/Authoritative-vs-Estimated-State|Authoritative vs. Estimated State]] — the drift-proof data pattern
- [[concepts/Frame-Budget-Allocation|Frame Budget Allocation]] — the 16.6ms/60fps per-system slice table

**Process & methodology**
- [[concepts/Registry-Driven-Consistency|Registry-Driven Consistency]] — `entities.yaml` as cross-doc truth
- [[concepts/Cross-System-Invariant-Documentation|Cross-System Invariant Documentation]] — the Interaction Matrix pattern
- [[concepts/Rules-Dont-Compose|Rules Don't Compose]] — the recurring bug class this project learned to name
- [[concepts/Blockers-Live-At-Inheritance-Boundary|Blockers Live at the Inheritance Boundary]] — the generalized lesson
- [[concepts/Assert-The-What-Dont-Prove-The-How|Assert the What, Don't Prove the How]] — an AC-writing pitfall
- [[concepts/Acceptance-Criteria-Convention|Acceptance Criteria Convention]] — GIVEN/WHEN/THEN, Logic vs. Integration
- [[concepts/GDD-Standard-8-Sections|GDD Standard (8 Sections)]] — the required document shape
- [[concepts/Architecture-Decision-Record-Process|ADR Process]] — how this project pins implementation architecture
- [[concepts/Design-Review-Lean-Mode|Design Review (Lean Mode)]] — the `/design-system` collaborative process
- [[concepts/Gate-Check-Process|Gate-Check Process]] — phase-transition readiness verdicts
- [[concepts/Traceability-TR-ID-System|Traceability (TR-ID) System]] — GDD requirements ↔ ADR coverage
- [[concepts/Cross-Machine-Quicksave-Protocol|Cross-Machine Quicksave Protocol]] — desktop ↔ Legion continuity

## Sources

All 9 GDDs, all 7 ADRs, both `/architecture-review` runs, both registries (`entities.yaml`,
`architecture.yaml`), the worklog, session-state, gate-check, QA bug reports, and both UX docs are
indexed under `sources/` — see each entity/concept page's "Mentions in Source" section for the
specific citation, or browse `wiki/sources/` directly. Source pages are summaries with a
`source_file` pointer to the real repo file; they are not full copies (see [[log]] for why).

## Schema

`wiki/schema/config.md` documents the controlled vocabulary already in organic use across this
wiki (page types, entity sub-types, tags, status vocabulary, section templates) — a reference,
not an enforced validator. Added once the wiki crossed 71 pages, well past the plugin's own
"~30+ pages" threshold for when this starts paying for itself.

## ⚠️ Repo state this wiki reflects

Four of the source GDDs indexed here — [[entities/Scan-Mechanic]], [[entities/Entity-System]],
[[entities/Win-Lose-Ending]], and [[entities/UI-HUD]] — existed **only as uncommitted local files**
on the authoring machine at the time this wiki was last updated, not yet pushed to
`origin/ls_main`. This wiki reflects real, current design content either way, but if you're
reading this from a different machine and these GDDs are missing from your checkout of the actual
repo, that's why — check `git status` on the authoring machine and quicksave (see
[[concepts/Cross-Machine-Quicksave-Protocol]]).

## Current project state (as of last ingestion, 2026-07-12)

**All 9/9 MVP systems are Designed** (since 2026-07-10) — [[entities/UI-HUD]] (#12) was the last
one. The `/gate-check pre-production` FAIL from 2026-07-02 was blocking specifically on this (4
undesigned MVP GDDs at the time); that specific blocker is cleared. Review has now started:
[[entities/UI-HUD]] is 4 rounds into `/design-review` (round 5 independent re-review pending — see
[[sources/UI-HUD-Review-Log]]), the first of the 6 unreviewed MVP GDDs to enter the pipeline.
Remaining path to PASS: finish UI/HUD's review, then independent `/design-review` for the other 5
(Point Cloud Renderer, FPS Movement, Scan Mechanic, Entity System, Win/Lose & Ending — always a
fresh session, never same-session as authoring), flip the remaining Proposed ADRs to Accepted
(plus FPS Movement's owner ratifying UI/HUD's new Open Q#9), then re-run
`/gate-check pre-production`. See [[entities/LAST-SCAN]], [[entities/UI-HUD]], and
[[sources/Gate-Check-Pre-Production]].

## How this wiki was built

Hand-authored by Claude Code across four passes: an initial pass on 2026-07-05 (architecture phase
+ three MVP GDDs), a completion pass on 2026-07-07 (production history, QA, UX, remaining systems,
and process-methodology concepts), a milestone pass on 2026-07-10 (UI/HUD — the 9th and final MVP
system GDD, closing out the full MVP design phase), and a review-tracking pass on 2026-07-12
(UI/HUD's round-4 independent `/design-review`, its Rule 10 rewrite, and the new obligation on
FPS Movement) — not generated by the Karpathy LLM Wiki plugin's own ingest pipeline (that requires
an LLM provider configured inside Obsidian, which wasn't set up). See [[log]] for the full method
note and known gaps.
