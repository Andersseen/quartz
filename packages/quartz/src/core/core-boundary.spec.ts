import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

/**
 * Architecture rule: Quartz Core must never import from Quartz Headless Primitives.
 * Dependencies flow Core -> Primitives only (see docs/ai/ARCHITECTURE.md). This is also
 * enforced by the `no-restricted-imports` override in eslint.config.js scoped to
 * `packages/quartz/src/core/**`; this spec is a second, independent check that runs
 * under `pnpm test` even if lint is skipped.
 */

const CORE_DIR = path.resolve(__dirname, '.');

function collectTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...collectTsFiles(full));
    } else if (entry.name.endsWith('.ts') && !entry.name.endsWith('.spec.ts')) {
      out.push(full);
    }
  }
  return out;
}

describe('Quartz Core independence', () => {
  it('contains no import referencing primitives/', () => {
    const offenders: string[] = [];
    for (const file of collectTsFiles(CORE_DIR)) {
      const content = fs.readFileSync(file, 'utf8');
      const importLines = content.match(/^import[^\n]*from\s+['"][^'"]*['"];?/gm) ?? [];
      for (const line of importLines) {
        if (/primitives/.test(line)) {
          offenders.push(`${path.relative(CORE_DIR, file)}: ${line.trim()}`);
        }
      }
    }
    expect(offenders).toEqual([]);
  });
});
