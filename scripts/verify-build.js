#!/usr/bin/env node
'use strict';

/**
 * Build/package smoke test.
 *
 * Verifies that the library build produced publishable `packages/core/dist/` and
 * `packages/primitives/dist/` directories with the required package files and the
 * expected public API exports. Also checks that primitives correctly declares
 * @quartz-headless/core as a peer dependency, and does NOT inline it (verifying the
 * ng-packagr secondary-entry-point crash workaround — see docs/ai/ARCHITECTURE.md — stays
 * in effect: primitives must resolve core via a real package import, not bundle it).
 *
 * Run after `pnpm build:lib`.
 */

const fs = require('fs');
const path = require('path');

const PACKAGES = {
  core: {
    dir: path.resolve(__dirname, '../packages/core/dist'),
    npmName: '@quartz-headless/core',
    flatModuleName: 'quartz-headless-core',
    expectedExports: [
      'OverlayTriggerDirective',
      'OverlayService',
      'OverlayRef',
      'calculatePosition',
      'SplitterContainerDirective',
      'SplitterHandleDirective',
      'SplitterPanelDirective',
      'SplitterService',
      'DraggableDirective',
      'DropZoneDirective',
      'DragDropService',
      'VirtualScrollDirective',
      'ViewportService',
      'ViewportMatchDirective',
      'CollectionStore',
      'createFocusTrap',
      'createDismissController',
      'createScrollLock',
    ],
  },
  primitives: {
    dir: path.resolve(__dirname, '../packages/primitives/dist'),
    npmName: '@quartz-headless/primitives',
    flatModuleName: 'quartz-headless-primitives',
    expectedExports: [
      'DialogService',
      'DialogRef',
      'ToastService',
      'ToastComponent',
      'ToastContainerComponent',
      'TooltipDirective',
      'TooltipService',
      'TreeComponent',
      'TreeNodeComponent',
      'TreeService',
      'ListboxDirective',
      'ListboxOptionDirective',
      'ListboxService',
      'MenuDirective',
      'MenuTriggerDirective',
      'MenuItemDirective',
      'MenuCheckboxItemDirective',
      'MenuRadioGroupDirective',
      'MenuRadioItemDirective',
      'PopoverDirective',
      'PopoverTriggerDirective',
      'ComboboxDirective',
      'ComboboxInputDirective',
      'ComboboxContentDirective',
      'ComboboxListboxDirective',
      'ComboboxOptionDirective',
      'ComboboxTriggerDirective',
      'SelectDirective',
      'SelectTriggerDirective',
      'SelectContentDirective',
      'SelectListboxDirective',
      'SelectOptionDirective',
      'TabsDirective',
      'TabListDirective',
      'TabDirective',
      'TabPanelDirective',
      'AccordionDirective',
      'AccordionItemDirective',
      'AccordionTriggerDirective',
      'AccordionPanelDirective',
      'SidebarDirective',
      'SidebarPanelDirective',
      'SidebarContentDirective',
      'SidebarTriggerDirective',
      'NavbarDirective',
      'NavbarTriggerDirective',
      'NavbarMenuDirective',
      'StepperDirective',
      'StepDirective',
      'StepTriggerDirective',
      'StepPanelDirective',
      'StepperNextDirective',
      'StepperPreviousDirective',
      'SwitchDirective',
      'CheckboxDirective',
      'RadioGroupDirective',
      'RadioDirective',
      'ToggleDirective',
      'ToggleGroupDirective',
      'ToggleItemDirective',
      'SliderDirective',
      'SliderThumbDirective',
      'SliderTrackDirective',
      'SliderRangeDirective',
    ],
  },
};

function checkFile(distDir, relPath) {
  const fullPath = path.join(distDir, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required build file: ${relPath}`);
  }
}

function checkExports(distDir, flatModuleName, expectedExports) {
  const dts = fs.readFileSync(path.join(distDir, `types/${flatModuleName}.d.ts`), 'utf8');
  const missing = expectedExports.filter((name) => !dts.includes(name));
  if (missing.length) {
    throw new Error(
      `${flatModuleName}: built types missing expected exports: ${missing.join(', ')}`,
    );
  }
}

function checkPackageMetadata(distDir, npmName) {
  const pkg = JSON.parse(fs.readFileSync(path.join(distDir, 'package.json'), 'utf8'));

  if (pkg.name !== npmName) {
    throw new Error(`Unexpected package name: ${pkg.name} (expected ${npmName})`);
  }
  if (pkg.sideEffects !== false) {
    throw new Error(`${npmName}: package should have sideEffects: false`);
  }
  if (!pkg.peerDependencies || !pkg.peerDependencies['@angular/core']) {
    throw new Error(`${npmName}: package missing @angular/core peer dependency`);
  }
  return pkg;
}

function checkPrimitivesDependsOnCoreAsPackage(distDir, flatModuleName) {
  const pkg = JSON.parse(fs.readFileSync(path.join(distDir, 'package.json'), 'utf8'));
  if (!pkg.peerDependencies || !pkg.peerDependencies['@quartz-headless/core']) {
    throw new Error(
      '@quartz-headless/primitives must declare @quartz-headless/core as a peer dependency',
    );
  }

  const bundle = fs.readFileSync(path.join(distDir, `fesm2022/${flatModuleName}.mjs`), 'utf8');
  if (!bundle.includes("from '@quartz-headless/core'")) {
    throw new Error(
      '@quartz-headless/primitives bundle does not import from @quartz-headless/core as an ' +
        'external package — Core may have been inlined, which would defeat the point of the split.',
    );
  }
}

function verifyPackage(name, { dir, npmName, flatModuleName, expectedExports }) {
  if (!fs.existsSync(dir)) {
    throw new Error(`Build output directory does not exist: ${dir}\nRun pnpm build:lib first.`);
  }

  for (const relPath of [
    'package.json',
    'README.md',
    'LICENSE',
    `fesm2022/${flatModuleName}.mjs`,
    `types/${flatModuleName}.d.ts`,
  ]) {
    checkFile(dir, relPath);
  }

  checkExports(dir, flatModuleName, expectedExports);
  checkPackageMetadata(dir, npmName);

  if (name === 'primitives') {
    checkPrimitivesDependsOnCoreAsPackage(dir, flatModuleName);
  }
}

function main() {
  for (const [name, config] of Object.entries(PACKAGES)) {
    verifyPackage(name, config);
  }
  console.log(
    '✓ Build verification passed for @quartz-headless/core and @quartz-headless/primitives',
  );
}

main();
