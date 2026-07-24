import { Component, ChangeDetectionStrategy, ViewChild } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, it, expect } from 'vitest';
import { SplitterContainerDirective } from './splitter-container.directive';
import { SplitterPanelDirective } from './splitter-panel.directive';

@Component({
  standalone: true,
  imports: [SplitterContainerDirective, SplitterPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzSplitterContainer [defaultPosition]="40">
      <div qzSplitterPanel>primary</div>
      <div [qzSplitterPanel]="false">secondary</div>
    </div>
  `,
})
class Host {
  @ViewChild(SplitterContainerDirective, { static: true })
  container!: SplitterContainerDirective;
}

describe('SplitterPanelDirective', () => {
  it('sizes primary and secondary panels from the position', async () => {
    const { container } = await render(Host);
    const primary = container.querySelector('.qz-splitter-panel--primary') as HTMLElement;
    const secondary = container.querySelector('.qz-splitter-panel--secondary') as HTMLElement;

    expect(primary.style.width).toBe('40%');
    expect(secondary.style.width).toBe('60%');
  });

  it('reacts to position changes', async () => {
    const { fixture, container } = await render(Host);
    const primary = container.querySelector('.qz-splitter-panel--primary') as HTMLElement;
    const secondary = container.querySelector('.qz-splitter-panel--secondary') as HTMLElement;

    fixture.componentInstance.container.splitterService.setPosition(70);
    fixture.detectChanges();

    expect(primary.style.width).toBe('70%');
    expect(secondary.style.width).toBe('30%');
  });
});
