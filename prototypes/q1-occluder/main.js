// Q#1 — Type A void: depth-only occluder verification (THROWAWAY)
//
// Answers Open Q#1 in design/gdd/point-cloud-renderer.md, which BLOCKS the Point Cloud ADR:
// "does the Core Rule 6 recipe actually depth-cull THREE.Points behind the capsule while
//  remaining invisible at all camera angles, including near-plane overlap?"
//
// Verification is NUMERIC, not a screenshot judgment — it renders to an offscreen
// WebGLRenderTarget and counts pixels via readRenderTargetPixels. That makes this
// prototype double as the evidence for AC-C08, and it keeps the assertion on the
// allowed side of coding-standards' "What NOT to Automate" carve-out (a pixel COUNT
// is a functional property; "does it look right" is not).
//
// Four tests:
//   T1  cull       — green pixels inside the silhouette drop when the occluder is present
//   T2  invisible  — the occluder writes NO colour of its own (empty scene stays background)
//   T3  all-angles — T1 repeated around a full orbit + elevation sweep (catches angle-dependent
//                    sort failures that a single front-on view would miss)
//   T4  near-plane — camera inside the capsule; records actual behaviour vs the GDD's claim
//                    ("solid black void fills the viewport — acceptable")
//
// ponytail: single file, no abstractions. It is a verification rig, not a system.
import * as THREE from "three";

const RT = 256;                 // offscreen render target edge (square, cheap, plenty of pixels)
const BASE_HEX = 0x4ade80;
const BG_HEX = 0x0a0c10;
const CULL_PASS_RATIO = 0.5;    // silhouette must lose >50% of its green to count as culling
const CULL_BOX = 0.25;          // sample box edge as a fraction of the RT — kept well inside
                                // the capsule's projected silhouette at every tested angle,
                                // so the measurement never straddles the boundary

const results = document.getElementById("results");
const hud = document.getElementById("hud");
const log = (s) => { results.textContent += s + "\n"; console.log(s); };

// ─── Scene ────────────────────────────────────────────────────────────────────
const scene = new THREE.Scene();
scene.background = new THREE.Color(BG_HEX);

const camera = new THREE.PerspectiveCamera(60, 1, 0.01, 100);
const renderer = new THREE.WebGLRenderer({ antialias: false, preserveDrawingBuffer: true });
renderer.setPixelRatio(1);
renderer.setSize(innerWidth, innerHeight);
document.body.appendChild(renderer.domElement);

const target = new THREE.WebGLRenderTarget(RT, RT, {
  minFilter: THREE.NearestFilter, magFilter: THREE.NearestFilter,
});

