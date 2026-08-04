#!/usr/bin/env node
'use strict';

/**
 * Build/package smoke test.
 *
 * Verifies that the library build produced a publishable `dist/quartz/` directory
 * with the required package files and the expected public API re-exports.
 *
 * Run after `pnpm build:lib`.
 */

const fs = require('fs');
const path = require('path');

const DIST_DIR = path.resolve(__dirname, '../dist/quartz');
const PUBLIC_API = path.resolve(__dirname, '../packages/quartz/src/public-api.ts');

const REQUIRED_FILES = [
  'package.json',
  'README.md',
  'LICENSE',
  'fesm2022/quartz-headless.mjs',
  'types/quartz-headless.d.ts',
];

const EXPECTED_EXPORTS = [
  'OverlayTriggerDirective',
  'OverlayService',
  'OverlayRef',
  'DialogService',
  'DialogRef',
  'SplitterContainerDirective',
  'SplitterHandleDirective',
  'SplitterPanelDirective',
  'SplitterService',
  'ToastService',
  'ToastComponent',
  'ToastContainerComponent',
  'DraggableDirective',
  'DropZoneDirective',
  'DragDropService',
  'TooltipDirective',
  'TooltipService',
  'TreeComponent',
  'TreeNodeComponent',
  'TreeService',
  'VirtualScrollDirective',
  'ViewportService',
  'ViewportMatchDirective',
];

function checkFile(relPath) {
  const fullPath = path.join(DIST_DIR, relPath);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Missing required build file: ${relPath}`);
  }
}

function checkPublicApiExports() {
  const api = fs.readFileSync(PUBLIC_API, 'utf8');
  const missing = EXPECTED_EXPORTS.filter((name) => !api.includes(name));
  if (missing.length) {
    throw new Error(`public-api.ts missing expected exports: ${missing.join(', ')}`);
  }
}

function checkPackageMetadata() {
  const pkgPath = path.join(DIST_DIR, 'package.json');
  const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));

  if (pkg.name !== 'quartz-headless') {
    throw new Error(`Unexpected package name: ${pkg.name}`);
  }

  if (!pkg.sideEffects === false) {
    throw new Error('Package should have sideEffects: false');
  }

  if (!pkg.peerDependencies || !pkg.peerDependencies['@angular/core']) {
    throw new Error('Package missing @angular/core peer dependency');
  }
}

function main() {
  if (!fs.existsSync(DIST_DIR)) {
    throw new Error(`Build output directory does not exist: ${DIST_DIR}\nRun pnpm build:lib first.`);
  }

  for (const file of REQUIRED_FILES) {
    checkFile(file);
  }

  checkPublicApiExports();
  checkPackageMetadata();

  console.log('✓ Build verification passed');
}

main();
