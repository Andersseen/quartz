import { Component, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  type AbstractControl,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  type ValidationErrors,
} from '@angular/forms';
import { delay, map, of } from 'rxjs';
import {
  AccordionDirective,
  AccordionItemDirective,
  AccordionPanelDirective,
  AccordionTriggerDirective,
  AutofillDirective,
  CheckboxDirective,
  FileDropzoneDirective,
  FileUploadDirective,
  FormFieldControlDirective,
  FormFieldDescriptionDirective,
  FormFieldDirective,
  FormFieldErrorDirective,
  FormFieldLabelDirective,
  InputOtpComponent,
  type RejectedFile,
  SidebarContentDirective,
  SidebarDirective,
  SidebarPanelDirective,
  SidebarTriggerDirective,
  SwitchDirective,
} from '@quartz-headless/primitives';
import { QUARTZ_FORMS } from '@quartz-headless/primitives/forms';

/**
 * Async validator: "taken" is rejected after a short delay (exercises pending → invalid → valid).
 * A test may set `globalThis.__qzValidatorDelayMs` to hold the pending state long enough to observe it
 * deterministically (150 ms is shorter than a loaded browser's polling interval).
 */
function uniqueName(control: AbstractControl<string | null>) {
  const ms = (globalThis as { __qzValidatorDelayMs?: number }).__qzValidatorDelayMs ?? 150;
  return of(control.value === 'taken' ? ({ taken: true } as ValidationErrors) : null).pipe(
    delay(ms),
  );
}

