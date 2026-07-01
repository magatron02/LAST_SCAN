// LAST SCAN — prototype slice 1: point cloud room + FPS controller
// GDD §3 (Navigate mode), §12 (Three.js point cloud)
import * as THREE from "three";
import { PointerLockControls } from "three/addons/controls/PointerLockControls.js";
import { samplePointCloudRoom } from "./pointcloud.js";

const ROOM = { w: 12, d: 12, h: 3 }; // metres
const MOVE_SPEED = 1.6; // robot gait, m/s (GDD §3 "slow")
const EYE_HEIGHT = 1.5;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0c10);
scene.fog = new THREE.FogExp2(0x0a0c10, 0.06);

const camera = new THREE.PerspectiveCamera(
  70,
  window.innerWidth / window.innerHeight,
  0.01,
  100
);
camera.position.set(0, EYE_HEIGHT, 0);

const renderer = new THREE.WebGLRenderer({ antialias: false });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// point cloud room
scene.add(samplePointCloudRoom(ROOM));

// FPS controls
const controls = new PointerLockControls(camera, renderer.domElement);
const overlay = document.getElementById("overlay");
const hud = document.getElementById("hud");
const hudCoords = document.getElementById("hud-coords");

overlay.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => {
  overlay.classList.add("hidden");
  hud.classList.remove("hidden");
});
controls.addEventListener("unlock", () => {
  overlay.classList.remove("hidden");
  hud.classList.add("hidden");
});

// input
const keys = new Set();
addEventListener("keydown", (e) => keys.add(e.code));
addEventListener("keyup", (e) => keys.delete(e.code));
addEventListener("blur", () => keys.clear());
document.addEventListener("visibilitychange", () => {
  if (document.hidden) keys.clear();
});

const dir = new THREE.Vector3();
const half = { x: ROOM.w / 2 - 0.4, z: ROOM.d / 2 - 0.4 }; // keep inside walls

const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(clock.getDelta(), 0.1); // AC-EC03 cap

  if (controls.isLocked) {
    dir.set(
      (keys.has("KeyD") ? 1 : 0) - (keys.has("KeyA") ? 1 : 0),
      0,
      (keys.has("KeyS") ? 1 : 0) - (keys.has("KeyW") ? 1 : 0)
    );
    if (dir.lengthSq() > 0) {
      dir.normalize();
      // PointerLockControls moveForward/Right respect yaw
      controls.moveRight(dir.x * MOVE_SPEED * dt);
      controls.moveForward(-dir.z * MOVE_SPEED * dt);
    }
    // clamp inside room (ponytail: AABB clamp, swap for wall raycast when rooms get real)
    const p = controls.object.position;
    p.x = THREE.MathUtils.clamp(p.x, -half.x, half.x);
    p.z = THREE.MathUtils.clamp(p.z, -half.z, half.z);
    p.y = EYE_HEIGHT;
    hudCoords.textContent = `${p.x.toFixed(1)}, ${p.y.toFixed(1)}, ${p.z.toFixed(1)}`;
  }

  renderer.render(scene, camera);
}
animate();

addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
