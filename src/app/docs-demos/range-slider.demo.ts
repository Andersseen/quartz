import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  RangeSliderDirective,
  RangeSliderRangeDirective,
  RangeSliderThumbDirective,
  RangeSliderTrackDirective,
  type RangeSliderValue,
} from '@quartz-headless/primitives';

@Component({
  selector: 'app-range-slider-demo',
  imports: [
    RangeSliderDirective,
    RangeSliderTrackDirective,
    RangeSliderRangeDirective,
    RangeSliderThumbDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './range-slider.demo.html',
})
export class RangeSliderDemoComponent {
  readonly low = signal(120);
  readonly high = signal(380);
  readonly vLow = signal(20);
  readonly vHigh = signal(70);
  readonly rLow = signal(25);
  readonly rHigh = signal(75);
  readonly committed = signal<RangeSliderValue | null>(null);
  readonly price = (value: number, thumb: 'low' | 'high') =>
    `${thumb === 'low' ? 'Minimum' : 'Maximum'} price ${value} dollars`;
}
