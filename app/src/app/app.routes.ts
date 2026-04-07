import { Routes } from '@angular/router';

export const routes: Routes = [
  // Root Level Pages (No sidebar)
  { path: '', loadComponent: () => import('./pages/home/home.page') },
  { path: 'docs', loadComponent: () => import('./pages/docs/docs.page') },
  { path: 'components', redirectTo: 'overlay', pathMatch: 'full' },

  // Demos - Con sidebar
  {
    path: '',
    loadComponent: () => import('./components/layout/layout.component'),
    children: [
      { path: 'overlay', loadComponent: () => import('./pages/overlay/overlay.page') },
      { path: 'dialog', loadComponent: () => import('./pages/dialog/dialog.page') },
      { path: 'splitter', loadComponent: () => import('./pages/splitter/splitter.page') },
      { path: 'toast', loadComponent: () => import('./pages/toast/toast.page') },
      { path: 'listbox', loadComponent: () => import('./pages/listbox/listbox.page') },
      { path: 'tooltip', loadComponent: () => import('./pages/tooltip/tooltip.page') },
      { path: 'drag-drop', loadComponent: () => import('./pages/drag-drop/drag-drop.page') },
    ],
  },

  // 404
  { path: '**', redirectTo: '' },
];
