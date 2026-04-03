import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';

@Component({
  selector: 'app-tooltip-page',
  imports: [DemoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-page
      badge="Overlay"
      title="Tooltip"
      description="Simple and powerful tooltip component with hover and focus triggers. Smart positioning with auto-placement and delay control."
      [features]="[
        { title: 'Hover & Focus', description: 'Multiple triggers' },
        { title: 'Smart Position', description: 'Auto-placement' },
        { title: 'Delay Control', description: 'Show/hide delays' },
        { title: 'Custom Content', description: 'HTML support' },
      ]"
    >
      <div class="coming-soon">
        <div class="coming-soon__icon">🚧</div>
        <h2 class="coming-soon__title">Coming Soon</h2>
        <p class="coming-soon__desc">
          The Tooltip component is currently in development. Check back soon for updates!
        </p>
      </div>
    </app-demo-page>
  `,
  styles: [
    `
      .coming-soon {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 6rem 2rem;
        text-align: center;
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 16px;
      }

      .coming-soon__icon {
        font-size: 4rem;
        margin-bottom: 1.5rem;
      }

      .coming-soon__title {
        font-size: 1.5rem;
        font-weight: 700;
        color: #e5e7eb;
        margin: 0 0 0.75rem;
      }

      .coming-soon__desc {
        font-size: 1rem;
        color: #6b7280;
        max-width: 400px;
        margin: 0;
        line-height: 1.6;
      }
    `,
  ],
})
export class TooltipPage {}
