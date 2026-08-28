export const SERVICE_SNIPPET = `import { Component, inject } from '@angular/core';
import { DirectionalityService } from '@quartz-headless/core';

@Component({
  selector: 'app-example',
  template: \`<p>Current direction: {{ dir.direction() }}</p>\`,
})
export class ExampleComponent {
  readonly dir = inject(DirectionalityService);
}`;

export const KEYBOARD_SNIPPET = `import { inlineStartKey, inlineEndKey, resolveInlineArrowKey } from '@quartz-headless/core';

// ltr: inlineStartKey('ltr') -> 'ArrowLeft', inlineEndKey('ltr') -> 'ArrowRight'
// rtl: inlineStartKey('rtl') -> 'ArrowRight', inlineEndKey('rtl') -> 'ArrowLeft'

function onKeydown(event: KeyboardEvent, direction: Direction) {
  const logical = resolveInlineArrowKey(direction, event.key);
  if (logical === 'inline-end') moveNext();
  if (logical === 'inline-start') movePrevious();
}`;

export const COLLECTION_SNIPPET = `import { CollectionStore } from '@quartz-headless/core';

// direction defaults to 'ltr' — pass 'rtl' to mirror horizontal Arrow keys
const store = new CollectionStore(
  { orientation: 'horizontal', direction: 'rtl' },
  document,
);

// ArrowLeft now moves "next", ArrowRight moves "previous"
host.addEventListener('keydown', (e) => store.handleKeydown(e));`;

export const OVERLAY_SNIPPET = `<!-- placement 'bottom-start' resolves against the anchor's own dir -->
<button qzOverlayTrigger [overlayTemplate]="menu" placement="bottom-start">
  Open
</button>

<!-- ltr: aligns to the anchor's left edge -->
<!-- rtl (e.g. inside <div dir="rtl">): aligns to the anchor's right edge -->`;
