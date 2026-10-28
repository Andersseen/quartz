import { ChangeDetectionStrategy, Component } from '@angular/core';
import { render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { AutofillDirective } from './autofill.directive';

@Component({
  standalone: true,
  imports: [AutofillDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input qzAutofill aria-label="Email" (autofilledChange)="changes.push($event)" />`,
})
class AutofillHost {
  changes: boolean[] = [];
}

describe('AutofillDirective', () => {
  it('signals supported transitions once and syncs values when autofill omitted input', async () => {
    const { fixture } = await render(AutofillHost);
    const input = screen.getByRole('textbox', { name: 'Email' }) as HTMLInputElement;
    const directive = fixture.debugElement.children[0].injector.get(AutofillDirective);
    let inputEvents = 0;
    input.addEventListener('input', () => inputEvents++);
    input.value = 'person@example.com';

    directive.onAnimationStart({ animationName: 'qz-autofill-start' } as AnimationEvent);
    directive.onAnimationStart({ animationName: 'qz-autofill-start' } as AnimationEvent);
    fixture.detectChanges();
    expect(input).toHaveAttribute('data-autofilled');
    expect(fixture.componentInstance.changes).toEqual([true]);
    expect(inputEvents).toBe(1);

    directive.onAnimationStart({ animationName: 'qz-autofill-cancel' } as AnimationEvent);
    fixture.detectChanges();
    expect(input).not.toHaveAttribute('data-autofilled');
    expect(fixture.componentInstance.changes).toEqual([true, false]);

    input.value = 'typed@example.com';
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fixture.componentInstance.changes).toEqual([true, false]);
  });
});
