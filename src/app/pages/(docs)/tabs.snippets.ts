export const BASIC_SNIPPET = `tab = signal<string | null>('account');

<div qzTabs [(value)]="tab">
  <div qzTabList>
    <button qzTab="account">Account</button>
    <button qzTab="security">Security</button>
  </div>
  <section qzTabPanel="account">Account panel</section>
  <section qzTabPanel="security">Security panel</section>
</div>`;

export const MANUAL_SNIPPET = `<div qzTabs [(value)]="tab" activationMode="manual" orientation="vertical">
  <div qzTabList>
    <button qzTab="preview">Preview</button>
    <button qzTab="settings">Settings</button>
  </div>
  <section qzTabPanel="preview">Preview panel</section>
  <section qzTabPanel="settings">Settings panel</section>
</div>`;
