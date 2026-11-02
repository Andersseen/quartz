import { approach, idleLensPosition, spring } from './plasma-shader';

describe('plasma motion helpers', () => {
  it('spring settles on the target without overshooting, at any frame rate', () => {
    for (const dt of [1 / 144, 1 / 60, 1 / 30, 0.1]) {
      let position = 0;
      let velocity = 0;
      let max = 0;
      for (let t = 0; t < 4; t += dt) {
        [position, velocity] = spring(position, velocity, 1, 5.5, dt);
        max = Math.max(max, position);
      }
      expect(max).toBeLessThanOrEqual(1 + 1e-9);
      expect(position).toBeCloseTo(1, 3);
    }
  });

  it('approach is frame-rate independent', () => {
    let fine = 0;
    for (let i = 0; i < 60; i++) fine = approach(fine, 1, 2, 1 / 60);
    expect(approach(0, 1, 2, 1)).toBeCloseTo(fine, 10);
  });

  it('the idle lens stays inside the hero on narrow and wide screens', () => {
    for (const aspect of [0.5, 1, 2.5]) {
      for (let t = 0; t < 60; t += 0.5) {
        const [x, y] = idleLensPosition(t, aspect);
        expect(Math.abs(x)).toBeLessThanOrEqual(aspect / 2);
        expect(Math.abs(y)).toBeLessThanOrEqual(0.5);
      }
    }
  });
});
