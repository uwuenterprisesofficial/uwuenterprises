import * as THREE from 'three';
import { part, toon, glow, rbox, sphere, heartShape, starShape, sparkleField } from '../kit';
import type { Station, WorldCtx } from '../types';
import { CONTACT_EMAIL } from '../../data';

export function createContact(ctx: WorldCtx): Station {
  const group = new THREE.Group();

  /* moon */
  const moon = new THREE.Group();
  moon.add(new THREE.Mesh(sphere(5.2, 40), glow(0xfff6d6)));
  const halo = new THREE.Mesh(sphere(6.6, 32), glow(0xfff0b8, 0.14));
  moon.add(halo);
  const crater = (x: number, y: number, r: number) => {
    const c = new THREE.Mesh(new THREE.CircleGeometry(r, 24), glow(0xf3e2a8, 0.7));
    c.position.set(x, y, 5.22 * Math.sqrt(Math.max(0.01, 1 - (x * x + y * y) / (5.2 * 5.2))));
    c.lookAt(c.position.clone().multiplyScalar(2));
    moon.add(c);
  };
  crater(-1.5, 1.2, 0.8); crater(1.4, -0.6, 1.1); crater(-0.4, -2, 0.5); crater(2.4, 2.0, 0.5);
  moon.position.set(2.5, 6.5, -16);
  group.add(moon);

  /* rooftop */
  const roof = part(new THREE.CylinderGeometry(5, 5.4, 0.8, 6), 0x5b3a8a, 0.05);
  roof.position.y = -0.4;
  group.add(roof);
  const roofTop = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.05, 6), toon(0x7a54b0));
  roofTop.position.y = 0.03;
  group.add(roofTop);
  const chimney = part(rbox(1, 2.2, 1, 0.12), 0x3b2456, 0.04);
  chimney.position.set(-3, 1.1, -1.5);
  group.add(chimney);

  // string lights
  const bulbs: THREE.Mesh[] = [];
  const poles = [-4, 4];
  poles.forEach((x) => {
    const p = part(new THREE.CylinderGeometry(0.07, 0.07, 3.6, 8), 0xfff3a8, 0.02);
    p.position.set(x, 1.8, -2.4);
    group.add(p);
  });
  for (let i = 0; i < 14; i++) {
    const k = i / 13;
    const b = new THREE.Mesh(sphere(0.12, 8), glow(0xfff3a8));
    b.position.set(-4 + k * 8, 3.5 - Math.sin(k * Math.PI) * 0.9, -2.4);
    group.add(b);
    bulbs.push(b);
  }

  /* cat on the roof edge, looking at the moon */
  const cat = new THREE.Group();
  const catMat = toon(0x2a1245);
  const cb = part(sphere(0.65, 20), catMat, 0.03);
  cb.scale.set(1, 1.05, 0.9);
  cb.position.y = 0.65;
  cat.add(cb);
  const ch = part(sphere(0.5, 20), catMat, 0.03);
  ch.position.y = 1.55;
  cat.add(ch);
  for (const s of [-1, 1]) {
    const e = part(new THREE.ConeGeometry(0.2, 0.42, 3), catMat, 0.025);
    e.position.set(s * 0.3, 2.0, 0);
    e.rotation.z = -s * 0.2;
    cat.add(e);
    const eye = new THREE.Mesh(sphere(0.07, 8), glow(0xfff3a8));
    eye.position.set(s * 0.18, 1.58, 0.42);
    cat.add(eye);
  }
  const tailC = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 0, 0), new THREE.Vector3(0.5, -0.1, -0.2),
    new THREE.Vector3(1.0, 0.3, -0.2), new THREE.Vector3(1.2, 0.9, -0.1),
  ]);
  const tail = part(new THREE.TubeGeometry(tailC, 16, 0.11, 8), catMat, 0.025);
  tail.position.set(0.3, 0.2, -0.3);
  cat.add(tail);
  cat.position.set(2.6, 0, 1.2);
  cat.rotation.y = -0.6;
  group.add(cat);

  /* the letter */
  const letter = new THREE.Group();
  const env = part(rbox(3.2, 2.1, 0.3, 0.12), 0xfff2fa, 0.04);
  letter.add(env);
  const flapPivot = new THREE.Group();
  const flapShape = new THREE.Shape();
  flapShape.moveTo(-1.55, 0); flapShape.lineTo(1.55, 0); flapShape.lineTo(0, -1.05); flapShape.closePath();
  const flap = part(new THREE.ExtrudeGeometry(flapShape, { depth: 0.06, bevelEnabled: false }), 0xffb3d9, 0.03);
  flapPivot.add(flap);
  flapPivot.position.set(0, 1.0, 0.18);
  letter.add(flapPivot);
  const seal = part(heartShape(0.5), 0xff3f8e, 0.02);
  seal.position.set(0, 0.0, 0.3);
  letter.add(seal);
  const paper = part(rbox(2.7, 1.6, 0.05, 0.03), 0xffffff, 0.02);
  paper.position.set(0, 0.35, 0.0);
  letter.add(paper);
  letter.position.set(-1.2, 3.8, 1.0);
  letter.userData.hover = 0;
  letter.userData.hovering = false;
  letter.userData.pick = {
    label: 'Klick → Mail schreiben 💌',
    onClick: () => { window.location.href = `mailto:${CONTACT_EMAIL}`; },
    onHover: (h: boolean) => { letter.userData.hovering = h; },
  };
  group.add(letter);

  /* hearts rising from the letter */
  const hearts: THREE.Mesh[] = [];
  for (let i = 0; i < 9; i++) {
    const m = part(heartShape(0.4 + (i % 3) * 0.12), [0xff6fae, 0xffb3d9, 0xffffff][i % 3], 0.02);
    m.userData.p = i / 9;
    group.add(m);
    hearts.push(m);
  }

  /* star field + shooting stars */
  const field = sparkleField(220, new THREE.Vector3(0, 8, -6), new THREE.Vector3(60, 30, 40), ctx.sparkle, [0xffffff, 0xfff3a8, 0xc9a7ff, 0x8fd3ff], 0.5);
  group.add(field.points);
  const shooters: THREE.Mesh[] = [];
  for (let i = 0; i < 3; i++) {
    const m = new THREE.Mesh(new THREE.ConeGeometry(0.06, 2.4, 6), glow(0xffffff, 0.9));
    m.rotation.z = Math.PI / 2 + 0.5;
    m.userData.t = i * 2.2;
    group.add(m);
    shooters.push(m);
  }
  const stars: THREE.Mesh[] = [];
  for (let i = 0; i < 6; i++) {
    const m = part(starShape(0.3, 0.13), [0xfff3a8, 0xffffff][i % 2], 0.02);
    m.position.set(-6 + i * 2.4, 6 + Math.sin(i * 1.7) * 3, -4);
    m.userData.p = i;
    group.add(m);
    stars.push(m);
  }

  return {
    group,
    pickables: [letter],
    update(t, dt) {
      field.update(t);
      moon.rotation.y = t * 0.02;
      halo.scale.setScalar(1 + Math.sin(t * 0.8) * 0.02);

      letter.userData.hover += ((letter.userData.hovering ? 1 : 0) - letter.userData.hover) * Math.min(1, dt * 7);
      const h = letter.userData.hover;
      letter.position.y = 3.8 + Math.sin(t * 1.3) * 0.2 + h * 0.2;
      letter.rotation.y = ctx.pointer.x * 0.35;
      letter.rotation.z = Math.sin(t * 0.9) * 0.05 + h * 0.06;
      letter.scale.setScalar(1 + h * 0.08);
      flapPivot.rotation.x = -h * 2.5;
      paper.position.y = 0.35 + h * 1.0;

      hearts.forEach((m) => {
        const k = (m.userData.p + t * 0.12) % 1;
        m.position.set(-1.2 + Math.sin(k * 9 + m.userData.p * 7) * 0.9, 3.8 + k * 4.5, 1.2);
        m.scale.setScalar(Math.sin(k * Math.PI) * (0.5 + h * 0.8));
        m.rotation.y = t + m.userData.p * 6;
      });

      cat.position.y = Math.sin(t * 1.2) * 0.02;
      cat.children[cat.children.length - 1].rotation.y = Math.sin(t * 1.8) * 0.3;
      bulbs.forEach((b, i) => {
        (b.material as THREE.MeshBasicMaterial).color.setHex(Math.sin(t * 2.5 + i * 0.8) > 0 ? 0xfff3a8 : 0xffb3d9);
      });
      shooters.forEach((m) => {
        const k = ((t * 0.35 + m.userData.t) % 6) / 6;
        m.position.set(14 - k * 40, 14 - k * 18 + m.userData.t, -8);
        (m.material as THREE.MeshBasicMaterial).opacity = k < 0.3 ? 0.9 : 0;
        m.visible = k < 0.3;
      });
      stars.forEach((m) => { m.rotation.y = t + m.userData.p; m.scale.setScalar(1 + Math.sin(t * 2 + m.userData.p) * 0.15); });
    },
  };
}
