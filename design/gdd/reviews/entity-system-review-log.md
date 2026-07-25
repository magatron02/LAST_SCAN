# Entity System — Review Log

Revision history for `design/gdd/entity-system.md`. Newest entry at top.

---

## Review — 2026-07-25 (round 4) — Verdict: NEEDS REVISION (blockers addressed same session)
Scope signal: L
Specialists: game-designer, systems-designer, ai-programmer, qa-lead, audio-director, ux-designer, creative-director (senior synthesis)
Blocking items: 9 | Recommended: 12
Prior verdict resolved: Yes — this was the fresh-context re-review round-3 called for. All round-3 fixes held up under independent re-derivation; round-4's findings are all new.

**Key findings (creative-director synthesis):** Round-3's claim that blocker character was "narrowing to zero structural findings" was **falsified this round** — it measured one round's sample and wrote it into the document header as a trend that didn't hold. Two independent specialists (systems-designer, qa-lead) converged on the same live instance of the exact defect class the round-3 header warned reviewers to check for (`SCALE_CAP > 1.0`, declared, unguarded — the 4th such instance). More significantly, qa-lead's worked-example spot-check (independently re-verified by creative-director) found that **two BLOCKING acceptance criteria fail against a mathematically correct implementation of this GDD's own formulas**: `AC-ES21` asserted Formula 2's worked-example values at a tolerance ~20–120× tighter than their own rounding error, and `AC-ES10b` asserted a Formula 4 probability that was wrong because the GDD's own worked-example arithmetic (`Σw`) contained a plain addition error. Both defects survived three prior rounds and this round's first six specialists — all of whom were checking design/structure, not re-deriving numbers by hand. NEEDS REVISION, not MAJOR — every blocker was local and cheap; the design's shape is unchanged.

**Specialist disagreements, adjudicated by creative-director:**
- `game-designer` tagged "only Type C is a mechanically real antagonist — A/B are passive tells" as BLOCKING; CD demoted to RECOMMENDED, ruling passive dread-baseline manifestations are legitimate content under the Perception Stripping pillar, not a defect — while agreeing the Overview's wording overclaimed Type C's behavior as the entity's general character (fixed).
- `ai-programmer` (BLOCKING) vs. `systems-designer` (RECOMMENDED) on the Type B re-roll misconfiguration gap (`entity_influence_radius ≤ type_b_step_distance`): CD sided with ai-programmer — an unbounded loop is a hang, not a graceful degradation, regardless of current unreachability at safe-range tuning.
- `ux-designer`'s request to reopen Rule 9's round-3 "accepted asymmetry" ruling for cross-session/veteran tell erosion: CD extended the existing ruling by one clause rather than reopening it — the Player Fantasy's ambiguity promise was always a per-encounter claim, not a per-playthrough one.

