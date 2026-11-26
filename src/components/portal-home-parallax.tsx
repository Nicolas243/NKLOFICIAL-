'use client';

import { useEffect, useRef } from 'react';
import {
  FLUID_GRID_HEIGHT,
  FLUID_GRID_WIDTH,
  FluidSimulation,
} from '@/components/home/fluid-simulation';
import {
  PORTAL_FLUID_STORAGE_KEY,
  PORTAL_FLUID_TOGGLE_EVENT,
} from '@/components/home/portal-fluid-toggle';
import {
  buildGhostObstacleRect,
  type FluidObstacleRect,
} from '@/components/home/fluid-obstacles';
import {
  createWebGLFluidEngine,
  type WebGLFluidEngine,
} from '@/components/home/webgl-fluid-engine';

type ParallaxMotionState = {
  targetX: number;
  targetY: number;
  targetScroll: number;
  currentX: number;
  currentY: number;
  currentScroll: number;
  scrollVel: number;
  frameId: number | undefined;
  lastTimestamp: number;
  ambientTime: number;
  hasPointer: boolean;
  lastNx: number;
  lastNy: number;
  splatCount: number;
  scrollBodyCount: number;
  paused: boolean;
};

const LERP_FACTOR = 0.055;
const MAX_POINTER_OFFSET_X = 28;
const MAX_POINTER_OFFSET_Y = 20;
const MAX_SCROLL_INPUT = 1600;
const IMMEDIATE_SEED_FACTOR = 0.12;
const MAX_SUBMERGED_BODIES_PER_TICK = 6;
const SCROLL_IMPULSE_COOLDOWN_MS = 55;
const OBSTACLE_SELECTOR =
  '.portal-topbar, .portal-hero-main, .portal-quickstart, .portal-bento-tile, .portal-track-selector, .portal-track-priority-banner, .portal-filter-pill, .portal-card, .portal-empty';

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function parseColorAlpha(colorValue: string | null | undefined): number {
  if (!colorValue) return 0;
  const trimmed = colorValue.trim().toLowerCase();
  if (!trimmed || trimmed === 'transparent' || trimmed === 'none') return 0;
  const slashMatch = trimmed.match(/\/\s*([\d.]+)(%?)\s*\)$/);
  if (slashMatch) {
    const raw = Number.parseFloat(slashMatch[1]);
    if (!Number.isFinite(raw)) return 0;
    return slashMatch[2] === '%' ? raw / 100 : raw;
  }
  const rgbaMatch = trimmed.match(/^rgba\([^,]+,[^,]+,[^,]+,\s*([\d.]+)\s*\)$/);
  if (rgbaMatch) {
    const raw = Number.parseFloat(rgbaMatch[1]);
    return Number.isFinite(raw) ? raw : 0;
  }
  return 1;
}

function hasPaintedSurface(style: CSSStyleDeclaration): boolean {
  if (
    style.display === 'none' ||
    style.visibility === 'hidden' ||
    Number.parseFloat(style.opacity || '1') <= 0.05
  ) {
    return false;
  }
  if (parseColorAlpha(style.backgroundColor) > 0.06) {
    return true;
  }
  if (style.backgroundImage && style.backgroundImage !== 'none') {
    return true;
  }
  const borderTop = Number.parseFloat(style.borderTopWidth || '0');
  const borderLeft = Number.parseFloat(style.borderLeftWidth || '0');
  if (
    (borderTop > 0.4 || borderLeft > 0.4) &&
    parseColorAlpha(style.borderTopColor || style.borderColor) > 0.08
  ) {
    return true;
  }
  const backdrop =
    style.backdropFilter ||
    (style as unknown as { webkitBackdropFilter?: string }).webkitBackdropFilter;
  if (backdrop && backdrop !== 'none') {
    return true;
  }
  return false;
}

