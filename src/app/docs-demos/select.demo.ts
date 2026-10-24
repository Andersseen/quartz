import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
} from '@quartz-headless/primitives';

interface Country {
  code: string;
  name: string;
}

@Component({
  selector: 'app-select-demo',
  imports: [
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.demo.html',
})
export class SelectDemoComponent {
  readonly country = signal<string | null>('es');
  readonly rtlCountry = signal<string | null>(null);
  readonly objectCountry = signal<Country | null>({ code: 'fr', name: 'France' });
  readonly countries = signal<Country[]>([
    { code: 'es', name: 'Spain' },
    { code: 'fr', name: 'France' },
    { code: 'de', name: 'Germany' },
  ]);
  readonly displayCountry = (country: Country): string => country.name;
  readonly compareCountry = (a: Country, b: Country): boolean => a.code === b.code;
}
