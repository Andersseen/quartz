import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The optimized pipeline (0.21 / PR #56) skips the deep consumer matrix on ordinary pushes. These
 * checks keep that optimization from ever becoming a way to publish without it: a skipped
 * dependency leaves `publish` skipped, never run.
 */
const workflow = readFileSync(
  resolve(import.meta.dirname, '../../.github/workflows/deploy.yml'),
  'utf8',
);

/** The text of one top-level job (`  name:` at two-space indent) up to the next job. */
const job = (name) => {
  const match = workflow.match(
    new RegExp(`^  ${name}:\\n([\\s\\S]*?)(?=^  [a-z0-9-]+:\\n|(?![\\s\\S]))`, 'm'),
  );
  if (!match) throw new Error(`job ${name} not found`);
  return match[1];
};
const needs = (name) => {
  const block = job(name).match(/^    needs:(.*(?:\n {6}- .+)*)/m);
  return block ? [...block[1].matchAll(/[a-z][a-z0-9-]*/g)].map((m) => m[0]) : [];
};

describe('release workflow gate', () => {
  it('publishes only after every mandatory quality and consumer job', () => {
    expect(needs('publish')).toEqual(
      expect.arrayContaining([
        'quality',
        'package',
        'unit-tests',
        'e2e-tests',
        'consumer-smoke',
        'consumer-matrix',
        'cli-consumer',
      ]),
    );
  });

  it('publish cannot run when a dependency is skipped or failed', () => {
    const condition = job('publish').match(/^    if: (.+)$/m)?.[1] ?? '';
    expect(condition).toContain("github.event_name == 'workflow_dispatch'");
    expect(condition).toContain('inputs.publish == true');
    expect(condition).not.toMatch(/always\(\)|!cancelled\(\)|failure\(\)|skipped/);
  });

  it('the deep consumer jobs run on every manual dispatch, which is the only way to publish', () => {
    for (const name of ['consumer-matrix', 'cli-consumer']) {
      const condition = job(name).match(/^    if: (.+)$/m)?.[1] ?? '';
      expect(condition, name).toContain("github.event_name == 'workflow_dispatch'");
    }
  });

  it('the E2E aggregate fails unless every shard succeeded', () => {
    expect(job('e2e-tests')).toContain('test "$RESULT" = "success"');
  });

  it('the release job is gated like publish', () => {
    expect(needs('release')).toEqual(expect.arrayContaining(['package', 'publish']));
  });
});
