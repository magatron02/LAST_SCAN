// Q#7 — Point Cloud Renderer min-spec performance prototype (THROWAWAY)
//
// Answers Open Q#7 in design/gdd/point-cloud-renderer.md, which BLOCKS the Point Cloud ADR.
// Also produces the numbers round-7 design-review could not settle by argument:
//   - Formula 2's per-pass sampling cost at WORST-CASE tuning (A_tile=0.5, radius=15)
//   - whether Type B (ENTITY_SPIKE) or Type C (ENTITY_GHOST) is the real worst case
//   - the cost of the tile->point spatial index that Q#6 option (a) silently requires
//   - actual buffer memory vs. the point-count-only ceiling
//
// Deliberately mirrors Q#6 option (a): ONE merged BASE buffer, so the jitter/flicker
// vertex branch runs over every point every frame (no per-chunk frustum culling).
// That is the documented worst case, not an accident.
//
// ponytail: single file, no abstractions, no framework. It is a benchmark, not a system.
import * as THREE from "three";

// ─── Config ───────────────────────────────────────────────────────────────────
// GDD defaults unless the GDD's own safe-range WORST case is the point of the test.
const CFG = {
  densityBudgetCeiling: 1_500_000, // Formula 1
  room: { w: 12, d: 12, h: 3 },
  grid: { x: 2, z: 2 },            // 4 rooms -> D lands near the 900 default
  surfaceWeights: { floor: 1.2, wall: 1.0, ceiling: 0.6 },
  pointSize: 0.018,
  baseColor: 0x4ade80,
  bg: 0x0a0c10,

  // Formula 2 — WORST CASE of the declared safe ranges, not defaults.
  aTile: 0.5,               // safe range 0.5-4.0, min = most tiles
  anomalySampleRadius: 15,  // safe range 6-15, max = widest pass
  anomalySampleInterval: 0.5,
  kNoise: 0.10,
  aRef: 1.0,

  // Formula 3 / 5
  entityInfluenceRadius: 5.0,
  jMaxNear: 0.020,
  jMinAdjacent: 0.020,
  jMaxAdjacent: 0.180,
  flickerAmplitude: 0.4,
  flickerRate: 18,

  // Formula 1b
  aSpike: 1.0,
  mSpike: 3.0,

  ghostOffset: new THREE.Vector3(0.30, 0, 0),
  ghostOpacity: 0.15,

  warmupFrames: 60,
  measureFrames: 300,
};

const results = document.getElementById("results");
const hud = document.getElementById("hud");
const log = (s) => { results.textContent += s + "\n"; console.log(s); };

// ─── Renderer / scene ─────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(CFG.bg);

const camera = new THREE.PerspectiveCamera(70, innerWidth / innerHeight, 0.01, 200);
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);
addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// ─── BASE geometry: merged single buffer (Q#6 option (a) worst case) ──────────
/**
 * Build the merged BASE point buffer across the whole room grid.
 * D is solved so the total lands exactly on density_budget_ceiling — this is
 * Formula 1's auto-scale expressed forward instead of iteratively.
 */
