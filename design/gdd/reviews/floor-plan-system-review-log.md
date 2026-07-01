# Review Log — Floor Plan System

Tracks design-review history for `design/gdd/floor-plan-system.md`.

## Review — 2026-06-27 — Verdict: MAJOR REVISION NEEDED
Scope signal: L
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director (synthesis)
Blocking items: 6 | Recommended: ~8
Summary: Full 5-agent review found the GDD structurally complete but with a material
gap between the stated Player Fantasy and the mechanics — all four domains converged on
the same fault line. Most serious: `desync_delay` lagged only the scan-state icon, not
the player-position marker, so the anchor moment ("a room you already left") could not
fire (game-designer #1). Three of four reviewers independently flagged the same
state-machine hole: the anomaly-reveal loop-arm is permanent with no defined ARMED→DORMANT
path (systems-designer BF-2 / game-designer #9 / qa-lead MISSING-04). systems-designer:
`e²` curve does not achieve "truthful early, sharp late" (→ `e³`); weight normalization
contradicts the 0–1 range; global `loop_cooldown` is exploitable. qa-lead: 8 untestable/
missing ACs ("byte-identical", "within a single frame", missing arm-by-reveal / clamp /
normalization / per-door ACs). ux-designer: no diegetic "map is lying, not bugged"
priming; position-marker-in-unmapped-room undefined.
Prior verdict resolved: First review

### Revisions applied same session (2026-06-27) — re-review pending
User decisions (4): desync lags **position marker**; anomaly-arm **re-arms above
escalation floor**; desync curve **e³ cubic**; cooldown **per-door**.
- Rule 6 rewritten: desync lags player-position marker (+ scan-state); D0=0 instant case.
- Rule 7 + loop state table: per-door cooldown, `loop_arm_floor` escalation floor,
  defined ARMED→DORMANT (proximity clears / anomaly persists & re-arms above floor).
- Formula 2: `e²` → `e³`; examples + AC-D04/D06 recomputed; escape ceiling (~22.5s) noted.
- Formula 1: weights absolute (`w_t+w_c=1`), both-zero fallback; coverage def pinned (Q#2).
- AC: 23 → 34. Reworked AC-C02/C05/C06 (unit-scope), AC-E05; added AC-D02/D03/D07,
  AC-L06–L09, AC-E09–E11. Coverage contract (AC-SN22) ownership noted.
- Edge cases: S=0 reject, both-zero guard, ARMED-at-SEALED, unmapped-room marker hidden,
  loop+lag interaction. Tuning: per-door cooldown, `loop_arm_floor`, D_max sanity guard.
- UI: diegetic "instrument not bug" priming requirement; 12/12+92% diegetic treatment;
  room-mask transition flagged as cross-system contract for dollhouse UX spec.
- Open Q#6 added (§15-C2 owner + stub). Registry `desync_delay` expression → `e^3`.
- Deferred to dollhouse UX spec (`design/ux/dollhouse.md`): access paradigm, KNOWN_STALE
  vs KNOWN_CURRENT visual differentiation, estimate-vs-real marker visuals, colourblind
  coverage-ring fallback.

**Next:** independent re-review in a fresh session — `/design-review design/gdd/floor-plan-system.md`.

## Review — 2026-06-28 — Verdict: NEEDS REVISION

Scope signal: L
Specialists: none (independent Codex solo review; no subagents requested)
Blocking items: 6 | Recommended: 4
Summary: The prior major Player Fantasy blockers were substantially resolved, but
the solo re-review found implementation-contract conflicts introduced or exposed by
the later Scan Node GDD. The initial `floorplan:update` both withheld hidden rooms
and was expected to initialise ANOMALY_FINAL/NULL nodes; Floor Plan also lacked
inbound player-position/time/scan-lock contracts, continuous position lag was
conflated with discrete scan-state delay, tuning notes contradicted absolute weight
semantics, loops triggered unnecessary full geometry rebuilds, and dollhouse
freshness had no repeatable lifecycle.
Prior verdict resolved: Partially — emotional/design blockers resolved; cross-system
implementability blockers remained.

### Revisions applied same session (2026-06-28) — independent re-review pending
- Added one-time `floorplan:init` for complete internal node metadata; retained
  `floorplan:update` as renderable geometry only. Updated Scan Node reciprocal
  contracts and ACs.
- Added provisional inbound contracts for `player:position`, `session:tick`,
  `scan:coverage`, scan lifecycle, proximity, and session end.
- Split desync into a timestamped position ring buffer and discrete scan-state queue;
  rewrote AC-D05/E09.
- Restored absolute weight semantics throughout and removed stale `e²` wording.
- Removed redundant BASE rebuilds on loop; only actual geometry mutation emits a
  full-set update.
- Defined repeatable node/room freshness (`CURRENT → STALE → CURRENT`) and rewrote
  AC-C07 to avoid the nonexistent "scan moves node" behavior.
- Updated registry desync output range to the full configurable 0–120s envelope and
  refreshed systems/session tracking.

**Next:** independent re-review in a fresh session — `/design-review design/gdd/floor-plan-system.md`.

## Review — 2026-06-30 — Verdict: NEEDS REVISION

Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director (synthesis)
Blocking items: 6 | Recommended: 3
Summary: Independent 4-agent re-review found the round-1 and round-2 spine-level faults
(anchor moment, init/contract conflicts) genuinely resolved. Remaining blockers all sat at
**interactions between individually-correct rules** — the same pattern across all 3 rounds:
`w_t=1.0` broke the "D_max only via Completion Trap" guarantee under an otherwise-legal
config (systems-designer BF-1); `D0≥D_max` had no guard and silently flattened the desync
curve (BF-2); the COOLDOWN×anomaly-reveal-arm race was undefined (BF-3); 4 named Edge Cases
had zero AC coverage, most critically "loop fires while marker is lagged" — the exact Rule
6×7 intersection that caused rounds 1–2 (qa-lead); 3 state-table branches were untested by
inference only. creative-director recommended a structural fix (Interaction Matrix) rather
than relying on further rule-by-rule passes to keep finding the next interaction.
Prior verdict resolved: Yes — round 1 (Player Fantasy) and round 2 (cross-system contracts)
both held up under independent re-derivation.

### Revisions applied same session (2026-06-30) — independent re-review pending
User decisions (3): w_t **capped at 0.8** (`w_c≥0.2`); COOLDOWN×reveal **queues** (doesn't
override); dollhouse access paradigm **toggle key**, locked at GDD level.
- Formula 1: `w_t` range 0→0.8, `w_c` floor 0.2; escape-ceiling reworded as a structural
  guarantee (not just a default-weights observation); AC-D03 extended.
- Formula 2: `D0 < D_max` enforced at load; new Edge Case + AC-D08.
- Loop state table + Core Rule 7: reveal-during-COOLDOWN queues via permanent condition
  flag, read at the next cooldown-elapsed re-evaluation; AC-L12.
- New **Interaction Matrix** subsection (Detailed Design) — 10 cross-checked state pairs,
  the structural fix for the 3-round recurring-interaction-blocker pattern.
- AC: 34 → 43. Added AC-C08 (multi-node STALE), AC-D08 (D0<D_max), AC-L10/L11 (isolated
  arm/clear state assertions), AC-E12–E15 (stale-past-SEALED, loop-vs-lagged-marker,
  non-navigable interior, node-outside-AABB). Reworked AC-C03/D06/L01/E09 for testability.
- UI Requirements: dollhouse access paradigm locked to toggle key (divided-attention cost,
  not input friction) — GDD-level constraint, not deferred to `design/ux/dollhouse.md`.
- Player Fantasy: desync-vertigo and anomaly-reveal reconciled as two distinct beats, not
  one compounding glitch. Tuning Knobs: desync/loop pacing flagged as an interacting pair
  for vertical-slice playtest; `loop_trigger_tier`'s §8-locus-dilution noted as deliberate.
- Registry (`entities.yaml`): `session_escalation` and `desync_delay` notes updated for the
  new guards; `revised: 2026-06-30`.

**Next:** independent re-review in a fresh session — `/design-review design/gdd/floor-plan-system.md`.

## Review — 2026-06-30 (round 4) — Verdict: APPROVED-WITH-CONDITIONS → conditions closed same session
Scope signal: M
Specialists: game-designer, systems-designer, qa-lead, ux-designer, creative-director (synthesis)
Blocking items: 1 | Recommended: 4
Summary: Independent re-verification of all 3 round-3 BLOCKING fixes — systems-designer
re-derived each from scratch (w_t cap, D0<D_max boundary, COOLDOWN×reveal race) and
confirmed all genuinely closed; qa-lead re-checked all 43 ACs with no fabricated coverage
found. One condition: ux-designer flagged that the `dollhouse-open` state was introduced
in round 3's own revision pass but never run through the Interaction Matrix built that
same pass to catch exactly this gap — a process finding, not just a content one. Closed
same session: new Matrix row + UI Requirements bullet (panel fullscreen-blocking, world
simulation does not pause while open) + AC-E16. Bundled 4 cheap riders: AC-L13 (proximity
COOLDOWN re-arm), Matrix row 7 reworded to match AC-L03's literal scope, a concrete
falsifiable number for the desync/loop pacing note, Player Fantasy paragraph moved inline.
AC count 43→45.
Prior verdict resolved: Yes — all 6 round-3 blocking items independently re-verified closed.

**Status: Approved.** No further review round required — creative-director: "no fifth
full specialist panel is needed."

## Amendment — 2026-06-30 (during Scan Node System review)
Scan Node's first review (`scan-node-system-review-log.md`) surfaced a cross-GDD
invariant gap: Scan Node's `coverage = V/S` formula (`S = count(STANDARD)+1`) assumes
exactly one `ANOMALY_FINAL` node per property, but Floor Plan's data model + AC-E07
(chained reveals) permitted layouts with zero or multiple `ANOMALY_FINAL` nodes with no
load-time guard — silently breaking Scan Node's `S` invariant and propagating into this
doc's own `w_t≤0.8` "D_max only via Completion Trap" safety guarantee. Fixed: new
Edge Case + **AC-E17** (exactly one `ANOMALY_FINAL` enforced at load, mirrors AC-E11);
AC-E07 clarified that `revealTriggerNodeId` is always `STANDARD`, never `ANOMALY_FINAL`.
AC count 45→46. No re-review needed — additive guard only, doesn't alter existing
behavior. Status remains Approved.

## Amendment — 2026-06-30 (round 2 of Scan Node System review)
Scan Node's round-2 re-review found the new chained-reveal Edge Case bullet (added in the
amendment above) was accidentally over-strict: as literally worded it barred the layout's
one `ANOMALY_FINAL` node from ever living inside a chained-reveal room, when the only actual
requirement (per AC-E17) is that it never be *duplicated*. Corrected the wording to scope the
constraint to duplication, not placement. Wording-only fix, no behavior change, no AC edit,
no re-review needed. Status remains Approved.
