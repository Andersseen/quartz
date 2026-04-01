import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export type SplitterOrientation = 'horizontal' | 'vertical';

@Injectable()
export class SplitterGroupService {
  private _position = 50;
  private _orientation: SplitterOrientation = 'horizontal';
  private _isDragging = false;
  
  position$ = new Subject<number>();
  orientation$ = new Subject<SplitterOrientation>();
  dragging$ = new Subject<boolean>();
  
  get position(): number {
    return this._position;
  }
  
  set position(value: number) {
    this._position = Math.max(0, Math.min(100, value));
    this.position$.next(this._position);
  }
  
  get orientation(): SplitterOrientation {
    return this._orientation;
  }
  
  set orientation(value: SplitterOrientation) {
    this._orientation = value;
    this.orientation$.next(value);
  }
  
  get isDragging(): boolean {
    return this._isDragging;
  }
  
  set isDragging(value: boolean) {
    this._isDragging = value;
    this.dragging$.next(value);
  }
}
