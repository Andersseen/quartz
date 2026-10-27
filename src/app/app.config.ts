import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideContent, withMarkdownRenderer } from '@analogjs/content';
import { provideFileRouter, requestContextInterceptor, withExtraRoutes } from '@analogjs/router';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { defineDoqConfig, doqRoutes, provideDoq } from '@doqs/analog';
import { provideVoltTheme } from '@voltui/components';
import { provideMovement } from 'angular-movement';
import { doqPaths } from '../doq.paths';
import { DOC_DEMOS } from './docs-demos/registry';
import { DOC_PLAYGROUNDS } from './docs-playgrounds/registry';

const doqConfig = defineDoqConfig({
  ...doqPaths,
  demos: DOC_DEMOS,
  playgrounds: DOC_PLAYGROUNDS,
  search: { enabled: true },
  presentation: {
    documentationLabel: 'Quartz Headless docs',
    indexTitle: 'Quartz Headless documentation',
    indexDescription:
      'Unstyled, accessible Angular primitives: you own the styles, Quartz owns the behaviour. Guides, live examples and the API reference for @quartz-headless/core and @quartz-headless/primitives.',
    pageTitleSuffix: 'Quartz Headless',
  },
});

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideFileRouter(
      withExtraRoutes([
        ...doqRoutes(doqConfig),
        // This fixture occasionally misses Analog's file-route scan until the next cold build.
        {
          path: 'e2e-calendar',
          loadComponent: () =>
            import('./pages/e2e-calendar.page').then((module) => module.E2eCalendarPage),
        },
        {
          path: 'e2e-navigation',
          loadComponent: () =>
            import('./pages/e2e-navigation.page').then((module) => module.default),
        },
      ]),
    ),
    provideContent(withMarkdownRenderer()),
    provideDoq(doqConfig),
    provideHttpClient(withInterceptors([requestContextInterceptor])),
    provideClientHydration(withEventReplay()),
    provideVoltTheme({ color: 'dusk', style: 'sharp', dark: true }),
    provideMovement({
      duration: 580,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }),
  ],
};
