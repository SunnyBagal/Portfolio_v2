import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three';
import { rng } from './textures';

export function createStarfield(count: number, pixelRatio: number) {
  const rand = rng(5);
  const positions = new Float32Array(count * 3);
  const colors = new Float32Array(count * 3);
  const sizes = new Float32Array(count);
  const tints = ['#fff4e0', '#ffe2b8', '#dfe6ff', '#ffffff'].map((h) => new Color(h));

  for (let i = 0; i < count; i++) {
    const z = rand() * 2 - 1;
    const phi = rand() * Math.PI * 2;
    const r = Math.sqrt(1 - z * z);
    const d = 450 + rand() * 450;
    positions.set([Math.cos(phi) * r * d, z * d, Math.sin(phi) * r * d], i * 3);
    const c = tints[Math.floor(rand() * tints.length)].clone().multiplyScalar(0.35 + rand() * 0.65);
    colors.set([c.r, c.g, c.b], i * 3);
    sizes[i] = 0.7 + Math.pow(rand(), 9) * 2.8;
  }

  const geo = new BufferGeometry();
  geo.setAttribute('position', new BufferAttribute(positions, 3));
  geo.setAttribute('color', new BufferAttribute(colors, 3));
  geo.setAttribute('size', new BufferAttribute(sizes, 1));

  const mat = new ShaderMaterial({
    uniforms: { uPixelRatio: { value: pixelRatio } },
    vertexShader: /* glsl */ `
      attribute float size;
      uniform float uPixelRatio;
      varying vec3 vColor;
      void main() {
        vColor = color;
        gl_PointSize = size * 2.0 * uPixelRatio;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        float d = length(gl_PointCoord - 0.5);
        gl_FragColor = vec4(vColor, smoothstep(0.5, 0.0, d));
        #include <colorspace_fragment>
      }`,
    vertexColors: true,
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  });

  const stars = new Points(geo, mat);
  stars.frustumCulled = false;
  return stars;
}
