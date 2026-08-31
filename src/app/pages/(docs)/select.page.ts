import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  SelectContentDirective,
  SelectDirective,
  SelectListboxDirective,
  SelectOptionDirective,
  SelectTriggerDirective,
} from '@quartz-headless/primitives';
import { CodeBlockComponent } from '../../components/code-block/code-block.component';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';
import { BASIC_SNIPPET, OBJECT_SNIPPET } from './select.snippets';

interface Country {
  code: string;
  name: string;
}

@Component({
  selector: 'app-select-page',
  imports: [
    SelectDirective,
    SelectTriggerDirective,
    SelectContentDirective,
    SelectListboxDirective,
    SelectOptionDirective,
    DemoPageComponent,
    CodeBlockComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './select.page.html',
})
export default class SelectPage {
  readonly country = signal<string | null>('es');
  readonly rtlCountry = signal<string | null>(null);
  readonly objectCountry = signal<Country | null>({ code: 'fr', name: 'France' });
  readonly countries = signal<Country[]>([
    { code: 'es', name: 'Spain' },
    { code: 'fr', name: 'France' },
    { code: 'de', name: 'Germany' },
  ]);
  readonly basicCode = BASIC_SNIPPET;
  readonly objectCode = OBJECT_SNIPPET;

  readonly displayCountry = (country: Country): string => country.name;
  readonly compareCountry = (a: Country, b: Country): boolean => a.code === b.code;
}
