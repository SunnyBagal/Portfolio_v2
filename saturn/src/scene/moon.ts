import { BufferGeometry, Group, LineBasicMaterial, LineLoop, Mesh, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three';
import type { Story } from '../content';
import { createRock } from './rock';
import { moonTexture } from './textures';

const ORBIT_RADIUS = 21;

/** One moon on an orbit tilted away from the ring plane. */
export function createMoon(story: Story, onActivate: (id: string) => void) {
  const pivot = new Group();
  pivot.rotation.set(0.55, 0, -0.32);

  const body = new Mesh(
    new SphereGeometry(0.9, 48, 32),
    new MeshStandardMaterial({ map: moonTexture(), roughness: 1, metalness: 0 }),
  );
  const rock = createRock(story, {
    body,
    hitRadius: 1.5,
    haloScale: 5,
    haloOpacity: 0.32,
    labelOffset: 1.25,
    frameDistance: 5.5,
    seed: 7,
    onActivate,
  });
  pivot.add(rock.object);

  const points = Array.from({ length: 256 }, (_, i) => {
    const a = (i / 256) * Math.PI * 2;
    return new Vector3(Math.cos(a) * ORBIT_RADIUS, 0, Math.sin(a) * ORBIT_RADIUS);
  });
  pivot.add(
    new LineLoop(
      new BufferGeometry().setFromPoints(points),
      new LineBasicMaterial({ color: '#d9a45f', transparent: true, opacity: 0.1 }),
    ),
  );

  let angle = 0.35;
  const place = () => rock.object.position.set(Math.cos(angle) * ORBIT_RADIUS, 0, Math.sin(angle) * ORBIT_RADIUS);
  place();

  return {
    group: pivot,
    rock,
    update(dt: number) {
      angle += dt * 0.025;
      body.rotation.y += dt * 0.05;
      place();
    },
  };
}
