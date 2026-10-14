import * as THREE from 'three';
import { part, toon, glow, rbox, sphere, heartShape, starShape, cloud } from '../kit';
import type { Station, WorldCtx } from '../types';
import { serviceStore } from '../../state/store';
import { SERVICES } from '../../data';

const CAPSULE_COLORS = [0xff6fae, 0x8fd3ff, 0xfff3a8, 0x6ff0c8, 0xc08cff, 0xff9d6c];

interface Capsule {
  g: THREE.Group;
  idx: number;
  hover: number;
  hovering: boolean;
  seed: number;
  slide: number; // 0 = inside dome, 1 = on tray
}

export function createGacha(_ctx: WorldCtx): Station {
  const group = new THREE.Group();

  /* machine */
  const machine = new THREE.Group();
  const base = part(rbox(3.6, 2.4, 3.2, 0.35), 0xff8cc4, 0.05);
  base.position.y = 1.2;
  machine.add(base);
  const stripe = part(rbox(3.66, 0.5, 3.26, 0.2), 0xffffff, 0.03);
  stripe.position.y = 1.9;
  machine.add(stripe);
  const foot = part(rbox(4.0, 0.3, 3.6, 0.12), 0x5b3a8a, 0.04);
  foot.position.y = 0.15;
  machine.add(foot);

  const dome = new THREE.Mesh(
    sphere(2.15, 40),
    new THREE.MeshToonMaterial({ color: 0xcdeeff, transparent: true, opacity: 0.28, depthWrite: false, gradientMap: null }),
  );
  dome.position.y = 4.4;
  dome.raycast = () => {};
  machine.add(dome);
  const domeRim = part(new THREE.TorusGeometry(1.55, 0.2, 12, 40), 0xfff3a8, 0.04);
  domeRim.rotation.x = Math.PI / 2;
  domeRim.position.y = 2.75;
  machine.add(domeRim);
  const cap = part(sphere(0.35, 12), 0xfff3a8, 0.03);
  cap.position.y = 6.55;
  machine.add(cap);

  // coin slot, knob, tray
  const plate = part(rbox(1.5, 1.0, 0.2, 0.1), 0xfff2fa, 0.03);
  plate.position.set(-0.6, 1.2, 1.62);
  machine.add(plate);
  const knobBase = part(new THREE.CylinderGeometry(0.4, 0.4, 0.1, 20), 0xc08cff, 0.03);
  knobBase.rotation.x = Math.PI / 2;
  knobBase.position.set(-0.6, 1.2, 1.76);
  machine.add(knobBase);
  const knob = new THREE.Group();
  const knobBar = part(rbox(0.9, 0.2, 0.2, 0.08), 0xfff3a8, 0.03);
  knob.add(knobBar);
  knob.position.set(-0.6, 1.2, 1.92);
  machine.add(knob);
  const tray = part(rbox(1.2, 0.8, 0.5, 0.15), 0x2a1245, 0.03);
  tray.position.set(1.05, 0.8, 1.7);
  machine.add(tray);
  const slot = new THREE.Mesh(rbox(0.28, 0.07, 0.05, 0.02), toon(0x2a1245));
  slot.position.set(-0.6, 1.72, 1.74);
  machine.add(slot);

  // ears + tail on the machine (it's a neko gacha!)
  for (const s of [-1, 1]) {
    const e = part(new THREE.ConeGeometry(0.5, 1.0, 3), 0xff8cc4, 0.04);
    e.position.set(s * 1.3, 6.1, 0);
    e.rotation.z = -s * 0.32;
    machine.add(e);
    const ei = part(new THREE.ConeGeometry(0.28, 0.6, 3), 0xffffff, 0.015);
    ei.position.set(s * 1.3, 6.05, 0.1);
    ei.rotation.z = -s * 0.32;
    machine.add(ei);
  }
  machine.userData.pick = {
    label: 'Klick → Gacha ziehen 🎰',
    onClick: () => pull(),
  };
  group.add(machine);

  /* capsules inside the dome */
  const capsules: Capsule[] = [];
  const pickables: THREE.Object3D[] = [machine];
  SERVICES.forEach((s, i) => {
    const g = new THREE.Group();
    const topHalf = part(new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, 0, Math.PI / 2), CAPSULE_COLORS[i % 6], 0.03);
    const botHalf = part(new THREE.SphereGeometry(0.46, 20, 12, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), 0xffffff, 0.03);
    g.add(topHalf, botHalf);
    const spark = new THREE.Mesh(sphere(0.07, 8), glow(0xffffff));
    spark.position.set(0.22, 0.28, 0.33);
    g.add(spark);
    const c: Capsule = { g, idx: i, hover: 0, hovering: false, seed: i * 1.37, slide: 0 };
    g.userData.pick = {
      label: s.title,
      onClick: () => serviceStore.set(i),
      onHover: (h: boolean) => { c.hovering = h; },
    };
    group.add(g);
    capsules.push(c);
    pickables.push(g);
  });

  let shake = 0;
  function pull() {
    shake = 1;
    let next = Math.floor(Math.random() * SERVICES.length);
    if (next === serviceStore.get()) next = (next + 1) % SERVICES.length;
    serviceStore.set(next);
  }

  /* decoration */
  const deco: THREE.Mesh[] = [];
  for (let i = 0; i < 10; i++) {
    const m = part(i % 2 ? heartShape(0.5) : starShape(0.26, 0.12), [0xff6fae, 0xfff3a8, 0x8fd3ff][i % 3], 0.02);
    const a = (i / 10) * Math.PI * 2;
    m.position.set(Math.cos(a) * 5.5, 1.5 + (i % 4) * 1.5, Math.sin(a) * 3 - 2);
    m.userData.p = Math.random() * 6;
    group.add(m);
    deco.push(m);
  }
  [[-6, 2, -3, 1.3], [6.5, 5.5, -4, 1.5]].forEach(([x, y, z, s]) => {
    const c = cloud(s, 0xe8fff9);
    c.position.set(x, y, z);
    group.add(c);
  });

  const floorDisc = part(new THREE.CylinderGeometry(5.2, 5.2, 0.3, 48), 0xb8f2e6, 0.05);
  floorDisc.position.y = -0.15;
  group.add(floorDisc);

  const centers = SERVICES.map(() => new THREE.Vector3());
  const trayPos = new THREE.Vector3();

  return {
    group,
    pickables,
    update(t, dt) {
      const active = serviceStore.get();
      shake = Math.max(0, shake - dt * 1.6);
      machine.position.x = Math.sin(t * 60) * 0.06 * shake;
      machine.rotation.z = Math.sin(t * 55) * 0.015 * shake;
      knob.rotation.z = shake * 6 + t * 0.2;
      machine.position.y = Math.sin(t * 1.1) * 0.03;

      capsules.forEach((c, i) => {
        c.hover += ((c.hovering ? 1 : 0) - c.hover) * Math.min(1, dt * 9);
        const isActive = i === active;
        c.slide += ((isActive ? 1 : 0) - c.slide) * Math.min(1, dt * 5);

        // tumbling inside the dome
        const a = t * (0.5 + c.seed * 0.07) + c.seed * 2.1;
        centers[i].set(
          Math.sin(a) * 1.25 + Math.sin(t * 2 + shake * 8 + c.seed) * shake * 0.2,
          4.35 + Math.sin(a * 1.3 + c.seed) * 0.85 - 0.3,
          Math.cos(a * 0.8) * 1.0,
        );
        trayPos.set(1.05, 1.55 + Math.abs(Math.sin(t * 2.4)) * 0.18, 2.5);
        c.g.position.lerpVectors(centers[i], trayPos, c.slide);
        c.g.rotation.set(t * 0.8 + c.seed, t * 0.6, c.seed + c.slide * Math.sin(t * 1.5) * 0.4);
        const sc = 1 + c.hover * 0.25 + c.slide * 0.55;
        c.g.scale.setScalar(sc);
      });

      deco.forEach((m) => {
        m.rotation.y = t * 1.1 + m.userData.p;
        m.position.y += Math.sin(t * 1.2 + m.userData.p) * 0.004;
      });
    },
  };
}
