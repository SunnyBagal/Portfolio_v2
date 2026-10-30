import {
  AdditiveBlending,
  Color,
  DoubleSide,
  ShaderMaterial,
  Vector3,
  type MeshStandardMaterial,
} from 'three';

export const PLANET_RADIUS = 5;
/** Sun direction relative to the viewer's heading; the world-space SUN_DIR follows the camera around. */
export const SUN_OFFSET = new Vector3(-0.78, 0.28, 0.56).normalize();
/** Direction toward the sun, in world space. Updated every frame. */
export const SUN_DIR = SUN_OFFSET.clone();

// Shared uniform objects: every material that casts the planet's shadow reads the same values.
export const sunUniforms = {
  uSunDir: { value: SUN_DIR },
  uPlanetRadius: { value: PLANET_RADIUS },
};

/** Analytic shadow of the planet (a sphere at the origin) on any world-space point. */
const planetShadowGLSL = /* glsl */ `
uniform vec3 uSunDir;
uniform float uPlanetRadius;
float planetShadow(vec3 p) {
  float b = dot(p, uSunDir);
  float disc = b * b - (dot(p, p) - uPlanetRadius * uPlanetRadius);
  return b < 0.0 ? 1.0 - 0.85 * smoothstep(0.0, 1.5, disc) : 1.0;
}
`;

/** Patches a standard material so the planet shades it. Works for instanced meshes. */
export function applyPlanetShadow(mat: MeshStandardMaterial) {
  mat.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, sunUniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vSunWorld;')
      .replace(
        '#include <project_vertex>',
        /* glsl */ `#include <project_vertex>
        vec4 sunWorld = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          sunWorld = instanceMatrix * sunWorld;
        #endif
        vSunWorld = (modelMatrix * sunWorld).xyz;`,
      );
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\nvarying vec3 vSunWorld;\n${planetShadowGLSL}`)
      .replace('#include <opaque_fragment>', 'outgoingLight *= planetShadow(vSunWorld);\n#include <opaque_fragment>');
  };
}

/** Fresnel rim on a shell just outside the planet, brighter on the sunlit side. */
export function atmosphereMaterial() {
  return new ShaderMaterial({
    uniforms: { uColor: { value: new Color('#f6d9a6') }, ...sunUniforms },
    vertexShader: /* glsl */ `
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vWorldNormal = normalize(mat3(modelMatrix) * normal);
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vView = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform vec3 uSunDir;
      varying vec3 vNormal;
      varying vec3 vView;
      varying vec3 vWorldNormal;
      void main() {
        float rim = pow(1.0 - max(dot(vNormal, vView), 0.0), 3.2);
        float lit = 0.25 + 0.75 * smoothstep(-0.35, 0.6, dot(vWorldNormal, uSunDir));
        gl_FragColor = vec4(uColor * rim * lit * 0.8, 1.0);
        #include <colorspace_fragment>
      }`,
    blending: AdditiveBlending,
    transparent: true,
    depthWrite: false,
  });
}

/** Fine dust band under each ring's particles: radial striations, soft edges, planet shadow. */
export function ringDustMaterial(opts: { inner: number; outer: number; seed: number; colA: string; colB: string }) {
  return new ShaderMaterial({
    uniforms: {
      ...sunUniforms,
      uInner: { value: opts.inner },
      uOuter: { value: opts.outer },
      uSeed: { value: opts.seed },
      uColA: { value: new Color(opts.colA) },
      uColB: { value: new Color(opts.colB) },
    },
    vertexShader: /* glsl */ `
      varying vec2 vLocal;
      varying vec3 vWorld;
      void main() {
        vLocal = position.xy;
        vec4 w = modelMatrix * vec4(position, 1.0);
        vWorld = w.xyz;
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */ `
      ${planetShadowGLSL}
      uniform float uInner;
      uniform float uOuter;
      uniform float uSeed;
      uniform vec3 uColA;
      uniform vec3 uColB;
      varying vec2 vLocal;
      varying vec3 vWorld;
      float hash(float n) { return fract(sin(n * 12.9898 + uSeed * 78.233) * 43758.5453); }
      void main() {
        float t = (length(vLocal) - uInner) / (uOuter - uInner);
        if (t < 0.0 || t > 1.0) discard;
        float edge = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.85, t);
        float bands = 0.55 + 0.25 * sin(t * 83.0 + uSeed) + 0.2 * sin(t * 211.0 + uSeed * 2.0);
        bands *= 0.55 + 0.45 * hash(floor(t * 48.0));
        vec3 col = mix(uColA, uColB, hash(floor(t * 19.0) + 7.0));
        gl_FragColor = vec4(col * planetShadow(vWorld), bands * edge * 0.6);
        #include <colorspace_fragment>
      }`,
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  });
}
