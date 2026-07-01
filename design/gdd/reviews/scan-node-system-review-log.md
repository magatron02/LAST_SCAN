# Review Log — Scan Node System

Tracks design-review history for `design/gdd/scan-node-system.md`.

## Review — 2026-06-30 — Verdict: MAJOR REVISION NEEDED
Scope signal: L
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director (synthesis)
Blocking items: 7 | Recommended: 5
Summary: First review of the project's most densely-connected hub system (5 downstream
consumers). The design itself — coverage math, node state machine, Inverted Reward framing —
was found coherent and well-argued in isolation. Every blocking finding instead sat at the
**inheritance boundary** with a sibling doc: a cross-GDD invariant (exactly one `ANOMALY_FINAL`
node) assumed by Scan Node but unenforced by Floor Plan, propagating into Floor Plan's own
Approved `w_t≤0.8` safety guarantee; an accessibility requirement Floor Plan already won for
the same coverage ring, not inherited; master-GDD mechanics (§15-D3, §16-J2 EVP, §15-D1) that
exist to consume `entityCaptured`/undercut ledger trust, never cross-referenced; and an
AC-rigor standard (synchronous-ordering guarantees) Floor Plan holds itself to but Scan Node
didn't. creative-director named this "blockers live at the inheritance boundary" — likely a
consequence of Lean-mode authoring of a hub doc never pressure-tested against siblings.
Prior verdict resolved: First review

### Revisions applied same session (2026-06-30) — independent re-review pending
- **Cross-GDD fix**: Floor Plan amended with **AC-E17** (exactly one `ANOMALY_FINAL` node
  enforced at load, mirrors AC-E11) — closes the `S`-invariant gap; Floor Plan AC-E07
  clarified `revealTriggerNodeId` is always `STANDARD`, never `ANOMALY_FINAL`. No Floor Plan
  re-review needed (additive guard, doesn't alter existing behavior) — see Floor Plan's review
  log Amendment entry.
- New **Cross-System Invariants** subsection (Detailed Design) — names every assumption Scan
  Node shares with a sibling doc, the owning doc, and what breaks if it's wrong. Structural
  fix mirroring Floor Plan's Interaction Matrix, pointed outward at sibling docs instead of
  inward at internal rules.
- UI Requirements: co-location constraint for `nodesCompleted`/`coverage` (must be visible
  together, diegetic buffer only); inherited non-colour-channel requirement (same coverage
  ring Floor Plan already locked this for); GDD-level early-game framing requirement (not
  fully deferred to the future HUD GDD).
- Player Fantasy: reframed — trust is delivered by contrast with Floor Plan's desync, not
  manufactured by any rule in this doc; flagged "authoritative"/"honest gauge" language
  describes honesty, not safety.
- Open Q#5 added: `entityCaptured` cross-referenced to master GDD §15-D3 (Redacted Scan
  Results) / §16-J2 (EVP) as the deferred-but-intended player-facing surface; distinguishes
  "no instrumented gauge" (intentional) from "no signal at all" (unconfirmed).
- AC-SN21 rewritten to test only Scan Node's emission contract (the reveal itself is Floor
  Plan AC-C05's job — avoids re-testing across the system boundary).
- AC-SN29 added: Core Rule 5's synchronous-ordering guarantee (state updates before
  `scan:complete` fires), parity with Floor Plan AC-C05; folds in the "coverage is a level,
  not a delta" contract.
- AC-SN04/SN15/SN16 tightened for testability (scoped event-emission claim, console-error
  message/call-count target, real THEN assertion instead of trailing prose).
- AC count 22→23.

**Deferred to nice-to-have (not blocking this pass):** position-fallback AC (Core Rule 1),
NULL+mixed-roster coverage-math AC, AC-SN19 normal-path companion, same-frame race AC,
`floorplan:reveal`-for-non-anomaly-room AC.

**Next:** independent re-review in a fresh session — `/design-review design/gdd/scan-node-system.md`.

