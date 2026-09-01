export const BASIC_SNIPPET = `volume = signal(50);

<div qzSlider [(value)]="volume" [min]="0" [max]="100" [step]="1">
  <div qzSliderTrack>
    <div qzSliderRange></div>
    <button qzSliderThumb aria-label="Volume"></button>
  </div>
</div>`;
