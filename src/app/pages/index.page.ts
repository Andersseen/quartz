import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderComponent } from '../components/header/header.component';
import { HomeHeroComponent } from './home/components/hero/hero.component';
import { HomeFeaturesComponent } from './home/components/features/features.component';
import { HomeCodePreviewComponent } from './home/components/code-preview/code-preview.component';
import { HomeCtaComponent } from './home/components/cta/cta.component';
import { HomeFooterComponent } from './home/components/footer/footer.component';

@Component({
  selector: 'app-home',
  imports: [
    HeaderComponent,
    HomeHeroComponent,
    HomeFeaturesComponent,
    HomeCodePreviewComponent,
    HomeCtaComponent,
    HomeFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="relative min-h-screen overflow-x-hidden">
      <div class="bg-blur-blob -top-[100px] -left-[100px]"></div>
      <div class="bg-blur-blob bg-blur-blob--accent top-[200px] -right-[100px]"></div>

      <app-header />
      <div class="pt-24">
        <app-home-hero />
      </div>
      <app-home-features />
      <app-home-code-preview />
      <app-home-cta />
      <app-home-footer />
    </div>
  `,
})
export default class HomePage {}
