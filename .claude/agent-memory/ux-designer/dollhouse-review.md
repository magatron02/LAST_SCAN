---
name: dollhouse-review
description: Adversarial UX critique of Floor Plan System GDD dollhouse map — 12 issues found 2026-06-27 (5 BLOCKING); re-reviewed 2026-06-30 (2 resolved + 2 new findings); re-reviewed again same-day round 4 (access paradigm partially resolved, Interaction Matrix gap found)
metadata:
  type: project
---

Full adversarial review of design/gdd/floor-plan-system.md dollhouse map UX. Cross-referenced against scan-node-system.md and LAST_SCAN_GDD.md.

## STATUS UPDATE (round 4, independent re-review, 2026-06-30 — same day as round 3)

Re-reviewed against GDD "Last Updated: 2026-06-30" after round 3 locked the dollhouse
access paradigm to **toggle key** at GDD level (UI Requirements line ~540-548) per my
round-3 argument that it was mechanically load-bearing. Judged that resolution on its
merits rather than taking "now present" as "now resolved":

**Issue 2 (access paradigm) reclassified: fully-open → partially resolved.** The toggle-key
bullet is a genuine improvement — correctly states the rationale (divided attention, not
input friction) and correctly rejects persistent-overlay/tab-menu paradigms. But it relocates
rather than fully closes the ambiguity. Three unaddressed gaps, none covered elsewhere in the
doc:
- Whether the panel is fullscreen-blocking or a partial overlay the player can still see the
  room through — the bullet's own "divided attention" rationale depends on this and it's never
  stated. A corner picture-in-picture dollhouse would satisfy the letter of "toggle key" while
  defeating the stated intent.
