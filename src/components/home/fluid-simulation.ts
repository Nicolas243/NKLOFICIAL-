import {
  rasterizeObstaclesMask,
  type FluidObstacleRect,
} from '@/components/home/fluid-obstacles';

export const FLUID_GRID_WIDTH = 144;
export const FLUID_GRID_HEIGHT = 88;

const GRID_SIZE = FLUID_GRID_WIDTH * FLUID_GRID_HEIGHT;
const PRESSURE_ITERATIONS = 5;
const SIM_SPEED_SCALE = 0.55;
const VORTICITY_STRENGTH = 6.5;
const VELOCITY_DECAY = 0.975;
const DYE_DECAY = 0.968;
const WARM_DECAY = 0.955;
const MAX_DYE = 1.0;
const MAX_VELOCITY = 18;

function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value;
}

/**
 * Pure-TypeScript 2D stable Eulerian fluid solver on a 144x88 grid.
 * Uses pre-allocated Float32Array buffers for zero per-frame heap allocations.
 */
export class FluidSimulation {
  readonly width = FLUID_GRID_WIDTH;
  readonly height = FLUID_GRID_HEIGHT;

  private readonly u = new Float32Array(GRID_SIZE);
  private readonly v = new Float32Array(GRID_SIZE);
  private readonly uPrev = new Float32Array(GRID_SIZE);
  private readonly vPrev = new Float32Array(GRID_SIZE);
  private readonly curl = new Float32Array(GRID_SIZE);
  private readonly div = new Float32Array(GRID_SIZE);
  private readonly p = new Float32Array(GRID_SIZE);
  private readonly dye = new Float32Array(GRID_SIZE);
  private readonly dyePrev = new Float32Array(GRID_SIZE);
  private readonly warm = new Float32Array(GRID_SIZE);
  private readonly warmPrev = new Float32Array(GRID_SIZE);
  private readonly obstacle = new Uint8Array(GRID_SIZE);

  private hasLastPointer = false;
  private lastNx = 0.5;
  private lastNy = 0.5;

  constructor() {
    this.seedInitialField();
  }

  setObstacles(rects: readonly FluidObstacleRect[]): void {
    rasterizeObstaclesMask(rects, this.width, this.height, this.obstacle, 1, false);
    for (let i = 0; i < GRID_SIZE; i += 1) {
      if (this.obstacle[i] === 1) {
        this.u[i] = 0;
        this.v[i] = 0;
        this.dye[i] = 0;
        this.warm[i] = 0;
      }
    }
  }

  /**
   * Resets pointer continuity so the next splat starts cleanly without streaking.
   */
  resetPointer(): void {
    this.hasLastPointer = false;
  }

  /**
   * Injects momentum and dual-channel dye along the linear path from the last pointer coordinate.
   */
  splat(nx: number, ny: number, dx: number, dy: number, intensity = 1): void {
    const cx = clamp(nx, 0, 1);
    const cy = clamp(ny, 0, 1);
    const power = clamp(intensity, 0.1, 2.5);

    if (!this.hasLastPointer) {
      this.lastNx = cx;
      this.lastNy = cy;
      this.hasLastPointer = true;
    }

    const spanX = (cx - this.lastNx) * this.width;
    const spanY = (cy - this.lastNy) * this.height;
    const spanDist = Math.hypot(spanX, spanY);
    const steps = clamp(Math.ceil(spanDist * 1.15), 1, 14);

    const velX = clamp(dx * this.width * 7.5 * power, -MAX_VELOCITY, MAX_VELOCITY);
    const velY = clamp(dy * this.height * 7.5 * power, -MAX_VELOCITY, MAX_VELOCITY);
    const speed = Math.hypot(velX, velY);
    const dyeScale = 1 / Math.sqrt(steps);
    const baseDye = clamp((0.14 + speed * 0.025) * power, 0.14, 0.46) * dyeScale;
    const warmDye = clamp((speed - 0.8) * 0.04 * power, 0, 0.34) * dyeScale;
    const radius = 2.7;
    const invRadiusSq = 1 / (radius * radius);

    for (let s = 1; s <= steps; s += 1) {
      const t = s / steps;
      const px = (this.lastNx + (cx - this.lastNx) * t) * (this.width - 1);
      const py = (this.lastNy + (cy - this.lastNy) * t) * (this.height - 1);
      this.depositSplat(px, py, velX, velY, baseDye, warmDye, invRadiusSq);
    }

    this.lastNx = cx;
    this.lastNy = cy;
  }

