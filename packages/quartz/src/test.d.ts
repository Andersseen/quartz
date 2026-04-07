import 'vitest';

interface CustomMatchers<R = unknown> {
  toBeInTheDocument(): R;
  toHaveClass(className: string): R;
}

declare const require: {
  context(path: string, deep?: boolean, filter?: RegExp): {
    <T>(id: string): T;
    keys(): string[];
  };
};

declare module 'vitest' {
  interface Assertion<T = unknown> extends CustomMatchers<T> {}
  interface AsymmetricMatchersContaining extends CustomMatchers {}
}
