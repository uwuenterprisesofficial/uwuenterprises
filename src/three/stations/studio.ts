import * as THREE from 'three';
import { part, toon, glow, rbox, sphere, starShape } from '../kit';
import type { Station, WorldCtx } from '../types';
import { fireFlash } from '../../state/store';

function polaroidTexture(seed: number) {
  const c = document.createElement('canvas');
  c.width = 256; c.height = 300;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fffaf5'; g.fillRect(0, 0, 256, 300);
  const pairs = [['#ff9ecb', '#c9a7ff'], ['#8fd3ff', '#ffffff'], ['#ffe29a', '#ff9ecb'], ['#9ff0d6', '#8fd3ff']];
  const [a, b] = pairs[seed % pairs.length];
  const grd = g.createLinearGradient(0, 0, 256, 256);
  grd.addColorStop(0, a); grd.addColorStop(1, b);
  g.fillStyle = grd; g.fillRect(18, 18, 220, 220);
  // tiny kawaii face
  g.fillStyle = '#2a1245';
  g.beginPath(); g.ellipse(100, 130, 9, 14, 0, 0, 7); g.ellipse(156, 130, 9, 14, 0, 0, 7); g.fill();
  g.fillStyle = '#fff';
  g.beginPath(); g.arc(103, 124, 4, 0, 7); g.arc(159, 124, 4, 0, 7); g.fill();
  g.fillStyle = 'rgba(255,90,150,0.5)';
  g.beginPath(); g.ellipse(78, 158, 14, 8, 0, 0, 7); g.ellipse(178, 158, 14, 8, 0, 0, 7); g.fill();
  g.strokeStyle = '#2a1245'; g.lineWidth = 4; g.lineCap = 'round';
  g.beginPath(); g.arc(120, 156, 8, 0, Math.PI); g.arc(136, 156, 8, 0, Math.PI); g.stroke();
  // ears
  g.fillStyle = '#2a1245';
  g.beginPath(); g.moveTo(70, 90); g.lineTo(86, 44); g.lineTo(116, 80); g.fill();
  g.beginPath(); g.moveTo(186, 90); g.lineTo(170, 44); g.lineTo(140, 80); g.fill();
  g.fillStyle = '#2a1245';
  g.font = '700 26px Nunito, sans-serif'; g.textAlign = 'center';
  g.fillText('UwU ♡', 128, 276);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createStudio(ctx: WorldCtx): Station {
  const group = new THREE.Group();

  /* cove: floor + curved paper backdrop */
  const floor = part(new THREE.CylinderGeometry(5.6, 5.6, 0.3, 48), 0xe9ddff, 0.05);
  floor.position.y = -0.15;
  group.add(floor);
  const paper = new THREE.Mesh(
    new THREE.CylinderGeometry(5.6, 5.6, 8, 48, 1, true, Math.PI * 0.45, Math.PI * 1.1),
    toon(0xc9b8ff, { side: THREE.DoubleSide }),
  );
  paper.position.y = 4;
  paper.rotation.y = 0;
  group.add(paper);
  // heart-shaped neon on backdrop
  const neon = new THREE.Mesh(new THREE.TorusGeometry(1.25, 0.07, 8, 48), glow(0xff6fae));
  neon.position.set(0, 4.8, -5.2);
  group.add(neon);
  const neon2 = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.06, 8, 48), glow(0x8fd3ff));
  neon2.position.set(0, 4.8, -5.15);
  group.add(neon2);

  /* pedestal */
  const ped = part(new THREE.CylinderGeometry(1.4, 1.6, 0.6, 32), 0xffffff, 0.04);
  ped.position.set(0, 0.3, -0.5);
  group.add(ped);
  const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(1.2, 1.2, 0.05, 32), toon(0xff9ecb));
  pedTop.position.set(0, 0.62, -0.5);
  group.add(pedTop);

  /* camera (on tripod) – the clickable star */
  const cam = new THREE.Group();
  const body = part(rbox(1.7, 1.15, 0.9, 0.22), 0x2a1245, 0.03);
  cam.add(body);
  const topBand = part(rbox(1.72, 0.36, 0.92, 0.12), 0xff6fae, 0.025);
  topBand.position.y = 0.36;
  cam.add(topBand);
  const lens = part(new THREE.CylinderGeometry(0.46, 0.5, 0.5, 24), 0x5b3a8a, 0.03);
  lens.rotation.x = Math.PI / 2;
  lens.position.z = 0.65;
  cam.add(lens);
  const glass = new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.1, 24), glow(0x8fd3ff));
  glass.rotation.x = Math.PI / 2;
  glass.position.z = 0.93;
  cam.add(glass);
  const shine = new THREE.Mesh(sphere(0.07, 8), glow(0xffffff));
  shine.position.set(0.12, 0.12, 0.99);
  cam.add(shine);
  const flashBulb = part(rbox(0.4, 0.22, 0.2, 0.06), 0xffffff, 0.02);
  flashBulb.position.set(-0.55, 0.62, 0.2);
  cam.add(flashBulb);
  const btn = part(new THREE.CylinderGeometry(0.12, 0.12, 0.1, 12), 0xfff3a8, 0.02);
  btn.position.set(0.5, 0.66, 0);
  cam.add(btn);
  // little cat ears on the camera
  for (const s of [-1, 1]) {
    const e = part(new THREE.ConeGeometry(0.26, 0.5, 3), 0x2a1245, 0.025);
    e.position.set(s * 0.55, 0.9, -0.1);
    e.rotation.z = -s * 0.2;
    cam.add(e);
  }
  cam.position.set(0, 2.6, 1.8);
  cam.userData.pick = {
    label: 'Klick → Foto knipsen 📸',
    onClick: () => snap(),
  };
  group.add(cam);

  const legs = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2 + 0.5;
    const leg = part(new THREE.CylinderGeometry(0.05, 0.07, 2.8, 8), 0x2a1245, 0.02);
    leg.position.set(Math.cos(a) * 0.55, 1.35, 1.8 + Math.sin(a) * 0.55);
    leg.rotation.set(Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25);
    legs.add(leg);
  }
  group.add(legs);

  /* ring light */
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.14, 12, 48), glow(0xffffff));
  ring.position.set(0, 2.6, 1.55);
  group.add(ring);
  const ringHalo = new THREE.Mesh(new THREE.TorusGeometry(1.45, 0.34, 12, 48), glow(0xfff0fa, 0.2));
  ringHalo.position.copy(ring.position);
  group.add(ringHalo);

  /* softboxes */
  const boxes: THREE.Mesh[] = [];
  for (const s of [-1, 1]) {
    const stand = part(new THREE.CylinderGeometry(0.06, 0.08, 4.4, 8), 0x2a1245, 0.02);
    stand.position.set(s * 4.1, 2.2, 0.8);
    group.add(stand);
    const frame = part(rbox(1.9, 2.6, 0.8, 0.18), 0x2a1245, 0.03);
    frame.position.set(s * 4.1, 4.6, 0.8);
    frame.rotation.y = -s * 0.5;
    group.add(frame);
    const panel = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 2.3), glow(s < 0 ? 0xffd1ea : 0xd4efff));
    panel.position.set(s * 4.1 - s * 0.2, 4.6, 0.8 + 0.42);
    panel.rotation.y = -s * 0.5;
    group.add(panel);
    boxes.push(panel);
    const foot = part(new THREE.CylinderGeometry(0.7, 0.8, 0.12, 12), 0x2a1245, 0.02);
    foot.position.set(s * 4.1, 0.06, 0.8);
    group.add(foot);
  }

  /* polaroids that pop out when you snap */
  const polaroids: THREE.Group[] = [];
  for (let i = 0; i < 5; i++) {
    const p = new THREE.Group();
    p.add(part(rbox(1.5, 1.8, 0.05, 0.03), 0xfffaf5, 0.02));
    const img = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.8), new THREE.MeshBasicMaterial({ map: polaroidTexture(i), toneMapped: false }));
    img.position.z = 0.03;
    p.add(img);
    p.visible = false;
    p.userData = { age: 99, tx: (i - 2) * 1.5, ty: 1.2 + (i % 2) * 0.5, rot: (i - 2) * 0.12 };
    group.add(p);
    polaroids.push(p);
  }
  // sticky lineup on the wall
  const wall: THREE.Group[] = [];
  for (let i = 2; i < 4; i++) {
    const p = new THREE.Group();
    p.add(part(rbox(1.0, 1.2, 0.04, 0.03), 0xfffaf5, 0.015));
    const img = new THREE.Mesh(new THREE.PlaneGeometry(0.9, 1.1), new THREE.MeshBasicMaterial({ map: polaroidTexture(i + 1), toneMapped: false }));
    img.position.z = 0.03;
    p.add(img);
    p.position.set(-3.6 + i * 0.5, 4.6 + (i % 2) * 0.9, -4.7 + i * 0.1);
    p.position.x = i < 2 ? -3.4 + i * 1.2 : 2.2 + (i - 2) * 1.2;
    p.rotation.z = (i - 1.5) * 0.12;
    p.rotation.y = i < 2 ? 0.35 : -0.35;
    group.add(p);
    wall.push(p);
  }

  /* the real studio photo, framed on the backdrop */
  const studioTex = new THREE.TextureLoader().load('/studio.jpg');
  studioTex.colorSpace = THREE.SRGBColorSpace;
  const frame = new THREE.Group();
  frame.add(part(rbox(3.9, 3.0, 0.2, 0.1), 0xfffaf5, 0.04));
  const shot = new THREE.Mesh(new THREE.PlaneGeometry(3.5, 2.62), new THREE.MeshBasicMaterial({ map: studioTex, toneMapped: false }));
  shot.position.z = 0.12;
  frame.add(shot);
  const tape = part(rbox(1.0, 0.3, 0.05, 0.02), 0xff9ecb, 0.02);
  tape.position.set(0, 1.55, 0.12);
  tape.rotation.z = 0.05;
  frame.add(tape);
  frame.position.set(-2.6, 4.7, -4.7);
  frame.rotation.set(0, 0.32, 0.04);
  group.add(frame);

  let nextPolaroid = 0;
  let snapT = -10;
  let nowT = 0;
  function snap() {
    snapT = nowT;
    fireFlash();
    const p = polaroids[nextPolaroid++ % polaroids.length];
    p.userData.age = 0;
    p.visible = true;
    p.position.set(0, 2.6, 1.8);
    p.scale.setScalar(0.2);
  }

  const stars: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const m = part(starShape(0.28, 0.12), [0xfff3a8, 0xffffff, 0xff9ecb, 0x8fd3ff][i % 4], 0.02);
    m.position.set((Math.random() - 0.5) * 11, 1.5 + Math.random() * 6, -3.5 + Math.random() * 3);
    m.userData.p = Math.random() * 6;
    group.add(m);
    stars.push(m);
  }

  return {
    group,
    pickables: [cam],
    update(t, dt) {
      nowT = t;
      const since = t - snapT;
      const kick = since < 0.5 ? Math.exp(-since * 9) : 0;

      cam.position.y = 2.6 + Math.sin(t * 1.4) * 0.06;
      cam.rotation.y = ctx.pointer.x * 0.35;
      cam.rotation.x = -ctx.pointer.y * 0.15 - kick * 0.1;
      cam.scale.setScalar(1 + kick * 0.12);
      ring.scale.setScalar(1 + kick * 0.08);
      (ringHalo.material as THREE.MeshBasicMaterial).opacity = 0.18 + kick * 0.5;
      boxes.forEach((b, i) => {
        (b.material as THREE.MeshBasicMaterial).color.setHex(
          i === 0 ? (kick > 0.2 ? 0xffffff : 0xffd1ea) : (kick > 0.2 ? 0xffffff : 0xd4efff),
        );
      });
      neon.rotation.z = t * 0.4;
      neon2.rotation.z = -t * 0.6;

      polaroids.forEach((p, i) => {
        if (!p.visible) return;
        p.userData.age += dt;
        const k = Math.min(1, p.userData.age / 0.7);
        const e = 1 - Math.pow(1 - k, 3);
        p.position.set(p.userData.tx * e * 1.2, 2.6 + (p.userData.ty - 1.4) * e, 1.8 + e * 2.2);
        p.scale.setScalar(0.2 + e * 0.85);
        p.rotation.z = p.userData.rot * e + Math.sin(t * 1.5 + i) * 0.04 * e;
        p.rotation.y = ctx.pointer.x * 0.2;
        if (p.userData.age > 7) p.visible = false;
      });

      wall.forEach((p, i) => { p.rotation.z = (i - 1.5) * 0.12 + Math.sin(t * 1.2 + i) * 0.03; });
      frame.rotation.z = 0.04 + Math.sin(t * 0.9) * 0.012;
      stars.forEach((m) => {
        m.rotation.y = t * 1.3 + m.userData.p;
        m.position.y += Math.sin(t * 1.3 + m.userData.p) * 0.005;
      });
    },
  };
}
