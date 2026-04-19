import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';

@Component({
  selector: 'app-tooltip-page',
  imports: [DemoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './tooltip.page.html',
  styleUrl: './tooltip.page.scss',
})
export default class TooltipPage {}
