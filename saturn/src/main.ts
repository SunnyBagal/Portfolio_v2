import './style.css';
import {
  ACESFilmicToneMapping,
  AmbientLight,
  Color,
  DirectionalLight,
  Group,
  MathUtils,
  PerspectiveCamera,
  Raycaster,
  Scene,
  Vector2,
  Vector3,
  WebGLRenderer,
  type SpriteMaterial,
} from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { CameraRig, type Pose } from './camera-rig';
import { moon as moonInfo, profile, rings as ringInfo, stories, type RingId } from './content';
import { parseIntent } from './intents';
import { createMoon } from './scene/moon';
import { createPlanet } from './scene/planet';
import { RING_IDS, createRings } from './scene/rings';
import { PLANET_RADIUS, SUN_DIR, SUN_OFFSET } from './scene/shaders';
import { createStarfield } from './scene/starfield';
import { createCommandBar } from './ui/commands';
import { createPanel } from './ui/panel';
import { rich } from './ui/rich';

const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
const lowPower = matchMedia('(max-width: 760px), (pointer: coarse)').matches;
const sheetLayout = matchMedia('(max-width: 760px)');
const pixelRatio = Math.min(devicePixelRatio, 2);

// Renderer, label layer, scene

const stage = document.getElementById('stage')!;
const renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(pixelRatio);
renderer.setSize(innerWidth, innerHeight);
renderer.toneMapping = ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.05;
stage.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.setSize(innerWidth, innerHeight);
labelRenderer.domElement.className = 'label-layer';
stage.appendChild(labelRenderer.domElement);

const scene = new Scene();
scene.background = new Color('#05060a');
const camera = new PerspectiveCamera(42, innerWidth / innerHeight, 0.1, 2000);

const sun = new DirectionalLight('#fff1dc', 2.7);
sun.position.copy(SUN_DIR).multiplyScalar(100);
scene.add(sun, new AmbientLight('#8a93a8', 0.14));

// Planet and rings share one tilted frame, like Saturn's axial tilt.
const system = new Group();
system.rotation.set(0.12, 0, 0.34);
scene.add(system);

const planet = createPlanet();
const ringSet = createRings(stories, { density: lowPower ? 0.35 : 1, onActivate: (id) => openStory(id) });
system.add(planet.group, ringSet.group);

const moon = createMoon(stories.find((s) => s.orbit === 'moon')!, (id) => openStory(id));
scene.add(moon.group, createStarfield(lowPower ? 2500 : 5000, pixelRatio));

const rocks = [...ringSet.rocks, moon.rock];
const rockById = new Map(rocks.map((r) => [r.story.id, r]));
const hitTargets = [planet.mesh, ...rocks.map((r) => r.hit)];

// Camera

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.enablePan = false;
controls.minDistance = 2.2;
controls.maxDistance = 140;
controls.autoRotateSpeed = 0.35;
const rig = new CameraRig(camera, controls, reducedMotion);

function overviewPose(): Pose {
  // fit the outer ring (and the moon on wide screens) horizontally
  const fitRadius = camera.aspect < 1 ? 12.5 : 21;
  const halfFov = Math.tan(MathUtils.degToRad(camera.fov / 2));
  const distance = Math.max(30, fitRadius / (halfFov * camera.aspect));
  // keep the visitor's current heading so the return trip is short
  const heading = new Vector3(camera.position.x, 0, camera.position.z);
  if (heading.lengthSq() < 1e-6) heading.set(0, 0, 1);
  heading.normalize();
  heading.y = 0.45;
  return { position: heading.normalize().multiplyScalar(distance), target: new Vector3() };
}

/** Looks at `focus` from outward and above the ring plane, with Saturn behind. Shifts the frame clear of the panel. */
function framePose(focus: Vector3, distance: number, clearPanel: boolean): Pose {
  const ringUp = new Vector3(0, 1, 0).applyQuaternion(system.quaternion);
  const dir = focus.clone().normalize().multiplyScalar(0.75).addScaledVector(ringUp, 0.65).normalize();
  // narrow portrait screens need more distance to fit the same subject
  const position = focus.clone().addScaledVector(dir, distance * (camera.aspect < 1 ? 1.5 : 1));
  const target = focus.clone();
  if (clearPanel) {
    const halfH = position.distanceTo(target) * Math.tan(MathUtils.degToRad(camera.fov / 2));
    const forward = target.clone().sub(position).normalize();
    const right = forward.clone().cross(camera.up).normalize();
    const up = right.clone().cross(forward);
    const shift = sheetLayout.matches
      ? up.multiplyScalar(-halfH * (panel.el.offsetHeight / innerHeight))
      : right.multiplyScalar(halfH * camera.aspect * (panel.el.offsetWidth / innerWidth));
    position.add(shift);
    target.add(shift);
  }
  return { position, target };
}

