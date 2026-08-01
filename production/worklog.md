# LAST SCAN — Work Log

Cross-machine running log. Newest entry on top. Updated on every `quicksave`
(see CLAUDE.md → Quicksave Protocol). Read the top entry first when resuming on
any machine.

---

## 2026-07-26 (Point Cloud Renderer round 7) — MAJOR REVISION NEEDED; **5 of 8 blockers were introduced by round-6's own fixes**; NO fixes applied; pivoted to prototypes

### Verdict
Full-mode `/design-review design/gdd/point-cloud-renderer.md`, 5 specialists (game-designer,
systems-designer, engine-programmer, performance-analyst, qa-lead) + creative-director synthesis.
**MAJOR REVISION NEEDED — MAJOR-by-process, not by vision.** On the blocker set alone CD said it
would be NEEDS REVISION; the escalation is for the meta-pattern below. 8 blockers + 8 recommended,
**+1 found post-review** (see addendum) = 9. **Zero fixes applied this session — deliberate.**

### The finding that drove the verdict
**5 of the 8 blockers were introduced by round-6's own same-session fixes** — `f_cov`, Formula 1b's
budget guard, the narrowed cost bound, AC-P01's third window, `toneMapped=false`. A 62% self-inflicted
rate. Rounds 4 and 5 deferred to fresh sessions; round 6 patched in-session and produced this crop.
CD called it a controlled experiment with a result and ruled: **no further same-session fixing on this
document, no exceptions for "cheap" items** (both `toneMapped=false` and the Formula 1b guard looked
cheap when written).

Deeper diagnosis: **Formula 2 has been the primary blocker in 6 of 7 rounds.** Each round patches its
baseline and each patch introduces a term whose data source doesn't exist yet (visible-set → layer set
→ tile activity → scan coverage). `f_cov` is the fourth iteration of one failure. CD's prescription:
rebuild Formula 2 **once** from its data sources — gate sampling on binary owning-node completion,
delete the continuous-coverage fiction — rather than patch a fifth time.

### The 8 blockers
1. **`f_cov` has no data source** (3-way convergence: systems-designer, qa-lead, main session).
   `scan:complete` is a node-level one-shot carrying a session-wide node-*count* fraction; nothing
   computes a per-tile *spatial* area fraction. Mid-arc: 3 of 4 angles sealed into BASE, `f_cov` still
   0 → whole room excluded from detection, then jumps to 1. AC-D02b's `f_cov = 0.5` is not
   constructible through any documented interface.
2. **Formula 1b's budget guard overshoots** — at `BASE_count = 1.4M` (legal) needs stride ≥14, knob
   caps at 8 → combined 1.575M > ceiling. Fails above ~89% of ceiling.
3. **Formula 2's cost bound states no tuning assumption** — two independent recomputations disagreed
   (~2.12M vs ~764k). CD declined to arbitrate and ruled *the disagreement is the finding*. This bound
   was the stated justification for round-6's range narrowing.
4. **`toneMapped=false` asymmetry** — set on BASE only; under any non-`NoToneMapping` renderer BASE's
   `#4ade80` and SPIKE/GHOST's identical `#4ade80` post-process differently, splitting the uniform
   green (a blocker in rounds 1 and 3).
5. **AC-P01 window (c) is backwards and unbarred** — `ENTITY_GHOST` is *excluded* from ρ_obs, so
   **Type B is the only entity state that adds CPU sampling work**; the one window that stresses the
   sampling pass is exempt from the 33 ms guard, and "expected to pass trivially" is a prediction.
6. **`ghost_decimation_stride` is spawn-time-only**; AC-E04 never says whether ENTITY_GHOST rebuilds
   with BASE on `floorplan:update`. Round-5 carry-over.
7. **`flicker_rate` violates accessibility A-V3** (verified against `design/ux/accessibility-requirements.md`
   line 19): A-V3 mandates ≤3 flashes/s + a reduced-distortion toggle, priority-flagged; legal max
   40 rad/s = **6.37 Hz**. Default 18 rad/s = 2.86 Hz sits barely under. GDD never cites A-V3.
8. **Level Design dependency undeclared** — §B's round-6 softening handed it the Anchor-moment pacing
   promise; Level Design is absent from Dependencies *and* from systems-index entirely.

### CD adjudications (2 specialist findings overturned)
- game-designer's **confirmation-dwell blocker OVERRULED → recommended**: the scenario is unreachable
  because a tile is only sampled if it intersects the camera frustum, so the void must be on-screen for
  2 consecutive passes. Verified in-session against Formula 2's "Active detection tiles" clause.
- engine-programmer's **Q#6 spatial-index blocker DOWNGRADED**: observation correct (option (a)
  silently needs a tile→point index or ρ_obs collapses to O(scene)/pass) but Q#6 is already a deferred
  ADR question.
- **engine-programmer found NO DEFECT in the occluder recipe** — the most-patched technical claim held.
- **qa-lead verified the AC count accurate at 33** — no stale-count slip.

### Addendum blocker (+1, found AFTER the verdict, while building the prototype)
**Formula 5 pins `#include <output_fragment>` — a chunk that does not exist in r171.** Renamed
`opaque_fragment` in r152. Verified against installed `three@0.171.0`: `ShaderChunk/` has
`opaque_fragment.glsl.js` and no `output_fragment.glsl.js`, and `ShaderLib/points.glsl.js` reads
`outgoingLight = diffuseColor.rgb; #include <opaque_fragment>; #include <tonemapping_fragment>;
#include <colorspace_fragment>`. An implementer following the GDD literally gets a `.replace()` that
never matches → **flicker silently never renders, while AC-D08 still passes** (it asserts only the
CPU-side `uFlickerAmp` uniform). The GDD's *reasoning* is confirmed correct — ordering is genuinely
pre-tonemap; only the name is wrong. This raises round-6's self-inflicted count to **6 of 9**, since
it also lives in Formula 5's round-6 injection-point fix. **First finding in 7 rounds produced by
checking the pinned engine rather than by argument** — direct evidence for the prototype pivot.

