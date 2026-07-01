---
name: scan-node-review
description: UX critique of Scan Node System GDD — rounds 1-3 closed all BLOCKING inheritance-boundary gaps vs Floor Plan precedent and the DEFERRED-AC process concern; round 4 (2026-07-01) confirms clean, no new findings, UX-facing content ready
metadata:
  type: project
---

Adversarial/independent review of `design/gdd/scan-node-system.md`, cross-referenced against
`design/gdd/floor-plan-system.md` (the sibling doc Scan Node shares the coverage ring and
`nodesCompleted`/`coverage` numbers with). See [[dollhouse-review]] for the Floor Plan side of
the same UI surface.

## Round 1 (2026-06-30, design-review team)

2 BLOCKING: (1) zero accessibility/non-colour-channel requirement for the coverage ring despite
Floor Plan already requiring this for the *same* ring; (2) no co-location constraint for
`nodesCompleted` vs `coverage`, permitting both a too-subtle (divergence unnoticed) and a
too-obvious (reads as a bug) failure mode. Plus 2 should-fix: early-game framing fully deferred
to a future HUD GDD instead of GDD-level; Open Question needed to distinguish "no instrumented
gauge" (intentional) from "no signal at all, ever" (unconfirmed risk) for `entityCaptured`.

## Round 2 (2026-06-30, same day — independent re-review)

Judged each fix on whether it solved the *actual* round-1 risk, not just whether new text exists.

- **Accessibility bullet**: resolved cleanly. Scan Node's version (fill level/icon/text label,
  explicitly cross-referenced to Floor Plan's UI Requirements) is equal-or-broader rigor than
  Floor Plan's own precedent bullet, and correctly frames itself as inheriting, not duplicating.
- **Co-location constraint**: only **half**-solved. New text fixes "visible together, diegetic
  buffer" — solves noticed/not-noticed and bug-read/corruption-read. But the round-1 risk was
  specifically *which number reads as more authoritative* (12/12 feels more "final" than 92.3%
  regardless of proximity) — a visual-hierarchy problem, not a proximity problem. No mechanism
  (relative type size, framing language, position-order) was added to address that. Co-location
  is necessary but not sufficient for "neither number outranks the other perceptually."
