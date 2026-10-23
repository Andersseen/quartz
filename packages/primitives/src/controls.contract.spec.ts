import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { fireEvent, render, screen } from '@testing-library/angular';
import { describe, expect, it } from 'vitest';
import { AccordionDirective } from './accordion/accordion.directive';
import { AccordionItemDirective } from './accordion/accordion-item.directive';
import { AccordionPanelDirective } from './accordion/accordion-panel.directive';
import { AccordionTriggerDirective } from './accordion/accordion-trigger.directive';
import { CheckboxDirective, type CheckboxState } from './checkbox/checkbox.directive';
import { ListboxDirective } from './listbox/listbox.directive';
import { ListboxOptionDirective } from './listbox/listbox-option.directive';
import { RadioGroupDirective } from './radio-group/radio-group.directive';
import { RadioDirective } from './radio-group/radio.directive';
import { SwitchDirective } from './switch/switch.directive';
import { TabListDirective } from './tabs/tab-list.directive';
import { TabPanelDirective } from './tabs/tab-panel.directive';
import { TabDirective } from './tabs/tab.directive';
import { TabsDirective } from './tabs/tabs.directive';

@Component({
  standalone: true,
  imports: [CheckboxDirective, SwitchDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button qzCheckbox [(checked)]="checked" (checkedChangeCommitted)="checkCommits.push($event)">
      Check
    </button>
    <button
      qzSwitch
      [(checked)]="on"
      [disabled]="switchDisabled()"
      (checkedChangeCommitted)="switchCommits.push($event)"
    >
      Switch
    </button>
  `,
})
class BooleanHost {
  readonly checked = signal<CheckboxState>(false);
  readonly on = signal(false);
  readonly switchDisabled = signal(false);
  checkCommits: CheckboxState[] = [];
  switchCommits: boolean[] = [];
}

describe('Checkbox and Switch contract (0.9)', () => {
  it('Checkbox: cycles false → true → false and indeterminate → true, one commit per click', async () => {
    const { fixture } = await render(BooleanHost);
    const host = fixture.componentInstance;
    const box = screen.getByRole('checkbox', { name: 'Check' });

    fireEvent.click(box);
    fireEvent.click(box);
    host.checked.set('indeterminate');
    await fixture.whenStable();
    expect(box).toHaveAttribute('aria-checked', 'mixed');
    fireEvent.click(box);

    expect(host.checkCommits).toEqual([true, false, true]);
    expect(host.checked()).toBe(true);
  });

  it('Checkbox: programmatic writes never commit', async () => {
    const { fixture } = await render(BooleanHost);
    fixture.componentInstance.checked.set(true);
    await fixture.whenStable();
    expect(fixture.componentInstance.checkCommits).toEqual([]);
  });

  it('Switch: exposes switch semantics, toggles once per activation and ignores clicks when disabled', async () => {
    const { fixture } = await render(BooleanHost);
    const host = fixture.componentInstance;
    const toggle = screen.getByRole('switch', { name: 'Switch' });

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-checked', 'true');
    host.switchDisabled.set(true);
    await fixture.whenStable();
    expect(toggle).toBeDisabled();
    fireEvent.click(toggle);

    expect(host.switchCommits).toEqual([true]);
    expect(host.on()).toBe(true);
    fixture.componentInstance.on.set(false);
    await fixture.whenStable();
    expect(host.switchCommits).toEqual([true]);
  });

  it('Checkbox and Switch honour the Forms disabled hook independently of the disabled input', async () => {
    const { fixture } = await render(BooleanHost);
    const box = fixture.debugElement.children[0].injector.get(CheckboxDirective);
    const toggle = fixture.debugElement.children[1].injector.get(SwitchDirective);
    box.setFormDisabled(true);
    toggle.setFormDisabled(true);
    await fixture.whenStable();
    expect(screen.getByRole('checkbox', { name: 'Check' })).toBeDisabled();
    expect(screen.getByRole('switch', { name: 'Switch' })).toBeDisabled();
    box.setFormDisabled(false);
    await fixture.whenStable();
    expect(screen.getByRole('checkbox', { name: 'Check' })).toBeEnabled();
  });
});

@Component({
  standalone: true,
  imports: [RadioGroupDirective, RadioDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div qzRadioGroup [(value)]="value" (valueChangeCommitted)="commits.push($event)">
        <button qzRadio="a">A</button>
        @if (showB()) {
          <button qzRadio="b">B</button>
        }
        <button qzRadio="c">C</button>
      </div>
    }
  `,
})
class RadioHost {
  readonly show = signal(true);
  readonly showB = signal(true);
  readonly value = signal<string | null>('b');
  commits: (string | null)[] = [];
}

describe('RadioGroup contract (0.9)', () => {
  it('keeps the bound value when the whole group is torn down and rebuilt', async () => {
    const { fixture } = await render(RadioHost);
    const host = fixture.componentInstance;
    host.show.set(false);
    await fixture.whenStable();
    expect(host.value()).toBe('b');
    host.show.set(true);
    await fixture.whenStable();
    expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'true');
  });

  it('keeps the value when the checked radio is removed and re-checks it when it returns', async () => {
    const { fixture } = await render(RadioHost);
    const host = fixture.componentInstance;
    host.showB.set(false);
    await fixture.whenStable();
    expect(host.value()).toBe('b');
    expect(screen.getAllByRole('radio').map((r) => r.getAttribute('aria-checked'))).toEqual([
      'false',
      'false',
    ]);
    // With nothing checked, exactly one radio is still a tab stop.
    expect(
      screen.getAllByRole('radio').filter((r) => r.getAttribute('tabindex') === '0'),
    ).toHaveLength(1);
    host.showB.set(true);
    await fixture.whenStable();
    expect(screen.getByRole('radio', { name: 'B' })).toHaveAttribute('aria-checked', 'true');
  });

  it('commits once per user change only', async () => {
    const { fixture } = await render(RadioHost);
    const host = fixture.componentInstance;
    host.value.set('a');
    await fixture.whenStable();
    expect(host.commits).toEqual([]);

    fireEvent.click(screen.getByRole('radio', { name: 'A' }));
    expect(host.commits).toEqual([]);
    fireEvent.click(screen.getByRole('radio', { name: 'C' }));
    screen.getByRole('radio', { name: 'C' }).focus();
    fireEvent.keyDown(screen.getByRole('radio', { name: 'C' }), { key: 'ArrowUp' });
    expect(host.commits).toEqual(['c', 'b']);
  });
});