// An enclosing point-shell ROOM with the occluder at its centre.
//
// NOTE (harness fix): this was first written as a single flat wall at z=-3. That made T3
// report a false FAIL — orbiting the camera around the occluder put it in front of the
// wall at rear azimuths, so the wall was between camera and occluder and 0% cull was the
// CORRECT result, not a sort failure. A shell guarantees geometry behind the occluder from
// every viewpoint, which is both the valid test and the shape of the real game.
function buildWall() {
  const N = 400_000, S = 8, arr = new Float32Array(N * 3);
  const R = () => (Math.random() - 0.5) * S;
  for (let i = 0; i < N; i++) {
    const face = i % 6, h = S / 2;
    const p = [R(), R(), R()];
    p[face >> 1] = (face & 1) ? h : -h;   // pin one axis to a face
    arr[i * 3] = p[0]; arr[i * 3 + 1] = p[1]; arr[i * 3 + 2] = p[2];
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute("position", new THREE.BufferAttribute(arr, 3));
  geo.computeBoundingSphere();
  const mat = new THREE.PointsMaterial({
    color: BASE_HEX, size: 0.018, sizeAttenuation: true,
    depthTest: true,   // load-bearing invariant (Core Rule 6 / AC-C07)
  });
  const pts = new THREE.Points(geo, mat);
  pts.renderOrder = 0;               // contract: every point layer >= 0
  pts.frustumCulled = false;
  return pts;
}
const wall = buildWall();
scene.add(wall);

// ─── The occluder under test: Core Rule 6 recipe, verbatim ───────────────────
const occluder = new THREE.Mesh(
  new THREE.CapsuleGeometry(0.5, 0.8, 8, 16),   // ~1.8m tall, ~0.5m radius
  new THREE.MeshBasicMaterial({
    transparent: false,   // stay in the OPAQUE queue
    depthWrite: true,     // write depth…
    depthTest: true,      // …and run the test itself (a depthTest:false material writes no depth)
    colorWrite: false,    // …but never write colour. This is what makes it invisible.
  })
);
occluder.renderOrder = -1;           // contract: draws before every point layer
occluder.position.set(0, 0, 0);      // room centre — geometry behind it from every angle
scene.add(occluder);

// ─── Pixel counting ───────────────────────────────────────────────────────────
const buf = new Uint8Array(RT * RT * 4);
const baseCol = new THREE.Color(BASE_HEX);
const bgCol = new THREE.Color(BG_HEX);
const to255 = (c) => [Math.round(c.r * 255), Math.round(c.g * 255), Math.round(c.b * 255)];
const [BR, BG_, BB] = to255(baseCol);
const [KR, KG, KB] = to255(bgCol);

/**
 * Render the scene offscreen and count pixels by class inside a centred box.
 * @param {number} boxFrac fraction of the RT edge the sample box covers (silhouette region)
 * @returns {{green:number, bg:number, other:number, total:number}}
 */
function countPixels(boxFrac = 0.45) {
  renderer.setRenderTarget(target);
  renderer.render(scene, camera);
  renderer.readRenderTargetPixels(target, 0, 0, RT, RT, buf);
  renderer.setRenderTarget(null);

  const half = Math.floor((RT * boxFrac) / 2);
  const c0 = RT / 2 - half, c1 = RT / 2 + half;
  let green = 0, bg = 0, other = 0, total = 0;
  for (let y = c0; y < c1; y++) {
    for (let x = c0; x < c1; x++) {
      const i = (y * RT + x) * 4;
      const r = buf[i], g = buf[i + 1], b = buf[i + 2];
      total++;
      // generous tolerance: sizeAttenuation + no AA still gives near-exact colours,
      // but tonemapping/colorspace can shift them slightly.
      if (Math.abs(r - BR) < 40 && Math.abs(g - BG_) < 40 && Math.abs(b - BB) < 40) green++;
      else if (Math.abs(r - KR) < 12 && Math.abs(g - KG) < 12 && Math.abs(b - KB) < 12) bg++;
      else other++;
    }
  }
  return { green, bg, other, total };
}

function aimAt(azimuth, elevation, dist) {
  camera.position.set(
    occluder.position.x + Math.sin(azimuth) * Math.cos(elevation) * dist,
    occluder.position.y + Math.sin(elevation) * dist,
    occluder.position.z + Math.cos(azimuth) * Math.cos(elevation) * dist
  );
  camera.lookAt(occluder.position);
  camera.updateMatrixWorld();
}

// ─── Tests ────────────────────────────────────────────────────────────────────
const out = { t1: null, t2: null, t3: null, t4: null };

function runT1() {
  aimAt(0, 0, 2.2);
  occluder.visible = false;
  const without = countPixels(CULL_BOX);
  occluder.visible = true;
  const withOcc = countPixels(CULL_BOX);
  const ratio = without.green ? 1 - withOcc.green / without.green : 0;
  const pass = withOcc.green < without.green && ratio >= CULL_PASS_RATIO;
  out.t1 = { without: without.green, with: withOcc.green, ratio, pass };
  log(`T1 cull        ${pass ? "PASS" : "FAIL"}  green ${without.green} → ${withOcc.green}  ` +
      `(${(ratio * 100).toFixed(1)}% removed inside silhouette box)`);
  if (!pass) log(`   ⚠ occluder is NOT removing points — the recipe does not depth-cull in this build`);
}

function runT2() {
  // Empty the scene of points: anything non-background now can only come from the occluder.
  wall.visible = false;
  aimAt(0, 0, 2.2);
  const c = countPixels(0.45);
  wall.visible = true;
  const pass = c.green === 0 && c.other === 0;
  out.t2 = { green: c.green, other: c.other, bg: c.bg, total: c.total, pass };
  log(`T2 invisible   ${pass ? "PASS" : "FAIL"}  with no points behind it: ` +
      `bg ${c.bg}/${c.total}, green ${c.green}, other ${c.other}`);
  if (!pass) log(`   ⚠ occluder wrote colour of its own — colorWrite:false is not holding`);
}

function runT3() {
  const AZ = 24, EL = [-0.6, -0.3, 0, 0.3, 0.6];
  let worst = { ratio: 1, az: 0, el: 0 }, fails = 0, n = 0;
  for (const el of EL) {
    for (let a = 0; a < AZ; a++) {
      const az = (a / AZ) * Math.PI * 2;
      aimAt(az, el, 2.2);
      occluder.visible = false;
      const without = countPixels(CULL_BOX);
      occluder.visible = true;
      const withOcc = countPixels(CULL_BOX);
      if (without.green < 200) continue;      // grazing angle: too little signal to judge
      const ratio = without.green ? 1 - withOcc.green / without.green : 0;
      n++;
      if (ratio < worst.ratio) worst = { ratio, az, el };
      if (ratio < CULL_PASS_RATIO) fails++;
    }
  }
  const pass = fails === 0 && n > 0;
  out.t3 = { samples: n, fails, worst, pass };
  log(`T3 all-angles  ${pass ? "PASS" : "FAIL"}  ${n} viewpoints, ${fails} below ` +
      `${CULL_PASS_RATIO * 100}% cull; worst ${(worst.ratio * 100).toFixed(1)}% ` +
      `@ az ${(worst.az * 57.3).toFixed(0)}° el ${(worst.el * 57.3).toFixed(0)}°`);
  if (!pass) log(`   ⚠ cull is angle-dependent — sort order is not deterministic across views`);
}

function runT4() {
  // Camera inside the capsule. GDD Edge Cases predicts "solid black void fills the viewport…
  // reads as optics being blocked". Test the recipe AS SPECIFIED (three's default FrontSide),
  // then re-test with DoubleSide to show what the prediction would actually require.
  const measure = () => {
    camera.position.copy(occluder.position);
    camera.lookAt(0, 0, -4);
    camera.updateMatrixWorld();
    return countPixels(0.9);
  };
  const asSpecified = measure();                       // side defaults to FrontSide
  occluder.material.side = THREE.DoubleSide;
  occluder.material.needsUpdate = true;
  const doubleSided = measure();
  occluder.material.side = THREE.FrontSide;            // restore
  occluder.material.needsUpdate = true;

  const spec = { bg: asSpecified.bg / asSpecified.total, green: asSpecified.green / asSpecified.total };
  const dbl = { bg: doubleSided.bg / doubleSided.total, green: doubleSided.green / doubleSided.total };
  out.t4 = { spec, dbl, matchesAsSpecified: spec.bg > 0.9 };

  log(`T4 near-plane  as specified (FrontSide): bg ${(spec.bg * 100).toFixed(1)}%  ` +
      `green ${(spec.green * 100).toFixed(1)}%`);
  log(`               with side:DoubleSide:    bg ${(dbl.bg * 100).toFixed(1)}%  ` +
      `green ${(dbl.green * 100).toFixed(1)}%`);
  log(`   GDD Edge Case predicts a solid black void filling the viewport → ` +
      `${spec.bg > 0.9 ? "MATCHES as specified" : "DOES NOT MATCH as specified"}` +
      `${dbl.bg > 0.9 ? "; DoubleSide would deliver it" : "; DoubleSide does not deliver it either"}`);
  if (spec.bg <= 0.9) {
    log(`   ⚠ GDD FINDING: with three's default FrontSide the capsule's interior writes no depth,`);
    log(`     so the player sees straight THROUGH the void when the entity overlaps the camera —`);
    log(`     the opposite of the documented "optics blocked" read. Core Rule 6 never specifies`);
    log(`     material.side. Advisory only: Entity System owns preventing camera/entity overlap.`);
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────
log(`Q#1 occluder verification — three@${THREE.REVISION}, RT ${RT}×${RT}, wall 400k pts`);
log(`recipe: transparent:false depthWrite:true depthTest:true colorWrite:false renderOrder:-1`);
log("");
try {
  runT1(); runT2(); runT3(); runT4();
  log("");
  const gate = out.t1.pass && out.t2.pass && out.t3.pass;
  log(`─── Q#1 GATE: ${gate ? "PASS" : "FAIL"} ───`);
  log(gate
    ? `The Core Rule 6 recipe depth-culls THREE.Points and stays invisible at all tested angles.\n` +
      `This is the evidence Open Q#1 asks for, and doubles as AC-C08's numeric readback.`
    : `The recipe does NOT hold as written. Do not mark the Point Cloud ADR Accepted.`);
  log("");
  log(`caveat: verifies FUNCTION (pixel counts), not silhouette edge quality. GL_POINTS carry`);
  log(`per-vertex depth, so the boundary pops binary — expected per Core Rule 6, still worth a`);
  log(`screenshot + lead sign-off (ADVISORY) before the ADR.`);
  hud.textContent = "done — see results";
} catch (e) {
  log(`ERROR: ${e.message}`);
  hud.textContent = "error — see results";
  throw e;
}

// leave a live orbiting view up for the ADVISORY screenshot
let t = 0;
(function spin() {
  requestAnimationFrame(spin);
  t += 0.005;
  aimAt(t, Math.sin(t * 0.4) * 0.4, 2.6);
  renderer.render(scene, camera);
})();

addEventListener("resize", () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});
