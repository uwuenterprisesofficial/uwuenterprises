import * as THREE from 'three';
import { part, toon, glow, rbox, sphere, heartShape, starShape, sparkleField } from '../kit';
import type { Station, WorldCtx } from '../types';
import { PRODUCTS, TALENTS } from '../../data';

/** UI-mock of the Moody dashboard, drawn to a canvas. */
function moodyTexture() {
  const c = document.createElement('canvas');
  c.width = 640; c.height = 420;
  const g = c.getContext('2d')!;
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;

  const draw = () => {
    g.clearRect(0, 0, 640, 420);
    g.fillStyle = '#fff2fa'; g.fillRect(0, 0, 640, 420);
    // title bar
    g.fillStyle = '#2a1245'; g.fillRect(0, 0, 640, 54);
    ['#ff6fae', '#fff3a8', '#6ff0c8'].forEach((col, i) => {
      g.fillStyle = col; g.beginPath(); g.arc(34 + i * 30, 27, 9, 0, 7); g.fill();
    });
    g.fillStyle = 'rgba(255,255,255,0.18)';
    g.beginPath(); g.roundRect(150, 12, 340, 30, 15); g.fill();
    g.fillStyle = '#fff2fa'; g.font = '700 17px Nunito, sans-serif'; g.textAlign = 'center';
    g.fillText('moody.uwuenterprises.de', 320, 33);

    // logo
    g.textAlign = 'left';
    g.fillStyle = '#2a1245'; g.font = '400 54px "Bagel Fat One", "Arial Black", sans-serif';
    g.fillText('Moody', 34, 122);
    g.fillStyle = '#ff6fae'; g.fillText('✦', 232, 122);
    g.fillStyle = '#7a5a9a'; g.font = '700 18px Nunito, sans-serif';
    g.fillText('Moodboards · Shootings · Community', 36, 150);

    // moodboard tiles
    const pal = ['#ff9ecb', '#8fd3ff', '#fff3a8', '#c9a7ff', '#6ff0c8', '#ffb199', '#ffd1ec', '#a6c8ff'];
    const tiles: [number, number, number, number][] = [
      [34, 176, 170, 200], [214, 176, 120, 96], [214, 282, 120, 94], [344, 176, 118, 150],
      [344, 336, 118, 40], [472, 176, 134, 98], [472, 284, 134, 92],
    ];
    tiles.forEach(([x, y, w, h], i) => {
      g.fillStyle = pal[i % pal.length];
      g.strokeStyle = '#2a1245'; g.lineWidth = 4;
      g.beginPath(); g.roundRect(x, y, w, h, 14); g.fill(); g.stroke();
      g.fillStyle = 'rgba(255,255,255,0.55)';
      g.beginPath(); g.arc(x + 22, y + 22, 8, 0, 7); g.fill();
    });
    // heart on first tile
    g.fillStyle = '#fff'; g.font = '56px sans-serif'; g.textAlign = 'center';
    g.fillText('♡', 119, 296);
    tex.needsUpdate = true;
  };

  draw();
  // redraw once the display font is available
  void document.fonts?.load('54px "Bagel Fat One"').then(draw).catch(() => {});
  return tex;
}

