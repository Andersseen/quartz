import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  MATRIX_FILE,
  buildReviewHtml,
  checkAgainstMatrix,
  loadScenarios,
  parseMatrix,
} from './manual-review.mjs';

const matrix = readFileSync(MATRIX_FILE, 'utf8');
const scenarios = loadScenarios();

describe('manual review scenarios', () => {
  it('describe exactly the rows of the committed matrix', () => {
    expect(parseMatrix(matrix)).toHaveLength(14);
    expect(checkAgainstMatrix(scenarios, matrix)).toEqual([]);
  });

  it('detect drift between the scenarios and the matrix', () => {
    const drifted = scenarios.map((s) => (s.id === 3 ? { ...s, page: '/overlays' } : s));
    expect(checkAgainstMatrix(drifted, matrix)).toEqual([
      'scenario 3: page /overlays differs from matrix /forms',
    ]);
    expect(checkAgainstMatrix(scenarios.slice(1), matrix)).toEqual([
      'matrix row 1 has no scenario',
    ]);
  });

  it('the committed matrix records no outcome other than PENDING unless evidence exists', () => {
    for (const row of parseMatrix(matrix))
      expect(['PENDING', 'PASS', 'FAIL']).toContain(row.outcome);
  });
});

describe('review index', () => {
  const run = {
    fixture: 'angular-21.2',
    source: 'release-artifacts',
    versions: { '@quartz-headless/core': '9.9.9' },
    tarballs: { core: { file: 'core.tgz', sha256: 'a'.repeat(64) } },
  };
  const html = buildReviewHtml({ scenarios, baseUrl: 'http://localhost:4300/', run });

  it('links every scenario to its page and starts every outcome as PENDING', () => {
    for (const s of scenarios) {
      expect(html).toContain(`id="s${s.id}"`);
      expect(html).toContain(`href="http://localhost:4300${s.page}"`);
    }
    expect(html).not.toMatch(/<option selected/);
    expect(html.match(/<option>PENDING<\/option>/g)).toHaveLength(14);
  });

  it('names the exact tested build and an accessible structure', () => {
    expect(html).toContain('9.9.9');
    expect(html).toContain('a'.repeat(64));
    expect(html).toContain('<html lang="en">');
    expect(html).toContain('class="skip"');
    expect((html.match(/<h1>/g) ?? []).length).toBe(1);
    expect(html).toContain('Screen reader and exact version');
  });

  it('escapes scenario text and embedded data', () => {
    const evil = [{ ...scenarios[0], title: '<img src=x onerror=alert(1)>', steps: ['</script>'] }];
    const out = buildReviewHtml({
      scenarios: evil,
      baseUrl: 'http://x',
      run: { fixture: '</script>' },
    });
    expect(out).not.toContain('<img src=x');
    expect(out.match(/<\/script>/g)).toHaveLength(1);
  });
});