function buildBase() {
  const { w, d, h } = CFG.room;
  const W = CFG.surfaceWeights;
  const perRoomWeighted = w * d * W.floor + w * d * W.ceiling + 2 * (w * h + d * h) * W.wall;
  const rooms = CFG.grid.x * CFG.grid.z;
  const D = CFG.densityBudgetCeiling / (perRoomWeighted * rooms);

  const positions = new Float32Array(CFG.densityBudgetCeiling * 3);
  let n = 0;
  const push = (x, y, z) => {
    if (n >= CFG.densityBudgetCeiling) return;
    positions[n * 3] = x; positions[n * 3 + 1] = y; positions[n * 3 + 2] = z;
    n++;
  };

  for (let gx = 0; gx < CFG.grid.x; gx++) {
    for (let gz = 0; gz < CFG.grid.z; gz++) {
      const ox = (gx - (CFG.grid.x - 1) / 2) * w;
      const oz = (gz - (CFG.grid.z - 1) / 2) * d;
      const R = (s) => (Math.random() - 0.5) * s;
      const surf = [
        [w * d * W.floor,   () => push(ox + R(w), 0, oz + R(d))],
        [w * d * W.ceiling, () => push(ox + R(w), h, oz + R(d))],
        [w * h * W.wall,    () => push(ox + R(w), Math.random() * h, oz - d / 2)],
        [w * h * W.wall,    () => push(ox + R(w), Math.random() * h, oz + d / 2)],
        [d * h * W.wall,    () => push(ox - w / 2, Math.random() * h, oz + R(d))],
        [d * h * W.wall,    () => push(ox + w / 2, Math.random() * h, oz + R(d))],
      ];
      for (const [weightedArea, emit] of surf) {
        const count = Math.floor(weightedArea * D);
        for (let i = 0; i < count; i++) emit();
      }
    }
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(positions.subarray(0, n * 3), 3));
  geo.computeBoundingSphere();
  return { geo, count: n, density: D };
}

// ─── Shader extension: Formula 3 jitter (vertex) + Formula 5 flicker (fragment) ──
//
// NOTE (verified against node_modules/three@0.171.0): the GDD pins the fragment
// injection to `#include <output_fragment>`, which DOES NOT EXIST in r171 — it was
// renamed `opaque_fragment` in r152. Injecting on the GDD's literal string is a silent
// no-op (flicker never renders) while AC-D08 still passes, since AC-D08 only asserts the
// CPU-side uFlickerAmp uniform. We use the real chunk name here.
const uniforms = {
  uTime: { value: 0 },
  uJitter: { value: 0 },
  uEntityPos: { value: new THREE.Vector3(0, 1.5, 0) },
  uInfluenceRadius: { value: CFG.entityInfluenceRadius },
  uFlickerAmp: { value: 0 },
  uFlickerRate: { value: CFG.flickerRate },
};

function makeBaseMaterial() {
  const mat = new THREE.PointsMaterial({
    color: CFG.baseColor, size: CFG.pointSize, sizeAttenuation: true,
  });
  mat.toneMapped = false; // GDD Core Rule / Formula 5

  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);

    shader.vertexShader = shader.vertexShader
      .replace(
        "void main() {",
        `
        uniform float uTime, uJitter, uInfluenceRadius;
        uniform vec3 uEntityPos;
        varying float vPhase;
        float h11(float p){ p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
        vec3 h31(vec3 p3){
          p3 = fract(p3 * vec3(0.1031, 0.1030, 0.0973));
          p3 += dot(p3, p3.yxz + 33.33);
          return fract((p3.xxy + p3.yzz) * p3.zyx);
        }
        void main() {
        `
      )
      // Formula 3: displace `transformed` BEFORE project_vertex so sizeAttenuation
      // is computed from the post-jitter depth. (GDD injection point — correct in r171.)
      .replace(
        "#include <project_vertex>",
        `
        vec3 jh = h31(position);
        vPhase = jh.x * 6.2831853;
        vec4 jWorld = modelMatrix * vec4(transformed, 1.0);
        if (distance(jWorld.xyz, uEntityPos) < uInfluenceRadius) {
          transformed += (jh * 2.0 - 1.0) * uJitter * sin(uTime * 3.0 + vPhase);
        }
        #include <project_vertex>
        `
      );

    shader.fragmentShader = shader.fragmentShader
      .replace(
        "void main() {",
        `
        uniform float uFlickerAmp, uFlickerRate, uTime;
        varying float vPhase;
        void main() {
        `
      )
      // Formula 5: brightness multiplier on outgoingLight, BEFORE tonemapping/colorspace.
      .replace(
        "#include <opaque_fragment>",
        `
        outgoingLight *= 1.0 - uFlickerAmp * (0.5 + 0.5 * sin(uTime * uFlickerRate + vPhase));
        #include <opaque_fragment>
        `
      );
  };
  // Round-3 fix: BASE must not share a compiled program with SPIKE/GHOST.
  mat.customProgramCacheKey = () => "base-jitter-flicker-v1";
  return mat;
}

