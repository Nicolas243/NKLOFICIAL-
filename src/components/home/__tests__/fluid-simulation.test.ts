import assert from 'node:assert/strict';
import test from 'node:test';
import {
  buildGhostObstacleRect,
  rasterizeObstaclesMask,
  type FluidObstacleRect,
} from '@/components/home/fluid-obstacles';
import {
  FLUID_GRID_HEIGHT,
  FLUID_GRID_WIDTH,
  FluidSimulation,
} from '@/components/home/fluid-simulation';

function createMockImageData(width: number, height: number): ImageData {
  return {
    width,
    height,
    colorSpace: 'srgb',
    data: new Uint8ClampedArray(width * height * 4),
  } as ImageData;
}

function swirlPointer(sim: FluidSimulation, turns = 30): void {
  const cx = 0.25;
  const cy = 0.25;
  const radius = 0.08;
  let prevX = cx + radius;
  let prevY = cy;

  sim.resetPointer();
  for (let i = 1; i <= turns; i += 1) {
    const angle = (i / 10) * Math.PI * 2;
    const nx = cx + Math.cos(angle) * radius;
    const ny = cy + Math.sin(angle) * radius;
    sim.splat(nx, ny, nx - prevX, ny - prevY, 1.45);
    sim.step(0.016, i * 0.016);
    prevX = nx;
    prevY = ny;
  }
}

function measureVisiblePixels(data: Uint8ClampedArray): {
  count: number;
  meanLuminance: number;
  meanSpread: number;
  maxAlpha: number;
  sumAlpha: number;
} {
  let count = 0;
  let rgbSum = 0;
  let spreadSum = 0;
  let maxAlpha = 0;
  let sumAlpha = 0;

  for (let i = 0; i < data.length; i += 4) {
    const a = data[i + 3];
    sumAlpha += a;
    if (a > maxAlpha) maxAlpha = a;
    if (a > 20) {
      count += 1;
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      rgbSum += (r + g + b) / 3;
      spreadSum += Math.max(r, g, b) - Math.min(r, g, b);
    }
  }

  return {
    count,
    meanLuminance: count > 0 ? rgbSum / count : 0,
    meanSpread: count > 0 ? spreadSum / count : 0,
    maxAlpha,
    sumAlpha,
  };
}

test('keeps dark fluid pigments in light mode even after repeated circular splats', () => {
  const sim = new FluidSimulation();
  const imageData = createMockImageData(FLUID_GRID_WIDTH, FLUID_GRID_HEIGHT);

  swirlPointer(sim, 30);
  sim.render(imageData, false);

  const metrics = measureVisiblePixels(imageData.data);
  assert.ok(metrics.count > 0, 'Expected visible fluid pixels after swirling splats');
  assert.ok(
    metrics.meanLuminance < 95,
    `Expected dark luminance (< 95) in light mode, got ${metrics.meanLuminance.toFixed(2)}`,
  );
});

test('keeps light fluid pigments and strict alpha cap in dark mode without washing out the background', () => {
  const sim = new FluidSimulation();
  const imageData = createMockImageData(FLUID_GRID_WIDTH, FLUID_GRID_HEIGHT);

  swirlPointer(sim, 30);
  sim.render(imageData, true);

  const metrics = measureVisiblePixels(imageData.data);
  assert.ok(metrics.count > 0, 'Expected visible fluid pixels after swirling splats');
  assert.ok(
    metrics.meanLuminance > 140,
    `Expected light pigment luminance (> 140) in dark mode, got ${metrics.meanLuminance.toFixed(2)}`,
  );
  assert.ok(
    metrics.maxAlpha <= 110,
    `Expected capped alpha (<= 110) in dark mode, got ${metrics.maxAlpha}`,
  );
});

test('decays dye density cleanly when simulation steps without new pointer input', () => {
  const sim = new FluidSimulation();
  const imageData = createMockImageData(FLUID_GRID_WIDTH, FLUID_GRID_HEIGHT);

  swirlPointer(sim, 30);
  sim.render(imageData, true);
  const before = measureVisiblePixels(imageData.data);

  for (let frame = 0; frame < 60; frame += 1) {
    sim.step(0.016, 1 + frame * 0.016);
  }
  sim.render(imageData, true);
  const after = measureVisiblePixels(imageData.data);

  assert.ok(
    after.sumAlpha < before.sumAlpha * 0.7,
    `Expected significant density decay after 60 idle steps (before=${before.sumAlpha}, after=${after.sumAlpha})`,
  );
});

