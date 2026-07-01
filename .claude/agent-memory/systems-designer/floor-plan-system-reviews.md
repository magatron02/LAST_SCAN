---
name: floor-plan-system-reviews
description: Review history and recurring failure pattern for design/gdd/floor-plan-system.md's escalation/desync/loop formulas
metadata:
  type: project
---

`design/gdd/floor-plan-system.md` (LAST SCAN) has gone through 4 review rounds
(2026-06-27, 06-28, 06-30 review, 06-30 round-4 re-verification). The recurring
failure pattern across ALL rounds: blocking issues live at the **interaction
between two individually-correct rules**, not a flaw in either rule alone. A
dedicated "Interaction Matrix" subsection (Detailed Design, after "Interactions
with Other Systems") was added 2026-06-30 specifically to stop re-discovering
this class of bug round by round — extend it when new load-bearing state is
added (Orchestrator/Entity System authoring) rather than waiting for the next
review pass.

**Round-4 re-verification (2026-06-30, this session) result:** all 3 round-3
BLOCKING fixes independently re-verified as genuinely closed, not just
documented:
- BF-1 (`w_t` cap at 0.8): confirmed `e` structurally caps at 0.8 from time
  alone at `w_t=0.8,w_c=0.2,coverage=0,t=T_session`. The Edge Case text uses
  strict `w_t > 0.8` rejection (line ~401), consistent with `w_t=0.8` being the
  legal max. Real load-time guard, not just a stated range.
- BF-2 (`D0 < D_max` guard): AC-D08 tests the exact equal boundary
  (`D0=10,D_max=10`) and correctly rejects it. Solid.
- BF-3 (COOLDOWN × reveal "queue" semantics): the COOLDOWN-exit check is a
  stateless OR of (live proximity ≥ tier) OR (permanent reveal flag), evaluated
  once at cooldown-elapsed — NOT an event-ordering/history check. This means a
  fresh proximity-arm condition becoming true *during* the same COOLDOWN window
  as a queued reveal does NOT introduce a new ambiguity — it collapses into the
  already-tested AC-L12 case because the permanent flag dominates the OR
  regardless of timing. Confirmed closed, not just asserted.

**Residual non-blocking gaps found in round-4** (reported as ADVISORY, not
blocking):
1. `D0 < D_max` is a strict inequality but allows near-degenerate spans (e.g.
   `D0=9.999, D_max=10.0` passes validation but produces an almost-flat curve).
   The existing `D_max sanity` tuning note only catches "D_max too large
   relative to T_session", not "span too small relative to D_max's own scale".
2. Interaction Matrix is missing a row for the 3-way composite: reveal-ordering
   (AC-L09) × loop-target-validity (AC-L04) × spawn-clamp (AC-E06) — i.e. a
   loop firing into a `loopTarget` revealed the same tick, where that target's
   `loopSpawn` also needs clamping. Each 2-way rule is independently sound; this
   3-way composite simply isn't staged by any single AC.
3. AC-D03's boundary test uses `w_t=0.9` (clearly over cap) rather than a tight
   pair (`w_t=0.8` legal / `w_t=0.8000001` illegal) — minor testability gap, not
   a design gap.

See [[systems-designer-collaboration-style]] (not yet written) for how this
project's review cycles work — independent re-verification rounds where
creative-director synthesizes multiple specialist findings before fixes are
applied, then a fresh round re-derives the fix from source rather than trusting
"fix applied" notes.