// ─── Tile index (what Q#6 option (a) silently requires) ───────────────────────
// CSR-style: tileKey -> contiguous slice of a single Int32Array of point indices.
// Built once. This is the structure the GDD never budgets for.
function buildTileIndex(geo) {
  const t0 = performance.now();
  const pos = geo.getAttribute("position").array;
  const n = pos.length / 3;
  const side = Math.sqrt(CFG.aTile);
  const key = (x, z) => (Math.floor(x / side) + 4096) * 8192 + (Math.floor(z / side) + 4096);

  const counts = new Map();
  for (let i = 0; i < n; i++) {
    const k = key(pos[i * 3], pos[i * 3 + 2]);
    counts.set(k, (counts.get(k) || 0) + 1);
  }
  const offsets = new Map();
  let acc = 0;
  for (const [k, c] of counts) { offsets.set(k, acc); acc += c; }
  const indices = new Int32Array(n);
  const cursor = new Map(offsets);
  for (let i = 0; i < n; i++) {
    const k = key(pos[i * 3], pos[i * 3 + 2]);
    indices[cursor.get(k)] = i;
    cursor.set(k, cursor.get(k) + 1);
  }
  // tile centres, for the frustum/radius activity test
  const tiles = [];
  for (const [k, c] of counts) {
    const ix = Math.floor(k / 8192) - 4096;
    const iz = (k % 8192) - 4096;
    tiles.push({ off: offsets.get(k), len: c, cx: (ix + 0.5) * side, cz: (iz + 0.5) * side });
  }
  const ms = performance.now() - t0;
  const bytes = indices.byteLength + tiles.length * 40 + counts.size * 32;
  return { indices, tiles, side, buildMs: ms, bytes };
}

// ─── Formula 2 sampling pass (CPU, main thread, un-amortized) ─────────────────
const _frustum = new THREE.Frustum();
const _mat4 = new THREE.Matrix4();
const _p = new THREE.Vector3();

/**
 * One anomaly sampling pass at worst-case tuning. Returns {ms, tiles, points, events}.
 * Mirrors the GDD's normative CPU approximation: frustum test + point-vs-occluder-capsule.
 */
function samplingPass(index, posArr, occluder, spikePoints) {
  const t0 = performance.now();
  camera.updateMatrixWorld();
  _mat4.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
  _frustum.setFromProjectionMatrix(_mat4);

  const camPos = camera.position;
  const r2 = CFG.anomalySampleRadius * CFG.anomalySampleRadius;
  const occ = occluder ? { pos: occluder.position, r: 0.5, halfH: 0.9 } : null;

  let activeTiles = 0, pointsTested = 0, events = 0;
  const rhoBase = 900 * 1.0;
  const denom = rhoBase * CFG.kNoise * Math.sqrt(CFG.aRef / CFG.aTile);

  for (const t of index.tiles) {
    const dx = t.cx - camPos.x, dz = t.cz - camPos.z;
    if (dx * dx + dz * dz > r2) continue;                      // radius gate
    _p.set(t.cx, 1.5, t.cz);
    if (!_frustum.containsPoint(_p)) continue;                  // frustum gate (attention proxy)
    activeTiles++;

    let visible = 0;
    for (let j = 0; j < t.len; j++) {
      const i = index.indices[t.off + j];
      const x = posArr[i * 3], y = posArr[i * 3 + 1], z = posArr[i * 3 + 2];
      pointsTested++;
      _p.set(x, y, z);
      if (!_frustum.containsPoint(_p)) continue;
      if (occ) {
        // point-to-camera segment vs. capsule (cheap cylinder+cap approximation)
        const ox = occ.pos.x - camPos.x, oz = occ.pos.z - camPos.z;
        const vx = x - camPos.x, vz = z - camPos.z;
        const len2 = vx * vx + vz * vz;
        if (len2 > 1e-6) {
          const tt = Math.max(0, Math.min(1, (ox * vx + oz * vz) / len2));
          const px = camPos.x + vx * tt - occ.pos.x, pz = camPos.z + vz * tt - occ.pos.z;
          const yAt = camPos.y + (y - camPos.y) * tt;
          if (px * px + pz * pz < occ.r * occ.r &&
              Math.abs(yAt - occ.pos.y) < occ.halfH) continue;  // occluded
        }
      }
      visible++;
    }
    // ENTITY_SPIKE is additive to rho_obs (BASE + ENTITY_SPIKE); GHOST is excluded.
    visible += spikePoints;
    const rhoObs = visible / CFG.aTile;
    if (Math.abs((rhoObs - rhoBase) / denom) >= 2.5) events++;
  }
  return { ms: performance.now() - t0, activeTiles, pointsTested, events };
}

