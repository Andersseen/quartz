import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../components/header/header.component';
import {
  VoltButton,
  VoltCard,
  VoltCardHeader,
  VoltCardTitle,
  VoltCardDescription,
  VoltCardContent,
  VoltCardFooter,
} from '@voltui/components';

@Component({
  selector: 'app-docs',
  imports: [
    RouterLink,
    HeaderComponent,
    VoltButton,
    VoltCard,
    VoltCardHeader,
    VoltCardTitle,
    VoltCardDescription,
    VoltCardContent,
    VoltCardFooter,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './docs.page.html',
})
export default class DocsPage {}
