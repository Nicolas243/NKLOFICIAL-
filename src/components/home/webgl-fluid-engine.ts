import {
  rasterizeObstaclesMask,
  type FluidObstacleRect,
} from '@/components/home/fluid-obstacles';

export type FluidBackend = 'webgl2' | 'webgl1';

type GLContext = WebGLRenderingContext | WebGL2RenderingContext;

type FBO = {
  texture: WebGLTexture;
  fbo: WebGLFramebuffer;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach: (unit: number) => number;
};

type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};

type RenderFormat = {
  internalFormat: number;
  format: number;
};

type RGB = readonly [number, number, number];

type FluidProgram = {
  program: WebGLProgram;
  uniforms: Record<string, WebGLUniformLocation | null>;
  bind: () => void;
};

const SIM_RESOLUTION = 128;
const DYE_RES_DESKTOP = 512;
const DYE_RES_MOBILE = 384;
const PRESSURE_ITERATIONS = 18;
const PRESSURE_DISSIPATION = 0.82;
const SIM_SPEED_SCALE = 0.55;
const CURL_STRENGTH = 22;
const VELOCITY_DISSIPATION = 0.9;
const DENSITY_DISSIPATION = 2.6;
const SPLAT_RADIUS_BASE = 0.0014;

// Paletas liquidas calibradas: escuras no tema claro, claras no tema escuro.
const DARK_PALETTE: readonly RGB[] = [
  [0.56, 0.84, 1.0], // Ice Sky Blue
  [0.48, 0.92, 0.96], // Soft Cyan Mist
  [0.68, 0.78, 1.0], // Pale Periwinkle
  [0.76, 0.87, 0.98], // Silver Mist Blue
];
const DARK_WARM_ACCENT: RGB = [1.0, 0.76, 0.48];

const LIGHT_PALETTE: readonly RGB[] = [
  [0.04, 0.11, 0.25], // Deep Ink Navy
  [0.03, 0.16, 0.24], // Dark Slate Petrol
  [0.08, 0.10, 0.26], // Deep Midnight Indigo
  [0.07, 0.13, 0.21], // Dark Charcoal Blue
];
const LIGHT_WARM_ACCENT: RGB = [0.34, 0.12, 0.04];

const BASE_VERTEX_SHADER = `
  precision highp float;
  attribute vec2 aPosition;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform vec2 texelSize;

  void main () {
    vUv = aPosition * 0.5 + 0.5;
    vL = vUv - vec2(texelSize.x, 0.0);
    vR = vUv + vec2(texelSize.x, 0.0);
    vT = vUv + vec2(0.0, texelSize.y);
    vB = vUv - vec2(0.0, texelSize.y);
    gl_Position = vec4(aPosition, 0.0, 1.0);
  }
`;

const CLEAR_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  uniform sampler2D uTexture;
  uniform float value;

  void main () {
    gl_FragColor = value * texture2D(uTexture, vUv);
  }
`;

const SPLAT_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform sampler2D uObstacles;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    vec3 splat = exp(-dot(p, p) / radius) * color;
    vec3 base = texture2D(uTarget, vUv).xyz;
    gl_FragColor = vec4(base + splat, 1.0);
  }
`;

const DYE_SPLAT_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform sampler2D uObstacles;
  uniform float aspectRatio;
  uniform vec3 color;
  uniform vec2 point;
  uniform float radius;
  uniform float strength;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0);
      return;
    }
    vec2 p = vUv - point.xy;
    p.x *= aspectRatio;
    float w = clamp(exp(-dot(p, p) / radius) * strength, 0.0, 0.85);
    vec4 base = texture2D(uTarget, vUv);
    vec3 outRgb = color * w + base.rgb * (1.0 - w);
    float outA = clamp(w + base.a * (1.0 - w), 0.0, 1.0);
    gl_FragColor = vec4(outRgb, outA);
  }
`;

const CURL_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uObstacles;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    float L = texture2D(uVelocity, vL).y;
    float R = texture2D(uVelocity, vR).y;
    float T = texture2D(uVelocity, vT).x;
    float B = texture2D(uVelocity, vB).x;
    float vorticity = R - L - T + B;
    gl_FragColor = vec4(0.5 * vorticity, 0.0, 0.0, 1.0);
  }
`;

const VORTICITY_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uCurl;
  uniform sampler2D uObstacles;
  uniform float curl;
  uniform float dt;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    float L = texture2D(uCurl, vL).x;
    float R = texture2D(uCurl, vR).x;
    float T = texture2D(uCurl, vT).x;
    float B = texture2D(uCurl, vB).x;
    float C = texture2D(uCurl, vUv).x;

    vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
    force /= length(force) + 0.0001;
    force *= curl * C;
    force.y *= -1.0;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity += force * dt;
    velocity = min(max(velocity, -1000.0), 1000.0);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const DIVERGENCE_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uVelocity;
  uniform sampler2D uObstacles;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    float L = texture2D(uVelocity, vL).x;
    float R = texture2D(uVelocity, vR).x;
    float T = texture2D(uVelocity, vT).y;
    float B = texture2D(uVelocity, vB).y;

    vec2 C = texture2D(uVelocity, vUv).xy;
    if (vL.x < 0.0 || texture2D(uObstacles, vL).r > 0.5) { L = -C.x; }
    if (vR.x > 1.0 || texture2D(uObstacles, vR).r > 0.5) { R = -C.x; }
    if (vT.y > 1.0 || texture2D(uObstacles, vT).r > 0.5) { T = -C.y; }
    if (vB.y < 0.0 || texture2D(uObstacles, vB).r > 0.5) { B = -C.y; }

    float div = 0.5 * (R - L + T - B);
    gl_FragColor = vec4(div, 0.0, 0.0, 1.0);
  }
