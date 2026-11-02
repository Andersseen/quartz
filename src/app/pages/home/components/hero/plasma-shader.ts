/**
 * "Quartz plasma": folds of satin light (the skin) with a lens that reveals the same field as
 * contour lines and a grid (the structure underneath). Plain WebGL2, no dependencies.
 *
 * Coordinates: `uv` is centred on the canvas and scaled by its height, so a lens radius of 0.3
 * means 30 % of the hero height on every aspect ratio. `uPointer` uses the same space.
 */
export const PLASMA_VERTEX = /* glsl */ `#version 300 es
in vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const PLASMA_FRAGMENT = /* glsl */ `#version 300 es
precision highp float;

uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uTurn;
uniform float uLens;
uniform float uRadius;

out vec4 outColor;

const vec3 BACKDROP = vec3(0.039, 0.039, 0.047);
const vec3 SILVER = vec3(0.80, 0.82, 0.88);
const vec3 EMERALD = vec3(0.204, 0.827, 0.600);
const vec3 CYAN = vec3(0.404, 0.910, 0.976);
const vec3 VIOLET = vec3(0.655, 0.545, 0.980);

mat2 rotate(float angle) {
  float c = cos(angle);
  float s = sin(angle);
  return mat2(c, -s, s, c);
}

/** Domain-warped folds. Returns the crease phase; \`warped\` is the displaced position. */
float folds(vec2 p, float t, out vec2 warped) {
  for (int i = 1; i < 6; i++) {
    float fi = float(i);
    p += vec2(
      0.62 / fi * sin(fi * p.y * 1.15 + t * 0.32 + 0.4 * fi),
      0.48 / fi * cos(fi * p.x * 0.95 - t * 0.27 + 0.9 * fi)
    );
  }
  warped = p;
  return p.x * 1.35 + p.y * 0.55;
}

float gridLine(float value) {
  float width = fwidth(value);
  return 1.0 - smoothstep(0.0, width * 1.25, abs(fract(value - 0.5) - 0.5));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uResolution) / uResolution.y;
  float t = uTime;

  // The fabric turns towards the pointer and drifts slowly.
  vec2 p = rotate(uTurn) * (uv * 1.65 + vec2(0.0, 0.15)) + uPointer * 0.18;
  vec2 warped;
  float phase = folds(p, t, warped);

  // Satin: wide soft sheen plus thin bright creases where the phase crosses zero.
  float s = sin(phase);
  float sheen = 0.5 + 0.5 * sin(phase * 0.5 + warped.y * 0.6 - t * 0.12);
  float crease = pow(1.0 - abs(s), 9.0);
  float fineCrease = pow(1.0 - abs(sin(phase * 2.6 + warped.y * 0.8)), 16.0) * 0.32;
  float body = pow(sheen, 1.7) * 0.5 + pow(0.5 + 0.5 * s, 3.0) * 0.16;
  float light = body + crease * 0.95 + fineCrease;

  // Quartz iridescence on the highlights only, so the cloth reads as silver.
  float hue = 0.5 + 0.5 * sin(warped.x * 0.55 + warped.y * 0.35 + t * 0.08);
  vec3 tint = mix(mix(EMERALD, CYAN, hue), VIOLET, smoothstep(0.55, 1.0, sheen) * 0.6);
  vec3 skin = SILVER * light + tint * crease * 0.28 + tint * body * 0.12;

  // Fade to the page edges so the hero blends into the sections below.
  float vignette = smoothstep(1.25, 0.25, length(uv * vec2(0.82, 1.0)));
  skin *= mix(0.35, 1.0, vignette);

  // The lens: the same field, unstyled. Contour lines, a pixel grid and a crisp ring.
  float distanceToPointer = length(uv - uPointer);
  float pixel = 1.0 / uResolution.y;
  float inside = (1.0 - smoothstep(uRadius - 6.0 * pixel, uRadius, distanceToPointer)) * uLens;

  float contour = gridLine(phase * 4.0) + gridLine(phase * 0.8) * 0.6;
  float grid = max(gridLine(gl_FragCoord.x / 24.0), gridLine(gl_FragCoord.y / 24.0));
  vec3 structure = BACKDROP + skin * 0.12;
  structure += mix(EMERALD, CYAN, hue) * min(contour, 1.0) * (0.45 + 0.55 * max(crease, sheen));
  structure += vec3(1.0) * grid * 0.045;

  float ring = 1.0 - smoothstep(0.0, 1.6 * pixel, abs(distanceToPointer - uRadius));
  float halo = exp(-pow((distanceToPointer - uRadius) / (uRadius * 0.18), 2.0)) * 0.14;

  vec3 color = mix(BACKDROP + skin, structure, inside);
  color += (EMERALD * halo + vec3(0.85) * ring * 0.55) * uLens;

  outColor = vec4(color, 1.0);
}
`;

/** Where the lens wanders when there is no pointer to follow (touch, idle, keyboard). */
export function idleLensPosition(time: number, aspect: number): [number, number] {
  const spanX = Math.min(0.5 * aspect, 0.62);
  return [spanX * Math.sin(time * 0.3), 0.2 * Math.sin(time * 0.46 + 1.2)];
}

/** Exponential smoothing that is independent of the frame rate. */
export function approach(current: number, target: number, rate: number, dt: number): number {
  return target + (current - target) * Math.exp(-rate * dt);
}

/**
 * One step of a critically damped spring (exact solution, stable for any \`dt\`). Returns the new
 * position and velocity; \`stiffness\` is the angular frequency in rad/s.
 */
export function spring(
  position: number,
  velocity: number,
  target: number,
  stiffness: number,
  dt: number,
): [number, number] {
  const offset = position - target;
  const decay = Math.exp(-stiffness * dt);
  const slope = velocity + stiffness * offset;
  return [target + (offset + slope * dt) * decay, (velocity - stiffness * slope * dt) * decay];
}
