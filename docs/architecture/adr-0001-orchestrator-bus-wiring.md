# ADR-0001: Orchestrator Bus Wiring & Override-Table Storage

## Status
Accepted

> Accepted 2026-07-02 — ratified after the round-4 Orchestrator design-review
> (5 specialists) and owner sign-off. Implementation-validation items (ESLint
> zone rule failing a sibling import in CI, the perf tripwire, and the
> delivery-before-render harness) remain to be exercised once `/test-setup`
> lands the CI workflow — they validate the implementation, not the decision.

## Date
2026-07-02

## Engine Compatibility

| Field | Value |
|-------|-------|
| **Engine** | Three.js (WebGL2) — vanilla JS ES modules + Vite (no game engine) |
| **Domain** | Core |
| **Knowledge Risk** | LOW — no engine API surface; decision is JS module/wiring architecture, not a Three.js or Godot API choice. (Project's Godot engine-reference is explicitly NOT authoritative here — see `technical-preferences.md`.) |
| **References Consulted** | `design/gdd/orchestrator.md` (OQ7, OQ9, Core Rule 5, Rule 4), `.claude/docs/coding-standards.md` (DI-over-singleton mandate), `.claude/docs/technical-preferences.md` (allowed-libraries list) |
| **Post-Cutoff APIs Used** | None. Relies only on `Array.prototype.sort` stability (ES2019+, universally shipped) and `requestAnimationFrame` (baseline WebGL2 target). |
| **Verification Required** | (1) Import-boundary lint actually fails a deliberate sibling import in CI; (2) dev perf-tripwire fires when a tick queue exceeds the threshold; (3) delivery pass completes before `renderer.render()` in an integration harness. |

## ADR Dependencies

| Field | Value |
|-------|-------|
| **Depends On** | None (first ADR). |
| **Enables** | Implementation of `orchestrator.js` and every consuming system's stories (Point Cloud Renderer, FPS Movement, Floor Plan, Scan Node, and all undesigned MVP systems). |
| **Blocks** | First bus implementation and all consuming-system implementation until this ADR is `Accepted`. Per `orchestrator.md` OQ7/OQ9, this is a hard prerequisite. |
| **Ordering Note** | Must reach `Accepted` before `/create-epics` / `/create-stories` run for any bus-dependent system, or those stories embed an unresolved wiring pattern. |

## Context

### Problem Statement
`design/gdd/orchestrator.md` is Approved (round-4 independent re-review, 2026-07-02) but deliberately defers four implementation-architecture questions to an ADR — the GDD owns event contracts and delivery *semantics*, not wiring. These four questions (OQ7 + OQ9 + round-4 engine-programmer additions) must be pinned before any system is built against the bus, because five implementers left unguided will invent five incompatible patterns. This ADR resolves all four.

### Constraints
- **No DI container** — the allowed-libraries list (`technical-preferences.md`) is `three`, `PointerLockControls`, `GLTFLoader`, Vite, Vitest, Web Audio. No InversifyJS/tsyringe/etc.
- **DI over singletons** — `coding-standards.md` mandates dependency injection and unit-testable public methods; a module-level singleton bus is explicitly undesirable (it makes most of the 34 AC-OR tests order-dependent and blocks consumers from mocking the bus).
- **Vanilla ES modules + Vite** — no build-time codegen step currently exists; "compiled once at build time" (Rule 4) must resolve to something real in this stack.
- **60 FPS / 16.6 ms frame budget** — the per-frame delivery pass runs synchronously inside `requestAnimationFrame`.

### Requirements
- A single Orchestrator instance per session, reachable by ~7+ gameplay modules.
- The static override set (Rule 4 directed + atomic edges) compiled exactly once, never per-tick.
- A forcing function for Core Rule 5 ("no direct imports between gameplay systems — the bus is the only channel") — not left to review discipline (the same human-audit failure mode that missed registry drift for three review rounds).
- A bounded, observable per-tick delivery cost, and a fixed position for the delivery pass relative to `renderer.render()`.

## Decision

Four decisions, one per deferred question.

### (a) Bus wiring — Manual composition root
`src/main.js` is the sole **composition root**. It constructs the single `Orchestrator` instance and injects it into every gameplay module:
- **Class modules** (`Scanner`, `FloorPlan`, etc.) receive `bus` as a **constructor parameter**.
- **Flat function modules** receive it via an exported **`init(bus)`** called once from `main.js`.

No module imports a shared bus singleton; no module constructs its own Orchestrator. This satisfies the DI-over-singleton mandate and keeps every AC-OR test able to construct a fresh instance.

### (b) Override-table storage — Dedicated data module
The static override set lives in **`src/core/event-overrides.js`** as a hand-authored JS literal (the directed `(before, after)` pairs and atomic `{a, b}` sets from Rule 4). `Orchestrator`'s constructor calls the Rule-4 compile function on this literal **once at module-load / construction time** — this is the concrete meaning of Rule 4's "compiled once, never at runtime." "Extended by a future GDD" = edit this literal and reload; there is no runtime `registerOverride()` API. No Vite codegen step is introduced (rejected below); the literal is the single source, kept adjacent to the bus but out of `orchestrator.js` so config is separable from logic.

### (c) Core Rule 5 enforcement — ESLint `import/no-restricted-paths`
An ESLint zone rule forbids any module under `src/systems/**` (gameplay systems) from importing another sibling under `src/systems/**`. The only permitted cross-system channel is `src/core/orchestrator.js`. This is a config-only forcing function run in CI (once `/test-setup` lands the workflow). It supersedes OQ4's "open tooling choice" framing and satisfies OQ7's requirement for a real forcing function rather than review discipline. Note: the exact zone globs depend on the final `src/` layout — this ADR fixes the *mechanism*, and the concrete glob paths are set when the first system is scaffolded.

### (d) Delivery-vs-render ordering + per-tick perf tripwire
Within each `requestAnimationFrame` callback, the order is fixed:
1. Orchestrator's **full delivery pass** (snapshot → stable sort → dispatch all queued events: `player:position`, `session:tick`, then sorted queue) runs **first**;
2. **then** `renderer.render(scene, camera)`.

All state settles before the frame is drawn, so a `session:tick`-driven visual consumer gets same-frame visuals with **no one-frame lag**. This closes OQ8 for the render-before-vs-after question (the render-*loop* internal split remains the consuming GDD's concern only if it needs sub-pass ordering).

A **dev-only perf tripwire**: if a single tick's delivered-queue length exceeds a threshold (`PERF_TRIPWIRE_QUEUE_MAX`, default 64), `console.warn` once naming the tick's event mix. This is a development diagnostic (stripped/`false` in prod like `warnOnDroppedEvent`), not a runtime cap — it surfaces an unbounded-`n` regression (e.g. a future Entity System firing per-entity `entity:proximity` for a large roster) before it silently eats frame budget, without changing delivery correctness.

### Architecture Diagram
```
                    src/main.js  (composition root)
                          │ constructs
                          ▼
   ┌─────────────────  Orchestrator  ─────────────────┐
   │  compiles src/core/event-overrides.js ONCE       │
   │  owns session state machine (LOADING/ACTIVE/…)   │
   └──────────────────────────────────────────────────┘
       ▲ init(bus) / new System(bus)      │ delivers events
       │ (injected by main.js)            ▼
  ┌────────────┬────────────┬────────────┬───────────┐
  │ FloorPlan  │  Scanner   │ FPS Movmt  │ PointCloud │   ← src/systems/**
  └────────────┴────────────┴────────────┴───────────┘
        ✗ ESLint import/no-restricted-paths forbids
          any arrow BETWEEN these boxes (bus is the only channel)

  rAF frame:  [ bus.deliverTick() ]  →  [ renderer.render() ]
```

### Key Interfaces
- `new Orchestrator(overrideSet, { warnOnDroppedEvent, cacheLatestValues, perfTripwireQueueMax })` — constructor-injected, per-instance config.
- `bus.publish(name, payload)` / `bus.subscribe(name, handler)` — the pub/sub surface (semantics owned by `orchestrator.md`).
- `System(bus)` constructor param **or** `init(bus)` export — the injection contract every consuming module must expose.
- `src/core/event-overrides.js` default export — `{ directed: [[before, after], …], atomic: [[a, b], …] }`.

## Alternatives Considered

### Alternative 1: Module-singleton bus (`export const bus = new Orchestrator()`)
- **Description**: A shared instance imported directly by every module.
- **Pros**: Zero wiring; simplest to write.
- **Cons**: Violates `coding-standards.md` DI mandate; makes the 34 AC-OR tests order-dependent (shared cached latest-value + session state leak across tests); blocks consumers from mocking the bus.
- **Rejection Reason**: Directly forbidden by coding standards and would break the GDD's own test-isolation guarantee (Tuning Knobs § "fresh Orchestrator instance per test").

### Alternative 2: Service-locator object
- **Description**: A global registry object modules pull the bus from.
- **Pros**: Less explicit wiring than a composition root.
- **Cons**: Still global mutable state (singleton by another name); hides dependencies; same test-isolation problems.
- **Rejection Reason**: Reintroduces the singleton anti-pattern the DI mandate exists to prevent.

### Alternative 3: Build-time codegen of the override set from `entities.yaml`
- **Description**: A Vite plugin generates `event-overrides.js` from the registry at build.
- **Pros**: Single source of truth (registry).
- **Cons**: No build-codegen step exists today; adds tooling; fails at *build* time rather than page-load, a different and heavier failure surface; premature given one small hand-authored literal.
- **Rejection Reason**: YAGNI — the override set is tiny and rarely changes; a hand-authored module adjacent to the bus is single-source enough. Revisit only if the override set grows large or drifts from the registry.

### Alternative 4 (for enforcement): review checklist only
- **Rejection Reason**: Not a forcing function. Human audit is exactly the mechanism that missed registry drift for three consecutive review rounds; Core Rule 5 needs a mechanical gate.

## Consequences

### Positive
- Every consuming system implements against one documented injection contract — no five-patterns divergence.
- All AC-OR tests construct a fresh instance; no cross-test state leakage.
- Core Rule 5 is mechanically enforced in CI, not trusted to reviewers.
- Per-tick cost is observable (tripwire) and delivery-vs-render order is deterministic.

### Negative
- `main.js` becomes a wiring bottleneck that must know every system's constructor — accepted; it is the one place coupling is legitimate (composition root pattern).
- The override literal and `entities.yaml` are two places that must stay consistent by hand (mitigated: the set is small; `verify-registry` already guards event *names*).

### Risks
- **Risk**: ESLint zone globs drift as `src/` layout evolves. **Mitigation**: fix globs when the first system is scaffolded; the rule mechanism is pinned here.
- **Risk**: `import/no-restricted-paths` can be bypassed by dynamic `import()`. **Mitigation**: the rule covers static imports (the realistic case); dynamic cross-system import would be a conspicuous review smell.
- **Risk**: delivery-before-render adds the delivery pass to the render-blocking critical path under a bursty tick. **Mitigation**: the perf tripwire surfaces it; if it ever bites, revisit with a queue cap or deferred low-priority lane (not needed now).

## GDD Requirements Addressed

| GDD System | Requirement | How This ADR Addresses It |
|------------|-------------|--------------------------|
| orchestrator.md | Core Rule 5 — "no direct imports between gameplay systems; the bus is the only channel" (no runtime AC; needs a forcing function per OQ7) | (c) ESLint `import/no-restricted-paths` zone rule in CI |
| orchestrator.md | Tuning Knobs § — "constructor-injected and passed by reference, never a module-level singleton"; fresh instance per test | (a) manual composition root, per-instance config |
| orchestrator.md | Rule 4 — override set "compiled a single time at registration/build time … no runtime `registerOverride()` API" | (b) hand-authored `event-overrides.js` compiled once at construction |
| orchestrator.md | OQ9 — bus wiring + override-table storage location | (a) + (b) |
| orchestrator.md | OQ8 / round-4 (d) — where the delivery pass sits vs `renderer.render()`; bound per-tick queue cost | (d) delivery-before-render + dev perf tripwire |

## Performance Implications
- **CPU**: Per frame — one array snapshot + one stable sort of the tick's queue + O(1) key lookup per event (side-table populated in the same snapshot pass, per Rule 4 Addendum 2). Typical `n` is small (2–~20); budget target **≤0.3 ms/frame** against the 16.6 ms total. Tripwire warns at `n > 64`.
- **Memory**: One short-lived snapshot array per tick (young-generation GC churn). Acceptable; revisit with a reused buffer only if profiling shows GC pressure against the Point Cloud 1–2M-point budget.
- **Load Time**: One-time override compile at construction — negligible.
- **Network**: N/A.

## Migration Plan
No existing code to migrate — this is the first ADR and no `src/` bus exists yet. It defines the pattern the first implementation follows.

## Validation Criteria
- A deliberate `import` of one `src/systems/**` module from another fails `eslint` (and CI).
- A unit test constructs two `Orchestrator` instances with no shared state (cached values do not leak).
- An integration harness confirms the delivery pass completes before `renderer.render()` within one rAF callback.
- The perf tripwire fires exactly once when a synthesised tick queues > `PERF_TRIPWIRE_QUEUE_MAX` events.

## Related Decisions
- `design/gdd/orchestrator.md` — the GDD this ADR implements (OQ7, OQ8, OQ9, Rule 4, Core Rule 5).
- Future ADR (when `/test-setup` runs): CI workflow that executes `eslint`, Vitest, and `npm run verify:registry`.
