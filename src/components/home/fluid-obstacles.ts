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

    const rx = Math.max(0, Math.min(rect.radiusX, (right - left) * 0.45));
    const ry = Math.max(0, Math.min(rect.radiusY, (bottom - top) * 0.45));
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
