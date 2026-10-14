import * as THREE from 'three';
import { part, toon, glow, rbox, sphere, heartShape, starShape } from '../kit';
import type { Station, WorldCtx } from '../types';
import { TALENTS } from '../../data';

/** "?" mystery card for talents that are not announced yet. */
function mysteryTexture(i: number) {
  const c = document.createElement('canvas');
  c.width = 300; c.height = 420;
  const g = c.getContext('2d')!;
  const grd = g.createLinearGradient(0, 0, 300, 420);
  const pairs = [['#ff9ecb', '#8fd3ff'], ['#c9a7ff', '#ffe29a'], ['#9ff0d6', '#ff9ecb']];
  grd.addColorStop(0, pairs[i % 3][0]);
  grd.addColorStop(1, pairs[i % 3][1]);
  g.fillStyle = grd; g.fillRect(0, 0, 300, 420);
  g.fillStyle = 'rgba(255,255,255,0.35)';
  for (let k = 0; k < 40; k++) {
    g.beginPath();
    g.arc(Math.random() * 300, Math.random() * 420, 2 + Math.random() * 6, 0, 7);
    g.fill();
  }
  g.fillStyle = '#fff';
  g.strokeStyle = '#2a1245'; g.lineWidth = 10; g.lineJoin = 'round';
  g.font = '900 230px "Bagel Fat One", "Arial Black", sans-serif';
  g.textAlign = 'center'; g.textBaseline = 'middle';
  g.strokeText('?', 150, 220); g.fillText('?', 150, 220);
  g.font = '700 28px Nunito, sans-serif';
  g.fillStyle = '#2a1245';
  g.fillText(`NEW TALENT #0${i + 1}`, 150, 380);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createRunway(ctx: WorldCtx): Station {
  const group = new THREE.Group();

  /* stage */
  const stage = part(new THREE.CylinderGeometry(5.6, 5.8, 0.6, 48), 0xff8cc4, 0.05);
  stage.position.y = -0.3;
  group.add(stage);
  const stageTop = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.04, 48), toon(0x3a1d6e));
  stageTop.position.y = 0.02;
  group.add(stageTop);

  const runway = part(rbox(2.4, 0.3, 9, 0.1), 0x2a1245, 0.04);
  runway.position.set(0, -0.05, 6.2);
  group.add(runway);
  const bulbs: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    for (const s of [-1, 1]) {
      const b = new THREE.Mesh(sphere(0.09, 8), glow(0xffe29a));
      b.position.set(s * 1.1, 0.17, 2.2 + i * 0.75);
      group.add(b);
      bulbs.push(b);
    }
  }
  for (let i = 0; i < 28; i++) {
    const a = (i / 28) * Math.PI * 2;
    const b = new THREE.Mesh(sphere(0.12, 8), glow(0xfff3a8));
    b.position.set(Math.cos(a) * 5.45, 0.0, Math.sin(a) * 5.45);
    group.add(b);
    bulbs.push(b);
  }

  /* frames */
  const frames: THREE.Group[] = [];
  const COUNT = TALENTS.length;
  const spacing = COUNT > 4 ? 2.95 : COUNT > 3 ? 3.45 : 3.9;
  const frameScale = COUNT > 4 ? 0.95 : 1;
  const layout = TALENTS.map((_, i) => {
    const t = i - (COUNT - 1) / 2; // -1.5 … 1.5 for four frames
    return { x: t * spacing, y: 3.2 - Math.abs(t) * 0.25, z: -1.4 + Math.abs(t) * 0.7, s: frameScale, r: -t * 0.16 };
  });
  const frameColors = [0xff6fae, 0x8fd3ff, 0xfff3a8, 0xc9a7ff];
  TALENTS.forEach((talent, i) => {
    const L = layout[i];
    const f = new THREE.Group();
    const W = 2.2, H = 2.95;
    f.add(part(rbox(W + 0.5, H + 0.5, 0.25, 0.12), frameColors[i % 3], 0.04));
    const tex = ctx.talentTextures.get(talent.slug);
    const photo = new THREE.Mesh(
      new THREE.PlaneGeometry(W, H),
      new THREE.MeshBasicMaterial({ map: tex ?? mysteryTexture(i), toneMapped: false }),
    );
    photo.position.z = 0.14;
    f.add(photo);
    photo.userData.isPhoto = true;
    photo.userData.slug = talent.slug;

    // little accessories on the frame: bow + ears
    const bow = new THREE.Group();
    for (const s of [-1, 1]) {
      const w = part(new THREE.ConeGeometry(0.28, 0.5, 3), 0xffffff, 0.025);
      w.rotation.z = s * -Math.PI / 2; w.position.x = s * 0.26;
      bow.add(w);
    }
    bow.add(part(sphere(0.13, 10), 0xffffff, 0.02));
    bow.position.set(-W / 2 - 0.1, H / 2 + 0.1, 0.2);
    bow.rotation.z = 0.4;
    f.add(bow);
    for (const s of [-1, 1]) {
      const ear = part(new THREE.ConeGeometry(0.3, 0.6, 3), frameColors[i % 3], 0.03);
      ear.position.set(s * 0.75, H / 2 + 0.55, 0);
      ear.rotation.z = -s * 0.25;
      f.add(ear);
    }

    f.position.set(L.x, L.y, L.z);
    f.rotation.y = L.r;
    f.scale.setScalar(L.s);
    f.userData.base = { ...L };
    f.userData.hover = 0;
    f.userData.hovering = false;
    f.userData.pick = {
      label: talent.featured ? `${talent.name} – Profil öffnen` : 'Bald verfügbar ✦',
      onClick: () => { if (talent.featured) ctx.navigate(`/talent/${talent.slug}`); },
      onHover: (h: boolean) => { f.userData.hovering = h; },
    };
    group.add(f);
    frames.push(f);
  });

  /* spotlights (fake volumetric cones) */
  const beams: THREE.Mesh[] = [];
  [[-6, 0xff9ecb], [0, 0xffffff], [6, 0x8fd3ff]].forEach(([x, c]) => {
    const beam = new THREE.Mesh(
      new THREE.ConeGeometry(2.4, 11, 32, 1, true),
      new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.13, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending }),
    );
    beam.position.set(x * 0.7, 6.6, -2);
    beam.rotation.z = (x as number) * -0.03;
    beam.userData.phase = x;
    group.add(beam);
    beams.push(beam);
    const lamp = part(new THREE.CylinderGeometry(0.4, 0.55, 0.7, 12), 0x2a1245, 0.03);
    lamp.position.set(x * 0.7, 12.2, -2);
    group.add(lamp);
  });

  /* confetti */
  const N = 120;
  const geo = new THREE.BufferGeometry();
  const pos = new Float32Array(N * 3), col = new Float32Array(N * 3), vel = new Float32Array(N);
  const palette = [0xff6fae, 0x8fd3ff, 0xfff3a8, 0xffffff, 0xc08cff].map((h) => new THREE.Color(h));
  for (let i = 0; i < N; i++) {
    pos.set([(Math.random() - 0.5) * 12, Math.random() * 10, (Math.random() - 0.5) * 8], i * 3);
    const c = palette[i % palette.length];
    col.set([c.r, c.g, c.b], i * 3);
    vel[i] = 0.4 + Math.random() * 0.8;
  }
  geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const confetti = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.18, map: ctx.sparkle, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  confetti.frustumCulled = false;
  group.add(confetti);

  // floaty hearts + stars around the stage
  const floaters: THREE.Mesh[] = [];
  for (let i = 0; i < 8; i++) {
    const m = part(i % 2 ? heartShape(0.6) : starShape(0.3, 0.14), i % 2 ? 0xff6fae : 0xfff3a8, 0.02);
    m.position.set((Math.random() - 0.5) * 14, 1 + Math.random() * 6, -3 - Math.random() * 3);
    m.userData.p = Math.random() * 6;
    group.add(m);
    floaters.push(m);
  }

  return {
    group,
    pickables: frames,
    update(t, dt) {
      bulbs.forEach((b, i) => {
        const on = Math.sin(t * 4 - i * 0.5) > -0.2;
        (b.material as THREE.MeshBasicMaterial).color.setHex(on ? 0xfff3a8 : 0xc08cff);
      });
      frames.forEach((f, i) => {
        const b = f.userData.base;
        f.userData.hover += ((f.userData.hovering ? 1 : 0) - f.userData.hover) * Math.min(1, dt * 8);
        const h = f.userData.hover;
        f.position.y = b.y + Math.sin(t * 1.2 + i * 1.7) * 0.18 + h * 0.2;
        f.scale.setScalar(b.s * (1 + h * 0.07));
        f.rotation.y = b.r + ctx.pointer.x * 0.25 * (1 - h * 0.5);
        f.rotation.x = -ctx.pointer.y * 0.08;
        f.rotation.z = Math.sin(t * 0.9 + i) * 0.03;
      });
      beams.forEach((bm) => {
        bm.rotation.z = Math.sin(t * 0.6 + bm.userData.phase) * 0.12;
        (bm.material as THREE.MeshBasicMaterial).opacity = 0.11 + Math.sin(t * 1.3 + bm.userData.phase) * 0.03;
      });
      const p = geo.attributes.position as THREE.BufferAttribute;
      for (let i = 0; i < N; i++) {
        let y = p.getY(i) - vel[i] * dt;
        if (y < 0) y = 10;
        p.setY(i, y);
        p.setX(i, p.getX(i) + Math.sin(t + i) * 0.004);
      }
      p.needsUpdate = true;
      floaters.forEach((m) => {
        m.rotation.y = t + m.userData.p;
        m.position.y += Math.sin(t * 1.3 + m.userData.p) * 0.004;
      });
    },
  };
}
