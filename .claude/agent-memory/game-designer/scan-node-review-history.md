---
name: scan-node-review-history
description: Round-by-round history of design-review findings on design/gdd/scan-node-system.md, the recurring inheritance-boundary fault pattern, and round-4 (2026-07-01) re-confirmed APPROVED verdict
metadata:
  type: project
---

`design/gdd/scan-node-system.md` went through 4 review rounds, APPROVED as of
2026-07-01 (re-confirmed round 4, independent adversarial pass). Full history in
`design/gdd/reviews/scan-node-system-review-log.md` — read that file first on any
future review, this is a summary/index on top of it.

**Known housekeeping gap (as of round 4):** the GDD's own header (line 3) and
`systems-index.md`'s status column still read "In Review... re-review pending"
even though this memory and the round-3 entry both record APPROVED. Reconcile
those status lines next time either file is touched — the design itself is not
in question, this is a stale-label issue only.

**Round 1 (MAJOR REVISION):** every blocking finding sat at the inheritance
boundary with a sibling doc (cross-GDD invariant unenforced by Floor Plan,
accessibility requirement not inherited, master-GDD mechanics never
cross-referenced). Same fault-pattern family as [[floor-plan-review-history]]
round 1-3, but manifesting as *missing* cross-references rather than
*undefined interactions*. Fixed same session: new Cross-System Invariants
table (mirrors Floor Plan's Interaction Matrix, pointed outward at sibling
docs instead of inward).

**Round 2 (NEEDS REVISION, addressed same session):** two real gaps survived
round 1's fix: (1) a genuine contract contradiction — `scan:coverage` vs
`scan:complete.coverage` had no stated canonical source, two BLOCKING ACs
asserted different authoritative streams; (2) the co-location fix for
`nodesCompleted`/`coverage` solved discoverability but not trust-valence —
integer-completeness bias ("12/12" reads as more "done" than "92.3%")
unaddressed. Named pattern (ux-designer + game-designer independently): "the
requirement's location gets fixed a round before its content does" — a fix
that moves a gap from absent to present-but-shallow reads as resolved on a
shallow pass but isn't. Worth checking for on ANY multi-round GDD fix.

**Round 3 (game-designer solo, 2026-07-01) — Verdict: APPROVED.** Both
round-2 fixes independently re-verified as genuinely holding (recomputed
canonical-source claim against Floor Plan's actual AC-D01, confirmed match).
Findings, none blocking:
1. The new "Trust ordering" UI requirement (coverage must be visually
   dominant over nodesCompleted) correctly diagnoses the psychological
   mechanism but has no operational floor — "dominant" is a spectrum claim,
   not a binary one (unlike the non-colour-channel requirement, which is
   binary and thus can't be "barely satisfied"). A future HUD author could
   satisfy the letter (marginally bigger font) without shifting actual
   trust. Recommend requiring a playtest-verified trust read, not a static
   visual-hierarchy check, whenever this un-defers.
2. AC-SN31 (DEFERRED) is honestly self-aware — it doesn't pretend to test
   what it can't yet. But a DEFERRED AC has zero enforcement mechanism
   beyond "hope the next author reads this file" — no gate in the pipeline
   checks whether upstream DEFERRED ACs get inherited by downstream GDDs.
   Same pattern as AC-SN22/AC-SN30.
3. **Real finding, not yet fixed:** Open Q#5's D-1 "Auto-Typed Log" mention
   flattens a hierarchy the master GDD (`LAST_SCAN_GDD.md` §15-H, line 415)
   explicitly states: D-1 is "the **only** in-world counter-signal" to the
   Inverted Reward trap, distinct in kind from D-3/EVP (both post-hoc-only).
   This GDD's Open Q#5 lists all three as equal-weight candidates, losing
   that hierarchy. Recommended fix: one-clause addition carrying the "only
   in-world counter-signal" framing forward, so Entity System (#9) or
   Found-Footage Layer (#13) — whichever eventually owns D-1 — doesn't
   independently rediscover the stakes from the master GDD.
4. **New, forward-looking:** the Player Fantasy Anchor Moment (line 58-60,
   "the ending tells them what 100% meant") depends entirely on Win/Lose &
   Ending (#10), which is Not Started, 4 systems later in design order.
   Nothing anywhere yet states that Win/Lose must inherit the Anchor Moment
   as a constraint — same uninherited-constraint risk pattern as the
   HUD/Trust-ordering finding, one hop further downstream, currently
   unnamed anywhere. Flag when Win/Lose (#10) is designed.

**Pattern to remember across all future multi-round GDD reviews on this
project:** distinguish "requirement relocated" from "requirement resolved."
A fix that adds a named placeholder/DEFERRED AC/Open-Question bullet moves a
gap from *absent* to *tracked-but-inert* — real progress, but check every
round whether the *next* owner actually has enough context to act on it
without independently re-deriving the stakes from a master doc. This bit
Scan Node twice (D-1 dropped twice before being named, then named without
its priority).

**Round 4 (2026-07-01, independent adversarial pass) — Verdict: APPROVED,
re-confirmed.** Checked the three round-3 fixes fresh:
1. AC-SN29's extended THEN clause (two listeners on `scan:coverage` and
   `scan:complete`, same handling cycle, asserted equal) genuinely proves the
   canonical-equality claim the Invariants table cites it for — no gap.
2. DEFERRED-tracking table (Owner/Resolve-when/Kind) is real documentation
   progress but confirmed **not** enforced by any tooling — checked
   `gate-check` SKILL.md directly, no phase gate greps for DEFERRED ACs or
   verifies Resolve-when conditions are met. This is correctly scoped
   (the table never claims to be a gate) rather than a false-closure — an
   escape hatch with legible exit criteria, not a forcing mechanism. If real
   enforcement is ever wanted, that's a `gate-check`/systems-index tooling
   change, not a GDD-content fix.
3. D-1's Open Q#5 rewording correctly inherits master GDD §15-H's "only
   in-world counter-signal" hierarchy without overreaching into unspecified
   detail (leaves whether D-1 touches `entityCaptured` specifically as
   genuinely open).
New adversarial finding (advisory, not blocking): AC-SN17 proves entity-in-
frame doesn't invalidate the scan, but no AC proves the *negative* — that
`scan:complete` for an entity-captured node carries no distinguishing payload
shape a downstream consumer could misuse as an inadvertent early warning.
Currently enforced only by schema omission + prose ("Scan Node never
editorialises"), not a tested contract. Low risk, but it's the single most
Player-Fantasy-critical rule in the doc, so flagged for whenever this
un-defers (likely at Scan Mechanic or Entity System design time).
