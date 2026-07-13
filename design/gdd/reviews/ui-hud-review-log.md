# UI / HUD — Review Log

Revision history for `design/gdd/ui-hud.md`. Newest entry at top.

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
