import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SliderDirective,
  SliderRangeDirective,
  SliderThumbDirective,
  SliderTrackDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET } from './slider.snippets';

@Component({
  selector: 'app-slider-page',
  imports: [
    SliderDirective,
    SliderTrackDirective,
    SliderRangeDirective,
    SliderThumbDirective,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './slider.page.html',
})
export default class SliderPage {
  readonly volume = signal(50);
  readonly decimal = signal(0.3);
  readonly vertical = signal(40);
  readonly rtl = signal(25);
  readonly disabled = signal(60);
  readonly code = BASIC_SNIPPET;
  readonly valueText = (value: number) => `${value} percent`;
}
