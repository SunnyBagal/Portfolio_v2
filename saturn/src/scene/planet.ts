import { Group, Mesh, MeshStandardMaterial, SphereGeometry } from 'three';
import { PLANET_RADIUS, atmosphereMaterial } from './shaders';
import { planetTexture } from './textures';

export function createPlanet() {
  const group = new Group();
  // Saturn is visibly oblate
  group.scale.set(1, 0.93, 1);

  const mesh = new Mesh(
    new SphereGeometry(PLANET_RADIUS, 96, 64),
    new MeshStandardMaterial({ map: planetTexture(), roughness: 0.92, metalness: 0 }),
  );
  const atmosphere = new Mesh(new SphereGeometry(PLANET_RADIUS * 1.025, 64, 48), atmosphereMaterial());
  group.add(mesh, atmosphere);

  return {
    group,
    mesh,
    update(dt: number) {
      mesh.rotation.y += dt * 0.04;
    },
  };
}
