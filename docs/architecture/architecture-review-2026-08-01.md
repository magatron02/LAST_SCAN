# Architecture Review — 2026-08-01

- **Mode:** `/architecture-review` (full)
- **Engine:** Three.js r171 (WebGL2) — pinned at `docs/engine-reference/three/VERSION.md`
- **GDDs reviewed:** 9 · **ADRs reviewed:** 7 (1 Accepted, 6 Proposed)
- **Previous review:** `architecture-review-2026-07-02-rerun.md` (CONCERNS)
- **Verdict: FAIL**

> **Method note.** Technical requirements for the four newly-designed systems were extracted from
> each GDD's Core Rules + Interactions + Dependencies sections rather than full-document reads, to
> keep the review inside one context window. The Phase 5 engine-specialist subagent consultation was
> **skipped** by standing instruction; engine claims below were verified inline against the pinned
> reference and against the 2026-07-26 prototype results.

---

## 1. Traceability Summary

| | Count |
|---|---|
| Requirements at the v2 baseline (2026-07-02) | 42 |
| **New requirements registered this review** | **30** |
| **Total** | **72** |
| ✅ Covered by an owning ADR | 42 (58%) |
| ❌ **Gap — no owning ADR** | **30 (42%)** |

The traceability index has been reporting **"42 requirements, 100% covered, 0 gaps."** That was
accurate against a five-system project. **Four MVP systems have been designed since** and none had
TRs in the registry or an owning ADR. The 100% figure was stale, not wrong-at-the-time — but it is
exactly the kind of number that stops anyone looking.

| System | GDD | GDD status | TRs | Owning ADR |
|---|---|---|---|---|
| Scan Mechanic | `scan-mechanic.md` (736 ln) | Designed | **TR-sm-001..008** | ❌ none |
| Entity System | `entity-system.md` (1,644 ln) | In Review (round 4) | **TR-ent-001..008** | ❌ none |
| Win/Lose & Ending | `win-lose-ending.md` (586 ln) | Designed | **TR-wl-001..005** | ❌ none |
| UI / HUD | `ui-hud.md` (1,289 ln) | In Review | **TR-ui-001..009** | ❌ none |

Two Proposed ADRs explicitly defer decisions to *"the UI/HUD ADR (future)"* — **ADR-0006 (g)** and
**ADR-0007 (h)**. That ADR does not exist, and UI/HUD's GDD has since decided the question itself
(see C4).

Full requirement text for all 30 new TRs is in `tr-registry.yaml` (v3). The complete
requirement → ADR matrix is in `traceability-index.md`.

---

## 2. Cross-ADR / ADR-vs-GDD Conflicts

### 🔴 C1 — ADR-0004 does not know `movement:scan_released` (behavioural)

| | |
|---|---|
| **Type** | Integration contract |
| **ADR-0004 claims** | SCAN_LOCKED's exits are `scan:complete` / `scan:abort` → NAVIGATE (decision (d), Key Interfaces subscribe list) |
| **GDDs claim** | `fps-movement.md:99` state table gives the exit as **`movement:scan_released`** (Scan Mechanic, successful-capture path); `scan-mechanic.md` Core Rule 5 requires the lock to end the instant the 4th capture beat completes, with `PROCESSING`/`UPLOADING` running **unlocked** |

**Impact.** An implementer following ADR-0004 holds the player in SCAN_LOCKED through `PROCESSING`
and `UPLOADING` — roughly **2 s longer per scan**, on every scan, contradicting the GDD's explicit
locked-2.4 s / unlocked-2.0 s split. Not cosmetic: the unlocked post-capture window is where Scan
Mechanic's design puts the player back in control while the flavour phases run.

**Cause.** FPS Movement's GDD was amended on 2026-07-02 to consume the new event; ADR-0004 is dated
the same day and did not pick it up. Nothing since has compared them.

**Resolution options.** (1) Amend ADR-0004 (d) + Key Interfaces to add `movement:scan_released` as
the primary SCAN_LOCKED exit, keeping `scan:abort` as the abort path and dropping `scan:complete`
(no longer an unlock trigger per the GDD). (2) Fold it into the Scan Mechanic ADR when written, and
mark ADR-0004 as superseded on this point.

### 🔴 C2 — ADR-0005 says "single source, two readers"; there are three