- **Early-game framing**: only **half**-solved, same shape of gap. Location fixed — it's now a
  GDD-level UI Requirements bullet AND tracked in the new Cross-System Invariants table, genuinely
  binding on a future HUD GDD author. Content not fixed — "must read as unambiguously positive...
  the visual execution remains HUD-GDD scope" restates the requirement without supplying any
  mechanism (e.g. "praise language must not reference the literal percentage," "must echo the
  SPATIAL INDEX MISMATCH device"). Borderline violates the project's own `.claude/rules/
  design-docs.md` "no hand-waving" rule — it doesn't say "should feel good" but it doesn't say
  much more than that either.
- **Open Q#5**: resolved cleanly, no residual gap. States the "no gauge" vs "no signal at all"
  distinction almost verbatim to the round-1 ask, anchors to master GDD §15-D3/§16-J2, has an
  owner and a resolution trigger.
- **New finding this round**: Cross-System Invariants table row claims the coverage ring's
  framing is the player's "only" early-game read of `coverage` — now stale against the same
  round's own co-location bullet, which puts `nodesCompleted X/Y` permanently next to `coverage`
  (not gated to late-game), so early-game the player has two co-located numbers, not one ring.
  Small internal-consistency gap introduced by this round's own edits not being cross-checked
  against each other — ironic given the Invariants table's explicit charter is to prevent exactly
  this class of gap.

**Why this matters for future re-reviews**: a recurring pattern across both Scan Node and
[[dollhouse-review]] (Floor Plan round 3/4) is "location of the requirement gets fixed before
content does" — a fix that moves a gap from "doesn't exist anywhere" to "exists but only asserts
the *what*, defers the *how*" reads as resolved on a shallow pass but isn't. Always re-derive
whether the *specific* mechanism the original finding asked for exists, not just whether a bullet
with the right keywords now exists.

**How to apply**: when re-reviewing scan-node-system.md or floor-plan-system.md again, check the
co-location/visual-hierarchy gap and the early-game-framing mechanism gap first — both are likely
to resurface verbatim at HUD GDD authoring time (`design/ux/hud.md`) if not closed before then.

## Round 3 (2026-07-01, independent re-review)

Re-checked round 2's trust-valence finding against the new "Trust ordering" UI Requirements
paragraph (lines 384-390) and new AC-SN31 (DEFERRED, line 569).

- **Trust-valence finding: CLOSED, genuinely.** Distinguished this from the round-1
  "unambiguously positive" vagueness pattern: "dominant" here isn't a mood word, it's a
  **relational ordering constraint** between two named elements (`coverage` must outrank
  `nodesCompleted`) with an explicit, correctly-scoped-out remainder (typographic mechanism =
  HUD-GDD scope). A relation (A > B) is a complete, checkable requirement even without a chosen
  mechanism, unlike "reads as unambiguously positive" which had no comparison object at all.
  This is NOT the same shape of gap as the round-1 early-game-framing fix — don't conflate them
  in future rounds.
- **Cross-System Invariants "only" contradiction (round-2 new finding): CLOSED.** Searched
  "trust-bearing number" and "coverage ring's" rows directly — no "only early-game read" framing
  survives anywhere in the current table. Rewritten out, not just patched around. No regression.
- **AC-SN31 (DEFERRED): real pass/fail shape, not documentation dressed as a test** — but flagged
  a **new process concern**: Floor Plan has zero DEFERRED ACs across ~35 (confirmed via grep,
  no "DEFERRED" string in floor-plan-system.md at all). Scan Node now has 3/26 (11.5%): AC-SN22 +
  AC-SN30 are legitimately deferred (blocked on unwritten *upstream systems* — Orchestrator,
  Win/Lose, real floorplan:init payload code). AC-SN31 is structurally different — it's blocked
  on a **future document this GDD is itself trying to bind** (the HUD GDD), which is the same
  shape of forward-looking gap as Open Q#1 (`nodesCompleted` display rule, also HUD-GDD-owned)
  — yet one became a DEFERRED AC and the other stayed an Open Question, with no stated rule for
  which mechanism applies when. Recommended two options to the team: either adopt DEFERRED-AC
  as the standing idiom and fold Open Q#1 into one for consistency, or reserve DEFERRED strictly
  for "the other system doesn't exist yet" and route future HUD-bound constraints through Open
  Questions instead. Not blocking — a hygiene/convention question, not a design gap.
- **Fresh-pass findings (new this round, not previously flagged in any round):**
  - `integrityCount` is in the UI view model (line 372) and has real player-facing-implied
    signals (`scan:integrity_warning`/`scan:integrity_failure`, Core Rule 8) but has **zero**
    UI Requirements treatment — no display constraint, not even a placeholder acknowledgment
    that it's deferred to HUD-GDD (unlike coverage/nodesCompleted/the ring, which all got at
    least a stub). Slipped through 3 rounds because attention stayed on coverage/nodesCompleted.
  - The UX Flag callout (lines 403-406) points UI stories at `design/ux/hud.md`, which doesn't
    exist yet, with no fallback clause telling a cold-read programmer to treat this GDD's UI
    Requirements as authoritative until it does. Minor navigability gap, not a design gap.

**Overall verdict**: doc is UX-clean at the GDD layer as of this round. Every BLOCKING UX finding
from rounds 1-2 is closed on inspection, not just on paper. Only open items are the DEFERRED-AC
convention question (process, not content) and the two small fresh-pass gaps above — neither
blocking.

**How to apply next round**: don't re-litigate co-location/trust-ordering/the Invariants-table
contradiction again, they're closed. If a 4th DEFERRED AC shows up anywhere in this doc (e.g. at
Win/Lose or HUD GDD time), that's the trigger to push the DEFERRED-vs-Open-Question convention
question to creative-director/systems-designer rather than deferring it again.

## Round 4 (2026-07-01, final independent re-review) — CLOSED, no new findings

Verified the systems-index.md carry-forward entry (Open Cross-System Items, UI/HUD #12) added in
round 3 genuinely closes the "no carry-forward mechanism" process gap: it sits in the identical
list, same header pattern, same "do not do X" imperative shape, immediately below the pre-existing
`nodesCompleted`/`coverage` denominator-divergence precedent entry it was designed to match —
equal discoverability, not a lesser afterthought. It names AC-SN31 directly and states explicitly
that the HUD GDD must write its own AC with a measurable proxy (font-size ratio/DOM order/contrast)
rather than treat AC-SN31 as already-testable — exactly what round 3 asked for.

Both round-3 minor findings resolved at rest, correctly:
- `integrityCount`: now in the UI view model (line 372) plus already had shape via Derived Metrics
  ("not a ratio, only the threshold compare"). No display constraint needed — it isn't part of the
  trust-valence/visual-dominance problem, so bare view-model listing is proportionate, not a stub.
- `hud.md` dead link: still dead, correctly so — expected until the HUD GDD exists, same pattern
  as every other GDD's UX Flag callout in this project. Not worth another round; would only
  resurface as a documentation-tooling question (a "not yet written" convention marker) if the
  pattern causes real programmer confusion across multiple GDDs, not a Scan Node content gap.

Full UI Requirements re-pass: no new findings. Section is at parity with Floor Plan's
Approved-state UI Requirements — every remaining item (early-game-framing mechanism,
trust-ordering typographic mechanism) is a relational/priority constraint correctly deferred to
the not-yet-designed HUD GDD, not unresolved GDD-level content. Nothing here would surprise or
block a UI programmer picking this up cold.

**Overall final verdict: UX-facing content in this GDD is genuinely ready.** All 3 rounds' BLOCKING
findings closed on inspection, not relocated. The DEFERRED-AC process concern got a structural fix
(Owner/Resolve-when table + systems-index carry-forward) rather than another round of prose — the
first time in this doc's history a process finding resolved with a mechanism instead of restated
text. Recommend no further UX review rounds on this document; any future work belongs to the HUD
GDD, not this one.

**How to apply**: if this GDD is reopened later (e.g. Win/Lose or Orchestrator authoring reveals a
new cross-doc gap), start from this round's "closed" list before assuming anything needs
re-litigating. The pattern to keep watching for on *future* GDDs in this project: "location of a
requirement fixed before its content" (rounds 1-2's recurring defect) and DEFERRED-AC creep without
Owner/Resolve-when fields (now this project's standing convention, established here — check new
GDDs adopt it too, e.g. Win/Lose or UI/HUD when authored).
