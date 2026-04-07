import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../components/header/header.component';

@Component({
  selector: 'app-home',
  imports: [RouterLink, HeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './home.page.html',
  styleUrl: './home.page.scss',
})
export default class HomePage {}