| | |
|---|---|
| **Type** | Data ownership |
| **ADR-0005 claims** | Decision (a): "The file is the single source; **Floor Plan** reads geometry + estimates, **Scan Node** reads authoritative positions." Its architecture diagram shows exactly those two consumers |
| **GDD claims** | `scan-mechanic.md` Core Rule 1: Scan Mechanic **reads the property file directly at load** for `authoritativePosition`, explicitly *"independent of `floorplan:init`/`floorplan:update`"* — it needs true world positions for physical trigger/lock purposes, not the dollhouse's deliberately-diverging estimate |

**Impact.** Scan Mechanic's entire trigger mechanism (TR-sm-003, `capture_trigger_radius` against
`authoritativePosition`) depends on a read ADR-0005 does not sanction. An implementer building the
data layer to ADR-0005 exposes it to two systems and Scan Mechanic has no supported path to the
positions it needs.

**Note.** This is not obviously a Core Rule 5 violation — the GDD argues the property file is a
shared static resource, not a system import, and that reasoning is sound. The defect is that the
owning ADR does not record it. Left unrecorded, the ESLint zone rule and the data-layer design are
being built against different assumptions.

**Resolution options.** (1) Amend ADR-0005 (a) to name three readers and state the
static-resource-vs-system-import distinction normatively. (2) Route Scan Mechanic's positions
through a new bus event — rejected on its face: it would duplicate the estimate/authoritative
divergence into a third representation, the exact drift class ADR-0005 exists to prevent.

### 🟠 C3 — ADR-0003's frame budget is allocated against a stale system set

| | |
|---|---|
| **Type** | Performance budget |
| **ADR-0003 claims** | Five named per-frame consumers (input/movement 0.2 ms, bus delivery 0.3 ms, point-cloud jitter 2.0 ms, floor-plan tick 0.5 ms, other discrete 0.5 ms) under an 8.0 ms CPU soft budget |
| **GDDs claim** | **UI/HUD** Core Rule 2 mandates two polled view-model getters called **every render tick**, each followed by a **full-depth structural comparison** of the returned view model, plus conditional DOM writes. **Entity System** emits `entity:position` every tick for Type B/C, and Point Cloud Formulas 3/5 do per-frame CPU distance math off it |

**Impact.** Two per-frame consumers are unnamed and unbudgeted. Arithmetically there is headroom —
the named slices plus the anomaly sweep total ~4.0 ms against 8.0 ms — so nothing is broken today.
But an unbudgeted consumer that overspends is precisely what ADR-0003's frame monitor cannot
attribute, which is the entire reason the ADR exists ("no shared definition of who overspent").

UI/HUD's own GDD notes the compare "runs every tick against the 16.6 ms / 60 FPS budget" and bounds
its cost by asserting both view models are small — a correct instinct, but it is asserting against a
budget table it does not appear in.

**Resolution.** Add UI/HUD and Entity System slices to ADR-0003 (a) when their ADRs are written.

### 🟠 C4 — ADR-0006 (g) recommends the transport option UI/HUD rejected

| | |
|---|---|
| **Type** | Architecture pattern |
| **ADR-0006 (g) claims** | View-model transport deferred to the UI/HUD ADR; *"Recommended path: a latest-value `floorplan:viewmodel` event re-emitted on change"* |
| **ADR-0007 (h) claims** | Same deferral, same future ADR |
| **GDD claims** | `ui-hud.md` Core Rule 2 chose **composition-root DI** — direct references injected at construction, two getters polled per tick — and argues explicitly against the event ("would add 2 new latest-value events for what is fundamentally read-every-frame polling, not discrete notification") |

**Impact.** UI/HUD's GDD is doing the right thing — it records its choice as *"this GDD's
recommendation for its own future ADR to formalize."* But until that ADR exists, the two Proposed
ADRs are the more architecturally authoritative documents and they point the other way. An
implementer starting from ADR-0006 builds `floorplan:viewmodel`.

There is also an unresolved implementation detail: ADR-0001 (c)'s ESLint zone rule forbids
`src/systems/**` → `src/systems/**` imports. Whether UI/HUD's injected references are legal depends
on where UI lives in the final `src/` layout — ADR-0001 explicitly leaves the concrete globs until
"the first system is scaffolded." That decision now has a consumer waiting on it.