### User decision: GO PROTOTYPE
Both ADR-blocking prototypes have been outstanding for 7 rounds, and Q#7's numbers would settle 5 of
the disputed items (blockers 3, 5, 6, the Q#6 merge policy, the cost arithmetic) — 4 of which review
cannot resolve by argument. Built both:

- **`prototypes/q7-perf/`** — merged 1.5M-pt BASE (`frustumCulled=false`, Q#6 option (a) worst case),
  jitter+flicker via one `onBeforeCompile` + `customProgramCacheKey`, depth-only occluder, ENTITY_GHOST
  full duplicate, ENTITY_SPIKE at Formula 1b's 3,240 pts, **Formula 2 sampling live at worst-case
  tuning** (`A_tile` 0.5, radius 15m — the gap performance-analyst flagged, where the validating gate
  never exercised the claim). Deterministic scripted camera. 4 scenarios × 300 frames, incl. **a 4th
  the GDD lacks: Type B + CORRUPTED**, testing blocker 5. Reports tile-index build time + memory (the
  structure Q#6 (a) needs and the GDD never budgets) and total buffer bytes.
- **`prototypes/q1-occluder/`** — numeric verification via offscreen `WebGLRenderTarget` +
  `readRenderTargetPixels`, so it doubles as **AC-C08's evidence** and stays on the allowed side of the
  "What NOT to Automate" carve-out (pixel *count*, not appearance). T1 cull, T2 invisibility, T3
  360°+elevation sweep (catches angle-dependent sort failure), T4 near-plane overlap vs the GDD's
  "solid black void" claim.

### Prototype results — BOTH RUN (later the same session, once the Chrome extension reconnected)
Hardware: developer desktop, 1639×846 @ DPR 1.5625 — **not** the min-spec baseline.

**Q#1 occluder — GATE PASS.** T1 cull 2,921 → **0** green px inside the silhouette (100%); T2
invisibility 12,996/12,996 background, no colour written; T3 **120 viewpoints, 0 failures, worst case
still 100% cull** — no angle dependence. Numeric `readRenderTargetPixels` verification, so it **doubles
as AC-C08 evidence** and is the WebGL-integration tier's first real consumer. Screenshot captured for
the ADVISORY sign-off — the void reads exactly as intended. **Q#1 no longer blocks the ADR.**
*Harness caveat worth remembering:* the first run reported T3 **FAIL** (37/92 viewpoints). That was
**my test rig, not the recipe** — a single flat wall meant rear azimuths put the camera in front of it,
where 0% cull is correct. Rebuilt as an enclosing room shell → 120/120. Checked before reporting;
a false "the recipe is angle-dependent" would have been a serious misfire.

**Q#7 perf — FAILS AC-P01's max-frame bar in all three windows, and INVERTS THE RISK MODEL.**

| Scenario | avg FPS | max frame | p99 | F2 pass avg / max |
|---|---|---|---|---|
| 0-baseline | 136.3 | 46.8 ms | 34.1 | 35.7 / 46.1 ms |
| a +GHOST DISTURBED | 136.4 | **46.9** ✗ | 38.7 | 36.6 / 40.3 ms |
| b +GHOST CORRUPTED | 138.5 | **33.6** ✗ | 31.8 | 31.3 / 33.0 ms |
| c +SPIKE CORRUPTED | 133.6 | **42.3** ✗ | 32.5 | 32.4 / 38.6 ms |

Seven rounds worried about point counts, merge policy, GPU memory, draw calls. **The rendering side is
a non-issue** — 136 avg FPS (2.4× the ≥55 bar) with 3M points and jitter+flicker over the whole merged
buffer, i.e. the Q#6-(a) worst case. **The blocker is Formula 2's CPU sampling pass: 31–37 ms/pass**,
~2× the entire 16.6 ms frame budget, one un-amortized lump every 0.5 s. Pass max tracks frame max
almost exactly — *the pass is the spike*. CPU-bound ⇒ worse on min-spec ⇒ **AC-P01's max-frame bar is
unmeetable with Formula 2 as specified on any hardware.** Elevates round-7's "no amortization Plan B"
from recommended to **BLOCKING (total now 10)**, and confirms that AC-P01 never tested what turns out
to be the dominant cost in the system. **It is Formula 2 again — 6 of 7 rounds — now failing
empirically rather than on paper.**

**NOT settled — blocker 5 stays open.** Type B vs Type C: direction shows in the averages (B 32.4 vs
C 31.3 ms) but **baseline, with no entity at all, had the highest max (46.8 ms)**. Variance swamps the
effect; scenario 0 likely absorbed JIT/GC warm-up. Needs repeat runs with randomised order.

**Settled / new:**
- **Memory concern RETIRED** — 40.2 MB CPU-side, 64.2 MB heap vs 8 GB. Point count is a fine proxy.
- **Cost bound (blocker 3):** actual **418 tiles / ~530k pts** — frustum cuts ~70%, so both round-7
  estimates overshot tile count. At legal-max density (D=2000×W_s=1.5) it scales ~3.2× to ~1.7M/pass,
  so the extreme-tuning concern is directionally right.
- **NEW — tile index build = 87 ms** (1,156 tiles, 5.8 MB). **Breaks AC-E04's "within the same frame"
  BASE rebuild** if the index rebuilds with it. Q#6 option (a)'s hidden cost now has a price tag.
- **NEW (Q#1 T4) — the near-plane Edge Case is unachievable as written.** GDD predicts "solid black
  void fills the viewport"; measured **70.8% of the view is still points** — you see *through* the void.
  Core Rule 6 never specifies `material.side`; r171 defaults to `FrontSide`, so the capsule interior
  writes no depth. `DoubleSide` gives 100% background, exactly as predicted. ADVISORY.
- **Lead for the Formula 2 rebuild (not applied):** the pass tests *every* point per active tile, but
  density estimation doesn't need that — subsampling ~5% per tile is statistically adequate at ~20×
  less cost. The rebuild may be far cheaper than these numbers imply.

### Files touched
`design/gdd/reviews/point-cloud-renderer-review-log.md` (round-7 entry + addendum),
`design/gdd/systems-index.md` (PCR row → MAJOR REVISION NEEDED; **2 new Open Cross-System Items** —
A-V3 flicker-ceiling violation, undeclared Level Design dependency), `prototypes/q7-perf/*`,
`prototypes/q1-occluder/*`. **`design/gdd/point-cloud-renderer.md` deliberately UNTOUCHED.**

### NEXT
1. ~~Run both prototypes~~ **DONE** (see Prototype results above). Still worth a re-run on actual
   min-spec hardware for the AC-P01 FPS bar, and a randomised-order re-run to settle blocker 5.
2. **One dedicated Formula 2 session** (fresh context, nothing else in it): rebuild the detection model
   from real data sources; decide the coverage question; delete the derived cost arithmetic in favour
   of a normative per-pass budget (CD ruled that arithmetic ADR-work, not GDD-work — it has broken twice).
3. **One consolidated mechanical pass** (fresh context, after 1 and 2): blockers 2, 4, 5, 6, 7, 8 + the
   addendum + the 8 recommended. All mechanical — but per the ruling, *not* in the session that reviews them.
4. Then round 8, once, with prototype numbers in hand. **CD's exit criteria:** blockers (a) fewer than
   five, (b) none introduced by tracks 2–3's own edits, (c) none in Formula 2. If Formula 2 blocks again,
   the honest conclusion is that CPU-side density anomaly detection is the wrong mechanism for this tell.

---

## 2026-07-25 (Entity System rounds 2+3) — Entity System #9 re-reviewed twice; round-3 found ZERO structural issues; AC 50→65; round-4 re-review required

**NOTE ON REPO STATE:** this entry covers **two** review rounds. Round 2 (earlier today, separate
session) was never committed — its changes were still in the working tree when round 3 started. This
quicksave commits both together. That's why `entity-system.md`'s diff is ~839 lines.

### Round 2 (earlier session, 2026-07-25) — 11 blockers
Full-mode `/design-review`, 5 specialists + creative-director. Verdict NEEDS REVISION; all 11 fixed
same session. Headline was **structural**: no event ever broadcast Type B's or Type C's position after
the spawn frame, so Point Cloud Renderer had no way to draw `ENTITY_SPIKE`/`ENTITY_GHOST` once either
moved. Fixed by adding **Core Rule 11 + `entity:position {position}`** (latest-value, Type B/C only,
AC-ES47). Also: `dwell_half` load guard, Rule 4 cross-implementation golden fixture (AC-ES51), Type C
arrival clamp (AC-ES54), RNG draw ordering (AC-ES52), ring-buffer sizing tied to `type_c_trail_delay`
(AC-ES53), AC-ES18/19 rewritten (both were passable by a no-op implementation),
`entity_transform_min_delta` knob, Type A/B audio direction drafted. AC 50→58.

### Round 3 (this session, 2026-07-25) — 4 blockers, **zero structural findings**
Full-mode `/design-review`, **7 agents**: game-designer, systems-designer, ai-programmer, qa-lead,
audio-director, **ux-designer (first-ever UX pass on this GDD)** → creative-director synthesis.
Verdict **NEEDS REVISION**; all 4 blockers + 6 recommended fixed same session.

**CD's convergence argument (explicit, not assumed):** blocker *character* is narrowing — round-1
structural (div-by-zero, unspecified RNG layer), round-2 structural (no position channel at all),
**round-3 none**. Every round-3 blocker is a config guard, a wording fix, or one missing formula. The
opposite of Point Cloud Renderer's round-5 escalation profile. Not APPROVED only because B2 was real
underspecification and the doc's own coverage claim was false.

**The 4 blockers:**
1. **Unguarded declared invariants** — `0 < I_min < I_max` (F3) and `SPEED_MAX > SPEED_BASE` (F2) were
   declared in variable tables exactly like the two rounds 1–2 guarded, but nothing enforced them.
   Neither NaNs: they fail by **silent inversion** (retarget gets *rarer* as `e` rises; Type C gets
   *slower* as `e` rises). → load guards + AC-ES55/ES56, plus a **guard-policy note** distinguishing
   guarded invariants from advisory safe ranges.
2. **Room-selection weighting had no formula** — Rule 5 was prose only; old AC-ES10/ES11 were passable
   by a hard step function and by "2× the nearest room, uniform among the rest". → **Formula 4**
   authored: `w_i = (d_i + ε)^−k` + Stage-2 anomaly lerp to certainty; new knobs
   `room_weight_exponent` (1.5) / `room_distance_epsilon` (0.5m); AC-ES10/ES11 rewritten (≥5 rooms,
   ≥5 `e` samples, ±0.02 vs formula) + AC-ES10b pure-math check. **Overruled Open Q#3's own
   "not blocking" self-assessment** — kept the item as a documented caution rather than deleting it.
3. **Two variable-table wording contradictions** — `dwell` described as "uninterrupted" while Reset
   Behavior mandates decay-not-reset; Rule 7 "up to `type_b_step_distance`" vs AC-ES19's exact
   magnitude. Both fixed *at the table/rule* (where an implementer looks), not clarified downstream.
4. **`session:end` + retarget on the same tick was unordered** — the two legal orders diverge
   observably (extra spawn/despawn pair + 2 consumed RNG draws → desynced seeded sequence). →
   `session:end` wins, retarget discarded, zero draws. New Edge Case + AC-ES58.

**Recommended also applied (6):** AC-ES45/ES45b before/after rewrite (same vacuous-pass defect round-2
fixed in ES18/19); config-guard **acceptance** ACs (ES57b — every guard AC only tested rejection, so
a reject-everything impl passed); reveal-mid-manifestation weighting (ES60, Integration); 3.52 m/s
ceiling restated as **tuning-dependent** (safe-range maxima multiply to **7.5 m/s**, 4.7× MOVE_SPEED —
the two ranges were set independently, product never evaluated); audio asymmetry declared deliberate +
**Type B stated to have no functional audio tell**; Open Q#1 given the delivery-floor finding, Open Q#5
given 2 concrete playtest checks.

**Director's call — Rule 9 Type-C asymmetry = ACCEPTED ASYMMETRY, documented, not redesigned.**
`game-designer` and `ux-designer` converged from opposite directions: one that it *under-delivers* the
fantasy's self-declared "sharpest edge" for A/B-heavy sessions, the other that it *leaks* Type C
identity to a player who learns the pattern. CD ruled the tell fires only at NEAR/ADJACENT inside a
locked scan — strictly inside the window the fantasy already concedes ("until it's already close") —
and is inference under duress (intensity-only bar, no speed readout, distorting cloud). Symmetry is
unaffordable: Type A is stationary by definition, Type B's immunity is a round-1 decision protecting
its own tell. The *real* finding is the delivery floor → folded into Open Q#1 with a playtest design
test ("if testers who never saw Type C call it *atmospheric* rather than *hostile*, the floor is
required"). ~20% of short sessions never roll Type C under the uniform 1/3 placeholder.

**User decisions (AskUserQuestion):** inverse-power weighting family (over softmax / knob-free linear);
Type B step magnitude **always exactly** `type_b_step_distance` (direction random only —
uniform-on-circle); `SPEED_BASE < MOVE_SPEED < SPEED_MAX` stays **advisory, deliberately unguarded**
(MOVE_SPEED is FPS Movement's knob; not worth coupling two config loaders for an invariant that
degrades gracefully) — documented so the inconsistency reads as intentional.

**CD overruled 4 specialists:** ai-programmer's hitch-dependent Type C path (real, unfixable at GDD
level, ~35cm corner-cut) → nice-to-have; audio-director's request that Entity constrain Audio's
de-emphasis curve → declined, would legislate another domain; ux-designer's `SCAN INTERRUPTED`
placeholder + FAR/MEDIUM drift + tween treatment → reassigned to UI/HUD.

**AC count 58 → 65** (56 Logic + 9 Integration). 7 new, 4 rewritten in place. Verified: no duplicate
AC ids, counts match header.

**NEW cross-system item found in the main session's own structural pass (not by a specialist):**
`entity:position` is registered in `entities.yaml` (provisional) and declared in Entity's Downstream
table, but **Point Cloud Renderer's GDD has no inbound record of it** — grep-confirmed, zero
occurrences. Round-2's sibling event `entity:transform` *did* get a systems-index entry; this one was
missed. **Until Renderer records it, the gap round 2 believed it closed is still open on the receiving
end.** Added to systems-index Open Cross-System Items, owner Point Cloud Renderer (already in MAJOR
REVISION NEEDED, so it folds into that work).

**⚠ PROCESS PATTERN — read this before round 4.** Third consecutive round where the session that
*found* the issues also *fixed* them. Two defect classes have each slipped a manual pass repeatedly:
(a) the **Coverage Validation table's completeness claim** — overclaimed in rounds 2 AND 3; (b)
**"declared invariant with no load guard"** — round-1 `dwell_half`, round-2 `proximity_tier_medium_max`,
round-3 `I_min`/`I_max` + `SPEED_MAX`/`SPEED_BASE`. A standing caution naming both is now in the GDD
header. Round 4 should verify these two classes *directly* rather than trusting the document.

**Cross-file changes:** `systems-index.md` (Entity row → round-3 status; new `entity:position` open
cross-system item); `design/gdd/reviews/entity-system-review-log.md` (NEW FILE — rounds 2 and 3
entries). No `entities.yaml` change in round 3 — Formula 4's two knobs are single-GDD with no
cross-system reuse, same precedent as `coverage_dominance_ratio`.

**NEXT:** `/clear`, then `/design-review design/gdd/entity-system.md` fresh (**round 4**). Remaining
MVP GDDs awaiting independent re-review: Point Cloud Renderer (MAJOR REVISION NEEDED, round 5), FPS
Movement, Scan Mechanic, Win/Lose. Then `/gate-check pre-production`. All 9/9 MVP systems remain
Designed.

---

## 2026-07-17 (round 3) — Point Cloud Renderer independent re-review: 11 blockers fixed + test-tier doctrine amended; fresh round-4 re-review required

**What got done (this session):** ran `/design-review design/gdd/point-cloud-renderer.md` (full mode)
as the round-3 **independent** re-review. 5-agent adversarial panel (systems-designer, game-designer,
engine-programmer, performance-analyst, qa-lead) → creative-director synthesis.

**Verdict: NEEDS REVISION → all 11 blockers revised same session.** CD validated every round-2 fix
(no regression) but named the driving meta-pattern: **each round's fix breeds the next round's
blocker** (round-2's sampler rewrite + GPU-jitter move are exactly what produced round-3's top
blockers). Headline: **systems-designer AND game-designer INDEPENDENTLY found the Type B
detectability gap** — round-2 scoped ρ_obs to "BASE points," but ENTITY_SPIKE is a separate additive
layer (Core Rule 2), so a Type B spike never changes ρ_obs → σ≈0 → no event ever fires (same class as
round-1's undetectable void, now for Type B).

**11 blockers found and fixed:**
1. Type B undetectable → ρ_obs samples **BASE+ENTITY_SPIKE** (ENTITY_GHOST excluded; Type C is
   visual-only, fires no anomaly event) [user decision] + AC-D02.
2. ENTITY_GHOST/SCAN_MATERIALIZING render fully opaque without `transparent:true` → normative + AC-C04/
   C07/Visual-Audio [engine-programmer].
3. Signed σ payload = type oracle (neg⟺A, pos⟺B) → emit **magnitude |σ|** only [game-designer].
4. PROXIMITY_CORRUPTED "random colour flickering" fully unspecified → respec'd as **Formula 5**
   same-green **brightness** flicker (no hue shift, preserves uniform-green commitment) + 2 knobs +
   AC-D08 [user decision] [game-designer].
5. Div-zero guard regression: k_noise/A_tile (F2) + h/T (F4, no guard at all) → guards + AC-D06
   expanded + new AC-D07 [systems-designer].
6. AC-D03/E03 asserted non-deterministic per-point displacement → rewritten to assert deterministic
   `uJitter` uniform [qa-lead].
7. onBeforeCompile cache-key collision (BASE/SPIKE/GHOST identical PointsMaterials) → `customProgram
   CacheKey()` normative + AC-D03 clause [engine-programmer].
8. Type A occluder spawn/despawn lifecycle + static-scale-1.0 fallback untested → AC-ST04 + AC-ST05
   [qa-lead + game-designer].
9. "active detection tiles" undefined (cost claim unverifiable) → frustum ∩ `anomaly_sample_radius`
   (new knob 12m) [performance-analyst].
10. Q6 merge-all-buffer vs F3 jitter contradict (one bounding sphere → jitter/flicker runs over all
    1.5M pts every frame) → Open Q6 amended with 2 options, deferred to ADR [performance-analyst].
11. AC-P01 (density-budget thesis) had no ADR-blocking prototype gate → new **Open Q7** min-spec perf
    prototype, blocks ADR like Q1 [performance-analyst].

**User decisions:** (a) revise now → **fresh round-4 re-review** (not self-approve); (b) **amend
test-tier doctrine** (CD rec) — carve a WebGL-integration tier so AC-C08's numeric pixel-count stays
BLOCKING; (c) Type C excluded from density sampler (visual-only); (d) colour flicker respec'd as
same-green brightness, not cut.

**CD disagreement rulings:** game-designer's "three tells distinguishable by shape" DOWNGRADED to
prose fix (fantasy = no colour/label taxonomy, not perceptual identity; shape is Entity System's
concern); qa-lead's "demote AC-C08" OVERRULED → keep BLOCKING + amend doctrine.

**Cross-file changes:**
- `.claude/docs/technical-preferences.md` — new **WebGL-integration test tier** (Testing section).
- `.claude/docs/coding-standards.md` — "What NOT to Automate" carve-out: numeric buffer/render-target
  *counts* ≠ visual fidelity; allowed headless, may be BLOCKING, lives in `tests/integration/`.
- Prose: fantasy line → "no colour/label taxonomy"; Open Q5 growth relabelled "growing-void
  escalation" (distinct from §B static-recognition Anchor). Stale **"Amber" Type B → green**.
- Folded recommendeds: abort `current α→0`, `entity:transform` scale clamp [1.0,1.75), occluder's own
  `depthTest` asserted, materializing overlay added to AC-C07, F3 injection point (`transformed`).
- AC count **24 → 28** (C:8 D:8 E:6 ST:5 P:1).

**Current state:** point-cloud-renderer.md Status = In Design, round-3 revised, **fresh round-4
re-review pending — do NOT self-approve** (CD process condition; the same-session loop bred rounds 2
& 3's blockers). Full detail in `design/gdd/reviews/point-cloud-renderer-review-log.md` (round-3
entry, top). No `systems-index.md` status change (was already Designed).

**NEXT:** `/clear`, then re-run `/design-review design/gdd/point-cloud-renderer.md` in a **fresh
session** (round 4). Two Open Questions now gate the Point Cloud ADR: Q1 (occluder depth-cull
prototype) and **Q7 (min-spec perf prototype)** — plus the WebGL-integration harness must exist before
AC-C08 can run. Remaining MVP GDDs still awaiting independent re-review: FPS Movement, Scan Mechanic,
Entity System, Win/Lose. Then re-run `/gate-check pre-production`. **All 9/9 MVP systems remain
Designed.**

## 2026-07-15 (round 7) — UI/HUD independent re-review: 4 blockers fixed; Approved now gated on producer citation-hook, not doc content

**What got done (this session):** ran `/design-review design/gdd/ui-hud.md` (full mode) as the
round-7 **independent** re-review. Same 7-agent panel as rounds 3–6 (game-designer, systems-designer,
ux-designer, ui-programmer, qa-lead, audio-director → creative-director synthesis).

**Verdict: NEEDS REVISION → revised same session.** Round 6's 4 blockers held, but the
citation-integrity defect class recurred a **5th consecutive round** — two new instances slipped
through round 6's *dedicated* citation pass. qa-lead independently verified the AC count (60: 36
Logic + 16 Integration + 8 ADVISORY) and the 16-item Open-Q#5 blocked list — both exact.

**4 blockers found and fixed:**
1. **Line 195 citation defect** — "AC-UH16–19 test pool membership" miscites AC-UH19 (which tests
   tier-independent anomaly-density push, NOT pool membership; only UH16–18 test membership)
   [ui-programmer, review-lead-verified]. Fixed: repointed.
2. **Rule 2 first-tick cold-start = undisclosed 2nd exhaustiveness exception** — no AC covers the
   sentinel contract, yet the "exhaustive by construction" summary named only the Log panel; Rule 9's
   analogous sentinel *did* get an AC (UH52 zero-prior-fires) the same round [qa-lead]. Fixed:
   summary now names both disclosed exceptions.
3. **AC-UH59's "no grid break at any A-V2" is false** — it proves *ratio* invariance (trivial), but
   Rule 4's ceiling is *absolute* size; A-V2 is a floor-only spec (≥1.5×, no ceiling), so in-spec
   A-V2=3× → coverage at 5.25× base, never grid-validated [systems-designer]. Fixed: separated
   ratio-break from absolute-break; added an absolute font-size/container clamp (this-GDD-authorable);
   routed an A-V2 ceiling to `accessibility-requirements.md`; AC-UH59 extended to 2 parts.
4. **Rule 10 "readable frame / reaction-fairness floor / telegraphed" overclaims** a perceptual
   guarantee 16.6ms can't deliver, contradicting §B's "only in hindsight" anchor [game-designer +
   ux-designer, converged]. Fixed: reworded throughout to "input-lockout / race-condition guarantee"
   — mechanical claim (no Movement Violation on the reattach frame) kept; perceptibility reopened for
   /ux-design. AC-UH58 reworded (tag unchanged).

Secondary: Coverage Validation Rule 9 row now credits AC-UH54.

**AC count: 60 → 60** (no new AC — AC-UH59 extended in place; AC-UH58 reworded).

**The decisive finding (creative-director):** five consecutive rounds with the citation-integrity
class live, including two instances through round 6's *dedicated* citation pass, is a conclusive
controlled experiment — **manual review cannot close this class.** Approved must NOT be granted, and
**no round-8 manual citation pass** should be run, until the **producer** builds a mechanical
citation-check enforcement hook (routed since round 3). The blocker to closure is no longer in the
document — it's the absent tooling.

**Still pending outside owners:** producer (citation-hook + Open Q#5 jsdom/harness decision), FPS
Movement (Open Q#9 suspension + delayed-resume + interaction-patterns.md meta-pattern reconciliation),
Audio GDD #6 (escalating-drone commitment underpinning the flat-sting strategy).

**Recommended NOT applied (deferred):** commit a "shape" channel to ≥1 alert (AC-UH44 uses identical
text+position everywhere); tag AC-UH52 range PROVISIONAL; UH42/UH46 blocking-split inconsistency;
Infinity boundary in AC-UH49.

**All 9/9 MVP systems remain Designed.** This session was review, not new design content.

**NEXT:** UI/HUD is doc-complete on the authorable side. The real gate is the producer citation-hook
— that should be built before any Approved verdict or `/gate-check pre-production` re-attempt. The
other 5 MVP GDDs (Point Cloud Renderer, FPS Movement, Scan Mechanic, Entity System, Win/Lose) still
await their own independent re-reviews.

---

## 2026-07-12 (round 4) — UI/HUD independent re-review: 3 blockers fixed, Rule 10 rewritten

**What got done (this session):** ran `/design-review design/gdd/ui-hud.md` (full mode) as the
round-4 **independent** re-review — the confirm-the-3-prior-blockers pass that round 3 (same day,
earlier session) queued up. 6 specialists (game-designer, systems-designer, ux-designer,
ui-programmer, qa-lead, audio-director) ran in parallel, then creative-director synthesized.

**Verdict: NEEDS REVISION → revised same session.** All 4 round-3 blockers confirmed genuinely
closed (no relabeling). 3 new blockers found and fixed:

1. **Rule 2's dirty-check comparator was one level too shallow** for Scan Node's actual locked
   view-model shape (nested `displayPosition`, `nodesCompleted {X,Y}`) — a literal implementation
   would defeat AC-UH50 every tick, guaranteed not hypothetical [ui-programmer]. Fixed: structural
   deep comparison, SameValueZero scalars (NaN-safe), array length-and-pairwise equality.
2. **Rule 2's forced-write-on-reattach clause cited AC-UH50 as proof, but AC-UH50 never staged
   that scenario** — 4th confirmed instance of this project's recurring "prose cites an AC that
   never stages the scenario" defect [qa-lead]. Fixed: new AC-UH55.
3. **Core Rule 10's "total awareness trade" was mechanically a free safe-harbor, not a trade**
   [game-designer + audio-director]. Cross-checking Win/Lose's own AC-WL08 (Movement Violation
   needs a `player:position` delta) showed a stationary player during `DOLLHOUSE_OPEN` cannot
   trigger it, and no scan can run mid-modal — opening the dollhouse removed danger's
   *possibility*, not just its warning. **User re-decided** (new mechanical evidence, not
   re-litigation): **safe-while-open, trap-on-close.** Rule 10 rewritten — blackout scoped to
   UI-owned channels only; danger now explicitly lands on re-attach (first blind step can be an
   instant Movement Violation); A-A1/A-S1 "vacuous compliance" replaced with an honestly-labeled
   authored risk routed to `/ux-design`. Opened new **Open Q#9**: locomotion suspension during
   `DOLLHOUSE_OPEN` is a requirement placed on FPS Movement, unratified — that GDD currently
   defines no dollhouse-adjacent input state.

**7 recommended fixes also applied same pass:** debounce "last-fired" timestamp written only on
actual fire (a burst could otherwise silence stings indefinitely); Orchestrator AC-OR08 cross-link
pinning that end-of-tick audio evaluation must defer past the synchronous queued-event drain
(microtask), not run inside the `session:tick` handler itself; Open Q#5 flagging extended from 7
to 15 Integration ACs (was inconsistently applied); AC-UH12 rewritten as objective computed-style
checks; new AC-UH56 (replace-not-stack); `coverage_dominance_ratio` backfire fallback
pre-registered (→1.0 if playtest confirms manipulation-reads-as-manipulation); audio drone fallback
clause (flat-sting strategy voids to graduated sting if the Audio System GDD never authors the
drone it depends on).

**AC count:** 55 → 57 (33 BLOCKING Logic + 16 BLOCKING Integration + 8 ADVISORY).

**Files changed:** `design/gdd/ui-hud.md` (Rules 2/9/10, Formulas fallbacks, new AC-UH55/UH56, 8
more Open-Q#5 flags, Open Q#9 added), `design/gdd/reviews/ui-hud-review-log.md` (round-4 entry
appended), `design/gdd/systems-index.md` (UI/HUD status → In Review). Also ingested into
`LS_obsidian_context/` (73 pages now — new UI-HUD-Review-Log source page; updated UI-HUD,
FPS-Movement, Systems-Index, Coverage-as-False-Comfort, index, log).

**NEXT:** Round-5 independent re-review in a fresh session (`/clear` →
`/design-review design/gdd/ui-hud.md`) to confirm the 3 blockers are closed. FPS Movement's owner
should ratify Open Q#9 (small, reviewable amendment) — can happen in the same fresh session. Then
continue the remaining 5 unreviewed MVP GDDs (Point Cloud Renderer, FPS Movement, Scan Mechanic,
Entity System, Win/Lose & Ending), then `/gate-check pre-production` re-attempt.

---

## 2026-07-02 (architecture phase) — 6 ADRs written, review FAIL→CONCERNS, pre-prod gate FAIL

**What got done (this session, Desktop):** ran the full 12-task architecture backlog the
first `/architecture-review` (FAIL) surfaced. Owner drove it in "approve per ADR/artifact"
cadence (collaboration protocol relaxed for this run). **All 12 tasks complete.**

**Delivered:**
1. **Engine pinned** — `docs/engine-reference/three/VERSION.md` (r171); CLAUDE.md Engine
   Version Reference repointed from Godot → Three.js (fixes the governance gap).
2. **6 new ADRs** (all `Proposed` unless noted):
   - ADR-0002 Point Cloud Renderer — layer stack, BASE_SEALED accretion, Type A depth-only
     occluder **prototype-gated on OQ1 (r171, HIGH)** → stays Proposed until prototype passes.
   - ADR-0003 Per-Frame Budget — 16.6ms split, ~8ms CPU soft budget + GPU point-draw ceiling,
     dev frame monitor + queue tripwire.
   - ADR-0004 Movement + Input — FpsMovement(bus,camera,config), injected-dt update(),
     **native PointerLock API (not PointerLockControls)** so GDD formulas/ACs stay testable.
   - ADR-0005 Session Data Pipeline — one JSON per property (`data/properties/<id>.json`),
     single source w/ both estimated+authoritative node positions; Matterport tooling deferred.
     **Resolves Scan Node Q#4 / Floor Plan Q#3; unblocks Production.**
   - ADR-0006 Floor Plan — two-contract init, pure dollhouse mask, 2 desync structures
     (ring buffer + scan-state queue), per-door loop FSM + crossing detector; view-model
     transport deferred to UI/HUD ADR (preserves Core Rule 5).
   - ADR-0007 Scan Node — Map registry, coverage=V/S pure derivation (no cached counter),
     synchronous state-before-emit (AC-SN29), nodesCompleted vs coverage divergence.
3. **ADR-0001 → Accepted** (owner chose: only the round-4-reviewed one; 0002–0007 stay
   Proposed pending independent review).
4. **Re-run `/architecture-review`: FAIL → CONCERNS.** Coverage 4/5/33 → **42/42**, 0
   cross-ADR conflicts, engine consistent. Reports: `architecture-review-2026-07-02-rerun.md`,
   updated `traceability-index.md`.
5. **`/test-setup`** — tests/unit + tests/integration, smoke test green (vitest 1 passed),
   `.github/workflows/tests.yml` (npm ci → verify:registry → npm test). ESLint zone rule
   deferred until src/systems/** exists (ADR-0001c).
6. **`/ux-design`** — `design/ux/accessibility-requirements.md` (flags **A-V3 photosensitivity**:
   point-cloud flicker/jitter needs flash ceiling ≤3/s + reduced-distortion toggle) +
   `design/ux/interaction-patterns.md` (meta-pattern: the Vulnerable State).
7. **`/gate-check pre-production`: FAIL** — `production/gate-check-pre-production-2026-07-02.md`.
   Infra/architecture criteria (4–8) all green; blocked on **design-phase** work.

**Pre-production gate blockers (next phase):**
1. Design the **4 remaining MVP GDDs** — Scan Mechanic (#8), Entity (#9, high-risk),
   Win/Lose (#10, inverted-reward ending), UI/HUD (#12, owns deferred view-model transport).
2. Design-review + approve Point Cloud + FPS Movement (still "In Design").
3. ADRs for the 4 new systems + UI/HUD view-model transport; flip all system ADRs → Accepted
   (incl. ADR-0002 after OQ1 prototype).
4. Re-run `/architecture-review` → PASS.

**NEXT:** `/design-system` **Scan Mechanic (#8)** first — Point Cloud/FPS/Scan Node all
already reference its events (`scan:started`/`scan:captured`/`scan:capture_frame`/
`movement:scan_triggered`) as provisional upstream. Then Entity, Win/Lose, UI/HUD.

---

## 2026-07-02 (later session) — First `/architecture-review` (full): FAIL, ADR backlog established

**What got done (this session, Desktop):** ran the first full `/architecture-review`. It's the
gate between Technical Setup and Pre-Production. Loaded all 5 designed GDDs (Point Cloud, FPS
Movement, Floor Plan, Scan Node, Orchestrator) + the lone ADR-0001. TR registry was empty → this
run **establishes the requirements baseline: 42 TR-IDs** now in `tr-registry.yaml` (v2).

**Verdict: FAIL** — not a knock on the GDDs (they're rigorous), but the skill's definition:
Foundation + Core layer requirements are uncovered and the one ADR isn't Accepted.
- Coverage: 42 TRs → **4 ✅ / 5 ⚠️ / 33 ❌**. Only ADR-0001 exists, covering the Orchestrator's
  4 wiring decisions (TR-or-006/007/008/009) + partial touches on 5 more.
- **3 blocking issues:** (1) ADR-0001 is `Proposed`, not `Accepted` → all bus-dependent stories
  auto-blocked; (2) Foundation layer (Point Cloud Renderer incl. the HIGH-risk r171 depth-occluder
  OQ1, + FPS Movement) has zero ADR coverage; (3) **no Three.js engine reference exists** —
  `CLAUDE.md` + `engine-reference/` still describe Godot 4.6; r171 is pinned nowhere.
- **No cross-ADR conflicts** (only 1 ADR). **No GDD revision flags.**
- **Engine-specialist consultation skipped** (justified): ADR-0001 has "no engine API surface"
  (its own Knowledge Risk = LOW) — nothing for a specialist to challenge. Re-enable once a
  rendering ADR with real Three.js surface exists.

**Required ADRs (prioritised, in the report):** 1. Point Cloud Renderer arch (HIGH, resolve OQ1);
2. Per-frame budget allocation (MEDIUM); 3. Kinematic movement + PointerLock (LOW); 4. Session data
+ authoritative node-position pipeline (LOW, blocks Production — Scan Node Q#4 / Floor Plan Q#3);
5. Floor Plan + Scan Node system ADRs. Plus: pin the engine (add `engine-reference/three/VERSION.md`
r171, fix CLAUDE.md pointer) and flip ADR-0001 → Accepted.

**Files written (user approved all three):**
- `docs/architecture/architecture-review-2026-07-02.md` — full report.
- `docs/architecture/traceability-index.md` — coverage index + full 42-row matrix.
- `docs/architecture/tr-registry.yaml` — populated v2, 42 stable TR-IDs (pc/mov/fp/sn/or slugs).

**Pre-gate checklist — all ❌:** no `tests/unit`+`tests/integration`, no `.github/workflows/tests.yml`
(→ `/test-setup`); no `design/ux/accessibility-requirements.md`, no `design/ux/interaction-patterns.md`
(→ `/ux-design`). `/gate-check pre-production` not yet available.

**NEXT:** write the missing ADRs in fresh sessions (`/architecture-decision`), starting with Point
Cloud Renderer (Foundation, HIGH). Re-run `/architecture-review` after each to watch coverage climb.
Independently: flip ADR-0001 → Accepted; run `/test-setup` + `/ux-design` to clear the pre-gate ❌s.

---

## 2026-07-02 — Orchestrator round-4 `/design-review`: APPROVED + ADR-0001 (bus wiring) written

**What got done (this session, Desktop):** ran the round-4 independent `/design-review` on
Orchestrator (#5) — same 5 agents (systems-designer, qa-lead, lead-programmer, engine-programmer +
creative-director synthesis). Round-4 entry condition re-confirmed (`npm run verify:registry` → 14/0/5).
Verdict **APPROVED**. Then wrote **ADR-0001** resolving the OQ7/OQ9 implementation-architecture
deferrals. **Orchestrator is now Approved (MVP designed 5/9, approved 3/3 reviewed).**

**Round-4 review outcome (APPROVED, 0 blockers)**
- No new Core-Rule contradiction; all sibling-AC citations (AC-L09, AC-C06, AC-SN29, AC-E02) verified.
- 2 one-sentence **addenda applied same session**: (1) AC-OR01 evidence note gained a scope caveat —
  `verify-registry` checks **top-level** field names only (collapses `roomMeta:[{id,type}]` →
  `roomMeta`), so 14/0/5 proves top-level parity + self-contradiction absence, NOT nested parity
  (sufficient today; qa-lead find); (2) Rule 4 `groupAnchorIndex` pinned as a **single-pass** min
  (one Map populated during the queue snapshot) — the doc's O(1)/"no graph work in frame budget"
  claim was O(group-size) under a naive read (lead-programmer find).
- **OQ9 scope expanded** (engine-programmer): the ADR must also bound per-tick queue size + pin
  delivery-vs-`renderer.render()` ordering. **New OQ10**: pure-atomic override chains n≥3 (no directed
  edge) are undefined — CANNOT fire today (live bridge `scan:complete` is mixed) → design-gate on
  whichever future GDD (Entity/Win-Lose) first registers a 3-way atomic requirement.
- Specialist disagreement surfaced (OQ9 severity: lead-programmer non-blocking vs engine-programmer
  more-serious) → CD: lead-programmer for approval, engine-programmer for the ADR.

**ADR-0001 — Orchestrator Bus Wiring & Override-Table Storage (Proposed)**
Four decisions (all user-confirmed via widget):
- (a) **Manual composition root** — `src/main.js` constructs the one Orchestrator, injects `bus` via
  constructor (class modules) / `init(bus)` (flat modules). Rejected singleton + service-locator.
- (b) **Dedicated data module** `src/core/event-overrides.js` — hand-authored JS literal compiled once
  at construction ("compiled once" = module-load). Rejected entities.yaml codegen (no Vite codegen step).
- (c) **ESLint `import/no-restricted-paths`** zone rule (CI) enforces Core Rule 5 — no sibling
  `src/systems/**` imports. Rejected review-checklist-only (not a forcing function).
- (d) **Delivery pass BEFORE `renderer.render()`** every rAF frame (no one-frame lag for tick-driven
  visuals) + dev **perf-tripwire** warn at queue > 64/tick. Closes OQ8's render-ordering question.
- Registry: 5 stances written to `docs/registry/architecture.yaml` (event_bus interface; 2 forbidden
  patterns: direct_cross_system_import + module_singleton_bus; 3 api_decisions; orchestrator ≤0.3ms/frame
  + 60fps/16.6ms budget).

**Files touched:** orchestrator.md, systems-index.md, orchestrator-review-log.md (new round-4 entry),
docs/architecture/adr-0001-orchestrator-bus-wiring.md (NEW), docs/registry/architecture.yaml.

**Immediate next step:** ADR-0001 is `Proposed` — run **`/architecture-review` in a FRESH session**
(never same-session as authoring) to validate coverage and move it toward `Accepted`. OR proceed to
`/design-system` **Scan Mechanic (#6)**, next in design order. Stories referencing ADR-0001 stay
auto-blocked until it is `Accepted`.

---

## 2026-07-02 — Orchestrator round-3 `/design-review`: NEEDS REVISION → 6 blockers fixed + verify-registry tooling built

**What got done (this session, Desktop):** ran a full independent round-3 `/design-review` on
Orchestrator (#5) — 4 adversarial specialists (systems-designer, qa-lead, lead-programmer,
engine-programmer) + creative-director synthesis. Verdict **NEEDS REVISION (6 blockers)**; all
6 revised in-session, then built the round-4 entry-gate tooling the CD mandated. Orchestrator is
now **In Review — round-4 entry condition MET**, pending a round-4 re-review (now a machine-verify,
not a 4th human sweep).

**The 6 blockers (all fixed)**
1. `floorplan:loop` payload drift — Floor Plan's own GDD split 4-vs-3 on `toRoom`. Kept `toRoom`
   (CD ruling: producer's Core Rule prose is normative); patched Floor Plan ×4 incl. BLOCKING
   AC-C02, FPS Movement inbound; added Core Rule 1 self-contradicting-producer precedence clause.
2. `scan:integrity_*` registered as un-comparable `"{...}"` placeholders → declared `{count}` / `{}`;
   Scan Node now declares the empty payload explicitly.
3. AC-OR01 evidence note's "zero deltas" claim was false → corrected + OQ6 elevated.
4. Rule 4 mixed atomic+directed override group (`scan:complete` bridges the atomic pair AND the
   directed pair — LIVE, not hypothetical) had undefined `intraGroupRank` → defined (atomic-only
   members inherit partner rank; 2 new compile-time rejections); new **AC-OR33** co-queues all 3.
5. "Arrival index" never defined + AC-OR29 contradicted Core Rule 7 → defined arrival index =
   publish-call-time with **next-tick deferral** for mid-delivery publishes (user decision), added
   `subscribe()` reentrancy contract, re-targeted AC-OR29 to a latest-value event.
6. `session:tick elapsedSeconds` undefined → pinned as **capped-dt game time** (`dt_cap` 0.1s, same
   as FPS Movement; prevents tab-restore snapping Floor Plan's escalation to 1.0); new **AC-OR34**;
   `dt_cap` registered as a cross-system constant. New **OQ9** (DI wiring + override-storage ADR).
   AC count 32 → 34.

**verify-registry tooling (OQ6 RESOLVED — round-4 entry gate)**
- New `tools/verify-registry.mjs` (`npm run verify:registry`). Parses free-text `payload:` with a
  balanced-brace reader (no `payload_fields:` schema needed), diffs each event's field set vs. its
  producing GDD, and flags **producer self-contradiction** (the floorplan:loop failure mode).
  `--selftest` = 9 parser assertions.
- On first run caught **2 further drifts all 3 manual rounds missed**: `scan:complete` restated as a
  `{nodeId}` subset in 2 Scan Node rows; `renderer:anomaly_density` written 3 ways in Point Cloud.
  Both normalized. Final: **14 pass, 0 fail, 5 skip (provisional)**.
- Follow-up: fold into CI when `/test-setup` lands a workflow (no CI yet).

**Files touched:** orchestrator.md, floor-plan-system.md, fps-movement.md, scan-node-system.md,
point-cloud-renderer.md, entities.yaml, systems-index.md, orchestrator-review-log.md (new round-3
entry), package.json, tools/verify-registry.mjs (new).

**Immediate next step:** round-4 re-review of Orchestrator (`/clear` first — 5 agents need clean
context), OR proceed to `/design-system` Scan Mechanic (#6 in design order, MVP). Round 4 should be
short: run `npm run verify:registry` (passes) + confirm the 6 blocker fixes read cleanly.

---

## 2026-07-01 — Orchestrator GDD COMPLETE (MVP 5/9); 19-event family registered

**What got done (this session, Legion):** finished the Orchestrator (#5) GDD — the last
4 sections that were `[To be designed]` — and ran Phase 5. Orchestrator is now **Designed,
pending independent `/design-review`**.

**Sections completed**
- Visual/Audio + UI Requirements — both **N/A** (pure infrastructure; no pixels/audio/UI
  surface of its own).
- **Acceptance Criteria — 30, qa-lead validated.** qa-lead review returned NEEDS REVISION
  and caught the project's recurring patterns: 2 placeholders that named a guarantee without
  testing it (AC-OR02 cut, AC-OR05 rewritten as a real terminal-state test), and 4
  "rules-don't-compose" gaps (added AC-OR23 post-SEAL-drop × late-SEALED-subscriber same
  frame; AC-OR14 override-chain × unrelated FIFO; AC-OR29 late subscriber mid-override;
  AC-OR11 adversarial interleave). Added Logic/Integration labels per sibling-GDD convention.
- Open Questions — 5 (provisional-flag cleanup, Win/Lose trigger source, entity tier vocab,
  Rule-5 lint tooling, referenced_by maintenance).

**Key design decisions locked**
- Orchestrator = registration-not-invention; sole owner of `LOADING/ACTIVE/SEALED` lifecycle;
  `session:request_end{reason}` intake decouples "who decides game-over" from enforcement.
- Global FIFO + registered per-pair ordering overrides (Floor Plan AC-L09, Scan Node AC-SN29,
  Point Cloud AC-E02); stable-sort so 3-chains + unrelated events resolve correctly.
- latest-value cache vs discrete fire-and-forget (Core Rule 7); `session:end` sole cached
  discrete exception.
- **`floorplan:init` 2nd fire → REJECTED** (AC-OR21) — protects Scan Node's roster/coverage-
  denominator invariant at the bus level, not just by convention.

**Phase 5 — registry**
- entities.yaml: NEW **`events:` section, 19 cross-system events** registered with producer /
  consumers / payload shape / kind (latest-value vs discrete). 3 Orchestrator-owned
  (session:tick, session:end, session:request_end); 5 provisional (producers Scan Mechanic #8
  / Entity #9 undesigned). YAML parses clean (19 events, 3 formulas, 15 constants).
- systems-index: Orchestrator #7 → Designed; **MVP 5/9**; docs started 5.
- GDD status header → "Designed (pending independent /design-review)".

**Next step**
- `/design-review design/gdd/orchestrator.md` in a **fresh session** (sibling GDDs each took
  4 review rounds — budget for revision). Then `/consistency-check` (new `events:` section).
- After Orchestrator approval: Scan Mechanic (#6), Entity (#9). Provisional-flag cleanup pass
  on the 4 sibling GDDs once Orchestrator is Approved.

---

## 2026-07-01 — Floor Plan + Scan Node APPROVED; Orchestrator GDD 7/8 (in progress)

**Big picture:** both previously-designed core GDDs are now **Approved** via multi-round
adversarial `/design-review` (4 specialists + creative-director synthesis per round).
Consistency-check PASS across all 5 GDDs. Now mid-way through authoring Orchestrator (#5),
the event-bus hub. Also fixed 3 codex-reported prototype bugs earlier this session.

**Floor Plan System (#3) — APPROVED**
- 4 review rounds total: round 1 MAJOR REVISION (Player-Fantasy/mechanics gap), rounds 2-3
  NEEDS REVISION (cross-system contracts, interaction-matrix gaps), round 4 APPROVED-WITH-
  CONDITIONS → conditions closed same session. AC count 23→46.
- Key fixes across rounds: desync lags position marker (e²→e³ cubic), per-door loop cooldown,
  `loop_arm_floor` escalation floor, `w_t≤0.8` cap (closes "D_max only via trap" loophole),
  `D0<D_max` guard, dollhouse access = toggle key, **Interaction Matrix** subsection (structural
  fix for recurring "blocker lives at rule interaction" pattern), AC-E16 (dollhouse-open ×
  world-sim), AC-E17 (exactly one ANOMALY_FINAL — added during Scan Node review, cross-GDD fix).
- Full history: `design/gdd/reviews/floor-plan-system-review-log.md`.

**Scan Node System (#4) — APPROVED (unanimous, round 4)**
- 4 rounds: round 1 MAJOR REVISION → rounds 2-3 NEEDS REVISION → round 4 unanimous APPROVED.
  AC count 22→26.
- CD named the arc pattern: **"blockers live at the inheritance boundary"** — every round-1
  blocker was Scan Node failing to inherit/cross-ref a sibling-doc precedent (Floor Plan, or
  master GDD), not internal logic. And **"assert the what, don't prove the how"** — a fix would
  state a guarantee while the proof lagged a round (co-location → trust-valence; canonical
  source; AC-SN29 cited as proof it didn't test). Both closed by round 4.
- Structural fixes that should generalize to future hub docs: **Cross-System Invariants table**
  (Floor Plan's Interaction Matrix pointed outward at sibling docs); **DEFERRED-tracking table**
  with design-vs-implementation split + Owner/Resolve-when. `scan:coverage` named canonical over
  `scan:complete.coverage`; `coverage` = visually-dominant trust-bearing number (AC-SN31 DEFERRED);
  D-1 Auto-Typed Log hierarchy restored in Open Q#5.
- 1 tracked non-blocking fast-follow: Edge Case 11 (same-frame scan:captured race) AC.
- Full history: `design/gdd/reviews/scan-node-system-review-log.md`.

**Cross-GDD amendment:** Floor Plan amended twice during Scan Node review (AC-E17 exactly-one-
ANOMALY_FINAL guard; chained-reveal Edge Case wording corrected to bar duplication not placement).
Additive only, no Floor Plan re-review needed.

**Consistency check:** `/consistency-check` PASS — 0 conflicts, 5 GDDs, 3 formulas + 11 constants
all agree across source + referencing docs.

**Prototype bug fixes (earlier this session):** BUG-0001 (dt cap → AC-EC03), BUG-0002 (WASD stuck
after focus loss → blur/visibilitychange clear), BUG-0003 (HUD initial 0,0,0 → clamp+HUD out of
movement branch) — all fixed in `src/main.js`, `node --check` PASS, Vite loads clean. Status
"Fix Applied — Pending Manual Verification" (PointerLock needs real-browser user gesture; sandbox
preview can't verify). Reports updated under `production/qa/bugs/`.

**Orchestrator (#5) — IN PROGRESS, 7 of 8 required sections written**
- File: `design/gdd/orchestrator.md`. Done: Overview, Player Fantasy (pure infra, no fantasy),
  Detailed Design (7 Core Rules + session lifecycle LOADING/ACTIVE/SEALED + per-frame ordering +
  full Interactions table), Formulas (N/A — relay only), Edge Cases (9, incl. post-SEAL drop,
  late-subscriber cache, ordering override, unknown-event), Dependencies, Tuning Knobs (no
  gameplay knobs, 2 dev toggles).
- **Key design decisions:** Orchestrator = registration-not-invention (event names/shapes taken
  verbatim from the 4 sibling GDDs); sole owner of session lifecycle; `session:request_end{reason}`
  intake decouples "who decides game over" from "who enforces it" (Win/Lose undesigned);
  Global FIFO ordering + registered per-pair overrides (Floor Plan AC-L09, Scan Node AC-SN29,
  etc.); **latest-value cache vs discrete fire-and-forget** classification (Core Rule 7) for
  late subscribers; `session:tick`/`session:end` are the 2 events nothing produced before — now
  Orchestrator-owned.
- **STILL TO DO (4 sections):** Visual/Audio (likely N/A — no pixels), UI Requirements (likely
  N/A — no UI surface), **Acceptance Criteria** (the real remaining work — needs qa-lead per lean
  high-risk rule, testable GIVEN/WHEN/THEN for the 7 core rules + ordering + cache + lifecycle),
  Open Questions (incl. provisional-flag-cleanup follow-up on the 4 sibling GDDs).

**Next step**
- Resume `/design-system Orchestrator` — finish Visual/Audio + UI Requirements (both likely brief
  N/A), then Acceptance Criteria (spawn qa-lead, lean mode Section H high-risk), then Open Questions.
- Then Phase 5: register `session:*`/event-family in `entities.yaml`, self-check, `/design-review`
  in a fresh session.
- After Orchestrator: Scan Mechanic (#6), Entity (#7/#9).

---

## 2026-06-27 — Floor Plan GDD design-review (full) → MAJOR REVISION → revised

**What got done**
- Ran `/design-review design/gdd/floor-plan-system.md` in **full mode** — 4 adversarial
  specialists (game-designer, systems-designer, qa-lead, ux-designer) + creative-director
  synthesis. (Agents first died on a session-limit reset → resumed via SendMessage with
  context intact, not respawned.)
- **Verdict: MAJOR REVISION NEEDED.** Convergence across all 4 domains: Section B (Player
  Fantasy) promised horror the mechanics didn't deliver. Highest-confidence blocker (3/4
  reviewers): anomaly-reveal loop arm was permanent with no defined ARMED→DORMANT path.
- **Revised same session** (4 user decisions), then logged + index updated.

**Floor Plan revision — key decisions**
- Desync now lags the **player-position marker** (+ scan-state), not just the scan-state
  icon — this is what makes the anchor moment ("a room you already left") actually fire.
- Loop arming gated by **`loop_arm_floor`** (escalation floor, default 0.4); anomaly-reveal
  arm **re-arms above floor** after a **per-door** cooldown (was global → exploit closed).
- Desync curve **e² → e³** (truthful early, sharp late). Registry `desync_delay` expr updated.
- Weights made absolute (`w_t+w_c=1`, both-zero fallback). Coverage def pinned → closes
  floor-plan Open Q#2 (Scan Node owns `coverage = V/S`).
- **AC 23 → 34**: reworked untestable ACs (byte-identical / within-a-frame → unit-scope),
  added arm-by-reveal, clamp, normalization, per-door, position-marker, S=0/D0=0 guards.
- Deferred to dollhouse UX spec: access paradigm, KNOWN_STALE/CURRENT visual diff, marker
  visuals, colourblind coverage-ring. Open Q#6 added (§15-C2 loop-payload owner).

**State**
- Floor Plan status = **In Review (revised, re-review pending)**. Review log created:
  `design/gdd/reviews/floor-plan-system-review-log.md`.
- Scan Node (#4) still unreviewed.

**Next step**
- `/clear` → `/design-review design/gdd/floor-plan-system.md` (independent re-review, fresh
  session — expected to clear). Then review Scan Node (#4), `/consistency-check`, then
  `/design-system` Orchestrator (#5).

---

## 2026-06-27 — Scan Node System GDD complete (MVP 4/9)

**Cross-machine note**
- #4 was started in a separate session (Legion) but **never pushed**; that session was
  abandoned. #4 re-done fresh on **desktop** from scratch. If the old Legion session is
  still open, do NOT push from it — close it. No repo artifact from it exists to delete.

**What got done**
- `/design-system` (lean mode) authored **Scan Node System GDD** end-to-end:
  `design/gdd/scan-node-system.md`. All 8 sections + Visual/Audio + UI + Open Questions.
  **22 acceptance criteria** (18 Logic + 4 Integration), 1 formula + 2 derived metrics.
- Section D (systems-designer) + Section H (qa-lead) spawned per lean high-risk rule.

**Key design decisions (Scan Node)**
- Scan Node = **sole node-state authority**. It (not Scan Mechanic) emits the canonical
  `scan:complete` / `scan:abort` everyone listens for. Scan Mechanic only reports
  `scan:started` / `scan:captured`. (Provisional — confirm at Orchestrator #5 / Scan Mechanic #6.)
- **coverage = V / S**, S = count(STANDARD) + 1 anomaly node (NULL excluded), **fixed at init**.
  Escape (all standard, anomaly unscanned) tops at N/(N+1) < 100% (UI flags "incomplete");
  100% only by scanning the anomaly node = Completion Trap (§9). **This answers floor-plan Open Q#2.**
- **nodesCompleted UI counter uses a STANDARD-ONLY denominator** — deliberately diverges from
  coverage (escape player sees `12/12` AND `92%`). Flagged for creative-director at HUD GDD.
- Node types: STANDARD / ANOMALY_FINAL (scannable only after room reveal) / NULL (locked `[?]`).
- entityInFrame is RECORDED not detected — a valid scan that captures the entity STILL counts
  (the trap working as designed); sets entityEverCaptured for Win/Lose.
- `corruption_threshold` = 4 invalids → `scan:integrity_failure` (single fire).

**Registry** (`design/registry/entities.yaml`)
- NEW formula: `coverage` (source scan-node; referenced_by floor-plan `session_escalation`).
- NEW constant: `corruption_threshold` = 4.

**Systems index**
- #4 Scan Node → **Designed**. MVP designed = **4/9**. Added 3 Open Cross-System Items
  (nodesCompleted divergence for HUD, `scan:*` family for Orchestrator, plus existing entity-tier).
- Also committing untracked `.claude/agent-memory/ux-designer/` (dollhouse UX review from the
  floor-plan session — follows the already-tracked lead-programmer memory convention).

**rtk note (desktop):** `rtk` hook still broken (`rtk: command not found`) — all git run via
`/mingw64/bin/git` to bypass the hook rewrite.

**Next step**
- `/design-review` (fresh session) on floor-plan + scan-node (both unreviewed).
- `/consistency-check` across the 4 GDDs.
- Then `/design-system` **Orchestrator (#5)** — formalises `floorplan:*` / `scan:*` /
  `entity:proximity` event contracts (convergence point for 4 systems). Then Scan Mechanic (#6).

---

## 2026-06-27 — Floor Plan System GDD complete (MVP 3/9) + consistency PASS

**What got done**
- `/design-system` (lean mode) authored the **Floor Plan System GDD** end-to-end:
  `design/gdd/floor-plan-system.md`. All 8 required sections + Visual/Audio + UI +
  Open Questions. **23 acceptance criteria**, 2 formulas, 7 tuning knobs.
- `/consistency-check` full scan → **PASS, 0 conflicts** across all 3 GDDs.

**Key design decisions (Floor Plan)**
- Layout source: **curated pool of authored layouts** + runtime perception-stripping
  mutations (NOT procedural geometry). Seed code (§16-H2) selects a specific one.
- Divergence model: **one true layout + per-room view-state mask** — the dollhouse
  is a derived, lagging view (UNKNOWN → KNOWN_STALE → KNOWN_CURRENT).
- Looping geometry (§15-C2): **threshold teleport** — Floor Plan emits
  `floorplan:loop {targetPosition, targetYaw}`, FPS Movement applies the reposition.
- Anomaly reveal (§8): a **designated adjacent node completing**
  (`scan:complete {revealTriggerNodeId}`) unseals the room; dollhouse never shows it.
- Formulas: `session_escalation` e = clamp(w_t·t/T_session + w_c·coverage, 0,1);
  `desync_delay` = D0+(D_max−D0)·e² (quadratic — truthful early, degrades late).

**QA pass (qa-lead spawned for Acceptance Criteria)**
- Caught 3 coverage gaps + 5 untestable criteria. Added AC-D04 (desync growth),
  AC-E05 (SEALED freeze), AC-L05 (retroactive-loop suppression), AC-E06 (loopSpawn
  clamp), AC-E07 (chained reveals), AC-E08 (overlap AABBs). Rewrote AC-C02/C03/C06/
  C07/D02/D03 for testable observables. 17 → 23 criteria.

**Cross-system side-effects written**
- **FPS Movement GDD patched** — added `floorplan:loop` to its inbound interface
  (bidirectional consistency fix).
- **Registry** (`design/registry/entities.yaml`): +2 formulas (session_escalation,
  desync_delay), +2 constants (T_session 1500s, loop_trigger_tier NEAR);
  referenced_by += floor-plan on WALL_MARGIN, EYE_HEIGHT, proximity_tier_near.
- **Systems index**: Floor Plan → Designed; MVP 3/9; dollhouse UX note added.

**Flags**
- 📌 UX: dollhouse map needs `/ux-design` (`design/ux/dollhouse.md`) before UI/HUD epics.
- creative-director + CD-GDD-ALIGN pillar review skipped (lean) — review Player
  Fantasy manually before production.
- Entity tier vocabulary: concept §5 lists 5 proximity states; the event contract
  uses 4 (FAR/MEDIUM/NEAR/ADJACENT). Declare the canonical set when Entity (#9) is
  designed. (Not a conflict — informational.)

**Provisional contracts** (deps undesigned): Orchestrator `floorplan:*` events,
Scan Node `scan:complete`/node positions, Entity placement.

**Pipeline position:** 3/9 MVP systems designed.

**Next step:** `/design-review design/gdd/floor-plan-system.md` in a **fresh session**
(independent critique). Then `/design-system` for **Scan Node System** (#4, depends
on Floor Plan), then Orchestrator (#5).

---

## 2026-06-26 — Two MVP GDDs designed (Point Cloud Renderer + FPS Movement)

**What got done**
- `/design-system` (lean review mode) ran end-to-end for two systems back-to-back.
- **Point Cloud Renderer GDD** — COMPLETE: `design/gdd/point-cloud-renderer.md`. All 8
  required sections + Visual/Audio + UI + Open Questions. 19 acceptance criteria.
  4 formulas (scan materialize opacity ramp, anomaly sigma, proximity jitter, density).
- **FPS Movement GDD** — COMPLETE: `design/gdd/fps-movement.md`. All 8 sections +
  Open Questions. 18 acceptance criteria (qa-lead spawned). 4 formulas (frame delta
  with dt cap 0.1s, AABB clamp union-bounds, yaw, pitch with YXZ sign convention).
  Two modes: NAVIGATE (WASD 1.6 m/s + PointerLock) and SCAN_LOCKED (input revoked).

**Registry** (`design/registry/entities.yaml`)
- Point Cloud: 7 constants (base_density 900, density_budget_ceiling 1.5M,
  anomaly_sigma 2.5, scan_frame_duration 0.5, entity_influence_radius 5.0,
  proximity_tier_near, proximity_tier_adjacent).
- FPS Movement: 5 constants (MOVE_SPEED 1.6, EYE_HEIGHT 1.5, WALL_MARGIN 0.35,
  MOUSE_SENSITIVITY 0.0010, PITCH_LIMITS ±1.3963 rad).

**Key design decisions**
- Type A entity = invisible depth-only occluder mesh (not removed points) — Open
  Question, needs Three.js r171 prototype.
- Multi-room AABB = union of accessible room bounds (single rect); notched rooms =
  level-designer invisible blockers.
- Pitch ±80° not ±90° (gimbal). movementY negated (Three.js YXZ convention).
- dt hard-capped 0.1s (tab-restore anti-tunnelling; max 0.16m < WALL_MARGIN 0.35m).
- qa-lead flagged: dt must be a PARAMETER to update fn (testability for AC-EC03);
  AC-F04 pitch-sign is the likely first-pass inversion bug — test first.

**Pipeline position:** 2/9 MVP systems designed. systems-index.md updated.

**Next step:** `/design-system` for **Floor Plan System** (#3, Core layer, depends on
Point Cloud Renderer). Then Scan Node (#4), Orchestrator (#5). Eventually
`/design-review` on both completed GDDs in a fresh session.

---

## 2026-06-26 — Quicksave checkpoint (protocol live)

- Quicksave protocol confirmed operational and pushed (`ls_main`). No code/design
  changes since the previous entry — this is a continuity checkpoint.
- **Pipeline position:** `/map-systems` complete. Nothing in progress.
- **Next step:** `/design-system` for the first MVP system — start with **Point
  Cloud Renderer** (high-risk, prototype underway) or **Scan Mechanic** (core verb).
  Optional `/gate-check systems-design` first.

---

## 2026-06-26 — Project setup, stack pivot, GDD expansion, systems decomposition

**Repo / infra**
- Cloned `Donchitos/Claude-Code-Game-Studios` template into `last_scan project`.
- Main repo set to **github.com/magatron02/LAST_SCAN**, working branch **`ls_main`**
  (repo default; deleted the leftover `main` branch). `origin` points here.
- Multi-machine workflow: desktop + Legion laptop on the same repo.

**Stack pivot (Godot template → Three.js web game)**
- The template ships configured for Godot 4.6; the game (per GDD) is a **Three.js /
  WebGL web game**. Reconfigured `.claude/docs/technical-preferences.md` to the web
  stack and noted Godot/Unity/Unreal specialist agents are NOT used (route to
  engine-agnostic programmer agents). Updated CLAUDE.md Technology Stack too.

**Prototype — slice 1 (DONE, builds + runs)**
- Vite + Three.js scaffold. Files: `index.html`, `styles/ui.css`, `src/main.js`
  (PointerLock FPS + WASD, robot-gait speed, AABB room clamp), `src/pointcloud.js`
  (samples points on 6 inner box surfaces = LIDAR look). `vite.config.js` aliases
  `three/addons`. `npm run build` passes; dev server at localhost:5173. Title
  screen verified in preview (PointerLock can't engage in sandbox iframe — test in
  a real browser by clicking).

**GDD — expanded v0.1 → v0.3** (`design/gdd/LAST_SCAN_GDD.md`)
- v0.2 §15: depth-only preview, dollhouse desync, looping geometry, timestamp
  drift, auto-typed log, signal decay, redacted scan results, **inverted reward**.
- Inverted reward reworked §9/§10: **100% coverage = bad ending (Completion Trap)**
  via the §8 anomaly-room final node; **deliberately leaving the anomaly room
  unscanned = Escape**. UI never tells the player which ending they got.
- v0.3 §16: found-footage framing (viewer reveal, excised footage `[FOOTAGE
  MISSING]`, playback artifacts), scanner identity (self-diagnostic creep,
  mechanical memory), property variety/replay (personality, seed code),
  cross-session cycle meta via **localStorage** (incrementing unit ID, accreting
  log, house memory), audio depth (servo-whir heartbeat, EVP, silence-as-tell).
- §8 added the **Perception Stripping** principle: the floor plan is a rough early
  guide that degrades into unreliability; live scan data is the only ground truth.
  The unknown is the core horror lever.

**Systems decomposition (DONE)** — `design/gdd/systems-index.md`
- 13 systems, dependency-layered. Priorities: **MVP (9)** Point Cloud, FPS
  Movement, Floor Plan, Scan Node, Orchestrator, Scan Mechanic, Entity, Win/Lose,
  UI/HUD · **Vertical Slice (2)** Audio, Found-Footage Layer · **Alpha (2)**
  Persistence (localStorage), Cycle/Meta.
- Floor Plan (static degrading guide) and Scan Node (live authoritative state) kept
  as **separate** systems — per the perception-stripping principle.
- Circular dep **Entity ↔ Scan Mechanic** resolved via the Orchestrator event bus
  (publish/subscribe, no direct import).
- High-risk to prototype early: **Point Cloud + Entity rendering** (Type A = void of
  points, Type C = ghost second-room geometry), perception-stripping feel,
  found-footage artifacts.

**State**
- Done: repo set up, stack pivoted, prototype slice 1, GDD v0.3, systems index.
- Pending commit at time of writing: GDD §8 update, systems-index.md, CLAUDE.md
  edits, this worklog (being committed now on quicksave).

**Next step**
- Pipeline position: finished `/map-systems`. Next is `/design-system` for MVP
  systems in design order — start with **Point Cloud Renderer** (high-risk,
  prototype already underway) or **Scan Mechanic** (the core verb).
- Optional: `/gate-check systems-design` for a director sign-off before authoring GDDs.
