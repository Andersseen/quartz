import { Routes } from '@angular/router';
import { LayoutComponent } from './components/layout/layout.component';
import { HomePage } from './pages/home/home.page';
import { OverlayPage } from './pages/overlay/overlay.page';
import { SplitterPage } from './pages/splitter/splitter.page';
import { ToastPage } from './pages/toast/toast.page';
import { ListboxPage } from './pages/listbox/listbox.page';
import { TooltipPage } from './pages/tooltip/tooltip.page';

export const routes: Routes = [
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomePage },
      { path: 'overlay', component: OverlayPage },
      { path: 'splitter', component: SplitterPage },
      { path: 'toast', component: ToastPage },
      { path: 'listbox', component: ListboxPage },
      { path: 'tooltip', component: TooltipPage },
      { path: '**', redirectTo: '' },
    ],
  },
];
