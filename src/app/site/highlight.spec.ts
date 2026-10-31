import { describe, expect, it } from 'vitest';
import { highlightTypeScript } from './highlight';

describe('highlightTypeScript', () => {
  it('escapes markup and never leaks raw angle brackets from the source', () => {
    const html = highlightTypeScript("const a = '<b>';\ntemplate: `<div qzSlider></div>`");
    expect(html).not.toMatch(/<b>|<div/);
    expect(html).toContain('&lt;div');
  });

  it('round-trips to the original text once the spans are stripped', () => {
    const source = "import { x } from '@quartz-headless/primitives';\n// note\nconst n = 4;\n";
    const text = highlightTypeScript(source)
      .replace(/<[^>]+>/g, '')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&');
    expect(text).toBe(source);
  });
});
