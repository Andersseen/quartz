import { Component, ChangeDetectionStrategy, ViewChild, signal } from '@angular/core';
import { render } from '@testing-library/angular';
import { describe, it, expect } from 'vitest';
import { SplitterContainerDirective } from './splitter-container.directive';
import { SplitterOrientation } from './splitter.types';

@Component({
  standalone: true,
  imports: [SplitterContainerDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div qzSplitterContainer [orientation]="orientation()" [defaultPosition]="30">content</div>
  `,
})
class Host {
  readonly orientation = signal<SplitterOrientation>('horizontal');

  @ViewChild(SplitterContainerDirective, { static: true })
  dir!: SplitterContainerDirective;
}

describe('SplitterContainerDirective', () => {
  it('applies flex layout and orientation classes', async () => {
    const { container } = await render(Host);
    const el = container.querySelector('[qzSplitterContainer]') as HTMLElement;

    expect(el).toHaveClass('qz-splitter-container');
    expect(el).toHaveClass('qz-splitter-container--horizontal');
    expect(el.style.display).toBe('flex');
    expect(el.style.flexDirection).toBe('row');
  });

  it('seeds the service position from defaultPosition', async () => {
    const { fixture } = await render(Host);
    expect(fixture.componentInstance.dir.splitterService.position()).toBe(30);
  });

  it('reflects orientation changes in the host layout', async () => {
    const { fixture, container } = await render(Host);
    const el = container.querySelector('[qzSplitterContainer]') as HTMLElement;
    expect(el).toHaveClass('qz-splitter-container--horizontal');

    fixture.componentInstance.orientation.set('vertical');
    fixture.detectChanges();

    expect(el).toHaveClass('qz-splitter-container--vertical');
    expect(el).not.toHaveClass('qz-splitter-container--horizontal');
    expect(el.style.flexDirection).toBe('column');
  });
});
