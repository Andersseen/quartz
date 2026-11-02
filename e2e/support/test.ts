import { writeFile } from 'node:fs/promises';
import { test as base, expect } from '@playwright/test';
import { describeFailure, observePage, type PageDiagnostics } from './diagnostics';

/**
 * Drop-in replacement for `@playwright/test`'s `test`: identical API, plus an automatic fixture
 * that records what the page saw and attaches `diagnostics.json` to every FAILED (or timed-out)
 * test. Specs import `{ expect, test }` from here.
 */
export const test = base.extend<{ diagnostics: PageDiagnostics }>({
  diagnostics: [
    async ({ page, browser }, use, testInfo) => {
      const record = observePage(page);
      await use(record);
      if (testInfo.status !== testInfo.expectedStatus) {
        // A real file under the test's output directory, so it is uploaded with `test-results/`
        // (an attachment given only a `body` is embedded in the report instead).
        const path = testInfo.outputPath('diagnostics.json');
        await writeFile(path, await describeFailure(page, record, testInfo, browser.version()));
        await testInfo.attach('diagnostics.json', { path, contentType: 'application/json' });
      }
    },
    { auto: true },
  ],
});

export { expect };
export type { Page, Locator, Request, Route } from '@playwright/test';