**Fixes applied same session (round-4 revision):**
- **B1/B2 (worked-example arithmetic)** — Corrected Formula 2's `e=0.95` example (`2.014`→`2.0146`, a truncated-intermediate error) and `AC-ES21`'s asserted values to full precision (`0.9351`/`1.3459`/`2.0145875`). Corrected Formula 4's `Σw` (`0.31073`→`0.30973`) and nearest-room `P` (`0.814`→`0.817`) in both the prose example and `AC-ES10b`; also fixed an unrelated `0.9987`→`0.9913` typo in the anomaly-lerp example (no AC depended on the wrong figure).
- **B3 (`SCALE_CAP > 1.0` unguarded)** — New `AC-ES61` (rejection), extended `AC-ES57b` (acceptance boundary), extended the guard-policy note and Coverage Validation table.
- **B4 (`SPEED_BASE > 0` unguarded, distinct from the `SPEED_MAX>SPEED_BASE` ordering guard)** — New `AC-ES62`, same treatment as B3.
- **B5 (`AC-ES57b` missing the `I_min ≤ 0` acceptance path)** — Added `I_min = 0.001` boundary case; `AC-ES55` rejects on two independent conditions and only one had an acceptance test.
- **B6 (Formula 4's "eligible rooms" set had no defined interface)** — Rule 5 and the Interactions/Dependencies tables now explicitly cite `floorplan:update` (always the full current room set, per Floor Plan's own contract) as the actual source, rather than the vaguer "Room AABBs... for placement" description that only named `floorplan:reveal`.
- **B7 (Type B step vs. retarget same-tick RNG collision, unordered)** — New Edge Case bullet + `AC-ES63`: retarget wins, the pending step is discarded without an RNG draw. Not rare under default tuning — `type_b_step_interval` (1.0s) evenly divides both `I_min` and `I_max`.
- **B8 (Type B re-roll had no misconfiguration guard — unbounded-loop risk)** — Rule 7 gets a 32-attempt re-roll cap with a clamp-as-last-resort fallback (misconfiguration-only, logged as a config warning); new `AC-ES64`; new advisory tuning note (deliberately not load-guarded, same reasoning as `SPEED_BASE < MOVE_SPEED < SPEED_MAX` — `entity_influence_radius` is a foreign-registry constant).
- **B9 (Type C's audio "clear, intensifying, gated drone" claim wasn't backed by its own bullets)** — New "Type C — pursuit audio" direction bullet covering the continuous (non-scan-locked) pursuit state; corrected the perceptibility-asymmetry callout box that had implied this coverage already existed.
- **R (Overview overclaim)** — Qualified the "dooms them" clause as Type-C-specific, with a cross-reference to Rule 9's callout box.
- **R (Rule 9 ruling extensions)** — Added two round-4 addenda to the existing callout box: (1) A/B's lack of mechanical stakes ruled acceptable, not a defect; (2) cross-session tell erosion ruled acceptable, extending rather than reopening round-3's reasoning.
- **R (`AC-ES18b`, spawn- vs. current-position containment ambiguity)** — New AC proving Type B's radius containment is checked against spawn position across multiple steps, not current position (AC-ES18 alone only ever exercises step 1, where the two are identical).
- **R (`type_c_trail_delay > 0` unguarded)** — New `AC-ES65`.
- **R (audio same-tick collision + gate-on attack unspecified)** — Manifestation-despawn audio now explicitly subsumes a same-tick Rule 9 gate-off cut; gate-on now directed as a ramped attack, not an instant onset, matching the doc's no-jump-scare discipline elsewhere.
- **R (pre-first-spawn sensor-bar default undefined)** — New Edge Case bullet: `FAR` applies before the session's first `entity:proximity` event too, not just post-despawn (closes a bare-precondition gap in `ui-hud.md`'s own ACs).
- **Coverage Validation table** — Updated all affected rows for the 6 new ACs (`AC-ES61`–`65`, `AC-ES18b`), and its own header note now documents a **third consecutive round** of overclaiming (previously missed the `SCALE_CAP`/`SPEED_BASE` guards entirely).
- **New Open Question #8** (non-blocking, found while fixing B6, not specialist-flagged) — Formula 4 Stage 2 assumes a single "the anomaly room"; Floor Plan's own chained-anomaly-reveal pattern isn't handled if it ever produces more than one revealed `ANOMALY` room in a session.

**AC count:** 65 → **71** (61 BLOCKING Logic + 10 BLOCKING Integration). Six new (`ES61`, `ES62`, `ES63`, `ES64`, `ES65`, `ES18b`); two rewritten in place for correctness (`ES21`, `ES10b`).

**Explicitly NOT redesigned (creative-director overruled/demoted the specialist):**
- `game-designer`'s BLOCKING tag on "only Type C is a real antagonist" — demoted to RECOMMENDED; ruled a legitimate design choice, not a defect, per the pillar-alignment reasoning above.
- `ux-designer`'s implicit suggestion to reopen Rule 9's asymmetry ruling — extended by one clause instead.

**Process note for round 5 (creative-director ruling).** Four consecutive rounds of same-session self-fix. This round's headline finding is process, not content: two BLOCKING acceptance criteria failed against a correct implementation, undetected by three prior rounds plus this round's first six specialists — none of whom were checking arithmetic. **Round 5, if needed, should not repeat the six-specialist adversarial format** — it should be a narrow, single-reviewer pass that re-derives every worked example by hand, cross-checks every AC's asserted value/tolerance against that derivation, and re-enumerates every declared inequality in every variable table against the guard-AC list from scratch, rather than trusting this document's own completeness claims.

**Next:** fourth fresh-context re-review before flipping systems-index status to Approved, per the standing don't-self-approve doctrine — recommended to run as the narrow single-reviewer audit described above, not another full six-specialist pass.

