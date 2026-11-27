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
        'release-acceptance',
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

  it('release-acceptance waits for every required job and judges their results itself', () => {
    expect(needs('release-acceptance')).toEqual(
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
    const body = job('release-acceptance');
    expect(body).toContain('NEEDS_JSON: ${{ toJSON(needs) }}');
    expect(body).toContain('--mode pre-approval');
    // Advisory (exit 0) only when the dispatch does not publish.
    expect(body).toMatch(/if \[ "\$PUBLISH" = "true" \]; then set --; else set -- --advisory; fi/);
    expect(body).not.toContain('secrets.');
  });
});

/**
 * 0.24: human authorization comes from the protected `npm-release` environment, never from a
 * tracked file, and it is re-checked inside the publish job before npm is touched.
 */
describe('publication approval gate', () => {
  const publish = job('publish');
  const stepIndex = (text) => publish.indexOf(text);

  it('publish deploys to the protected npm-release environment', () => {
    expect(publish).toMatch(/^    environment:\n      name: npm-release$/m);
    expect(publish).toMatch(/actions: read/);
  });

  it('publish-mode preflight runs before the registry and the publish step, and is required by it', () => {
    const preflight = stepIndex('node scripts/release/preflight.mjs --mode publish');
    expect(preflight).toBeGreaterThan(-1);
    expect(preflight).toBeLessThan(stepIndex('release.mjs plan'));
    expect(preflight).toBeLessThan(stepIndex('node scripts/release/release.mjs publish'));
    expect(publish).toContain('--preflight "$RUNNER_TEMP/release-preflight.json"');
    expect(publish).toContain('--out "$RUNNER_TEMP/release-preflight.json"');
    expect(publish).toContain('--run-id "${{ github.run_id }}"');
    expect(publish).not.toMatch(/--advisory/);
  });

  it('the npm token is exposed only to the publish step', () => {
    const uses = workflow.match(/secrets\.NPM_TOKEN/g) ?? [];
    expect(uses).toHaveLength(1);
    const step = publish.slice(stepIndex('- name: Publish (Core, then Primitives)'));
    expect(step).toContain('NODE_AUTH_TOKEN: ${{ secrets.NPM_TOKEN }}');
  });
});

/**
 * 0.24 regression: the weekly run of 2026-11-23 failed because repository Vitest was executed on the
 * Node 20.19.0 consumer runtime. Repository tooling must stay on the repository Node; the consumer
 * gets its Node explicitly.
 */
describe('consumer matrix toolchain boundary', () => {
  const matrix = job('consumer-matrix');
  const at = (text) => {
    const i = matrix.indexOf(text);
    expect(i, text).toBeGreaterThan(-1);
    return i;
  };

  it('keeps Node 20.19.0, 24 and 22 cells for their fixtures', () => {
    expect(matrix).toContain("- { fixture: angular-21.2-min, node: '20.19.0' }");
    expect(matrix).toContain("- { fixture: angular-21.2, node: '24' }");
    expect(matrix).toContain("- { fixture: angular-22, node: '22' }");
  });

  it('generates fixtures on the repository Node before switching to the consumer Node', () => {
    expect(at('pnpm consumer:fixtures')).toBeLessThan(at('name: Setup Node (consumer toolchain)'));
  });

  it('runs no repository tooling while the consumer Node is active', () => {
    const consumerWindow = matrix.slice(
      at('name: Setup Node (consumer toolchain)'),
      at('name: Setup Node (restore repository toolchain)'),
    );
    expect(consumerWindow).not.toMatch(/\bpnpm\b|vitest|\bvite\b|playwright|scripts\//);
    expect(consumerWindow).toContain('QUARTZ_CONSUMER_NODE=$(command -v node)');
    const restore = matrix.slice(at('name: Setup Node (restore repository toolchain)'));
    expect(restore).toMatch(/node-version: 22\b/);
  });

  it('the harness gets the consumer Node, its expected version and the verified fixtures', () => {
    const harness = matrix.slice(at('pnpm verify:consumer:runtime'));
    expect(at('pnpm verify:consumer:runtime')).toBeGreaterThan(
      at('name: Setup Node (restore repository toolchain)'),
    );
    expect(harness).toContain('--consumer-node "$QUARTZ_CONSUMER_NODE"');
    expect(harness).toContain('--expect-consumer-node ${{ matrix.node }}');
    expect(harness).toContain('--playground-fixtures "$QUARTZ_PLAYGROUND_FIXTURES"');
  });

  it('a failed cell fails the job (no retries, no continue-on-error)', () => {
    expect(matrix).toContain('fail-fast: false');
    expect(matrix).not.toMatch(/continue-on-error|retry/i);
  });
});