- Movement is explicitly NOT locked while the panel is open ("dollhouse-open does not lock
  movement," line ~544) — that part IS specified, correcting my own assumption it'd be a gap.
  But if the panel also blocks view (per above, unstated), the player would be navigating
  blind, which is a materially different and riskier pattern than implied by the SCAN_LOCKED
  analogy the bullet itself invokes, and the doc doesn't say why dollhouse-open diverges from
  the SCAN_LOCKED precedent it cites.
- **Entity-proximity-while-panel-open has zero rule anywhere** — not in UI Requirements, not
  in Edge Cases, not in the new Interaction Matrix (Detailed Design, lines 221-241). This is
  the single highest-stakes case the divided-attention tension exists to create, and the
  Interaction Matrix — built this same round specifically to stop this exact class of
  rule-interaction gap — doesn't have a row for it despite its own stated charter ("extend it
  when a new load-bearing state is added," line 226-228).

**Process finding, not just content finding:** the dollhouse-open state was introduced in the
same revision pass as the Interaction Matrix but wasn't run through it. Worth flagging to
creative-director/systems-designer as a process gap, not just a content gap, since the Matrix
is supposed to be the structural fix for exactly this failure mode.

**Issue 5 (room-vs-node freshness granularity)** — logic half got materially stronger (new
AC-C08, line 642, directly covers the 3-of-4-stale-room case). Visual half (does a
partially-stale room look different from a fully-stale room) still unconstrained. Net: more
solid, still open.

**No regressions found.** Issues 6/10 (KNOWN_STALE/CURRENT visual diff), 12/12+92% dissonance
diegetic treatment, estimate-vs-real marker visuals: all unchanged from the 2026-06-30 (round
3) status below.

**New finding (round 4):** the SCAN_LOCKED analogy at UI Requirements line 544 invokes a
precedent ("vulnerable state pattern") and then immediately diverges from it (movement stays
unlocked) without stating why. Likely to be re-flagged by a future reviewer or the UI
programmer as an unexplained asymmetry unless a rationale line is added.

**Recommendation:** keep toggle-key as the access paradigm — correct decision, don't revert.
Add one more constraint (UI Requirements bullet or Interaction Matrix row) pinning down panel
occlusion + entity-proximity-while-open before treating Issue 2 as fully closed.

---

## STATUS UPDATE (round 3, independent re-review, 2026-06-30)

Re-reviewed against the GDD as of "Last Updated: 2026-06-28" (UI Requirements ~line 456-501,
AC-E10 line 708). Verdict: **2 of 12 original issues resolved, rest still open, plus 2 new
findings.** Use this status table, not the original issue list below, as the current source
of truth for what `/ux-design` on `design/ux/dollhouse.md` needs to inherit.

**Resolved:**
- Issue 4 (loop teleport marker behavior) — now AC-E09: marker stays lagged through a loop,
  doesn't jump/snap. Concrete and testable.
- Position-marker-in-unmapped-room (was an open question, not numbered) — now AC-E10: marker
  hidden entirely, never fabricated. Clean, testable, no notes.

**Narrowed but NOT resolved — flagged as a requirement but not actually specified:**
- "Map is lying not bugged" priming (UI Requirements ~line 482-486) — GDD now requires a
  diegetic frame exist (e.g. a `SPATIAL DATA: CACHED` label) but specifies no timing/
  persistence/re-trigger rule. A single one-time boot-log line would technically satisfy the
  letter of this requirement while almost certainly failing its purpose (player needs the
  diegetic frame active *at the moment* desync becomes perceptible, often 10+ min later, not
  just at t=0). `/ux-design` must pin down persistence, not just visual style.

**Still fully open (original issues 2, 5, 6, 9 partial, 10, plus the cross-GDD items):**
- Issue 2 (access paradigm: tab/overlay/toggle) — still entirely unspecified in UI
  Requirements. This is mechanically load-bearing (changes how often desync is witnessed,
  changes the felt pacing of Formula 2's desync_delay), not a cosmetic deferral — should be
  constrained in the GDD itself, not left wholly to the UX spec.
- Issue 6/10 (KNOWN_STALE vs KNOWN_CURRENT visual differentiation) — zero constraint, and
  notably did NOT get the non-colour-channel requirement that the coverage ring did (Issue 9
  only partially resolved — coverage ring got a non-colour requirement, the freshness mask did
  not, despite the freshness mask being the more load-bearing diegetic signal).
- Issue 5 (room-vs-node freshness granularity bridge) — Core Rule 6 now defines the logical
  derivation (room is STALE while any child node is stale) but the *visual* consequence (does
  a 3-of-4-stale room look different from a 4-of-4-stale room) is still unconstrained.
- 12/12 + 92% dissonance diegetic treatment — still punted to an unauthored HUD GDD,
  `creative-director` still not consulted (Lean mode note persists in the doc, line 62).
- Estimate-vs-real marker visual treatment (Issue 1) — AC-C07 now defines the *logic*
  (marker stays at estimate, doesn't snap) but visuals remain unconstrained, appropriately
  deferred per se but worth re-checking when dollhouse.md is drafted.

**New findings (not in the original 2026-06-27 review):**
- No accessible fallback for players who cannot reliably perceive slow continuous
  position-marker drift over a 25s (D_max) window. The marker is deliberately
  linear-interpolated (AC-E09) specifically so there's no discrete jump to notice — by design
  this is smooth, low-amplitude, continuous. For low-vision/attention-limited/vestibular-
  sensitive players this is functionally invisible, and unlike the colour-blind coverage-ring
  case, no fallback signal (discrete event, corroborating timestamp, etc.) is proposed anywhere.
- `[?]` LOCKED-room placeholders are visible on the dollhouse from session start (UI
  Requirements line 465), i.e. during the Player Fantasy's "gift"/competence-building opening
  phase, with no spec for whether they read as "normal building feature" (closet, expected) or
  "map gap" (premature wrongness signal). Risks undercutting the trust-building opening before
  any horror mechanic has engaged.
- Three overlapping status vocabularies a first-time player must parse: Scan Node's per-node
  scan status (UNSCANNED/SCANNING/VALID/INVALID), Floor Plan's per-node freshness
  (KNOWN_STALE/KNOWN_CURRENT), and Floor Plan's derived room-level freshness — shown across two
  UI surfaces (sidebar list + dollhouse) with no stated visual relationship/hierarchy between
  them.

**Why:** Confirms the GDD's "resolved" claims should be checked individually, not taken at
face value from the review log — narrowing scope ("requirement exists") is not the same as
closing a gap ("requirement is specified enough to build"). Round 4 reinforces this further:
even a change I personally argued for and got (GDD-level lock on access paradigm) needed the
same skeptical re-check rather than being accepted on arrival — "present and reasoned" is not
the same bar as "interaction-complete."
**How to apply:** When `/ux-design` authors `design/ux/dollhouse.md`, use the round 4 status
table above (supersedes round 3) as the live checklist. The original issue list below is kept
for historical detail on issues still marked open.

## BLOCKING — Design Gaps Requiring Resolution Before UI Epics

**Issue 1 — Estimated node positions as a navigation lure with no resolution path**
Dollhouse shows estimatedNodePositions; real node positions may diverge. GDD states (AC-C07) the marker stays at the estimate even after scan completes at the real position. From the player's side: they physically walked to a location, triggered a scan, completed it — and the dollhouse marker in a *different* spot still appears as "un-scanned" until the desync window clears. Player has no basis to understand why. GDD says "defers this to UX design" but provides zero constraints. This is not a deferred decision — it is an unresolved UX gap that will block UI programmer handoff. Design must specify: how large is the permissible estimate divergence before the marker confusion becomes noise? What is the visual treatment when the scan completes at the real position vs. where the marker sits? Is the marker expected to "snap" at KNOWN_CURRENT transition, or stay wrong forever?

**Issue 2 — Tab-switch access speed is unspecified; there is no dollhouse-open latency contract**
The UI Requirements section states Floor Plan supplies a view model and UI/HUD renders the panel. No access paradigm is specified: is the dollhouse a tab (implies a deliberate mode switch with attention cost), a persistent overlay (always visible), a toggle key (instant), or tap-to-open? For a horror game where a player must choose between watching the space and checking the map, the access UX is the entire tension mechanic. A 1-second tab-flip is fundamentally different from a translucent overlay. The GDD defers this entirely but it is a Floor Plan UX decision — it affects how often players consult the map, which affects how often the desync is noticed, which affects the pacing of the horror. The UI Requirements section is insufficient for programmer handoff without a tab-access contract.

**Issue 4 — Player-position marker behavior after a loop teleport is undefined**
When a loop fires, the player is repositioned to the loopTarget room. The GDD specifies the dollhouse is "not updated" during anomaly reveals — but says nothing about the player-position marker on a loop. Two paths: (a) the marker instantly jumps to the new room = informative, breaks the confusion (the player *sees* themselves teleport on the map); (b) the marker is delayed / desynced = the map now shows the player in a room they are no longer in. If (a): the loop horror depends on the player *not* immediately knowing they looped — the map confirming the reposition is a spoiler. If (b): no spec exists for how long the marker lags, by what rule, and whether it follows the same desync window. This is a design decision the GDD has entirely omitted. The loop is the sharpest perception-stripping moment in the game. Not specifying the marker's behaviour here is a blocking gap.

**Issue 5 — "Room scanned" vs "node scanned" on the dollhouse is undefined**
The mask states are per-room (UNKNOWN / KNOWN_STALE / KNOWN_CURRENT) but a room contains multiple estimated node positions. The GDD does not define: does a room transition to KNOWN_CURRENT when all its nodes are VALID? Any single node? A threshold? This is not a minor detail — it determines what the dollhouse communicates. If one node completes and the room flips KNOWN_CURRENT, the player may believe the room is "done" when nodes remain. If the room requires all nodes, a player who scans 3-of-4 nodes in a room sees the room still flagged as incomplete and may re-enter. The scan-node GDD's coverage formula is at node granularity, but the dollhouse mask is at room granularity. The bridge between these two granularities is undefined.

**Issue 9 — Coverage ring deception has no colorblind or non-color fallback**
The GDD states the coverage ring "frames higher coverage as 'good'" (UI Requirements). This framing almost certainly relies on color (green ring growing = progress). The UI owns the pixels, but Floor Plan specifies the intent. If a colorblind player cannot distinguish the "good progress" framing from a neutral one, the inverted-reward trap fails: the deceptive encouragement depends on the player feeling they are succeeding. This is a functional accessibility requirement, not an aesthetic one — the deception mechanism itself needs to work without color as the sole signal. No fallback is specified.

## IMPORTANT — Clarification Required Before Production

**Issue 3 — Desync scope is underspecified: does it apply to room outlines, labels, or scan state only?**
The GDD specifies desync delays the mask state transition (KNOWN_STALE → KNOWN_CURRENT). But the dollhouse also shows room outlines, labels, and the player-position marker. The GDD does not state whether desync affects only scan-state rendering or the entire room entry in the view model. If a player is physically in a room that the dollhouse shows as not-yet-revealed (the anomaly case), does the outline desync too? What about the room label? If desync is scan-state-only, say so explicitly. If it is broader, it needs its own spec.

**Issue 6 — KNOWN_STALE and KNOWN_CURRENT visual differentiation is left entirely to UX with no constraints**
The GDD names two mask states but provides zero constraints on how they are visually distinguished. The horror depends on them being *subtly* different — if KNOWN_STALE and KNOWN_CURRENT look identical, the player never knows the map has drifted. If they are too obviously different (e.g., red vs green), the map announces its own unreliability, which breaks the "quiet wrongness" design intent. The GDD says "deferred to UX design" without stating any design constraints. The visual distinction is load-bearing for the horror. At minimum the GDD should specify: should KNOWN_STALE be visually indistinguishable from KNOWN_CURRENT to a casual glance? Is the intent that only a careful player notices? This constraint should live here, not be invented from scratch by the UI programmer.

**Issue 7 — UI Requirements section is insufficient for programmer handoff**
The UI Requirements section lists what Floor Plan supplies (outlines, labels, estimatedNodePositions, mask state, player-position marker, LOCKED [?] placeholder) but does not specify: update rate (per-frame? on-event?), whether the view model is a push or a pull, what event triggers a dollhouse panel refresh, whether the player-position marker is updated continuously or throttled, or the coordinate space of the 2D outline (world units projected, normalized, or pixel space). A programmer handed this GDD cannot build the dollhouse panel from it. "UI owns the pixels" is correct as a separation-of-concerns statement but is not a sufficient data contract.

**Issue 10 — KNOWN_STALE has no visual floor; it may be indistinguishable from UNKNOWN**
Three mask states: UNKNOWN (never visited/scanned), KNOWN_STALE (scanned but desync delay not elapsed), KNOWN_CURRENT (desync elapsed, confirmed current). If KNOWN_STALE and UNKNOWN look the same — which is plausible if the design intent is "the map is subtly wrong" — then a player looking at the dollhouse in the mid-game cannot tell whether a room is "I haven't been in there yet" vs "I just scanned it but the map hasn't updated." Both look identical. This collapses the mask's ability to communicate anything. The GDD needs to either (a) collapse UNKNOWN and KNOWN_STALE to the same visual intentionally and say so, or (b) specify a minimum differentiation between them.

## ADVISORY — Minor Issues or Late-Playtest Items

**Issue 8 — Context loss when player switches away from dollhouse tab and returns**
If the dollhouse is a tab (which the §11 UI structure implies), a player who switches to the Scan tab and back may not know their orientation has changed while they were away. There is no "you are here" re-anchor moment on tab return. This is low severity because the player-position marker re-establishes their position, but the re-orientation cost is unaddressed.

**Issue 11 — D_max=25s late-game desync will read as a bug to players who haven't abandoned the map**
At max escalation a scanned room shows as un-scanned for 25 seconds. The design intent is that late-game players have already stopped trusting the dollhouse. But a player who is still consulting the map at high escalation (e.g., a systematic player who trusts instruments) will watch a room they just scanned remain "un-scanned" for 25 seconds and will conclude the game is broken. The GDD notes this as acceptable ("feeds the §10 coverage-as-false-comfort ending") but does not address the "looks like a bug" risk for players who are still map-reliant at that stage. No diegetic framing is proposed to make 25-second lag feel like instrument failure rather than software error.

**Issue 12 — No player signal distinguishes desynced rooms from genuinely unscanned rooms**
Late-game, the dollhouse shows some rooms as "un-scanned" that the player has already completed. The player has no way to know which un-scanned markers are "real" vs "desynced." If a player is trying to ensure full coverage, they may re-enter already-scanned rooms to find the node already valid. Repeated unnecessary room visits are costly (entity proximity increases with time). This is a consequence of the intentional deception design, but the GDD doesn't address whether the re-entry cost is intended gameplay tension or incidental friction.

## Structural Gaps (Cross-GDD)

**12/12 + 92% simultaneity — classified as intentional but not diegetically framed**
The Scan Node GDD confirms: `nodesCompleted = 12/12`, `coverage = 0.923` simultaneously on the escape path. The Floor Plan GDD calls this "intentional dissonance." But from a player's UX perspective: they have completed every node on the list and the coverage number is not 100%. The most common player inference is "the game has a bug." The GDD relies on this confusion persisting through to the ending, but a confident player will retry the session or search online rather than sitting with the confusion. Neither GDD addresses how the UI is supposed to make "12/12 and 92%" feel like diegetic instrument behaviour rather than a math error. This requires a UI treatment — an error message, a log entry, a "data integrity anomaly" label — something that makes the divergence feel like a system property the fictional scanner would report. No such treatment is designed.

**"Map is lying vs map is bugged" — the core communication problem has no design answer**
The horror depends on the player blaming themselves ("I must have misremembered") not the system ("this is a bug"). The GDD acknowledges this implicitly in the Player Fantasy section ("not a glitch they report"). But the GDD contains no design mechanism to establish the diegetic frame — no in-world explanation for why the dollhouse might lag or diverge, no pre-established "instrument limitation" that primes the player to expect map inaccuracy. A Matterport-style UI is unfamiliar to most players (it is not a standard game UI pattern). Without a priming moment — a startup log entry saying "SPATIAL DATA: CACHED, LAST SYNC: 00:00:00" or similar — the player's default frame for a wrong map is "game bug." The GDD must specify the priming mechanism, or this must be explicitly delegated to the onboarding design with a clear brief.

**Anomaly room: player has no basis to recognise they are in a room that should be on the map**
When the player enters the anomaly room for the first time, the dollhouse does not update. The design calls this "perception stripping." But the impact of "a room that is not on the map" requires the player to already have a strong mental model of the map — to know which rooms exist and to notice a new room's absence. The GDD does not address onboarding: is there an explicit moment early in the session where the player is shown the dollhouse and understands "these are all the rooms"? If not, entering the anomaly room is just "I walked through a door into a new space" — the map's silence about it goes unnoticed. The horror only lands if the player is actively checking the map and finding it silent about a room they know they are standing in. That requires an established prior belief. The GDD says "the dollhouse is a gift in the first minutes" but contains no spec for how that gift is delivered or what specifically the player learns during the gift period.

**Why:** These gaps will block UI programmer handoff and risk the horror mechanism failing silently.
**How to apply:** Use this as the checklist of resolved issues when dollhouse.md is authored via /ux-design.
