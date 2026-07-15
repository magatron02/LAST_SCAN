# UI / HUD — Review Log

Revision history for `design/gdd/ui-hud.md`. Newest entry at top.

## Review — 2026-07-15 (round 7, independent re-review) — Verdict: NEEDS REVISION → revised same session; Approved gated on producer citation-hook
Scope signal: L (revision effort S–M)
Specialists: game-designer, systems-designer, ux-designer, ui-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 4 | Recommended: 4 | Routed-elsewhere: 5
Prior verdict resolved: **Partial — round 6's 4 blockers held, but the citation-integrity class recurred a 5th round: TWO new instances slipped through round 6's dedicated citation pass.**

**Key findings (creative-director synthesis):** "Architecture sound and unchanged since round 4 — ~4 mechanical fixes plus one clamp decision, S–M effort, identical shape to rounds 5 and 6. But two new citation-integrity instances slipped through round 6's *dedicated* citation pass — the fifth consecutive round with this class live. The controlled experiment is conclusive: manual review cannot close this class. Approved must not be granted before the producer-built mechanical citation-check hook exists. The blocker to closure is no longer *in the document* — it is the absent producer citation-hook." qa-lead independently verified AC count (60: 36 Logic + 16 Integration + 8 ADVISORY) and the 16-item Open-Q#5 blocked list — both exact.

