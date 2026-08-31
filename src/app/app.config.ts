import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideFileRouter, withExtraRoutes } from '@analogjs/router';
import type { Routes } from '@angular/router';
import { provideVoltTheme } from '@voltui/components';
import { provideMovement } from 'angular-movement';

/**
 * Fallback route for /tree when AnalogJS file-based routing doesn't detect
 * new .page.ts files due to Vite cache. The tree route loads the docs layout
 * directly so it gets the sidebar, header, etc. without affecting / (home).
 */
const extraRoutes: Routes = [
  {
    path: 'directionality',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/directionality.page').then((m) => m.default),
      },
    ],
  },
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
  {
    path: 'tooltip',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/tooltip.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'listbox',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/listbox.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'menu',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/menu.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'popover',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/popover.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'combobox',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/combobox.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'scroll-lock',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/scroll-lock.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'select',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/select.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'tabs',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/tabs.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'accordion',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/accordion.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'switch',
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/switch.page').then((m) => m.default),
      },
    ],
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideFileRouter(withExtraRoutes(extraRoutes)),
    provideVoltTheme({ color: 'dusk', style: 'sharp', dark: true }),
    provideMovement({
      duration: 580,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }),
  ],
};
