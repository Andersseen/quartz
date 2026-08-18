import { Component, ChangeDetectionStrategy, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import {
  VoltButton,
  VoltCard,
  VoltCardHeader,
  VoltCardTitle,
  VoltCardDescription,
  VoltCardContent,
  VoltCardFooter,
  VoltBadge,
  VoltTabs,
  VoltTabsList,
  VoltTabsTrigger,
} from '@voltui/components';
import { LmnArrowRightIcon, LmnCheckIcon, LmnCopyIcon, LmnTerminalIcon } from 'lumen-icons';
import { CodeBlockComponent } from '../components/code-block/code-block.component';

@Component({
  selector: 'app-docs',
  imports: [
    RouterLink,
    HeaderComponent,
    VoltButton,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltCardFooter,
    VoltBadge,
    VoltTabs,
    VoltTabsList,
    VoltTabsTrigger,
    CodeBlockComponent,
    LmnArrowRightIcon,
    LmnCheckIcon,
    LmnCopyIcon,
    LmnTerminalIcon,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './docs.page.html',
})
export default class DocsPage {
  readonly packageManager = signal<'pnpm' | 'npm' | 'yarn'>('pnpm');
  readonly installCopied = signal(false);

  readonly installCommands = {
    pnpm: 'pnpm add quartz-headless',
    npm: 'npm install quartz-headless',
    yarn: 'yarn add quartz-headless',
  } as const;

  readonly stylesCode = `// Quartz Headless ships without CSS. Use your own design tokens.

:root {
  --qz-primary: #8b5cf6;
  --qz-primary-glow: rgb(139 92 246 / 40%);
}`;

  readonly basicUsageCode = `import { Component } from '@angular/core';
import { OverlayTriggerDirective } from 'quartz-headless';

@Component({
  selector: 'app-menu',
  imports: [OverlayTriggerDirective],
  template: \`<button qzOverlayTrigger=\"menu\">Open menu</button>\`,
})
export class MenuComponent {}`;

  installCommand(): string {
    return this.installCommands[this.packageManager()];
  }

  selectPackageManager(value: string | undefined): void {
    if (value === 'pnpm' || value === 'npm' || value === 'yarn') {
      this.packageManager.set(value);
    }
  }

  async copyInstallCommand(): Promise<void> {
    await navigator.clipboard.writeText(this.installCommand());
    this.installCopied.set(true);
    setTimeout(() => this.installCopied.set(false), 2000);
  }
}
