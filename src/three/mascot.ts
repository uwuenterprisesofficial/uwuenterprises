import * as THREE from 'three';
import { INK, part, toon, glow, sphere, rbox, heartShape, starShape } from './kit';
import type { WorldCtx } from './types';
import { OUTFITS, outfitStore, setOutfit } from '../state/store';

export interface Mascot {
  group: THREE.Group;
  /** Overall size multiplier (the pop animation is applied on top). */
  baseScale: number;
  /** `spin`: slowly turns to show the back (wings, capes, tails). Otherwise looks at the pointer. */
  update: (t: number, dt: number, focus: number, spin?: boolean) => void;
}

type Id = (typeof OUTFITS)[number]['id'];

/**
 * The UwU chibi. Every outfit toggles a different set of dresses, ears,
 * tails, wings, capes and props, so each one has its own silhouette.
 */
export function createMascot(ctx: WorldCtx): Mascot {
  const mascot = new THREE.Group();
  mascot.userData.pick = {
    label: 'Klick → Outfit wechseln',
    onClick: () => setOutfit(outfitStore.get() + 1),
  };

  const mHair = toon(0xffb3d9), mEars = toon(0xffb3d9), mDress = toon(0xffffff), mBow = toon(0xff5fa2);
  const skin = toon(0xffe2d4);
  const dark = toon(0x3a1d6e);
  const white = toon(0xffffff);

  /** Objects that are only visible for certain outfits. */
  const tagged: { obj: THREE.Object3D; ids: Id[] }[] = [];
  const tag = <T extends THREE.Object3D>(obj: T, ...ids: Id[]): T => { tagged.push({ obj, ids }); return obj; };
  const put = <T extends THREE.Object3D>(parent: THREE.Object3D, obj: T, x = 0, y = 0, z = 0): T => {
    obj.position.set(x, y, z);
    parent.add(obj);
    return obj;
  };

  /* ───────────────────────── legs ───────────────────────── */
  for (const s of [-1, 1]) {
    put(mascot, part(new THREE.CapsuleGeometry(0.15, 0.7, 6, 12), white, 0.03), s * 0.22, 0.55, 0);
    const shoe = put(mascot, part(sphere(0.22, 14), 0x5b3a8a, 0.03), s * 0.22, 0.08, 0.08);
    shoe.scale.set(1, 0.62, 1.4);
    const band = part(new THREE.TorusGeometry(0.155, 0.04, 8, 16), mBow, 0.02);
    band.rotation.x = Math.PI / 2;
    put(mascot, tag(band, 'neko', 'magic', 'angel'), s * 0.22, 0.8, 0);
  }

  /* ───────────────────────── dresses ───────────────────────── */
  // neko — classic short flared dress
  {
    const g = new THREE.Group();
    put(g, part(new THREE.CylinderGeometry(0.4, 0.88, 1.05, 32), mDress, 0.04), 0, 1.4, 0);
    const hem = part(new THREE.TorusGeometry(0.87, 0.08, 10, 40), white, 0.03);
    hem.rotation.x = Math.PI / 2;
    put(g, hem, 0, 0.9, 0);
    const collar = part(new THREE.TorusGeometry(0.34, 0.09, 10, 24), white, 0.03);
    collar.rotation.x = Math.PI / 2;
    put(g, collar, 0, 1.9, 0);
    mascot.add(tag(g, 'neko'));
  }

  // maid — long bell skirt, layered scalloped frills, apron, puffy sleeves
  {
    const g = new THREE.Group();
    const pts = [[0.34, 1.95], [0.4, 1.75], [0.42, 1.5], [0.62, 1.3], [0.92, 1.0], [1.12, 0.66], [1.14, 0.55]]
      .map(([x, y]) => new THREE.Vector2(x, y));
    g.add(part(new THREE.LatheGeometry(pts, 40), mDress, 0.04));
    // petticoat peeking out
    const pet = [[0.9, 0.78], [1.18, 0.6], [1.32, 0.38]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(part(new THREE.LatheGeometry(pet, 40), white, 0.035));
    // scalloped frills in 3 staggered rings
    [[1.14, 0.58, 30, 0.14], [1.32, 0.4, 34, 0.15], [1.02, 0.84, 26, 0.12]].forEach(([r, y, n, s], k) => {
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2 + k * 0.1;
        const f = part(sphere(s, 8), white, 0.02);
        f.scale.set(1, 0.55, 1);
        put(g, f, Math.cos(a) * r, y, Math.sin(a) * r);
      }
    });
    // apron: front panel + lace scallops
    const apron = new THREE.Mesh(
      new THREE.CylinderGeometry(0.26, 0.88, 1.0, 20, 1, true, -0.62, 1.24),
      toon(0xffffff, { side: THREE.DoubleSide }),
    );
    apron.scale.set(1.06, 1, 1.06);
    put(g, apron, 0, 1.25, 0);
    for (let i = 0; i < 9; i++) {
      const a = -0.6 + (i / 8) * 1.2;
      const f = part(sphere(0.11, 8), white, 0.02);
      f.scale.set(1, 0.6, 1);
      put(g, f, Math.sin(a) * 0.97, 0.8, Math.cos(a) * 0.97 * 1.06);
    }
    const waist = part(new THREE.TorusGeometry(0.43, 0.05, 8, 24), white, 0.02);
    waist.rotation.x = Math.PI / 2;
    put(g, waist, 0, 1.5, 0);
    // back bow
    for (const s of [-1, 1]) {
      const w = part(new THREE.ConeGeometry(0.22, 0.5, 3), white, 0.025);
      w.rotation.z = s * -Math.PI / 2;
      put(g, w, s * 0.28, 1.5, -0.45);
    }
    put(g, part(sphere(0.1, 10), white, 0.02), 0, 1.5, -0.45);
    // round collar + neck ribbon
    const collar = part(new THREE.TorusGeometry(0.34, 0.09, 10, 24), white, 0.03);
    collar.rotation.x = Math.PI / 2;
    put(g, collar, 0, 1.92, 0);
    put(g, part(sphere(0.1, 10), 0xff6fae, 0.02), 0, 1.84, 0.36);
    mascot.add(tag(g, 'maid'));
  }

  // magic — tunic, pleated mini-skirt, star brooch
  {
    const g = new THREE.Group();
    put(g, part(new THREE.CylinderGeometry(0.4, 0.58, 0.85, 24), toon(0xfff3a8), 0.04), 0, 1.5, 0);
    put(g, part(new THREE.CylinderGeometry(0.6, 1.02, 0.5, 14, 1, true), mBow, 0.04), 0, 0.98, 0);
    const trim = part(new THREE.TorusGeometry(0.97, 0.05, 8, 40), toon(0xffe27a), 0.025);
    trim.rotation.x = Math.PI / 2;
    put(g, trim, 0, 0.73, 0);
    const belt = part(new THREE.TorusGeometry(0.5, 0.06, 8, 28), toon(0xffe27a), 0.02);
    belt.rotation.x = Math.PI / 2;
    put(g, belt, 0, 1.2, 0);
    put(g, part(starShape(0.2, 0.09), toon(0xffe27a), 0.02), 0, 1.75, 0.42);
    const collar = part(new THREE.TorusGeometry(0.34, 0.09, 10, 24), white, 0.03);
    collar.rotation.x = Math.PI / 2;
    put(g, collar, 0, 1.92, 0);
    mascot.add(tag(g, 'magic'));
  }

  // kitsune — long kimono, wide obi
  {
    const g = new THREE.Group();
    const pts = [[0.36, 1.95], [0.42, 1.6], [0.45, 1.15], [0.55, 0.65], [0.62, 0.15]].map(([x, y]) => new THREE.Vector2(x, y));
    g.add(part(new THREE.LatheGeometry(pts, 32), mDress, 0.04));
    const hem = part(new THREE.TorusGeometry(0.62, 0.07, 8, 32), white, 0.025);
    hem.rotation.x = Math.PI / 2;
    put(g, hem, 0, 0.17, 0);
    const obi = part(new THREE.CylinderGeometry(0.5, 0.5, 0.34, 28), mBow, 0.03);
    put(g, obi, 0, 1.3, 0);
    for (const s of [-1, 1]) {
      const w = part(rbox(0.5, 0.62, 0.12, 0.05), mBow, 0.025);
      put(g, w, s * 0.3, 1.34, -0.55).rotation.z = s * 0.5;
      const lapel = part(rbox(0.12, 0.62, 0.05, 0.02), white, 0.02);
      put(g, lapel, s * 0.1, 1.72, 0.4).rotation.z = -s * 0.45;
    }
    put(g, part(sphere(0.12, 10), mBow, 0.02), 0, 1.32, -0.55);
    put(g, part(rbox(0.12, 0.5, 0.05, 0.02), mBow, 0.02), -0.12, 1.0, -0.56).rotation.z = 0.15;
    mascot.add(tag(g, 'kitsune'));
  }

  // angel — puffy tulle dress, layered
  {
    const g = new THREE.Group();
    put(g, part(new THREE.CylinderGeometry(0.4, 0.62, 0.95, 24), mDress, 0.04), 0, 1.45, 0);
    [[0.78, 1.12, 0xffffff, 0.3, 0.25], [0.95, 0.97, 0xffd9ec, 0.28, 0.17], [1.1, 0.82, 0xffffff, 0.26, 0.1]].forEach(([r, y, c, h]) => {
      const layer = part(new THREE.CylinderGeometry(r * 0.72, r, h as number, 28), c as number, 0.03);
      put(g, layer, 0, y as number, 0);
    });
    for (let i = 0; i < 22; i++) {
      const a = (i / 22) * Math.PI * 2;
      const f = part(sphere(0.13, 8), 0xffffff, 0.02);
      f.scale.set(1, 0.6, 1);
      put(g, f, Math.cos(a) * 1.1, 0.78, Math.sin(a) * 1.1);
    }
    const collar = part(new THREE.TorusGeometry(0.34, 0.09, 10, 24), white, 0.03);
    collar.rotation.x = Math.PI / 2;
    put(g, collar, 0, 1.92, 0);
    mascot.add(tag(g, 'angel'));
  }

  // knight — green tunic, chainmail skirt, belt
  {
    const g = new THREE.Group();
    put(g, part(new THREE.CylinderGeometry(0.42, 0.62, 1.05, 24), mDress, 0.04), 0, 1.4, 0);
    put(g, part(new THREE.CylinderGeometry(0.64, 0.8, 0.4, 24), 0xb8c2d0, 0.035), 0, 0.88, 0);
    for (let i = 0; i < 4; i++) {
      const r = part(new THREE.TorusGeometry(0.66 + i * 0.045, 0.025, 6, 32), 0x8f9bb0, 0.01);
      r.rotation.x = Math.PI / 2;
      put(g, r, 0, 1.0 - i * 0.1, 0);
    }
    const belt = part(new THREE.TorusGeometry(0.52, 0.07, 8, 28), 0x6b4a3a, 0.025);
    belt.rotation.x = Math.PI / 2;
    put(g, belt, 0, 1.2, 0);
    put(g, part(rbox(0.2, 0.2, 0.06, 0.03), 0xffcf4d, 0.02), 0, 1.2, 0.54);
    const collar = part(new THREE.TorusGeometry(0.34, 0.1, 10, 24), 0xb8c2d0, 0.03);
    collar.rotation.x = Math.PI / 2;
    put(g, collar, 0, 1.92, 0);
    mascot.add(tag(g, 'knight'));
  }

  // chest bow (neko / angel) and star-less decoration
  {
    const bow = new THREE.Group();
    for (const s of [-1, 1]) {
      const w = part(new THREE.ConeGeometry(0.2, 0.34, 3), mBow, 0.025);
      w.rotation.z = s * -Math.PI / 2;
      put(bow, w, s * 0.17, 0, 0);
    }
    bow.add(part(sphere(0.09, 12), mBow, 0.02));
    bow.position.set(0, 1.78, 0.38);
    mascot.add(tag(bow, 'neko', 'angel'));
  }

  /* ───────────────────────── arms ───────────────────────── */
  const armL = new THREE.Group(), armR = new THREE.Group();
  for (const [arm, s] of [[armL, 1], [armR, -1]] as const) {
    arm.position.set(s * 0.45, 1.82, 0);
    put(arm, part(new THREE.CapsuleGeometry(0.11, 0.55, 6, 12), skin, 0.03), 0, -0.38, 0);
    const base = part(sphere(0.19, 14), mDress, 0.03);
    arm.add(tag(base, 'neko', 'magic', 'angel', 'knight'));
    // maid: puffy sleeve + frilled cuff
    const puff = part(sphere(0.27, 14), white, 0.03);
    puff.scale.set(1, 0.9, 1);
    arm.add(tag(puff, 'maid'));
    const cuff = part(new THREE.TorusGeometry(0.13, 0.05, 8, 16), white, 0.02);
    cuff.rotation.x = Math.PI / 2;
    put(arm, tag(cuff, 'maid'), 0, -0.68, 0);
    // kitsune: wide hanging sleeve
    const wide = part(rbox(0.5, 0.95, 0.34, 0.1), mDress, 0.03);
    put(arm, tag(wide, 'kitsune'), s * 0.12, -0.5, 0);
    put(arm, tag(part(rbox(0.52, 0.1, 0.36, 0.04), white, 0.02), 'kitsune'), s * 0.12, -0.95, 0);
    // angel: cardigan cuffs
    put(arm, tag(part(sphere(0.16, 10), 0xffd9ec, 0.02), 'angel'), 0, -0.72, 0);
    // knight: golden pauldron
    const pauld = part(new THREE.SphereGeometry(0.3, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), 0xffcf4d, 0.035);
    pauld.rotation.z = -s * 0.3;
    put(arm, tag(pauld, 'knight'), s * 0.04, 0.08, 0);
    mascot.add(arm);
  }
  // hand props
  const wand = new THREE.Group();
  put(wand, part(new THREE.CylinderGeometry(0.04, 0.05, 1.3, 8), white, 0.02), 0, 0.35, 0);
  put(wand, part(starShape(0.28, 0.13), toon(0xffe27a), 0.025), 0, 1.15, 0);
  put(wand, new THREE.Mesh(new THREE.RingGeometry(0.34, 0.42, 24), glow(0xfff3a8, 0.5)), 0, 1.15, -0.05);
  put(armL, tag(wand, 'magic'), 0.1, -0.75, 0.12);
  const shield = new THREE.Group();
  put(shield, part(heartShape(1.7), toon(0xc8d0e0), 0.035), 0, 0, 0);
  const inner = part(heartShape(1.15), toon(0xff5f7a), 0.02);
  put(shield, inner, 0, 0, 0.14);
  put(armL, tag(shield, 'knight'), 0.2, -0.55, 0.28).rotation.set(0, 0.5, 0.15);
  const tray = new THREE.Group();
  put(tray, part(new THREE.CylinderGeometry(0.42, 0.42, 0.06, 20), 0xffffff, 0.025), 0, 0, 0);
  put(tray, part(new THREE.CylinderGeometry(0.1, 0.07, 0.14, 12), 0xffb3d9, 0.02), 0, 0.1, 0);
  put(tray, part(sphere(0.09, 10), 0xff6fae, 0.02), 0.2, 0.09, 0.05);
  put(armR, tag(tray, 'maid'), -0.05, -0.75, 0.3);

  /* ───────────────────────── head ───────────────────────── */
  const head = new THREE.Group();
  head.position.y = 2.6;
  mascot.add(head);

  const face = part(sphere(0.8, 32), skin, 0.04);
  face.scale.set(1, 0.92, 0.95);
  head.add(face);
  const hairBack = part(sphere(0.86, 32), mHair, 0.04);
  hairBack.scale.set(1.02, 1, 0.98);
  put(head, hairBack, 0, 0.05, -0.14);
  const cap = part(new THREE.SphereGeometry(0.84, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.44), mHair, 0.04);
  cap.rotation.x = -0.2;
  put(head, cap, 0, 0.05, 0);
  for (let i = -3; i <= 3; i++) {
    const x = i * 0.2;
    const c = part(new THREE.ConeGeometry(0.15, 0.5 - Math.abs(i) * 0.04, 8), mHair, 0.025);
    c.rotation.x = Math.PI;
    c.rotation.z = -i * 0.07;
    put(head, c, x, 0.4 - Math.abs(i) * 0.04, 0.6 - Math.abs(x) * 0.28);
  }
  for (const s of [-1, 1]) {
    const lock = part(new THREE.CapsuleGeometry(0.13, 0.7, 6, 12), mHair, 0.03);
    lock.rotation.z = s * 0.08;
    put(head, lock, s * 0.74, -0.25, 0.05);
  }
  const ahoge = part(new THREE.ConeGeometry(0.07, 0.55, 8), mHair, 0.02);
  ahoge.rotation.z = -0.5;
  put(head, tag(ahoge, 'neko', 'maid', 'kitsune', 'angel'), 0.08, 0.98, 0.15);

  // twin tails with ribbons (magic / angel)
  for (const s of [-1, 1]) {
    const tw = new THREE.Group();
    put(tw, part(new THREE.CapsuleGeometry(0.2, 1.3, 6, 12), mHair, 0.03), 0, -0.75, 0);
    put(tw, part(sphere(0.17, 10), mBow, 0.02), 0, 0.05, 0.05);
    const rib = part(new THREE.TorusGeometry(0.2, 0.05, 8, 14), mBow, 0.02);
    rib.rotation.x = Math.PI / 2;
    put(tw, rib, 0, -0.55, 0);
    tw.rotation.z = s * 0.22;
    put(head, tag(tw, 'magic', 'angel'), s * 0.9, 0.35, -0.05);
  }

  // ears
  const ears: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const e = new THREE.Group();
    e.add(part(new THREE.ConeGeometry(0.34, 0.75, 3), mEars, 0.035));
    put(e, part(new THREE.ConeGeometry(0.19, 0.46, 3), 0xff9ec4, 0.01), 0, -0.05, 0.1);
    e.userData.base = -s * 0.38;
    put(head, tag(e, 'neko', 'maid'), s * 0.5, 0.92, -0.02).rotation.z = e.userData.base;
    ears.push(e);

    // fox ears: taller, white with a dark tip
    const f = new THREE.Group();
    f.add(part(new THREE.ConeGeometry(0.3, 1.0, 3), mHair, 0.035));
    put(f, part(new THREE.ConeGeometry(0.16, 0.6, 3), toon(0x6ff0c8), 0.01), 0, -0.1, 0.1);
    put(f, part(new THREE.ConeGeometry(0.1, 0.25, 3), toon(0x3b2456), 0.01), 0, 0.37, 0);
    put(head, tag(f, 'kitsune'), s * 0.46, 1.08, -0.02).rotation.z = -s * 0.28;
  }

  // maid headdress: ring of frills
  {
    const hd = new THREE.Group();
    for (let i = 0; i < 17; i++) {
      const a = -1.3 + (i / 16) * 2.6;
      const f = part(sphere(0.13, 8), white, 0.02);
      f.scale.set(1, 0.6, 1);
      put(hd, f, Math.sin(a) * 0.8, 0.52 + Math.cos(a) * 0.16, Math.cos(a) * 0.55);
    }
    const band = part(new THREE.TorusGeometry(0.62, 0.05, 8, 28, Math.PI), white, 0.02);
    band.rotation.set(0.5, Math.PI / 2, 0);
    hd.add(band);
    put(hd, part(sphere(0.12, 8), 0xff6fae, 0.02), 0.62, 0.5, 0.25);
    head.add(tag(hd, 'maid'));
  }
  // halo
  {
    const halo = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.06, 10, 36), glow(0xffe27a));
    halo.rotation.x = Math.PI / 2 - 0.15;
    put(head, tag(halo, 'angel'), 0, 1.55, -0.05);
    const glowRing = new THREE.Mesh(new THREE.TorusGeometry(0.5, 0.18, 10, 36), glow(0xfff3a8, 0.25));
    glowRing.rotation.x = Math.PI / 2 - 0.15;
    put(head, tag(glowRing, 'angel'), 0, 1.55, -0.05);
  }
  // knight circlet + plume
  {
    const c = part(new THREE.TorusGeometry(0.8, 0.07, 8, 36), 0xc8d0e0, 0.025);
    c.rotation.x = Math.PI / 2 - 0.35;
    put(head, tag(c, 'knight'), 0, 0.35, 0.02);
    const plume = part(new THREE.ConeGeometry(0.16, 0.7, 8), toon(0xff5f7a), 0.025);
    plume.rotation.z = -0.4;
    put(head, tag(plume, 'knight'), 0.15, 0.95, 0.2);
    put(head, tag(part(sphere(0.1, 8), 0xffcf4d, 0.02), 'knight'), 0, 0.5, 0.78);
  }
  // magic star clips
  for (const s of [-1, 1]) {
    put(head, tag(part(starShape(0.2, 0.09), toon(0xffe27a), 0.02), 'magic'), s * 0.62, 0.62, 0.4);
  }

  // face
  const eyes: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const eye = new THREE.Group();
    const base = new THREE.Mesh(sphere(0.17, 16), dark);
    base.scale.set(0.95, 1.3, 0.4);
    eye.add(base);
    const iris = new THREE.Mesh(sphere(0.115, 16), toon(0x7fd0ff));
    iris.scale.set(1, 1.25, 0.3);
    put(eye, iris, 0, -0.03, 0.05);
    put(eye, new THREE.Mesh(sphere(0.05, 8), glow(0xffffff)), 0.05, 0.1, 0.09);
    put(eye, new THREE.Mesh(sphere(0.025, 8), glow(0xffffff)), -0.05, -0.08, 0.09);
    put(head, eye, s * 0.29, -0.02, 0.68).rotation.y = s * 0.3;
    eyes.push(eye);
    const blush = new THREE.Mesh(sphere(0.13, 12), glow(0xff7fae, 0.65));
    blush.scale.set(1.2, 0.55, 0.2);
    blush.rotation.y = s * 0.7;
    put(head, blush, s * 0.5, -0.22, 0.58);
  }
  for (const s of [-1, 1]) {
    const m = new THREE.Mesh(new THREE.TorusGeometry(0.05, 0.014, 6, 12, Math.PI), toon(INK));
    m.rotation.z = Math.PI;
    put(head, m, s * 0.05, -0.2, 0.75);
  }

  /* ───────────────────────── back: tails, cape, wings, sword ───────────────────────── */
  const tailCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, -0.1, -0.6),
    new THREE.Vector3(0.5, 0.2, -1.0), new THREE.Vector3(0.75, 0.9, -0.9),
  ]);
  const tail = part(new THREE.TubeGeometry(tailCurve, 20, 0.12, 10), mHair, 0.03);
  put(mascot, tag(tail, 'neko', 'maid'), 0, 1.0, -0.7);

  const foxTails = new THREE.Group();
  const bigTail = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0.1, -0.7),
    new THREE.Vector3(0.1, 0.7, -1.2), new THREE.Vector3(0.1, 1.4, -1.1),
  ]);
  for (let i = -1; i <= 1; i++) {
    const t = new THREE.Group();
    t.add(part(new THREE.TubeGeometry(bigTail, 20, 0.2, 10), mHair, 0.035));
    put(t, part(sphere(0.3, 12), mDress, 0.03), 0.1, 1.45, -1.1);
    t.rotation.y = i * 0.55;
    t.rotation.z = i * 0.12;
    foxTails.add(t);
  }
  put(mascot, tag(foxTails, 'kitsune'), 0, 0.95, -0.55);

  mBow.side = THREE.DoubleSide; // the cape reuses the accent material
  const cape = new THREE.Mesh(new THREE.CylinderGeometry(0.78, 1.15, 1.6, 20, 1, true, Math.PI - 1.0, 2.0), mBow);
  put(mascot, tag(cape, 'magic'), 0, 1.15, -0.05);

  const wings = new THREE.Group();
  const wingSides: THREE.Group[] = [];
  for (const s of [-1, 1]) {
    const w = new THREE.Group();
    for (let k = 0; k < 5; k++) {
      const f = part(sphere(0.3, 12), white, 0.025);
      f.scale.set(0.42, 1.5 - k * 0.14, 0.12);
      f.position.set(s * (0.3 + k * 0.34), 0.5 - k * 0.34 + 0.0, 0);
      f.rotation.z = -s * (0.25 + k * 0.2);
      w.add(f);
    }
    put(wings, w, 0, 0, 0);
    wingSides.push(w);
  }
  put(mascot, tag(wings, 'angel'), 0, 1.85, -0.5);

  const sword = new THREE.Group();
  put(sword, part(rbox(0.16, 1.5, 0.05, 0.02), 0xdfe6f2, 0.02), 0, 0.9, 0);
  put(sword, part(rbox(0.6, 0.12, 0.1, 0.04), 0xffcf4d, 0.02), 0, 0.12, 0);
  put(sword, part(new THREE.CylinderGeometry(0.06, 0.06, 0.4, 8), 0x6b4a3a, 0.02), 0, -0.14, 0);
  sword.rotation.z = 0.7;
  put(mascot, tag(sword, 'knight'), 0, 1.0, -0.5);

  /* ───────────────────────── runtime ───────────────────────── */
  const tmp = new THREE.Color();
  let blinkAt = 2;
  let shown: Id | null = null;
  let pop = 0;

  const show = (id: Id) => {
    tagged.forEach(({ obj, ids }) => { obj.visible = ids.includes(id); });
    shown = id;
  };
  show('neko');

  const api: Mascot = {
    group: mascot,
    baseScale: 1,
    update(t, dt, focus, spin = false) {
      const idx = ctx.outfit();
      const o = OUTFITS[idx];
      if (shown !== o.id) { show(o.id as Id); pop = 1; }
      pop = Math.max(0, pop - dt * 2.2);

      const k = 1 - Math.pow(0.002, dt);
      mHair.color.lerp(tmp.setHex(o.hair), k);
      mEars.color.lerp(tmp.setHex(o.ears), k);
      mDress.color.lerp(tmp.setHex(o.dress), k);
      mBow.color.lerp(tmp.setHex(o.bow), k);

      const bounce = Math.abs(Math.sin(t * 2.2)) * 0.05 + Math.sin(pop * Math.PI) * 0.45;
      mascot.position.y = bounce;
      mascot.scale.setScalar(api.baseScale * (1 + Math.sin(pop * Math.PI) * 0.12));

      const tx = ctx.pointer.x * 0.55, ty = ctx.pointer.y * 0.3;
      head.rotation.y += (tx - head.rotation.y) * 0.08;
      head.rotation.x += (ty - head.rotation.x) * 0.08;
      head.rotation.z = Math.sin(t * 1.3) * 0.04;
      const ry = spin ? Math.sin(t * 0.45) * 0.9 + pop * 6.28 : tx * 0.25;
      mascot.rotation.y += (ry - mascot.rotation.y) * (spin ? 0.06 : 0.05);

      const waving = o.id === 'knight' || o.id === 'maid' ? 0.15 : 1;
      armR.rotation.z = -(2.45 * waving + 0.4 * (1 - waving) + Math.sin(t * 6) * 0.28 * waving) * (0.6 + focus * 0.4);
      armL.rotation.z = (o.id === 'magic' ? 0.9 : 0.25) + Math.sin(t * 1.4) * 0.05;
      tail.rotation.y = Math.sin(t * 2.2) * 0.35;
      foxTails.rotation.y = Math.sin(t * 1.6) * 0.18;
      wingSides.forEach((w, i) => { w.rotation.y = (i === 0 ? 1 : -1) * (0.25 + Math.sin(t * 2.4) * 0.12); });
      ears.forEach((e, i) => {
        e.rotation.z = e.userData.base + Math.sin(t * 2.5 + i * 2) * 0.05 * (Math.sin(t * 0.7) > 0.8 ? 4 : 1);
      });

      if (t > blinkAt) {
        const p = (t - blinkAt) / 0.14;
        const s = p < 1 ? 1 - Math.sin(p * Math.PI) * 0.9 : 1;
        eyes.forEach((e) => { e.scale.y = s; });
        if (p >= 1) blinkAt = t + 2 + Math.random() * 3;
      }
    },
  };
  return api;
}
