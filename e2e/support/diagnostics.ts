import os from 'node:os';
import type { Page, Request, TestInfo } from '@playwright/test';

/**
 * First-failure evidence. Every test observes its page; the record is attached to the test result
 * (and therefore the HTML report and the CI artifact) ONLY when the test fails, so a green run
 * stays quiet and a red run never needs a second pass to find out what the browser saw.
 *
 * Nothing sensitive is recorded: no headers, cookies, request bodies or storage — only URLs
 * (query strings stripped), statuses, console text and page errors of the local preview site.
 */

const LIMIT = 100;

export interface PageDiagnostics {
  console: { type: string; text: string }[];
  pageErrors: string[];
  failedRequests: { method: string; url: string; failure: string }[];
  badResponses: { status: number; url: string }[];
  /** Console errors/warnings and uncaught page errors, in the shape the specs assert on. */
  problems(): string[];
}

const clean = (url: string) => url.replace(/\?.*$/, '').replace(/#.*$/, '');

export function observePage(page: Page): PageDiagnostics {
  const record: PageDiagnostics = {
    console: [],
    pageErrors: [],
    failedRequests: [],
    badResponses: [],
    problems() {
      return [
        ...this.pageErrors.map((text) => `pageerror: ${text}`),
        ...this.console
          .filter((m) => m.type === 'error' || m.type === 'warning')
          .map((m) => `${m.type}: ${m.text}`),
      ];
    },
  };
  const push = <T>(list: T[], item: T) => {
    if (list.length < LIMIT) list.push(item);
  };
  page.on('console', (message) => {
    if (message.type() === 'error' || message.type() === 'warning') {
      push(record.console, { type: message.type(), text: message.text().slice(0, 500) });
    }
  });
  page.on('pageerror', (error) => push(record.pageErrors, String(error.message).slice(0, 500)));
  page.on('requestfailed', (request: Request) =>
    push(record.failedRequests, {
      method: request.method(),
      url: clean(request.url()),
      failure: request.failure()?.errorText ?? 'unknown',
    }),
  );
  page.on('response', (response) => {
    if (response.status() >= 400)
      push(record.badResponses, { status: response.status(), url: clean(response.url()) });
  });
  return record;
}

export async function describeFailure(
  page: Page,
  record: PageDiagnostics,
  testInfo: TestInfo,
  browserVersion: string,
): Promise<string> {
  let navigation: unknown = null;
  let url = 'unavailable';
  try {
    url = clean(page.url());
    navigation = await page.evaluate(() => {
      const entry = performance.getEntriesByType('navigation')[0] as
        | PerformanceNavigationTiming
        | undefined;
      return entry
        ? {
            responseStart: Math.round(entry.responseStart),
            domContentLoaded: Math.round(entry.domContentLoadedEventEnd),
            load: Math.round(entry.loadEventEnd),
            transferSize: entry.transferSize,
          }
        : null;
    });
  } catch {
    // The page/context may already be closed (that is itself a symptom worth keeping).
  }
  return JSON.stringify(
    {
      test: testInfo.titlePath.join(' › '),
      project: testInfo.project.name,
      status: testInfo.status,
      expectedStatus: testInfo.expectedStatus,
      retry: testInfo.retry,
      durationMs: testInfo.duration,
      url,
      navigationTimingMs: navigation,
      environment: {
        browser: `${testInfo.project.name} ${browserVersion}`,
        node: process.version,
        os: `${os.type()} ${os.release()} ${os.arch()}`,
        cpus: os.cpus().length,
        loadAverage: os.loadavg().map((n) => Number(n.toFixed(2))),
        freeMemoryMb: Math.round(os.freemem() / 1048576),
        workerIndex: testInfo.workerIndex,
        parallelIndex: testInfo.parallelIndex,
        workers: testInfo.config.workers,
        retries: testInfo.project.retries,
      },
      console: record.console,
      pageErrors: record.pageErrors,
      failedRequests: record.failedRequests,
      badResponses: record.badResponses,
    },
    null,
    2,
  );
}