---

## Review — 2026-07-25 (round 3) — Verdict: NEEDS REVISION (blockers addressed same session)
Scope signal: L
Specialists: game-designer, systems-designer, ai-programmer, qa-lead, audio-director, **ux-designer (first-ever UX pass on this GDD)**, creative-director (senior synthesis)
Blocking items: 4 | Recommended: 7
Prior verdict resolved: Yes — this was the fresh-context re-review round-2 called for. All 11 of round-2's fixes held up under independent re-derivation; round-3's findings are all new.

**Key findings (creative-director synthesis):** **Zero structural findings this round.** Every blocker is a config guard, a wording fix, or one missing formula. The CD argued convergence explicitly rather than assuming it: round-1 blockers were structural (division-by-zero, an entirely unspecified RNG layer), round-2 structural (no position channel existed at all), round-3 none — the opposite of Point Cloud Renderer's round-5 escalation profile. Not APPROVED because B2 is genuine underspecification an implementer cannot build from, and a document whose own coverage claim is false cannot ship as Approved.

**Director's call on the one pillar-adjacent finding:** `game-designer` and `ux-designer` converged from opposite directions on Rule 9's Type-C-only scope — one saying it *under-delivers* the fantasy's "sharpest edge" for A/B-heavy sessions, the other that it *leaks* Type C identity to a player who learns the pattern. Ruling: **accepted asymmetry, document it, do not redesign.** The tell fires only at NEAR/ADJACENT inside a locked scan — strictly inside the window the fantasy already concedes ("until it's already close") — and is inference under duress with no speed readout. Symmetry is unaffordable (Type A is stationary by definition; Type B's immunity is a round-1 decision protecting its own tell). The *real* finding is the delivery-floor concern, reclassified as a tuning target and folded into Open Q#1.

**Design decisions taken (user, via AskUserQuestion):**
- Room-selection weighting family → **inverse-power distance + anomaly lerp** (`w_i ∝ (d_i + ε)^−k`), the CD's suggested family, over softmax or knob-free linear.
- Type B step magnitude → **always exactly `type_b_step_distance`** (uniform-on-circle, direction random only), resolving the Rule 7 / AC-ES19 contradiction in AC-ES19's favour — no AC rewrite needed.
- `SPEED_BASE < MOVE_SPEED < SPEED_MAX` → **advisory tuning note, deliberately NOT load-guarded**, since `MOVE_SPEED` is FPS Movement's knob and coupling the two config loaders isn't worth an invariant that degrades gracefully. Documented explicitly so the inconsistency reads as intentional.

