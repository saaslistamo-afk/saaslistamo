import { useEffect, useRef } from "react";
import "./Scanner.css";

// Port em WebGL2 puro do componente "Scanner" do React Bits — sem a
// dependência `ogl` (que é só uma casca fina sobre a API nativa de WebGL;
// o efeito inteiro vive no shader abaixo, mantido idêntico ao original).

const hexToRgb = (hex) => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return [1, 1, 1];
  return [parseInt(result[1], 16) / 255, parseInt(result[2], 16) / 255, parseInt(result[3], 16) / 255];
};

const directionToFloat = (dir) => (dir === "horizontal" ? 1.0 : dir === "diagonal" ? 2.0 : 0.0);

const VERTEX_SRC = `#version 300 es
in vec2 position;
void main() {
  gl_Position = vec4(position, 0.0, 1.0);
}
`;

const FRAGMENT_SRC = `#version 300 es
precision highp float;
uniform vec2 iResolution;
uniform float iTime;
uniform float uSpeed;
uniform float uSweepSpeed;
uniform float uSweepWidth;
uniform float uSweepFalloff;
uniform float uScale;
uniform float uFrequency;
uniform float uRipple;
uniform float uBandDensity;
uniform float uLineSharpness;
uniform float uGlow;
uniform float uColorSpread;
uniform float uBrightness;
uniform float uContrast;
uniform float uSoftness;
uniform float uVignette;
uniform float uOpacity;
uniform float uScanline;
uniform float uGrain;
uniform float uGrainIntensity;
uniform float uDirection;
uniform vec2 uMouse;
uniform float uMouseEnabled;
uniform float uMouseRadius;
uniform float uMouseStrength;
uniform float uMouseActive;
uniform vec3 uColor1;
uniform vec3 uColor2;
uniform vec3 uColor3;
out vec4 fragColor;

const float TAU = 6.2831853;

float signalField(vec2 p, float t) {
  float w = sin(p.x * 1.3 + t * 0.7);
  w += sin(p.y * 1.7 - t * 0.52) * 0.8;
  w += sin((p.x + p.y) * 0.9 + t * 0.91) * 0.6;
  w += sin((p.x - p.y) * 1.53 - t * 0.63) * 0.42;
  return w * 0.35;
}

vec3 palette(float f) {
  f = clamp(f, 0.0, 1.0);
  f = pow(f, uContrast);
  vec3 c = mix(uColor1, uColor2, smoothstep(0.08, 0.6, f));
  return mix(c, uColor3, smoothstep(0.68, 1.0, f));
}

float scanBand(float x, float aa, float sharp) {
  float v = mix(0.5, 0.5 + 0.5 * cos(x * TAU), aa);
  return pow(v, sharp);
}

void main() {
  float aspect = iResolution.x / iResolution.y;
  vec2 uv0 = (gl_FragCoord.xy * 2.0 - iResolution.xy) / iResolution.y;
  vec2 p = uv0 / max(uScale, 0.001);

  float t = iTime * uSpeed;

  float mouseBoost = 0.0;
  if (uMouseEnabled > 0.5) {
    vec2 mUv = vec2((uMouse.x * 2.0 - 1.0) * aspect, uMouse.y * 2.0 - 1.0);
    vec2 md = uv0 - mUv;
    float r = max(uMouseRadius, 0.001);
    mouseBoost = exp(-dot(md, md) / (r * r)) * uMouseStrength * uMouseActive;
  }

  float axis;
  if (uDirection < 0.5) axis = p.y;
  else if (uDirection < 1.5) axis = p.x;
  else axis = (p.x + p.y) * 0.70710678;

  float sig = signalField(p * uFrequency, t);
  float coord = axis + sig * uRipple;

  float phase = coord / max(uSweepWidth, 0.05) - t * uSweepSpeed;
  float sweep = pow(0.5 + 0.5 * cos(phase * TAU), max(uSweepFalloff, 0.1));

  float lc = coord * uBandDensity;
  float aa = 1.0 / (1.0 + uSoftness * fwidth(lc) * 3.0);
  aa = clamp(aa * (1.0 + mouseBoost * 0.6), 0.0, 1.0);

  float bodyBase = clamp(0.5 + 0.5 * sig, 0.0, 1.0);
  float body = bodyBase * bodyBase * uGlow * sweep;

  float sharp = max(uLineSharpness, 0.1);
  float split = uColorSpread * 0.16;
  float fr = clamp(scanBand(lc + split, aa, sharp) * sweep + body, 0.0, 1.0);
  float fg = clamp(scanBand(lc, aa, sharp) * sweep + body, 0.0, 1.0);
  float fb = clamp(scanBand(lc - split, aa, sharp) * sweep + body, 0.0, 1.0);

  vec3 col = vec3(palette(fr).r, palette(fg).g, palette(fb).b);

  float inten = (fr + fg + fb) * 0.3333333 * uBrightness;
  inten *= 1.0 + mouseBoost * 0.9;

  if (uScanline > 0.5) {
    inten *= 1.0 - 0.18 * (0.5 + 0.5 * cos(gl_FragCoord.y * 1.7));
  }

  if (uGrain > 0.5) {
    float g = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233)) + iTime) * 43758.5453);
    inten += (g - 0.5) * uGrainIntensity;
  }

  inten *= clamp(1.0 - uVignette * smoothstep(0.55, 1.65, length(uv0)), 0.0, 1.0);
  inten = clamp(inten, 0.0, 1.0);

  float a = clamp(inten * uOpacity, 0.0, 1.0);
  fragColor = vec4(clamp(col, 0.0, 1.0) * a, a);
}
`;

