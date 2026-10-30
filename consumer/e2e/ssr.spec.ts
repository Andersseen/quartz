import { expect, test } from '@playwright/test';

/** Raw server output: no browser, no hydration. Exercises sequential and concurrent requests. */

const routes = ['/forms', '/overlays', '/navigation', '/parity', '/controls'];

const idsOf = (html: string) => [...html.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]);
const strip = (html: string) => html.replace(/ng-server-context="[^"]*"/, '');

test.describe('SSR output', () => {
  for (const route of routes) {
    test(`${route} renders real content with no browser-only artefacts`, async ({ request }) => {
      const html = await (await request.get(route)).text();
      expect(html).toContain('ng-server-context');
      expect(html).toContain('<h1');
      expect(html).not.toContain('qz-dialog');
      expect(html).not.toContain('data-qz-dialog-backdrop');
      expect(html).not.toMatch(/NG0\d+/);
      const ids = idsOf(html);
      expect(ids.length, 'ids present').toBeGreaterThan(0);
      expect(new Set(ids).size, 'no duplicate ids').toBe(ids.length);
    });

    test(`${route} is deterministic across sequential requests (no cross-request state)`, async ({
      request,
    }) => {
      const first = strip(await (await request.get(route)).text());
      for (let i = 0; i < 4; i++) {
        const next = strip(await (await request.get(route)).text());
        expect(next, `request ${i + 2} differs from request 1`).toBe(first);
      }
    });

    test(`${route} is identical under concurrent requests`, async ({ request }) => {
      const bodies = await Promise.all(
        Array.from({ length: 8 }, async () => strip(await (await request.get(route)).text())),
      );
      for (const body of bodies) expect(body).toBe(bodies[0]);
    });
  }

  test('server renders form control state and ARIA wiring', async ({ request }) => {
    const html = await (await request.get('/forms')).text();
    expect(html).toContain('id="email-field-control"');
    expect(html).toMatch(/aria-describedby="email-field-hint[^"]*"/);
    expect(html).toContain('type="email"');
    expect(html).toMatch(/data-qz-state="unchecked"|aria-checked="false"/);
  });
});
