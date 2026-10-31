import type { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'forms' },
  { path: 'forms', loadComponent: () => import('./pages/forms.page').then((m) => m.FormsPage) },
  {
    path: 'overlays',
    loadComponent: () => import('./pages/overlays.page').then((m) => m.OverlaysPage),
  },
  {
    path: 'controls',
    loadComponent: () => import('./pages/controls.page').then((m) => m.ControlsPage),
  },
  {
    path: 'autofill',
    loadComponent: () => import('./pages/autofill.page').then((m) => m.AutofillPage),
  },
  { path: 'parity', loadComponent: () => import('./pages/parity.page').then((m) => m.ParityPage) },
  {
    path: 'navigation',
    loadComponent: () => import('./pages/navigation.page').then((m) => m.NavigationPage),
  },
];
