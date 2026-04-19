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
  templateUrl: './index.page.html',
  styleUrl: './index.page.scss',
})
export default class HomePage {}
