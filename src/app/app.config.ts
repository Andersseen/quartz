import {
  ApplicationConfig,
  provideZonelessChangeDetection,
  provideBrowserGlobalErrorListeners,
} from '@angular/core';
import { provideFileRouter, withExtraRoutes } from '@analogjs/router';
import { RouteReuseStrategy, type Routes } from '@angular/router';
import { provideVoltTheme } from '@voltui/components';
import { provideMovement } from 'angular-movement';
import { DocsShellReuseStrategy } from './routing/docs-shell-reuse.strategy';

/**
 * Fallback route for /tree when AnalogJS file-based routing doesn't detect
 * new .page.ts files due to Vite cache. The tree route loads the docs layout
 * directly so it gets the sidebar, header, etc. without affecting / (home).
 */
const extraRoutes: Routes = [
  {
    path: 'overlay',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/overlay.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'splitter',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/splitter.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'drag-drop',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/drag-drop.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'directionality',
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/tooltip.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'dialog',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/dialog.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'toast',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/toast.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'listbox',
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
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
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/accordion.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'sidebar',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/sidebar.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'navbar',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/navbar.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'stepper',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/stepper.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'switch',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/switch.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'checkbox',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/checkbox.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'radio-group',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/radio-group.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'toggle',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/toggle.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'toggle-group',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/toggle-group.page').then((m) => m.default),
      },
    ],
  },
  {
    path: 'slider',
    data: { shell: 'docs' },
    loadComponent: () => import('./pages/(docs).page').then((m) => m.default),
    children: [
      {
        path: '',
        loadComponent: () => import('./pages/(docs)/slider.page').then((m) => m.default),
      },
    ],
  },
];

export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),
    provideBrowserGlobalErrorListeners(),
    provideFileRouter(withExtraRoutes(extraRoutes)),
    { provide: RouteReuseStrategy, useClass: DocsShellReuseStrategy },
    provideVoltTheme({ color: 'dusk', style: 'sharp', dark: true }),
    provideMovement({
      duration: 580,
      easing: 'cubic-bezier(0.16, 1, 0.3, 1)',
    }),
  ],
};
