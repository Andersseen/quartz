import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideFileRouter, withExtraRoutes } from '@analogjs/router';
import type { Routes } from '@angular/router';

/**
 * Fallback route for /tree when AnalogJS file-based routing doesn't detect
 * new .page.ts files due to Vite cache. The tree route loads the docs layout
 * directly so it gets the sidebar, header, etc. without affecting / (home).
 */
const extraRoutes: Routes = [
  {
    path: 'tree',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/tree.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'virtual-scroll',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/virtual-scroll.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'viewport',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/viewport.page').then((m) => m.default),
      },
    ],
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideFileRouter(withExtraRoutes(extraRoutes)),
  ],
};