## Review — 2026-06-30 (round 2) — Verdict: NEEDS REVISION → addressed same session
Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director (synthesis)
Blocking items: 2 | Recommended: 6
Summary: Independent re-verification confirmed round 1's headline fix (Floor Plan AC-E17,
exactly one ANOMALY_FINAL) is genuinely closed — systems-designer recomputed it from scratch.
Two real gaps survived round 1: a genuine contract contradiction between `scan:coverage`
(Floor Plan AC-D01's canonical source) and `scan:complete.coverage` (this doc's AC-SN22) —
two BLOCKING ACs asserting different authoritative sources for the same number; and the
`nodesCompleted`/`coverage` co-location fix solving discoverability but not trust-valence
(3 of 4 specialists independently found the same gap — integer-completeness bias favors
`nodesCompleted` reading as "done" over `coverage`'s honest percentage). Named pattern: "the
requirement's location gets fixed a round before its content does" (ux-designer + game-designer,
independently) — a fix that moves a gap from "doesn't exist" to "exists but only asserts the
what, defers the how" reads as resolved on a shallow pass but isn't. Also named: the
"individually-correct-rules-don't-compose" pattern now confirmed at three scales (within-GDD
rules, cross-GDD rules, cross-GDD ACs/tests — qa-lead's composition-gap finding).
Prior verdict resolved: Yes — round 1's structural fix (AC-E17) holds; round 2 findings are
calibration/contract gaps, not a redesign.

### Revisions applied same session (2026-06-30, round 2)
User decisions (1): D-1 "Auto-Typed Log" kept — re-added to Open Q#5 as a third candidate
entityCaptured-signal surface (was silently dropped twice across rounds 1-2).
- `scan:coverage` named the canonical coverage broadcast; `scan:complete.coverage` guaranteed
  equal via same-tick emission (AC-SN29); AC-SN22 corrected to cite `scan:coverage`. New
  Cross-System Invariants rows for both the canonical-source guarantee and the
  level-not-delta contract.
- Trust-ordering: `coverage` specified as the visually dominant, trust-bearing number vs.
  `nodesCompleted` secondary — a semantic priority this doc owns without touching HUD visual
  execution. New AC-SN31 (DEFERRED) tracks it as a testable commitment, not just prose.
- New AC-SN30 (DEFERRED): composition test for the Floor Plan AC-E17 × Scan Node `S`-formula
  seam, using real `floorplan:init` payload-construction code once it exists — not two
  fixtures that each assume the invariant.
- Floor Plan's chained-reveal Edge Case wording fixed (accidentally barred the trap node from
  ever living behind a chain — corrected to bar only duplication). Additive clarification,
  no Floor Plan re-review needed.
- Cross-System Invariants preamble note added: naming a shared assumption ≠ proving the seam
  is tested — each row should eventually get a composition AC using real connective code.
- AC count 23→26 (AC-SN30, AC-SN31 added; AC-SN22 corrected).

**Status: NEEDS REVISION resolved same session.** Both blocking items were contract/wording
fixes, no redesign. Recommend one more independent pass given the doc's history (2 prior
MAJOR/NEEDS verdicts) before Approved, but creative-director's synthesis expects a clean
pass — the design underneath has been stable since round 1.

**Next:** independent re-review in a fresh session — `/design-review design/gdd/scan-node-system.md`.

## Review — 2026-07-01 (round 3) — Verdict: NEEDS REVISION → addressed same session
Scope signal: S
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director (synthesis)
Blocking items: 1 | Recommended: 3
Summary: Independent re-verification confirmed all round-2 fixes hold — AC-SN22's event-name
citation verified accurate against Floor Plan's actual AC-D01 text; trust-ordering and the
Invariants-table "only" self-contradiction both confirmed genuinely closed. One real gap:
AC-SN29 was cited as proof `scan:coverage`/`scan:complete.coverage` are "guaranteed equal" but
its THEN clause never tested that — the same defect class as round 2's own composition-gap
finding, this time an unproven claim sitting as if already-closed rather than honestly
DEFERRED, in the very table whose preamble states it shouldn't. creative-director resolved the
tension between game-designer's own APPROVED verdict and systems-designer's BLOCKING finding
explicitly: a design-review verdict grades the document, not just the design, so the integrity
finding stands. 3 specialists converged on a second theme (DEFERRED-as-escape-hatch): no
Owner/Resolve-when fields, no design-vs-implementation distinction, no systems-index
carry-forward — closed with one systemic fix.
Prior verdict resolved: Yes — round 2's fixes hold; round 3's finding is the doc's ~4th
recurrence of "assert the what, don't prove the how," now closed with a fix pattern (the
DEFERRED-tracking table + carry-forward entries) that should generalize forward.

### Revisions applied same session (2026-07-01, round 3)
- AC-SN29 extended: now asserts `scan:coverage` and `scan:complete` payloads are identical in
  the same handling cycle, not just that `scan:complete` alone is fresh.
