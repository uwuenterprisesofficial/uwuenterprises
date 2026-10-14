import * as THREE from 'three';
import { cloud, disposeTree, sparkleField, sparkleTexture, starShape, heartShape, part } from './kit';
import type { Pick, Station, WorldCtx } from './types';
import { createHero } from './stations/hero';
import { createRunway } from './stations/runway';
import { createWardrobe } from './stations/wardrobe';
import { createStudio } from './stations/studio';
import { createGacha } from './stations/gacha';
import { createContact } from './stations/contact';
import { createTools } from './stations/tools';
import { TALENTS } from '../data';
import { hoverStore, outfitStore } from '../state/store';

interface Pose {
  /** world position of the station */
  at: [number, number, number];
  /** camera offset relative to the station */
  cam: [number, number, number];
  /** look-at offset relative to the station */
  look: [number, number, number];
  /** where the 3D object sits on screen: -1 = left half … +1 = right half (desktop) */
  side: number;
  sky: [number, number];
}

const POSES: Pose[] = [
  { at: [0, 0, 0],      cam: [0, 3.4, 9.4],  look: [0, 2.4, 0],  side: 1.35,  sky: [0x3a1c71, 0xff9ecb] },
  { at: [32, 4, -22],   cam: [0, 4.9, 26],   look: [0, 3.0, 0],  side: -1, sky: [0x1a0b2e, 0xd63f8c] },
  { at: [8, 8, -50],    cam: [0, 5.4, 22],   look: [0, 4.0, 0],  side: 1,  sky: [0x6a4c93, 0xffd1dc] },
  { at: [-26, 12, -30], cam: [0, 4.4, 19],   look: [0, 3.0, 0],  side: -1, sky: [0x2a2f6b, 0xa6c8ff] },
  { at: [-40, 16, -72], cam: [0, 4.6, 14.5], look: [0, 3.6, 0],  side: 1,  sky: [0x0f4c5c, 0xb8f2e6] },
  { at: [-22, 18, -90], cam: [0, 4.4, 18.5], look: [0, 3.4, 0],  side: -1, sky: [0x4b2a7a, 0xffc2a8] },
  { at: [8, 22, -114],  cam: [0, 3.4, 14],   look: [0, 3.4, 0],  side: 1,  sky: [0x0b0626, 0x7a3fa8] },
];

const LIGHT_COLORS = [0xff9ecb, 0xff6fae, 0xffd1dc, 0xc9b8ff, 0x9ff0d6, 0xffc2a8, 0xffe29a];