@Component({
  standalone: true,
  imports: [ListboxDirective, ListboxOptionDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div
      qzListbox
      aria-label="Items"
      [multiple]="multiple()"
      [(value)]="value"
      (valueChangeCommitted)="commits.push($event)"
    >
      <div qzListboxOption="a">A</div>
      <div qzListboxOption="b">B</div>
    </div>
  `,
})
class ListboxHost {
  readonly multiple = signal(false);
  readonly value = signal<string | string[] | null>(null);
  commits: unknown[] = [];
}

describe('Listbox contract (0.9)', () => {
  it('single: commits only when the selection changes; programmatic writes are silent', async () => {
    const { fixture } = await render(ListboxHost);
    const host = fixture.componentInstance;
    host.value.set('a');
    await fixture.whenStable();
    fireEvent.click(screen.getByRole('option', { name: 'A' }));
    fireEvent.click(screen.getByRole('option', { name: 'B' }));
    expect(host.commits).toEqual(['b']);
    expect(host.value()).toBe('b');
  });

  it('multiple: every toggle commits the resulting array', async () => {
    const { fixture } = await render(ListboxHost);
    const host = fixture.componentInstance;
    host.multiple.set(true);
    await fixture.whenStable();
    fireEvent.click(screen.getByRole('option', { name: 'A' }));
    fireEvent.click(screen.getByRole('option', { name: 'B' }));
    fireEvent.click(screen.getByRole('option', { name: 'A' }));
    expect(host.commits).toEqual([['a'], ['a', 'b'], ['b']]);
  });
});

@Component({
  standalone: true,
  imports: [TabsDirective, TabListDirective, TabDirective, TabPanelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div qzTabs [(value)]="value">
        <div qzTabList>
          <button qzTab="one">One</button>
          <button qzTab="two">Two</button>
        </div>
        <section qzTabPanel="one">One panel</section>
        @if (withSecondPanel()) {
          <section qzTabPanel="two">Two panel</section>
        }
      </div>
    }
  `,
})
class TabsTeardownHost {
  readonly show = signal(true);
  readonly withSecondPanel = signal(true);
  readonly value = signal<string | null>('two');
}

describe('Tabs contract (0.9)', () => {
  it('does not rewrite the bound value when the whole widget is torn down', async () => {
    const { fixture } = await render(TabsTeardownHost);
    fixture.componentInstance.show.set(false);
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toBe('two');
  });

  it('omits aria-controls for a tab whose panel is not rendered', async () => {
    const { fixture } = await render(TabsTeardownHost);
    fixture.componentInstance.withSecondPanel.set(false);
    await fixture.whenStable();
    const two = screen.getByRole('tab', { name: 'Two' });
    expect(two).not.toHaveAttribute('aria-controls');
    const one = screen.getByRole('tab', { name: 'One' });
    expect(document.getElementById(one.getAttribute('aria-controls')!)).not.toBeNull();
  });

  it('keeps hidden panels out of the tab order', async () => {
    await render(TabsTeardownHost);
    const hidden = document.querySelector('[qzTabPanel="one"]') as HTMLElement;
    expect(hidden).toHaveAttribute('hidden');
  });
});

@Component({
  standalone: true,
  imports: [
    AccordionDirective,
    AccordionItemDirective,
    AccordionTriggerDirective,
    AccordionPanelDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (show()) {
      <div qzAccordion [(value)]="value" type="multiple">
        @for (item of ['one', 'two']; track item) {
          <div [qzAccordionItem]="item">
            <button qzAccordionTrigger>{{ item }}</button>
            <div qzAccordionPanel>
              <button>inside {{ item }}</button>
            </div>
          </div>
        }
      </div>
    }
  `,
})
class AccordionTeardownHost {
  readonly show = signal(true);
  readonly value = signal<string | string[] | null>(['one', 'two']);
}

describe('Accordion contract (0.9)', () => {
  it('does not rewrite the bound value when the whole widget is torn down', async () => {
    const { fixture } = await render(AccordionTeardownHost);
    fixture.componentInstance.show.set(false);
    await fixture.whenStable();
    expect(fixture.componentInstance.value()).toEqual(['one', 'two']);
  });

  it('keeps controls of collapsed panels out of the tab order and out of the a11y tree', async () => {
    const { fixture } = await render(AccordionTeardownHost);
    fixture.componentInstance.value.set(['one']);
    await fixture.whenStable();
    expect(screen.getByRole('button', { name: 'inside one' })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'inside two' })).toBeNull();
    const trigger = screen.getByRole('button', { name: 'two' });
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    expect(document.getElementById(trigger.getAttribute('aria-controls')!)).toHaveAttribute(
      'hidden',
    );
  });
});
