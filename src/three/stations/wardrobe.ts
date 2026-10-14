import * as THREE from 'three';
import { part, toon, glow, rbox, sphere, starShape, heartShape } from '../kit';
import type { Station, WorldCtx } from '../types';
import { OUTFITS, outfitStore, setOutfit } from '../../state/store';
import { createMascot } from '../mascot';

interface Item {
  g: THREE.Group;
  baseY: number;
  hover: number;
  hovering: boolean;
  phase: number;
  outfit: number;
}

const TOP = 7.5; // height of the clothes rail

export function createWardrobe(ctx: WorldCtx): Station {
  const group = new THREE.Group();

  /* round rug / fitting stage */
  const rug = part(new THREE.CylinderGeometry(6.4, 6.4, 0.3, 56), 0xffd6e8, 0.05);
  rug.position.y = -0.15;
  group.add(rug);
  [[5.3, 0.02, 0xff9ecb], [4.0, 0.04, 0xfff2fa]].forEach(([r, y, c]) => {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.05, 56), toon(c));
    d.position.y = y;
    group.add(d);
  });
  const pedestal = part(new THREE.CylinderGeometry(1.7, 1.9, 0.4, 36), 0xffffff, 0.04);
  pedestal.position.set(0, 0.2, 1.6);
  group.add(pedestal);
  const pedTop = new THREE.Mesh(new THREE.CylinderGeometry(1.45, 1.45, 0.05, 36), toon(0xffb3d9));
  pedTop.position.set(0, 0.43, 1.6);
  group.add(pedTop);

  /* the mascot tries things on */
  const mascot = createMascot(ctx);
  mascot.group.position.set(0, 0.45, 2.4);
  mascot.baseScale = 1.55;
  group.add(mascot.group);

  /* clothes rail */
  const metal = 0xfff3a8;
  for (const s of [-1, 1]) {
    const post = part(new THREE.CylinderGeometry(0.1, 0.1, TOP + 0.5, 12), metal, 0.03);
    post.position.set(s * 5.6, (TOP + 0.5) / 2, -2.2);
    group.add(post);
    const foot = part(new THREE.CylinderGeometry(0.6, 0.7, 0.2, 16), metal, 0.03);
    foot.position.set(s * 5.6, 0.1, -2.2);
    group.add(foot);
    const ball = part(sphere(0.22, 12), 0xff6fae, 0.03);
    ball.position.set(s * 5.6, TOP + 0.55, -2.2);
    group.add(ball);
  }
  const bar = part(new THREE.CylinderGeometry(0.09, 0.09, 11.2, 12), metal, 0.03);
  bar.rotation.z = Math.PI / 2;
  bar.position.set(0, TOP, -2.2);
  group.add(bar);

  const items: Item[] = [];
  const pickables: THREE.Object3D[] = [];

  const hanger = () => {
    const h = new THREE.Group();
    const hook = part(new THREE.TorusGeometry(0.16, 0.035, 8, 16, Math.PI * 1.5), 0xffffff, 0.015);
    hook.position.y = 0.55;
    h.add(hook);
    const wire = part(new THREE.ConeGeometry(0.55, 0.3, 3), 0xffffff, 0.015);
    wire.scale.set(1, 0.4, 0.15);
    wire.position.y = 0.3;
    h.add(wire);
    return h;
  };

  const register = (g: THREE.Group, x: number, outfit: number, label: string) => {
    g.position.set(x, TOP - 0.45, -2.2);
    const it: Item = { g, baseY: g.position.y, hover: 0, hovering: false, phase: Math.random() * 6, outfit };
    g.userData.pick = {
      label,
      onClick: () => setOutfit(outfit),
      onHover: (h: boolean) => { it.hovering = h; },
    };
    group.add(g);
    items.push(it);
    pickables.push(g);
  };
  const X = [-4.75, -2.85, -0.95, 0.95, 2.85, 4.75];

  /* 0 — Neko: cat-ear headband */
  {
    const g = new THREE.Group();
    g.add(hanger());
    const band = part(new THREE.TorusGeometry(0.75, 0.065, 10, 28, Math.PI), 0x2a1245, 0.02);
    band.rotation.z = Math.PI;
    band.position.y = -0.1;
    g.add(band);
    for (const s of [-1, 1]) {
      const e = new THREE.Group();
      e.add(part(new THREE.ConeGeometry(0.28, 0.6, 3), 0xffb3d9, 0.03));
      const inner = part(new THREE.ConeGeometry(0.15, 0.36, 3), 0xffffff, 0.01);
      inner.position.set(0, -0.04, 0.08);
      e.add(inner);
      e.position.set(s * 0.52, -0.5, 0);
      e.rotation.z = -s * 0.3;
      g.add(e);
    }
    const bow = part(sphere(0.12, 8), 0xff5fa2, 0.02);
    bow.position.set(0, -0.15, 0.1);
    g.add(bow);
    register(g, X[0], 0, 'Neko-Ohren anprobieren');
  }

  /* 1 — Magical boy: jacket + cape */
  {
    const g = new THREE.Group();
    g.add(hanger());
    const torso = part(rbox(1.2, 1.4, 0.5, 0.2), 0xfff3a8, 0.035);
    torso.position.y = -0.3;
    g.add(torso);
    for (const s of [-1, 1]) {
      const sl = part(new THREE.CapsuleGeometry(0.17, 0.8, 6, 12), 0xfff3a8, 0.03);
      sl.position.set(s * 0.75, -0.35, 0);
      sl.rotation.z = s * 0.25;
      g.add(sl);
    }
    const cape = part(rbox(1.1, 1.2, 0.1, 0.05), 0x4aa8ff, 0.03);
    cape.position.set(0, -0.6, -0.32);
    g.add(cape);
    const star = part(starShape(0.22, 0.1), 0x6cc4ff, 0.02);
    star.position.set(0, -0.05, 0.3);
    g.add(star);
    register(g, X[1], 1, 'Magical-Boy-Outfit anprobieren');
  }

  /* 2 — Maid: bell dress with frills */
  {
    const g = new THREE.Group();
    g.add(hanger());
    const pts = [[0.26, 0.1], [0.3, -0.2], [0.5, -0.45], [0.85, -0.85], [0.95, -1.15]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(part(new THREE.LatheGeometry(pts, 28), 0x3b2456, 0.035));
    for (let i = 0; i < 20; i++) {
      const a = (i / 20) * Math.PI * 2;
      const f = part(sphere(0.12, 8), 0xffffff, 0.02);
      f.scale.set(1, 0.55, 1);
      f.position.set(Math.cos(a) * 0.96, -1.18, Math.sin(a) * 0.96);
      g.add(f);
    }
    const apron = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.78, 0.9, 16, 1, true, -0.62, 1.24), toon(0xffffff, { side: THREE.DoubleSide }));
    apron.position.y = -0.6;
    apron.scale.set(1.05, 1, 1.05);
    g.add(apron);
    register(g, X[2], 2, 'Maid-Kleid anprobieren');
  }

  /* 3 — Kitsune: kimono + obi */
  {
    const g = new THREE.Group();
    g.add(hanger());
    const body = part(rbox(0.9, 1.9, 0.3, 0.12), 0x8ff0d4, 0.03);
    body.position.y = -0.8;
    g.add(body);
    for (const s of [-1, 1]) {
      const sl = part(rbox(0.5, 1.1, 0.2, 0.08), 0x8ff0d4, 0.03);
      sl.position.set(s * 0.75, -0.55, 0);
      sl.rotation.z = s * 0.1;
      g.add(sl);
      const lapel = part(rbox(0.1, 0.8, 0.04, 0.02), 0xffffff, 0.015);
      lapel.position.set(s * 0.12, -0.3, 0.17);
      lapel.rotation.z = -s * 0.4;
      g.add(lapel);
    }
    const obi = part(rbox(0.96, 0.4, 0.34, 0.08), 0xff6b6b, 0.03);
    obi.position.y = -0.7;
    g.add(obi);
    const knot = part(sphere(0.14, 8), 0xff6b6b, 0.02);
    knot.position.set(0, -0.7, 0.22);
    g.add(knot);
    register(g, X[3], 3, 'Kitsune-Kimono anprobieren');
  }

  /* 4 — Angel: wings + halo */
  {
    const g = new THREE.Group();
    g.add(hanger());
    for (const s of [-1, 1]) {
      for (let k = 0; k < 4; k++) {
        const f = part(sphere(0.25, 10), 0xffffff, 0.025);
        f.scale.set(0.4, 1.3 - k * 0.15, 0.12);
        f.position.set(s * (0.25 + k * 0.28), -0.45 - k * 0.2, 0);
        f.rotation.z = -s * (0.2 + k * 0.2);
        g.add(f);
      }
    }
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.06, 8, 28), glow(0xffe27a));
    halo.position.set(0, -0.1, 0.1);
    g.add(halo);
    register(g, X[4], 4, 'Engels-Outfit anprobieren');
  }

  /* 5 — Herzensritter: heart shield + sword */
  {
    const g = new THREE.Group();
    g.add(hanger());
    const sword = part(rbox(0.16, 1.7, 0.05, 0.02), 0xdfe6f2, 0.02);
    sword.position.set(0, -0.6, -0.08);
    sword.rotation.z = 0.5;
    g.add(sword);
    const guard = part(rbox(0.6, 0.12, 0.1, 0.04), 0xffcf4d, 0.02);
    guard.position.set(-0.25, 0.25, -0.08);
    guard.rotation.z = 0.5;
    g.add(guard);
    const shield = part(heartShape(1.5), 0xc8d0e0, 0.035);
    shield.position.set(0, -0.75, 0.05);
    g.add(shield);
    const inner = part(heartShape(1.0), 0xff5f7a, 0.02);
    inner.position.set(0, -0.75, 0.2);
    g.add(inner);
    register(g, X[5], 5, 'Herzensritter-Rüstung anprobieren');
  }

  /* floating decoration */
  const floaters: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const m = part(i % 2 ? heartShape(0.45) : starShape(0.25, 0.12), i % 2 ? 0xff6fae : 0xffffff, 0.02);
    m.position.set((Math.random() - 0.5) * 14, 1 + Math.random() * 6, -4 - Math.random() * 2);
    m.userData.p = Math.random() * 6;
    group.add(m);
    floaters.push(m);
  }
  const bulbs: THREE.Mesh[] = [];
  for (let i = 0; i < 24; i++) {
    const k = i / 23;
    const b = new THREE.Mesh(sphere(0.08, 8), glow(0xfff3a8));
    b.position.set(-5.6 + k * 11.2, TOP + 0.5 - Math.sin(k * Math.PI) * 0.35, -2.2);
    group.add(b);
    bulbs.push(b);
  }

  // ring under the mascot takes the colour of the outfit that is worn
  const aura = new THREE.Mesh(new THREE.RingGeometry(1.5, 1.8, 40), glow(0xffffff, 0.6));
  aura.rotation.x = -Math.PI / 2;
  aura.position.set(0, 0.47, 1.6);
  group.add(aura);

  const accent = new THREE.Color();

  return {
    group,
    pickables: [...pickables, mascot.group],
    update(t, dt, focus) {
      mascot.update(t, dt, focus, true);
      const worn = outfitStore.get();
      accent.set(OUTFITS[worn].css);
      (aura.material as THREE.MeshBasicMaterial).color.lerp(accent, 0.15);
      aura.scale.setScalar(1 + Math.sin(t * 2) * 0.03);

      items.forEach((it, i) => {
        it.hover += ((it.hovering ? 1 : 0) - it.hover) * Math.min(1, dt * 9);
        const isWorn = it.outfit === worn;
        it.g.position.y = it.baseY + it.hover * 0.25 + (isWorn ? 0.18 : 0);
        it.g.scale.setScalar(1 + it.hover * 0.1 + (isWorn ? 0.06 : 0));
        it.g.rotation.z = Math.sin(t * 1.3 + i) * 0.05 + it.hover * Math.sin(t * 14) * 0.08;
        it.g.rotation.y = isWorn ? Math.sin(t * 2 + i) * 0.25 : 0;
      });
      bulbs.forEach((b, i) => {
        (b.material as THREE.MeshBasicMaterial).color.setHex(Math.sin(t * 3 + i) > 0 ? 0xfff3a8 : 0xffb3d9);
      });
      floaters.forEach((m) => {
        m.rotation.y = t + m.userData.p;
        m.position.y += Math.sin(t * 1.1 + m.userData.p) * 0.004;
      });
    },
  };
}
