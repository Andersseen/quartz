import {
  ChangeDetectionStrategy,
  Component,
  DOCUMENT,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import {
  PLASMA_FRAGMENT,
  PLASMA_VERTEX,
  approach,
  idleLensPosition,
  spring,
} from './plasma-shader';

/** Lens radius in hero heights. */
const LENS_RADIUS = 0.2;
/** Seconds without pointer movement before the lens goes back to wandering. */
const IDLE_AFTER = 3;
/** Upper bound on rendered pixels; larger canvases render at a lower scale. */
const MAX_PIXELS = 1_600_000;
/** Speed of the fabric relative to wall-clock time: slow folds read as silk, fast ones as water. */
const FLOW = 0.55;
/** The frame drawn when motion is reduced (and the first frame before animation starts). */
const STILL_TIME = 14;
/** Frames sampled before deciding the device is too slow to animate, and the budget per frame. */
const PROBE_FRAMES = 24;
const SLOW_FRAME_MS = 45;

/**
 * Decorative WebGL background for the landing hero. Purely presentational (`aria-hidden`), so it
 * never affects the accessibility tree. It does nothing while prerendering, renders a single still
 * frame under `prefers-reduced-motion` or on slow GPUs, pauses off-screen and in hidden tabs, and
 * keeps the CSS backdrop without WebGL2, on software renderers or when the context is lost. The
 * animation loop only updates the canvas; `mode` changes at most a couple of times.
 */
@Component({
  selector: 'app-hero-plasma',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', class: 'hero-plasma', '[attr.data-mode]': 'mode()' },
  template: `<canvas #canvas class="hero-plasma-canvas" [class.is-live]="live()"></canvas>`,
})
export class HeroPlasmaComponent {
  private readonly document = inject(DOCUMENT);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');

  /** True once a frame has been drawn; until then the CSS backdrop shows alone. */
  protected readonly live = signal(false);
  /** How the background renders on this device; exposed as `data-mode` for tests and debugging. */
  protected readonly mode = signal<'pending' | 'animated' | 'still' | 'fallback'>('pending');

  constructor() {
    const destroyRef = inject(DestroyRef);
    afterNextRender(() => {
      const stop = this.start();
      if (stop) destroyRef.onDestroy(stop);
      else this.mode.set('fallback');
    });
  }

  private start(): (() => void) | null {
    const view = this.document.defaultView;
    // Prerender has a window without animation frames or matchMedia.
    if (!view?.requestAnimationFrame || typeof view.matchMedia !== 'function') return null;

    const canvas = this.canvas().nativeElement;
    const gl = canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      powerPreference: 'low-power',
      premultipliedAlpha: false,
    });
    if (!gl) return null;
    // A software rasteriser (SwiftShader, llvmpipe, ...) would spend the whole frame budget on this
    // shader and starve the page, so those devices keep the CSS backdrop and release the context.
    if (isSoftwareRenderer(gl)) {
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return null;
    }
    const program = createProgram(gl);
    if (!program) return null;

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const u = {
      resolution: uniform('uResolution'),
      time: uniform('uTime'),
      pointer: uniform('uPointer'),
      turn: uniform('uTurn'),
      lens: uniform('uLens'),
      radius: uniform('uRadius'),
    };

    const reducedMotion = view.matchMedia('(prefers-reduced-motion: reduce)');
    // Devices that turn out to be too slow while probing the first frames get the still frame.
    let tooSlow = false;
    let probed = 0;
    let probeTime = 0;
    const isStill = () => reducedMotion.matches || tooSlow;
    const finePointer = view.matchMedia('(hover: hover) and (pointer: fine)');
    const section = this.host.nativeElement.parentElement ?? this.host.nativeElement;

    let width = 0;
    let height = 0;
    let frame = 0;
    let visible = true;
    let lost = false;
    let last = 0;
    let clock = STILL_TIME;
    let idleFor = IDLE_AFTER;
    // Pointer target in the shader's uv space, and the smoothed values actually drawn.
    let target: [number, number] | null = null;
    let lensX = 0.36;
    let lensY = 0.06;
    let velocityX = 0;
    let velocityY = 0;
    let turn = 0;
    let lens = 0;

    const draw = () => {
      if (!width || !height || lost) return;
      gl.uniform2f(u.resolution, canvas.width, canvas.height);
      gl.uniform1f(u.time, clock);
      gl.uniform2f(u.pointer, lensX, lensY);
      gl.uniform1f(u.turn, turn);
      gl.uniform1f(u.lens, lens);
      // Narrow screens get a smaller lens so it never covers the whole column of copy.
      gl.uniform1f(u.radius, LENS_RADIUS * Math.min(1, (width / height) * 1.6));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      if (!this.live()) this.live.set(true);
    };

    const step = (now: number) => {
      const dt = last ? Math.min((now - last) / 1000, 0.1) : 0;
      last = now;
      clock += dt * FLOW;
      idleFor += dt;

      const [idleX, idleY] = idleLensPosition(clock, width / height);
      const following = target !== null && idleFor < IDLE_AFTER;
      const [goalX, goalY] = following ? target! : [idleX, idleY];
      // A critically damped spring: the lens glides after the pointer and settles without
      // overshoot, instead of snapping to it.
      const stiffness = following ? 5.5 : 1.4;
      [lensX, velocityX] = spring(lensX, velocityX, goalX, stiffness, dt);
      [lensY, velocityY] = spring(lensY, velocityY, goalY, stiffness, dt);
      // Folds lean towards the lens, like cloth following a hand.
      turn = approach(turn, -lensX * 0.5 + lensY * 0.22, 0.8, dt);
      lens = approach(lens, 1, 2.2, dt);
      draw();
      if (probed < PROBE_FRAMES && dt > 0) {
        probeTime += dt;
        if (++probed === PROBE_FRAMES && (probeTime / PROBE_FRAMES) * 1000 > SLOW_FRAME_MS) {
          tooSlow = true;
          frame = 0;
          still();
          this.mode.set('still');
          return;
        }
      }
      frame = view.requestAnimationFrame(step);
    };

    const running = () => frame !== 0;
    const play = () => {
      if (running() || lost || !visible || this.document.hidden || isStill()) return;
      last = 0;
      frame = view.requestAnimationFrame(step);
    };
    const pause = () => {
      if (frame) view.cancelAnimationFrame(frame);
      frame = 0;
    };
    const still = () => {
      lens = 1;
      turn = -lensX * 0.5 + lensY * 0.22;
      draw();
    };
    const sync = () => {
      pause();
      if (isStill()) still();
      else play();
      this.mode.set(isStill() ? 'still' : 'animated');
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return;
      const dpr = Math.min(view.devicePixelRatio || 1, 1.25);
      const scale = Math.min(dpr, Math.sqrt(MAX_PIXELS / (rect.width * rect.height)));
      width = Math.round(rect.width * scale);
      height = Math.round(rect.height * scale);
      canvas.width = width;
      canvas.height = height;
      gl.viewport(0, 0, width, height);
      draw();
    };

    const onPointerMove = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || !finePointer.matches || isStill()) return;
      const rect = canvas.getBoundingClientRect();
      target = [
        (event.clientX - rect.left - rect.width / 2) / rect.height,
        (rect.height / 2 - (event.clientY - rect.top)) / rect.height,
      ];
      idleFor = 0;
    };
    const onPointerLeave = () => (idleFor = IDLE_AFTER);
    const onLost = (event: Event) => {
      event.preventDefault();
      lost = true;
      pause();
      this.live.set(false);
      this.mode.set('fallback');
    };

    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    const intersectionObserver = new IntersectionObserver(([entry]) => {
      visible = entry?.isIntersecting ?? false;
      if (visible) play();
      else pause();
    });
    intersectionObserver.observe(canvas);
    section.addEventListener('pointermove', onPointerMove, { passive: true });
    section.addEventListener('pointerleave', onPointerLeave);
    canvas.addEventListener('webglcontextlost', onLost);
    this.document.addEventListener('visibilitychange', sync);
    reducedMotion.addEventListener('change', sync);

    resize();
    sync();

    return () => {
      pause();
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      section.removeEventListener('pointermove', onPointerMove);
      section.removeEventListener('pointerleave', onPointerLeave);
      canvas.removeEventListener('webglcontextlost', onLost);
      this.document.removeEventListener('visibilitychange', sync);
      reducedMotion.removeEventListener('change', sync);
      gl.deleteBuffer(buffer);
      gl.deleteProgram(program);
    };
  }
}

function isSoftwareRenderer(gl: WebGL2RenderingContext): boolean {
  // Firefox reports the real renderer here (and warns about the extension); Chromium and WebKit
  // mask it as "WebKit WebGL" and need the extension.
  let renderer = String(gl.getParameter(gl.RENDERER));
  if (/^webkit webgl$/i.test(renderer)) {
    const info = gl.getExtension('WEBGL_debug_renderer_info');
    renderer = info ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL)) : '';
  }
  return /swiftshader|llvmpipe|softpipe|software|microsoft basic render/i.test(renderer);
}

function createProgram(gl: WebGL2RenderingContext): WebGLProgram | null {
  const compile = (type: number, source: string) => {
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;
    gl.deleteShader(shader);
    return null;
  };
  const vertex = compile(gl.VERTEX_SHADER, PLASMA_VERTEX);
  const fragment = compile(gl.FRAGMENT_SHADER, PLASMA_FRAGMENT);
  const program = gl.createProgram();
  if (!vertex || !fragment || !program) return null;
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  return gl.getProgramParameter(program, gl.LINK_STATUS) ? program : null;
}