const SKY_VERT = `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;
const SKY_FRAG = `
  uniform vec3 uTop; uniform vec3 uBottom;
  varying vec3 vDir;
  void main() {
    float t = smoothstep(-0.05, 0.75, vDir.y);
    vec3 c = mix(uBottom, uTop, t);
    gl_FragColor = vec4(c, 1.0);
  }`;

/** Tiny downscale + smooth upscale: an irreversible blur for pictures that are not approved yet. */
function blurredCanvas(src: CanvasImageSource & { width: number; height: number }): HTMLCanvasElement {
  const small = document.createElement('canvas');
  small.width = 20;
  small.height = Math.max(1, Math.round((20 * src.height) / src.width));
  small.getContext('2d')!.drawImage(src, 0, 0, small.width, small.height);
  const out = document.createElement('canvas');
  out.width = 256;
  out.height = Math.round((256 * src.height) / src.width);
  const g = out.getContext('2d')!;
  g.imageSmoothingEnabled = true;
  g.imageSmoothingQuality = 'high';
  g.filter = 'blur(6px)';
  g.drawImage(small, -12, -12, out.width + 24, out.height + 24);
  return out;
}

export interface WorldOptions {
  navigate: (path: string) => void;
}

export class World {
  private renderer: THREE.WebGLRenderer;
  private scene = new THREE.Scene();
  private camera = new THREE.PerspectiveCamera(38, 1, 0.1, 600);
  private stations: Station[] = [];
  private raycaster = new THREE.Raycaster();
  private pointer = new THREE.Vector2(0, 0);
  private smoothPointer = new THREE.Vector2(0, 0);
  private clock = new THREE.Clock();
  private raf = 0;
  private current = 0;
  private target = 0;
  private w = 1;
  private h = 1;
  private hovered: THREE.Object3D | null = null;
  private skyMat: THREE.ShaderMaterial;
  private camCurve: THREE.CatmullRomCurve3;
  private lookCurve: THREE.CatmullRomCurve3;
  private ambient: { update: (t: number) => void }[] = [];
  private floaters: THREE.Object3D[] = [];
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  private disposed = false;
  private maxDpr = 1;
  private dpr = 1;
  private frameAcc = 0;
  private frameN = 0;
  private pendingPick = false;
  private frame = 0;
  private light = new THREE.PointLight(0xff9ecb, 60, 40, 1.6);
  private tmpA = new THREE.Color();
  private tmpB = new THREE.Color();
  private sky!: THREE.Mesh;
  private ctx: WorldCtx;

  constructor(private canvas: HTMLCanvasElement, opts: WorldOptions) {
    this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'high-performance' });
    this.maxDpr = Math.min(window.devicePixelRatio, 1.5);
    this.dpr = this.maxDpr;
    this.renderer.setPixelRatio(this.dpr);
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    this.scene.fog = new THREE.Fog(0xff9ecb, 22, 85);

    /* sky dome */
    this.skyMat = new THREE.ShaderMaterial({
      side: THREE.BackSide, depthWrite: false, fog: false,
      uniforms: { uTop: { value: new THREE.Color() }, uBottom: { value: new THREE.Color() } },
      vertexShader: SKY_VERT, fragmentShader: SKY_FRAG,
    });
    const sky = new THREE.Mesh(new THREE.SphereGeometry(300, 24, 16), this.skyMat);
    sky.renderOrder = -10;
    sky.frustumCulled = false;
    this.sky = sky;
    this.scene.add(sky);

    /* lights */
    this.scene.add(new THREE.HemisphereLight(0xfff4fb, 0x9a7be0, 1.35));
    const sun = new THREE.DirectionalLight(0xffffff, 1.9);
    sun.position.set(6, 14, 12);
    this.scene.add(sun);

    /* textures */
    const sparkle = sparkleTexture();
    const loader = new THREE.TextureLoader();
    const talentTextures = new Map<string, THREE.Texture>();
    TALENTS.forEach((t) => {
      const url = t.thumb ?? t.image;
      if (!url) return;
      const tex = loader.load(url, (img) => {
        if (t.blurImages) img.image = blurredCanvas(img.image as CanvasImageSource & { width: number; height: number });
        img.needsUpdate = true;
        const pa = 2.2 / 3.0;
        const ia = img.image.width / img.image.height;
        if (ia > pa) { img.repeat.x = pa / ia; img.offset.x = (1 - img.repeat.x) / 2; }
        else { img.repeat.y = ia / pa; img.offset.y = (1 - img.repeat.y) * 0.8; }
      });
      tex.colorSpace = THREE.SRGBColorSpace;
      talentTextures.set(t.slug, tex);
    });

    this.ctx = {
      sparkle, navigate: opts.navigate, pointer: this.smoothPointer,
      outfit: () => outfitStore.get(), talentTextures,
    };

    /* stations */
    const builders = [createHero, createRunway, createWardrobe, createStudio, createGacha, createTools, createContact];
    builders.forEach((build, i) => {
      const s = build(this.ctx);
      const p = POSES[i].at;
      s.group.position.set(p[0], p[1], p[2]);
      this.scene.add(s.group);
      this.stations.push(s);
    });

    // one light that follows the camera focus: constant light count = no shader recompiles mid-flight
    this.scene.add(this.light);

    this.buildAmbient(sparkle);

    /* camera path */
    const camPts = POSES.map((p) => new THREE.Vector3(p.at[0] + p.cam[0], p.at[1] + p.cam[1], p.at[2] + p.cam[2]));
    const lookPts = POSES.map((p) => new THREE.Vector3(p.at[0] + p.look[0], p.at[1] + p.look[1], p.at[2] + p.look[2]));
    this.camCurve = new THREE.CatmullRomCurve3(camPts, false, 'centripetal');
    this.lookCurve = new THREE.CatmullRomCurve3(lookPts, false, 'centripetal');

    /* events */
    window.addEventListener('pointermove', this.onWindowMove, { passive: true });
    canvas.addEventListener('pointermove', this.onCanvasMove, { passive: true });
    canvas.addEventListener('pointerleave', this.onCanvasLeave);
    canvas.addEventListener('click', this.onClick);
    window.addEventListener('resize', this.onResize);
    this.onResize();

    this.clock.start();
    this.loop();
  }

  /** Continuous scene index: 0 = hero … 5 = contact. */
  setTarget(v: number) {
    this.target = Math.min(Math.max(v, 0), POSES.length - 1);
  }

  /** Jump without easing (route changes etc.). */
  snapTo(v: number) {
    this.target = this.current = v;
  }

  /* ── ambient fill so the flight between stations never feels empty ── */
  private buildAmbient(sparkle: THREE.Texture) {
    const mid = new THREE.Vector3(-4, 10, -48);
    const field = sparkleField(this.reduced ? 160 : 420, mid, new THREE.Vector3(150, 70, 170), sparkle, [0xffffff, 0xffd1ea, 0xc9e7ff, 0xfff3a8], 0.7);
    this.scene.add(field.points);
    this.ambient.push(field);

    // Keep every scene's view free: nothing may sit inside the camera's view cone
    // in front of a station, or on the flight path between stations.
    const sights = POSES.map((p) => {
      const cam = new THREE.Vector3(p.at[0] + p.cam[0], p.at[1] + p.cam[1], p.at[2] + p.cam[2]);
      const look = new THREE.Vector3(p.at[0] + p.look[0], p.at[1] + p.look[1], p.at[2] + p.look[2]);
      const dir = look.clone().sub(cam);
      const len = dir.length();
      return { cam, dir: dir.normalize(), len };
    });
    const flight = new THREE.CatmullRomCurve3(
      sights.map((x) => x.cam), false, 'centripetal',
    ).getSpacedPoints(60);
    const tmp = new THREE.Vector3();
    const isClear = (p: THREE.Vector3, size: number) => {
      for (const v of sights) {
        tmp.copy(p).sub(v.cam);
        const along = tmp.dot(v.dir);
        if (along < -size || along > v.len + 6) continue;
        const lateral = tmp.sub(v.dir.clone().multiplyScalar(along)).length();
        if (lateral < Math.max(along, 0) * 0.85 + size + 6) return false;
      }
      return !flight.some((f) => f.distanceTo(p) < size + 9);
    };
    const scatter = (obj: THREE.Object3D, size: number, spread: THREE.Vector3) => {
      for (let tries = 0; tries < 60; tries++) {
        obj.position.set(
          mid.x + (Math.random() - 0.5) * spread.x,
          mid.y + (Math.random() - 0.5) * spread.y,
          mid.z + (Math.random() - 0.5) * spread.z,
        );
        if (isClear(obj.position, size)) return true;
      }
      return false;
    };

    const colors = [0xffffff, 0xffe9f6, 0xe9f4ff];
    for (let i = 0; i < 24; i++) {
      const size = 1.2 + Math.random() * 2.2;
      const c = cloud(size, colors[i % 3]);
      if (!scatter(c, size * 1.8, new THREE.Vector3(130, 60, 150))) continue;
      c.userData.baseX = c.position.x;
      c.userData.sway = 1 + Math.random() * 2; // gentle sway only, so clouds never wander into view
      c.userData.p = Math.random() * 6;
      this.scene.add(c);
      this.floaters.push(c);
    }
    for (let i = 0; i < 20; i++) {
      const m = part(i % 2 ? heartShape(0.9) : starShape(0.5, 0.22), [0xff9ecb, 0x8fd3ff, 0xfff3a8, 0xc9a7ff][i % 4], 0.03);
      if (!scatter(m, 1.5, new THREE.Vector3(120, 60, 140))) continue;
      m.userData.p = Math.random() * 6;
      this.scene.add(m);
      this.floaters.push(m);
    }
  }

  /* ── events ── */
  private setPointerFrom(e: PointerEvent) {
    this.pointer.set((e.clientX / this.w) * 2 - 1, -((e.clientY / this.h) * 2 - 1));
  }
  private onWindowMove = (e: PointerEvent) => this.setPointerFrom(e);
  private onCanvasMove = (e: PointerEvent) => {
    this.setPointerFrom(e);
    this.pendingPick = true;
  };
  private onCanvasLeave = () => this.setHovered(null);
  private onClick = (e: MouseEvent) => {
    this.setPointerFrom(e as PointerEvent);
    this.updateHover();
    const pick = this.hovered?.userData.pick as Pick | undefined;
    pick?.onClick();
  };

  private activeIndex() { return Math.round(this.current); }

  private updateHover() {
    const s = this.stations[this.activeIndex()];
    if (!s || Math.abs(this.current - this.activeIndex()) > 0.35) { this.setHovered(null); return; }
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hits = this.raycaster.intersectObjects(s.pickables, true);
    let found: THREE.Object3D | null = null;
    for (const h of hits) {
      if (h.object.userData.isOutline) continue;
      let o: THREE.Object3D | null = h.object;
      while (o && !o.userData.pick) o = o.parent;
      if (o) { found = o; break; }
    }
    this.setHovered(found);
  }

  private setHovered(o: THREE.Object3D | null) {
    if (o === this.hovered) return;
    (this.hovered?.userData.pick as Pick | undefined)?.onHover?.(false);
    this.hovered = o;
    this.canvas.style.cursor = o ? 'pointer' : '';
    const pick = o?.userData.pick as Pick | undefined;
    pick?.onHover?.(true);
    hoverStore.set(pick ? pick.label : null);
  }

  private onResize = () => {
    this.w = window.innerWidth;
    this.h = window.innerHeight;
    this.renderer.setSize(this.w, this.h, false);
    this.camera.aspect = this.w / this.h;
    this.camera.updateProjectionMatrix();
  };

  /* ── frame ── */
  private loop = () => {
    if (this.disposed) return;
    this.raf = requestAnimationFrame(this.loop);
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;

    this.adaptQuality(dt);

    const ease = this.reduced ? 1 : 1 - Math.exp(-dt * 5);
    this.current += (this.target - this.current) * ease;
    if (Math.abs(this.target - this.current) < 0.0005) this.current = this.target;
    this.smoothPointer.lerp(this.pointer, 1 - Math.exp(-dt * 9));

    this.placeCamera(t);

    this.stations.forEach((s, i) => {
      const d = Math.abs(this.current - i);
      s.group.visible = d < 1.5;
      if (s.group.visible) s.update(t, dt, Math.max(0, 1 - d * 1.5));
    });
    this.ambient.forEach((a) => a.update(t));
    this.floaters.forEach((f) => {
      f.position.y += Math.sin(t * 0.6 + (f.userData.p ?? f.position.x)) * 0.004;
      if (f.userData.sway) f.position.x = f.userData.baseX + Math.sin(t * 0.12 + f.userData.p) * f.userData.sway;
      else f.rotation.y = t * 0.8 + f.userData.p;
    });

    if (this.pendingPick && (this.frame++ & 1) === 0) { this.pendingPick = false; this.updateHover(); }
    this.updateSky();
    this.renderer.render(this.scene, this.camera);
  };

  private placeCamera(t: number) {
    const n = POSES.length - 1;
    const u = Math.min(Math.max(this.current / n, 0), 1);
    const pos = this.camCurve.getPoint(u);
    const look = this.lookCurve.getPoint(u);

    const aspect = this.w / this.h;
    // pull back on narrow viewports so the stage still fits
    const dolly = Math.max(1, Math.pow(1.7 / aspect, 0.6));
    pos.sub(look).multiplyScalar(dolly).add(look);

    const px = this.smoothPointer.x, py = this.smoothPointer.y;
    pos.x += px * 0.9 + Math.sin(t * 0.4) * 0.12;
    pos.y += py * 0.45 + Math.sin(t * 0.55) * 0.08;
    this.camera.position.copy(pos);
    this.camera.lookAt(look);

    // shift the scene to the side the text panel isn't on
    const mobile = this.w < 860;
    const i0 = Math.min(Math.floor(this.current), POSES.length - 1);
    const i1 = Math.min(i0 + 1, POSES.length - 1);
    const f = this.current - i0;
    const side = POSES[i0].side * (1 - f) + POSES[i1].side * f;
    if (mobile) {
      this.camera.setViewOffset(this.w, this.h, 0, this.h * 0.27, this.w, this.h);
    } else {
      const amt = aspect > 1.3 ? 0.2 : 0.12;
      this.camera.setViewOffset(this.w, this.h, -side * amt * this.w, 0, this.w, this.h);
    }
  }

  /** Drops / restores resolution so slow GPUs still get a smooth frame rate. */
  private adaptQuality(dt: number) {
    this.frameAcc += dt;
    if (++this.frameN < 45) return;
    const avg = this.frameAcc / this.frameN;
    this.frameAcc = 0; this.frameN = 0;
    let next = this.dpr;
    if (avg > 0.024 && this.dpr > 0.75) next = Math.max(0.75, this.dpr - 0.25);
    else if (avg < 0.0185 && this.dpr < this.maxDpr) next = Math.min(this.maxDpr, this.dpr + 0.25);
    if (next !== this.dpr) {
      this.dpr = next;
      this.renderer.setPixelRatio(next);
      this.renderer.setSize(this.w, this.h, false);
    }
  }

  private updateSky() {
    const i0 = Math.min(Math.floor(this.current), POSES.length - 1);
    const i1 = Math.min(i0 + 1, POSES.length - 1);
    const f = this.current - i0;
    this.tmpA.setHex(POSES[i0].sky[0]).lerp(this.tmpB.setHex(POSES[i1].sky[0]), f);
    this.skyMat.uniforms.uTop.value.copy(this.tmpA);
    this.tmpA.setHex(POSES[i0].sky[1]).lerp(this.tmpB.setHex(POSES[i1].sky[1]), f);
    this.skyMat.uniforms.uBottom.value.copy(this.tmpA);
    (this.scene.fog as THREE.Fog).color.copy(this.tmpA);
    this.sky.position.copy(this.camera.position);

    // the single scene light hovers in front of whichever station is in focus
    const a = POSES[i0].at, b = POSES[i1].at;
    this.light.position.set(
      a[0] + (b[0] - a[0]) * f + 2, a[1] + (b[1] - a[1]) * f + 7, a[2] + (b[2] - a[2]) * f + 8,
    );
    this.light.color.setHex(LIGHT_COLORS[i0]).lerp(this.tmpB.setHex(LIGHT_COLORS[i1]), f);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.raf);
    window.removeEventListener('pointermove', this.onWindowMove);
    window.removeEventListener('resize', this.onResize);
    this.canvas.removeEventListener('pointermove', this.onCanvasMove);
    this.canvas.removeEventListener('pointerleave', this.onCanvasLeave);
    this.canvas.removeEventListener('click', this.onClick);
    this.setHovered(null);
    disposeTree(this.scene);
    this.renderer.dispose();
  }
}
