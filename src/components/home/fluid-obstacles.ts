export type FluidObstacleRect = {
  /** Normalized DOM left coordinate in [0, 1]. */
  left: number;
  /** Normalized DOM top coordinate in [0, 1]. */
  top: number;
  /** Normalized DOM right coordinate in [0, 1]. */
  right: number;
  /** Normalized DOM bottom coordinate in [0, 1]. */
  bottom: number;
  /** Normalized horizontal corner radius in [0, 0.5]. */
  radiusX: number;
  /** Normalized vertical corner radius in [0, 0.5]. */
  radiusY: number;
};

export type FluidObstacleInput = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  borderRadiusPx: number;
  viewportWidth: number;
  viewportHeight: number;
};

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

/**
 * Builds a strictly inset "ghost" collider inside a visible painted DOM rect so
 * coarse fluid simulation cells deflect smoothly around rounded/circular edges
 * without protruding corners or square outlines.
 */
export function buildGhostObstacleRect(input: FluidObstacleInput): FluidObstacleRect | null {
  const { left, top, right, bottom, borderRadiusPx, viewportWidth, viewportHeight } = input;
  const vw = Math.max(viewportWidth, 1);
  const vh = Math.max(viewportHeight, 1);
  const w = right - left;
  const h = bottom - top;
  const minDim = Math.min(w, h);

  if (w < 20 || h < 20 || right <= 0 || left >= vw || bottom <= 0 || top >= vh) {
    return null;
  }

  const clampedRadius = Math.max(0, Math.min(borderRadiusPx, minDim * 0.5));
  const isPillOrCircle = clampedRadius >= minDim * 0.42;
  const rawInset = isPillOrCircle
    ? Math.max(5, Math.min(12, minDim * 0.16))
    : Math.max(8, Math.min(16, Math.max(8, clampedRadius * 0.35)));

  const insetX = Math.min(rawInset, w * 0.24);
  const insetY = Math.min(rawInset, h * 0.24);

  const gLeft = left + insetX;
  const gRight = right - insetX;
  const gTop = top + insetY;
  const gBottom = bottom - insetY;
  const gw = gRight - gLeft;
  const gh = gBottom - gTop;

  if (gw < 10 || gh < 10) {
    return null;
  }

  const innerMinDim = Math.min(gw, gh);
  const ghostRadiusPx = isPillOrCircle
    ? innerMinDim * 0.5
    : Math.min(Math.max(clampedRadius, 6), innerMinDim * 0.5);

  return {
    left: clamp01(gLeft / vw),
    top: clamp01(gTop / vh),
    right: clamp01(gRight / vw),
    bottom: clamp01(gBottom / vh),
    radiusX: ghostRadiusPx / vw,
    radiusY: ghostRadiusPx / vh,
  };
}

/**
 * Rasterizes normalized DOM rectangles (with optional rounded corners) into a
 * 1-channel or RGBA obstacle mask buffer for Canvas2D or WebGL simulation grids.
 */
export function rasterizeObstaclesMask(
  rects: readonly FluidObstacleRect[],
  width: number,
  height: number,
  target: Uint8Array,
  channels: 1 | 4,
  flipY: boolean,
): void {
  target.fill(0);
  if (width <= 0 || height <= 0 || rects.length === 0) return;

  for (const rect of rects) {
    const left = Math.max(0, Math.min(1, rect.left));
    const right = Math.max(0, Math.min(1, rect.right));
    const top = Math.max(0, Math.min(1, rect.top));
    const bottom = Math.max(0, Math.min(1, rect.bottom));
    if (right <= left || bottom <= top) continue;

    const minX = Math.max(0, Math.floor(left * width));
    const maxX = Math.min(width - 1, Math.ceil(right * width) - 1);
    const minY = Math.max(0, Math.floor(top * height));
    const maxY = Math.min(height - 1, Math.ceil(bottom * height) - 1);
    if (minX > maxX || minY > maxY) continue;

    const rx = Math.max(0, Math.min(rect.radiusX, (right - left) * 0.5));
    const ry = Math.max(0, Math.min(rect.radiusY, (bottom - top) * 0.5));
    const hasRadius = rx > 1e-6 && ry > 1e-6;
    const innerL = left + rx;
    const innerR = right - rx;
    const innerT = top + ry;
    const innerB = bottom - ry;

    for (let gy = minY; gy <= maxY; gy += 1) {
      const cy = (gy + 0.5) / height;
      if (cy < top || cy > bottom) continue;

      const dyCorner =
        hasRadius ? (cy < innerT ? innerT - cy : cy > innerB ? cy - innerB : 0) : 0;
      const destY = flipY ? height - 1 - gy : gy;
      const rowStart = destY * width;

      for (let gx = minX; gx <= maxX; gx += 1) {
        const cx = (gx + 0.5) / width;
        if (cx < left || cx > right) continue;

        if (dyCorner > 0) {
          const dxCorner = cx < innerL ? innerL - cx : cx > innerR ? cx - innerR : 0;
          if (dxCorner > 0) {
            const nx = dxCorner / rx;
            const ny = dyCorner / ry;
            if (nx * nx + ny * ny > 1) continue;
          }
        }

        const idx = rowStart + gx;
        if (channels === 4) {
          const offset = idx * 4;
          target[offset] = 255;
          target[offset + 3] = 255;
        } else {
          target[idx] = 1;
        }
      }
    }
  }
}
