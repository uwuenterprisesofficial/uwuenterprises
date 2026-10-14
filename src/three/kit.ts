import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

export const INK = 0x2a1245;

/* ── toon shading ─────────────────────────────────────────────────────────── */
let gradient: THREE.DataTexture | null = null;
function gradientMap() {
  if (gradient) return gradient;
  const data = new Uint8Array([90, 90, 90, 255, 170, 170, 170, 255, 235, 235, 235, 255, 255, 255, 255, 255]);
  gradient = new THREE.DataTexture(data, 4, 1, THREE.RGBAFormat);
  gradient.minFilter = gradient.magFilter = THREE.NearestFilter;
  gradient.needsUpdate = true;
  return gradient;
}

export function toon(color: number, extra: Partial<THREE.MeshToonMaterialParameters> = {}) {
  return new THREE.MeshToonMaterial({ color, gradientMap: gradientMap(), ...extra });
}

export function glow(color: number, opacity = 1) {
  return new THREE.MeshBasicMaterial({
    color, transparent: opacity < 1, opacity, depthWrite: opacity >= 1,
  });
}

/* ── inverted-hull outline ────────────────────────────────────────────────── */
const outlineCache = new Map<number, THREE.ShaderMaterial>();
/** One shared material per thickness — keeps GPU state changes low. */
const outlineMat = (thick: number) => {
  const key = Math.round(thick * 1000);
  let m = outlineCache.get(key);
  if (!m) {
    m = new THREE.ShaderMaterial({
      side: THREE.BackSide,
      uniforms: { uThick: { value: thick }, uColor: { value: new THREE.Color(INK) } },
      vertexShader: `
        uniform float uThick;
        void main() {
          vec3 p = position + normalize(normal) * uThick;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
        }`,
      fragmentShader: `
        uniform vec3 uColor;
        void main() { gl_FragColor = vec4(uColor, 1.0); }`,
    });
    outlineCache.set(key, m);
  }
  return m;
};

/** Adds a cartoon ink outline as a child of the mesh. */
export function outline<T extends THREE.Mesh>(mesh: T, thick = 0.035): T {
  const o = new THREE.Mesh(mesh.geometry, outlineMat(thick));
  o.userData.isOutline = true;
  o.raycast = () => {};
  mesh.add(o);
  return mesh;
}

/** Toon mesh + outline in one go. */
export function part(
  geo: THREE.BufferGeometry,
  color: number | THREE.Material,
  thick = 0.035,
): THREE.Mesh {
  const m = new THREE.Mesh(geo, typeof color === 'number' ? toon(color) : color);
  return outline(m, thick);
}

export function setColor(mesh: THREE.Mesh, color: number) {
  (mesh.material as THREE.MeshToonMaterial).color.setHex(color);
}

/* ── geometry helpers ─────────────────────────────────────────────────────── */
export const sphere = (r: number, seg = 24) => new THREE.SphereGeometry(r, seg, Math.max(12, seg >> 1));
export const rbox = (w: number, h: number, d: number, r = 0.08) => new RoundedBoxGeometry(w, h, d, 4, r);

export function heartShape(size = 1) {
  const s = new THREE.Shape();
  s.moveTo(0, -0.9);
  s.bezierCurveTo(-1.6, -0.1, -1.1, 1.0, 0, 0.45);
  s.bezierCurveTo(1.1, 1.0, 1.6, -0.1, 0, -0.9);
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 4, curveSegments: 16 });
  g.center();
  g.scale(size * 0.5, size * 0.5, size * 0.5);
  return g;
}

export function starShape(outer = 1, inner = 0.45, points = 5) {
  const s = new THREE.Shape();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 === 0 ? outer : inner;
    const a = (i / (points * 2)) * Math.PI * 2 + Math.PI / 2;
    const x = Math.cos(a) * r, y = Math.sin(a) * r;
    if (i === 0) s.moveTo(x, y); else s.lineTo(x, y);
  }
  s.closePath();
  const g = new THREE.ExtrudeGeometry(s, { depth: 0.25, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 });
  g.center();
  return g;
}

/* ── sprites / canvas textures ────────────────────────────────────────────── */
export function sparkleTexture() {
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.25, 'rgba(255,255,255,0.8)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  g.fillStyle = '#fff';
  g.beginPath();
  g.moveTo(32, 2); g.quadraticCurveTo(34, 30, 62, 32); g.quadraticCurveTo(34, 34, 32, 62);
  g.quadraticCurveTo(30, 34, 2, 32); g.quadraticCurveTo(30, 30, 32, 2);
  g.fill();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export interface Twinkle { points: THREE.Points; update: (t: number) => void }

/** A cloud of twinkling star sprites inside a box around `center`. */
export function sparkleField(count: number, center: THREE.Vector3, size: THREE.Vector3, tex: THREE.Texture, colors: number[], px = 0.5): Twinkle {
  const pos = new Float32Array(count * 3);
  const col = new Float32Array(count * 3);
  const tmp = new THREE.Color();
  for (let i = 0; i < count; i++) {
    pos[i * 3]     = center.x + (Math.random() - 0.5) * size.x;
    pos[i * 3 + 1] = center.y + (Math.random() - 0.5) * size.y;
    pos[i * 3 + 2] = center.z + (Math.random() - 0.5) * size.z;
    tmp.setHex(colors[i % colors.length]);
    col.set([tmp.r, tmp.g, tmp.b], i * 3);
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.PointsMaterial({
    size: px, map: tex, vertexColors: true, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, sizeAttenuation: true,
  });
  const points = new THREE.Points(geo, mat);
  points.frustumCulled = false;
  return { points, update: (t) => { mat.size = px * (0.85 + Math.sin(t * 1.7 + center.x) * 0.15); } };
}

const cloudMats = new Map<number, THREE.MeshToonMaterial>();
let cloudGeo: THREE.BufferGeometry | null = null;

/** Puffy cartoon cloud — one merged mesh (1 draw call instead of 5). */
export function cloud(scale = 1, color = 0xffffff): THREE.Group {
  if (!cloudGeo) {
    const blobs: [number, number, number, number][] = [
      [0, 0, 0, 1], [-1.1, -0.15, 0.1, 0.75], [1.15, -0.1, 0, 0.8], [0.4, 0.45, 0.1, 0.7], [-0.5, 0.35, -0.1, 0.65],
    ];
    cloudGeo = mergeGeometries(blobs.map(([x, y, z, r]) => sphere(r, 14).translate(x, y, z)))!;
  }
  let mat = cloudMats.get(color);
  if (!mat) { mat = toon(color); cloudMats.set(color, mat); }
  const g = new THREE.Group();
  g.add(new THREE.Mesh(cloudGeo, mat));
  g.scale.setScalar(scale);
  return g;
}

/** Bakes fractional "outfit lerp" so colours slide instead of snapping. */
export function lerpHex(mesh: THREE.Mesh, hex: number, k: number) {
  (mesh.material as THREE.MeshToonMaterial).color.lerp(new THREE.Color(hex), k);
}

export function disposeTree(root: THREE.Object3D) {
  root.traverse((o) => {
    const m = o as THREE.Mesh;
    if (m.geometry) m.geometry.dispose();
    const mat = m.material as THREE.Material | THREE.Material[] | undefined;
    if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
    else mat?.dispose();
  });
}
