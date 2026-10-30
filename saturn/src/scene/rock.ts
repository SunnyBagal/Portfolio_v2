import {
  AdditiveBlending,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Sprite,
  SpriteMaterial,
  Vector3,
  type Object3D,
} from 'three';
import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';
import { mergeVertices } from 'three/addons/utils/BufferGeometryUtils.js';
import { kindLabel, type Story } from '../content';
import { glowTexture, rng } from './textures';

/** A clickable, labelled story object in the scene: a ring rock or the moon. */
export interface Rock {
  story: Story;
  object: Group;
  hit: Mesh;
  halo: Sprite;
  label: HTMLButtonElement;
  /** How far the camera sits from this rock when it is opened. */
  frameDistance: number;
  haloOpacity: number;
  phase: number;
}

function rockGeometry(radius: number, seed: number) {
  const base = new IcosahedronGeometry(radius, 2);
  base.deleteAttribute('normal');
  base.deleteAttribute('uv');
  const geo = mergeVertices(base);
  const pos = geo.getAttribute('position');
  const rand = rng(seed);
  const v = new Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i).multiplyScalar(0.82 + rand() * 0.3);
    pos.setXYZ(i, v.x, v.y, v.z);
  }
  geo.computeVertexNormals();
  return geo;
}

export function storyRockMesh(radius: number, seed: number) {
  return new Mesh(
    rockGeometry(radius, seed),
    new MeshStandardMaterial({
      color: '#eedbb4',
      roughness: 0.85,
      flatShading: true,
      emissive: '#ff9a3c',
      emissiveIntensity: 0.4,
    }),
  );
}

export function createRock(
  story: Story,
  opts: {
    body: Object3D;
    hitRadius: number;
    haloScale: number;
    haloOpacity?: number;
    labelOffset: number;
    frameDistance: number;
    seed: number;
    onActivate: (id: string) => void;
  },
): Rock {
  const object = new Group();
  object.name = story.id;

  const haloOpacity = opts.haloOpacity ?? 0.6;
  const halo = new Sprite(
    new SpriteMaterial({
      map: glowTexture(),
      color: '#ffb35c',
      blending: AdditiveBlending,
      depthWrite: false,
      transparent: true,
      opacity: haloOpacity,
    }),
  );
  halo.scale.setScalar(opts.haloScale);

  const hit = new Mesh(new SphereGeometry(opts.hitRadius, 10, 8), new MeshBasicMaterial({ visible: false }));
  hit.userData.storyId = story.id;

  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'rock-label';
  button.dataset.story = story.id;
  button.setAttribute('aria-label', `${story.title}, ${kindLabel(story)}`);
  const kind = document.createElement('span');
  kind.className = 'k';
  kind.textContent = story.kind;
  const name = document.createElement('span');
  name.className = 'n';
  name.textContent = story.label;
  button.append(kind, name);
  button.addEventListener('click', () => opts.onActivate(story.id));

  const label = new CSS2DObject(button);
  label.center.set(0.5, 1);
  label.position.set(0, opts.labelOffset, 0);

  object.add(opts.body, halo, hit, label);
  return {
    story,
    object,
    hit,
    halo,
    label: button,
    frameDistance: opts.frameDistance,
    haloOpacity,
    phase: opts.seed * 1.7,
  };
}
