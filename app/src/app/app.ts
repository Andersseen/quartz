import { Component, ChangeDetectionStrategy } from '@angular/core';
import { SplitterDemoComponent } from './demos/splitter-demo.component';
import { ToastDemoComponent } from './demos/toast-demo.component';

@Component({
  selector: 'app-root',
  imports: [SplitterDemoComponent, ToastDemoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="app-container">
      <header>
        <h1>Quartz UI - Headless Components Demo</h1>
      </header>
      
      <main>
        <app-splitter-demo />
        <app-toast-demo />
      </main>
    </div>
  `,
  styles: [`
    .app-container {
      min-height: 100vh;
      background: #f5f5f5;
    }
    
    header {
      background: #1976d2;
      color: white;
      padding: 20px;
      text-align: center;
    }
    
    header h1 {
      margin: 0;
      font-size: 28px;
    }
    
    main {
      padding: 20px;
    }
  `]
})
export class App {}