`;

const PRESSURE_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform sampler2D uObstacles;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    float pC = texture2D(uPressure, vUv).x;
    float L = texture2D(uObstacles, vL).r > 0.5 ? pC : texture2D(uPressure, vL).x;
    float R = texture2D(uObstacles, vR).r > 0.5 ? pC : texture2D(uPressure, vR).x;
    float T = texture2D(uObstacles, vT).r > 0.5 ? pC : texture2D(uPressure, vT).x;
    float B = texture2D(uObstacles, vB).r > 0.5 ? pC : texture2D(uPressure, vB).x;
    float divergence = texture2D(uDivergence, vUv).x;
    float pressure = (L + R + B + T - divergence) * 0.25;
    gl_FragColor = vec4(pressure, 0.0, 0.0, 1.0);
  }
`;

const GRADIENT_SUBTRACT_SHADER = `
  precision mediump float;
  precision mediump sampler2D;
  varying highp vec2 vUv;
  varying highp vec2 vL;
  varying highp vec2 vR;
  varying highp vec2 vT;
  varying highp vec2 vB;
  uniform sampler2D uPressure;
  uniform sampler2D uVelocity;
  uniform sampler2D uObstacles;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
      return;
    }
    float oL = texture2D(uObstacles, vL).r;
    float oR = texture2D(uObstacles, vR).r;
    float oT = texture2D(uObstacles, vT).r;
    float oB = texture2D(uObstacles, vB).r;

    float pC = texture2D(uPressure, vUv).x;
    float L = oL > 0.5 ? pC : texture2D(uPressure, vL).x;
    float R = oR > 0.5 ? pC : texture2D(uPressure, vR).x;
    float T = oT > 0.5 ? pC : texture2D(uPressure, vT).x;
    float B = oB > 0.5 ? pC : texture2D(uPressure, vB).x;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    velocity.xy -= vec2(R - L, T - B);
    if (oL > 0.5 && velocity.x < 0.0) { velocity.x = 0.0; }
    if (oR > 0.5 && velocity.x > 0.0) { velocity.x = 0.0; }
    if (oT > 0.5 && velocity.y > 0.0) { velocity.y = 0.0; }
    if (oB > 0.5 && velocity.y < 0.0) { velocity.y = 0.0; }

    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

const ADVECTION_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform sampler2D uObstacles;
  uniform vec2 texelSize;
  uniform vec2 dyeTexelSize;
  uniform float dt;
  uniform float dissipation;

  vec4 bilerp (sampler2D sam, vec2 uv, vec2 tsize) {
    vec2 st = uv / tsize - 0.5;
    vec2 iuv = floor(st);
    vec2 fuv = fract(st);
    vec4 a = texture2D(sam, (iuv + vec2(0.5, 0.5)) * tsize);
    vec4 b = texture2D(sam, (iuv + vec2(1.5, 0.5)) * tsize);
    vec4 c = texture2D(sam, (iuv + vec2(0.5, 1.5)) * tsize);
    vec4 d = texture2D(sam, (iuv + vec2(1.5, 1.5)) * tsize);
    return mix(mix(a, b, fuv.x), mix(c, d, fuv.x), fuv.y);
  }

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0);
      return;
    }
    #ifdef MANUAL_FILTERING
      vec2 coord = vUv - dt * bilerp(uVelocity, vUv, texelSize).xy * texelSize;
      if (texture2D(uObstacles, coord).r > 0.5) {
        coord = vUv;
      }
      vec4 result = bilerp(uSource, coord, dyeTexelSize);
    #else
      vec2 coord = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      if (texture2D(uObstacles, coord).r > 0.5) {
        coord = vUv;
      }
      vec4 result = texture2D(uSource, coord);
    #endif
    float decay = 1.0 + dissipation * dt;
    gl_FragColor = result / decay;
  }
`;

const DISPLAY_SHADER = `
  precision highp float;
  precision highp sampler2D;
  varying vec2 vUv;
  varying vec2 vL;
  varying vec2 vR;
  varying vec2 vT;
  varying vec2 vB;
  uniform sampler2D uTexture;
  uniform sampler2D uObstacles;
  uniform float uAlphaCap;
  uniform float uSpecularBoost;
  uniform vec3 uSheenColor;

  void main () {
    if (texture2D(uObstacles, vUv).r > 0.5) {
      gl_FragColor = vec4(0.0);
      return;
    }
    vec4 raw = texture2D(uTexture, vUv);
    float density = clamp(raw.a, 0.0, 1.0);
    if (density < 0.004) {
      gl_FragColor = vec4(0.0);
      return;
    }

    vec3 pigment = clamp(raw.rgb / max(density, 0.004), 0.0, 1.0);
    float dL = clamp(texture2D(uTexture, vL).a, 0.0, 1.0);
    float dR = clamp(texture2D(uTexture, vR).a, 0.0, 1.0);
    float dT = clamp(texture2D(uTexture, vT).a, 0.0, 1.0);
    float dB = clamp(texture2D(uTexture, vB).a, 0.0, 1.0);

    float dx = dR - dL;
    float dy = dT - dB;
    vec3 normal = normalize(vec3(dx * 2.5, dy * 2.5, 0.32));
    vec3 lightDir = normalize(vec3(0.45, 0.65, 0.62));
    float ndl = clamp(dot(normal, lightDir), 0.0, 1.0);
    float diffuse = 0.86 + 0.20 * ndl;
    float sheen = pow(ndl, 6.0) * uSpecularBoost;

    vec3 shaded = clamp(pigment * diffuse + sheen * uSheenColor * density, 0.0, 1.0);
    float alpha = clamp(smoothstep(0.03, 0.9, density) * uAlphaCap, 0.0, uAlphaCap);

    // Saida pre-multiplicada para composicao limpa sobre temas claro e escuro.
    gl_FragColor = vec4(shaded * alpha, alpha);
  }
`;

