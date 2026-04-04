import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomePage } from './pages/home/home.page';
import { OverlayPage } from './pages/overlay/overlay.page';
import { SplitterPage } from './pages/splitter/splitter.page';
import { ToastPage } from './pages/toast/toast.page';
import { ListboxPage } from './pages/listbox/listbox.page';
import { TooltipPage } from './pages/tooltip/tooltip.page';
import { DragDropPage } from './pages/drag-drop/drag-drop.page';
import { DocsPage } from './pages/docs/docs.page';

export const routes: Routes = [
  // Root Level Pages (No sidebar)
  { path: '', component: HomePage },
  { path: 'docs', component: DocsPage },
  { path: 'components', redirectTo: 'overlay', pathMatch: 'full' },

  // Demos - Con sidebar
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: 'overlay', component: OverlayPage },
      { path: 'splitter', component: SplitterPage },
      { path: 'toast', component: ToastPage },
      { path: 'listbox', component: ListboxPage },
      { path: 'tooltip', component: TooltipPage },
      { path: 'drag-drop', component: DragDropPage },
    ],
  },

  // 404
  { path: '**', redirectTo: '' },
];