// ─── Build the scene ──────────────────────────────────────────────────────────
hud.textContent = "building BASE buffer…";
const base = buildBase();
const basePos = base.geo.getAttribute("position").array;
const baseMat = makeBaseMaterial();
const basePoints = new THREE.Points(base.geo, baseMat);
basePoints.renderOrder = 0;
basePoints.frustumCulled = false; // merged buffer: one bounding sphere, never culled
scene.add(basePoints);

// ENTITY_GHOST — full rigid-translated duplicate, transparent queue
const ghostGeo = new THREE.BufferGeometry();
ghostGeo.setAttribute("position", new THREE.BufferAttribute(basePos.slice(), 3));
ghostGeo.computeBoundingSphere();
const ghost = new THREE.Points(ghostGeo, new THREE.PointsMaterial({
  color: CFG.baseColor, size: CFG.pointSize, sizeAttenuation: true,
  transparent: true, opacity: CFG.ghostOpacity, depthTest: true,
}));
ghost.position.copy(CFG.ghostOffset);
ghost.renderOrder = 0;
ghost.visible = false;
scene.add(ghost);

// ENTITY_SPIKE — Formula 1b: N = floor(A_spike * (D*W_s) * M_spike)
const spikeCount = Math.floor(CFG.aSpike * (900 * 1.2) * CFG.mSpike);
const spikeArr = new Float32Array(spikeCount * 3);
for (let i = 0; i < spikeCount; i++) {
  spikeArr[i * 3] = 3 + (Math.random() - 0.5);
  spikeArr[i * 3 + 1] = Math.random() * 1.8;
  spikeArr[i * 3 + 2] = 3 + (Math.random() - 0.5);
}
const spikeGeo = new THREE.BufferGeometry();
spikeGeo.setAttribute("position", new THREE.BufferAttribute(spikeArr, 3));
spikeGeo.computeBoundingSphere();
const spike = new THREE.Points(spikeGeo, new THREE.PointsMaterial({
  color: CFG.baseColor, size: CFG.pointSize, sizeAttenuation: true,
}));
spike.renderOrder = 0;
spike.visible = false;
scene.add(spike);

// VOID_MASK — depth-only occluder (Core Rule 6 recipe)
const occluder = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 1.8 - 1.0, 4, 8),
  new THREE.MeshBasicMaterial({
    colorWrite: false, depthWrite: true, depthTest: true, transparent: false,
  })
);
occluder.position.set(2, 0.9, 2);
occluder.renderOrder = -1;
scene.add(occluder);

hud.textContent = "building tile index…";
const index = buildTileIndex(base.geo);

// ─── Scenarios ────────────────────────────────────────────────────────────────
// (c) exists because round-7 found the GDD's "Type B passes trivially" assumption
// backwards: ENTITY_GHOST is EXCLUDED from rho_obs, so Type B is the only entity
// state that adds CPU sampling work.
const SCENARIOS = [
  { id: "0-baseline",     ghost: false, spike: false, tier: "none",      note: "BASE only, no entity" },
  { id: "a-ghost-near",   ghost: true,  spike: false, tier: "NEAR",      note: "AC-P01 (a): +GHOST, DISTURBED" },
  { id: "b-ghost-adj",    ghost: true,  spike: false, tier: "ADJACENT",  note: "AC-P01 (b): +GHOST, CORRUPTED (spike guard)" },
  { id: "c-spike-adj",    ghost: false, spike: true,  tier: "ADJACENT",  note: "AC-P01 (c): +SPIKE, CORRUPTED (round-7 gap)" },
];

