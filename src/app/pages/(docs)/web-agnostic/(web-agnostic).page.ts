import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WebAgnosticShellComponent } from './web-agnostic-shell.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-web-agnostic-index-page',
  imports: [WebAgnosticShellComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-web-agnostic-shell
      badge="Experimental"
      title="Web Agnostic"
      description="Quartz primitives exposed as standard HTML attributes. Import defineQuartzBehaviors() once and any element with qz-* attributes gets wired up automatically."
      [features]="[
        { title: 'Framework Agnostic', description: 'Plain DOM + events' },
        { title: 'Attribute-driven', description: 'Just like directives' },
        { title: 'Custom Events', description: 'qz-splitter-change, qz-drop, etc.' },
        { title: 'Same Behavior', description: 'Shared semantics with Angular lib' },
      ]"
    >
      <div class="flex flex-col gap-12">
        <section class="bg-[#0f0f13] border border-[#1e1e2a] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-gray-200 mb-2">Setup</h2>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            One function scans the container and attaches every behavior.
          </p>
          <app-code-block [code]="setupCode"></app-code-block>
        </section>
      </div>
    </app-web-agnostic-shell>
  `,
})
export default class WebAgnosticIndexPage {
  readonly setupCode = `import { defineQuartzBehaviors } from 'quartz-web';

const cleanup = defineQuartzBehaviors();

// later
cleanup();`;
}
