# ADR-0005: Session Data + Authoritative Node-Position Pipeline

## Status
Proposed

## Date
2026-07-02

## Last Verified
2026-07-02

## Decision Makers
magatron02 (owner) + architecture-review follow-up

## Summary
Defines the on-disk data format for the curated property pool and how a property's *authoritative* node positions (owned by Scan Node) coexist with the dollhouse *estimates* (owned by Floor Plan) as a single source per property. Resolves the previously-unspecified pipeline (Scan Node Open Q#4 / Floor Plan Q#3): MVP is hand-authored JSON with a pinned schema; Matterport→JSON tooling is deferred. This is the data foundation that unblocks Production.

## Engine Compatibility
| Field | Value |
|-------|-------|
| **Engine** | Three.js r171 — JSON data loaded via `fetch`/import; GLTF room geometry via `GLTFLoader` |
| **Domain** | Core / Data |
| **Knowledge Risk** | LOW — plain JSON + fetch; no engine API at risk |
| **References Consulted** | `design/gdd/floor-plan-system.md` (Data Model, Core Rules 1–8, AC-C07/E17), `design/gdd/scan-node-system.md` (Core Rule 1, Q#4), `.claude/docs/technical-preferences.md` (JSON floor-plan data, GLTF geometry) |
| **Post-Cutoff APIs Used** | None |
| **Verification Required** | Schema round-trips through Floor Plan's load-time validator and Scan Node's roster build (composition test AC-SN30) |

## ADR Dependencies
| Field | Value |
|-------|-------|
| **Depends On** | None (data foundation) |
| **Enables** | ADR-0006 (Floor Plan — validation + init/reveal), ADR-0007 (Scan Node — roster + authoritative positions), the deferred AC-SN30 composition test |
| **Blocks** | **Production** — no property can load without this format; Floor Plan/Scan Node stories that read real data |
| **Ordering Note** | Foundational; author before or alongside the Floor Plan and Scan Node ADRs |

## Context

### Problem Statement
Floor Plan hands Scan Node estimated node anchors; Scan Node then adopts *authoritative* real positions from "per-property session data (`data/sessions/`)" — but the file format, location, and how the two position sets relate on disk were never specified. Both GDDs flag this as an open question (Scan Node Q#4, Floor Plan Q#3) marked "resolve before Production." The estimate↔actual divergence is load-bearing (Floor Plan AC-C07 depends on the two differing), so the schema must carry both without duplicating them into drift-prone copies.

### Constraints
- Floor-plan data is JSON; room geometry is GLTF (`technical-preferences.md`).
- Exactly one `ANOMALY_FINAL` node per property and ≥1 `STANDARD` room (Floor Plan AC-E17/E11) — the coverage denominator `S = count(STANDARD)+1` depends on it.
- Floor Plan owns validation; Scan Node owns authoritative positions; neither imports the other.
- No persistence layer at MVP (that is Alpha-tier).

### Requirements
Covers TR-fp-001 (authoritative PropertyLayout data + pool/seed) and TR-sn-002 (roster + authoritative positions with estimate fallback).

## Decision

### (a) One property file per pool entry; single source, two readers
Each curated property is **one JSON file** at `data/properties/<propertyId>.json` (consolidating the GDD's provisional `data/sessions/` phrasing — there is no per-session persisted data at MVP; a "session" is one playthrough of one static property). A pool manifest `data/properties/index.json` lists available `propertyId`s and their `propertyType`. The file is the single source; Floor Plan reads geometry + estimates, Scan Node reads authoritative positions — different fields, no duplicate files to drift.

### (b) Nodes are a top-level array carrying BOTH positions — no per-room copy
Node positions live **once**, in a top-level `nodes[]`, each entry:
```json
{ "nodeId": "n1", "roomId": "living", "type": "STANDARD|ANOMALY_FINAL|NULL",
  "estimatedPosition": [x, y, z], "authoritativePosition": [x, y, z] }
```
- Floor Plan projects this into its event shapes at load: the `floorplan:init` `nodeRoster` (`{nodeId, nodeType, roomId, estimatedPosition}`) and each room's dollhouse `estimatedNodePositions` (grouped by `roomId`, reading `estimatedPosition`).
- Scan Node reads `authoritativePosition`; when a node omits it, it **falls back to `estimatedPosition`** (Scan Node Core Rule 1). The estimate↔actual divergence (AC-C07) is expressed by the two fields differing on the same node — not by two files.

### (c) Property schema (rooms + doors + nodes)
```json
{
  "propertyId": "condo-01",
  "propertyType": "condo | townhouse | detached",
  "rooms": [
    { "id": "living", "label": "Living Room", "type": "STANDARD | ANOMALY | LOCKED",
      "aabb": { "min": [x,y,z], "max": [x,y,z] },
      "surfaces": [ { "type": "floor|wall|ceiling", ... } ],
      "revealTriggerNodeId": "n7"            // ANOMALY rooms only
    }
  ],
  "doors": [
    { "id": "d1", "roomA": "living", "roomB": "kitchen",
      "threshold": { "min": [x,y,z], "max": [x,y,z] }, "width": 0.9,
      "loopable": false, "loopTarget": null, "loopSpawn": null }
  ],
  "nodes": [ /* (b) — one entry per node, both positions */ ]
}
```
Room GLTF geometry (if any) is referenced by convention (`assets/rooms/<propertyId>/…`) and loaded via `GLTFLoader`; the point cloud is generated from `aabb` + `surfaces`, so GLTF is optional per property.

### (d) Validation is Floor Plan's, at load
This ADR fixes the *shape*; Floor Plan's load-time validator (ADR-0006 / TR-fp-007) enforces the invariants against it: door `width ≥ 0.71 m`, each node's position inside its room `aabb`, **exactly one `ANOMALY_FINAL`** across all nodes (AC-E17), **≥1 `STANDARD`** room (AC-E11), `loopTarget`/`loopSpawn` validity. Fail → reject that property and select another from the pool; pool exhausted → hard console error (authoring bug). Tuning-config guards (`w_t≤0.8`, `D0<D_max`) validate against config, not this file.

### (e) Authoring pipeline: hand-authored JSON now, tooling deferred
MVP properties are **hand-authored** against this schema (the curated pool is small). An automated Matterport-scan → property-JSON tool is **deferred** to a future tools-programmer task — built only if the pool grows enough to need it (YAGNI). Pinning the schema is what actually unblocks Production; the tool is an optimisation on top of it.

### (f) Seed resolution
A seed code resolves to a `propertyId` via the pool manifest. Unknown/old seed → fall back to random selection + `console.warn` (Floor Plan Edge Case), never a crash.

### Architecture Diagram
```
  data/properties/index.json  (pool manifest: ids + types)
  data/properties/<id>.json   (rooms + doors + nodes[estimated+authoritative])
        │  loaded at session init (fetch/import)
        ▼
  ┌──────────── Floor Plan ────────────┐        ┌──────── Scan Node ────────┐
  │ validate (d) → project into        │ init   │ build roster from         │
  │ floorplan:init nodeRoster +        │───────▶│ nodeRoster; adopt         │
  │ per-room estimatedNodePositions    │  (bus) │ authoritativePosition     │
  │ (reads estimatedPosition)          │        │ (fallback: estimated)     │
  └────────────────────────────────────┘        └───────────────────────────┘
```

### Implementation Guidelines
- Units: metres, world-space, Y-up — consistent with movement/renderer.
- `nodes[]` is the only place a position is written; never copy positions into `rooms[]`.
- Keep the pool small and hand-authored until a tooling need is proven.

## Alternatives Considered

### Alternative 1: Two files — `data/properties/<id>.json` (estimates) + `data/sessions/<id>.json` (authoritative)
- **Description**: separate the two position sets as the GDD's provisional wording implied.
- **Pros**: literal to the GDD phrasing; clean owner-per-file.
- **Cons**: two files per property that must stay in lockstep (node ids, room mapping) — exactly the drift class the review keeps finding; more load plumbing.
- **Rejection Reason**: one file with two position fields per node is single-source and drift-proof.

### Alternative 2: Positions duplicated in `rooms[].estimatedNodePositions` AND `nodes[]`
- **Description**: mirror the GDD's in-memory Room model onto disk.
- **Pros**: matches the GDD Room struct verbatim.
- **Cons**: the same estimate written twice on disk — a drift source; the on-disk shape needn't equal the in-memory/event shape.
- **Rejection Reason**: project the room grouping at load instead (b).

## Consequences

### Positive
- One authoring surface per property; estimate↔actual divergence is explicit and drift-proof.
- Production unblocked by a concrete schema without waiting on scan tooling.

### Negative
- On-disk shape differs from the GDD's in-memory Room struct — implementers must apply the load-time projection (b).

### Neutral
- GLTF geometry optional per property; point cloud can come from AABB+surfaces alone.

## Risks
| Risk | Probability | Impact | Mitigation |
|------|------------|--------|-----------|
| Hand-authoring errors in the pool | Medium | Low | Floor Plan load-time validator rejects bad layouts; AC-SN30 composition test |
| Pool grows and hand-authoring doesn't scale | Low | Medium | Deferred Matterport→JSON tool picks up the same schema |

## Performance Implications
| Metric | Expected | Budget |
|--------|----------|--------|
| Load Time | one JSON fetch + optional GLTF per session | negligible; off the per-frame path |

## Migration Plan
No existing property data — this defines the first format. Any prototype fixtures adopt this schema.

**Rollback plan**: schema is additive; a future tool or a second file can be layered without breaking hand-authored properties.

## Validation Criteria
- [ ] A hand-authored property loads, validates, and drives one `floorplan:init` + first `floorplan:update`.
- [ ] Scan Node builds `S = count(STANDARD)+1` from the same file (AC-SN30 composition).
- [ ] A node with differing estimate/authoritative positions yields the AC-C07 divergence.
- [ ] Exactly-one-`ANOMALY_FINAL` and ≥1-`STANDARD` rejection paths fire on malformed pool entries.

## GDD Requirements Addressed
| GDD Document | System | Requirement | How This ADR Satisfies It |
|-------------|--------|-------------|--------------------------|
| `design/gdd/floor-plan-system.md` | Floor Plan | TR-fp-001 — authoritative PropertyLayout data + pool/seed | (a) pool + manifest, (c) schema, (f) seed |
| `design/gdd/scan-node-system.md` | Scan Node | TR-sn-002 — roster + authoritative positions w/ estimate fallback | (b) top-level nodes with both positions + fallback |
| both | Floor Plan / Scan Node | Open Q#4 / Q#3 — node-position pipeline unspecified | (e) hand-authored JSON now, tooling deferred |

## Related
- ADR-0006 (Floor Plan — owns validation of this schema), ADR-0007 (Scan Node — reads authoritative positions).
- `design/gdd/scan-node-system.md` AC-SN30 (composition test on this seam).
