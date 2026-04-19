import { Component, ChangeDetectionStrategy, signal } from '@angular/core';

@Component({
  selector: 'app-home-cta',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './cta.component.html',
  styleUrl: './cta.component.scss',
})
export class HomeCtaComponent {
  copied = signal<boolean>(false);

  copyInstallCommand() {
    navigator.clipboard.writeText('npm install quartz-ui');
    this.copied.set(true);
    setTimeout(() => {
      this.copied.set(false);
    }, 2000);
  }
}
