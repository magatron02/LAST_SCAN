# Review Log — Session/Game State Orchestrator

Tracks design-review history for `design/gdd/orchestrator.md`.

## Review — 2026-07-02 (round 4, independent re-review) — Verdict: APPROVED
Scope signal: M (GDD complete; remaining work is the OQ9 ADR + implementation-note polish)
Specialists: systems-designer, qa-lead, lead-programmer, engine-programmer, creative-director (synthesis)
Blocking items: 0 (2 one-sentence doc addenda applied same session) | Recommended: 5
Round-4 entry condition (OQ6 `verify-registry`) MET — `npm run verify:registry` independently re-run: **14 pass / 0 fail / 5 skip**.
Summary: The machine-verified round did its job — no new Core-Rule contradiction, all sibling-AC
citations (AC-L09, AC-C06, AC-SN29, AC-E02) verified accurate, registry parity machine-confirmed.
Surviving findings: (1) [qa-lead] `verify-registry` diffs only **top-level** field names (collapses
`roomMeta:[{id,type}]` → `roomMeta`), so "14 pass" proves top-level parity + self-contradiction
absence — the exact `floorplan:loop` failure class that beat three human rounds — **not** nested-field
parity; sufficient today (no active event has a divergent nested shape). (2) [lead-programmer] Rule 4
`groupAnchorIndex` is O(group-size) unless computed in one pass, contradicting the doc's O(1) /
"no graph work in the frame budget" claim. (3) [engine-programmer] per-tick stable sort is O(n log n)
with `n` structurally unbounded + delivery-vs-`renderer.render()` ordering already live today via
`player:position` → PointerLockControls — elevated into OQ9 ADR scope. (4) [systems-designer] pure-
atomic chain n≥3 rank undefined — **cannot fire today** (the live `scan:complete` bridge is *mixed*,
seeded by a directed edge, covered by AC-OR33) — logged as OQ10, a design-gate on Entity/Win-Lose.
CD ruling: both round-3 rulings STAND — OQ6 entry condition met (top-level parity sufficient now,
Addendum 1 is a scope caveat not a failed gate); OQ9 non-blocking (Addendum 2 the sole doc-correctness
escapee). Findings 1–2 fixed same session as one-sentence addenda; 3 folded into OQ9; 4 logged as OQ10.
Prior verdict resolved: Yes (round-3's 6 blockers confirmed closed; no new blocker — APPROVED).

### Addenda applied same session (2026-07-02, round 4)
- **Addendum 1** — AC-OR01 evidence note gained a scope caveat: `verify-registry` verifies top-level
  field-name parity + producer self-contradiction, NOT nested-field parity; extend the tool before any
  active event carries a divergent nested payload shape.
- **Addendum 2** — Rule 4 `groupAnchorIndex` pinned as a single-pass min (one `Map` group-id→min-
  arrival-index populated during the queue snapshot); the naive per-event queue scan (O(n·groupSize))
  named explicitly as NOT the intended implementation, so the O(1) claim holds literally.
- **OQ9 scope expanded** (engine-programmer): the bus-wiring / override-storage ADR must also (c) bound
  per-tick queue size (or adopt the deferred perf-tripwire AC) and (d) pin Orchestrator's delivery pass
  vs. `renderer.render()` ordering. Perf/timing, deferred to the ADR, not blocking approval.
- **New OQ10** — pure-atomic override chains of 3+ events (no directed edge) are undefined; design-gate
  on whichever future GDD first registers a 3-way atomic requirement (Entity #9 / Win-Lose #10).

### Recommended (not blocking — fold into test-authoring / OQ9 ADR)
- **AC-OR29** — mark as a distinct white-box/Integration tier; its own note admits it is not black-box
  constructible (requires calling `subscribe()` from inside another handler).
- **AC-OR11 / AC-OR33** — need an explicit "assert adjacency via inclusion, not order-equality" test-
  pattern note so an independent implementer doesn't write a false-failing strict-order assertion.
- **AC-OR23** is compound (replay-count + drop/warn + non-interference) — a failure won't localize.
- **AC-OR26** — the negative `console.error` assertion needs a stated observation window (cf. AC-OR05's
  "3 further rAF ticks").
- Per-frame GC (queue-snapshot array, no pool note), `elapsedSeconds` float-accumulation drift, and
  mid-pass `session:request_end` publish-vs-delivery timing (AC-OR27/OR31 assume same-tick) are
  asserted-not-stated; an illustrative (non-binding) composition-root wiring sketch would also help.

### Specialist disagreement surfaced
OQ9 severity — lead-programmer (stays non-blocking; only its algorithmic offshoot, Addendum 2, touches
doc correctness) vs. engine-programmer (burst-cost + sort-vs-render is more serious). CD adjudication:
lead-programmer *for approval* (the sort is proven correct, never proven cheap-under-burst — an
architecture concern, not a design defect), engine-programmer *for the ADR* (elevated into OQ9 scope).

## Review — 2026-07-02 (round 3, independent re-review) — Verdict: NEEDS REVISION
Scope signal: M (revision itself S — targeted edits across 5 files, applied same session)
Specialists: systems-designer, qa-lead, lead-programmer, engine-programmer, creative-director (synthesis)
Blocking items: 6 | Recommended: 6
Summary: Third round. The core machine has now survived three adversarial passes — lead-programmer
hand-traced the round-2 `(groupAnchorIndex, intraGroupRank)` sort key against the AC-OR11/OR14
fixtures and confirmed it reproduces both exactly. What blocked was, again, the registry-fidelity
boundary plus one payload semantic: (1) `floorplan:loop` payload drifted — registry/Orchestrator say
`{targetPosition, targetYaw, toRoom}` but Floor Plan's own GDD was internally split 4-vs-3 (its FPS
row, Dependencies row, and BLOCKING AC-C02 omitted `toRoom`); (2) `scan:integrity_*` registered as
un-comparable `"{...}"` placeholders; (3) the AC-OR01 evidence note's "zero deltas" claim was
factually false; (4) the compiled override set already produces a live MIXED atomic+directed group
(`scan:complete` bridges `{scan:coverage, scan:complete}` and `(scan:complete, scan:abort)`) with
`intraGroupRank` undefined for it; (5) "arrival index" never operationally defined (publish-time vs.
tick-snapshot) and AC-OR29's "cached replay" THEN contradicted Core Rule 7's discrete classification
of its own example event; (6) `session:tick elapsedSeconds` semantically undefined — a backgrounded
tab would snap Floor Plan's `session_escalation` to ~1.0, breaking its approved "D_max only via
Completion Trap" guarantee (the same bug class FPS Movement's 0.1s dt cap already fixed).
Adjudications: lead-programmer "mechanism verified" and systems-designer "under-specified for a live
case" are both right — fixtures pass, the mixed-group input has no fixture; `elapsedSeconds` is
Orchestrator's blocker (sole producer), Floor Plan's approval stands; lead-programmer's DI-wiring and
override-storage blockers scoped by CD to a tracked ADR prerequisite (new OQ9), not GDD content.
**Structural ruling: OQ6 (structured `payload_fields` + scripted `verify-registry`) is elevated to a
round-4 ENTRY CONDITION — round 4 verifies machine-checked registry output, not a fourth human sweep.**
Prior verdict resolved: Yes (round-2's 4 blockers confirmed closed; 6 new blockers found, now revised
— round 4 pending, gated on OQ6 tooling)

### Revisions applied same session (2026-07-02, round 3) — round-4 re-review pending, gated on OQ6
- **`floorplan:loop` = `{targetPosition, targetYaw, toRoom}`** (CD ruling: producer's Core Rule 7
  prose is normative). Floor Plan patched in 4 spots incl. AC-C02; FPS Movement inbound citation
  patched ("applies position/yaw only, `toRoom` ignored here"). Orchestrator Core Rule 1 gained a
  **self-contradicting-producer precedence clause** (Core Rules prose > the producer's other tables).
- **Registry integrity payloads declared**: `scan:integrity_warning {count}`,
  `scan:integrity_failure {}`; Scan Node Interactions table now declares the empty payload explicitly.
- **AC-OR01 evidence note corrected** — false "zero deltas" claim replaced with the audit's actual
  track record + OQ6 elevation.
- **Rule 4 mixed-group rank defined**: directed members get a linearized strict total-order rank
  (registration-order tiebreak among incomparable nodes); atomic-only members inherit their partner's
  exact rank (stable sort keeps equal keys contiguous → adjacency guaranteed); two new compile-time
  rejections (atomic edge across distinct directed ranks; atomic member with different-ranked
  partners). New **AC-OR33** co-queues the live 3-member group, asserts AC-OR11+AC-OR12 simultaneously.
- **Arrival index operationally defined**: assigned at `publish()` call time, monotonic per session;
  the tick's queue is snapshotted+sorted once; mid-delivery publishes take **next-tick deferral**
  (user decision — preserves one-sort-per-tick, prevents same-tick publish loops; `session:end` stays
  the sole synchronous exception). **`subscribe()` reentrancy contract** stated. **AC-OR29 re-targeted
  to `scan:coverage`** (latest-value) with per-emission exactly-once; discrete counterpart explicitly
  covered by AC-OR18. `groupAnchorIndex` clarified as computed over the this-tick queued subset.
- **`elapsedSeconds` = capped-dt game time** (`dt_cap` 0.1s, same cap as FPS Movement Formula 1);
  new **AC-OR34** (tab-restore advances ≤ dt_cap); `dt_cap` registered as a cross-system constant.
- **New OQ9**: bus wiring (who constructs the instance, how consumers get the reference) +
  override-table storage location → one ADR, blocking prerequisite to first bus implementation;
  OQ7's lint mechanism noted as dependent on it. AC count 32 → 34.

### Judgment calls made during revision (open to reversal on re-review)
1. Mid-delivery publishes defer to next tick (user-selected over same-tick continuation) — cascades
   advance one hop/tick (~16ms at 60 FPS).
2. `toRoom` kept (CD ruling) rather than dropped — Floor Plan's AC-C02 assertion widened accordingly.
3. Atomic-only members inherit partner rank rather than folding atomic edges into the topo-sort as
   constraints — equal-key stability gives adjacency for free; contradictory configs rejected at compile.

### Round-4 entry condition met same session — `verify-registry` tooling built (OQ6 resolved)
Built `tools/verify-registry.mjs` (`npm run verify:registry`), the machine check the CD made a round-4
gate. Parses the free-text `payload:` directly (balanced-brace reader — no `payload_fields:` schema
needed, registry stays single-source), diffs each event's field set against its producing GDD, and
flags **producer self-contradiction** (the floorplan:loop failure mode). Self-tested (9 parser
assertions via `--selftest`). On first run it caught **two further live drifts all three manual rounds
missed**: `scan:complete` restated as a `{nodeId}` subset in two Scan Node consumer rows (normalized to
bare event + prose), and `renderer:anomaly_density` written 3 inconsistent ways in Point Cloud
(`{type,sigma}` / `{type}` / `{type, sigma≈5.0}` — normalized to `{type, sigma}`). Final: **14 pass,
0 fail, 5 skip (provisional)**. This is the evidence artifact for AC-OR01/AC-OR02. Follow-up: add to CI
when `/test-setup` lands a workflow.

## Review — 2026-07-01 (round 2, independent re-review) — Verdict: NEEDS REVISION
Scope signal: M (revision itself S — 5 targeted edits, ~1 page)
Specialists: systems-designer, qa-lead, lead-programmer, engine-programmer, creative-director (synthesis)
Blocking items: 4 | Recommended: 6
Summary: Independent re-review of the round-one revisions. Registry fidelity independently
re-confirmed (all 3 payload corrections match producers verbatim — the round-one disqualifying
blocker is genuinely closed). But the round-one Rule 4 rewrite that *introduced* the topological-rank
mechanism was itself under-specified: three specialists independently flagged the same gap from
different angles (no single comparable sort key reconciling ranked vs. unranked events; compile
lifecycle ambiguous between build-time and a non-existent runtime API; disconnected override DAG
yields a partial order, not the "total rank" the prose claimed). creative-director collapsed these to
ONE mechanism gap. A second, independent blocker: Rule 4 modelled `scan:coverage`/`scan:complete` as
a directed `(before,after)` pair, but Scan Node AC-SN29 makes them *atomic/adjacent* (equal at
emission, either order) — a live spec-vs-AC contradiction with AC-OR11. Third: DI/test-isolation
unstated (coding-standards.md mandates DI over singletons; a singleton bus silently breaks most ACs).
Fourth: Floor Plan AC-C06 had no Orchestrator AC. creative-director verdict: "close — one tight pass,
not a rework." Note: CD's suggested "single global (rank, arrivalIndex) sort key" was found during
revision NOT to reproduce the existing AC-OR11/OR14 fixtures (a naive global sort pulls ranked events
to the front); the correct key `(groupAnchorIndex, intraGroupRank)` was derived and verified against
both fixtures instead.
Prior verdict resolved: Yes (round-one's 6 blockers confirmed closed; 4 new blockers found in the
round-one revisions themselves, now revised — round 3 pending)

### Revisions applied same session (2026-07-01, round 2) — independent round-3 re-review pending
- **Rule 4 override mechanism fully re-specified** (`design/gdd/orchestrator.md` §Detailed Design
  Rule 4): now defines **two override kinds** — directed order `(before, after)` and **atomic
  adjacency** `{a, b}` (contiguous, either internal order; a directed rank cannot express "adjacent").
  Set is **compiled once at registration/build time** (explicit: no runtime `registerOverride()` API,
  no per-tick recompute; "extended by future GDD" = re-author + rebuild). Compile produces per-event
  (a) override-group id (connected component) and (b) topological rank within directed groups; directed
  edges MUST be acyclic (rejected at compile). Delivery is **one stable sort on key
  `(groupAnchorIndex, intraGroupRank)`** — group anchored at its earliest-arriving member's index
  (unique, no ties), unrelated singletons keep FIFO position around the block. O(1) key lookup, no
  graph work in the frame budget. Closes systems-designer #1, lead-programmer #1/#4, engine-programmer #1.
- **AC-OR11 reworded** to assert atomic *adjacency* (no interleave, block anchored at `scan:complete`
  index 1, either internal order) rather than a fixed coverage-before-complete order. Rule 4 bullet
  tagged as atomic-adjacency. Closes systems-designer #2.
- **DI/test-isolation constraint added** (Tuning Knobs): constructor-injected bus (never a module
  singleton), per-instance toggles, fresh instance per test. Closes lead-programmer #2, qa-lead #5.
- **New AC-OR32**: `floorplan:update` = exactly one emission per mutating call (Floor Plan AC-C06).
  Count 31 → 32. Closes qa-lead #4b.
- **AC-OR30 downgraded to ADVISORY (Config/Data)** — tests the `cacheLatestValues=false` path that
  never ships; AC preamble amended (no longer "all BLOCKING"). Closes qa-lead #6.
- **Advisories folded in**: AC-OR01/02 evidence marked human-executed until OQ6's schema ships;
  Rule 7 `entity:proximity` same-tick "last write in delivery order wins"; SEALED console-warn
  throttled once-per-event-name-per-session (engine-programmer #4); new **OQ8** + Rule 3 note on
  `session:tick` vs. `renderer.render()` ordering (engine-programmer #2); AC-OR26 given a positive
  assertion (qa-lead #1). Status header + doc updated.

### Judgment calls made during revision (open to reversal on re-review)
1. Override delivery key = `(groupAnchorIndex, intraGroupRank)`, NOT the CD's suggested global
   `(rank, arrivalIndex)` — the latter fails the existing AC-OR11/OR14 fixtures.
2. Atomic-group internal order = arrival order (unconstrained per AC-SN29); adjacency is the contract.
3. No dedicated "compile-once" AC added — pinned in prose (like Core Rule 5); a structural-property
   AC would be low-value and hard to write. entity:proximity double-fire kept advisory (Entity unbuilt).

## Review — 2026-07-01 — Verdict: NEEDS REVISION
Scope signal: M
Specialists: systems-designer, qa-lead, lead-programmer, engine-programmer, creative-director (synthesis)
Blocking items: 6 | Recommended: 5
Summary: First independent review of the event-bus / session-state hub (System #5). The design
itself — LOADING/ACTIVE/SEALED machine, latest-value-vs-discrete cache split, FIFO+override
ordering — held up under adversarial boundary-testing; the blockers sat almost entirely at the
**registry-fidelity boundary** the GDD exists to own. All four specialists independently confirmed
two `entities.yaml` payloads had drifted from their producing GDDs (`scan:abort` dropped `coverage`;
`floorplan:init` renamed every field and dropped `propertyId` — the latter being this GDD's own
worked caching example), directly violating its own AC-OR01. creative-director ruled this
"disqualifying-until-fixed, not fatal": approval is the signal that flips four siblings' provisional
flags to authoritative, so an alignment doc cannot be Approved while misaligned. Two substantive
design gaps also blocked: Rule 4's "stable sort" was specified as behaviour without a schema
(non-transitive-comparator risk on 3+ event chains — lead-programmer + systems-designer converged),
and a LOADING→ACTIVE vs. `session:request_end` same-tick race was undefined. qa-lead flagged that
AC-OR01/02 have no runtime test evidence (they audit YAML-vs-prose) and AC-OR29's precondition is
not black-box constructible.
Prior verdict resolved: First review

### Revisions applied same session (2026-07-01) — independent re-review pending
- **Registry payloads corrected to match producing GDDs verbatim** (`design/registry/entities.yaml`):
  `scan:abort` → `{nodeId, coverage}` (Scan Node AC-SN06); `floorplan:init` →
  `{propertyId, roomMeta:[{id,type}], nodeRoster:[{nodeId,nodeType,roomId,estimatedPosition}]}`
  (Floor Plan Core Rules); `scan:complete` → `{nodeId, valid, entityCaptured, coverage}`
  (was under-specified `{nodeId, coverage, ...}`). Each line comments the prior (wrong) value.
- **Rule 4 — Override resolution mechanism** added: overrides are directed `(before, after)` pairs
  compiled to a per-event **topological priority rank** (not an ad-hoc pairwise comparator, which is
  explicitly forbidden as non-strict-weak-ordering); the pair set MUST be acyclic and a cycle is a
  design error rejected **at registration**, not a runtime fallback; unregistered pairs fall through
  to FIFO. Closes the two-implementer divergence risk on AC-OR13/14 chains.
- **LOADING-race resolved**: new Edge Case + new **AC-OR31**. `session:request_end` takes precedence
  over the `LOADING→ACTIVE` gate in any shared tick (order-independent) → straight to SEALED, ACTIVE
  never entered, zero `session:tick` that frame. Judgment call: short-circuit (no transient ACTIVE),
  matching AC-OR28's existing "LOADING→SEALED directly" wording.
- **AC-OR01/02 test evidence** clause added: satisfied by a `/consistency-check` / `verify-registry`
  field-set audit (zero deltas), filed like a Config/Data smoke check — not a Vitest suite.
- **AC-OR29** given a white-box/instrumented-test note (the mid-tick "after queued, before delivery
  completes" window is not observable through the public API).
- Bonus tie-offs: OQ6 (structural registry-drift prevention — `payload_fields` list or
  `verify-registry`), OQ7 (Rule 5 enforcement requires an ADR before first bus implementation —
  creative-director ruling, supersedes OQ4's open framing), Status header updated, AC count 30→31.
- **Deferred (recommended, not gating)**: Rule 7 overwrite-not-append sentence; DI-not-singleton
  line; engine-programmer's ADVISORY perf-tripwire AC + reused-buffer implementation note;
  zero-subscriber Edge Case; render-loop-vs-`renderer.render()` ordering sentence; the structured
  `payload_fields` schema itself (tracked in OQ6).

### Judgment calls made during revision (open to reversal on re-review)
1. Rule 4 cycles → rejected at author-time (registration), no runtime FIFO fallback.
2. LOADING-race → `request_end` short-circuits; ACTIVE never transiently entered.
