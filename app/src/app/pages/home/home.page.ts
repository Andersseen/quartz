import { Component, ChangeDetectionStrategy } from '@angular/core';
import { HeaderComponent } from '../../components/header/header.component';
import { HomeHeroComponent } from './components/hero/hero.component';
import { HomeFeaturesComponent } from './components/features/features.component';
import { HomeCodePreviewComponent } from './components/code-preview/code-preview.component';
import { HomeCtaComponent } from './components/cta/cta.component';
import { HomeFooterComponent } from './components/footer/footer.component';

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
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export default class HomePage {}
