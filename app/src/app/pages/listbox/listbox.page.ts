import { Component, ChangeDetectionStrategy } from '@angular/core';
import { DemoPageComponent } from '../../components/demo-page/demo-page.component';

@Component({
  selector: 'app-listbox-page',
  imports: [DemoPageComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './listbox.page.html',
  styleUrl: './listbox.page.scss',
})
export class ListboxPage {}
