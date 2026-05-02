import { Component, ChangeDetectionStrategy } from '@angular/core';
import { VoltCard, VoltCardHeader, VoltCardTitle, VoltCardDescription } from '@voltui/components';

@Component({
  selector: 'app-home-features',
  imports: [VoltCard, VoltCardHeader, VoltCardTitle, VoltCardDescription],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="py-24 px-8 bg-[#0f0f13] border-t border-white/10">
      <div class="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8">
        <volt-card>
          <volt-card-header>
            <div class="text-4xl mb-6 text-center">⚡</div>
            <volt-card-title class="text-center">Headless</volt-card-title>
            <volt-card-description class="text-center"
              >Bring your own CSS or UI framework.</volt-card-description
            >
          </volt-card-header>
        </volt-card>
        <volt-card>
          <volt-card-header>
            <div class="text-4xl mb-6 text-center">♿</div>
            <volt-card-title class="text-center">Accessible</volt-card-title>
            <volt-card-description class="text-center"
              >WAI-ARIA patterns out of the box.</volt-card-description
            >
          </volt-card-header>
        </volt-card>
        <volt-card>
          <volt-card-header>
            <div class="text-4xl mb-6 text-center">🎨</div>
            <volt-card-title class="text-center">Themable</volt-card-title>
            <volt-card-description class="text-center"
              >Infinite styling possibilities.</volt-card-description
            >
          </volt-card-header>
        </volt-card>
      </div>
    </section>
  `,
})
export class HomeFeaturesComponent {}
