import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class WebAgnosticStateService {
  readonly hPosition = signal(40);
  readonly vPosition = signal(55);
}
