---
type: entity
created: 2026-07-05
updated: 2026-07-05
sources: ["[[sources/LAST-SCAN-Concept-Doc]]"]
tags: [product, engine]
aliases: ["Three.js r171", "THREE"]
---

# Three.js

## Basic Information
- Type: product (WebGL rendering library)
- Source: [[sources/LAST-SCAN-Concept-Doc]]

## Description
The rendering engine for [[entities/LAST-SCAN]], pinned at **revision r171** (~December 2024) —
within the assistant's training-data cutoff, so general API guidance is reliable; the project's
own risk register tracks only two specific verification items, not general engine-knowledge gaps:
whether a `depthWrite:true, colorWrite:false` mesh achieves depth-only-invisible occlusion (Type A
void rendering, [[entities/Point-Cloud-Renderer]]'s OQ1), and `PointsMaterial` point-size behavior
at high-DPI. No game engine layer sits on top of it — vanilla JS ES modules + Vite, no physics
engine, kinematic collision only.

The project deliberately avoids `three/examples/jsm/controls/PointerLockControls` in favor of the
native browser PointerLock API for [[entities/FPS-Movement]], since the addon's internal
sensitivity model doesn't match the GDD's exact formulas.

## Related Entities
- [[entities/Point-Cloud-Renderer]] — `THREE.Points`/`BufferGeometry` is the entire visual language
- [[entities/FPS-Movement]] — native PointerLock API, not the Three.js addon

## Related Concepts
- [[concepts/Architecture-Decision-Record-Process]] — engine-domain ADRs cite this version explicitly

## Mentions in Source
- "Frontend: Three.js (point cloud rendering, FPS camera)" — [[sources/LAST-SCAN-Concept-Doc]]
