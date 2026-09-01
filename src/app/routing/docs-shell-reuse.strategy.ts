import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, DetachedRouteHandle, RouteReuseStrategy } from '@angular/router';

const DOCS_SHELL_PATHS = new Set([
  'directionality',
  'overlay',
  'splitter',
  'drag-drop',
  'virtual-scroll',
  'viewport',
  'scroll-lock',
  'dialog',
  'tooltip',
  'toast',
  'tree',
  'listbox',
  'menu',
  'popover',
  'combobox',
  'select',
  'tabs',
  'accordion',
  'sidebar',
  'navbar',
  'stepper',
  'switch',
  'checkbox',
  'radio-group',
  'toggle',
  'toggle-group',
  'slider',
]);

@Injectable()
export class DocsShellReuseStrategy implements RouteReuseStrategy {
  shouldDetach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  store(_route: ActivatedRouteSnapshot, _handle: DetachedRouteHandle | null): void {
    return;
  }

  shouldAttach(_route: ActivatedRouteSnapshot): boolean {
    return false;
  }

  retrieve(_route: ActivatedRouteSnapshot): DetachedRouteHandle | null {
    return null;
  }

  shouldReuseRoute(future: ActivatedRouteSnapshot, curr: ActivatedRouteSnapshot): boolean {
    if (future.routeConfig === curr.routeConfig) {
      return true;
    }

    return this.isDocsShell(future) && this.isDocsShell(curr);
  }

  private isDocsShell(route: ActivatedRouteSnapshot): boolean {
    const path = route.routeConfig?.path ?? route.url[0]?.path;

    return (
      path !== undefined &&
      DOCS_SHELL_PATHS.has(path) &&
      route.routeConfig?.data?.['shell'] === 'docs'
    );
  }
}
