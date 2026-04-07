import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './footer.component.html',
  styleUrl: './footer.component.scss',
})
export class HomeFooterComponent {}