test('rasterizeObstaclesMask handles interior, exterior, rounded corners, and flipY', () => {
  const width = 40;
  const height = 20;
  const rect: FluidObstacleRect = {
    left: 0.25,
    top: 0.25,
    right: 0.75,
    bottom: 0.75,
    radiusX: 0.12,
    radiusY: 0.2,
  };

  const domMask = new Uint8Array(width * height);
  rasterizeObstaclesMask([rect], width, height, domMask, 1, false);

  // Center of rectangle is solid
  assert.equal(domMask[10 * width + 20], 1);
  // Outside rectangle is fluid
  assert.equal(domMask[2 * width + 2], 0);
  // Rounded outer corner cell (x=10 -> cx=0.2625, y=5 -> cy=0.275) is cut out cleanly
  assert.equal(domMask[5 * width + 10], 0);

  // Asymmetric rect to verify flipY maps top DOM band to bottom buffer row for WebGL
  const topBand: FluidObstacleRect = {
    left: 0.4,
    top: 0.1,
    right: 0.6,
    bottom: 0.25,
    radiusX: 0,
    radiusY: 0,
  };
  const rgbaWebgl = new Uint8Array(width * height * 4);
  rasterizeObstaclesMask([topBand], width, height, rgbaWebgl, 4, true);

  // Row index 3 (gy=3 -> cy=0.175 inside topBand) flips to destY = height - 1 - 3 = 16
  const flippedRowOffset = (16 * width + 20) * 4;
  const unflippedRowOffset = (3 * width + 20) * 4;
  assert.equal(rgbaWebgl[flippedRowOffset], 255);
  assert.equal(rgbaWebgl[flippedRowOffset + 3], 255);
  assert.equal(rgbaWebgl[unflippedRowOffset], 0);
});

test('preserves rich chroma (+30% vibrant palette) instead of gray smoke in both light and dark modes', () => {
  const sim = new FluidSimulation();
  const imageData = createMockImageData(FLUID_GRID_WIDTH, FLUID_GRID_HEIGHT);

  swirlPointer(sim, 30);

  sim.render(imageData, false);
  const lightMetrics = measureVisiblePixels(imageData.data);
  assert.ok(
    lightMetrics.meanSpread >= 60,
    `Expected rich colorful chroma (>= 60 RGB spread) in light mode, got ${lightMetrics.meanSpread.toFixed(2)}`,
  );

  sim.render(imageData, true);
  const darkMetrics = measureVisiblePixels(imageData.data);
  assert.ok(
    darkMetrics.meanSpread >= 60,
    `Expected rich colorful chroma (>= 60 RGB spread) in dark mode, got ${darkMetrics.meanSpread.toFixed(2)}`,
  );
});

test('buildGhostObstacleRect keeps rasterized colliders strictly inside circles, pills, and rounded cards', () => {
  const vw = 1000;
  const vh = 800;
  const cases = [
    { name: 'circle', left: 200, top: 200, right: 300, bottom: 300, borderRadiusPx: 9999 },
    { name: 'pill', left: 400, top: 100, right: 560, bottom: 136, borderRadiusPx: 9999 },
    { name: 'card', left: 100, top: 420, right: 420, bottom: 660, borderRadiusPx: 24 },
  ];

  const maskW = 200;
  const maskH = 160;
  const mask = new Uint8Array(maskW * maskH);

  for (const box of cases) {
    const ghost = buildGhostObstacleRect({
      ...box,
      viewportWidth: vw,
      viewportHeight: vh,
    });
    assert.ok(ghost, `Expected ghost collider for ${box.name}`);

    const w = box.right - box.left;
    const h = box.bottom - box.top;
    const outerRadius = Math.min(box.borderRadiusPx, Math.min(w, h) * 0.5);
    assert.ok(ghost.left * vw > box.left, `Expected inset left for ${box.name}`);
    assert.ok(ghost.right * vw < box.right, `Expected inset right for ${box.name}`);
    assert.ok(ghost.top * vh > box.top, `Expected inset top for ${box.name}`);
    assert.ok(ghost.bottom * vh < box.bottom, `Expected inset bottom for ${box.name}`);

    rasterizeObstaclesMask([ghost], maskW, maskH, mask, 1, false);
    let solidCount = 0;
    const innerL = box.left + outerRadius;
    const innerR = box.right - outerRadius;
    const innerT = box.top + outerRadius;
    const innerB = box.bottom - outerRadius;

    for (let gy = 0; gy < maskH; gy += 1) {
      const py = ((gy + 0.5) / maskH) * vh;
      for (let gx = 0; gx < maskW; gx += 1) {
        if (mask[gy * maskW + gx] !== 1) continue;
        solidCount += 1;
        const px = ((gx + 0.5) / maskW) * vw;
        assert.ok(
          px >= box.left && px <= box.right && py >= box.top && py <= box.bottom,
          `Ghost cell (${px}, ${py}) leaked outside bounding rect of ${box.name}`,
        );
        const dx = px < innerL ? innerL - px : px > innerR ? px - innerR : 0;
        const dy = py < innerT ? innerT - py : py > innerB ? py - innerB : 0;
        if (outerRadius > 0 && dx > 0 && dy > 0) {
          const distSq = (dx / outerRadius) ** 2 + (dy / outerRadius) ** 2;
          assert.ok(
            distSq <= 1,
            `Ghost corner cell (${px}, ${py}) leaked outside rounded edge of ${box.name} (distSq=${distSq.toFixed(3)})`,
          );
        }
      }
    }
    assert.ok(solidCount > 0, `Expected non-empty rasterized mask for ${box.name}`);
  }
});

