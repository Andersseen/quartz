import { Component, ChangeDetectionStrategy } from '@angular/core';
import { RouterLink } from '@angular/router';
import { VoltButton } from '@voltui/components';

@Component({
  selector: 'app-home-hero',
  imports: [RouterLink, VoltButton],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './hero.component.html',
  styleUrl: './hero.component.scss',
})
export class HomeHeroComponent {}