let si = 0, frame = 0, measuring = false;
let frameTimes = [], passTimes = [], passStats = null;
let last = performance.now(), sinceSample = 0;
const out = [];

function applyScenario(s) {
  ghost.visible = s.ghost;
  spike.visible = s.spike;
  if (s.tier === "NEAR") {
    uniforms.uJitter.value = CFG.jMaxNear;      // d = d_min, worst of the NEAR band
    uniforms.uFlickerAmp.value = 0;
  } else if (s.tier === "ADJACENT") {
    uniforms.uJitter.value = CFG.jMaxAdjacent;  // worst of the whole effect
    uniforms.uFlickerAmp.value = CFG.flickerAmplitude;
  } else {
    uniforms.uJitter.value = 0;
    uniforms.uFlickerAmp.value = 0;
  }
  frame = 0; measuring = false; frameTimes = []; passTimes = [];
  passStats = { activeTiles: 0, pointsTested: 0, events: 0, n: 0 };
}

const pct = (arr, p) => arr.slice().sort((a, b) => a - b)[Math.floor(arr.length * p)] || 0;
const mb = (b) => (b / 1048576).toFixed(1) + " MB";

function finishScenario(s) {
  const avgMs = frameTimes.reduce((a, b) => a + b, 0) / frameTimes.length;
  const r = {
    id: s.id, note: s.note,
    avgFps: 1000 / avgMs,
    maxMs: Math.max(...frameTimes),
    p99Ms: pct(frameTimes, 0.99),
    passAvgMs: passTimes.length ? passTimes.reduce((a, b) => a + b, 0) / passTimes.length : 0,
    passMaxMs: passTimes.length ? Math.max(...passTimes) : 0,
    tiles: passStats.n ? Math.round(passStats.activeTiles / passStats.n) : 0,
    pts: passStats.n ? Math.round(passStats.pointsTested / passStats.n) : 0,
  };
  out.push(r);
  log(
    `${r.id.padEnd(14)} avgFPS ${r.avgFps.toFixed(1).padStart(6)}  ` +
    `max ${r.maxMs.toFixed(1).padStart(6)}ms  p99 ${r.p99Ms.toFixed(1).padStart(5)}ms  ` +
    `| pass avg ${r.passAvgMs.toFixed(2).padStart(6)}ms max ${r.passMaxMs.toFixed(2).padStart(6)}ms  ` +
    `tiles ${String(r.tiles).padStart(4)} pts ${String(r.pts).padStart(7)}`
  );
}