  stirBurst(nx: number, ny: number, power = 1.1): void {
    const cx = clamp(nx, 0, 1) * (this.width - 1);
    const cy = clamp(ny, 0, 1) * (this.height - 1);
    const invRadiusSq = 1 / 12;
    this.depositSplat(cx + 2, cy, 2.2 * power, 1.8 * power, 0.34, 0.1, invRadiusSq);
    this.depositSplat(cx - 2, cy, -2.2 * power, -1.8 * power, 0.34, 0.08, invRadiusSq);
  }

  /**
   * Simula deslocamento hidrodinamico quando um card ou bloco submerso cruza a viewport.
   */
  displaceRect(
    leftN: number,
    topN: number,
    rightN: number,
    bottomN: number,
    velY: number,
    intensity = 1,
  ): void {
    const clampedVel = clamp(velY, -1, 1);
    if (Math.abs(clampedVel) < 0.015) return;

    const l = clamp(leftN, 0, 1);
    const r = clamp(rightN, 0, 1);
    const t = clamp(topN, 0, 1);
    const b = clamp(bottomN, 0, 1);
    if (r - l < 0.02 || b - t < 0.02) return;

    const power = clamp(intensity, 0.35, 1.8);
    const leadingDomY = clampedVel < 0 ? t : b;
    const leadOffset = clampedVel < 0 ? -0.012 : 0.012;
    const pyLead = clamp(leadingDomY + leadOffset, 0, 1) * (this.height - 1);
    const pyMid = ((t + b) * 0.5) * (this.height - 1);
    const pxLeft = (l + (r - l) * 0.28) * (this.width - 1);
    const pxRight = (l + (r - l) * 0.72) * (this.width - 1);
    const pushY = clampedVel * 7 * power;
    const pushSide = (2 + 4 * Math.abs(clampedVel)) * power;
    const invRadiusSq = 1 / 11;

    this.depositSplat(pxLeft, pyLead, -pushSide, pushY, 0.26 * power, 0.05 * power, invRadiusSq);
    this.depositSplat(pxRight, pyLead, pushSide, pushY, 0.26 * power, 0.05 * power, invRadiusSq);

    if (l > 0.015) {
      this.depositSplat(clamp(l - 0.012, 0, 1) * (this.width - 1), pyMid, -pushSide * 0.65, -pushY * 0.5, 0.18 * power, 0.03 * power, invRadiusSq);
    }
    if (r < 0.985) {
      this.depositSplat(clamp(r + 0.012, 0, 1) * (this.width - 1), pyMid, pushSide * 0.65, -pushY * 0.5, 0.18 * power, 0.03 * power, invRadiusSq);
    }
  }

  /**
   * Advances the Eulerian fluid solver with ambient drift, vorticity, projection, and advection.
   */
  step(dt: number, ambientTime: number): void {
    const clampedDt = clamp(dt, 0.004, 0.033);
    const simDt = clampedDt * SIM_SPEED_SCALE;

    this.injectAmbient(simDt, ambientTime);
    this.applyVorticity(simDt);

    for (let i = 0; i < GRID_SIZE; i += 1) {
      this.u[i] *= VELOCITY_DECAY;
      this.v[i] *= VELOCITY_DECAY;
    }

    this.project();

    this.uPrev.set(this.u);
    this.vPrev.set(this.v);
    this.advect(1, this.u, this.uPrev, this.uPrev, this.vPrev, simDt, 1);
    this.advect(2, this.v, this.vPrev, this.uPrev, this.vPrev, simDt, 1);

    this.project();

    this.dyePrev.set(this.dye);
    this.warmPrev.set(this.warm);
    this.advect(0, this.dye, this.dyePrev, this.u, this.v, simDt, DYE_DECAY);
    this.advect(0, this.warm, this.warmPrev, this.u, this.v, simDt, WARM_DECAY);

    for (let i = 0; i < GRID_SIZE; i += 1) {
      if (this.dye[i] > MAX_DYE) this.dye[i] = MAX_DYE;
      if (this.warm[i] > MAX_DYE) this.warm[i] = MAX_DYE;
    }
  }

