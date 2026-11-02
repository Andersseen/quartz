import { ChangeDetectionStrategy, Component, DestroyRef, inject } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { SkipLinkComponent } from '../components/skip-link/skip-link.component';
import { PageSeoService } from '../site/page-seo';
import { HomeHeroComponent } from './home/components/hero/hero.component';
import { HomePlaygroundComponent } from './home/components/playground/playground.component';
import { HomePrimitiveWallComponent } from './home/components/primitive-wall/primitive-wall.component';
import { HomeComposeComponent } from './home/components/compose/compose.component';
import { HomePackagesComponent } from './home/components/packages/packages.component';
import { HomeUseCasesComponent } from './home/components/use-cases/use-cases.component';
import { HomeDxComponent } from './home/components/dx/dx.component';
import { HomeInstallComponent } from './home/components/install/install.component';
import { HomeCtaComponent } from './home/components/cta/cta.component';
import { HomeFooterComponent } from './home/components/footer/footer.component';

@Component({
  selector: 'app-home',
  imports: [
    SkipLinkComponent,
    HeaderComponent,
    HomeHeroComponent,
    HomePlaygroundComponent,
    HomeComposeComponent,
    HomePackagesComponent,
    HomePrimitiveWallComponent,
    HomeUseCasesComponent,
    HomeDxComponent,
    HomeInstallComponent,
    HomeCtaComponent,
    HomeFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-x-clip">
      <div class="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
        <div
          class="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.035)_1px,transparent_1px)] bg-[size:44px_44px] [mask-image:linear-gradient(to_bottom,black,transparent_70%)]"
        ></div>
      </div>

      <app-skip-link />
      <app-header />

      <main id="main-content" tabindex="-1" class="outline-none">
        <app-home-hero />
        <app-home-playground />
        <app-home-compose />
        <app-home-packages />
        <app-home-primitive-wall />
        <app-home-use-cases />
        <app-home-dx />
        <app-home-install />
        <app-home-cta />
      </main>

      <app-home-footer />
    </div>
  `,
})
export default class HomePage {
  constructor() {
    inject(PageSeoService).claim(inject(DestroyRef), {
      title: 'Quartz Headless: unstyled, accessible Angular primitives',
      description:
        'Quartz Headless gives Angular design systems accessible, unstyled primitives: dialogs, menus, selects, sliders, date pickers and more. Signals-first, zoneless, SSR-safe. Two npm packages plus a copy-source CLI.',
      path: '/',
    });
  }
}