const worldPos = (id: string) => rockById.get(id)!.object.getWorldPosition(new Vector3());

// View state

type View = { kind: 'overview' } | { kind: 'ring'; ring: RingId } | { kind: 'story'; id: string };
let view: View = { kind: 'overview' };
let opener: HTMLElement | null = null;

function setView(next: View) {
  view = next;
  const story = next.kind === 'story' ? rockById.get(next.id)!.story : null;
  const lit = next.kind === 'ring' ? next.ring : story?.orbit;
  for (const r of rocks) {
    r.label.classList.toggle('is-lit', r.story.orbit === lit);
    r.label.classList.toggle('is-active', r.story === story);
  }
  document.body.dataset.view = next.kind;
  controls.autoRotate = next.kind === 'overview' && !reducedMotion;
}

const panel = createPanel({ onBack: () => goOverview(), onOpenStory: (id) => openStory(id) });

function openStory(id: string) {
  const rock = rockById.get(id);
  if (!rock) return;
  if (!panel.isOpen) opener = document.activeElement instanceof HTMLElement ? document.activeElement : null;
  hideRingChip();
  setView({ kind: 'story', id });
  panel.open(rock.story);
  rig.flyTo(framePose(worldPos(id), rock.frameDistance, true));
}

function goRing(ring: RingId) {
  panel.close();
  setView({ kind: 'ring', ring });
  showRingChip(ring);
  // frame the ring's rock nearest the camera, pulled back to show the arc around it
  const nearest = rocks
    .filter((r) => r.story.orbit === ring)
    .map((r) => worldPos(r.story.id))
    .sort((a, b) => a.distanceToSquared(camera.position) - b.distanceToSquared(camera.position))[0];
  rig.flyTo(framePose(nearest, 9, false));
}

function goOverview() {
  if (view.kind === 'overview') return;
  const focusInPanel = panel.el.contains(document.activeElement);
  panel.close();
  hideRingChip();
  setView({ kind: 'overview' });
  rig.flyTo(overviewPose());
  if (focusInPanel && opener?.isConnected) opener.focus({ preventScroll: true });
}

// HUD: legend, ring chip, footer, tooltip

const legend = document.getElementById('legend')!;
const legendItems: Array<[string, string, () => void]> = [
  ...RING_IDS.map((id): [string, string, () => void] => [id, ringInfo[id].name, () => goRing(id)]),
  ['moon', moonInfo.name, () => openStory('wispr-flow-india')],
];
for (const [key, name, go] of legendItems) {
  const b = document.createElement('button');
  b.type = 'button';
  b.innerHTML = `<span class="n">${key}</span>`;
  b.append(name);
  b.addEventListener('click', go);
  legend.append(b);
}

const ringChip = document.getElementById('ring-chip')!;
function showRingChip(ring: RingId) {
  const h = document.createElement('h2');
  h.textContent = `${ring} ring · ${ringInfo[ring].name}`;
  const list = document.createElement('div');
  list.className = 'list';
  for (const r of rocks.filter((x) => x.story.orbit === ring)) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = r.story.label;
    b.addEventListener('click', () => openStory(r.story.id));
    list.append(b);
  }
  const back = document.createElement('button');
  back.type = 'button';
  back.className = 'chip-back';
  back.textContent = '← Overview';
  back.addEventListener('click', goOverview);
  ringChip.replaceChildren(h, list, back);
  ringChip.hidden = false;
}
function hideRingChip() {
  ringChip.hidden = true;
}

const foot = document.getElementById('foot')!;
foot.append(rich('p', [profile.github]), rich('p', [profile.email]), rich('p', profile.location));

const tooltip = document.getElementById('tooltip')!;
tooltip.textContent = profile.tagline;
let tooltipTimer = 0;
function showTooltip(x: number, y: number) {
  tooltip.hidden = false;
  tooltip.style.transform = `translate(${Math.min(x + 16, innerWidth - tooltip.offsetWidth - 12)}px, ${y + 18}px)`;
}

// Commands (voice + typed)

createCommandBar((text) => {
  const intent = parseIntent(text);
  switch (intent.kind) {
    case 'overview':
      goOverview();
      return 'Overview';
    case 'ring':
      goRing(intent.ring);
      return `${intent.ring} ring: ${ringInfo[intent.ring].name}`;
    case 'story':
      openStory(intent.id);
      return rockById.get(intent.id)!.story.title;
    case 'unknown':
      return 'No match. Try “what you built”, “mistakes”, “how do you think”, “pitch” or “back”.';
  }
});

addEventListener('keydown', (e) => {
  if (e.key === 'Escape') goOverview();
});

// Picking

