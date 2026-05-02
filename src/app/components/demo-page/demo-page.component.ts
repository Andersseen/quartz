import { Component, ChangeDetectionStrategy, input } from '@angular/core';

interface Feature {
  title: string;
  description: string;
}

@Component({
  selector: 'app-demo-page',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './demo-page.component.html',
})
export class DemoPageComponent {
  badge = input('Component');
  title = input.required<string>();
  description = input.required<string>();
  features = input<Feature[]>([]);
}