  /**
   * Renders the dye fields directly into ImageData RGBA pixels calibrated for light or dark mode.
   */
  render(imageData: ImageData, isDark: boolean): void {
    const data = imageData.data;

    // Light: cores escuras com +30% chroma (cobalto / esmeralda / terracota, alpha max ~0.61).
    // Dark: cores claras vibrantes com teto de opacidade para nunca lavar o fundo escuro (alpha max ~0.42).
    const r0 = isDark ? 38 : 4;
    const g0 = isDark ? 205 : 42;
    const b0 = isDark ? 255 : 186;

    const r1 = isDark ? 152 : 6;
    const g1 = isDark ? 148 : 102;
    const b1 = isDark ? 255 : 158;

    const rWarm = isDark ? 255 : 188;
    const gWarm = isDark ? 142 : 42;
    const bWarm = isDark ? 68 : 8;

    const maxAlpha = isDark ? 108 : 156;
    const maxWarmWeight = isDark ? 0.65 : 0.58;
    const wGrid = this.width;
    const hGrid = this.height;

    for (let y = 0; y < hGrid; y += 1) {
      const row = y * wGrid;
      const yUp = y > 0 ? y - 1 : 0;
      const yDown = y < hGrid - 1 ? y + 1 : hGrid - 1;
      for (let x = 0; x < wGrid; x += 1) {
        const i = row + x;
        const offset = i * 4;
        if (this.obstacle[i] === 1) {
          data[offset] = 0;
          data[offset + 1] = 0;
          data[offset + 2] = 0;
          data[offset + 3] = 0;
          continue;
        }
        const d = clamp(this.dye[i], 0, 1);
        const w = clamp(this.warm[i], 0, 1);

        const dLeft = this.dye[row + (x > 0 ? x - 1 : 0)];
        const dRight = this.dye[row + (x < wGrid - 1 ? x + 1 : wGrid - 1)];
        const dUp = this.dye[yUp * wGrid + x];
        const dDown = this.dye[yDown * wGrid + x];
        const ridge = clamp((dRight - dLeft + dUp - dDown) * 0.4, -0.2, 0.24);

        const densityMix = clamp(d * 1.1 + ridge * 0.22, 0, 1);
        let r = r0 + (r1 - r0) * densityMix + ridge * (isDark ? 18 : -8);
        let g = g0 + (g1 - g0) * densityMix + ridge * (isDark ? 18 : -8);
        let b = b0 + (b1 - b0) * densityMix + ridge * (isDark ? 14 : -6);

        const warmWeight = clamp(w * 0.65, 0, maxWarmWeight);
        if (warmWeight > 0.001) {
          r += (rWarm - r) * warmWeight;
          g += (gWarm - g) * warmWeight;
          b += (bWarm - b) * warmWeight;
        }

        const alphaNorm = clamp(d * 0.85 + w * 0.35, 0, 1);
        data[offset] = clamp((r + 0.5) | 0, 0, 255);
        data[offset + 1] = clamp((g + 0.5) | 0, 0, 255);
        data[offset + 2] = clamp((b + 0.5) | 0, 0, 255);
        data[offset + 3] = clamp((alphaNorm * maxAlpha + 0.5) | 0, 0, maxAlpha);
      }
    }
  }

  private seedInitialField(): void {
    const w = this.width;
    const h = this.height;
    this.depositSplat(w * 0.74, h * 0.24, -0.9, 0.5, 0.38, 0.09, 1 / 22);
    this.depositSplat(w * 0.24, h * 0.72, 0.8, -0.45, 0.36, 0.07, 1 / 24);
    this.depositSplat(w * 0.52, h * 0.46, 0.55, 0.38, 0.3, 0.05, 1 / 28);
    this.depositSplat(w * 0.36, h * 0.28, -0.6, -0.32, 0.28, 0.06, 1 / 22);
    for (let i = 0; i < 4; i += 1) {
      this.step(0.016, i * 0.08);
    }
  }

  private depositSplat(
    px: number,
    py: number,
    fx: number,
    fy: number,
    baseDye: number,
    warmDye: number,
    invRadiusSq: number,
  ): void {
    const w = this.width;
    const h = this.height;
    const span = Math.ceil(Math.sqrt(3 / invRadiusSq));
    const minX = Math.max(1, Math.floor(px - span));
    const maxX = Math.min(w - 2, Math.ceil(px + span));
    const minY = Math.max(1, Math.floor(py - span));
    const maxY = Math.min(h - 2, Math.ceil(py + span));

    for (let y = minY; y <= maxY; y += 1) {
      const dyCell = y - py;
      const row = y * w;
      for (let x = minX; x <= maxX; x += 1) {
        const dxCell = x - px;
        const distSq = dxCell * dxCell + dyCell * dyCell;
        const falloff = Math.exp(-distSq * invRadiusSq);
        if (falloff < 0.01) continue;

        const idx = row + x;
        if (this.obstacle[idx] === 1) continue;
        const swirlX = -dyCell * 0.06 * fx;
        const swirlY = dxCell * 0.06 * fy;
        this.u[idx] = clamp(this.u[idx] + (fx + swirlX) * falloff, -MAX_VELOCITY, MAX_VELOCITY);
        this.v[idx] = clamp(this.v[idx] + (fy + swirlY) * falloff, -MAX_VELOCITY, MAX_VELOCITY);
        this.dye[idx] = clamp(this.dye[idx] + baseDye * falloff, 0, MAX_DYE);
        if (warmDye > 0) {
          this.warm[idx] = clamp(this.warm[idx] + warmDye * falloff, 0, MAX_DYE);
        }
      }
    }
  }