**Fixes applied same session (round-3 revision):**
- **B1 (unguarded declared invariants)** — Added config-load rejection for `0 < I_min < I_max` (AC-ES55) and `SPEED_MAX > SPEED_BASE` (AC-ES56), plus Formula 4's `k > 0` / `ε > 0` (AC-ES57). Both original invariants were declared in variable tables exactly like the two rounds 1–2 guarded, and both fail *silently by inversion* rather than by NaN. Added a **guard-policy note** distinguishing guarded invariants (silent-inversion class) from advisory safe ranges.
- **B2 (room-selection weighting had no formula)** — Added **Formula 4** (two-stage: inverse-power distance weighting, then anomaly lerp to certainty), new knobs `room_weight_exponent` (1.5) and `room_distance_epsilon` (0.5m). Rewrote AC-ES10 (≥5 rooms, assert per-room probabilities ±0.02, strict monotonicity) and AC-ES11 (≥5 `e` samples — a hard step function must now fail). Added AC-ES10b as a pure-math check. **Overruled Open Q#3's own "not blocking" self-assessment**, and retained that item as a documented caution rather than deleting it.
- **B3 (two internal wording contradictions)** — Formula 1's variable table said `dwell` was "uninterrupted" while Reset Behavior mandated decay-not-reset; Rule 7 said "up to `type_b_step_distance`" while AC-ES19 asserted exact magnitude. Both fixed at the *table/rule* (the place an implementer actually looks), not just clarified downstream.
- **B4 (`session:end` + retarget same-tick order unspecified)** — `session:end` wins, pending retarget discarded, **zero RNG draws consumed**. New Edge Case + AC-ES58. Left unordered, two correct-looking implementations produced different event streams *and* desynchronised seeded RNG sequences — the divergence class AC-ES52 exists to prevent.
- **R (AC-ES45/ES45b vacuous pass)** — Rewrote both with before/after structure (prove the value was live, then prove it froze). `qa-lead` correctly identified this as the same defect round-2 fixed in AC-ES18/ES19; the external safety net was exactly the structure round-2 rejected.
- **R (config guards had no acceptance path)** — New AC-ES57b: all five guarded invariants tested at the *legal* side of their boundary, so an implementation that rejects everything now fails.
- **R (reveal-mid-manifestation weighting untested)** — New AC-ES60 (Integration): AC-ES39 asserted only the negative and AC-ES11's GIVEN never specified mid-manifestation, so a scheduler that only latched revealed-room weighting from `DORMANT` passed both while violating Rule 5.
- **R (3.52 m/s "ceiling" was tuning-dependent)** — Restated as "at defaults"; documented that both knobs at safe-range maxima multiply to **7.5 m/s (4.7× MOVE_SPEED)**, and that the two ranges were set independently with their product never evaluated.
- **R (audio perceptibility asymmetry)** — Stated outright that Type A/B near-silence is deliberate, that **Type B has no functional audio tell** (its detection path is purely visual re-scan comparison), and that neither type's audio is required for any AC — so the Audio System author doesn't chase parity or treat imperceptibility as a bug.
- **R (Open Q#1 delivery floor)** — Amended with the CD-ratified finding that ~20% of short sessions never roll Type C and therefore never experience the fantasy's self-declared "sharpest edge"; re-tuning must now satisfy three constraints (pacing, unpredictability, delivery floor) with an explicit playtest design test.
- **R (Open Q#5 playtest checks)** — Added Type-B-step-vs-ambient-jitter legibility (the step may be indistinguishable from, or mistaken for, proximity jitter at the exact NEAR/ADJACENT band where it's observable) and the combined-speed-ceiling hand-check.
- **R (UI placeholder + cross-doc drift)** — Flagged `SCAN INTERRUPTED — RETRY?` as evocative placeholder, not literal copy (nothing in this GDD makes NEAR actually interrupt a scan — a feedback-integrity trap); flagged the `FAR`/`MEDIUM` drift where `ui-hud.md` merges two states this GDD lists separately *while citing this GDD as its source*. **Assigned to UI/HUD, not fixed here**, per CD.
- **Coverage Validation table corrected** — its "no Tuning Knob invariant left uncovered" claim was **false**; now lists the two documented deliberate exceptions and carries an explicit warning that this table has overclaimed in two consecutive rounds.

**AC count:** 58 → **65** (56 BLOCKING Logic + 9 BLOCKING Integration). Seven new (ES10b, ES55, ES56, ES57, ES57b, ES58, ES60); four rewritten in place (ES10, ES11, ES45, ES45b).

**Explicitly NOT addressed (creative-director overruled the specialist):**
- `ai-programmer`'s hitch-dependent Type C path shape — real, but unfixable at GDD level (~35cm corner-cut at `dt_cap` on a wall-ignoring ghost). Nice-to-have.
- `audio-director`'s request that this GDD constrain the manifestation-change de-emphasis curve — declined; Entity legislating Audio's domain would violate the separation this GDD is otherwise scrupulous about. Flag-and-defer is correct.
- `ux-designer`'s multi-boundary-jump tween treatment — UI/HUD's scope.
- AC-ES09/ES38 overlap trim, AC-ES30b baseline tightening — nice-to-have, not applied.

**Process note for round 4.** Third consecutive round where the finding session also fixed. Two defect classes have each now slipped a manual pass twice: the Coverage Validation completeness claim, and "declared invariant with no load guard." A fresh-context round-4 review should verify both classes explicitly rather than trusting the document's own claims — a standing caution has been added to the GDD header.

**Next:** third fresh-context re-review before flipping systems-index status to Approved, per the standing don't-self-approve doctrine.

---

## Review — 2026-07-25 (round 2) — Verdict: NEEDS REVISION (blockers addressed same session)
Scope signal: L
Specialists: game-designer, systems-designer, ai-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 11 | Recommended: 10
Prior verdict resolved: Yes — this was the fresh-context re-review round-1 (2026-07-18) called for. Round-1's 4 fixes held up under independent re-derivation; round-2 found new issues round-1 didn't touch.

**Key findings (creative-director synthesis):** Still the strong, self-aware GDD round-1 identified — nothing here touches a pillar or forces a different game. But specialists converged on more real blockers than round-1, and one is structurally load-bearing: no event ever broadcasts Type B's or Type C's *position* after the initial spawn frame (`entity:spawn` only fires once), so Point Cloud Renderer had no way to know where to draw `ENTITY_SPIKE`/`ENTITY_GHOST` once either type moved — confirmed via grep against both the GDD and `entities.yaml`, not just asserted. Character: spec-tightening, like round-1, but higher volume plus one structural gap. NEEDS REVISION, not MAJOR.

**Design decisions taken (user, via AskUserQuestion):**
- Type A/B audio direction (flagged by audio-director as a gap against the "three distinct dreads" promise) → **draft it now**, not deferred further to the unwritten Audio System GDD.
- Type-roll anti-repeat guard (flagged by game-designer as a predictability concern) → **left for Vertical Slice tuning**, per the existing Open Q#1 scope — not added as a new mechanical rule against a placeholder distribution that's being re-tuned anyway.

**Fixes applied same session (round-2 revision):**
- **B1 (position broadcast gap)** — Added Core Rule 11 + `entity:position {position}` event (latest-value, mirrors `player:position`), emitted every tick for Type B/C only. Registered in `entities.yaml` (provisional). New AC-ES47. Updated Interactions/Downstream tables, Bidirectional actions list, and AC-ES31's event whitelist (which also hadn't been updated when `entity:transform` was added in round-1 — caught and fixed in passing).
- **B2 (`dwell_half` load guard)** — Added `dwell_half ≤ 0` config-load rejection, same pattern as `proximity_tier_medium_max`. New AC-ES49.
- **B3 (Rule 4 cross-implementation gap)** — Added a shared golden-fixture requirement (`tests/fixtures/session-escalation.json`) both Entity's and Floor Plan's test suites must pass identically. New AC-ES51 (Integration); retagged AC-ES07 from Integration → Logic since it never exercised the real cross-system seam.
- **B4 (Type C arrival/oscillation)** — Added an explicit clamp-to-target rule when a tick's step would overshoot the trail-delayed target (Rule 8). New AC-ES54.
- **B5 (RNG draw ordering)** — Fixed the draw order at combined retarget events: type roll, then room roll (Rule 5). New AC-ES52.
- **B6 (Type C ring-buffer sizing)** — Buffer retention window is now explicitly tied to `type_c_trail_delay` (no separate fixed-size constant). New AC-ES53.
- **B7 (AC-ES18 didn't test re-roll)** — Rewrote to assert the RNG mock is called twice on an out-of-radius draw and the resulting position matches the second draw, not the boundary-clamped point.
- **B8 (`proximity_tier_medium_max` guard had no AC)** — New AC-ES48, in a new "Config Load Validation" subsection.
- **B9 (`entity:transform` throttle undefined)** — Added `entity_transform_min_delta` knob (default 0.01, safe range 0.005–0.05) to both Tuning Constants and Tuning Knobs tables. New AC-ES50 testing the boundary itself.
- **B10 (Type A/B audio silence)** — Drafted type-specific audio direction paragraphs for both, matching Type C's existing treatment.
- **B11 ("within-band proximity distance" driver not implementable)** — Removed; `type_c_speed(e)` is now the sole named continuous driver. Also fixed the Rule 9 gate-off behavior (now explicitly an abrupt cut, matching the despawn precedent) and the repetition-fatigue note (now points out Audio must replicate Entity's local `e`-computation pattern, since Entity never broadcasts `e`).
- **R (Formula 1 "passive dial" concern, non-blocking per creative-director)** — Added a clarifying sentence to Formula 1's Reset Behavior paragraph: dwell only accrues while the player chooses to linger and decays when they leave, so growth is deterministic *given* dwell but dwell itself tracks player choice.
- **R (Open Q#1 tension)** — Amended to explicitly flag that escalation-weighted type odds (the open re-tuning target) would make type more predictable over a session, in tension with "never learn which type you're facing" — not silently left implicit.
- **R (AC-ES19 one-sided bound)** — Rewrote to assert the exact seeded displacement via `toBeCloseTo`, not just an upper bound a zero-movement implementation could trivially pass.

**AC count:** 50 → 58 (51 BLOCKING Logic + 7 BLOCKING Integration). Two ACs retagged in place (AC-ES07: Integration → Logic); two existing ACs rewritten for testability (AC-ES18, AC-ES19) without a count change.

**Not addressed this session (deferred by user decision, not blocking):** type-roll anti-repeat guard — left for Vertical Slice tuning per Open Q#1.

**Next:** a second fresh-context re-review is recommended before flipping systems-index status to Approved — same don't-self-approve-after-a-blocker-round doctrine as round-1.

---

## Review — 2026-07-18 — Verdict: NEEDS REVISION (blockers addressed same session)
Scope signal: L
Specialists: game-designer, systems-designer, ai-programmer, qa-lead, audio-director, creative-director (senior synthesis)
Blocking items: 4 | Recommended: 6
Prior verdict resolved: First review

**Key findings (creative-director synthesis):** Strong, unusually self-aware GDD (50 ACs post-revision, full coverage mapping, disciplined cross-system contracts) — blockers were real but local and cheap, a spec-tightening pass, not a redesign; no pillar touched. The four blockers: (1) Formula 1's dwell decay had a reachable division-by-zero at `dwell = −dwell_half`; (2) the whole randomness layer was unspecified — no seedable RNG, no type-selection distribution, and AC-ES10/11 weren't pass/fail testable, conflicting with the project's own Determinism standard; (3) Type B and Type C each carried two mutually-inconsistent movement specs within the same document; (4) Rule 9's scanning-aggression multiplier was worded type-agnostically, which would break Type B's "furniture pretending to be still" tell.

**Design decisions taken (user, via AskUserQuestion):**
- Type-selection placeholder → **uniform 1/3** (final tuning deferred to Vertical Slice, Open Q#1).
- Type B movement → **discrete pause-and-shift is the canonical mechanic** (Rule 7 + AC-ES19 reconciled to step-distance/interval; new `type_b_step_distance` / `type_b_step_interval` knobs).
- Rule 9 scope → **Type C only**.

**Fixes applied same session (round-1 revision):**
- **B1** — Floored `dwell` at 0.0; amended AC-ES16 to assert the floor and name the singularity it prevents.
- **B2** — Added a single injectable/seedable RNG + capped-`dt` to the testability preamble; shipped placeholder uniform 1/3 type roll (Rule 5) with new AC-ES33b; rewrote AC-ES10/AC-ES11 as seeded 1000-trial assertions with numeric thresholds.
- **B3** — Type B rewritten to discrete hold-then-step with a boundary re-roll rule (Rule 7, AC-ES18/AC-ES19); Type C given an explicit continuous per-tick re-aim movement model (Rule 8), with the discrete resample-step "look" demoted to presentation.
- **R4 (Rule 9)** — Scoped to Type C only; new AC-ES30b asserts the multiplier is a no-op for Type A/B.
- **R5 (entity:transform)** — Added `entity:transform {scale}` emission to Rule 6 + Interactions/Downstream tables + new AC-ES17b; registered the event in `entities.yaml` (provisional); closes Point Cloud Renderer's Open Cross-System Item.
- **R6 (audio)** — Rewrote the audio section to direction-only, deferring concrete cue authorship to the (unwritten) Audio System GDD; fixed the boolean-gate-vs-continuous-driver contradiction.
- **R7 (invariants)** — Added a load-time guard for `proximity_tier_medium_max > 8.0m`; documented the `I_min == dwell_half == 20.0s` default trade-off explicitly (no coupling guard, tuning choice).
- **R8 (fantasy + staleness)** — Reframed the "proximity is the entity choosing to be felt" claim to be honest per-type; refreshed stale "(#10, undesigned)" → Win/Lose Designed and "(#12, undesigned)" → UI/HUD In Review; added AC-ES45b (session:end also freezes tier recomputation / entity:proximity emission).

**AC count:** 46 → 50 (43 BLOCKING Logic + 7 BLOCKING Integration). The pre-revision header's "42 Logic + 4 Integration" split was also a pre-existing miscount, corrected here.

**Next:** fresh-context re-review recommended (project's standing "don't self-approve after a blocker round" doctrine) before flipping systems-index status to Approved.