const raycaster = new Raycaster();
const pointer = new Vector2();
const pointerPx = { x: 0, y: 0 };
let pointerInside = false;
let hoverDirty = false;
let downAt: { x: number; y: number } | null = null;

function pick() {
  raycaster.setFromCamera(pointer, camera);
  const hit = raycaster.intersectObjects(hitTargets, false)[0];
  if (!hit) return null;
  return hit.object === planet.mesh ? 'planet' : rockById.get(hit.object.userData.storyId as string)!;
}

const setPointer = (e: PointerEvent) => {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  pointerPx.x = e.clientX;
  pointerPx.y = e.clientY;
};
const canvas = renderer.domElement;
canvas.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  setPointer(e);
  pointerInside = true;
  hoverDirty = true;
});
canvas.addEventListener('pointerleave', () => {
  pointerInside = false;
  tooltip.hidden = true;
});
canvas.addEventListener('pointerdown', (e) => (downAt = { x: e.clientX, y: e.clientY }));
canvas.addEventListener('pointerup', (e) => {
  if (!downAt || Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) > 6) return;
  downAt = null;
  setPointer(e);
  const target = pick();
  if (target === 'planet') {
    if (e.pointerType !== 'mouse') {
      // touch has no hover: show the planet's line briefly on tap
      showTooltip(e.clientX, e.clientY);
      clearTimeout(tooltipTimer);
      tooltipTimer = window.setTimeout(() => (tooltip.hidden = true), 2600);
    }
  } else if (target) {
    openStory(target.story.id);
  }
});

let hovered: HTMLElement | null = null;
function updateHover() {
  if (!hoverDirty || !pointerInside || rig.flying) return;
  hoverDirty = false;
  const target = pick();
  const label = target && target !== 'planet' ? target.label : null;
  if (label !== hovered) {
    hovered?.classList.remove('is-hover');
    label?.classList.add('is-hover');
    hovered = label;
  }
  canvas.style.cursor = label ? 'pointer' : '';
  if (target === 'planet') showTooltip(pointerPx.x, pointerPx.y);
  else tooltip.hidden = true;
}

// Labels behind the planet fade out (CSS2D labels are not depth tested).
const toRock = new Vector3();
const rockPos = new Vector3();
function updateOcclusion() {
  const cam = camera.position;
  const c = cam.lengthSq() - PLANET_RADIUS * PLANET_RADIUS;
  for (const r of rocks) {
    r.object.getWorldPosition(rockPos);
    toRock.subVectors(rockPos, cam);
    const len = toRock.length();
    toRock.divideScalar(len);
    const b = cam.dot(toRock);
    const disc = b * b - c;
    const t0 = disc > 0 ? -b - Math.sqrt(disc) : -1;
    r.label.classList.toggle('is-occluded', t0 > 0 && t0 < len);
  }
}

// Resize

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  labelRenderer.setSize(innerWidth, innerHeight);
});

// Optional fps readout: add ?fps to the URL.
const fpsEl = new URLSearchParams(location.search).has('fps') ? document.createElement('output') : null;
if (fpsEl) {
  fpsEl.className = 'fps';
  document.body.append(fpsEl);
}
let fpsFrames = 0;
let fpsSince = performance.now();

// Loop

setView({ kind: 'overview' });
const start = overviewPose();
camera.position.copy(start.position);
controls.update();

const UP = new Vector3(0, 1, 0);
let last = performance.now();
renderer.setAnimationLoop((now: number) => {
  const dt = Math.min((now - last) / 1000, 0.05);
  last = now;

  if (!reducedMotion) {
    planet.update(dt);
    if (view.kind === 'overview') {
      ringSet.update(dt);
      moon.update(dt);
    }
    const t = now / 1000;
    for (const r of rocks) {
      const active = view.kind === 'story' && view.id === r.story.id;
      (r.halo.material as SpriteMaterial).opacity =
        r.haloOpacity * (active ? 1.5 : 1) * (0.8 + 0.2 * Math.sin(t * 1.6 + r.phase));
    }
  }

  if (!rig.update(now)) controls.update(dt);
  // Keep the sun over the visitor's shoulder so auto-rotation never parks on the night side.
  SUN_DIR.copy(SUN_OFFSET).applyAxisAngle(UP, Math.atan2(camera.position.x, camera.position.z));
  sun.position.copy(SUN_DIR).multiplyScalar(100);
  updateOcclusion();
  updateHover();
  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);

  if (fpsEl && ++fpsFrames && now - fpsSince > 500) {
    fpsEl.value = `${Math.round((fpsFrames * 1000) / (now - fpsSince))} fps`;
    fpsFrames = 0;
    fpsSince = now;
  }
  document.body.dataset.ready = '1';
});
