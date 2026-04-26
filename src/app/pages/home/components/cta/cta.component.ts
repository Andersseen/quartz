import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { VoltButton, VoltCard, VoltCardContent, VoltCardFooter } from '@voltui/components';

@Component({
  selector: 'app-home-cta',
  imports: [VoltButton, VoltCard, VoltCardContent, VoltCardFooter],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss',
})
export class HomeCtaComponent {
  copied = signal<boolean>(false);

  copyInstallCommand() {
    navigator.clipboard.writeText('npm install quartz-headless');
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }
}
