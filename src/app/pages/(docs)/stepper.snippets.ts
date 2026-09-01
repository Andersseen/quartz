export const STEPPER_SNIPPET = `<div qzStepper [(value)]="step" linear>
  <button qzStep="account" [qzStepCompleted]="accountValid()" qzStepTrigger>
    Account
  </button>
  <button qzStep="profile" qzStepTrigger>Profile</button>

  <section qzStepPanel="account">...</section>
  <section qzStepPanel="profile">...</section>

  <button qzStepperPrevious>Previous</button>
  <button qzStepperNext>Next</button>
</div>`;
