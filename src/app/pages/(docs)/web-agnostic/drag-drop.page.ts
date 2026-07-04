import { Component, ChangeDetectionStrategy } from '@angular/core';
import { WebAgnosticShellComponent } from './web-agnostic-shell.component';
import { CodeBlockComponent } from '../../../components/code-block/code-block.component';

@Component({
  selector: 'app-web-agnostic-drag-drop-page',
  imports: [WebAgnosticShellComponent, CodeBlockComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <app-web-agnostic-shell
      badge="Interaction"
      title="Drag & Drop"
      description="Native HTML5 drag and drop wired through attributes. Sortable drop zones reorder automatically."
      [features]="[
        { title: 'HTML5 DnD', description: 'Native drag events' },
        { title: 'Sortable', description: 'Auto-reorder on drop' },
        { title: 'Data Transfer', description: 'qz-draggable-data attribute' },
        { title: 'Drop Zones', description: 'Accept filters' },
      ]"
    >
      <div class="flex flex-col gap-12">
        <section class="bg-[#0f0f13] border border-[#1e1e2a] rounded-2xl p-6">
          <h2 class="text-lg font-semibold text-gray-200 mb-2">Sortable Lists</h2>
          <p class="text-sm text-gray-500 mb-6 leading-relaxed">
            Drag items between lists or reorder within the same list.
          </p>

          <app-code-block [code]="dragDropCode">
            <div preview class="hd-demo">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div
                  qz-drop-zone
                  qz-drop-zone-sortable
                  class="border border-dashed border-[#2e2e3a] rounded-xl p-4 min-h-[180px] space-y-3"
                >
                  <div
                    qz-draggable
                    qz-draggable-data="item-a"
                    class="bg-[#1e1e2a] rounded-lg p-4 cursor-grab active:cursor-grabbing"
                  >
                    Item A
                  </div>
                  <div
                    qz-draggable
                    qz-draggable-data="item-b"
                    class="bg-[#1e1e2a] rounded-lg p-4 cursor-grab active:cursor-grabbing"
                  >
                    Item B
                  </div>
                </div>

                <div
                  qz-drop-zone
                  qz-drop-zone-sortable
                  class="border border-dashed border-[#2e2e3a] rounded-xl p-4 min-h-[180px] space-y-3"
                >
                  <div
                    qz-draggable
                    qz-draggable-data="item-c"
                    class="bg-[#1e1e2a] rounded-lg p-4 cursor-grab active:cursor-grabbing"
                  >
                    Item C
                  </div>
                </div>
              </div>
            </div>
          </app-code-block>
        </section>
      </div>
    </app-web-agnostic-shell>
  `,
})
export default class WebAgnosticDragDropPage {
  readonly dragDropCode = `<div qz-drop-zone qz-drop-zone-sortable>
  <div qz-draggable qz-draggable-data="item-a">Item A</div>
  <div qz-draggable qz-draggable-data="item-b">Item B</div>
</div>`;
}
