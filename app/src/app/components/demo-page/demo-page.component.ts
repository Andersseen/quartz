import { Component, ChangeDetectionStrategy, input } from '@angular/core';

interface Feature {
  title: string;
  description: string;
}

@Component({
  selector: 'app-demo-page',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="demo-page">
      <header class="demo-page__header">
        <div class="demo-page__badge">{{ badge() }}</div>
        <h1 class="demo-page__title">{{ title() }}</h1>
        <p class="demo-page__description">{{ description() }}</p>

        @if (features().length > 0) {
          <div class="demo-page__features">
            @for (feature of features(); track feature.title) {
              <div class="demo-page__feature">
                <div class="demo-page__feature-title">{{ feature.title }}</div>
                <div class="demo-page__feature-desc">{{ feature.description }}</div>
              </div>
            }
          </div>
        }
      </header>

      <main class="demo-page__content">
        <ng-content />
      </main>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .demo-page {
        min-height: 100vh;
        padding: 3rem;
      }

      .demo-page__header {
        max-width: 1200px;
        margin: 0 auto 3rem;
      }

      .demo-page__badge {
        display: inline-block;
        font-size: 0.7rem;
        font-weight: 700;
        letter-spacing: 0.12em;
        text-transform: uppercase;
        color: #a78bfa;
        background: #1e1430;
        border: 1px solid #4c1d95;
        border-radius: 4px;
        padding: 0.3rem 0.75rem;
        margin-bottom: 1rem;
      }

      .demo-page__title {
        font-size: 2.5rem;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 1rem;
        letter-spacing: -0.03em;
      }

      .demo-page__description {
        font-size: 1.125rem;
        color: #6b7280;
        margin: 0 0 2rem;
        line-height: 1.6;
        max-width: 600px;
      }

      .demo-page__features {
        display: flex;
        gap: 2rem;
        flex-wrap: wrap;
      }

      .demo-page__feature {
        padding: 1rem 1.25rem;
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 8px;
        min-width: 180px;
      }

      .demo-page__feature-title {
        font-size: 0.875rem;
        font-weight: 600;
        color: #e5e7eb;
        margin-bottom: 0.25rem;
      }

      .demo-page__feature-desc {
        font-size: 0.75rem;
        color: #6b7280;
      }

      .demo-page__content {
        max-width: 1200px;
        margin: 0 auto;
      }
    `,
  ],
})
export class DemoPageComponent {
  badge = input('Component');
  title = input.required<string>();
  description = input.required<string>();
  features = input<Feature[]>([]);
}
