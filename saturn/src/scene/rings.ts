import {
  Color,
  Euler,
  Group,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Quaternion,
  RingGeometry,
  Vector3,
} from 'three';
import type { RingId, Story } from '../content';
import { createRock, storyRockMesh, type Rock } from './rock';
import { applyPlanetShadow, ringDustMaterial } from './shaders';
import { rng } from './textures';

export interface RingSpec {
  inner: number;
  outer: number;
  /** Particle count on desktop; scaled down on mobile. */
  count: number;
  /** Radians per second. Inner rings orbit faster, like the real thing. */
  speed: number;
  thickness: number;
  seed: number;
  palette: string[];
}

export const RING_IDS: readonly RingId[] = ['inner', 'middle', 'outer'];

export const RING_SPECS: Record<RingId, RingSpec> = {
  inner: {
    inner: 7.0,
    outer: 9.0,
    count: 7000,
    speed: 0.045,
    thickness: 0.07,
    seed: 1,
    palette: ['#eadbbb', '#d9c19b', '#c6a57c', '#b39371'],
  },
  middle: {
    inner: 9.7,
    outer: 11.9,
    count: 8000,
    speed: 0.03,
    thickness: 0.09,
    seed: 2,
    palette: ['#dcbc8e', '#c89d69', '#e8d2a8', '#aa8662'],
  },
  outer: {
    inner: 12.7,
    outer: 14.6,
    count: 6000,
    speed: 0.02,
    thickness: 0.1,
    seed: 3,
    palette: ['#d2c7b2', '#b9ad97', '#9f9485', '#e2d8c4'],
  },
};

export const ringMid = (id: RingId) => (RING_SPECS[id].inner + RING_SPECS[id].outer) / 2;

const smoothstep = (a: number, b: number, x: number) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

function bandDensity(t: number, seed: number) {
  const bands = (0.5 + 0.5 * Math.sin(t * 29 + seed * 3)) * (0.6 + 0.4 * Math.sin(t * 71 + seed));
  return (0.3 + 0.7 * bands) * smoothstep(0, 0.1, t) * smoothstep(1, 0.88, t);
}

function particles(spec: RingSpec, density: number) {
  const count = Math.round(spec.count * density);
  const mat = new MeshStandardMaterial({ roughness: 0.95, metalness: 0, flatShading: true });
  applyPlanetShadow(mat);
  const mesh = new InstancedMesh(new IcosahedronGeometry(1, 0), mat, count);
  const rand = rng(spec.seed * 101);
  const palette = spec.palette.map((h) => new Color(h));
  const m = new Matrix4();
  const q = new Quaternion();
  const e = new Euler();
  const p = new Vector3();
  const s = new Vector3();
  const c = new Color();

  for (let i = 0; i < count; i++) {
    let t: number;
    do t = rand();
    while (rand() > bandDensity(t, spec.seed));
    const r = spec.inner + t * (spec.outer - spec.inner);
    const a = rand() * Math.PI * 2;
    p.set(Math.cos(a) * r, (rand() + rand() + rand() - 1.5) * spec.thickness, Math.sin(a) * r);
    q.setFromEuler(e.set(rand() * 6.3, rand() * 6.3, rand() * 6.3));
    // mostly grit, the occasional chunk
    const size = 0.014 + Math.pow(rand(), 7) * 0.075;
    s.set(size, size * (0.6 + rand() * 0.6), size * (0.7 + rand() * 0.5));
    mesh.setMatrixAt(i, m.compose(p, q, s));
    mesh.setColorAt(i, c.copy(palette[Math.floor(rand() * palette.length)]).multiplyScalar(0.75 + rand() * 0.4));
  }
  mesh.instanceMatrix.needsUpdate = true;
  mesh.instanceColor!.needsUpdate = true;
  mesh.computeBoundingSphere();
  return mesh;
}

function dust(spec: RingSpec) {
  const mesh = new Mesh(
    new RingGeometry(spec.inner, spec.outer, 256, 1),
    ringDustMaterial({
      inner: spec.inner,
      outer: spec.outer,
      seed: spec.seed,
      colA: spec.palette[0],
      colB: spec.palette[2],
    }),
  );
  mesh.rotation.x = -Math.PI / 2;
  mesh.renderOrder = -1;
  return mesh;
}

export function createRings(
  stories: readonly Story[],
  opts: { density: number; onActivate: (id: string) => void },
) {
  const group = new Group();
  const ringGroups = new Map<RingId, Group>();
  const rocks: Rock[] = [];

  for (const id of RING_IDS) {
    const spec = RING_SPECS[id];
    const ring = new Group();
    ring.name = `ring-${id}`;
    ring.rotation.y = spec.seed * 1.3;
    ring.add(dust(spec), particles(spec, opts.density));

    const members = stories.filter((s) => s.orbit === id);
    members.forEach((story, i) => {
      const seed = spec.seed * 10 + i;
      const rock = createRock(story, {
        body: storyRockMesh(0.3, seed),
        hitRadius: 0.75,
        haloScale: 2.4,
        labelOffset: 0.5,
        frameDistance: 4.6,
        seed,
        onActivate: opts.onActivate,
      });
      const a = (i / members.length) * Math.PI * 2 + 0.5;
      rock.object.position.set(Math.cos(a) * ringMid(id), 0, Math.sin(a) * ringMid(id));
      ring.add(rock.object);
      rocks.push(rock);
    });

    group.add(ring);
    ringGroups.set(id, ring);
  }

  return {
    group,
    rocks,
    update(dt: number) {
      for (const id of RING_IDS) ringGroups.get(id)!.rotation.y += RING_SPECS[id].speed * dt;
    },
  };
}
