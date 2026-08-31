export const BASIC_SNIPPET = `section = signal<string | null>(null);

<div qzAccordion [(value)]="section">
  <div qzAccordionItem="shipping">
    <button qzAccordionTrigger>Shipping</button>
    <div qzAccordionPanel>Shipping panel</div>
  </div>
</div>`;

export const MULTIPLE_SNIPPET = `<div qzAccordion type="multiple" [(value)]="sections">
  <div qzAccordionItem="one">
    <button qzAccordionTrigger>One</button>
    <div qzAccordionPanel>Panel one</div>
  </div>
</div>`;
