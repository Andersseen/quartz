import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-docs',
  imports: [RouterLink, HeaderComponent],
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './docs.page.html',
  styleUrl: './docs.page.scss',
})
export default class DocsPage {}