function noteTexture(text: string, bg: string) {
  const c = document.createElement('canvas');
  c.width = c.height = 160;
  const g = c.getContext('2d')!;
  g.fillStyle = bg; g.fillRect(0, 0, 160, 160);
  g.fillStyle = '#2a1245'; g.font = '800 30px Nunito, sans-serif'; g.textAlign = 'center';
  text.split('\n').forEach((line, i, all) => g.fillText(line, 80, 80 + (i - (all.length - 1) / 2) * 36));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

export function createTools(ctx: WorldCtx): Station {
  const group = new THREE.Group();
  const url = PRODUCTS[0]?.url ?? 'https://moody.uwuenterprises.de';

  /* floor */
  const floor = part(new THREE.CylinderGeometry(6.2, 6.2, 0.3, 56), 0xffe0cf, 0.05);
  floor.position.y = -0.15;
  group.add(floor);
  const rug = new THREE.Mesh(new THREE.CylinderGeometry(4.6, 4.6, 0.05, 56), toon(0xffb199));
  rug.position.y = 0.02;
  group.add(rug);

  /* cork moodboard on an easel */
  const board = new THREE.Group();
  board.position.set(0, 4.6, -2.2);
  group.add(board);
  board.add(part(rbox(10.2, 6.4, 0.4, 0.2), 0x8a5a44, 0.05));
  const cork = new THREE.Mesh(rbox(9.6, 5.8, 0.2, 0.1), toon(0xe8b98a));
  cork.position.z = 0.18;
  board.add(cork);
  for (const s of [-1, 1]) {
    const leg = part(new THREE.CylinderGeometry(0.12, 0.14, 5.2, 10), 0x8a5a44, 0.03);
    leg.position.set(s * 3.6, -4.0, -0.6);
    leg.rotation.z = s * -0.08;
    board.add(leg);
  }

  const pins: THREE.Vector3[] = [];
  const pin = (x: number, y: number, color = 0xff6fae) => {
    const p = part(sphere(0.12, 10), color, 0.02);
    p.position.set(x, y, 0.6);
    board.add(p);
    pins.push(new THREE.Vector3(x, y, 0.6));
  };

  // polaroids with the real talent photos
  const cards: THREE.Group[] = [];
  const spots: [number, number, number][] = [[-3.4, 1.25, 0.12], [-1.35, 0.95, -0.1], [0.9, 1.3, 0.08], [3.2, 0.9, -0.12]];
  TALENTS.slice(0, 4).forEach((t, i) => {
    const card = new THREE.Group();
    card.add(part(rbox(1.7, 2.1, 0.06, 0.04), 0xfffaf5, 0.02));
    const img = new THREE.Mesh(
      new THREE.PlaneGeometry(1.5, 1.7),
      new THREE.MeshBasicMaterial({ map: ctx.talentTextures.get(t.slug) ?? null, color: ctx.talentTextures.get(t.slug) ? 0xffffff : 0xffb3d9, toneMapped: false }),
    );
    img.position.set(0, 0.1, 0.04);
    card.add(img);
    card.position.set(spots[i][0], spots[i][1] + 0.45, 0.45);
    card.rotation.z = spots[i][2];
    card.userData.baseRot = spots[i][2];
    board.add(card);
    cards.push(card);
    pin(spots[i][0], spots[i][1] + 1.45, [0xff6fae, 0x8fd3ff, 0xfff3a8, 0x6ff0c8][i]);
  });

  // sticky notes
  const notes: [string, string, number, number, number][] = [
    ['Look\n#3', '#fff3a8', -4.1, -1.55, 0.1], ['Pose-\nIdeen', '#ffd1ec', -2.3, -2.0, -0.08],
    ['Licht ☀', '#d4efff', 3.9, -1.7, 0.12], ['Shooting\nSa 14h', '#d9ffe9', 2.0, -2.1, -0.06],
  ];
  const noteMeshes: THREE.Mesh[] = [];
  notes.forEach(([text, bg, x, y, r]) => {
    const n = new THREE.Mesh(new THREE.PlaneGeometry(1.15, 1.15), new THREE.MeshBasicMaterial({ map: noteTexture(text, bg), toneMapped: false }));
    n.position.set(x, y, 0.32);
    n.rotation.z = r;
    board.add(n);
    noteMeshes.push(n);
    pin(x, y + 0.45, 0xc9a7ff);
  });

  // colour swatches
  [0xff6fae, 0xffb199, 0xfff3a8, 0x6ff0c8, 0x8fd3ff, 0xc9a7ff].forEach((c, i) => {
    const sw = part(new THREE.CylinderGeometry(0.28, 0.28, 0.1, 18), c, 0.02);
    sw.rotation.x = Math.PI / 2;
    sw.position.set(-0.8 + i * 0.62, -2.5, 0.4);
    board.add(sw);
  });

  // red strings between pins
  const stringMat = new THREE.MeshBasicMaterial({ color: 0xff4f6d });
  const linkPairs: [number, number][] = [[0, 1], [1, 2], [2, 3], [0, 4], [3, 6]];
  linkPairs.forEach(([a, b]) => {
    if (!pins[a] || !pins[b]) return;
    const mid = pins[a].clone().add(pins[b]).multiplyScalar(0.5);
    mid.y -= 0.35; mid.z += 0.05;
    const tube = new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(pins[a], mid, pins[b]), 16, 0.025, 5), stringMat);
    board.add(tube);
  });

  /* the Moody window — the clickable star */
  const win = new THREE.Group();
  win.add(part(rbox(5.6, 3.7, 0.25, 0.16), 0x2a1245, 0.04));
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(5.3, 3.4), new THREE.MeshBasicMaterial({ map: moodyTexture(), toneMapped: false }));
  screen.position.z = 0.14;
  win.add(screen);
  for (const s of [-1, 1]) {
    const ear = part(new THREE.ConeGeometry(0.4, 0.8, 3), 0xff6fae, 0.04);
    ear.position.set(s * 2.0, 2.2, 0);
    ear.rotation.z = -s * 0.25;
    win.add(ear);
  }
  const badge = part(starShape(0.55, 0.25), 0xfff3a8, 0.04);
  badge.position.set(2.9, 1.7, 0.3);
  win.add(badge);
  win.position.set(0.6, 3.1, 2.2);
  win.userData.hover = 0;
  win.userData.hovering = false;
  win.userData.pick = {
    label: 'Klick → Moody öffnen ↗',
    onClick: () => { window.open(url, '_blank', 'noopener,noreferrer'); },
    onHover: (h: boolean) => { win.userData.hovering = h; },
  };
  group.add(win);

  /* extras */
  const floaters: THREE.Mesh[] = [];
  for (let i = 0; i < 12; i++) {
    const m = part(i % 2 ? heartShape(0.5) : starShape(0.28, 0.13), [0xff6fae, 0xfff3a8, 0x8fd3ff, 0xffffff][i % 4], 0.02);
    m.position.set((Math.random() - 0.5) * 14, 1 + Math.random() * 7, -4 - Math.random() * 2.5);
    m.userData.p = Math.random() * 6;
    group.add(m);
    floaters.push(m);
  }
  const sparkles = sparkleField(80, new THREE.Vector3(0, 4, 0), new THREE.Vector3(14, 8, 8), ctx.sparkle, [0xffffff, 0xfff3a8, 0xffb199], 0.45);
  group.add(sparkles.points);
  const glowRing = new THREE.Mesh(new THREE.RingGeometry(3.2, 3.5, 48), glow(0xfff3a8, 0.35));
  glowRing.rotation.x = -Math.PI / 2;
  glowRing.position.set(0.6, 0.06, 2.2);
  group.add(glowRing);

  return {
    group,
    pickables: [win],
    update(t, dt) {
      sparkles.update(t);
      win.userData.hover += ((win.userData.hovering ? 1 : 0) - win.userData.hover) * Math.min(1, dt * 9);
      const h = win.userData.hover;
      win.position.y = 3.1 + Math.sin(t * 1.2) * 0.12 + h * 0.25;
      win.rotation.y = ctx.pointer.x * 0.28;
      win.rotation.x = -ctx.pointer.y * 0.1;
      win.scale.setScalar(1 + h * 0.05);
      glowRing.scale.setScalar(1 + Math.sin(t * 2) * 0.03 + h * 0.08);

      cards.forEach((c, i) => { c.rotation.z = c.userData.baseRot + Math.sin(t * 1.1 + i * 1.7) * 0.03; });
      noteMeshes.forEach((n, i) => { n.rotation.z += Math.sin(t * 1.4 + i) * 0.0006; });
      board.rotation.y = ctx.pointer.x * 0.05;
      floaters.forEach((m) => {
        m.rotation.y = t + m.userData.p;
        m.position.y += Math.sin(t * 1.2 + m.userData.p) * 0.004;
      });
    },
  };
}
