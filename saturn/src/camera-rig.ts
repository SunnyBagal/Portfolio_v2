import { Vector3, type PerspectiveCamera } from 'three';
import type { OrbitControls } from 'three/addons/controls/OrbitControls.js';

export interface Pose {
  position: Vector3;
  target: Vector3;
}

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

/**
 * Flies the camera between poses. The path blends direction and distance from the planet
 * separately, so the camera swings around Saturn instead of cutting through it.
 */
export class CameraRig {
  private from: Pose | null = null;
  private to: Pose | null = null;
  private start = 0;
  private duration = 900;
  private readonly dir = new Vector3();
  private readonly tmp = new Vector3();
  private readonly pos = new Vector3();
  private readonly target = new Vector3();

  constructor(
    private readonly camera: PerspectiveCamera,
    private readonly controls: OrbitControls,
    /** prefers-reduced-motion: cut instead of tweening */
    private readonly instant: boolean,
  ) {}

  get flying() {
    return this.to !== null;
  }

  flyTo(to: Pose, duration = 900) {
    if (this.instant) {
      this.apply(to.position, to.target);
      this.controls.update();
      return;
    }
    this.controls.enabled = false;
    this.from = { position: this.camera.position.clone(), target: this.controls.target.clone() };
    this.to = to;
    this.start = performance.now();
    this.duration = duration;
  }

  /** Advances the tween. Returns true while the rig owns the camera. */
  update(now: number) {
    const { from, to } = this;
    if (!from || !to) return false;
    const t = Math.min(Math.max((now - this.start) / this.duration, 0), 1);
    const e = easeInOutCubic(t);

    this.dir.copy(from.position).normalize().lerp(this.tmp.copy(to.position).normalize(), e);
    if (this.dir.lengthSq() < 1e-6) {
      // start and end are on opposite sides: fall back to a straight line
      this.pos.lerpVectors(from.position, to.position, e);
    } else {
      this.pos.copy(this.dir.normalize()).multiplyScalar(lerp(from.position.length(), to.position.length(), e));
    }
    this.target.lerpVectors(from.target, to.target, e);
    this.apply(this.pos, this.target);

    if (t >= 1) {
      this.from = this.to = null;
      this.controls.enabled = true;
      this.controls.update();
    }
    return true;
  }

  private apply(position: Vector3, target: Vector3) {
    this.camera.position.copy(position);
    this.controls.target.copy(target);
    this.camera.lookAt(target);
  }
}
