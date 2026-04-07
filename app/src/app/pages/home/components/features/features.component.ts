import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home-features',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './features.component.html',
  styleUrl: './features.component.scss',
})
export class HomeFeaturesComponent {}