function compileShader(gl, type, source) {
  const shader = gl.createShader(type);
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const info = gl.getShaderInfoLog(shader);
    gl.deleteShader(shader);
    throw new Error(`Falha ao compilar shader: ${info}`);
  }
  return shader;
}

function createProgram(gl, vertexSrc, fragmentSrc) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSrc);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSrc);
  const program = gl.createProgram();
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    const info = gl.getProgramInfoLog(program);
    gl.deleteProgram(program);
    throw new Error(`Falha ao linkar programa: ${info}`);
  }
  return program;
}

const UNIFORM_NAMES = [
  "iTime", "iResolution", "uSpeed", "uSweepSpeed", "uSweepWidth", "uSweepFalloff",
  "uScale", "uFrequency", "uRipple", "uBandDensity", "uLineSharpness", "uGlow",
  "uColorSpread", "uBrightness", "uContrast", "uSoftness", "uVignette", "uOpacity",
  "uScanline", "uGrain", "uGrainIntensity", "uDirection", "uMouse", "uMouseEnabled",
  "uMouseRadius", "uMouseStrength", "uMouseActive", "uColor1", "uColor2", "uColor3",
];

// Ponte entre o efeito de setup (roda 1x) e o efeito de props (roda a cada
// mudança) — mesma função do WeakMap `ctxMap` do componente original.
const ctxMap = new WeakMap();