function readComputedBorderRadiusPx(
  style: CSSStyleDeclaration,
  width: number,
  height: number,
): number {
  const minDim = Math.min(width, height);
  const corners = [
    style.borderTopLeftRadius,
    style.borderTopRightRadius,
    style.borderBottomRightRadius,
    style.borderBottomLeftRadius,
  ];
  let maxRadius = 0;
  for (const raw of corners) {
    if (!raw) continue;
    const token = raw.trim().split(/\s+/)[0] || '';
    const parsed = Number.parseFloat(token);
    if (!Number.isFinite(parsed) || parsed <= 0) continue;
    const px = token.endsWith('%') ? (parsed / 100) * minDim : parsed;
    if (px > maxRadius) maxRadius = px;
  }
  return Math.min(maxRadius, minDim * 0.5);
}

function readStoredFluidPaused(): boolean {
  try {
    return window.localStorage.getItem(PORTAL_FLUID_STORAGE_KEY) === 'true';
  } catch {
    return false;
  }
}

/**
 * Fundo fluido Navier-Stokes interativo (WebGL2/WebGL1 GPU com fallback Canvas2D)
 * onde cards, tiles e containers operam como corpos submersos que deslocam o liquido no scroll.
 */
export function PortalHomeParallax() {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const motionRef = useRef<ParallaxMotionState>({
    targetX: 0,
    targetY: 0,
    targetScroll: 0,
    currentX: 0,
    currentY: 0,
    currentScroll: 0,
    scrollVel: 0,
    frameId: undefined,
    lastTimestamp: 0,
    ambientTime: 0,
    hasPointer: false,
    lastNx: 0.5,
    lastNy: 0.5,
    splatCount: 0,
    scrollBodyCount: 0,
    paused: false,
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let disposedEffect = false;
    let teardown: (() => void) | undefined;

    const initFluid = (): void => {
      if (disposedEffect) return;

      let isDark = document.documentElement.classList.contains('dark');
      let activeCleanup: (() => void) | undefined;

      const webglEngine: WebGLFluidEngine | null = createWebGLFluidEngine(canvas, isDark);
      const canvas2dSim = webglEngine ? null : new FluidSimulation();
      const ctx2d = webglEngine ? null : canvas.getContext('2d', { alpha: true });
      const imageData2d = ctx2d
        ? ctx2d.createImageData(FLUID_GRID_WIDTH, FLUID_GRID_HEIGHT)
        : null;

      if (webglEngine) {
        canvas.dataset.fluidBackend = webglEngine.backend;
      } else {
        canvas.width = FLUID_GRID_WIDTH;
        canvas.height = FLUID_GRID_HEIGHT;
        canvas.dataset.fluidBackend = 'canvas2d';
      }
      canvas.dataset.fluidSplats = '0';
      canvas.dataset.fluidScrollBodies = '0';
      canvas.dataset.fluidObstacles = '0';

      let cachedBodies: HTMLElement[] = [];
      let obstaclesDirty = true;

      const collectObstacles = (): HTMLElement[] => {
        const shell = rootRef.current?.parentElement;
        if (!shell) return [];
        return Array.from(shell.querySelectorAll<HTMLElement>(OBSTACLE_SELECTOR));
      };

      const syncObstacles = (): void => {
        const vw = Math.max(window.innerWidth, 1);
        const vh = Math.max(window.innerHeight, 1);
        const rects: FluidObstacleRect[] = [];

        for (const body of cachedBodies) {
          const rect = body.getBoundingClientRect();
          if (
            rect.width < 20 ||
            rect.height < 20 ||
            rect.bottom <= 0 ||
            rect.top >= vh ||
            rect.right <= 0 ||
            rect.left >= vw
          ) {
            continue;
          }
          const style = window.getComputedStyle(body);
          if (!hasPaintedSurface(style)) continue;

          const ghost = buildGhostObstacleRect({
            left: rect.left,
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            borderRadiusPx: readComputedBorderRadiusPx(style, rect.width, rect.height),
            viewportWidth: vw,
            viewportHeight: vh,
          });
          if (ghost) {
            rects.push(ghost);
          }
        }

        webglEngine?.setObstacles(rects);
        canvas2dSim?.setObstacles(rects);
        canvas.dataset.fluidObstacles = String(rects.length);
        obstaclesDirty = false;
      };

      const syncPausedFlags = (paused: boolean): void => {
        motionRef.current.paused = paused;
        const root = rootRef.current;
        if (root) {
          root.dataset.fluidPaused = paused ? 'true' : 'false';
          if (root.parentElement) {
            root.parentElement.dataset.fluidPaused = paused ? 'true' : 'false';
          }
        }
      };

      const syncCanvasSize = (): void => {
        if (!webglEngine) return;
        const rect = canvas.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : window.innerWidth;
        const height = rect.height > 0 ? rect.height : window.innerHeight;
        webglEngine.resize(width, height, window.devicePixelRatio || 1);
      };

      const renderStaticOrLiveFrame = (): void => {
        if (webglEngine) {
          webglEngine.render();
          return;
        }
        if (canvas2dSim && ctx2d && imageData2d) {
          canvas2dSim.render(imageData2d, isDark);
          ctx2d.putImageData(imageData2d, 0, 0);
        }
      };

      syncCanvasSize();
      cachedBodies = collectObstacles();
      syncObstacles();
      if (webglEngine) {
        webglEngine.seedAmbientWakes();
      }
      renderStaticOrLiveFrame();

      const applyCssVars = (
        x: number,
        y: number,
        scroll: number,
        scrollVel: number,
      ): void => {
        const root = rootRef.current;
        if (!root) return;
        root.style.setProperty('--parallax-x', `${x.toFixed(2)}px`);
        root.style.setProperty('--parallax-y', `${y.toFixed(2)}px`);
        root.style.setProperty('--parallax-scroll', `${scroll.toFixed(2)}px`);
        const shell = root.parentElement;
        if (shell) {
          shell.style.setProperty('--liquid-scroll-vel', `${scrollVel.toFixed(2)}px`);
        }
      };

      const resetFluidPointer = (): void => {
        webglEngine?.resetPointer();
        canvas2dSim?.resetPointer();
      };

      const clearMotion = (): void => {
        const state = motionRef.current;
        if (state.frameId !== undefined) {
          window.cancelAnimationFrame(state.frameId);
          state.frameId = undefined;
        }
        state.targetX = 0;
        state.targetY = 0;
        state.targetScroll = 0;
        state.currentX = 0;
        state.currentY = 0;
        state.currentScroll = 0;
        state.scrollVel = 0;
        state.lastTimestamp = 0;
        state.hasPointer = false;
        resetFluidPointer();

        const root = rootRef.current;
        if (root) {
          root.style.removeProperty('--parallax-x');
          root.style.removeProperty('--parallax-y');
          root.style.removeProperty('--parallax-scroll');
          root.parentElement?.style.removeProperty('--liquid-scroll-vel');
        }
      };

      const cancelAnimationLoop = (): void => {
        const state = motionRef.current;
        if (state.frameId !== undefined) {
          window.cancelAnimationFrame(state.frameId);
          state.frameId = undefined;
        }
        state.lastTimestamp = 0;
      };

      const tick = (timestamp: number): void => {
        const state = motionRef.current;
        state.frameId = undefined;

        if (state.paused) {
          clearMotion();
          renderStaticOrLiveFrame();
          return;
        }

        if (document.hidden) {
          state.lastTimestamp = 0;
          return;
        }

        const dt =
          state.lastTimestamp > 0
            ? Math.min((timestamp - state.lastTimestamp) / 1000, 0.025)
            : 0.016;
        state.lastTimestamp = timestamp;
        state.ambientTime += dt;

        if (obstaclesDirty) {
          syncObstacles();
        }

        if (webglEngine) {
          webglEngine.step(dt, state.ambientTime);
          webglEngine.render();
        } else if (canvas2dSim && ctx2d && imageData2d) {
          canvas2dSim.step(dt, state.ambientTime);
          canvas2dSim.render(imageData2d, isDark);
          ctx2d.putImageData(imageData2d, 0, 0);
        }

        const dx = state.targetX - state.currentX;
        const dy = state.targetY - state.currentY;
        const ds = state.targetScroll - state.currentScroll;
        state.scrollVel *= 0.8;
        if (Math.abs(state.scrollVel) < 0.15) {
          state.scrollVel = 0;
        }

        if (
          Math.abs(dx) >= 0.04 ||
          Math.abs(dy) >= 0.04 ||
          Math.abs(ds) >= 0.08 ||
          state.scrollVel !== 0
        ) {
          state.currentX += dx * LERP_FACTOR;
          state.currentY += dy * LERP_FACTOR;
          state.currentScroll += ds * LERP_FACTOR;
          applyCssVars(state.currentX, state.currentY, state.currentScroll, state.scrollVel);
        } else if (
          state.currentX !== state.targetX ||
          state.currentY !== state.targetY ||
          state.currentScroll !== state.targetScroll
        ) {
          state.currentX = state.targetX;
          state.currentY = state.targetY;
          state.currentScroll = state.targetScroll;
          applyCssVars(state.currentX, state.currentY, state.currentScroll, 0);
        }

        state.frameId = window.requestAnimationFrame(tick);
      };

      const startAnimationLoop = (): void => {
        if (motionRef.current.paused || document.hidden) return;
        const state = motionRef.current;
        if (state.frameId === undefined) {
          state.lastTimestamp = 0;
          state.frameId = window.requestAnimationFrame(tick);
        }
      };

      const bindListeners = (): (() => void) => {
        let isPointerDown = false;
        let lastScrollY = window.scrollY;
        let lastScrollImpulseAt = 0;
        let pendingScrollDelta = 0;
        cachedBodies = collectObstacles();
        obstaclesDirty = true;

        const shellEl = rootRef.current?.parentElement;
        const homeContainerEl = shellEl?.querySelector<HTMLElement>('.portal-home-container') ?? null;
        const domObserver = shellEl
          ? new MutationObserver((mutations) => {
              const rootNode = rootRef.current;
              if (rootNode && mutations.every((mutation) => rootNode.contains(mutation.target))) {
                return;
              }
              cachedBodies = collectObstacles();
              obstaclesDirty = true;
            })
          : null;
        domObserver?.observe(shellEl as HTMLElement, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['class'],
        });

        const onLayoutTransitionEnd = (): void => {
          obstaclesDirty = true;
        };
        shellEl?.addEventListener('transitionend', onLayoutTransitionEnd);

        const displaceVisibleBodies = (deltaY: number, intensity = 0.9): number => {
          const vw = Math.max(window.innerWidth, 1);
          const vh = Math.max(window.innerHeight, 1);
          const cardVelY = Math.max(-1, Math.min(1, -deltaY / 110));
          if (Math.abs(cardVelY) < 0.015) return 0;

          let displaced = 0;
          for (const body of cachedBodies) {
            if (displaced >= MAX_SUBMERGED_BODIES_PER_TICK) break;
            const rect = body.getBoundingClientRect();
            if (
              rect.width < 20 ||
              rect.height < 20 ||
              rect.bottom <= 0 ||
              rect.top >= vh
            ) {
              continue;
            }
            const style = window.getComputedStyle(body);
            if (!hasPaintedSurface(style)) continue;

            const ghost = buildGhostObstacleRect({
              left: rect.left,
              top: rect.top,
              right: rect.right,
              bottom: rect.bottom,
              borderRadiusPx: readComputedBorderRadiusPx(style, rect.width, rect.height),
              viewportWidth: vw,
              viewportHeight: vh,
            });
            if (!ghost) continue;

            webglEngine?.displaceRect(
              ghost.left,
              ghost.top,
              ghost.right,
              ghost.bottom,
              cardVelY,
              intensity,
            );
            canvas2dSim?.displaceRect(
              ghost.left,
              ghost.top,
              ghost.right,
              ghost.bottom,
              cardVelY,
              intensity,
            );
            displaced += 1;
          }
          return displaced;
        };

        const updateFromCoords = (
          clientX: number,
          clientY: number,
          intensity: number,
          isInitialTouch = false,
        ): void => {
          const rect = canvas.getBoundingClientRect();
          const width = rect.width > 0 ? rect.width : Math.max(window.innerWidth, 1);
          const height = rect.height > 0 ? rect.height : Math.max(window.innerHeight, 1);
          const nx = clamp01((clientX - rect.left) / width);
          const ny = clamp01((clientY - rect.top) / height);
          const state = motionRef.current;

          if (isInitialTouch || !state.hasPointer) {
            state.hasPointer = true;
            state.lastNx = nx;
            state.lastNy = ny;
            resetFluidPointer();
            if (webglEngine) {
              webglEngine.splat(nx, ny, 0.008, -0.006, intensity * 0.85);
            } else {
              canvas2dSim?.splat(nx, ny, 0, 0, intensity);
            }
          } else {
            const dx = nx - state.lastNx;
            const dy = ny - state.lastNy;
            state.lastNx = nx;
            state.lastNy = ny;
            if (webglEngine) {
              webglEngine.splat(nx, ny, dx, dy, intensity);
            } else {
              canvas2dSim?.splat(nx, ny, dx, dy, intensity);
            }
          }

          state.splatCount += 1;
          canvas.dataset.fluidSplats = String(state.splatCount);

          state.targetX = (nx - 0.5) * 2 * MAX_POINTER_OFFSET_X;
          state.targetY = (ny - 0.5) * 2 * MAX_POINTER_OFFSET_Y;
          state.currentX += (state.targetX - state.currentX) * IMMEDIATE_SEED_FACTOR;
          state.currentY += (state.targetY - state.currentY) * IMMEDIATE_SEED_FACTOR;
          applyCssVars(state.currentX, state.currentY, state.currentScroll, state.scrollVel);
        };

        const onPointerDown = (event: PointerEvent): void => {
          if (event.pointerType === 'touch') return;
          isPointerDown = true;
          const rect = canvas.getBoundingClientRect();
          const width = rect.width > 0 ? rect.width : Math.max(window.innerWidth, 1);
          const height = rect.height > 0 ? rect.height : Math.max(window.innerHeight, 1);
          const nx = clamp01((event.clientX - rect.left) / width);
          const ny = clamp01((event.clientY - rect.top) / height);
          webglEngine?.stirBurst(nx, ny, 1.05);
          canvas2dSim?.stirBurst(nx, ny, 1.05);
          motionRef.current.splatCount += 1;
          canvas.dataset.fluidSplats = String(motionRef.current.splatCount);
        };

        const onPointerUp = (): void => {
          isPointerDown = false;
        };

        const onPointerMove = (event: PointerEvent): void => {
          if (event.pointerType === 'touch') return;
          updateFromCoords(event.clientX, event.clientY, isPointerDown ? 1.45 : 0.95);
        };

        const onTouchStart = (event: TouchEvent): void => {
          const touch = event.touches[0];
          if (!touch) return;
          updateFromCoords(touch.clientX, touch.clientY, 0.95, true);
        };

        const onTouchMove = (event: TouchEvent): void => {
          const touch = event.touches[0];
          if (!touch) return;
          updateFromCoords(touch.clientX, touch.clientY, 1.25);
        };

        const resetPointer = (): void => {
          isPointerDown = false;
          const state = motionRef.current;
          state.hasPointer = false;
          state.targetX = 0;
          state.targetY = 0;
          resetFluidPointer();
        };

        const applyScrollImpulse = (deltaY: number, intensity: number): void => {
          pendingScrollDelta += deltaY;
          const nowMs = performance.now();
          if (nowMs - lastScrollImpulseAt < SCROLL_IMPULSE_COOLDOWN_MS) return;
          lastScrollImpulseAt = nowMs;

          const effectiveDelta = pendingScrollDelta;
          pendingScrollDelta = 0;
          const state = motionRef.current;
          state.scrollVel = Math.max(-4.5, Math.min(4.5, state.scrollVel - effectiveDelta * 0.045));
          applyCssVars(state.currentX, state.currentY, state.currentScroll, state.scrollVel);

          const displaced = displaceVisibleBodies(effectiveDelta, intensity);
          const dyWake = Math.max(-0.025, Math.min(0.025, -effectiveDelta * 0.00045));
          webglEngine?.splat(state.lastNx, 0.5, 0, dyWake, 0.62);
          canvas2dSim?.splat(state.lastNx, 0.5, 0, dyWake, 0.62);

          state.scrollBodyCount += displaced;
          state.splatCount += Math.max(displaced, 1);
          canvas.dataset.fluidScrollBodies = String(state.scrollBodyCount);
          canvas.dataset.fluidSplats = String(state.splatCount);
        };

        const onWheel = (event: WheelEvent): void => {
          if (Math.abs(event.deltaY) < 4) return;
          applyScrollImpulse(event.deltaY * 0.5, 0.55);
        };

        const onScroll = (): void => {
          obstaclesDirty = true;
          const state = motionRef.current;
          const currentYScroll = window.scrollY;
          const scrollDelta = currentYScroll - lastScrollY;
          lastScrollY = currentYScroll;
          state.targetScroll = -Math.min(currentYScroll, MAX_SCROLL_INPUT);
          state.currentScroll += (state.targetScroll - state.currentScroll) * 0.35;
          applyCssVars(state.currentX, state.currentY, state.currentScroll, state.scrollVel);

          if (Math.abs(scrollDelta) >= 2) {
            applyScrollImpulse(scrollDelta, 0.72);
          }
        };

        const onResize = (): void => {
          syncCanvasSize();
          cachedBodies = collectObstacles();
          obstaclesDirty = true;
        };

        const onVisibilityChange = (): void => {
          if (document.hidden) {
            cancelAnimationLoop();
            return;
          }
          obstaclesDirty = true;
          startAnimationLoop();
        };

        const resizeObserver =
          typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver(() => {
                syncCanvasSize();
                obstaclesDirty = true;
              })
            : null;
        resizeObserver?.observe(canvas);
        if (homeContainerEl) {
          resizeObserver?.observe(homeContainerEl);
        }

        onScroll();
        applyCssVars(0, 0, motionRef.current.targetScroll, 0);
        motionRef.current.currentScroll = motionRef.current.targetScroll;

        window.addEventListener('pointerdown', onPointerDown, { passive: true });
        window.addEventListener('pointerup', onPointerUp, { passive: true });
        window.addEventListener('pointercancel', onPointerUp, { passive: true });
        window.addEventListener('pointermove', onPointerMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', resetPointer, {
          passive: true,
        });
        window.addEventListener('blur', resetPointer);
        window.addEventListener('touchstart', onTouchStart, { passive: true });
        window.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', resetPointer, { passive: true });
        window.addEventListener('touchcancel', resetPointer, { passive: true });
        window.addEventListener('wheel', onWheel, { passive: true });
        window.addEventListener('scroll', onScroll, { passive: true });
        window.addEventListener('resize', onResize, { passive: true });
        document.addEventListener('visibilitychange', onVisibilityChange);

        startAnimationLoop();

        return () => {
          domObserver?.disconnect();
          resizeObserver?.disconnect();
          shellEl?.removeEventListener('transitionend', onLayoutTransitionEnd);
          window.removeEventListener('pointerdown', onPointerDown);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerUp);
          window.removeEventListener('pointermove', onPointerMove);
          document.documentElement.removeEventListener('pointerleave', resetPointer);
          window.removeEventListener('blur', resetPointer);
          window.removeEventListener('touchstart', onTouchStart);
          window.removeEventListener('touchmove', onTouchMove);
          window.removeEventListener('touchend', resetPointer);
          window.removeEventListener('touchcancel', resetPointer);
          window.removeEventListener('wheel', onWheel);
          window.removeEventListener('scroll', onScroll);
          window.removeEventListener('resize', onResize);
          document.removeEventListener('visibilitychange', onVisibilityChange);
        };
      };

      const syncMode = (paused: boolean): void => {
        syncPausedFlags(paused);
        if (activeCleanup) {
          activeCleanup();
          activeCleanup = undefined;
        }
        if (paused) {
          clearMotion();
          cachedBodies = collectObstacles();
          syncObstacles();
          renderStaticOrLiveFrame();
          return;
        }
        activeCleanup = bindListeners();
      };

      const handleToggleEvent = (event: Event): void => {
        const detail = (event as CustomEvent<{ paused?: unknown }>).detail;
        const nextPaused =
          typeof detail?.paused === 'boolean' ? detail.paused : readStoredFluidPaused();
        syncMode(nextPaused);
      };

      const handleStorageEvent = (event: StorageEvent): void => {
        if (event.key === PORTAL_FLUID_STORAGE_KEY) {
          syncMode(readStoredFluidPaused());
        }
      };

      const classObserver = new MutationObserver(() => {
        const nextDark = document.documentElement.classList.contains('dark');
        if (nextDark === isDark) return;
        isDark = nextDark;
        webglEngine?.setTheme(isDark);
        if (motionRef.current.paused || document.hidden) {
          renderStaticOrLiveFrame();
        }
      });
      classObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['class'],
      });

      syncMode(readStoredFluidPaused());
      window.addEventListener(PORTAL_FLUID_TOGGLE_EVENT, handleToggleEvent);
      window.addEventListener('storage', handleStorageEvent);

      teardown = () => {
        classObserver.disconnect();
        window.removeEventListener(PORTAL_FLUID_TOGGLE_EVENT, handleToggleEvent);
        window.removeEventListener('storage', handleStorageEvent);
        if (activeCleanup) activeCleanup();
        clearMotion();
        webglEngine?.dispose();
      };
    };

    const initRafId = window.requestAnimationFrame(initFluid);

    return () => {
      disposedEffect = true;
      window.cancelAnimationFrame(initRafId);
      teardown?.();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className="portal-parallax"
      aria-hidden="true"
      data-testid="portal-home-parallax"
      data-fluid-paused="false"
    >
      <div className="portal-parallax-layer portal-parallax-layer-grid portal-parallax-grid" />
      <div className="portal-parallax-layer portal-parallax-layer-glow portal-parallax-glow">
        <span className="portal-parallax-orb portal-parallax-orb-blue-top" />
        <span className="portal-parallax-orb portal-parallax-orb-blue-bottom" />
        <span className="portal-parallax-orb portal-parallax-orb-amber" />
        <span className="portal-parallax-ring portal-parallax-ring-a" />
        <span className="portal-parallax-ring portal-parallax-ring-b" />
      </div>
      <canvas
        ref={canvasRef}
        className="portal-fluid-canvas"
        data-testid="portal-fluid-canvas"
      />
      <div className="portal-parallax-layer portal-parallax-layer-glow portal-liquid-caustics" />
      <div className="portal-parallax-layer portal-parallax-layer-dots portal-parallax-dots" />
    </div>
  );
}