  private injectAmbient(dt: number, ambientTime: number): void {
    const w = this.width;
    const h = this.height;

    const ax1 = w * (0.5 + 0.28 * Math.cos(ambientTime * 0.22));
    const ay1 = h * (0.36 + 0.2 * Math.sin(ambientTime * 0.28));
    const vx1 = Math.sin(ambientTime * 0.34) * 1.9 * dt;
    const vy1 = Math.cos(ambientTime * 0.26) * 1.6 * dt;
    this.depositSplat(ax1, ay1, vx1, vy1, 0.55 * dt, 0.08 * dt, 1 / 16);

    const ax2 = w * (0.48 + 0.26 * Math.sin(ambientTime * 0.19 + 1.4));
    const ay2 = h * (0.64 + 0.18 * Math.cos(ambientTime * 0.24 + 0.8));
    const vx2 = -Math.cos(ambientTime * 0.31) * 1.7 * dt;
    const vy2 = Math.sin(ambientTime * 0.27) * 1.45 * dt;
    this.depositSplat(ax2, ay2, vx2, vy2, 0.5 * dt, 0.04 * dt, 1 / 19);
  }

  private applyVorticity(dt: number): void {
    const w = this.width;
    const h = this.height;
    const u = this.u;
    const v = this.v;
    const curl = this.curl;
    const obs = this.obstacle;

    for (let y = 1; y < h - 1; y += 1) {
      const row = y * w;
      for (let x = 1; x < w - 1; x += 1) {
        const idx = row + x;
        if (obs[idx] === 1) {
          curl[idx] = 0;
          continue;
        }
        curl[idx] = 0.5 * (v[idx + 1] - v[idx - 1] - (u[idx + w] - u[idx - w]));
      }
    }

    const strength = VORTICITY_STRENGTH * dt;
    for (let y = 2; y < h - 2; y += 1) {
      const row = y * w;
      for (let x = 2; x < w - 2; x += 1) {
        const idx = row + x;
        if (obs[idx] === 1) continue;
        const dx = Math.abs(curl[idx + 1]) - Math.abs(curl[idx - 1]);
        const dy = Math.abs(curl[idx + w]) - Math.abs(curl[idx - w]);
        const len = Math.hypot(dx, dy) + 1e-5;
        const c = curl[idx];
        u[idx] = clamp(u[idx] + (dy / len) * c * strength, -MAX_VELOCITY, MAX_VELOCITY);
        v[idx] = clamp(v[idx] - (dx / len) * c * strength, -MAX_VELOCITY, MAX_VELOCITY);
      }
    }
  }

