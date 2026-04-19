import { Component, ChangeDetectionStrategy, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-components-redirect',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: '',
})
export default class ComponentsRedirectPage implements OnInit {
  private readonly router = inject(Router);

  ngOnInit(): void {
    void this.router.navigate(['/overlay']);
  }
}
