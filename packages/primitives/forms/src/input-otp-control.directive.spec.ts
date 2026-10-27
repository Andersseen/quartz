import { ChangeDetectionStrategy, Component } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { InputOtpComponent } from '@quartz-headless/primitives';
import { InputOtpControlDirective } from './input-otp-control.directive';

@Component({
  standalone: true,
  imports: [ReactiveFormsModule, InputOtpComponent, InputOtpControlDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<qz-input-otp [formControl]="code" (completed)="completions.push($event)" />`,
})
class OtpFormsHost {
  readonly code = new FormControl('', { nonNullable: true });
  completions: string[] = [];
}

describe('InputOtpControlDirective', () => {
  it('writes silently, commits user input once, touches on focus exit, and resets', async () => {
    const { fixture } = await render(OtpFormsHost);
    const host = fixture.componentInstance;
    const input = screen.getByRole('textbox', { name: 'One-time code' }) as HTMLInputElement;
    host.code.setValue('123');
    await fixture.whenStable();
    expect(input.value).toBe('123');
    expect(host.code.dirty).toBe(false);

    fireEvent.input(input, { target: { value: '1234' } });
    await fixture.whenStable();
    expect(host.code.value).toBe('1234');
    expect(host.code.dirty).toBe(true);

    fireEvent.focusOut(input, { relatedTarget: document.body });
    expect(host.code.touched).toBe(true);
    host.code.reset();
    await fixture.whenStable();
    expect(input.value).toBe('');
    expect(host.code.dirty).toBe(false);

    host.code.setValue('123456');
    await fixture.whenStable();
    expect(host.completions).toEqual([]);
    fireEvent.input(input, { target: { value: '123456' } });
    expect(host.completions).toEqual(['123456']);
    host.code.reset();
    await fixture.whenStable();
    fireEvent.input(input, { target: { value: '123456' } });
    expect(host.completions).toEqual(['123456', '123456']);
  });
});
