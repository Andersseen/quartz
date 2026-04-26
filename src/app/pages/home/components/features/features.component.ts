import { Component, ChangeDetectionStrategy } from '@angular/core';
import { VoltCard, VoltCardHeader, VoltCardTitle, VoltCardDescription } from '@voltui/components';

@Component({
  selector: 'app-home-features',
  imports: [VoltCard, VoltCardHeader, VoltCardTitle, VoltCardDescription],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss',
})
export class HomeFeaturesComponent {}