**4 blocking items (all resolved this session):**
1. Line 195 miscites "AC-UH16–19 test pool membership" — AC-UH19 tests only tier-independent anomaly-density push, not pool membership (UH16–18 do) [ui-programmer; review-lead-verified — 6th-class citation instance]. → Fixed: repointed to "AC-UH16–18 test pool membership per tier; AC-UH19 tests tier-independent push."
2. Rule 2's "first-tick cold-start sentinel" is an undisclosed 2nd exception to the "exhaustive by construction" claim — no AC covers it, yet the summary named only the Log panel; Rule 9's analogous sentinel *did* get AC-UH52's zero-prior-fires branch the same round [qa-lead — 5th-class citation instance]. → Fixed: exhaustiveness summary now names both disclosed exceptions and contrasts with Rule 9's AC-covered analogue.
3. AC-UH59's "no grid break at any A-V2" is false — it proves *ratio* invariance (trivial at any A-V2), but Rule 4's ceiling is *absolute* size (~1.75× base); accessibility-requirements.md documents A-V2 as a floor-only spec (≥1.5×, no ceiling), so in-spec A-V2=3× → coverage at 5.25× base, never grid-validated [systems-designer HIGH]. → Fixed: UI Requirements now separates ratio-break (uniform application) from absolute-break (new absolute font-size/container clamp, this-GDD-authorable); A-V2 ceiling routed to accessibility-requirements.md; AC-UH59 extended to 2 parts; "order fixed" corrected to "uniform application" (commutative).
4. Rule 10's "readable frame / reaction-fairness floor / telegraphed" overclaims a perceptual guarantee 16.6ms cannot deliver, and contradicts §B's "cumulative… only in hindsight" anchor [game-designer + ux-designer, converged from different angles]. → Fixed: reworded throughout (Rule 10 body, accessibility note, AC-UH58, AC-count preamble, Open Q#9) to "input-lockout / race-condition guarantee" — mechanical claim (no Movement Violation on the reattach frame) kept; perceptibility reopened for /ux-design.

**Secondary fix applied:** Coverage Validation Rule 9 row now credits AC-UH54 (was credited only via Rule 10's row) [qa-lead].

**Recommended NOT applied (deferred/routed):** commit "shape" channel to ≥1 alert (AC-UH44 uses identical text+position across all alerts) [ux-designer]; tag AC-UH52's 150–400ms range PROVISIONAL alongside UH47/48 (floor rationale leans on unauthored sting envelope) [audio-director]; UH42/UH46 blocking-split inconsistency [qa-lead]; Infinity boundary in AC-UH49 [systems-designer].

**Routed elsewhere (not this-GDD blockers):** Rule 9 microtask ordering needs a formal Orchestrator synchronous-dispatch contract + a multi-handler-chain test — no AC currently gates the deferred timing [ui-programmer HIGH] → Open Q#4 ADR / Orchestrator owner; interaction-patterns.md P-DOLLHOUSE "walk while open" contradiction still live (ux-designer verified against file) → FPS Movement / Open Q#9; jsdom cheaper-path — several blocked Integration ACs (esp. AC-UH50, which already permits a spied DOM-write path needing no DOM; AC-UH02; AC-UH42) may be testable without jsdom via a DOM-adapter + spies → surface at architecture phase [ui-programmer]; unauthored escalating drone → producer-tracked blocker gating Audio GDD #6 kickoff [audio-director, position hardened]; **producer mechanical citation-check hook — the actual gate to Approved** [creative-director, routed since round 3].

**Specialist disagreements (adjudicated by creative-director):** audio-director rated authority-split overreach + circular debounce BLOCKING; CD held as recommended/owner-is-Audio-GDD-#6 (no new evidence; timbres already provisional, UH47/48 already PROVISIONAL) — only the cheap UH52-PROVISIONAL tag worth applying. ux-designer floated extending the reattach grace to 300–500ms; CD declined (that's /ux-design tuning) but upheld the *language* reword as blocking.

**AC count:** 60 → 60 (36 BLOCKING Logic + 16 BLOCKING Integration + 8 ADVISORY). No new AC — AC-UH59 extended in place to two parts (ratio invariance + absolute clamp); AC-UH58 reworded (input-lockout framing, tag unchanged).

**Next:** The doc-side fixes are done and repeatable manual review has now demonstrably failed to close the citation class 5 rounds running. Per CD, **do not run a round-8 manual citation pass and do not mark Approved** until the **producer** builds the mechanical citation-check enforcement hook (routed since round 3). Other outside owners still pending: **producer** (Open Q#5 jsdom/harness decision), **FPS Movement** (Open Q#9 suspension + delayed-resume + interaction-patterns.md meta-pattern reconciliation), **Audio GDD #6 owner** (drone commitment underpinning flat-sting). Then the `/gate-check pre-production` re-attempt.

## Review — 2026-07-13 (round 6, independent re-review) — Verdict: NEEDS REVISION → revised same session; round-7 independent re-review pending
Scope signal: L (revision effort S–M)
Specialists: game-designer, systems-designer, ux-designer, ui-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 4 | Recommended: 2 applied | Routed-elsewhere: 4
Prior verdict resolved: **Partial — round 5's 8 blockers held, but the citation-integrity defect class recurred a 4th time** (2 live instances found by the round-5-requested mechanical citation check).

**Key findings (creative-director synthesis):** "Architecture remains sound and salvageable, unchanged since round 4. The doc is ~5 mechanical fixes + 1 design decision from author-complete. But the round-5 promise — citation-integrity 'finally driven out' — failed; two live instances remain after four rounds each targeting this exact class. That is a controlled experiment with an unambiguous result: **human review cannot close this class.** The producer enforcement-hook ask (routed since round 3) is no longer optional — it is the actual blocker to closure. No round 7 manual citation pass."

**4 blocking items (all resolved this session):**
1. AC-UH52 cited (twice) for the `-Infinity`-not-`0` cold-start sentinel, but its GIVEN only staged "a sting fired on tick T" — zero-prior-fires never an input; the sentinel choice was unverified by any AC [systems-designer, qa-lead — CONFIRMED citation-integrity defect]. → Fixed: added a zero-prior-fires GIVEN branch (mock clock at 0 → first sting fires) to AC-UH52.
2. Rule 2 line 139 forced-write-on-reattach paragraph cited AC-UH50 (continuous polling, never detach→reattach); AC-UH55 is the AC for that scenario — a leftover citation from before UH55 existed (round 4) [qa-lead — 2nd live citation-integrity instance]. → Fixed: repointed to AC-UH55.
3. AC-UH58 (reattach fairness floor) calcified as ADVISORY placeholder deferred to unwritten /ux-design across 2 rounds; Rule 10 ships a fully-specified zero-warning trap with no fairness valve [game-designer SEVERE; ux-designer, audio-director concur via different symptoms]. → **User decision: fix the floor now (no-Movement-Violation-on-reattach-frame).** Implemented as a one-tick reattach-grace sub-state (locomotion-resume withheld for the forced-write frame); AC-UH58 upgraded **ADVISORY → BLOCKING (Logic)**; Rule 10 rewritten from deferred-intent to mechanically-enforced floor.
4. `coverage_dominance_ratio` never checked against A-V2 (independent ≥1.5× text scaling the doc owes an AC for); two 1.5×-class multipliers could stack to 2.625× and breach Rule 4's grid ceiling [systems-designer HIGH]. → Fixed: UI Requirements inherits A-V2 + pins composition (ratio first, A-V2 uniform → ratio invariant); new BLOCKING **AC-UH59**.

**Recommended applied (2):** Rule 2 first-tick cold-start sentinel (mirrors Rule 9's -Infinity) [ui-programmer]; ADJACENT-no-sting table row cross-refs BLOCKING AC-UH57 not just ADVISORY AC-UH48 [qa-lead].

**Routed elsewhere (tracked in doc, NOT this-GDD blockers):** Rule 9 microtask seam assumes end-to-end synchronous Orchestrator bus delivery never actually promised — fold into Open Q#4 ADR / Orchestrator owner [ui-programmer HIGH]; flat-sting strategy voided by its own fallback if Audio GDD #6 declines the drone (structural, not cosmetic) — producer/Audio [audio-director]; Open Q#5 enforcement hook + jsdom decision — producer (since round 3); Open Q#9 now also covers reattach-resume timing + the meta-pattern (Consistency Rule 2) reconciliation in interaction-patterns.md — FPS Movement owner + pattern-library update [ux-designer].

**Specialist disagreements (adjudicated by creative-director):** audio-director rated flat-sting "Highest/blocking" vs CD upholding round-5 "recommended" (owner is Audio GDD #6, not this doc). Rule 10 severity — game-designer SEVERE (missing floor) is the one non-routable design call; CD sided with fixing it now.

**AC count:** 59 → 60 (36 BLOCKING Logic + 16 BLOCKING Integration + 8 ADVISORY). New: **AC-UH59** (BLOCKING Logic — dominance-ratio × A-V2 composition). Upgraded: **AC-UH58** (ADVISORY → BLOCKING Logic).

**Next:** Round-7 independent re-review in a fresh session (`/clear` → `/design-review design/gdd/ui-hud.md`). ⚠ Per CD: a manual round-7 will likely catch defects but **cannot guarantee closure of the citation-integrity class** — the real gate is the **producer** building a mechanical citation-check enforcement hook (routed since round 3). Approved should not be granted until that hook exists. Outside owners still pending: **producer** (Open Q#5 hook + jsdom), **FPS Movement** (Open Q#9 suspension + delayed-resume + interaction-patterns.md meta-pattern update), **Audio GDD #6 owner** (drone commitment underpinning flat-sting). Then the `/gate-check pre-production` re-attempt.

## Review — 2026-07-13 (round 5, independent re-review) — Verdict: NEEDS REVISION → revised same session; round-6 independent re-review pending
Scope signal: L
Specialists: game-designer, systems-designer, ux-designer, ui-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 8 | Recommended: 10
Prior verdict resolved: **Partial — none of round 4's 3 closures came back fully clean.** Rule 2 comparator (mechanically solid, but fix was prose-only — ACs never staged fresh-alloc); forced-write-on-reattach AC-UH55 (present but experientially uncertified); Rule 10 rewrite (premise closed vs AC-WL08, but *relocated* the fantasy problem and spawned new blockers).

**Key findings (creative-director synthesis):** "The core architecture is sound and salvageable; the problems are bounded and fixable. But three of three closures are incomplete and the confirmation round surfaced new blockers." Most damaging: the **recurring citation-integrity defect class** (prose citing an AC that never stages its scenario — the exact class round 4 was convened to eliminate) reappeared undetected in AC-UH48/UH50/UH55 → calls for a *mechanical* citation check, not another human pass.

**8 blocking items (all resolved this session):**
1. AC-UH48 cited BLOCKING AC-UH29 for ADJACENT audio-suppression, but UH29 stages only SEALED-same-tick — ADJACENT suppression had NO blocking coverage [qa-lead]. → Fixed: new BLOCKING **AC-UH57** (ADJACENT suppression in isolation, no SEALED); AC-UH48 cross-ref corrected.
2. AC-UH50/UH55 GIVENs never staged a freshly-allocated distinct-reference equal-value object — Rule 2's round-4 comparator fix lived in prose only; a same-reference fixture passes under naive === [qa-lead]. → Fixed: both GIVENs rewritten to mandate fresh-alloc/distinct-reference.
3. AC-UH02 asserted render-tree removal but lacked the Open Q#5 marker, breaking the "exhaustive by construction" claim [qa-lead]. → Fixed: marked ⚠ blocked on Open Q#5; blocked-list 15→16, tallies updated.
4. AC-UH12 prescribed a screenshot to verify computed-style facts (color/font-weight/transform) a raster capture cannot distinguish from transform:scale() [qa-lead]. → Fixed: requires recorded getComputedStyle() values; screenshot reduced to the perceptual read only.
5. P-DOLLHOUSE contradiction — interaction-patterns.md (live locomotion) vs Rule 10 (stationary); AC-UH45 over-claimed conformance [ux-designer]. → **User decision: fix in this GDD only.** AC-UH45 checkpoint (3) scoped to world-simulation continuity + explicit known-gap note; Open Q#9 upgraded to flag the standing pattern-library contradiction requiring a coordinated interaction-patterns.md update.
6. Rule 10 blackout zeroes all UI channels regardless of the reduced-distortion toggle → AC-UH44 passes *vacuously*, a real accessibility regression it was built to catch [ux-designer]. → Fixed: Rule 10 accessibility note now states the reduced-distortion asymmetry explicitly.
7. Open Q#5 test-harness: 16/59 BLOCKING Integration ACs have no legal test path; a story can be coded and stall at Done-time; no enforcement hook [ui-programmer, qa-lead]. → Doc-side made exhaustive; **enforcement hook remains routed to producer** (tooling, outside this GDD — open since round 3).
8. Rule 10 trap-on-close contradicts the Player Fantasy's own "cumulative… only in hindsight" anchor; the sole fairness valve requires trusting error-text the game trains players to discount [game-designer, ux-designer, audio-director]. → **User decision: soften prose + add fairness AC.** "Map is not where the danger is" downgraded to design intent; added open-fairness-question paragraph + ADVISORY **AC-UH58** (reattach reaction-budget floor, tuned by the deferred /ux-design dollhouse spec).

**Recommended fixes applied (3 of 10):** Rule 2 dirty-check object rule given a key-set/key-count invariant (was asymmetric with the array "lengths match" guard) [systems-designer]; debounce cold-start sentinel pinned to -Infinity/never-0 (a 0 init vs a 0-start mock clock wrongly suppresses the session's first sting) [systems-designer]; Rule 2 "(perf contract)" given an explicit cost-bound paragraph (small/bounded view models only; no per-point structure through the per-tick deep compare) [ui-programmer].

**Recommended, NOT applied (routed/deferred):** error_sting_min_interval_ms safe-range rests on a self-admitted placeholder sting envelope — audio-director wants it re-tagged PROVISIONAL or re-justified on anti-flood grounds; Rule 9 flat-sting stated as fact yet voided by its own fallback clause [audio-director]; coverage_dominance_ratio compounds on A-V2's ≥1.5× text scaling (~2.6× base), untested [ux-designer]; focus-state-on-detach A-M1 gap (deferred since 2026-07-10, still unpicked) [ui-programmer]; Vitest microtask-flush guidance missing from Testability section [ui-programmer]; Open Q#5 enforcement hook + coverage_dominance_ratio single-channel thinness.

**Specialist disagreements (adjudicated by creative-director):** Rule 2 "perf contract" severity — ui-programmer BLOCKING vs creative-director RECOMMENDED (ship-as-tracked; a cost-bound paragraph was added regardless). Rule 10 settledness — game-designer/ux-designer/audio-director "not settled" vs systems-designer's narrow math-only confirmation; CD sided with the majority (not settled → design-blocking, resolved via soften+AC-UH58). error_sting tag — audio-director PROVISIONAL vs the doc's BLOCKING; CD folded to recommended (left as-is this round).

**AC count:** 57 → 59 (34 BLOCKING Logic + 16 BLOCKING Integration + 9 ADVISORY). New: **AC-UH57** (BLOCKING Logic), **AC-UH58** (ADVISORY).

**Next:** Round-6 independent re-review in a fresh session (`/clear` → `/design-review design/gdd/ui-hud.md`) to confirm the 8 blockers are closed — with particular attention to whether the citation-integrity defect is finally driven out (grep every "covered by AC-X" against what X actually stages). Two items need outside owners before Approved: **producer** (Open Q#5 enforcement hook + jsdom allowed-libraries decision) and **FPS Movement's owner** (Open Q#9 locomotion-suspension ratification + coordinated interaction-patterns.md update). Then the `/gate-check pre-production` re-attempt.

## Review — 2026-07-12 (round 4, independent re-review) — Verdict: NEEDS REVISION → revised same session; round-5 independent re-review pending
Scope signal: L
Specialists: game-designer, systems-designer, ux-designer, ui-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 3 | Recommended: 7
Prior verdict resolved: **Yes — all 4 round-3 blockers confirmed genuinely closed (independent confirmation, no relabeling).**

**Key findings (creative-director synthesis):** "Three genuine blockers, all seam-level, no
redesign." Breaks the Floor Plan / Scan Node / Orchestrator clean-on-round-4 pattern by one pass —
expected, since round 3's late additions (Rules 10/53/54) and never-cross-checked sibling shapes
are where all three blockers live. Tag arithmetic independently verified.

**3 blocking items (all resolved this session):**
1. Rule 2's "shallow per-field" comparator was one level too shallow for Scan Node's *locked* VM
   shape (nested `displayPosition`, `nodesCompleted {X,Y}`) — a literal implementation defeats
   AC-UH50 every tick, guaranteed not hypothetical [ui-programmer]. → Fixed: structural deep
   comparison over rendered fields; arrays "lengths match AND pairwise equal"; scalars by
   SameValueZero (NaN-safe, folding in systems-designer's === trap); UI-local fix per round-3
   precedent, no sibling amendment.
2. Rule 2's forced-write-on-re-attach clause was claimed covered by AC-UH50, which never stages
   detach→re-attach→value-identical — 4th confirmed instance of the project's "prose cites an AC
   that never stages the scenario" defect class [qa-lead]. → Fixed: new BLOCKING **AC-UH55**.
3. Rule 10's "total awareness trade" rested on an unverified premise: Win/Lose AC-WL08 requires a
   `player:position` delta, so a stationary player cannot trigger Movement Violation and no scan
   can run mid-modal — as written the dollhouse was a free safe-harbor, not a trade
   [game-designer]; and AC-UH54's "no audio channel survives" exceeded UI authority (the ambient
   drone is Audio-owned) [audio-director]. → **User re-decision (new evidence rule): chose
   safe-while-open, trap-on-close.** Rule 10 rewritten: blackout scoped to UI-owned channels; the
   *setup* of danger persists (approach + dwell); danger lands on close (first blind step can be
   instant Movement Violation); A-A1/A-S1 "vacuous compliance" replaced with *authored
   unclassified risk* routed to /ux-design; locomotion suspension flagged to FPS Movement as new
   **Open Q#9** (its GDD defines no dollhouse state today).

**Recommended fixes applied (7):** debounce timestamp written only on actual fire (burst-mute
inversion); Orchestrator AC-OR08 cross-link — end-of-tick evaluation must defer past the
synchronous queued-event drain (microtask), pinned for the Open Q#4 ADR; A-A1/A-S1
reclassification (folded into blocker 3); Open Q#5 flag consistency — UH15, UH22–26, UH35 now
marked, blocked list 7 → **15**, exhaustive-by-construction note added; AC-UH12 item 2 rewritten
as computed-style checks + new BLOCKING **AC-UH56** (replace-not-stack, Logic-testable);
dominance-ratio backfire fallback pre-registered (ratio→1.0 + non-size channel, Scan Node's owner
decides); drone fallback clause — no Audio commitment voids the flat-sting strategy, defaults to
graduated sting; debounce floor tagged for re-validation against the real sting envelope.

**Specialist disagreements (adjudicated by creative-director):** audio-director (Open Q#6 should
gate this GDD, escalated harder than round 3) vs creative-director (upheld round 3: pipeline-scope,
but accepted the AC-UH54 authority-overclaim sub-point into blocker 3 and the fallback clause);
ux-designer (UH41/44/45 → BLOCKING) vs creative-director (upheld ADVISORY per coding-standards
evidence table; retag already routed to ride Open Q#5's harness); game-designer's Rule 10 attack
vs the round-3 user decision — ruled genuine *new evidence*, user re-decided (see blocker 3).

**AC count:** 55 → 57 (33 BLOCKING Logic + 16 BLOCKING Integration + 8 ADVISORY). New: UH55, UH56.

**Next:** Round-5 independent re-review in a fresh session (`/clear` →
`/design-review design/gdd/ui-hud.md`) to confirm the 3 blockers are closed. FPS Movement's owner
must also ratify Open Q#9 (locomotion suspension during `DOLLHOUSE_OPEN`) — a one-line amendment
to fps-movement.md, reviewable in the same session. Then the `/gate-check pre-production`
re-attempt.

## Review — 2026-07-12 (round 3, independent re-review) — Verdict: NEEDS REVISION → revised same session; round-4 independent re-review pending
Scope signal: L
Specialists: game-designer, systems-designer, ux-designer, ui-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 4 | Recommended: 12
Prior verdict resolved: **Yes — qa-lead confirmed all 4 round-2 blockers genuinely closed (no relabeling this round).**

**Key findings (creative-director synthesis):** Converged as predicted — round-2 fixes held; what
remained was four seam-level defects, none a redesign. "Four blockers, zero redesign. One focused
pass from Approved."

**4 blocking items (all resolved this session):**
1. Rule 4 × Rule 8 terminal-screen collision: no carve-out meant the 1.5× dominance ratio applied
   on the ending screen, contradicting Win/Lose's "same neutral voice." → Fixed: Rule 4 scoped to
   `HUD_ACTIVE` only; `TERMINAL` renders both numbers at base size; new BLOCKING **AC-UH53**.
2. Debounce clock-source contradiction: `error_sting_min_interval_ms` was "wall-clock" + AC-UH52
   needed a mock clock, but the GDD elsewhere disclaims any time source. → Fixed: Rule 9 names an
   **injected monotonic wall-clock source** (`performance.now()` prod / mock in tests) — audio
   trigger-timing, not game-clock; Open Q#7 unaffected. Boundary pinned (< suppresses, ≥ fires).
3. Rule 2's "referential or shallow equality" silently defeated AC-UH50 if pure getters rebuild
   arrays per call. → Fixed: **value comparison over rendered fields** (per-element shallow for
   arrays); no referential-stability assumption; user chose UI-local fix over amending the two
   Approved sibling GDDs.
4. No stated perceivable danger channel during `DOLLHOUSE_OPEN` (HUD detached, dollhouse VM
   forbidden from carrying entity signal, audio unstated — potential A-A1 violation). → Fixed
   (user decision: total trade): new **Core Rule 10** — no visual or audio danger signal while
   open, sting suppressed with no retroactive fire, bookkeeping continues, A-A1/A-S1 vacuously
   satisfied identically for hearing/non-hearing players; new BLOCKING **AC-UH54**.

**Recommended fixes applied (5):** AC-UH52 boundary aligned with Rule 9 prose; NaN/non-numeric
config fallback-to-default (+AC-UH49 extension); AC-UH19b N=1 vacuous-clause exclusion; ratio
playtest comprehension check upgraded to a **required gate** + AC-SN31 "emphasis reads as
manipulation" backfire hypothesis escalated to Scan Node's owner; flat-sting *strategy* tagged
provisional for Audio GDD #6 + 200ms-debounce burst-cue forward dependency noted in the authority
split.

**Routed elsewhere (not GDD edits):** Open Q#5 "no silent downgrade" needs an enforcement hook in
`/gate-check`/`/story-readiness` tooling [qa-lead, S2-Major]; UH41/UH44 objective sub-claims retag
to BLOCKING rides Open Q#5's harness approval [ux-designer]; unauthored escalating drone (Open Q#6)
severity raised — audio-director argues it should be a hard prerequisite like Open Q#5 (zero
FAR→NEAR audio escalation exists anywhere; the ADJACENT silence-drop lands on nothing) — routed to
producer. Rendering-approach ADR gap (raw DOM + manual dirty-check uncommitted) → broaden Open Q#4
at architecture phase [ui-programmer].

**Specialist disagreements surfaced:** audio-director (Open Q#6 BLOCKING) vs creative-director
(pipeline-blocking, not this-GDD-blocking); game-designer (dominance-ratio mechanism "designed
backwards") vs creative-director (AC-SN31 is Scan Node's to answer; UI/HUD owes only the playtest
gate); qa-lead (CONCERNS, no new blockers) vs the three specialists with blocking items — reconciled
to NEEDS REVISION.

**AC count:** 53 → 55 (32 BLOCKING Logic + 15 BLOCKING Integration + 8 ADVISORY). New: UH53, UH54.

**Next:** Round-4 independent re-review in a fresh session (`/clear` →
`/design-review design/gdd/ui-hud.md`) to confirm the 4 blockers are closed — matching the
round-4-approval pattern of Floor Plan, Scan Node, and Orchestrator — then the
`/gate-check pre-production` re-attempt.

## Review — 2026-07-10 (re-review of the same-day revision) — Verdict: NEEDS REVISION → revised same session; independent re-review pending
Scope signal: M
Specialists: game-designer, systems-designer, ux-designer, ui-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 4 | Recommended: 14
Prior verdict resolved: Partial — 3 of the prior round's 4 blockers held; the 4th ("orphaned flicker") was found to have been *relabeled* not resolved.

**Key findings (creative-director synthesis):** Tightened considerably since round one; three prior
blockers genuinely closed, but the fourth (orphaned flicker) was closed incompletely and spawned a
sibling contradiction. All new issues seam-level, not a redesign.

**4 blocking items (all resolved this session):**
1. Error-bar visual channel: AC-UH42 measured a flash-rate ceiling against a "flash" no Core Rule
   defined (prior blocker #4 relabeled the orphan, didn't anchor it); AC-UH44 credited UI/HUD with a
   "distortion" channel AC-UH42 disclaims owning; under A-V3's reduced-distortion toggle proximity
   escalation collapsed to text-only (A-S1 violation). → Fixed: **flash removed** (error bar =
   discrete text replacement, Rule 6); AC-UH42 rewritten as objective "no animation" DOM/CSS
   assertion (ADVISORY→BLOCKING Integration); AC-UH44 committed pairs redrawn from the
   reduced-distortion-safe set {shape,position,text}, proximity escalation → **text+position**,
   distortion demoted to additional/non-counted; A-V3 rescoped vacuous for this system.
2. Orchestrator OQ8 (`session:tick` vs `renderer.render()` ordering) never addressed, though OQ8
   names UI/HUD as a candidate first-`session:tick`-visual GDD that must pin tick-before-render or
   accept a one-frame lag. → Fixed: declared UI/HUD consumes `session:tick` as **boundary only**,
   drives no visual off `elapsedSeconds` → OQ8 trigger not met (new Open Q#7); `session:tick` added
   to both dependency tables.
3. Rule 9 dedup only prevented same-16.6ms-tick sting collisions, but stings are 100–200ms so
   near-tick events still stacked. → Fixed: **cross-tick debounce** — new knob
   `error_sting_min_interval_ms` (200ms; 150–400ms) + new BLOCKING AC-UH52.
4. Same-tick toggle+SEALED race asserted in prose but cited ACs (UH32/UH35) didn't stage
   simultaneity. → Fixed: new BLOCKING **AC-UH51** stages both in one tick.

**Recommended fixes applied (9 of 14):** `session:tick` in Interactions+Dependencies tables;
detach/re-attach dirty-check cache invalidation (AC-UH50); `coverage_dominance_ratio` marked
unvalidated-pending-playtest; "shutter"→relay-click/solenoid-snap (§13 collision);
inline "⚠ blocked on Open Q#5" markers on all 7 render-output Integration ACs + unwritable-ACs
callout; Orchestrator OQ9(a) DI cross-ref (Open Q#8); escalation-drone cross-doc pipeline gap
flagged to producer (Open Q#6); AC-UH47/48 forcing-function obligation on the future Audio GDD.

**Deferred recommended (5):** Rule 6 pool minimum-size; amend `accessibility-requirements.md` A-V3
scope at source; detach focus save/restore (A-M1); retag AC-UH46/UH41 objective sub-claims to
BLOCKING; strip numeric specificity from audio placeholders / flag Rule 8 anticlimax to terminal UX
spec / own arc-authorship framing.

**AC count:** 51 → 53 (30 BLOCKING Logic + 15 BLOCKING Integration + 8 ADVISORY). New: UH51, UH52;
UH42 retagged ADVISORY→Integration.

**Next:** Independent re-review in a fresh session (`/clear` → `/design-review design/gdd/ui-hud.md`)
to confirm the 4 blockers are closed, before the `/gate-check pre-production` re-attempt.

## Review — 2026-07-10 — Verdict: NEEDS REVISION (revised same session; re-review pending)
Scope signal: L
Specialists: game-designer, systems-designer, ux-designer, ui-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 4 | Recommended: 8
Prior verdict resolved: First review

**Key findings (creative-director synthesis):** A strong aggregation document that overreached at its
seams — locking decisions (audio character, terminal copy) belonging to systems not yet designed, and
asserting a formula rationale and a fantasy arc its own static mechanics don't produce. Not a redesign;
one focused revision pass from Approved. Verdict was NEEDS REVISION, not MAJOR.

**4 blocking items (all resolved this session):**
1. `coverage_dominance_ratio` rationale mathematically incoherent with its own formula (ratio only
   grows coverage, can't shrink nodesCompleted) + unguarded pathological inputs (0/negative/1.0).
   → Fixed: Definition row added; upper-bound rationale reframed to "coverage too dominant / breaks
   shared grid"; out-of-range clamp-at-load + new AC-UH49.
2. "Tick" never formally defined, making Rule 9 dedup + SEALED-precedence (AC-UH27/29) unimplementable.
   → Fixed: tick = one Orchestrator `session:tick`; mandatory end-of-tick deferred audio evaluation.
3. Audio-architecture ACs locked before the Audio System GDD exists (Vertical Delegation), and the
   flat error sting fired at ADJACENT which §13 defines as near-silence.
   → Fixed: sting suppressed at ADJACENT (AC-UH48); authority split — trigger logic UI-owned/BLOCKING
   (AC-UH27–29), cue character deferred ADVISORY–PROVISIONAL to Audio System GDD (AC-UH47/UH48).
4. Orphaned "proximity-tier flicker" referenced by AC-UH42 but defined by no Core Rule.
   → Fixed: AC-UH42 rescoped to UI-owned error-bar alert flash + ≤3 flashes/s restated inline;
   proximity flicker attributed to Point Cloud Renderer (ADR-0002(e), its own A-V3 obligation).

**8 recommended fixes applied:** Player-Fantasy authorship reframe; terminal copy-strings deferral +
register-identity constraint (AC-UH23/24 → objective identical-template assertion, protects Win/Lose
"same voice"); Rule 2 polling overclaim corrected + dirty-check (AC-UH50); message-selection
anti-repetition (AC-UH19b); error-bar replace-not-stack discipline (bounds anomaly-burst flooding);
input-gating seam (Rule 7); detach-and-cache DOM occlusion (Rule 1, closes Open Q#3); AC retags
(UH01/03/04); AC-UH33 closed-set enumeration; AC-UH41/44/45 committed concrete accessibility channels.

**AC count:** 48 → 51 (28 BLOCKING Logic + 14 BLOCKING Integration + 9 ADVISORY; UH47/UH48
ADVISORY–PROVISIONAL). New: UH19b, UH49, UH50.

**Open items carried forward:** Open Q#5 (jsdom/Testing Library not on allowed-libraries list — needs
approval before render-output Integration ACs can be written); Open Q#6 (audio cue character pending
Audio System GDD). Both are pre-production/architecture-phase decisions, not GDD-authoring gaps.

**Next:** Independent re-review in a fresh session (`/clear` → `/design-review design/gdd/ui-hud.md`)
to confirm the 4 blockers are closed, before the `/gate-check pre-production` re-attempt.