function report() {
  log("");
  log("─── VERDICT vs AC-P01 bars (avg ≥ 55 FPS, no frame > 33 ms) ───");
  for (const r of out) {
    if (r.id === "0-baseline") continue;
    const fpsOk = r.avgFps >= 55, msOk = r.maxMs <= 33;
    log(`${r.id.padEnd(14)} FPS ${fpsOk ? "PASS" : "FAIL"} (${r.avgFps.toFixed(1)})   ` +
        `maxFrame ${msOk ? "PASS" : "FAIL"} (${r.maxMs.toFixed(1)}ms)`);
  }
  const c = out.find((r) => r.id === "c-spike-adj");
  const b = out.find((r) => r.id === "b-ghost-adj");
  if (c && b) {
    log("");
    log("─── Round-7 disputed item: is Type B really 'trivial'? ───");
    log(`  sampling pass  Type C (b): ${b.passAvgMs.toFixed(2)}ms avg / ${b.passMaxMs.toFixed(2)}ms max`);
    log(`  sampling pass  Type B (c): ${c.passAvgMs.toFixed(2)}ms avg / ${c.passMaxMs.toFixed(2)}ms max`);
    log(`  frame time     Type C (b): ${b.maxMs.toFixed(1)}ms max`);
    log(`  frame time     Type B (c): ${c.maxMs.toFixed(1)}ms max`);
  }
  log("");
  log("─── Q#6 option (a) hidden cost: tile->point index ───");
  log(`  build ${index.buildMs.toFixed(0)}ms   tiles ${index.tiles.length}   ≈${mb(index.bytes)}`);
  log(`  (rebuilt on every floorplan:update — not budgeted anywhere in the GDD)`);
  log("");
  log("─── Memory (point-count ceiling is the GDD's ONLY bound) ───");
  const baseBytes = basePos.byteLength, ghostBytes = ghostGeo.getAttribute("position").array.byteLength;
  log(`  BASE ${base.count.toLocaleString()} pts = ${mb(baseBytes)}`);
  log(`  ENTITY_GHOST duplicate      = ${mb(ghostBytes)}`);
  log(`  ENTITY_SPIKE ${spikeCount} pts       = ${mb(spikeArr.byteLength)}`);
  log(`  tile index                  = ${mb(index.bytes)}`);
  log(`  TOTAL CPU-side              = ${mb(baseBytes + ghostBytes + spikeArr.byteLength + index.bytes)}`);
  if (performance.memory) log(`  JS heap used                = ${mb(performance.memory.usedJSHeapSize)}`);
  log("");
  log(`env: D=${base.density.toFixed(0)} pts/m², BASE=${base.count.toLocaleString()}, ` +
      `A_tile=${CFG.aTile}, radius=${CFG.anomalySampleRadius}m, DPR=${renderer.getPixelRatio()}, ` +
      `${innerWidth}x${innerHeight}`);
  log(`NOTE: run this on the min-spec baseline (Iris Xe / Vega 8, 8GB, 1080p) for the real gate.`);
  hud.textContent = "done — see results";
}

// deterministic camera path, so runs are comparable
function driveCamera(t) {
  const r = 8;
  camera.position.set(Math.cos(t * 0.35) * r, 1.5, Math.sin(t * 0.35) * r);
  camera.lookAt(Math.cos(t * 0.35 + 2.2) * 3, 1.4, Math.sin(t * 0.35 + 2.2) * 3);
  uniforms.uEntityPos.value.set(2, 0.9, 2);
}

applyScenario(SCENARIOS[0]);
log(`Q#7 perf prototype — ${SCENARIOS.length} scenarios × ${CFG.measureFrames} frames`);
log(`BASE ${base.count.toLocaleString()} pts (merged single buffer, frustumCulled=false)`);
log("");

function tick() {
  requestAnimationFrame(tick);
  const now = performance.now();
  const dt = now - last; last = now;
  const s = SCENARIOS[si];
  if (!s) return;

  uniforms.uTime.value = now / 1000;
  driveCamera(now / 1000);

  // Formula 2 sampling pass — un-amortized lump, exactly as specified
  sinceSample += dt / 1000;
  if (sinceSample >= CFG.anomalySampleInterval) {
    sinceSample = 0;
    const p = samplingPass(index, basePos, occluder, s.spike ? spikeCount : 0);
    if (measuring) {
      passTimes.push(p.ms);
      passStats.activeTiles += p.activeTiles;
      passStats.pointsTested += p.pointsTested;
      passStats.events += p.events;
      passStats.n++;
    }
  }

  renderer.render(scene, camera);

  frame++;
  if (!measuring && frame > CFG.warmupFrames) { measuring = true; frame = 0; }
  else if (measuring) {
    frameTimes.push(dt);
    if (frame >= CFG.measureFrames) {
      finishScenario(s);
      si++;
      if (SCENARIOS[si]) applyScenario(SCENARIOS[si]);
      else report();
    }
  }
  hud.textContent =
    `scenario ${si + 1}/${SCENARIOS.length}  ${s.id}\n${s.note}\n` +
    `${measuring ? "measuring" : "warmup"} ${frame}/${measuring ? CFG.measureFrames : CFG.warmupFrames}\n` +
    `${(1000 / dt).toFixed(0)} fps`;
}
tick();
