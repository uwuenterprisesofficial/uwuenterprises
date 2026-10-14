import * as THREE from 'three';
import { part, sphere, heartShape, starShape, cloud } from '../kit';
import { createMascot } from '../mascot';
import type { Station, WorldCtx } from '../types';

export function createHero(ctx: WorldCtx): Station {
  const group = new THREE.Group();

  /* ── floating cloud island ── */
  const island = new THREE.Group();
  const top = part(new THREE.CylinderGeometry(3.3, 3.0, 0.7, 40), 0xfff2fa, 0.05);
  top.position.y = -0.35;
  island.add(top);
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * Math.PI * 2;
    const b = part(sphere(0.62 + (i % 3) * 0.1, 16), 0xffffff, 0.04);
    b.position.set(Math.cos(a) * 3.2, -0.45 + (i % 2) * 0.1, Math.sin(a) * 3.2);
    island.add(b);
  }
  const rock = part(new THREE.ConeGeometry(2.9, 3.6, 7), 0xb79bff, 0.05);
  rock.rotation.x = Math.PI;
  rock.position.y = -2.8;
  island.add(rock);
  [-1, 0.2, 1.1].forEach((x, i) => {
    const c = part(new THREE.OctahedronGeometry(0.4 + i * 0.1), 0x8fd3ff, 0.03);
    c.scale.y = 1.8;
    c.position.set(x, -4.6 - i * 0.2, (i - 1) * 0.5);
    island.add(c);
  });
  group.add(island);

  const mascot = createMascot(ctx);
  group.add(mascot.group);

  /* ── orbiting stars + hearts ── */
  const orbit = new THREE.Group();
  orbit.position.y = 2.3;
  const orbiters: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const star = i % 3 === 0;
    const m = part(star ? starShape(0.3, 0.14) : heartShape(0.55), [0xffd1ea, 0x8fd3ff, 0xfff3a8][i % 3], 0.02);
    m.userData.angle = (i / 9) * Math.PI * 2;
    m.userData.r = 5.2 + (i % 2) * 0.8;
    m.userData.y = Math.sin(i * 2.1) * 1.4;
    orbit.add(m);
    orbiters.push(m);
  }
  group.add(orbit);

  const clouds: THREE.Group[] = [];
  ([[6.5, 4.5, -4, 1.6], [-5.5, 7, -6, 1.1], [8, -1.5, -2, 1.2], [3.5, 7.5, -3, 0.9]] as const).forEach(([x, y, z, s]) => {
    const c = cloud(s);
    c.position.set(x, y, z);
    group.add(c);
    clouds.push(c);
  });

  return {
    group,
    pickables: [mascot.group],
    update(t, dt, focus) {
      island.position.y = Math.sin(t * 0.9) * 0.2;
      island.rotation.y = t * 0.05;
      mascot.group.position.x = 0;
      mascot.update(t, dt, focus);
      mascot.group.position.y += island.position.y;

      orbiters.forEach((m, i) => {
        const a = m.userData.angle + t * (0.35 + (i % 3) * 0.05);
        m.position.set(Math.cos(a) * m.userData.r, m.userData.y + Math.sin(t * 1.5 + i) * 0.25, Math.sin(a) * m.userData.r);
        m.rotation.y = t * 1.2 + i;
      });
      clouds.forEach((c, i) => { c.position.y += Math.sin(t * 0.5 + i) * 0.003; });
    },
  };
}
