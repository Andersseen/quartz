import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormGroup, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { fireEvent, render, screen, waitFor } from '@testing-library/angular';
import {
  CheckboxDirective,
  ListboxDirective,
  ListboxOptionDirective,
  RadioDirective,
  RadioGroupDirective,
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
  SwitchDirective,
} from '@quartz-headless/primitives';
import { describe, expect, it } from 'vitest';
import { QUARTZ_FORMS } from './public-api';

@Component({
  standalone: true,
  imports: [
    ReactiveFormsModule,
    CheckboxDirective,
    SwitchDirective,
    RadioGroupDirective,
    RadioDirective,
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    ListboxDirective,
    ListboxOptionDirective,
    ...QUARTZ_FORMS,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <button qzCheckbox formControlName="terms" aria-label="Terms">Terms</button>
      <button qzSwitch formControlName="notify" aria-label="Notify">Notify</button>
      <div qzRadioGroup formControlName="plan" aria-label="Plan">
        <button qzRadio="free">Free</button>
        <button qzRadio="pro">Pro</button>
        <button qzRadio="team">Team</button>
      </div>
      <div qzSelect formControlName="fruit" #fruit="qzSelect">
        <button qzSelectTrigger aria-label="Fruit">{{ fruit.selectedLabel() || 'Pick' }}</button>
        <ng-template qzSelectContent>
          <div qzSelectListbox>
            <button qzSelectOption="apple">Apple</button>
            <button qzSelectOption="pear">Pear</button>
          </div>
        </ng-template>
      </div>
      <div qzListbox [multiple]="true" formControlName="tags" aria-label="Tags">
        <div qzListboxOption="a">A</div>
        <div qzListboxOption="b">B</div>
        <div qzListboxOption="c">C</div>
      </div>
      <button type="submit">Submit</button>
    </form>
    <span data-testid="outside" tabindex="0">outside</span>
  `,
})
class FormsHost {
  readonly changes = signal(0);
  readonly form = new FormGroup({
    terms: new FormControl<boolean | 'indeterminate' | null>(null),
    notify: new FormControl(true, { nonNullable: true }),
    plan: new FormControl<string | null>('pro'),
    fruit: new FormControl<string | null>('pear'),
    tags: new FormControl<string[] | null>(['b']),
  });

  constructor() {
    this.form.valueChanges.subscribe(() => this.changes.update((n) => n + 1));
  }
}

async function setup() {
  const view = await render(FormsHost);
  return { ...view, host: view.fixture.componentInstance };
}

const checkbox = () => screen.getByRole('checkbox', { name: 'Terms' });
const toggle = () => screen.getByRole('switch', { name: 'Notify' });
const radio = (name: string) => screen.getByRole('radio', { name });
const optionOf = (name: string) => screen.getByRole('option', { name });

describe('Quartz Forms adapters', () => {
  describe('writeValue', () => {
    it('renders initial and programmatic values without marking the control dirty or committing', async () => {
      const { host, fixture } = await setup();
      expect(checkbox()).toHaveAttribute('aria-checked', 'false');
      expect(toggle()).toHaveAttribute('aria-checked', 'true');
      expect(radio('Pro')).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('button', { name: 'Fruit' })).toHaveTextContent('pear');
      expect(optionOf('B')).toHaveAttribute('aria-selected', 'true');

      host.form.patchValue({
        terms: 'indeterminate',
        notify: false,
        plan: 'team',
        fruit: 'apple',
        tags: ['a', 'c'],
      });
      await fixture.whenStable();

      expect(checkbox()).toHaveAttribute('aria-checked', 'mixed');
      expect(toggle()).toHaveAttribute('aria-checked', 'false');
      expect(radio('Team')).toHaveAttribute('aria-checked', 'true');
      expect(radio('Pro')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('button', { name: 'Fruit' })).toHaveTextContent('apple');
      expect(optionOf('A')).toHaveAttribute('aria-selected', 'true');
      expect(optionOf('B')).toHaveAttribute('aria-selected', 'false');
      expect(host.form.dirty).toBe(false);
      expect(host.form.touched).toBe(false);
    });

    it('keeps a select value that has no matching option', async () => {
      const { host, fixture } = await setup();
      host.form.controls.fruit.setValue('kiwi');
      await fixture.whenStable();
      expect(host.form.controls.fruit.value).toBe('kiwi');
      expect(screen.getByRole('button', { name: 'Fruit' })).toHaveTextContent('kiwi');
    });
  });

  describe('user changes', () => {
    it('Checkbox: one onChange per activation; null writes false', async () => {
      const { host } = await setup();
      const before = host.changes();
      fireEvent.click(checkbox());
      expect(host.form.controls.terms.value).toBe(true);
      expect(host.changes() - before).toBe(1);
      expect(host.form.controls.terms.dirty).toBe(true);
      fireEvent.click(checkbox());
      expect(host.form.controls.terms.value).toBe(false);
    });

    it('Switch: one onChange per activation', async () => {
      const { host } = await setup();
      const before = host.changes();
      fireEvent.click(toggle());
      expect(host.form.controls.notify.value).toBe(false);
      expect(host.changes() - before).toBe(1);
    });

    it('RadioGroup: click and arrow keys commit once each; re-selecting the same radio is silent', async () => {
      const { host } = await setup();
      let before = host.changes();
      fireEvent.click(radio('Free'));
      expect(host.form.controls.plan.value).toBe('free');
      expect(host.changes() - before).toBe(1);

      before = host.changes();
      fireEvent.click(radio('Free'));
      expect(host.changes() - before).toBe(0);

      radio('Free').focus();
      before = host.changes();
      fireEvent.keyDown(radio('Free'), { key: 'ArrowDown' });
      expect(host.form.controls.plan.value).toBe('pro');
      expect(host.changes() - before).toBe(1);
    });

    it('Select: committing a different option updates the control once; the same option does not', async () => {
      const { host } = await setup();
      const trigger = screen.getByRole('button', { name: 'Fruit' });
      fireEvent.click(trigger);
      let before = host.changes();
      fireEvent.click(await screen.findByRole('option', { name: 'Apple' }));
      expect(host.form.controls.fruit.value).toBe('apple');
      expect(host.changes() - before).toBe(1);

      fireEvent.click(trigger);
      before = host.changes();
      fireEvent.click(await screen.findByRole('option', { name: 'Apple' }));
      expect(host.form.controls.fruit.value).toBe('apple');
      expect(host.changes() - before).toBe(0);
    });

    it('Listbox (multiple): each toggle commits the new array once', async () => {
      const { host } = await setup();
      const before = host.changes();
      fireEvent.click(optionOf('C'));
      expect(host.form.controls.tags.value).toEqual(['b', 'c']);
      fireEvent.click(optionOf('B'));
      expect(host.form.controls.tags.value).toEqual(['c']);
      expect(host.changes() - before).toBe(2);
    });
  });

  describe('touched', () => {
    it('Checkbox and Switch: touched on blur', async () => {
      const { host } = await setup();
      checkbox().focus();
      expect(host.form.controls.terms.touched).toBe(false);
      checkbox().blur();
      expect(host.form.controls.terms.touched).toBe(true);
      toggle().focus();
      toggle().blur();
      expect(host.form.controls.notify.touched).toBe(true);
    });

    it('RadioGroup: not touched while focus moves between radios, touched when it leaves', async () => {
      const { host } = await setup();
      radio('Pro').focus();
      radio('Team').focus();
      expect(host.form.controls.plan.touched).toBe(false);
      screen.getByTestId('outside').focus();
      expect(host.form.controls.plan.touched).toBe(true);
    });

    it('Select: not touched while the popup holds focus, touched after leaving the control', async () => {
      const { host } = await setup();
      const trigger = screen.getByRole('button', { name: 'Fruit' });
      trigger.focus();
      fireEvent.click(trigger);
      await screen.findByRole('option', { name: 'Apple' });
      expect(host.form.controls.fruit.touched).toBe(false);
      // Escape returns focus to the trigger: still inside the control.
      fireEvent.keyDown(screen.getByRole('listbox', { name: 'Fruit' }), { key: 'Escape' });
      await waitFor(() => expect(screen.queryByRole('listbox', { name: 'Fruit' })).toBeNull());
      expect(host.form.controls.fruit.touched).toBe(false);
      screen.getByTestId('outside').focus();
      expect(host.form.controls.fruit.touched).toBe(true);
    });

    it('Listbox: touched when focus leaves', async () => {
      const { host } = await setup();
      const listbox = screen.getByRole('listbox', { name: 'Tags' });
      listbox.focus();
      expect(host.form.controls.tags.touched).toBe(false);
      screen.getByTestId('outside').focus();
      expect(host.form.controls.tags.touched).toBe(true);
    });
  });

  describe('disabled and reset', () => {
    it('control.disable() blocks interaction on every control and enable() restores it', async () => {
      const { host, fixture } = await setup();
      host.form.disable();
      await fixture.whenStable();

      expect(checkbox()).toBeDisabled();
      expect(toggle()).toBeDisabled();
      expect(radio('Free')).toBeDisabled();
      expect(screen.getByRole('listbox', { name: 'Tags' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
      expect(screen.getByRole('button', { name: 'Fruit' })).toHaveAttribute(
        'aria-disabled',
        'true',
      );

      fireEvent.click(checkbox());
      fireEvent.click(toggle());
      fireEvent.click(radio('Free'));
      fireEvent.click(optionOf('A'));
      fireEvent.click(screen.getByRole('button', { name: 'Fruit' }));
      expect(host.form.getRawValue()).toEqual({
        terms: null,
        notify: true,
        plan: 'pro',
        fruit: 'pear',
        tags: ['b'],
      });
      expect(screen.queryByRole('option', { name: 'Apple' })).toBeNull();

      host.form.enable();
      await fixture.whenStable();
      expect(checkbox()).toBeEnabled();
      fireEvent.click(checkbox());
      expect(host.form.controls.terms.value).toBe(true);
    });

    it('disabling while the select popup is open closes it', async () => {
      const { host, fixture } = await setup();
      fireEvent.click(screen.getByRole('button', { name: 'Fruit' }));
      await screen.findByRole('option', { name: 'Apple' });
      host.form.controls.fruit.disable();
      await fixture.whenStable();
      await waitFor(() => expect(screen.queryByRole('listbox', { name: 'Fruit' })).toBeNull());
    });

    it('reset() writes the documented empty value to each control', async () => {
      const { host, fixture } = await setup();
      fireEvent.click(checkbox());
      fireEvent.click(radio('Free'));
      host.form.reset();
      await fixture.whenStable();

      expect(checkbox()).toHaveAttribute('aria-checked', 'false');
      // `notify` is a non-nullable control: reset() restores its initial value (true).
      expect(toggle()).toHaveAttribute('aria-checked', 'true');
      expect(radio('Free')).toHaveAttribute('aria-checked', 'false');
      expect(radio('Pro')).toHaveAttribute('aria-checked', 'false');
      expect(screen.getByRole('button', { name: 'Fruit' })).toHaveTextContent('Pick');
      expect(optionOf('B')).toHaveAttribute('aria-selected', 'false');
      expect(host.form.dirty).toBe(false);
    });
  });

  describe('template-driven forms', () => {
    @Component({
      standalone: true,
      imports: [FormsModule, SwitchDirective, RadioGroupDirective, RadioDirective, ...QUARTZ_FORMS],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `
        <button qzSwitch [ngModel]="on()" (ngModelChange)="on.set($event)" aria-label="On">
          On
        </button>
        <div qzRadioGroup [ngModel]="plan()" (ngModelChange)="plan.set($event)" aria-label="Plan">
          <button qzRadio="free">Free</button>
          <button qzRadio="pro">Pro</button>
        </div>
      `,
    })
    class NgModelHost {
      readonly on = signal(true);
      readonly plan = signal<string | null>('free');
    }

    it('syncs ngModel in both directions', async () => {
      const { fixture } = await render(NgModelHost);
      await fixture.whenStable();
      const host = fixture.componentInstance;
      expect(screen.getByRole('switch', { name: 'On' })).toHaveAttribute('aria-checked', 'true');
      expect(screen.getByRole('radio', { name: 'Free' })).toHaveAttribute('aria-checked', 'true');

      fireEvent.click(screen.getByRole('switch', { name: 'On' }));
      fireEvent.click(screen.getByRole('radio', { name: 'Pro' }));
      expect(host.on()).toBe(false);
      expect(host.plan()).toBe('pro');

      host.on.set(true);
      await fixture.whenStable();
      expect(screen.getByRole('switch', { name: 'On' })).toHaveAttribute('aria-checked', 'true');
    });
  });
});