- New DEFERRED-tracking table (AC section) with Owner/Resolve-when per deferred AC, split into
  `DEFERRED (design)` (AC-SN22, AC-SN31 — blocked on unauthored GDDs) vs `DEFERRED
  (implementation)` (AC-SN30 — design stable, blocked only on unwritten connective code; can be
  written before AC-SN22/31 unblock, not gated behind other GDDs).
- Open Q#5's D-1 reworded: inherits master GDD §15-H's "only in-world counter-signal" framing
  explicitly, rather than reading as one of three equal candidate surfaces alongside D-3/EVP.
- systems-index.md: new Open Cross-System Items entry carrying AC-SN31 + the Trust-ordering
  requirement forward to UI/HUD (#12), naming the "no measurable proxy yet" gap explicitly so
  a future HUD author can't treat AC-SN31 as already-testable.
- Ruled out of scope: Win/Lose's ending-delivery gap for the Anchor Moment (game-designer's
  fresh finding) — 4 systems downstream, not this GDD's job to track.

**Status: NEEDS REVISION resolved same session — design stable since round 1, this round was
calibration.** creative-director expects round 4 to be a clean approving pass.

**Next:** independent re-review in a fresh session — `/design-review design/gdd/scan-node-system.md`.

## Review — 2026-07-01 (round 4, final) — Verdict: APPROVED
Scope signal: S
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director (synthesis)
Blocking items: 0 | Recommended: 0 (1 tracked fast-follow, non-blocking)
Summary: All 4 specialists independently returned APPROVED — the first unanimous verdict in this
document's 4-round history. Genuine convergence, not rubber-stamping: each specialist re-derived
or spot-checked round 3's fixes against source rather than re-reading prose (systems-designer
re-ran the full formula/boundary sweep from scratch; game-designer independently opened
`gate-check`'s SKILL.md to confirm the DEFERRED table has zero tooling enforcement, exactly as
the doc claims). AC-SN29's extension confirmed to genuinely close the canonical-equality gap
with a concrete two-listener test spec. DEFERRED (design) vs (implementation) split confirmed
correctly and consistently applied to all 3 deferred ACs. No specialist disagreement to
adjudicate — round 3's game-designer/systems-designer split has no analog this round.
Prior verdict resolved: Yes — the arc's recurring defect ("assert the what, don't prove the
how" — co-location, canonical-source, AC-SN29's false proof-citation) is now genuinely closed
after 3 rounds of narrowing.

### Non-blocking items, ruled by creative-director
- **Edge Case 11** (same-frame `scan:captured` race) — behavior already fully specified in
  prose (arrival-order processing, no node dropped), only the AC is missing. Categorically
  different from round 3's finding (an unproven claim presented as proven) — this is a missing
  test for an already-correct design, not an integrity failure. Ruled: acceptable to ship
  Approved without it. **Tracked as a fast-follow test-authoring task**, not a re-review trigger.
- **Status-header staleness** — GDD header and systems-index both still read "In Review... 
  re-review pending." Fixed as part of recording this verdict (same edit as the approval).

### Legacy note — what the 4-round arc demonstrated
Scan Node is the project's most densely-connected hub (5 downstream consumers). Every round-1
blocker sat at an **inheritance boundary** with a sibling doc, not inside its own logic — the
signature failure mode of authoring a hub system in Lean mode without pressure-testing it
against neighbors. Two structural instruments carried the arc to convergence and should
generalize to the next hub doc (Orchestrator, #5):
1. **Cross-System Invariants table** (round 1) — Floor Plan's Interaction Matrix pointed
   outward: names every assumption shared with a sibling doc, who owns enforcement, what
   breaks if wrong. Its own stated limit ("naming a seam ≠ proving it's tested") is what forced
   the DEFERRED composition ACs rather than letting a row masquerade as coverage.
2. **DEFERRED-tracking table with design/implementation split** (round 3) — turned "DEFERRED"
   from an escape hatch into a tracked commitment: Owner, Resolve-when, and whether the block
   is on unwritten code (can start now) or unauthored design (genuinely gated). Paired with a
   systems-index carry-forward entry, a deferred item can no longer be silently dropped — the
   failure that hit D-1 "Auto-Typed Log" twice before this pattern existed.

Three of the four rounds were calibration, not redesign — the design underneath has been stable
since round 1. What kept re-opening was the document's fidelity as a *build contract*: whether
every guarantee it made was actually proven, owned, and carried forward. Budget future hub docs
for this same multi-round contract-hardening from the start rather than expecting a clean first
pass.

**Status: Approved.** No further review round required.