export default function Scanner({
  color1 = "#5227FF",
  color2 = "#FF9FFC",
  color3 = "#FFFFFF",
  speed = 0.5,
  sweepSpeed = 0.25,
  sweepWidth = 1.6,
  sweepFalloff = 6,
  scale = 1.5,
  frequency = 2,
  ripple = 0.22,
  bandDensity = 11,
  lineSharpness = 5.5,
  glow = 0.22,
  scanDirection = "vertical",
  colorSpread = 0.7,
  brightness = 1.0,
  contrast = 1.15,
  softness = 1.4,
  vignette = 0.45,
  scanline = true,
  grain = true,
  grainIntensity = 0.05,
  opacity = 1.0,
  mouseInteraction = true,
  mouseRadius = 0.5,
  mouseStrength = 0.5,
  className = "",
}) {
  const containerRef = useRef(null);
  const mouseEnabledRef = useRef(mouseInteraction);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const canvas = document.createElement("canvas");
    canvas.style.width = "100%";
    canvas.style.height = "100%";
    canvas.style.display = "block";
    container.appendChild(canvas);

    const gl = canvas.getContext("webgl2", { alpha: true, premultipliedAlpha: true, antialias: false });
    if (!gl) return; // sem suporte a WebGL2 — não quebra a página, só não mostra o efeito

    gl.clearColor(0, 0, 0, 0);

    const program = createProgram(gl, VERTEX_SRC, FRAGMENT_SRC);
    const uniforms = {};
    for (const name of UNIFORM_NAMES) uniforms[name] = gl.getUniformLocation(program, name);

    const positionLoc = gl.getAttribLocation(program, "position");
    const vao = gl.createVertexArray();
    gl.bindVertexArray(vao);
    const positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    // Triângulo único cobrindo a tela inteira — evita a costura diagonal de um quad de 2 triângulos.
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(positionLoc);
    gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
    gl.bindVertexArray(null);

    const state = {
      iTime: 0, iResolution: [1, 1],
      uSpeed: 0.5, uSweepSpeed: 0.25, uSweepWidth: 1.6, uSweepFalloff: 6,
      uScale: 1.5, uFrequency: 2, uRipple: 0.22, uBandDensity: 11,
      uLineSharpness: 5.5, uGlow: 0.22, uColorSpread: 0.7, uBrightness: 1.0,
      uContrast: 1.15, uSoftness: 1.4, uVignette: 0.45, uOpacity: 1.0,
      uScanline: 1.0, uGrain: 1.0, uGrainIntensity: 0.05, uDirection: 0.0,
      uMouse: [0.5, 0.5], uMouseEnabled: 1.0, uMouseRadius: 0.5, uMouseStrength: 0.5,
      uMouseActive: 0.0,
      uColor1: [1, 1, 1], uColor2: [1, 1, 1], uColor3: [1, 1, 1],
    };
    ctxMap.set(container, { state });

    function applyUniforms() {
      gl.useProgram(program);
      gl.uniform1f(uniforms.iTime, state.iTime);
      gl.uniform2f(uniforms.iResolution, state.iResolution[0], state.iResolution[1]);
      gl.uniform1f(uniforms.uSpeed, state.uSpeed);
      gl.uniform1f(uniforms.uSweepSpeed, state.uSweepSpeed);
      gl.uniform1f(uniforms.uSweepWidth, state.uSweepWidth);
      gl.uniform1f(uniforms.uSweepFalloff, state.uSweepFalloff);
      gl.uniform1f(uniforms.uScale, state.uScale);
      gl.uniform1f(uniforms.uFrequency, state.uFrequency);
      gl.uniform1f(uniforms.uRipple, state.uRipple);
      gl.uniform1f(uniforms.uBandDensity, state.uBandDensity);
      gl.uniform1f(uniforms.uLineSharpness, state.uLineSharpness);
      gl.uniform1f(uniforms.uGlow, state.uGlow);
      gl.uniform1f(uniforms.uColorSpread, state.uColorSpread);
      gl.uniform1f(uniforms.uBrightness, state.uBrightness);
      gl.uniform1f(uniforms.uContrast, state.uContrast);
      gl.uniform1f(uniforms.uSoftness, state.uSoftness);
      gl.uniform1f(uniforms.uVignette, state.uVignette);
      gl.uniform1f(uniforms.uOpacity, state.uOpacity);
      gl.uniform1f(uniforms.uScanline, state.uScanline);
      gl.uniform1f(uniforms.uGrain, state.uGrain);
      gl.uniform1f(uniforms.uGrainIntensity, state.uGrainIntensity);
      gl.uniform1f(uniforms.uDirection, state.uDirection);
      gl.uniform2f(uniforms.uMouse, state.uMouse[0], state.uMouse[1]);
      gl.uniform1f(uniforms.uMouseEnabled, state.uMouseEnabled);
      gl.uniform1f(uniforms.uMouseRadius, state.uMouseRadius);
      gl.uniform1f(uniforms.uMouseStrength, state.uMouseStrength);
      gl.uniform1f(uniforms.uMouseActive, state.uMouseActive);
      gl.uniform3f(uniforms.uColor1, state.uColor1[0], state.uColor1[1], state.uColor1[2]);
      gl.uniform3f(uniforms.uColor2, state.uColor2[0], state.uColor2[1], state.uColor2[2]);
      gl.uniform3f(uniforms.uColor3, state.uColor3[0], state.uColor3[1], state.uColor3[2]);
    }

    function renderFrame() {
      applyUniforms();
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.bindVertexArray(vao);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      gl.bindVertexArray(null);
    }

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const setSize = () => {
      const rect = container.getBoundingClientRect();
      const w = Math.max(1, Math.floor(rect.width * dpr));
      const h = Math.max(1, Math.floor(rect.height * dpr));
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
      state.iResolution = [w, h];
      renderFrame();
    };

    const ro = new ResizeObserver(setSize);
    ro.observe(container);
    setSize();

    let currentMouse = [0.5, 0.5];
    let targetMouse = [0.5, 0.5];
    let mouseActive = 0;
    let targetMouseActive = 0;

    const onMouseMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      targetMouse = [(e.clientX - rect.left) / rect.width, 1.0 - (e.clientY - rect.top) / rect.height];
      targetMouseActive = 1;
    };
    const onMouseLeave = () => { targetMouseActive = 0; };
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("mouseleave", onMouseLeave);

    let raf = 0;
    let isVisible = true;
    let isPageVisible = !document.hidden;
    const t0 = performance.now();

    const loop = (t) => {
      state.iTime = (t - t0) * 0.001;

      if (!mouseEnabledRef.current) targetMouseActive = 0;
      currentMouse[0] += 0.05 * (targetMouse[0] - currentMouse[0]);
      currentMouse[1] += 0.05 * (targetMouse[1] - currentMouse[1]);
      state.uMouse = [currentMouse[0], currentMouse[1]];
      mouseActive += 0.05 * (targetMouseActive - mouseActive);
      state.uMouseActive = mouseActive;

      renderFrame();
      raf = requestAnimationFrame(loop);
    };

    const tryStart = () => { if (isVisible && isPageVisible && raf === 0) raf = requestAnimationFrame(loop); };
    const tryStop = () => { if (raf !== 0) { cancelAnimationFrame(raf); raf = 0; } };

    const io = new IntersectionObserver(([entry]) => {
      isVisible = entry.isIntersecting;
      if (isVisible) tryStart(); else tryStop();
    }, { threshold: 0 });
    io.observe(container);

    const onVisibility = () => {
      isPageVisible = !document.hidden;
      if (isPageVisible) tryStart(); else tryStop();
    };
    document.addEventListener("visibilitychange", onVisibility);

    tryStart();

    return () => {
      tryStop();
      ro.disconnect();
      io.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("mouseleave", onMouseLeave);
      ctxMap.delete(container);
      gl.deleteVertexArray(vao);
      gl.deleteBuffer(positionBuffer);
      gl.deleteProgram(program);
      try { container.removeChild(canvas); } catch {}
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const ctx = ctxMap.get(container);
    if (!ctx) return;
    const { state } = ctx;

    state.uSpeed = speed;
    state.uSweepSpeed = sweepSpeed;
    state.uSweepWidth = sweepWidth;
    state.uSweepFalloff = sweepFalloff;
    state.uScale = scale;
    state.uFrequency = frequency;
    state.uRipple = ripple;
    state.uBandDensity = bandDensity;
    state.uLineSharpness = lineSharpness;
    state.uGlow = glow;
    state.uColorSpread = colorSpread;
    state.uBrightness = brightness;
    state.uContrast = contrast;
    state.uSoftness = softness;
    state.uVignette = vignette;
    state.uOpacity = opacity;
    state.uScanline = scanline ? 1.0 : 0.0;
    state.uGrain = grain ? 1.0 : 0.0;
    state.uGrainIntensity = grainIntensity;
    state.uDirection = directionToFloat(scanDirection);
    state.uMouseEnabled = mouseInteraction ? 1.0 : 0.0;
    state.uMouseRadius = mouseRadius;
    state.uMouseStrength = mouseStrength;
    state.uColor1 = hexToRgb(color1);
    state.uColor2 = hexToRgb(color2);
    state.uColor3 = hexToRgb(color3);

    mouseEnabledRef.current = mouseInteraction;
  }, [
    speed, sweepSpeed, sweepWidth, sweepFalloff, scale, frequency, ripple,
    bandDensity, lineSharpness, glow, colorSpread, brightness, contrast,
    softness, vignette, opacity, scanline, grain, grainIntensity,
    scanDirection, mouseInteraction, mouseRadius, mouseStrength,
    color1, color2, color3,
  ]);

  return <div ref={containerRef} className={`scanner-container ${className}`.trim()} />;
}
