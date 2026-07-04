import {
  Component,
  ChangeDetectionStrategy,
  ElementRef,
  OnDestroy,
  afterNextRender,
  inject,
  input,
} from '@angular/core';
import { defineQuartzBehaviors } from 'quartz-web';
import { DemoPageComponent } from '../../../components/demo-page/demo-page.component';
import { WebAgnosticStateService } from './web-agnostic-state.service';

interface Feature {
  title: string;
  description: string;
}

@Component({
  selector: 'app-web-agnostic-shell',
  imports: [DemoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-demo-page
      [badge]="badge()"
      [title]="title()"
      [description]="description()"
      [features]="features()"
    >
      <ng-content />
    </app-demo-page>
  `,
})
export class WebAgnosticShellComponent implements OnDestroy {
  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly state = inject(WebAgnosticStateService);

  readonly badge = input('Experimental');
  readonly title = input.required<string>();
  readonly description = input.required<string>();
  readonly features = input<Feature[]>([]);

  private cleanup: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      this.cleanup = defineQuartzBehaviors({ root: this.elementRef.nativeElement });

      this.elementRef.nativeElement.addEventListener('qz-splitter-change', (event: Event) => {
        const customEvent = event as CustomEvent;
        const detail = customEvent.detail;
        const container = customEvent.target as HTMLElement;
        if (container.getAttribute('qz-splitter') === 'horizontal') {
          this.state.hPosition.set(detail.position);
        } else {
          this.state.vPosition.set(detail.position);
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.cleanup?.();
    this.cleanup = null;
  }
}
