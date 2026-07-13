---
type: concept
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/GDD-Scan-Mechanic]]", "[[sources/GDD-Entity-System]]", "[[sources/GDD-Win-Lose-Ending]]"]
tags: [process, collaboration]
aliases: ["/design-system", "lean mode"]
---

# Design Review (Lean Mode)

## Definition
This project's collaborative GDD-authoring process (`/design-system`), run section-by-section
with explicit user approval at each step, never generating a full document unilaterally. "Lean
mode" is one of three review-effort settings (solo/lean/full) that gates when specialist
sub-agents get consulted during authoring.

## Key Characteristics
- Under lean mode, only **Formulas** and **Acceptance Criteria** sections mandatorily spawn a
  specialist consult (`systems-designer` and `qa-lead` respectively) — every other section is
  drafted directly, with a note that a specialist wasn't consulted.
- Every section follows the same cycle: **Context → Questions → Options → Decision → Draft →
  Approval → Write** — nothing is written to a GDD file before the user has seen and approved the
  exact content.
- Cross-GDD amendments (e.g. adding a new exit event to a sibling GDD's state table) get their own
  explicit approval step, separate from the current section's.
- `/design-review` (validating a completed GDD) is deliberately **never** run in the same session
  as `/design-system` (authoring it) — the reviewing context must be independent for the critique
  to mean anything.

## Applications
All three GDDs this session (Scan Mechanic, Entity System, Win/Lose & Ending) were authored this
way. A real process failure occurred and was recovered: a `narrative-director` consult's output
was lost when a *new* agent was spawned to "follow up" instead of resuming the *original* agent by
its ID — the fix was resuming the correct agent instance, and the lesson was logged in the
project's own session-state file so it doesn't recur.

## Related Concepts
- [[concepts/Registry-Driven-Consistency]] — each section's Formulas/Detailed-Design steps include a registry-conflict check

## Related Entities
- [[entities/Scan-Mechanic]]
- [[entities/Entity-System]]
- [[entities/Win-Lose-Ending]]

## Mentions in Source
- "Never write a section without user approval. Never contradict an existing approved GDD without flagging the conflict." — (project skill definition, `/design-system`)