@Component({
  selector: 'app-parity-page',
  imports: [
    ReactiveFormsModule,
    AccordionDirective,
    AccordionItemDirective,
    AccordionPanelDirective,
    AccordionTriggerDirective,
    AutofillDirective,
    CheckboxDirective,
    FileDropzoneDirective,
    FileUploadDirective,
    FormFieldControlDirective,
    FormFieldDescriptionDirective,
    FormFieldDirective,
    FormFieldErrorDirective,
    FormFieldLabelDirective,
    InputOtpComponent,
    SidebarContentDirective,
    SidebarDirective,
    SidebarPanelDirective,
    SidebarTriggerDirective,
    SwitchDirective,
    ...QUARTZ_FORMS,
  ],
  template: `
    <h1>Parity evidence</h1>

    <section aria-labelledby="acc-h">
      <h2 id="acc-h">Accordion</h2>
      <div qzAccordion orientation="horizontal" data-testid="acc-h" [value]="'one'">
        <div qzAccordionItem="one">
          <button qzAccordionTrigger>H one</button>
          <div qzAccordionPanel>H panel one</div>
        </div>
        <div qzAccordionItem="two">
          <button qzAccordionTrigger>H two</button>
          <div qzAccordionPanel>H panel two</div>
        </div>
        <div qzAccordionItem="three">
          <button qzAccordionTrigger>H three</button>
          <div qzAccordionPanel>H panel three</div>
        </div>
      </div>
      <div dir="rtl" data-testid="acc-rtl-wrap">
        <div qzAccordion orientation="horizontal" data-testid="acc-rtl" [value]="'one'">
          <div qzAccordionItem="one">
            <button qzAccordionTrigger>R one</button>
            <div qzAccordionPanel>R panel one</div>
          </div>
          <div qzAccordionItem="two">
            <button qzAccordionTrigger>R two</button>
            <div qzAccordionPanel>R panel two</div>
          </div>
        </div>
      </div>
      <div qzAccordion disabled data-testid="acc-disabled" [value]="'one'">
        <div qzAccordionItem="one">
          <button qzAccordionTrigger>D one</button>
          <div qzAccordionPanel>D panel one</div>
        </div>
        <div qzAccordionItem="two">
          <button qzAccordionTrigger>D two</button>
          <div qzAccordionPanel>D panel two</div>
        </div>
      </div>
      <div qzAccordion type="multiple" collapsible data-testid="acc-multi" [value]="[]">
        <div qzAccordionItem="one">
          <button qzAccordionTrigger>M one</button>
          <div qzAccordionPanel><button>Inside one</button></div>
        </div>
        <div qzAccordionItem="two">
          <button qzAccordionTrigger>M two</button>
          <div qzAccordionPanel>M panel two</div>
        </div>
      </div>
      <div qzAccordion collapsible data-testid="acc-dynamic" [value]="'a'">
        @for (item of dynamicItems(); track item) {
          <div [qzAccordionItem]="item">
            <button qzAccordionTrigger>Dyn {{ item }}</button>
            <div qzAccordionPanel>Dyn panel {{ item }}</div>
          </div>
        }
      </div>
      <button type="button" data-testid="acc-remove" (click)="removeFirstDynamic()">
        Remove first dynamic item
      </button>
    </section>

    <section aria-labelledby="sb-h">
      <h2 id="sb-h">Sidebar</h2>
      <div
        qzSidebar
        #sb="qzSidebar"
        [(open)]="sbOpen"
        [(collapsed)]="sbCollapsed"
        data-testid="sb"
        breakpoint="md"
      >
        <aside qzSidebarPanel aria-label="Project navigation" data-testid="sb-panel">
          <a href="#one" aria-label="Item 1">1</a>
          <a href="#two" aria-label="Item 2">2</a>
        </aside>
        <div qzSidebarContent>
          <button qzSidebarTrigger data-testid="sb-trigger">Toggle sidebar</button>
          <button type="button" data-testid="sb-collapse" (click)="sb.collapse()">
            Collapse rail
          </button>
          <button type="button" data-testid="sb-expand" (click)="sb.expand()">Expand</button>
          <button type="button" data-testid="sb-close" (click)="sb.close()">Close</button>
          <p>Content</p>
        </div>
      </div>
    </section>

    <section aria-labelledby="ff-h">
      <h2 id="ff-h">FormField</h2>
      <form [formGroup]="ff" novalidate>
        <div qzFormField id="ff-name" data-testid="ff-name">
          <label qzFormFieldLabel for="ff-name-control">Username</label>
          <p qzFormFieldDescription id="ff-name-hint">Unique, checked asynchronously.</p>
          @if (ff.controls.name.hasError('taken')) {
            <p qzFormFieldError id="ff-name-error" role="alert">That name is taken.</p>
          }
          <input qzFormFieldControl formControlName="name" />
        </div>
        <div qzFormField id="ff-agree" data-testid="ff-agree">
          <span qzFormFieldLabel id="ff-agree-label">Agree to terms</span>
          <p qzFormFieldDescription id="ff-agree-hint">Required.</p>
          @if (ff.controls.agree.touched && !ff.controls.agree.value) {
            <p qzFormFieldError id="ff-agree-error" role="alert">You must agree.</p>
          }
          <button qzCheckbox qzFormFieldControl formControlName="agree" type="button">Agree</button>
        </div>
        <div qzFormField id="ff-news" data-testid="ff-news">
          <span qzFormFieldLabel id="ff-news-label">Newsletter</span>
          <button qzSwitch qzFormFieldControl formControlName="news" type="button">News</button>
        </div>
        <button type="button" data-testid="ff-disable" (click)="toggleDisabled()">
          Toggle disabled
        </button>
        <button
          type="button"
          data-testid="ff-reset"
          (click)="ff.reset({ name: '', agree: false, news: false })"
        >
          Reset
        </button>
      </form>
    </section>

    <section aria-labelledby="otp-h">
      <h2 id="otp-h">InputOTP</h2>
      <qz-input-otp
        class="otp"
        data-testid="otp"
        ariaLabel="Verification code"
        [length]="otpLength()"
        [disabled]="otpDisabled()"
        [(value)]="otpValue"
        (completed)="otpCompleted.set($event)"
      />
      <output data-testid="otp-value">{{ otpValue() }}</output>
      <output data-testid="otp-completed">{{ otpCompleted() }}</output>
      <button type="button" data-testid="otp-len" (click)="otpLength.set(4)">Length 4</button>
      <button type="button" data-testid="otp-dis" (click)="otpDisabled.set(!otpDisabled())">
        Toggle disabled
      </button>
      <button type="button" data-testid="otp-clear" (click)="otpValue.set('')">Clear</button>
      <form [formGroup]="otpForm">
        <qz-input-otp
          class="otp"
          ariaLabel="Forms code"
          [length]="4"
          formControlName="code"
          data-testid="otp-forms"
        />
        <output data-testid="otp-forms-value">{{ otpFormValue() }}</output>
        <button type="button" data-testid="otp-forms-reset" (click)="otpForm.reset({ code: '' })">
          Reset code
        </button>
      </form>
    </section>

    <section aria-labelledby="af-h">
      <h2 id="af-h">Autofill</h2>
      @if (showAutofill()) {
        <label
          >Autofilled field
          <input
            qzAutofill
            type="text"
            class="af"
            data-testid="af"
            (autofilledChange)="autofilled.set($event)"
        /></label>
      }
      <output data-testid="af-state">{{ autofilled() }}</output>
      <button type="button" data-testid="af-toggle" (click)="showAutofill.set(!showAutofill())">
        Toggle field
      </button>
    </section>

    <section aria-labelledby="fu-h">
      <h2 id="fu-h">File upload</h2>
      <div qzFileDropzone data-testid="drop" class="drop">
        <span data-testid="drop-child">drop here</span>
        <input
          #up="qzFileUpload"
          type="file"
          qzFileUpload
          aria-label="Single image or text"
          accept=".txt,image/*"
          (filesChange)="accepted.set($event.map(nameOf))"
          (rejected)="rejected.set($event.map(describe))"
          (cancelled)="cancelled.set(cancelled() + 1)"
        />
        <button type="button" (click)="up.openPicker()">Browse</button>
      </div>
      <div qzFileDropzone data-testid="drop-disabled">
        <input
          type="file"
          qzFileUpload
          aria-label="Disabled upload"
          disabled
          (filesChange)="disabledFiles.set($event.length)"
        />
      </div>
      <input type="file" qzFileUpload directory aria-label="Folder" data-testid="dir" />
      <output data-testid="fu-accepted">{{ accepted().join(',') }}</output>
      <output data-testid="fu-rejected">{{ rejected().join(',') }}</output>
      <output data-testid="fu-cancelled">{{ cancelled() }}</output>
      <output data-testid="fu-disabled">{{ disabledFiles() }}</output>
    </section>
  `,
})
export class ParityPage {
  readonly dynamicItems = signal(['a', 'b', 'c']);
  readonly sbOpen = signal(true);
  readonly sbCollapsed = signal(false);

