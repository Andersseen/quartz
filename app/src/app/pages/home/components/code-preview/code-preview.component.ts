import { Component, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-home-code-preview',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './code-preview.component.html',
  styleUrl: './code-preview.component.scss',
})
export class HomeCodePreviewComponent {}
