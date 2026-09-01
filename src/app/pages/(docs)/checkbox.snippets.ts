export const BASIC_SNIPPET = `accepted = signal(false);

<button qzCheckbox [(checked)]="accepted">
  Accept terms
</button>`;

export const INDETERMINATE_SNIPPET = `state = signal<boolean | 'indeterminate'>('indeterminate');

<button qzCheckbox [(checked)]="state">
  Select all
</button>`;