  readonly ff = new FormGroup({
    name: new FormControl('', { nonNullable: true, asyncValidators: [uniqueName] }),
    agree: new FormControl<boolean | 'indeterminate'>(false, { nonNullable: true }),
    news: new FormControl(false, { nonNullable: true }),
  });

  readonly otpLength = signal(6);
  readonly otpDisabled = signal(false);
  readonly otpValue = signal('');
  readonly otpCompleted = signal('');
  readonly otpForm = new FormGroup({ code: new FormControl('', { nonNullable: true }) });
  readonly otpFormValue = toSignal(this.otpForm.controls.code.valueChanges.pipe(map((v) => v)), {
    initialValue: '',
  });

  readonly showAutofill = signal(true);
  readonly autofilled = signal(false);

  readonly accepted = signal<string[]>([]);
  readonly rejected = signal<string[]>([]);
  readonly cancelled = signal(0);
  readonly disabledFiles = signal(0);
  readonly nameOf = (f: File) => f.name;
  readonly describe = (r: RejectedFile) => `${r.file.name}:${r.reason}`;

  removeFirstDynamic(): void {
    this.dynamicItems.update((items) => items.slice(1));
  }

  toggleDisabled(): void {
    for (const control of Object.values(this.ff.controls)) {
      if (control.disabled) control.enable();
      else control.disable();
    }
  }
}
