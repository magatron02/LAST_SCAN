# Three.js — Version Reference

| Field | Value |
|-------|-------|
| **Library** | Three.js (WebGL2 via `WebGLRenderer`) |
| **Revision** | r171 |
| **Release** | ~December 2024 |
| **Project Pinned** | 2026-07-02 |
| **LLM Knowledge Cutoff** | January 2026 |

## Knowledge Gap Status — LOW

Unlike the Godot reference in this repo, r171 is **within** the assistant's
training data (cutoff Jan 2026 > r171 release). General Three.js API guidance is
reliable. Three.js versions by revision number (rNNN), not semver; there are no
"post-cutoff breaking changes" to warn about here — the risk is version drift if
the project later bumps the revision.

> The Godot/Unity/Unreal directories under `docs/engine-reference/` are NOT
> authoritative for this project (see `technical-preferences.md`). This file is.

## APIs the project actually uses

- `THREE.WebGLRenderer` (WebGL2 assumed), `THREE.Scene`, `THREE.PerspectiveCamera`
- `THREE.Points` + `THREE.BufferGeometry` / `Float32BufferAttribute` — the entire
  visual layer (point cloud). `PointsMaterial` with `sizeAttenuation: true`.
- `three/examples/jsm/controls/PointerLockControls`
- `three/examples/jsm/loaders/GLTFLoader` (room geometry source)
- `camera.rotation` under `rotation.order = 'YXZ'` (FPS Movement yaw/pitch)

## Known verification items (must confirm against r171 before relying on)

- **Type A void depth-only occluder** (Point Cloud Renderer OQ1): a
  `depthWrite: true`, `opacity: 0` mesh that blocks `THREE.Points` behind it.
  r171 may need `material.colorWrite = false` and/or explicit `renderOrder` to be
  depth-only-yet-invisible. **Prototype-verify before the Point Cloud ADR is
  marked Accepted.** HIGH risk.
- **Point size at high-DPI** (OQ3): `PointsMaterial` point size is in world/pixel
  units affected by `devicePixelRatio` — confirm behaviour on 2x/4K.

## Verified Sources

- Docs: https://threejs.org/docs/
- Migration guide (revision-by-revision): https://github.com/mrdoob/three.js/wiki/Migration-Guide
- Releases: https://github.com/mrdoob/three.js/releases
