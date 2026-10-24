import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SliderDirective,
  SliderRangeDirective,
  SliderThumbDirective,
  SliderTrackDirective,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-slider-demo',
  imports: [SliderDirective, SliderTrackDirective, SliderRangeDirective, SliderThumbDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slider.demo.html',
})
export class SliderDemoComponent {
  readonly volume = signal(50);
  readonly decimal = signal(0.3);
  readonly vertical = signal(40);
  readonly rtl = signal(25);
  readonly disabled = signal(60);
  readonly valueText = (value: number) => `${value} percent`;
}