**Resolution.** Write the UI/HUD ADR (it is the highest-leverage missing ADR — it unblocks two
others' deferred seams), then amend ADR-0006 (g) / ADR-0007 (h) to point at it.

### 🟡 C5 — `renderer:anomaly_density` specified in four places, three disagreed — RESOLVED

| Artefact | Said | Correct? |
|---|---|---|
| `design/gdd/point-cloud-renderer.md` | `{sigma}`, magnitude only, sign stripped | ✅ (round-3 fix) |
| `docs/architecture/adr-0002` (f) | `{type, sigma}` | ❌ — **fixed 2026-08-01** |
| `docs/architecture/tr-registry.yaml` TR-pc-009 | `{type, sigma}` | ❌ — **fixed 2026-08-01** |
| `design/registry/entities.yaml` | `{sigma}` annotated **"signed"** | ❌ — **fixed by this review** |

**Why this one matters more than its severity suggests.** A `type` field or a signed value is a
deterministic entity-type oracle — negative can only mean Type A, positive only Type B — which
breaks Entity System's ratified "the player never learns which type" invariant at the event-contract
level. The GDD fixed this on 2026-07-15. Three downstream copies did not follow, and they were wrong
in **two different ways**, which is the signature of copies drifting independently rather than one
bad edit propagating. Seven GDD review rounds and two architecture reviews passed over it, because
GDD reviews read GDDs and nobody re-read the ADRs against them.

---

## 3. ADR Dependency Order

No cycles detected. Topological order:

```
Foundation (no ADR dependencies):
  1. ADR-0001  Orchestrator Bus Wiring          [Accepted]
  2. ADR-0005  Session Data + Node Positions    [Proposed]

Depends on Foundation:
  3. ADR-0002  Point Cloud Renderer             [Proposed]  (requires ADR-0001)
  4. ADR-0004  Movement + Input                 [Proposed]  (requires ADR-0001)
  5. ADR-0006  Floor Plan                       [Proposed]  (requires ADR-0001, ADR-0005)

Depends on the above:
  6. ADR-0007  Scan Node                        [Proposed]  (requires ADR-0001, ADR-0005, ADR-0006)
  7. ADR-0003  Per-Frame Budget                 [Proposed]  (requires ADR-0001, ADR-0002)

MISSING — nothing can be sequenced after these until they exist:
  •  UI/HUD ADR         ← ADR-0006 (g) and ADR-0007 (h) both block on it
  •  Entity System ADR
  •  Scan Mechanic ADR
  •  Win/Lose ADR
```

⚠️ **Every Proposed ADR except ADR-0001 is unresolved-by-dependency**: ADRs 0002–0007 all depend
transitively on ADR-0001 (Accepted ✅), but 0003/0006/0007 additionally depend on ADRs that are
themselves still Proposed. Per `docs/CLAUDE.md`, *"stories referencing a `Proposed` ADR are
auto-blocked"* — so **no implementation story can currently be written for any system except the
bus itself**.

---

## 4. Engine Compatibility Audit

**Version consistency: PASS.** All 7 ADRs name Three.js r171. No stale version references, no
contradictory post-cutoff API assumptions (all seven declare "Post-Cutoff APIs Used: None").
All 7 have an Engine Compatibility section — no blind spots.

**Findings:**

1. **⚠️ The engine reference library is a stub.** `docs/engine-reference/three/` contains **only**
   `VERSION.md` — no `breaking-changes.md`, no `deprecated-apis.md`, no `modules/`. The deprecated-API
   check specified by this skill **has no source and was skipped**. `VERSION.md` argues the knowledge
   gap is LOW (r171 predates the assistant cutoff), which justifies not mirroring the whole API — but
   it does not justify the absence of a deprecated-API list, and `VERSION.md` itself carries two
   open "must confirm against r171" items.

2. **🔴 `docs/CLAUDE.md` points at the wrong engine.** Its Engine Reference section reads
   *"Current engine: see `docs/engine-reference/godot/VERSION.md`."* This project is Three.js, and
   `technical-preferences.md` states the Godot references are **not authoritative here**. This is an
   instruction file that actively misdirects anyone authoring in `docs/`.

3. **🟠 ADR-0002 (c) omits `material.side` on the Type A occluder.** The recipe pins
   `MeshBasicMaterial { colorWrite: false, depthWrite: true, depthTest: true }` and `renderOrder`,
   but not `side`. The 2026-07-26 Q#1 prototype (test T4) measured that r171's default `FrontSide`
   leaves **70.8% of the view still showing points** when the camera is inside the capsule — the
   player sees *through* the void — and that `side: DoubleSide` yields the documented behaviour.
   Recorded in the renderer's review log; **absent from the ADR that pins the material**.

4. **🟠 ADR-0002's OQ1 prototype gate has been satisfied but not recorded.** The ADR still reads
   *"MUST be prototype-verified against r171 before this ADR is Accepted."* It was, on 2026-07-26:
   100% cull inside the silhouette, zero colour written, 120/120 viewpoints, via numeric
   `readRenderTargetPixels`. The ADR gives no indication its own gate is now clear.

---

## 5. GDD Revision Flags (Architecture → Design)

**None.** No GDD assumption conflicts with verified engine behaviour. The one candidate — the
renderer's near-plane void Edge Case — is an **ADR** omission (finding 3 above), not a GDD
assumption error: the GDD describes the intended behaviour correctly and the material spec that
fails to deliver it lives in ADR-0002.

*(The renderer GDD's own `#include <output_fragment>` defect, which does not exist in r171, is
already tracked as a round-7 addendum blocker in that GDD's review log and is scheduled for CD
track 3. It is not re-raised here.)*

---

## 6. Architecture Document Coverage

**Not assessable — `docs/architecture/architecture.md` does not exist.** `/create-architecture` has
never been run. There is therefore no document mapping systems to layers, no data-flow section, and
no API-boundary definition; the seven ADRs are the only architectural artefacts. Phase 6 skipped.

---

## 7. Verdict: **FAIL**

The existing architecture is not the problem. ADRs 0001–0007 are unusually consistent, well-argued,
and cross-referenced; the conflicts found are drift against documents written *after* them, not
internal incoherence.

It fails on this review's own criterion — **Core- and Gameplay-layer requirements with no
architectural coverage**:

### Blocking issues

1. **30 requirements across 4 MVP systems have no owning ADR** (Scan Mechanic, Entity, Win/Lose,
   UI/HUD). Two of these systems are named as blockers *inside* existing ADRs.
2. **C1 — ADR-0004 vs FPS Movement / Scan Mechanic**: a behavioural contradiction that changes ~2 s
   of player control per scan.
3. **C2 — ADR-0005 vs Scan Mechanic**: a system's core trigger mechanism depends on a data read its
   owning ADR does not sanction.
4. **No `architecture.md`** — nothing ties the ADRs into a system-level view.

### Required ADRs, most foundational first

| # | ADR | Why first |
|---|---|---|
| 1 | **UI/HUD** | Unblocks the seam ADR-0006 (g) *and* ADR-0007 (h) both defer to it; the GDD has already decided the substance, so the ADR is mostly ratification |
| 2 | **Entity System** | Most-depended-on undesigned system; owns the proximity-tier vocabulary every other system's thresholds are written against |
| 3 | **Scan Mechanic** | Resolves C1 and C2 in the same document |
| 4 | **Win/Lose** | Smallest surface; depends on Scan Node, which is already pinned |

### Non-blocking, cheap

- Fix `docs/CLAUDE.md`'s Godot pointer (one line, actively misleading).
- Record `side: DoubleSide` + the satisfied OQ1 gate in ADR-0002 (c).
- Stand up the WebGL integration harness — `tests/integration/` exists but is empty, and renderer
  AC-C08 is BLOCKING against it.
- Add a DOM test harness to `technical-preferences.md` Allowed Libraries (TR-ui-009) — UI/HUD's 60
  ACs cannot be verified without one.

---

## 8. Pre-Gate Checklist

| Item | State |
|---|---|
| `tests/unit/` | ✅ exists (smoke test present) |
| `tests/integration/` | ⚠️ exists but **empty** — renderer AC-C08's WebGL tier not stood up |
| `.github/workflows/tests.yml` | ✅ exists |
| `design/ux/accessibility-requirements.md` | ✅ exists |
| `design/ux/interaction-patterns.md` | ✅ exists |

`/gate-check pre-production` is **not** recommended while the verdict stands at FAIL.

---

## 9. Re-run Trigger

Re-run `/architecture-review` after each new ADR is written to confirm coverage improves. The
specific regression this review exists to catch — **a GDD and its ADR drifting apart with no gate
between them** — produced C1, C2, C4 and C5, all of which sat undetected for a month while the
traceability index reported 100% coverage.
