import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { InputOtpComponent } from './input-otp.component';

@Component({
  standalone: true,
  imports: [InputOtpComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <qz-input-otp
      [length]="length()"
      [(value)]="value"
      [disabled]="disabled()"
      (valueChangeCommitted)="commits.push($event)"
      (completed)="completions.push($event)"
    />
  `,
})
class OtpHost {
  readonly length = signal(6);
  readonly value = signal('');
  readonly disabled = signal(false);
  commits: string[] = [];
  completions: string[] = [];
}

describe('InputOtpComponent', () => {
  it('filters typing and paste, exposes slot values, and completes once per completed value', async () => {
    const { fixture } = await render(OtpHost);
    const input = screen.getByRole('textbox', { name: 'One-time code' }) as HTMLInputElement;
    expect(input).toHaveAttribute('autocomplete', 'one-time-code');
    fireEvent.input(input, { target: { value: '12x3456' } });
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('123456');
    expect(fixture.componentInstance.commits).toEqual(['123456']);
    expect(fixture.componentInstance.completions).toEqual(['123456']);
    expect(document.querySelectorAll('[data-filled]')).toHaveLength(6);

    fireEvent.input(input, { target: { value: '123456' } });
    expect(fixture.componentInstance.completions).toEqual(['123456']);
    fireEvent.input(input, { target: { value: '12345' } });
    fireEvent.input(input, { target: { value: '123456' } });
    expect(fixture.componentInstance.completions).toEqual(['123456', '123456']);
  });

  it('defers filtering during IME composition and respects disabled and external writes', async () => {
    const { fixture } = await render(OtpHost);
    const host = fixture.componentInstance;
    const input = screen.getByRole('textbox', { name: 'One-time code' }) as HTMLInputElement;
    input.dispatchEvent(new CompositionEvent('compositionstart', { bubbles: true }));
    fireEvent.input(input, { target: { value: '１２' } });
    expect(host.value()).toBe('');
    input.dispatchEvent(new CompositionEvent('compositionend', { bubbles: true }));
    await fixture.whenStable();
    expect(host.value()).toBe('');

    host.value.set('654321');
    await fixture.whenStable();
    expect(input.value).toBe('654321');
    expect(host.commits).toEqual([]);
    host.length.set(4);
    await fixture.whenStable();
    expect(host.value()).toBe('6543');
    expect(input.value).toBe('6543');
    expect(document.querySelectorAll('[data-index]')).toHaveLength(4);
    host.disabled.set(true);
    await fixture.whenStable();
    expect(input).toBeDisabled();
  });

  it('filters pasted text and replaces at the current selection with one model update', async () => {
    const { fixture } = await render(OtpHost);
    const input = screen.getByRole('textbox', { name: 'One-time code' }) as HTMLInputElement;
    fireEvent.input(input, { target: { value: '12' } });
    input.setSelectionRange(1, 1);
    const event = new Event('paste', { bubbles: true, cancelable: true }) as ClipboardEvent;
    Object.defineProperty(event, 'clipboardData', { value: { getData: () => 'x34' } });
    input.dispatchEvent(event);
    await fixture.whenStable();
    expect(event.defaultPrevented).toBe(true);
    expect(fixture.componentInstance.value()).toBe('1342');
    expect(fixture.componentInstance.commits).toEqual(['12', '1342']);
  });
});
