// Point cloud room renderer — GDD §6, §12
// Samples points on the 6 inner surfaces of a box room. This is the LIDAR look:
// the world is dots, not solid geometry.
import * as THREE from "three";

/**
 * Build a THREE.Points cloud sampling the walls/floor/ceiling of a box room.
 * @param {{w:number,d:number,h:number}} room - dimensions in metres
 * @param {number} density - points per square metre
 * @returns {THREE.Points}
 */
export function samplePointCloudRoom(room, density = 900) {
  const { w, d, h } = room;
  const positions = [];

  const surfaces = [
    { area: w * d, pt: () => [rand(w), 0, rand(d)] },        // floor
    { area: w * d, pt: () => [rand(w), h, rand(d)] },        // ceiling
    { area: w * h, pt: () => [rand(w), randH(h), -d / 2] },  // wall -z
    { area: w * h, pt: () => [rand(w), randH(h), d / 2] },   // wall +z
    { area: d * h, pt: () => [-w / 2, randH(h), rand(d)] },  // wall -x
    { area: d * h, pt: () => [w / 2, randH(h), rand(d)] },   // wall +x
  ];

  for (const s of surfaces) {
    const n = Math.round(s.area * density);
    for (let i = 0; i < n; i++) positions.push(...s.pt());
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );

  const mat = new THREE.PointsMaterial({
    color: 0x4ade80,
    size: 0.018,
    sizeAttenuation: true,
  });

  return new THREE.Points(geo, mat);
}

const rand = (span) => (Math.random() - 0.5) * span;
const randH = (h) => Math.random() * h;
