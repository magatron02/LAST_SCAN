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
