import * as THREE from 'three';

export interface Pick {
  label: string;
  onClick: () => void;
  onHover?: (hovering: boolean) => void;
}

export interface Station {
  group: THREE.Group;
  /** Called every frame. `focus` is 0..1 how much the camera is parked here. */
  update: (t: number, dt: number, focus: number) => void;
  /** Meshes (or groups) whose `userData.pick` is set. */
  pickables: THREE.Object3D[];
  dispose?: () => void;
}

export interface WorldCtx {
  sparkle: THREE.Texture;
  navigate: (path: string) => void;
  pointer: THREE.Vector2;      // -1..1
  outfit: () => number;
  talentTextures: Map<string, THREE.Texture>;
}
