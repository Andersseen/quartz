import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const GUIDE = 'src/content/docs/guides/recipes.md';
// Tokenise so reflowed attributes compare equal; fixture-only `data-testid` attributes are ignored.
const tokens = (s) =>
  s
    .replace(/data-testid="[^"]*"/g, ' ')
    .replace(/([<>])/g, ' $1 ')
    .split(/\s+/)
    .filter(Boolean);

// Every code block that follows a `verified-by` marker must exist in the compiled consumer fixture.
const text = readFileSync(join(ROOT, GUIDE), 'utf8');
const blocks = [...text.matchAll(/<!-- verified-by: (\S+) -->\s*```(\w+)\n([\s\S]*?)```/g)].map(
  ([, file, lang, code]) => ({ file, lang, code }),
);

describe('recipes are backed by compiled consumer fixtures', () => {
  it('has verified blocks', () => expect(blocks.length).toBeGreaterThanOrEqual(9));
  for (const [i, { file, code }] of blocks.entries()) {
    it(`block ${i + 1} appears in ${file}`, () => {
      const source = tokens(readFileSync(join(ROOT, file), 'utf8'));
      // The guide may omit fixture lines but every token must occur, in order: it can never invent API.
      let at = 0;
      const missing = [];
      for (const token of tokens(code)) {
        const found = source.indexOf(token, at);
        if (found === -1) missing.push(token);
        else at = found + 1;
      }
      expect(missing).toEqual([]);
    });
  }
});
