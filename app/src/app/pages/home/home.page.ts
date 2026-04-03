import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <div class="home__hero">
        <div class="home__badge">
          <span class="home__badge-dot"></span>
          v0.0.1 Available Now
        </div>
        <h1 class="home__title">
          Quartz UI
          <span class="home__title-highlight">Headless Components</span>
        </h1>
        <p class="home__subtitle">
          A collection of unstyled, accessible, and composable Angular components.
          Build your own design system without reinventing the wheel.
        </p>
        <div class="home__actions">
          <a routerLink="/overlay" class="home__btn home__btn--primary">
            Explore Components
            <span>→</span>
          </a>
          <a href="https://github.com" target="_blank" class="home__btn home__btn--secondary">
            View on GitHub
          </a>
        </div>
      </div>

      <div class="home__grid">
        <a routerLink="/overlay" class="home__card">
          <div class="home__card-icon">◎</div>
          <h3 class="home__card-title">Overlay</h3>
          <p class="home__card-desc">
            Portal-based positioning with auto-flip, click-outside handling, and scroll management.
          </p>
          <div class="home__card-tags">
            <span class="home__card-tag">Dropdown</span>
            <span class="home__card-tag">Popover</span>
            <span class="home__card-tag">Modal</span>
          </div>
        </a>

        <a routerLink="/splitter" class="home__card">
          <div class="home__card-icon">▦</div>
          <h3 class="home__card-title">Splitter</h3>
          <p class="home__card-desc">
            Resizable panels with keyboard navigation, touch support, and flexible constraints.
          </p>
          <div class="home__card-tags">
            <span class="home__card-tag">Horizontal</span>
            <span class="home__card-tag">Vertical</span>
            <span class="home__card-tag">Draggable</span>
          </div>
        </a>

        <a routerLink="/toast" class="home__card">
          <div class="home__card-icon">🔔</div>
          <h3 class="home__card-title">Toast</h3>
          <p class="home__card-desc">
            Notification system with multiple positions, durations, and action support.
          </p>
          <div class="home__card-tags">
            <span class="home__card-tag">6 Positions</span>
            <span class="home__card-tag">Auto-dismiss</span>
            <span class="home__card-tag">Actions</span>
          </div>
        </a>

        <div class="home__card home__card--soon">
          <div class="home__card-badge">Coming Soon</div>
          <div class="home__card-icon">☰</div>
          <h3 class="home__card-title">Listbox</h3>
          <p class="home__card-desc">
            Accessible list selection with single/multiple selection, keyboard navigation.
          </p>
          <div class="home__card-tags">
            <span class="home__card-tag">Single</span>
            <span class="home__card-tag">Multi</span>
            <span class="home__card-tag">Virtual</span>
          </div>
        </div>

        <div class="home__card home__card--soon">
          <div class="home__card-badge">Coming Soon</div>
          <div class="home__card-icon">💬</div>
          <h3 class="home__card-title">Tooltip</h3>
          <p class="home__card-desc">
            Simple and powerful tooltips with hover/focus triggers and smart positioning.
          </p>
          <div class="home__card-tags">
            <span class="home__card-tag">Hover</span>
            <span class="home__card-tag">Focus</span>
            <span class="home__card-tag">Delay</span>
          </div>
        </div>
      </div>

      <div class="home__features">
        <h2 class="home__section-title">Why Quartz UI?</h2>
        <div class="home__features-grid">
          <div class="home__feature">
            <div class="home__feature-icon">⚡</div>
            <h4 class="home__feature-title">Headless & Unstyled</h4>
            <p class="home__feature-desc">
              Full control over styling. Bring your own CSS, Tailwind, or any framework.
            </p>
          </div>
          <div class="home__feature">
            <div class="home__feature-icon">♿</div>
            <h4 class="home__feature-title">Accessible</h4>
            <p class="home__feature-desc">
              Built with WAI-ARIA patterns. Keyboard navigation and screen reader support.
            </p>
          </div>
          <div class="home__feature">
            <div class="home__feature-icon">🎯</div>
            <h4 class="home__feature-title">TypeScript First</h4>
            <p class="home__feature-desc">
              Full type safety with strict TypeScript. IntelliSense support out of the box.
            </p>
          </div>
          <div class="home__feature">
            <div class="home__feature-icon">🎨</div>
            <h4 class="home__feature-title">Composable</h4>
            <p class="home__feature-desc">
              Mix and match primitives. Build complex UI patterns from simple building blocks.
            </p>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .home {
        padding: 4rem;
        max-width: 1400px;
        margin: 0 auto;
      }

      .home__hero {
        text-align: center;
        margin-bottom: 5rem;
      }

      .home__badge {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        font-size: 0.875rem;
        color: #a78bfa;
        background: #1e1430;
        border: 1px solid #4c1d95;
        padding: 0.5rem 1rem;
        border-radius: 9999px;
        margin-bottom: 1.5rem;
      }

      .home__badge-dot {
        width: 8px;
        height: 8px;
        background: #22c55e;
        border-radius: 50%;
        box-shadow: 0 0 10px #22c55e;
        animation: pulse 2s infinite;
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .home__title {
        font-size: 4rem;
        font-weight: 800;
        color: #ffffff;
        margin: 0 0 1rem;
        letter-spacing: -0.03em;
        line-height: 1.1;
      }

      .home__title-highlight {
        display: block;
        background: linear-gradient(135deg, #a78bfa 0%, #7c3aed 100%);
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .home__subtitle {
        font-size: 1.25rem;
        color: #6b7280;
        max-width: 600px;
        margin: 0 auto 2rem;
        line-height: 1.6;
      }

      .home__actions {
        display: flex;
        gap: 1rem;
        justify-content: center;
      }

      .home__btn {
        display: inline-flex;
        align-items: center;
        gap: 0.5rem;
        padding: 0.875rem 1.75rem;
        border-radius: 10px;
        font-size: 0.9375rem;
        font-weight: 600;
        text-decoration: none;
        transition: all 0.2s ease;
      }

      .home__btn--primary {
        background: #7c3aed;
        color: #ffffff;
      }

      .home__btn--primary:hover {
        background: #6d28d9;
        transform: translateY(-1px);
        box-shadow: 0 8px 24px rgba(124, 58, 237, 0.3);
      }

      .home__btn--secondary {
        background: #1e1e2a;
        color: #e5e7eb;
        border: 1px solid #2a2a3a;
      }

      .home__btn--secondary:hover {
        background: #2a2a3a;
        border-color: #3a3a4a;
      }

      .home__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
        margin-bottom: 5rem;
      }

      .home__card {
        display: block;
        padding: 1.75rem;
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 16px;
        text-decoration: none;
        transition: all 0.2s ease;
        position: relative;
        overflow: hidden;
      }

      .home__card:hover:not(.home__card--soon) {
        border-color: #7c3aed;
        transform: translateY(-2px);
        box-shadow: 0 12px 32px rgba(124, 58, 237, 0.15);
      }

      .home__card--soon {
        opacity: 0.6;
        cursor: not-allowed;
      }

      .home__card-badge {
        position: absolute;
        top: 1rem;
        right: 1rem;
        font-size: 0.65rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.05em;
        color: #6b7280;
        background: #1e1e2a;
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
      }

      .home__card-icon {
        font-size: 2rem;
        margin-bottom: 1rem;
      }

      .home__card-title {
        font-size: 1.25rem;
        font-weight: 700;
        color: #ffffff;
        margin: 0 0 0.5rem;
      }

      .home__card-desc {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0 0 1rem;
        line-height: 1.5;
      }

      .home__card-tags {
        display: flex;
        gap: 0.5rem;
        flex-wrap: wrap;
      }

      .home__card-tag {
        font-size: 0.7rem;
        font-weight: 500;
        color: #a78bfa;
        background: #1e1430;
        padding: 0.25rem 0.6rem;
        border-radius: 4px;
      }

      .home__features {
        text-align: center;
      }

      .home__section-title {
        font-size: 1.875rem;
        font-weight: 700;
        color: #ffffff;
        margin-bottom: 2.5rem;
      }

      .home__features-grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
        gap: 1.5rem;
      }

      .home__feature {
        padding: 1.5rem;
        background: #0f0f13;
        border: 1px solid #1e1e2a;
        border-radius: 12px;
      }

      .home__feature-icon {
        font-size: 1.75rem;
        margin-bottom: 0.75rem;
      }

      .home__feature-title {
        font-size: 1rem;
        font-weight: 600;
        color: #e5e7eb;
        margin: 0 0 0.5rem;
      }

      .home__feature-desc {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
        line-height: 1.5;
      }
    `,
  ],
})
export class HomePage {}