function clamp01(value: number): number {
  return value < 0 ? 0 : value > 1 ? 1 : value;
}

function getResolution(baseResolution: number, width: number, height: number): { width: number; height: number } {
  const safeW = Math.max(width, 1);
  const safeH = Math.max(height, 1);
  let aspectRatio = safeW / safeH;
  if (aspectRatio < 1) {
    aspectRatio = 1 / aspectRatio;
  }
  const minDim = Math.round(baseResolution);
  const maxDim = Math.round(baseResolution * aspectRatio);
  return safeW > safeH ? { width: maxDim, height: minDim } : { width: minDim, height: maxDim };
}

function compileShader(gl: GLContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function supportRenderTextureFormat(
  gl: GLContext,
  internalFormat: number,
  format: number,
  type: number,
): boolean {
  const texture = gl.createTexture();
  if (!texture) return false;
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  if (!fbo) {
    gl.deleteTexture(texture);
    return false;
  }
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);

  gl.bindFramebuffer(gl.FRAMEBUFFER, null);
  gl.bindTexture(gl.TEXTURE_2D, null);
  gl.deleteFramebuffer(fbo);
  gl.deleteTexture(texture);

  return status === gl.FRAMEBUFFER_COMPLETE;
}

function getSupportedFormat(
  gl: GLContext,
  internalFormat: number,
  format: number,
  type: number,
  isWebGL2: boolean,
): RenderFormat | null {
  if (supportRenderTextureFormat(gl, internalFormat, format, type)) {
    return { internalFormat, format };
  }
  if (!isWebGL2) return null;
  const gl2 = gl as WebGL2RenderingContext;
  if (internalFormat === gl2.R16F) {
    return getSupportedFormat(gl, gl2.RG16F, gl2.RG, type, true);
  }
  if (internalFormat === gl2.RG16F) {
    return getSupportedFormat(gl, gl2.RGBA16F, gl2.RGBA, type, true);
  }
  return null;
}

export class WebGLFluidEngine {
  readonly backend: FluidBackend;

  private readonly gl: GLContext;
  private readonly formatRGBA: RenderFormat;
  private readonly formatRG: RenderFormat;
  private readonly formatR: RenderFormat;
  private readonly halfFloatTexType: number;
  private readonly filtering: number;

  private readonly quadVertexBuffer: WebGLBuffer;
  private readonly quadIndexBuffer: WebGLBuffer;
  private readonly allocatedPrograms: WebGLProgram[] = [];

  private readonly clearProgram: FluidProgram;
  private readonly splatProgram: FluidProgram;
  private readonly dyeSplatProgram: FluidProgram;
  private readonly curlProgram: FluidProgram;
  private readonly vorticityProgram: FluidProgram;
  private readonly divergenceProgram: FluidProgram;
  private readonly pressureProgram: FluidProgram;
  private readonly gradientSubtractProgram: FluidProgram;
  private readonly advectionProgram: FluidProgram;
  private readonly displayProgram: FluidProgram;

  private velocity: DoubleFBO;
  private dye: DoubleFBO;
  private divergence: FBO;
  private curl: FBO;
  private pressure: DoubleFBO;
  private obstacleTexture: WebGLTexture;
  private obstacleBuffer: Uint8Array;
  private obstacleWidth: number;
  private obstacleHeight: number;
  private lastObstacles: readonly FluidObstacleRect[] = [];

  private isDark: boolean;
  private colorIndex = 0;
  private strokeCounter = 0;
  private lastPointerInteractionTime = 0;
  private lastAmbientPulseTime = 0;
  private hasLastPointer = false;
  private lastNx = 0.5;
  private lastNy = 0.5;
  private disposed = false;

