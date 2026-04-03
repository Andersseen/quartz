export const HORIZONTAL_SNIPPET = `<div qzSplitterContainer
  orientation="horizontal"
  [minSize]="20"
  [maxSize]="80"
  [defaultPosition]="40"
  (positionChange)="onPositionChange($event)">

  <div qzSplitterPanel="true">Panel A</div>
  <div qzSplitterHandle></div>
  <div qzSplitterPanel="false">Panel B</div>

</div>`;

export const VERTICAL_SNIPPET = `<div qzSplitterContainer
  orientation="vertical"
  [minSize]="20"
  [maxSize]="80"
  [defaultPosition]="55">

  <div qzSplitterPanel="true">Top Panel</div>
  <div qzSplitterHandle></div>
  <div qzSplitterPanel="false">Bottom Panel</div>

</div>`;