  private project(): void {
    const w = this.width;
    const h = this.height;
    const u = this.u;
    const v = this.v;
    const div = this.div;
    const p = this.p;
    const obs = this.obstacle;

    for (let y = 1; y < h - 1; y += 1) {
      const row = y * w;
      for (let x = 1; x < w - 1; x += 1) {
        const idx = row + x;
        if (obs[idx] === 1) {
          div[idx] = 0;
          continue;
        }
        const ux = u[idx];
        const vy = v[idx];
        const uL = obs[idx - 1] === 1 ? -ux : u[idx - 1];
        const uR = obs[idx + 1] === 1 ? -ux : u[idx + 1];
        const vT = obs[idx - w] === 1 ? -vy : v[idx - w];
        const vB = obs[idx + w] === 1 ? -vy : v[idx + w];
        div[idx] = -0.5 * (uR - uL + vB - vT);
      }
    }

    this.setBoundary(0, div);
    p.fill(0);

    for (let iter = 0; iter < PRESSURE_ITERATIONS; iter += 1) {
      for (let y = 1; y < h - 1; y += 1) {
        const row = y * w;
        for (let x = 1; x < w - 1; x += 1) {
          const idx = row + x;
          if (obs[idx] === 1) {
            p[idx] = 0;
            continue;
          }
          const pC = p[idx];
          const pL = obs[idx - 1] === 1 ? pC : p[idx - 1];
          const pR = obs[idx + 1] === 1 ? pC : p[idx + 1];
          const pT = obs[idx - w] === 1 ? pC : p[idx - w];
          const pB = obs[idx + w] === 1 ? pC : p[idx + w];
          p[idx] = (div[idx] + pL + pR + pT + pB) * 0.25;
        }
      }
      this.setBoundary(0, p);
    }

    for (let y = 1; y < h - 1; y += 1) {
      const row = y * w;
      for (let x = 1; x < w - 1; x += 1) {
        const idx = row + x;
        if (obs[idx] === 1) {
          u[idx] = 0;
          v[idx] = 0;
          continue;
        }
        const pC = p[idx];
        const pL = obs[idx - 1] === 1 ? pC : p[idx - 1];
        const pR = obs[idx + 1] === 1 ? pC : p[idx + 1];
        const pT = obs[idx - w] === 1 ? pC : p[idx - w];
        const pB = obs[idx + w] === 1 ? pC : p[idx + w];
        let nextU = u[idx] - 0.5 * (pR - pL);
        let nextV = v[idx] - 0.5 * (pB - pT);
        if (obs[idx - 1] === 1 && nextU < 0) nextU = 0;
        if (obs[idx + 1] === 1 && nextU > 0) nextU = 0;
        if (obs[idx - w] === 1 && nextV < 0) nextV = 0;
        if (obs[idx + w] === 1 && nextV > 0) nextV = 0;
        u[idx] = nextU;
        v[idx] = nextV;
      }
    }

    this.setBoundary(1, u);
    this.setBoundary(2, v);
  }

  private advect(
    boundaryType: number,
    dest: Float32Array,
    src: Float32Array,
    velU: Float32Array,
    velV: Float32Array,
    dt: number,
    decay: number,
  ): void {
    const w = this.width;
    const h = this.height;
    const maxX = w - 1.5;
    const maxY = h - 1.5;
    const obs = this.obstacle;

    for (let y = 1; y < h - 1; y += 1) {
      const row = y * w;
      for (let x = 1; x < w - 1; x += 1) {
        const idx = row + x;
        if (obs[idx] === 1) {
          dest[idx] = 0;
          continue;
        }
        let sx = x - dt * velU[idx];
        let sy = y - dt * velV[idx];

        if (sx < 0.5) sx = 0.5;
        else if (sx > maxX) sx = maxX;

        if (sy < 0.5) sy = 0.5;
        else if (sy > maxY) sy = maxY;

        const x0 = sx | 0;
        const y0 = sy | 0;
        if (obs[Math.round(sy) * w + Math.round(sx)] === 1 || obs[y0 * w + x0] === 1) {
          dest[idx] = src[idx] * decay;
          continue;
        }

        const tx = sx - x0;
        const ty = sy - y0;
        const i00 = y0 * w + x0;
        const i10 = i00 + w;

        const top = src[i00] + tx * (src[i00 + 1] - src[i00]);
        const bottom = src[i10] + tx * (src[i10 + 1] - src[i10]);
        dest[idx] = (top + ty * (bottom - top)) * decay;
      }
    }

    this.setBoundary(boundaryType, dest);
  }

  private setBoundary(boundaryType: number, field: Float32Array): void {
    const w = this.width;
    const h = this.height;
    const lastX = w - 1;
    const lastY = h - 1;

    for (let x = 1; x < lastX; x += 1) {
      field[x] = boundaryType === 2 ? -field[w + x] : field[w + x];
      field[lastY * w + x] = boundaryType === 2 ? -field[(lastY - 1) * w + x] : field[(lastY - 1) * w + x];
    }

    for (let y = 1; y < lastY; y += 1) {
      const row = y * w;
      field[row] = boundaryType === 1 ? -field[row + 1] : field[row + 1];
      field[row + lastX] = boundaryType === 1 ? -field[row + lastX - 1] : field[row + lastX - 1];
    }

    field[0] = 0.5 * (field[1] + field[w]);
    field[lastX] = 0.5 * (field[lastX - 1] + field[w + lastX]);
    field[lastY * w] = 0.5 * (field[lastY * w + 1] + field[(lastY - 1) * w]);
    field[lastY * w + lastX] = 0.5 * (field[lastY * w + lastX - 1] + field[(lastY - 1) * w + lastX]);
  }
}