  private constructor(params: {
    gl: GLContext;
    backend: FluidBackend;
    formatRGBA: RenderFormat;
    formatRG: RenderFormat;
    formatR: RenderFormat;
    halfFloatTexType: number;
    supportLinearFiltering: boolean;
    isDark: boolean;
  }) {
    this.gl = params.gl;
    this.backend = params.backend;
    this.formatRGBA = params.formatRGBA;
    this.formatRG = params.formatRG;
    this.formatR = params.formatR;
    this.halfFloatTexType = params.halfFloatTexType;
    this.filtering = params.supportLinearFiltering ? params.gl.LINEAR : params.gl.NEAREST;
    this.isDark = params.isDark;

    const gl = this.gl;
    const vbo = gl.createBuffer();
    const ibo = gl.createBuffer();
    if (!vbo || !ibo) {
      throw new Error('Failed to create WebGL quad buffers');
    }
    this.quadVertexBuffer = vbo;
    this.quadIndexBuffer = ibo;

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIndexBuffer);
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, BASE_VERTEX_SHADER);
    if (!vertexShader) {
      throw new Error('Failed to compile WebGL base vertex shader');
    }

    const advectionSource = params.supportLinearFiltering
      ? ADVECTION_SHADER
      : `#define MANUAL_FILTERING\n${ADVECTION_SHADER}`;

    try {
      this.clearProgram = this.createProgram(vertexShader, CLEAR_SHADER);
      this.splatProgram = this.createProgram(vertexShader, SPLAT_SHADER);
      this.dyeSplatProgram = this.createProgram(vertexShader, DYE_SPLAT_SHADER);
      this.curlProgram = this.createProgram(vertexShader, CURL_SHADER);
      this.vorticityProgram = this.createProgram(vertexShader, VORTICITY_SHADER);
      this.divergenceProgram = this.createProgram(vertexShader, DIVERGENCE_SHADER);
      this.pressureProgram = this.createProgram(vertexShader, PRESSURE_SHADER);
      this.gradientSubtractProgram = this.createProgram(vertexShader, GRADIENT_SUBTRACT_SHADER);
      this.advectionProgram = this.createProgram(vertexShader, advectionSource);
      this.displayProgram = this.createProgram(vertexShader, DISPLAY_SHADER);
    } finally {
      gl.deleteShader(vertexShader);
    }

    const canvasWidth = Math.max(gl.drawingBufferWidth, 300);
    const canvasHeight = Math.max(gl.drawingBufferHeight, 200);
    const dyeBase = canvasWidth < 768 ? DYE_RES_MOBILE : DYE_RES_DESKTOP;
    const simRes = getResolution(SIM_RESOLUTION, canvasWidth, canvasHeight);
    const dyeRes = getResolution(dyeBase, canvasWidth, canvasHeight);

    this.velocity = this.createDoubleFBO(
      simRes.width,
      simRes.height,
      this.formatRG.internalFormat,
      this.formatRG.format,
      this.halfFloatTexType,
      this.filtering,
    );
    this.dye = this.createDoubleFBO(
      dyeRes.width,
      dyeRes.height,
      this.formatRGBA.internalFormat,
      this.formatRGBA.format,
      this.halfFloatTexType,
      this.filtering,
    );
    this.divergence = this.createFBO(
      simRes.width,
      simRes.height,
      this.formatR.internalFormat,
      this.formatR.format,
      this.halfFloatTexType,
      gl.NEAREST,
    );
    this.curl = this.createFBO(
      simRes.width,
      simRes.height,
      this.formatR.internalFormat,
      this.formatR.format,
      this.halfFloatTexType,
      gl.NEAREST,
    );
    this.pressure = this.createDoubleFBO(
      simRes.width,
      simRes.height,
      this.formatR.internalFormat,
      this.formatR.format,
      this.halfFloatTexType,
      gl.NEAREST,
    );

    this.obstacleWidth = simRes.width;
    this.obstacleHeight = simRes.height;
    this.obstacleBuffer = new Uint8Array(simRes.width * simRes.height * 4);
    this.obstacleTexture = this.createObstacleTexture(simRes.width, simRes.height, this.obstacleBuffer);

    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
  }

  static create(canvas: HTMLCanvasElement, isDark: boolean): WebGLFluidEngine | null {
    const contextAttrs: WebGLContextAttributes = {
      alpha: true,
      premultipliedAlpha: true,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance',
    };

    let gl: GLContext | null = canvas.getContext('webgl2', contextAttrs) as WebGL2RenderingContext | null;
    const isWebGL2 = Boolean(gl);
    if (!gl) {
      gl = (canvas.getContext('webgl', contextAttrs) ||
        canvas.getContext('experimental-webgl', contextAttrs)) as WebGLRenderingContext | null;
    }
    if (!gl) return null;

    let halfFloatTexType: number;
    let supportLinearFiltering = false;
    let formatRGBA: RenderFormat | null;
    let formatRG: RenderFormat | null;
    let formatR: RenderFormat | null;

    if (isWebGL2) {
      const gl2 = gl as WebGL2RenderingContext;
      gl2.getExtension('EXT_color_buffer_float');
      supportLinearFiltering = Boolean(gl2.getExtension('OES_texture_float_linear'));
      halfFloatTexType = gl2.HALF_FLOAT;
      formatRGBA = getSupportedFormat(gl2, gl2.RGBA16F, gl2.RGBA, halfFloatTexType, true);
      formatRG = getSupportedFormat(gl2, gl2.RG16F, gl2.RG, halfFloatTexType, true);
      formatR = getSupportedFormat(gl2, gl2.R16F, gl2.RED, halfFloatTexType, true);
    } else {
      const gl1 = gl as WebGLRenderingContext;
      const halfFloat = gl1.getExtension('OES_texture_half_float');
      if (!halfFloat) return null;
      supportLinearFiltering = Boolean(gl1.getExtension('OES_texture_half_float_linear'));
      halfFloatTexType = halfFloat.HALF_FLOAT_OES;
      formatRGBA = getSupportedFormat(gl1, gl1.RGBA, gl1.RGBA, halfFloatTexType, false);
      formatRG = formatRGBA;
      formatR = formatRGBA;
    }

    if (!formatRGBA || !formatRG || !formatR) {
      return null;
    }

    try {
      return new WebGLFluidEngine({
        gl,
        backend: isWebGL2 ? 'webgl2' : 'webgl1',
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
        isDark,
      });
    } catch {
      return null;
    }
  }

  setTheme(isDark: boolean): void {
    if (this.isDark === isDark) return;
    this.isDark = isDark;
    if (this.disposed) return;

    const gl = this.gl;
    gl.disable(gl.BLEND);
    gl.clearColor(0, 0, 0, 0);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dye.read.fbo);
    gl.viewport(0, 0, this.dye.width, this.dye.height);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.dye.write.fbo);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    this.seedAmbientWakes();
  }

  resetPointer(): void {
    this.hasLastPointer = false;
  }

  setObstacles(rects: readonly FluidObstacleRect[]): void {
    if (this.disposed) return;
    this.lastObstacles = rects;
    rasterizeObstaclesMask(
      rects,
      this.obstacleWidth,
      this.obstacleHeight,
      this.obstacleBuffer,
      4,
      true,
    );
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    gl.texSubImage2D(
      gl.TEXTURE_2D,
      0,
      0,
      0,
      this.obstacleWidth,
      this.obstacleHeight,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      this.obstacleBuffer,
    );
  }

  resize(cssWidth: number, cssHeight: number, dpr: number): void {
    if (this.disposed) return;
    const clampedDpr = Math.min(Math.max(dpr, 1), 1.5);
    const width = Math.max(Math.floor(cssWidth * clampedDpr), 2);
    const height = Math.max(Math.floor(cssHeight * clampedDpr), 2);
    const canvas = this.gl.canvas as HTMLCanvasElement;

    if (canvas.width === width && canvas.height === height) return;
    canvas.width = width;
    canvas.height = height;

    const simRes = getResolution(SIM_RESOLUTION, width, height);
    const dyeBase = cssWidth < 768 ? DYE_RES_MOBILE : DYE_RES_DESKTOP;
    const dyeRes = getResolution(dyeBase, width, height);

    this.velocity = this.resizeDoubleFBO(
      this.velocity,
      simRes.width,
      simRes.height,
      this.formatRG.internalFormat,
      this.formatRG.format,
      this.halfFloatTexType,
      this.filtering,
    );
    this.dye = this.resizeDoubleFBO(
      this.dye,
      dyeRes.width,
      dyeRes.height,
      this.formatRGBA.internalFormat,
      this.formatRGBA.format,
      this.halfFloatTexType,
      this.filtering,
    );

    this.deleteFBO(this.divergence);
    this.deleteFBO(this.curl);
    this.deleteDoubleFBO(this.pressure);

    this.divergence = this.createFBO(
      simRes.width,
      simRes.height,
      this.formatR.internalFormat,
      this.formatR.format,
      this.halfFloatTexType,
      this.gl.NEAREST,
    );
    this.curl = this.createFBO(
      simRes.width,
      simRes.height,
      this.formatR.internalFormat,
      this.formatR.format,
      this.halfFloatTexType,
      this.gl.NEAREST,
    );
    this.pressure = this.createDoubleFBO(
      simRes.width,
      simRes.height,
      this.formatR.internalFormat,
      this.formatR.format,
      this.halfFloatTexType,
      this.gl.NEAREST,
    );

    if (this.obstacleWidth !== simRes.width || this.obstacleHeight !== simRes.height) {
      this.obstacleWidth = simRes.width;
      this.obstacleHeight = simRes.height;
      this.obstacleBuffer = new Uint8Array(simRes.width * simRes.height * 4);
      rasterizeObstaclesMask(
        this.lastObstacles,
        simRes.width,
        simRes.height,
        this.obstacleBuffer,
        4,
        true,
      );
      this.gl.bindTexture(this.gl.TEXTURE_2D, this.obstacleTexture);
      this.gl.texImage2D(
        this.gl.TEXTURE_2D,
        0,
        this.gl.RGBA,
        simRes.width,
        simRes.height,
        0,
        this.gl.RGBA,
        this.gl.UNSIGNED_BYTE,
        this.obstacleBuffer,
      );
    }
  }

  splat(nx: number, ny: number, dx: number, dy: number, intensity = 1): void {
    if (this.disposed) return;
    const cx = clamp01(nx);
    // Inverte eixo Y do DOM (topo=0) para espaco UV WebGL (topo=1).
    const cy = 1 - clamp01(ny);

    if (!this.hasLastPointer) {
      this.lastNx = cx;
      this.lastNy = cy;
      this.hasLastPointer = true;
    }

    const stepDx = cx - this.lastNx;
    const stepDy = cy - this.lastNy;
    const dist = Math.hypot(stepDx, stepDy);
    const subSteps = Math.min(Math.max(Math.ceil(dist * 32), 1), 8);

    const safeDx = Math.abs(dx) > 0.0001 ? dx : stepDx;
    const safeDy = Math.abs(dy) > 0.0001 ? -dy : stepDy;
    const forceScale = 2800 * Math.min(Math.max(intensity, 0.35), 1.8);
    const forceX = Math.max(-750, Math.min(750, safeDx * forceScale));
    const forceY = Math.max(-750, Math.min(750, safeDy * forceScale));
    const baseColor = this.pickWakeColor();
    const dyeStrength = (this.isDark ? 0.34 : 0.44) / Math.sqrt(subSteps);

    for (let s = 1; s <= subSteps; s += 1) {
      const t = s / subSteps;
      const px = this.lastNx + stepDx * t;
      const py = this.lastNy + stepDy * t;
      this.emitSplat(px, py, forceX, forceY, baseColor, dyeStrength, 0.85);
    }

    this.lastNx = cx;
    this.lastNy = cy;
    this.lastPointerInteractionTime = performance.now() * 0.001;
  }

  stirBurst(nx: number, ny: number, radiusScale = 1.0): void {
    if (this.disposed) return;
    const cx = clamp01(nx);
    const cy = 1 - clamp01(ny);
    const offsets: readonly [number, number][] = [
      [1, 0.35],
      [-0.35, 1],
      [-1, -0.35],
      [0.35, -1],
    ];
    const dyeStrength = this.isDark ? 0.36 : 0.46;
    for (const [ox, oy] of offsets) {
      const baseColor = this.pickWakeColor();
      this.emitSplat(
        clamp01(cx + ox * 0.008),
        clamp01(cy + oy * 0.008),
        ox * 190,
        oy * 190,
        baseColor,
        dyeStrength,
        radiusScale,
      );
    }
    this.lastNx = cx;
    this.lastNy = cy;
    this.hasLastPointer = true;
    this.lastPointerInteractionTime = performance.now() * 0.001;
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
    if (this.disposed) return;
    const clampedVel = Math.max(-1, Math.min(1, velY));
    if (Math.abs(clampedVel) < 0.015) return;

    const l = clamp01(leftN);
    const r = clamp01(rightN);
    const t = clamp01(topN);
    const b = clamp01(bottomN);
    if (r - l < 0.02 || b - t < 0.02) return;

    const glVyDir = -clampedVel;
    const push = (260 + 340 * Math.abs(clampedVel)) * Math.min(Math.max(intensity, 0.35), 1.6);
    const leadingDomY = clampedVel < 0 ? t : b;
    const leadOffset = clampedVel < 0 ? -0.012 : 0.012;
    const leadingUvY = 1 - clamp01(leadingDomY + leadOffset);
    const midUvY = 1 - (t + b) * 0.5;
    const wakeVy = glVyDir * push;
    const dyeStrength = (this.isDark ? 0.26 : 0.36) * Math.min(Math.max(intensity, 0.4), 1.2);

    const leftColor = this.pickWakeColor();
    this.emitSplat(
      clamp01(l + (r - l) * 0.28),
      leadingUvY,
      -push * 0.42,
      wakeVy,
      leftColor,
      dyeStrength,
      0.9,
    );

    const rightColor = this.pickWakeColor();
    this.emitSplat(
      clamp01(l + (r - l) * 0.72),
      leadingUvY,
      push * 0.42,
      wakeVy,
      rightColor,
      dyeStrength,
      0.9,
    );

    const sideDye = dyeStrength * 0.75;
    if (l > 0.015) {
      const sideLColor = this.pickWakeColor();
      this.emitSplat(
        clamp01(l - 0.012),
        midUvY,
        -push * 0.32,
        -wakeVy * 0.55,
        sideLColor,
        sideDye,
        0.75,
      );
    }
    if (r < 0.985) {
      const sideRColor = this.pickWakeColor();
      this.emitSplat(
        clamp01(r + 0.012),
        midUvY,
        push * 0.32,
        -wakeVy * 0.55,
        sideRColor,
        sideDye,
        0.75,
      );
    }

    this.lastPointerInteractionTime = performance.now() * 0.001;
  }

  seedAmbientWakes(): void {
    if (this.disposed) return;
    const wakes: readonly [number, number, number, number, number][] = [
      [0.06, 0.28, 195, 75, 1.15],
      [0.94, 0.32, -195, 85, 1.1],
      [0.5, 0.48, 145, -105, 1.05],
      [0.08, 0.74, 175, -85, 1.05],
      [0.92, 0.72, -175, 80, 1.0],
    ];
    const dyeStrength = this.isDark ? 0.36 : 0.46;
    for (const [x, y, vx, vy, radiusScale] of wakes) {
      const color = this.pickWakeColor();
      this.emitSplat(x, y, vx, vy, color, dyeStrength, radiusScale);
    }
    for (let stepIdx = 1; stepIdx <= 6; stepIdx += 1) {
      this.step(0.016, stepIdx * 0.08);
    }
  }

  step(dt: number, ambientTime: number): void {
    if (this.disposed) return;
    const clampedDt = Math.min(Math.max(dt, 0.004), 0.025);
    const simDt = clampedDt * SIM_SPEED_SCALE;
    const nowSec = performance.now() * 0.001;

    // Pulso continuo suave em canais abertos para colidir e contornar os cards.
    if (
      nowSec - this.lastPointerInteractionTime > 1.8 &&
      nowSec - this.lastAmbientPulseTime > 1.6
    ) {
      this.lastAmbientPulseTime = nowSec;
      const sideX1 = Math.sin(ambientTime * 0.21) >= 0 ? 0.06 : 0.94;
      const x1 = sideX1 + 0.02 * Math.sin(ambientTime * 0.37);
      const y1 = 0.2 + 0.58 * (0.5 + 0.5 * Math.cos(ambientTime * 0.21));
      const inwardSign = sideX1 < 0.5 ? 1 : -1;
      const vx1 = inwardSign * (115 + 35 * Math.cos(ambientTime * 0.45));
      const vy1 = Math.sin(ambientTime * 0.38) * 95;
      const color1 = this.pickWakeColor();
      const dyeStrength = this.isDark ? 0.3 : 0.38;
      this.emitSplat(x1, y1, vx1, vy1, color1, dyeStrength, 0.95);

      const x2 = 0.5 + 0.06 * Math.sin(ambientTime * 0.19 + 1.3);
      const y2 = 0.22 + 0.56 * (0.5 + 0.5 * Math.cos(ambientTime * 0.23 + 0.8));
      const color2 = this.pickWakeColor();
      this.emitSplat(x2, y2, -vx1 * 0.65, -vy1 * 0.85, color2, dyeStrength * 0.9, 0.85);
    }

    const gl = this.gl;
    gl.disable(gl.BLEND);
    const obstacleUnit = this.attachObstacles(2);

    this.curlProgram.bind();
    gl.uniform2f(this.curlProgram.uniforms.texelSize, this.velocity.texelSizeX, this.velocity.texelSizeY);
    gl.uniform1i(this.curlProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(this.curlProgram.uniforms.uObstacles, obstacleUnit);
    this.blit(this.curl);

    this.vorticityProgram.bind();
    gl.uniform2f(
      this.vorticityProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(this.vorticityProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(this.vorticityProgram.uniforms.uCurl, this.curl.attach(1));
    gl.uniform1i(this.vorticityProgram.uniforms.uObstacles, obstacleUnit);
    gl.uniform1f(this.vorticityProgram.uniforms.curl, CURL_STRENGTH);
    gl.uniform1f(this.vorticityProgram.uniforms.dt, simDt);
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.divergenceProgram.bind();
    gl.uniform2f(
      this.divergenceProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(this.divergenceProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(this.divergenceProgram.uniforms.uObstacles, obstacleUnit);
    this.blit(this.divergence);

    this.clearProgram.bind();
    gl.uniform1i(this.clearProgram.uniforms.uTexture, this.pressure.read.attach(0));
    gl.uniform1f(this.clearProgram.uniforms.value, PRESSURE_DISSIPATION);
    this.blit(this.pressure.write);
    this.pressure.swap();

    this.pressureProgram.bind();
    gl.uniform2f(
      this.pressureProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(this.pressureProgram.uniforms.uDivergence, this.divergence.attach(0));
    gl.uniform1i(this.pressureProgram.uniforms.uObstacles, obstacleUnit);
    for (let i = 0; i < PRESSURE_ITERATIONS; i += 1) {
      gl.uniform1i(this.pressureProgram.uniforms.uPressure, this.pressure.read.attach(1));
      this.blit(this.pressure.write);
      this.pressure.swap();
    }

    this.gradientSubtractProgram.bind();
    gl.uniform2f(
      this.gradientSubtractProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform1i(this.gradientSubtractProgram.uniforms.uPressure, this.pressure.read.attach(0));
    gl.uniform1i(this.gradientSubtractProgram.uniforms.uVelocity, this.velocity.read.attach(1));
    gl.uniform1i(this.gradientSubtractProgram.uniforms.uObstacles, obstacleUnit);
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.advectionProgram.bind();
    gl.uniform2f(
      this.advectionProgram.uniforms.texelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    gl.uniform2f(
      this.advectionProgram.uniforms.dyeTexelSize,
      this.velocity.texelSizeX,
      this.velocity.texelSizeY,
    );
    const velocityId = this.velocity.read.attach(0);
    gl.uniform1i(this.advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(this.advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1i(this.advectionProgram.uniforms.uObstacles, obstacleUnit);
    gl.uniform1f(this.advectionProgram.uniforms.dt, simDt);
    gl.uniform1f(this.advectionProgram.uniforms.dissipation, VELOCITY_DISSIPATION);
    this.blit(this.velocity.write);
    this.velocity.swap();

    gl.uniform2f(
      this.advectionProgram.uniforms.dyeTexelSize,
      this.dye.texelSizeX,
      this.dye.texelSizeY,
    );
    gl.uniform1i(this.advectionProgram.uniforms.uVelocity, this.velocity.read.attach(0));
    gl.uniform1i(this.advectionProgram.uniforms.uSource, this.dye.read.attach(1));
    gl.uniform1i(this.advectionProgram.uniforms.uObstacles, obstacleUnit);
    gl.uniform1f(this.advectionProgram.uniforms.dissipation, DENSITY_DISSIPATION);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  render(): void {
    if (this.disposed) return;
    const gl = this.gl;
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

    this.displayProgram.bind();
    gl.uniform2f(this.displayProgram.uniforms.texelSize, this.dye.texelSizeX, this.dye.texelSizeY);
    gl.uniform1i(this.displayProgram.uniforms.uTexture, this.dye.read.attach(0));
    gl.uniform1i(this.displayProgram.uniforms.uObstacles, this.attachObstacles(1));
    gl.uniform1f(this.displayProgram.uniforms.uAlphaCap, this.isDark ? 0.42 : 0.56);
    gl.uniform1f(this.displayProgram.uniforms.uSpecularBoost, this.isDark ? 0.14 : 0.06);
    if (this.isDark) {
      gl.uniform3f(this.displayProgram.uniforms.uSheenColor, 0.88, 0.95, 1.0);
    } else {
      gl.uniform3f(this.displayProgram.uniforms.uSheenColor, 0.16, 0.24, 0.36);
    }
    this.drawQuad();
    gl.disable(gl.BLEND);
  }

  dispose(): void {
    if (this.disposed) return;
    this.disposed = true;
    const gl = this.gl;

    this.deleteDoubleFBO(this.velocity);
    this.deleteDoubleFBO(this.dye);
    this.deleteFBO(this.divergence);
    this.deleteFBO(this.curl);
    this.deleteDoubleFBO(this.pressure);
    gl.deleteTexture(this.obstacleTexture);

    for (const program of this.allocatedPrograms) {
      gl.deleteProgram(program);
    }
    gl.deleteBuffer(this.quadVertexBuffer);
    gl.deleteBuffer(this.quadIndexBuffer);
  }

  private pickWakeColor(): RGB {
    this.strokeCounter += 1;
    // Aprox. 25% dos impulsos recebem o destaque quente controlado.
    if (this.strokeCounter % 4 === 0) {
      return this.isDark ? DARK_WARM_ACCENT : LIGHT_WARM_ACCENT;
    }
    const palette = this.isDark ? DARK_PALETTE : LIGHT_PALETTE;
    const color = palette[this.colorIndex % palette.length];
    this.colorIndex += 1;
    return color;
  }

  private attachObstacles(unit: number): number {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0 + unit);
    gl.bindTexture(gl.TEXTURE_2D, this.obstacleTexture);
    return unit;
  }

  private createObstacleTexture(
    width: number,
    height: number,
    initialData: Uint8Array,
  ): WebGLTexture {
    const gl = this.gl;
    const texture = gl.createTexture();
    if (!texture) {
      throw new Error('Failed to create WebGL obstacle texture');
    }
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, initialData);
    return texture;
  }

  private emitSplat(
    x: number,
    y: number,
    vx: number,
    vy: number,
    color: RGB,
    dyeStrength: number,
    radiusMultiplier: number,
  ): void {
    const gl = this.gl;
    const canvas = gl.canvas as HTMLCanvasElement;
    const aspect = Math.max(canvas.width, 1) / Math.max(canvas.height, 1);
    const radius = this.correctRadius(SPLAT_RADIUS_BASE * radiusMultiplier, aspect);

    gl.disable(gl.BLEND);
    const obstacleUnit = this.attachObstacles(1);

    this.splatProgram.bind();
    gl.uniform1i(this.splatProgram.uniforms.uTarget, this.velocity.read.attach(0));
    gl.uniform1i(this.splatProgram.uniforms.uObstacles, obstacleUnit);
    gl.uniform1f(this.splatProgram.uniforms.aspectRatio, aspect);
    gl.uniform2f(this.splatProgram.uniforms.point, x, y);
    gl.uniform3f(this.splatProgram.uniforms.color, vx, vy, 0);
    gl.uniform1f(this.splatProgram.uniforms.radius, radius);
    this.blit(this.velocity.write);
    this.velocity.swap();

    this.dyeSplatProgram.bind();
    gl.uniform1i(this.dyeSplatProgram.uniforms.uTarget, this.dye.read.attach(0));
    gl.uniform1i(this.dyeSplatProgram.uniforms.uObstacles, obstacleUnit);
    gl.uniform1f(this.dyeSplatProgram.uniforms.aspectRatio, aspect);
    gl.uniform2f(this.dyeSplatProgram.uniforms.point, x, y);
    gl.uniform3f(this.dyeSplatProgram.uniforms.color, color[0], color[1], color[2]);
    gl.uniform1f(this.dyeSplatProgram.uniforms.radius, radius);
    gl.uniform1f(this.dyeSplatProgram.uniforms.strength, dyeStrength);
    this.blit(this.dye.write);
    this.dye.swap();
  }

  private correctRadius(radius: number, aspect: number): number {
    return aspect > 1 ? radius * aspect : radius;
  }

  private createProgram(vertexShader: WebGLShader, fragmentSource: string): FluidProgram {
    const gl = this.gl;
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
    if (!fragmentShader) {
      throw new Error('Failed to compile WebGL fragment shader');
    }

    const program = gl.createProgram();
    if (!program) {
      gl.deleteShader(fragmentShader);
      throw new Error('Failed to create WebGL program');
    }

    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.bindAttribLocation(program, 0, 'aPosition');
    gl.linkProgram(program);
    gl.deleteShader(fragmentShader);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      gl.deleteProgram(program);
      throw new Error('Failed to link WebGL program');
    }

    this.allocatedPrograms.push(program);
    const uniforms: Record<string, WebGLUniformLocation | null> = {};
    const uniformCount = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS) as number;
    for (let i = 0; i < uniformCount; i += 1) {
      const info = gl.getActiveUniform(program, i);
      if (info) {
        uniforms[info.name] = gl.getUniformLocation(program, info.name);
      }
    }

    return {
      program,
      uniforms,
      bind: () => gl.useProgram(program),
    };
  }

  private createFBO(
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): FBO {
    const gl = this.gl;
    gl.activeTexture(gl.TEXTURE0);
    const texture = gl.createTexture();
    const fbo = gl.createFramebuffer();
    if (!texture || !fbo) {
      throw new Error('Failed to allocate WebGL FBO');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, width, height, 0, format, type, null);

    gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
    gl.viewport(0, 0, width, height);
    gl.clearColor(0, 0, 0, 0);
    gl.clear(gl.COLOR_BUFFER_BIT);

    return {
      texture,
      fbo,
      width,
      height,
      texelSizeX: 1 / width,
      texelSizeY: 1 / height,
      attach: (unit: number) => {
        gl.activeTexture(gl.TEXTURE0 + unit);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        return unit;
      },
    };
  }

  private createDoubleFBO(
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): DoubleFBO {
    let fbo1 = this.createFBO(width, height, internalFormat, format, type, param);
    let fbo2 = this.createFBO(width, height, internalFormat, format, type, param);
    return {
      width,
      height,
      texelSizeX: fbo1.texelSizeX,
      texelSizeY: fbo1.texelSizeY,
      get read() {
        return fbo1;
      },
      set read(value: FBO) {
        fbo1 = value;
      },
      get write() {
        return fbo2;
      },
      set write(value: FBO) {
        fbo2 = value;
      },
      swap() {
        const temp = fbo1;
        fbo1 = fbo2;
        fbo2 = temp;
      },
    };
  }

  private resizeDoubleFBO(
    target: DoubleFBO,
    width: number,
    height: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): DoubleFBO {
    if (target.width === width && target.height === height) return target;
    const resized = this.createDoubleFBO(width, height, internalFormat, format, type, param);
    this.deleteDoubleFBO(target);
    return resized;
  }

  private deleteFBO(target: FBO): void {
    this.gl.deleteFramebuffer(target.fbo);
    this.gl.deleteTexture(target.texture);
  }

  private deleteDoubleFBO(target: DoubleFBO): void {
    this.deleteFBO(target.read);
    this.deleteFBO(target.write);
  }

  private drawQuad(): void {
    const gl = this.gl;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quadVertexBuffer);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.quadIndexBuffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);
    gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
  }

  private blit(target: FBO | null): void {
    const gl = this.gl;
    if (target === null) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    } else {
      gl.viewport(0, 0, target.width, target.height);
      gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
    }
    this.drawQuad();
  }
}

export function createWebGLFluidEngine(
  canvas: HTMLCanvasElement,
  isDark: boolean,
): WebGLFluidEngine | null {
  return WebGLFluidEngine.create(canvas, isDark);
}