test('solid obstacle blocks fluid penetration and deflects a horizontal jet around its edges', () => {
  const sim = new FluidSimulation();
  const imageData = createMockImageData(FLUID_GRID_WIDTH, FLUID_GRID_HEIGHT);
  const obstacle: FluidObstacleRect = {
    left: 0.42,
    top: 0.3,
    right: 0.58,
    bottom: 0.7,
    radiusX: 0.02,
    radiusY: 0.03,
  };

  sim.setObstacles([obstacle]);

  // Inject a strong horizontal rightward jet aimed directly at the obstacle front face
  for (let frame = 0; frame < 20; frame += 1) {
    sim.resetPointer();
    sim.splat(0.28, 0.5, 0.06, 0, 1.8);
    sim.splat(0.36, 0.5, 0.06, 0, 1.8);
    sim.step(0.016, frame * 0.016);
  }
  sim.render(imageData, false);

  const data = imageData.data;
  const minInnerX = Math.ceil(0.45 * FLUID_GRID_WIDTH);
  const maxInnerX = Math.floor(0.55 * FLUID_GRID_WIDTH);
  const minInnerY = Math.ceil(0.35 * FLUID_GRID_HEIGHT);
  const maxInnerY = Math.floor(0.65 * FLUID_GRID_HEIGHT);

  let interiorMaxAlpha = 0;
  for (let y = minInnerY; y <= maxInnerY; y += 1) {
    for (let x = minInnerX; x <= maxInnerX; x += 1) {
      const alpha = data[(y * FLUID_GRID_WIDTH + x) * 4 + 3];
      if (alpha > interiorMaxAlpha) interiorMaxAlpha = alpha;
    }
  }
  assert.equal(interiorMaxAlpha, 0, 'Expected zero fluid alpha inside solid obstacle');

  // Verify fluid builds/deflects around upper and lower shoulders in front of the obstacle
  const frontXStart = Math.floor(0.38 * FLUID_GRID_WIDTH);
  const frontXEnd = Math.floor(0.42 * FLUID_GRID_WIDTH);
  const topShoulderYStart = Math.floor(0.18 * FLUID_GRID_HEIGHT);
  const topShoulderYEnd = Math.floor(0.3 * FLUID_GRID_HEIGHT);
  const bottomShoulderYStart = Math.floor(0.7 * FLUID_GRID_HEIGHT);
  const bottomShoulderYEnd = Math.floor(0.82 * FLUID_GRID_HEIGHT);

  let deflectedAlphaSum = 0;
  for (let x = frontXStart; x <= frontXEnd; x += 1) {
    for (let y = topShoulderYStart; y <= topShoulderYEnd; y += 1) {
      deflectedAlphaSum += data[(y * FLUID_GRID_WIDTH + x) * 4 + 3];
    }
    for (let y = bottomShoulderYStart; y <= bottomShoulderYEnd; y += 1) {
      deflectedAlphaSum += data[(y * FLUID_GRID_WIDTH + x) * 4 + 3];
    }
  }
  assert.ok(
    deflectedAlphaSum > 0,
    'Expected visible fluid deflection around upper/lower edges of the obstacle',
  );
});
