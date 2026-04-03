import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  imports: [RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="home">
      <!-- Header -->
      <header class="header">
        <div class="header__inner">
          <a routerLink="/" class="header__logo">
            <span class="header__logo-icon">💎</span>
            <span class="header__logo-text">Quartz UI</span>
          </a>
          <nav class="header__nav">
            <a routerLink="/overlay" class="header__link">Overlay</a>
            <a routerLink="/splitter" class="header__link">Splitter</a>
            <a routerLink="/toast" class="header__link">Toast</a>
            <a routerLink="/drag-drop" class="header__link">Drag & Drop</a>
          </nav>
          <a href="https://github.com" target="_blank" class="header__github">
            <svg height="20" viewBox="0 0 16 16" fill="currentColor">
              <path
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </a>
        </div>
      </header>

      <!-- Hero -->
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
          A collection of unstyled, accessible, and composable Angular components. Build your own
          design system without reinventing the wheel.
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

      <!-- Components Grid -->
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

        <a routerLink="/drag-drop" class="home__card">
          <div class="home__card-icon">🎯</div>
          <h3 class="home__card-title">Drag & Drop</h3>
          <p class="home__card-desc">
            Sortable lists and draggable elements with keyboard support and touch gestures.
          </p>
          <div class="home__card-tags">
            <span class="home__card-tag">Sortable</span>
            <span class="home__card-tag">Touch</span>
            <span class="home__card-tag">Keyboard</span>
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

      <!-- Features -->
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

      <!-- Footer -->
      <footer class="footer">
        <p>Quartz UI — Built with Angular</p>
      </footer>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      .home {
        min-height: 100vh;
        background: #0a0a0c;
      }

      /* Header */
      .header {
        position: sticky;
        top: 0;
        z-index: 100;
        background: rgba(15, 15, 19, 0.8);
        backdrop-filter: blur(12px);
        border-bottom: 1px solid #1e1e2a;
      }

      .header__inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        max-width: 1400px;
        margin: 0 auto;
        padding: 1rem 2rem;
      }

      .header__logo {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        text-decoration: none;
      }

      .header__logo-icon {
        font-size: 1.5rem;
      }

      .header__logo-text {
        font-size: 1.125rem;
        font-weight: 700;
        color: #ffffff;
      }

      .header__nav {
        display: flex;
        align-items: center;
        gap: 2rem;
      }

      .header__link {
        font-size: 0.875rem;
        font-weight: 500;
        color: #9ca3af;
        text-decoration: none;
        transition: color 0.15s;
      }

      .header__link:hover {
        color: #e5e7eb;
      }

      .header__github {
        color: #9ca3af;
        transition: color 0.15s;
      }

      .header__github:hover {
        color: #e5e7eb;
      }

      /* Hero */
      .home__hero {
        text-align: center;
        padding: 5rem 2rem;
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
        0%,
        100% {
          opacity: 1;
        }
        50% {
          opacity: 0.5;
        }
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

      /* Grid */
      .home__grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
        gap: 1.5rem;
        max-width: 1400px;
        margin: 0 auto;
        padding: 0 2rem 5rem;
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

      /* Features */
      .home__features {
        text-align: center;
        padding: 0 2rem 5rem;
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
        max-width: 1200px;
        margin: 0 auto;
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

      /* Footer */
      .footer {
        text-align: center;
        padding: 2rem;
        border-top: 1px solid #1e1e2a;
      }

      .footer p {
        font-size: 0.875rem;
        color: #6b7280;
        margin: 0;
      }
    `,
  ],
})
export class HomePage {}
