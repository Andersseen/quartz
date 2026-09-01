export const BASIC_SIDEBAR_SNIPPET = `<div qzSidebar [(open)]="open" [(collapsed)]="collapsed">
  <aside qzSidebarPanel>
    <button qzSidebarTrigger>Toggle</button>
    <nav>...</nav>
  </aside>

  <main qzSidebarContent>...</main>
</div>`;

export const RESPONSIVE_SIDEBAR_SNIPPET = `<div
  qzSidebar
  desktopMode="push"
  mobileMode="overlay"
  breakpoint="md"
  side="inline-start">
  <aside qzSidebarPanel>...</aside>
  <main qzSidebarContent>...</main>
</div>`;
